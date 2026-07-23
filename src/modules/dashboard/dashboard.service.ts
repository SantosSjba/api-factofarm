import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { actorFromJwt, requireTenantId } from '../../common/scoping/tenant-scope.util';
import { EstablishmentScopeService } from '../../common/scoping/establishment-scope.service';
import { isPlatformAdmin } from '../../common/permissions/role-policy.util';
import {
  dayBoundsInTimeZone,
  formatDateYmdInTimeZone,
  normalizeTimeZone,
} from '../../common/utils/timezone.util';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { PrismaService } from '../../prisma/prisma.service';

export type SalesTrendPoint = {
  date: string;
  label: string;
  total: string;
  count: number;
};

export type SalesTrend = {
  periodDays: number;
  points: SalesTrendPoint[];
};

export type DashboardInventoryAlerts = {
  stockBajo: number;
  lotesVencidos: number;
  porVencer30: number;
  porVencer60: number;
  porVencer90: number;
  zonasFrioSinLogHoy: number;
};

export type DashboardStats = {
  usersActive: number;
  establishmentsActive: number;
  customersActive: number;
  productsActive: number;
  inventoryAlerts: DashboardInventoryAlerts;
};

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly establishmentScope: EstablishmentScopeService,
  ) {}

  private tenantIdForDashboard(actor: JwtRequestUser): string {
    const scope = actorFromJwt(actor);
    if (isPlatformAdmin(scope.role)) {
      throw new ForbiddenException('Use la consola de plataforma (/platform/dashboard)');
    }
    return requireTenantId(scope);
  }

  private async resolveActorTimeZone(actor: JwtRequestUser): Promise<string> {
    const row = await this.prisma.establishment.findFirst({
      where: { id: actor.establecimientoId, deletedAt: null },
      select: { timeZone: true },
    });
    return normalizeTimeZone(row?.timeZone);
  }

  async getStats(actor: JwtRequestUser): Promise<DashboardStats> {
    const tenantId = this.tenantIdForDashboard(actor);
    const now = new Date();
    const timeZone = await this.resolveActorTimeZone(actor);
    const { start: startOfDay } = dayBoundsInTimeZone(now, timeZone);
    const in30 = new Date(now);
    in30.setDate(in30.getDate() + 30);
    const in60 = new Date(now);
    in60.setDate(in60.getDate() + 60);
    const in90 = new Date(now);
    in90.setDate(in90.getDate() + 90);

    const [
      usersActive,
      establishmentsActive,
      customersActive,
      productsActive,
      stockRows,
      lotesVencidos,
      porVencer30,
      porVencer60,
      porVencer90,
      zonasFrioSinLogHoy,
    ] = await Promise.all([
      this.prisma.user.count({
        where: { tenantId, deletedAt: null, role: { not: 'SUPER_ADMIN' } },
      }),
      this.prisma.establishment.count({
        where: { tenantId, deletedAt: null, activo: true },
      }),
      this.prisma.customer.count({
        where: { tenantId, deletedAt: null, activo: true },
      }),
      this.prisma.product.count({
        where: { tenantId, deletedAt: null, habilitado: true },
      }),
      this.prisma.productWarehouseStock.findMany({
        where: {
          product: { tenantId, deletedAt: null, habilitado: true },
          warehouse: { deletedAt: null, establishment: { tenantId } },
        },
        select: { cantidad: true, product: { select: { stockMinimo: true } } },
      }),
      this.prisma.productLotStock.count({
        where: {
          deletedAt: null,
          stock: { gt: 0 },
          fechaVencimiento: { lt: now },
          product: { tenantId },
          warehouse: { establishment: { tenantId } },
        },
      }),
      this.prisma.productLotStock.count({
        where: {
          deletedAt: null,
          stock: { gt: 0 },
          fechaVencimiento: { gte: now, lte: in30 },
          product: { tenantId },
          warehouse: { establishment: { tenantId } },
        },
      }),
      this.prisma.productLotStock.count({
        where: {
          deletedAt: null,
          stock: { gt: 0 },
          fechaVencimiento: { gt: in30, lte: in60 },
          product: { tenantId },
          warehouse: { establishment: { tenantId } },
        },
      }),
      this.prisma.productLotStock.count({
        where: {
          deletedAt: null,
          stock: { gt: 0 },
          fechaVencimiento: { gt: in60, lte: in90 },
          product: { tenantId },
          warehouse: { establishment: { tenantId } },
        },
      }),
      this.prisma.warehouseZone.count({
        where: {
          deletedAt: null,
          activo: true,
          tipo: 'REFRIGERADO',
          warehouse: { establishment: { tenantId } },
          temperatureLogs: { none: { fecha: { gte: startOfDay } } },
        },
      }),
    ]);

    const stockBajo = stockRows.filter((row) =>
      row.cantidad.lessThan(row.product.stockMinimo),
    ).length;

    return {
      usersActive,
      establishmentsActive,
      customersActive,
      productsActive,
      inventoryAlerts: {
        stockBajo,
        lotesVencidos,
        porVencer30,
        porVencer60,
        porVencer90,
        zonasFrioSinLogHoy,
      },
    };
  }

  async getChainSummary(actor: JwtRequestUser) {
    const tenantId = this.tenantIdForDashboard(actor);
    const establishments = await this.prisma.establishment.findMany({
      where: { tenantId, deletedAt: null, activo: true },
      select: { id: true, nombre: true, codigo: true },
      orderBy: { nombre: 'asc' },
    });

    const since = new Date();
    since.setDate(since.getDate() - 30);

    const rows = await Promise.all(
      establishments.map(async (est) => {
        const [salesCount, salesTotal, stockValue] = await Promise.all([
          this.prisma.sale.count({
            where: {
              establishmentId: est.id,
              deletedAt: null,
              estado: 'COMPLETADA',
              createdAt: { gte: since },
            },
          }),
          this.prisma.sale.aggregate({
            where: {
              establishmentId: est.id,
              deletedAt: null,
              estado: 'COMPLETADA',
              createdAt: { gte: since },
            },
            _sum: { total: true },
          }),
          this.prisma.productWarehouseStock.aggregate({
            where: {
              product: { tenantId },
              warehouse: { establishmentId: est.id, deletedAt: null },
            },
            _sum: { cantidad: true },
          }),
        ]);
        return {
          establishmentId: est.id,
          nombre: est.nombre,
          codigo: est.codigo,
          ventas30d: salesCount,
          totalVentas30d: salesTotal._sum.total?.toString() ?? '0',
          unidadesStock: stockValue._sum.cantidad?.toString() ?? '0',
        };
      }),
    );

    return { periodDays: 30, establishments: rows };
  }

  async getSalesTrend(actor: JwtRequestUser, periodDays = 14): Promise<SalesTrend> {
    const tenantId = this.tenantIdForDashboard(actor);
    const timeZone = await this.resolveActorTimeZone(actor);
    const { end: endExclusive, ymd: todayYmd } = dayBoundsInTimeZone(new Date(), timeZone);
    const [ty, tm, td] = todayYmd.split('-').map(Number);
    const firstDayUtc = new Date(Date.UTC(ty, tm - 1, td - (periodDays - 1)));
    const firstYmd = `${firstDayUtc.getUTCFullYear()}-${String(firstDayUtc.getUTCMonth() + 1).padStart(2, '0')}-${String(firstDayUtc.getUTCDate()).padStart(2, '0')}`;
    const { start } = dayBoundsInTimeZone(
      new Date(`${firstYmd}T12:00:00.000Z`),
      timeZone,
    );

    const sales = await this.prisma.sale.findMany({
      where: {
        deletedAt: null,
        estado: 'COMPLETADA',
        createdAt: { gte: start, lt: endExclusive },
        establishment: { tenantId },
      },
      select: { createdAt: true, total: true },
    });

    const buckets = new Map<string, { total: Prisma.Decimal; count: number }>();
    // Build calendar days by walking ymd strings in timezone
    let cursor = formatDateYmdInTimeZone(start, timeZone);
    for (let i = 0; i < periodDays; i++) {
      buckets.set(cursor, { total: new Prisma.Decimal(0), count: 0 });
      const [y, m, d] = cursor.split('-').map(Number);
      const next = new Date(Date.UTC(y, m - 1, d + 1));
      cursor = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-${String(next.getUTCDate()).padStart(2, '0')}`;
    }
    for (const sale of sales) {
      const key = formatDateYmdInTimeZone(sale.createdAt, timeZone);
      const bucket = buckets.get(key);
      if (!bucket) continue;
      bucket.total = bucket.total.plus(sale.total);
      bucket.count += 1;
    }

    const points = [...buckets.entries()].map(([date, row]) => ({
      date,
      label: `${date.slice(8, 10)}/${date.slice(5, 7)}`,
      total: row.total.toFixed(2),
      count: row.count,
    }));

    return { periodDays, points };
  }

  async getManagerDashboard(actor: JwtRequestUser) {
    const establishmentId = await this.establishmentScope.resolveScoped(actor);
    const timeZone = await this.resolveActorTimeZone(actor);
    const { start: startOfDay } = dayBoundsInTimeZone(new Date(), timeZone);
    const startOfWeek = new Date(startOfDay.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [salesToday, salesWeek, pendingVoids, openSessions, staffPresent] = await Promise.all([
      this.prisma.sale.aggregate({
        where: {
          establishmentId,
          deletedAt: null,
          estado: 'COMPLETADA',
          createdAt: { gte: startOfDay },
        },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.sale.aggregate({
        where: {
          establishmentId,
          deletedAt: null,
          estado: 'COMPLETADA',
          createdAt: { gte: startOfWeek },
        },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.saleVoidRequest.count({
        where: { establishmentId, status: 'PENDIENTE' },
      }),
      this.prisma.cashSession.count({
        where: { estado: 'ABIERTA', cashRegister: { establishmentId } },
      }),
      this.prisma.userAttendance.count({
        where: { establishmentId, checkOutAt: null, checkInAt: { gte: startOfDay } },
      }),
    ]);

    return {
      ventasHoy: (salesToday._sum.total ?? new Prisma.Decimal(0)).toString(),
      ventasHoyCount: salesToday._count,
      ventasSemana: (salesWeek._sum.total ?? new Prisma.Decimal(0)).toString(),
      ventasSemanaCount: salesWeek._count,
      anulacionesPendientes: pendingVoids,
      cajasAbiertas: openSessions,
      personalPresente: staffPresent,
    };
  }

  async getPharmacistDashboard(actor: JwtRequestUser) {
    const establishmentId = await this.establishmentScope.resolveScoped(actor);
    const tenantId = requireTenantId(actorFromJwt(actor));

    const [pendingPrescriptions, pendingVoids, controlledProducts] = await Promise.all([
      this.prisma.prescription.count({
        where: {
          establishmentId,
          deletedAt: null,
          estado: { in: ['ACTIVA', 'PARCIALMENTE_DISPENSADA'] },
        },
      }),
      this.prisma.saleVoidRequest.count({
        where: { establishmentId, status: 'PENDIENTE' },
      }),
      this.prisma.product.count({
        where: { tenantId, esControlado: true, deletedAt: null, habilitado: true },
      }),
    ]);

    return {
      recetasPendientes: pendingPrescriptions,
      anulacionesPendientes: pendingVoids,
      productosControladosActivos: controlledProducts,
    };
  }

  async getCashierDashboard(actor: JwtRequestUser) {
    const establishmentId = await this.establishmentScope.resolveScoped(actor);
    const timeZone = await this.resolveActorTimeZone(actor);
    const { start: startOfDay } = dayBoundsInTimeZone(new Date(), timeZone);

    const [mySales, openSession] = await Promise.all([
      this.prisma.sale.aggregate({
        where: {
          establishmentId,
          sellerId: actor.sub,
          deletedAt: null,
          estado: 'COMPLETADA',
          createdAt: { gte: startOfDay },
        },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.cashSession.findFirst({
        where: {
          estado: 'ABIERTA',
          userId: actor.sub,
          cashRegister: { establishmentId },
        },
        select: { id: true, openedAt: true, montoApertura: true },
      }),
    ]);

    return {
      ventasHoy: (mySales._sum.total ?? new Prisma.Decimal(0)).toString(),
      ventasHoyCount: mySales._count,
      cajaAbierta: !!openSession,
      sesionCaja: openSession
        ? {
            id: openSession.id,
            openedAt: openSession.openedAt.toISOString(),
            montoApertura: openSession.montoApertura.toString(),
          }
        : null,
    };
  }

  async getWarehouseDashboard(actor: JwtRequestUser) {
    const tenantId = this.tenantIdForDashboard(actor);
    const establishmentId = await this.establishmentScope.resolveScoped(actor);
    const timeZone = await this.resolveActorTimeZone(actor);
    const now = new Date();
    const { start: startOfDay } = dayBoundsInTimeZone(now, timeZone);
    const in30 = new Date(now);
    in30.setDate(in30.getDate() + 30);

    const warehouseFilter = {
      establishmentId,
      deletedAt: null as null,
    };

    const [
      stockRows,
      lotesVencidos,
      porVencer30,
      ajustesPendientes,
      transferenciasEnTransito,
      ordenesPendientesRecepcion,
      recepcionesHoy,
      zonasFrioSinLogHoy,
    ] = await Promise.all([
      this.prisma.productWarehouseStock.findMany({
        where: {
          product: { tenantId, deletedAt: null, habilitado: true },
          warehouse: warehouseFilter,
        },
        select: { cantidad: true, product: { select: { stockMinimo: true } } },
      }),
      this.prisma.productLotStock.count({
        where: {
          deletedAt: null,
          stock: { gt: 0 },
          fechaVencimiento: { lt: now },
          product: { tenantId },
          warehouse: warehouseFilter,
        },
      }),
      this.prisma.productLotStock.count({
        where: {
          deletedAt: null,
          stock: { gt: 0 },
          fechaVencimiento: { gte: now, lte: in30 },
          product: { tenantId },
          warehouse: warehouseFilter,
        },
      }),
      this.prisma.inventoryPendingAdjustment.count({
        where: {
          deletedAt: null,
          estado: 'PENDIENTE',
          warehouse: warehouseFilter,
        },
      }),
      this.prisma.inventoryStockTransfer.count({
        where: {
          deletedAt: null,
          estado: 'EN_TRANSITO',
          OR: [
            { fromWarehouse: warehouseFilter },
            { toWarehouse: warehouseFilter },
          ],
        },
      }),
      this.prisma.purchaseOrder.count({
        where: {
          establishmentId,
          deletedAt: null,
          estado: { in: ['APROBADA', 'ENVIADA', 'PARCIALMENTE_RECIBIDA'] },
        },
      }),
      this.prisma.goodsReceipt.count({
        where: {
          establishmentId,
          deletedAt: null,
          fechaRecepcion: { gte: startOfDay },
        },
      }),
      this.prisma.warehouseZone.count({
        where: {
          deletedAt: null,
          activo: true,
          tipo: 'REFRIGERADO',
          warehouse: warehouseFilter,
          temperatureLogs: { none: { fecha: { gte: startOfDay } } },
        },
      }),
    ]);

    const stockBajo = stockRows.filter((row) =>
      row.cantidad.lessThan(row.product.stockMinimo),
    ).length;

    return {
      stockBajo,
      lotesVencidos,
      porVencer30,
      ajustesPendientes,
      transferenciasEnTransito,
      ordenesPendientesRecepcion,
      recepcionesHoy,
      zonasFrioSinLogHoy,
    };
  }

  async getAccountantDashboard(actor: JwtRequestUser) {
    this.tenantIdForDashboard(actor);
    const establishmentId = await this.establishmentScope.resolveScoped(actor);

    const openPayableStatuses = ['PENDIENTE', 'PARCIAL', 'VENCIDA'] as Array<
      'PENDIENTE' | 'PARCIAL' | 'VENCIDA'
    >;
    const openReceivableStatuses = ['PENDIENTE', 'PARCIAL', 'VENCIDA'] as Array<
      'PENDIENTE' | 'PARCIAL' | 'VENCIDA'
    >;

    const [
      cpePendientes,
      cpeObservados,
      cpeRechazados,
      jobsFallidos,
      jobsPendientes,
      cxpAbiertas,
      cxpVencidas,
      cxpSaldo,
      cxcAbiertas,
      cxcVencidas,
      cxcSaldo,
    ] = await Promise.all([
      this.prisma.electronicDocument.count({
        where: {
          establishmentId,
          deletedAt: null,
          sunatStatus: { in: ['PENDIENTE', 'ENVIANDO'] },
        },
      }),
      this.prisma.electronicDocument.count({
        where: { establishmentId, deletedAt: null, sunatStatus: 'OBSERVADO' },
      }),
      this.prisma.electronicDocument.count({
        where: { establishmentId, deletedAt: null, sunatStatus: 'RECHAZADO' },
      }),
      this.prisma.billingJob.count({
        where: {
          status: 'FALLIDO',
          electronicDocument: { establishmentId, deletedAt: null },
        },
      }),
      this.prisma.billingJob.count({
        where: {
          status: { in: ['PENDIENTE', 'PROCESANDO'] },
          electronicDocument: { establishmentId, deletedAt: null },
        },
      }),
      this.prisma.accountPayable.count({
        where: {
          establishmentId,
          deletedAt: null,
          estado: { in: openPayableStatuses },
        },
      }),
      this.prisma.accountPayable.count({
        where: { establishmentId, deletedAt: null, estado: 'VENCIDA' },
      }),
      this.prisma.accountPayable.aggregate({
        where: {
          establishmentId,
          deletedAt: null,
          estado: { in: openPayableStatuses },
        },
        _sum: { saldo: true },
      }),
      this.prisma.accountReceivable.count({
        where: {
          establishmentId,
          deletedAt: null,
          estado: { in: openReceivableStatuses },
        },
      }),
      this.prisma.accountReceivable.count({
        where: { establishmentId, deletedAt: null, estado: 'VENCIDA' },
      }),
      this.prisma.accountReceivable.aggregate({
        where: {
          establishmentId,
          deletedAt: null,
          estado: { in: openReceivableStatuses },
        },
        _sum: { saldo: true },
      }),
    ]);

    return {
      cpePendientes,
      cpeObservados,
      cpeRechazados,
      jobsFallidos,
      jobsPendientes,
      cxpAbiertas,
      cxpVencidas,
      cxpSaldo: (cxpSaldo._sum?.saldo ?? new Prisma.Decimal(0)).toString(),
      cxcAbiertas,
      cxcVencidas,
      cxcSaldo: (cxcSaldo._sum?.saldo ?? new Prisma.Decimal(0)).toString(),
    };
  }

  async getPlatformDashboard(actor: JwtRequestUser) {
    if (!isPlatformAdmin(actor.role)) {
      throw new ForbiddenException('Solo operadores de plataforma');
    }

    const since7d = new Date();
    since7d.setDate(since7d.getDate() - 7);
    const since30d = new Date();
    since30d.setDate(since30d.getDate() - 30);

    const [
      tenantsPending,
      tenantsTrial,
      tenantsActive,
      tenantsSuspended,
      leadsNuevos,
      reclamacionesAbiertas,
      reclamaciones7d,
      tenantsActivados30d,
      establecimientosActivos,
      usuariosCliente,
      recentTenants,
    ] = await Promise.all([
      this.prisma.tenant.count({ where: { deletedAt: null, status: 'PENDING' } }),
      this.prisma.tenant.count({ where: { deletedAt: null, status: 'TRIAL' } }),
      this.prisma.tenant.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      this.prisma.tenant.count({ where: { deletedAt: null, status: 'SUSPENDED' } }),
      this.prisma.tenantLead.count({ where: { status: 'NEW' } }),
      this.prisma.complaint.count({
        where: { status: { in: ['PENDING', 'IN_REVIEW'] } },
      }),
      this.prisma.complaint.count({ where: { createdAt: { gte: since7d } } }),
      this.prisma.tenant.count({
        where: {
          deletedAt: null,
          activatedAt: { gte: since30d },
        },
      }),
      this.prisma.establishment.count({
        where: { deletedAt: null, activo: true },
      }),
      this.prisma.user.count({
        where: { deletedAt: null, role: { not: 'SUPER_ADMIN' } },
      }),
      this.prisma.tenant.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          nombre: true,
          slug: true,
          plan: true,
          status: true,
          createdAt: true,
          activatedAt: true,
        },
      }),
    ]);

    return {
      tenants: {
        pending: tenantsPending,
        trial: tenantsTrial,
        active: tenantsActive,
        suspended: tenantsSuspended,
      },
      leadsNuevos,
      reclamacionesAbiertas,
      reclamaciones7d,
      tenantsActivados30d,
      establecimientosActivos,
      usuariosCliente,
      recentTenants: recentTenants.map((t) => ({
        id: t.id,
        nombre: t.nombre,
        slug: t.slug,
        plan: t.plan,
        status: t.status,
        createdAt: t.createdAt.toISOString(),
        activatedAt: t.activatedAt?.toISOString() ?? null,
      })),
    };
  }
}
