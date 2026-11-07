import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma, SaleStatus } from '../../generated/prisma/client';
import {
  actorFromJwt,
  requireTenantId,
} from '../../common/scoping/tenant-scope.util';
import { isPlatformAdmin } from '../../common/permissions/role-policy.util';
import {
  dateRangeBoundsInTimeZone,
  dayBoundsInTimeZone,
  formatDateYmdInTimeZone,
  formatHourInTimeZone,
  normalizeTimeZone,
} from '../../common/utils/timezone.util';
import { expectedCashBySession } from '../cash-registers/cash-session.util';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { PrismaService } from '../../prisma/prisma.service';
import { DOC_LABELS, LEAD_LABELS, PAYMENT_LABELS } from './dashboard.labels';

/** Ventas que cuentan como ingreso (las anuladas se reportan aparte). */
const VALID_SALE: SaleStatus[] = ['COMPLETADA', 'PARCIALMENTE_DEVUELTA'];
const OPEN_DEBT = ['PENDIENTE', 'PARCIAL', 'VENCIDA'] as const;
const ZERO = () => new Prisma.Decimal(0);
const money = (d: Prisma.Decimal | null | undefined) => (d ?? ZERO()).toFixed(2);
const DAY_MS = 24 * 60 * 60 * 1000;

export type Breakdown = { key: string; label: string; total: string; count: number };

/**
 * Resúmenes densos para los dashboards (cliente y plataforma).
 * Todo se calcula en la zona horaria del establecimiento del usuario.
 */
@Injectable()
export class DashboardOverviewService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resumen del periodo: los últimos `days` días hasta hoy o, si llegan `from`/`to` (YYYY-MM-DD),
   * ese día o rango en la zona horaria de la sede. Se compara con el periodo anterior de igual duración.
   */
  async getTenantOverview(
    actor: JwtRequestUser,
    daysInput?: number,
    fromInput?: string,
    toInput?: string,
    userId?: string,
  ) {
    const scope = actorFromJwt(actor);
    if (isPlatformAdmin(scope.role)) {
      throw new ForbiddenException('Use la consola de plataforma (/platform/dashboard)');
    }
    const tenantId = requireTenantId(scope);
    const timeZone = await this.actorTimeZone(actor);
    const now = new Date();
    const today = dayBoundsInTimeZone(now, timeZone);
    const yesterdayStart = new Date(today.start.getTime() - DAY_MS);
    const custom = resolveCustomRange(fromInput, toInput, timeZone, formatDateYmdInTimeZone(now, timeZone));
    const days = custom ? custom.days : clampDays(daysInput);
    const periodStart = custom ? custom.start : new Date(today.start.getTime() - (days - 1) * DAY_MS);
    const periodEnd = custom ? custom.end : today.end;
    const prevStart = new Date(periodStart.getTime() - days * DAY_MS);
    // Con usuario: sus ventas como vendedor y los egresos de las cajas que abrió.
    const users = await this.prisma.user.findMany({
      where: { tenantId, deletedAt: null },
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    });
    const user = userId ? users.find((u) => u.id === userId) : undefined;
    if (userId && !user) throw new BadRequestException('El usuario elegido no pertenece a tu empresa.');
    const saleScope: Prisma.SaleWhereInput = {
      deletedAt: null,
      establishment: { tenantId },
      ...(userId ? { sellerId: userId } : {}),
    };
    const expensesQuery = this.prisma.cashMovement.aggregate({
      where: {
        tipo: 'EGRESO',
        createdAt: { gte: periodStart, lt: periodEnd },
        cashSession: { cashRegister: { establishment: { tenantId } }, ...(userId ? { userId } : {}) },
      },
      _sum: { monto: true },
      _count: true,
    });
    // Independientes de las ventas: se lanzan ya para no sumar latencia.
    const sidePanels = Promise.all([
      this.openCash(tenantId),
      this.inventorySummary(tenantId, now),
      this.financeSummary(tenantId, now),
    ]);

    const [periodSales, prevAgg, todayAgg, yesterdayAgg, voided, paymentRows, itemRows, newCustomers] =
      await Promise.all([
        this.prisma.sale.findMany({
          where: { ...saleScope, estado: { in: VALID_SALE }, createdAt: { gte: periodStart, lt: periodEnd } },
          select: { id: true, total: true, createdAt: true, documentType: true, sellerId: true },
        }),
        this.sumSales({ ...saleScope, estado: { in: VALID_SALE }, createdAt: { gte: prevStart, lt: periodStart } }),
        this.sumSales({ ...saleScope, estado: { in: VALID_SALE }, createdAt: { gte: today.start, lt: today.end } }),
        this.sumSales({ ...saleScope, estado: { in: VALID_SALE }, createdAt: { gte: yesterdayStart, lt: today.start } }),
        this.sumSales({ ...saleScope, estado: 'ANULADA', createdAt: { gte: periodStart, lt: periodEnd } }),
        this.prisma.payment.groupBy({
          by: ['metodo'],
          where: { sale: { ...saleScope, estado: { in: VALID_SALE }, createdAt: { gte: periodStart, lt: periodEnd } } },
          _sum: { monto: true },
          _count: true,
        }),
        this.prisma.saleItem.findMany({
          where: { sale: { ...saleScope, estado: { in: VALID_SALE }, createdAt: { gte: periodStart, lt: periodEnd } } },
          select: {
            productId: true,
            cantidad: true,
            precioUnitario: true,
            totalLinea: true,
            product: { select: { nombre: true, costoUnitario: true, precioUnitarioCompra: true } },
          },
        }),
        this.prisma.customer.count({ where: { tenantId, deletedAt: null, createdAt: { gte: periodStart, lt: periodEnd } } }),
      ]);

    // Medios de pago, comprobantes, horas y vendedores.
    const payments: Breakdown[] = paymentRows
      .map((r) => ({ key: r.metodo, label: PAYMENT_LABELS[r.metodo] ?? r.metodo, total: money(r._sum.monto), count: r._count }))
      .sort((a, b) => Number(b.total) - Number(a.total));

    const byDoc = new Map<string, { total: Prisma.Decimal; count: number }>();
    const byHour = Array.from({ length: 24 }, () => ({ total: ZERO(), count: 0 }));
    const bySeller = new Map<string, { total: Prisma.Decimal; count: number }>();
    const byDay = new Map<string, { total: Prisma.Decimal; count: number }>();
    for (let i = 0; i < days; i++) {
      byDay.set(formatDateYmdInTimeZone(new Date(periodStart.getTime() + i * DAY_MS + 12 * 3600e3), timeZone), { total: ZERO(), count: 0 });
    }
    let periodTotal = ZERO();
    for (const s of periodSales) {
      periodTotal = periodTotal.plus(s.total);
      bump(byDoc, s.documentType, s.total);
      bump(bySeller, s.sellerId, s.total);
      const day = byDay.get(formatDateYmdInTimeZone(s.createdAt, timeZone));
      if (day) {
        day.total = day.total.plus(s.total);
        day.count++;
      }
      const h = byHour[Number(formatHourInTimeZone(s.createdAt, timeZone))];
      h.total = h.total.plus(s.total);
      h.count++;
    }
    const sellerNames = new Map(
      (await this.prisma.user.findMany({ where: { id: { in: [...bySeller.keys()] } }, select: { id: true, nombre: true } })).map((u) => [u.id, u.nombre]),
    );

    // Top productos y costo de lo vendido (costo unitario actual del producto o su precio de compra).
    // Costo mayor al precio cobrado: casi siempre es el precio del paquete en un producto que se vende
    // por unidad. Se avisa para que lo corrijan; no se ajusta solo.
    const byProduct = new Map<string, { nombre: string; total: Prisma.Decimal; cantidad: Prisma.Decimal }>();
    const suspects = new Map<string, { nombre: string; costo: Prisma.Decimal; precio: Prisma.Decimal; cantidad: Prisma.Decimal; exceso: Prisma.Decimal }>();
    let costed = ZERO();
    let cost = ZERO();
    for (const it of itemRows) {
      const row = byProduct.get(it.productId) ?? { nombre: it.product.nombre, total: ZERO(), cantidad: ZERO() };
      row.total = row.total.plus(it.totalLinea);
      row.cantidad = row.cantidad.plus(it.cantidad);
      byProduct.set(it.productId, row);
      const unitCost = it.product.costoUnitario ?? it.product.precioUnitarioCompra;
      if (unitCost && unitCost.greaterThan(0)) {
        costed = costed.plus(it.totalLinea);
        cost = cost.plus(unitCost.times(it.cantidad));
        if (unitCost.greaterThan(it.precioUnitario)) {
          const bad = suspects.get(it.productId) ?? { nombre: it.product.nombre, costo: unitCost, precio: it.precioUnitario, cantidad: ZERO(), exceso: ZERO() };
          bad.cantidad = bad.cantidad.plus(it.cantidad);
          bad.exceso = bad.exceso.plus(unitCost.times(it.cantidad).minus(it.totalLinea));
          suspects.set(it.productId, bad);
        }
      }
    }
    const itemsTotal = itemRows.reduce((a, it) => a.plus(it.totalLinea), ZERO());

    const [[cash, inventory, finance], expensesAgg] = await Promise.all([sidePanels, expensesQuery]);
    const expenses = expensesAgg._sum.monto ?? ZERO();

    return {
      days,
      from: formatDateYmdInTimeZone(periodStart, timeZone),
      to: formatDateYmdInTimeZone(new Date(periodEnd.getTime() - 1), timeZone),
      custom: !!custom,
      userId: user?.id ?? null,
      userName: user?.nombre ?? null,
      users,
      timeZone,
      today: {
        total: money(todayAgg.total),
        count: todayAgg.count,
        avgTicket: avg(todayAgg.total, todayAgg.count),
        yesterdayTotal: money(yesterdayAgg.total),
        yesterdayCount: yesterdayAgg.count,
      },
      period: {
        total: money(periodTotal),
        count: periodSales.length,
        avgTicket: avg(periodTotal, periodSales.length),
        prevTotal: money(prevAgg.total),
        prevCount: prevAgg.count,
        voidedTotal: money(voided.total),
        voidedCount: voided.count,
        unitsSold: itemRows.reduce((a, it) => a.plus(it.cantidad), ZERO()).toFixed(0),
        newCustomers,
        grossMargin: money(costed.minus(cost)),
        grossMarginPct: costed.greaterThan(0) ? costed.minus(cost).div(costed).times(100).toFixed(1) : null,
        marginCoveragePct: itemsTotal.greaterThan(0) ? costed.div(itemsTotal).times(100).toFixed(0) : null,
        // Resumen financiero: ganancia = ventas − costo; neto = ganancia − egresos de caja.
        cost: money(cost),
        profit: money(periodTotal.minus(cost)),
        expenses: money(expenses),
        expensesCount: expensesAgg._count,
        net: money(periodTotal.minus(cost).minus(expenses)),
      },
      costAboveSalePrice: [...suspects]
        .map(([id, r]) => ({ id, nombre: r.nombre, costo: money(r.costo), precio: money(r.precio), cantidad: r.cantidad.toFixed(0), exceso: money(r.exceso) }))
        .sort((a, b) => Number(b.exceso) - Number(a.exceso)),
      trend: [...byDay].map(([date, r]) => ({ date, label: `${date.slice(8, 10)}/${date.slice(5, 7)}`, total: money(r.total), count: r.count })),
      payments,
      documents: [...byDoc]
        .map(([key, r]) => ({ key, label: DOC_LABELS[key] ?? key, total: money(r.total), count: r.count }))
        .sort((a, b) => Number(b.total) - Number(a.total)),
      hours: byHour.map((r, h) => ({ hour: h, total: money(r.total), count: r.count })),
      sellers: [...bySeller]
        .map(([key, r]) => ({ key, label: sellerNames.get(key) ?? 'Usuario', total: money(r.total), count: r.count }))
        .sort((a, b) => Number(b.total) - Number(a.total))
        .slice(0, 6),
      topProducts: [...byProduct]
        .map(([id, r]) => ({ id, nombre: r.nombre, total: money(r.total), cantidad: r.cantidad.toFixed(0) }))
        .sort((a, b) => Number(b.total) - Number(a.total))
        .slice(0, 8),
      cash,
      inventory,
      finance,
    };
  }

  async getPlatformOverview(actor: JwtRequestUser) {
    if (!isPlatformAdmin(actor.role)) throw new ForbiddenException('Solo operadores de plataforma');
    const timeZone = 'America/Lima';
    const today = dayBoundsInTimeZone(new Date(), timeZone);
    const days = 30;
    const since = new Date(today.start.getTime() - (days - 1) * DAY_MS);
    const valid: Prisma.SaleWhereInput = { deletedAt: null, estado: { in: VALID_SALE } };

    const [tenants, sales, paymentRows, todayAgg, leads, plans] = await Promise.all([
      this.prisma.tenant.findMany({
        where: { deletedAt: null },
        select: {
          id: true, nombre: true, slug: true, plan: true, status: true, maxUsers: true, maxEstablishments: true,
          _count: { select: { users: { where: { deletedAt: null } }, establishments: { where: { deletedAt: null } }, products: { where: { deletedAt: null } }, customers: { where: { deletedAt: null } } } },
        },
      }),
      this.prisma.sale.findMany({
        where: { ...valid, createdAt: { gte: since, lt: today.end } },
        select: { total: true, createdAt: true, establishment: { select: { tenantId: true } } },
      }),
      this.prisma.payment.groupBy({
        by: ['metodo'],
        where: { sale: { ...valid, createdAt: { gte: since, lt: today.end } } },
        _sum: { monto: true },
        _count: true,
      }),
      this.sumSales({ ...valid, createdAt: { gte: today.start, lt: today.end } }),
      this.prisma.tenantLead.groupBy({ by: ['status'], _count: true }),
      this.prisma.tenant.groupBy({ by: ['plan'], where: { deletedAt: null }, _count: true }),
    ]);

    const byDay = new Map<string, { total: Prisma.Decimal; count: number }>();
    for (let i = 0; i < days; i++) {
      byDay.set(formatDateYmdInTimeZone(new Date(since.getTime() + i * DAY_MS + 12 * 3600e3), timeZone), { total: ZERO(), count: 0 });
    }
    const byTenant = new Map<string, { total: Prisma.Decimal; count: number; last: Date | null }>();
    let gmv = ZERO();
    for (const s of sales) {
      gmv = gmv.plus(s.total);
      const d = byDay.get(formatDateYmdInTimeZone(s.createdAt, timeZone));
      if (d) {
        d.total = d.total.plus(s.total);
        d.count++;
      }
      const t = byTenant.get(s.establishment.tenantId) ?? { total: ZERO(), count: 0, last: null };
      t.total = t.total.plus(s.total);
      t.count++;
      if (!t.last || s.createdAt > t.last) t.last = s.createdAt;
      byTenant.set(s.establishment.tenantId, t);
    }
    const lastSales = await this.prisma.sale.groupBy({
      by: ['establishmentId'],
      where: { deletedAt: null },
      _max: { createdAt: true },
    });
    const estTenant = new Map(
      (await this.prisma.establishment.findMany({ select: { id: true, tenantId: true } })).map((e) => [e.id, e.tenantId]),
    );
    const lastByTenant = new Map<string, Date>();
    for (const r of lastSales) {
      const tid = estTenant.get(r.establishmentId);
      const at = r._max.createdAt;
      if (tid && at && (!lastByTenant.get(tid) || at > lastByTenant.get(tid)!)) lastByTenant.set(tid, at);
    }

    return {
      sales: {
        todayTotal: money(todayAgg.total),
        todayCount: todayAgg.count,
        total30d: money(gmv),
        count30d: sales.length,
        avgTicket30d: avg(gmv, sales.length),
        activeTenants30d: byTenant.size,
      },
      trend: [...byDay].map(([date, r]) => ({ date, label: `${date.slice(8, 10)}/${date.slice(5, 7)}`, total: money(r.total), count: r.count })),
      payments: paymentRows
        .map((r) => ({ key: r.metodo, label: PAYMENT_LABELS[r.metodo] ?? r.metodo, total: money(r._sum.monto), count: r._count }))
        .sort((a, b) => Number(b.total) - Number(a.total)),
      plans: plans.map((p) => ({ key: p.plan, label: p.plan, total: '0', count: p._count })),
      leads: leads.map((l) => ({ key: l.status, label: LEAD_LABELS[l.status] ?? l.status, total: '0', count: l._count })),
      tenantActivity: tenants
        .map((t) => {
          const a = byTenant.get(t.id);
          return {
            id: t.id,
            nombre: t.nombre,
            slug: t.slug,
            plan: t.plan,
            status: t.status,
            users: t._count.users,
            maxUsers: t.maxUsers,
            establishments: t._count.establishments,
            maxEstablishments: t.maxEstablishments,
            products: t._count.products,
            customers: t._count.customers,
            sales30d: a?.count ?? 0,
            total30d: money(a?.total),
            lastSaleAt: lastByTenant.get(t.id)?.toISOString() ?? null,
          };
        })
        .sort((a, b) => Number(b.total30d) - Number(a.total30d)),
    };
  }

  private async sumSales(where: Prisma.SaleWhereInput) {
    const r = await this.prisma.sale.aggregate({ where, _sum: { total: true }, _count: true });
    return { total: r._sum.total ?? ZERO(), count: r._count };
  }

  private async openCash(tenantId: string) {
    const sessions = await this.prisma.cashSession.findMany({
      where: { estado: 'ABIERTA', cashRegister: { establishment: { tenantId } } },
      select: { id: true, openedAt: true, cashRegister: { select: { nombre: true } }, user: { select: { nombre: true } } },
      orderBy: { openedAt: 'asc' },
    });
    const expected = await expectedCashBySession(this.prisma, sessions.map((s) => s.id));
    const rows = sessions.map((s) => ({
      id: s.id,
      caja: s.cashRegister.nombre,
      usuario: s.user.nombre,
      openedAt: s.openedAt.toISOString(),
      efectivoEsperado: money(expected.get(s.id)),
    }));
    return {
      open: rows.length,
      expectedCash: money(rows.reduce((a, r) => a.plus(r.efectivoEsperado), ZERO())),
      sessions: rows,
    };
  }

  private async inventorySummary(tenantId: string, now: Date) {
    const in30 = new Date(now.getTime() + 30 * DAY_MS);
    const lotWhere = { deletedAt: null, stock: { gt: 0 }, product: { tenantId }, warehouse: { establishment: { tenantId } } };
    const [stocks, expired, expiring30] = await Promise.all([
      this.prisma.productWarehouseStock.findMany({
        where: { product: { tenantId, deletedAt: null, habilitado: true }, warehouse: { deletedAt: null, establishment: { tenantId } } },
        select: { cantidad: true, product: { select: { stockMinimo: true, costoUnitario: true, precioUnitarioCompra: true, precioUnitarioVenta: true } } },
      }),
      this.prisma.productLotStock.count({ where: { ...lotWhere, fechaVencimiento: { lt: now } } }),
      this.prisma.productLotStock.count({ where: { ...lotWhere, fechaVencimiento: { gte: now, lte: in30 } } }),
    ]);
    let costValue = ZERO();
    let saleValue = ZERO();
    let units = ZERO();
    let low = 0;
    let out = 0;
    for (const s of stocks) {
      units = units.plus(s.cantidad);
      if (s.cantidad.lte(0)) out++;
      else if (s.cantidad.lessThan(s.product.stockMinimo)) low++;
      const c = s.product.costoUnitario ?? s.product.precioUnitarioCompra;
      if (c && s.cantidad.gt(0)) costValue = costValue.plus(c.times(s.cantidad));
      if (s.cantidad.gt(0)) saleValue = saleValue.plus(s.product.precioUnitarioVenta.times(s.cantidad));
    }
    return {
      units: units.toFixed(0),
      costValue: money(costValue),
      saleValue: money(saleValue),
      lowStock: low,
      outOfStock: out,
      expiredLots: expired,
      expiringLots30: expiring30,
    };
  }

  private async financeSummary(tenantId: string, now: Date) {
    const est = { establishment: { tenantId } };
    const [cxc, cxcOverdue, cxp, cxpOverdue] = await Promise.all([
      this.prisma.accountReceivable.aggregate({ where: { ...est, deletedAt: null, estado: { in: [...OPEN_DEBT] } }, _sum: { saldo: true }, _count: true }),
      this.prisma.accountReceivable.count({ where: { ...est, deletedAt: null, estado: { in: [...OPEN_DEBT] }, fechaVencimiento: { lt: now } } }),
      this.prisma.accountPayable.aggregate({ where: { ...est, deletedAt: null, estado: { in: [...OPEN_DEBT] } }, _sum: { saldo: true }, _count: true }),
      this.prisma.accountPayable.count({ where: { ...est, deletedAt: null, estado: { in: [...OPEN_DEBT] }, fechaVencimiento: { lt: now } } }),
    ]);
    return {
      receivable: money(cxc._sum.saldo), receivableCount: cxc._count, receivableOverdue: cxcOverdue,
      payable: money(cxp._sum.saldo), payableCount: cxp._count, payableOverdue: cxpOverdue,
    };
  }

  private async actorTimeZone(actor: JwtRequestUser): Promise<string> {
    const row = await this.prisma.establishment.findFirst({
      where: { id: actor.establecimientoId, deletedAt: null },
      select: { timeZone: true },
    });
    return normalizeTimeZone(row?.timeZone);
  }
}


const MAX_RANGE_DAYS = 366;
const YMD = /^\d{4}-\d{2}-\d{2}$/;

/** Día o rango elegido por el usuario; null si no se pidió. Un solo día: `from` sin `to`, o ambos iguales. */
function resolveCustomRange(from: string | undefined, to: string | undefined, timeZone: string, todayYmd: string) {
  const fromYmd = from?.trim();
  const toYmd = to?.trim() || fromYmd;
  if (!fromYmd) {
    if (to?.trim()) throw new BadRequestException('Indica la fecha «Desde».');
    return null;
  }
  if (!YMD.test(fromYmd) || !YMD.test(toYmd!) || Number.isNaN(Date.parse(fromYmd)) || Number.isNaN(Date.parse(toYmd!))) {
    throw new BadRequestException('Las fechas deben tener el formato AAAA-MM-DD.');
  }
  if (fromYmd > toYmd!) throw new BadRequestException('La fecha «Desde» no puede ser posterior a «Hasta».');
  if (fromYmd > todayYmd || toYmd! > todayYmd) {
    throw new BadRequestException('No hay ventas en fechas futuras: elige un día hasta hoy.');
  }
  const { start, end } = dateRangeBoundsInTimeZone(fromYmd, toYmd!, timeZone);
  const days = Math.round((end.getTime() - start.getTime()) / DAY_MS);
  if (days > MAX_RANGE_DAYS) {
    throw new BadRequestException(`El rango puede ser de hasta ${MAX_RANGE_DAYS} días.`);
  }
  return { start, end, days };
}

function clampDays(value?: number): number {
  const n = Number(value);
  return [1, 7, 30, 90].includes(n) ? n : 7;
}

function avg(total: Prisma.Decimal, count: number): string {
  return count ? total.div(count).toFixed(2) : '0.00';
}

function bump(map: Map<string, { total: Prisma.Decimal; count: number }>, key: string, total: Prisma.Decimal) {
  const r = map.get(key) ?? { total: ZERO(), count: 0 };
  r.total = r.total.plus(total);
  r.count++;
  map.set(key, r);
}
