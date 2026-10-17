import { ForbiddenException, Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import {
  CashSessionStatus,
  Prisma,
  SaleStatus,
} from '../../generated/prisma/client';
import {
  hasChainScope,
  isPlatformAdmin,
} from '../../common/permissions/role-policy.util';
import { writeWorkbookBuffer } from '../../common/utils/spreadsheet.util';
import {
  dateRangeBoundsInTimeZone,
  formatDateTimeInTimeZone,
  normalizeTimeZone,
} from '../../common/utils/timezone.util';
import { PrismaService } from '../../prisma/prisma.service';
import {
  canForceCloseCashSessions,
  canReadAllCashSessions,
  hoursOpen,
  STALE_CASH_SESSION_HOURS,
  type CashActor,
} from './cash-access.util';
import { CashReportPdfService } from './cash-report-pdf.service';
import { expectedCashBySession } from './cash-session.util';
import { CashRegistersService } from './cash-registers.service';
import type {
  CashSessionFiltersDto,
  ListCashSessionsQueryDto,
} from './dto/cash-register.dto';

const EXPORT_LIMIT = 5000;

export type CashSessionListItem = Awaited<
  ReturnType<CashSessionsHistoryService['mapRows']>
>[number];

@Injectable()
export class CashSessionsHistoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registers: CashRegistersService,
    private readonly pdf: CashReportPdfService,
  ) {}

  async list(actor: CashActor, query: ListCashSessionsQueryDto) {
    const page = Math.max(1, Math.floor(query.page ?? 1));
    const pageSize = Math.min(
      100,
      Math.max(1, Math.floor(query.pageSize ?? 15)),
    );
    const { where } = await this.buildWhere(actor, query);

    const [total, rows, sumAll, sumFaltante, sumSobrante] = await Promise.all([
      this.prisma.cashSession.count({ where }),
      this.prisma.cashSession.findMany({
        where,
        orderBy: { openedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: SESSION_LIST_SELECT,
      }),
      this.prisma.cashSession.aggregate({
        where,
        _sum: { diferenciaArqueo: true },
      }),
      this.prisma.cashSession.aggregate({
        where: { AND: [where, { diferenciaArqueo: { lt: 0 } }] },
        _sum: { diferenciaArqueo: true },
      }),
      this.prisma.cashSession.aggregate({
        where: { AND: [where, { diferenciaArqueo: { gt: 0 } }] },
        _sum: { diferenciaArqueo: true },
      }),
    ]);

    return {
      items: await this.mapRows(actor, rows),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      totales: {
        diferencia: dec(sumAll._sum.diferenciaArqueo),
        faltante: dec(sumFaltante._sum.diferenciaArqueo),
        sobrante: dec(sumSobrante._sum.diferenciaArqueo),
      },
      supervisor: canReadAllCashSessions(actor),
    };
  }

  /** Cajeros con sesiones en el alcance (para el filtro del historial). */
  async cashiers(actor: CashActor, query: CashSessionFiltersDto) {
    const { where } = await this.buildWhere(actor, {
      establishmentId: query.establishmentId,
    });
    return this.prisma.user.findMany({
      where: { cashSessions: { some: where } },
      orderBy: { nombre: 'asc' },
      select: { id: true, nombre: true },
    });
  }

  /**
   * Indicadores: cajas abiertas ahora y pendientes (> 24 h) no dependen del rango de fechas;
   * las diferencias acumuladas sí (cierres dentro del rango).
   */
  async kpis(actor: CashActor, query: CashSessionFiltersDto) {
    const scoped = await this.buildWhere(actor, {
      establishmentId: query.establishmentId,
    });
    const ranged = await this.buildWhere(actor, {
      ...query,
      estado: CashSessionStatus.CERRADA,
    });
    const staleBefore = new Date(Date.now() - STALE_CASH_SESSION_HOURS * 36e5);
    const open = { ...scoped.where, estado: CashSessionStatus.ABIERTA };

    const [
      abiertas,
      pendientes,
      cerradas,
      conDiferencia,
      forzados,
      sum,
      falt,
      sobr,
    ] = await Promise.all([
      this.prisma.cashSession.count({ where: open }),
      this.prisma.cashSession.count({
        where: { ...open, openedAt: { lt: staleBefore } },
      }),
      this.prisma.cashSession.count({ where: ranged.where }),
      this.prisma.cashSession.count({
        where: {
          AND: [ranged.where, { NOT: { diferenciaArqueo: 0 } }],
        },
      }),
      this.prisma.cashSession.count({
        where: { AND: [ranged.where, { cierreForzado: true }] },
      }),
      this.prisma.cashSession.aggregate({
        where: ranged.where,
        _sum: { diferenciaArqueo: true },
      }),
      this.prisma.cashSession.aggregate({
        where: { AND: [ranged.where, { diferenciaArqueo: { lt: 0 } }] },
        _sum: { diferenciaArqueo: true },
      }),
      this.prisma.cashSession.aggregate({
        where: { AND: [ranged.where, { diferenciaArqueo: { gt: 0 } }] },
        _sum: { diferenciaArqueo: true },
      }),
    ]);

    return {
      abiertasAhora: abiertas,
      abiertasMas24h: pendientes,
      cerradasEnRango: cerradas,
      cierresConDiferencia: conDiferencia,
      cierresForzados: forzados,
      diferenciaAcumulada: dec(sum._sum.diferenciaArqueo),
      faltanteAcumulado: dec(falt._sum.diferenciaArqueo),
      sobranteAcumulado: dec(sobr._sum.diferenciaArqueo),
    };
  }

  async export(
    actor: CashActor,
    query: CashSessionFiltersDto,
    format: 'xlsx' | 'pdf',
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const { where, timeZone, establishmentLabel } = await this.buildWhere(
      actor,
      query,
    );
    const rows = await this.prisma.cashSession.findMany({
      where,
      orderBy: { openedAt: 'desc' },
      take: EXPORT_LIMIT,
      select: SESSION_LIST_SELECT,
    });
    const items = await this.mapRows(actor, rows);
    const stamp = new Date().toISOString().slice(0, 10);
    const rango = [query.from, query.to].filter(Boolean).join(' a ') || 'Todo';

    if (format === 'pdf') {
      return {
        buffer: await this.pdf.buildHistory({
          items,
          timeZone,
          establishmentLabel,
          rango,
        }),
        filename: `historial-cajas-${stamp}.pdf`,
        contentType: 'application/pdf',
      };
    }

    const fmt = (iso: string | null) =>
      iso
        ? formatDateTimeInTimeZone(new Date(iso), timeZone, 'es-PE', {
            timeStyle: 'short',
          })
        : '';
    const num = (v: string | null) => (v == null ? '' : Number(v));
    const header = [
      'Apertura',
      'Cierre',
      'Horas abierta',
      'Establecimiento',
      'Caja',
      'Cajero',
      'Estado',
      'Cerrada por',
      'Cierre forzado',
      'Motivo cierre forzado',
      'Monto inicial',
      'Ventas (N°)',
      'Ventas (S/)',
      'Efectivo esperado',
      'Efectivo contado',
      'Diferencia',
      'Observaciones',
    ];
    const data = items.map((r) => [
      fmt(r.openedAt),
      fmt(r.closedAt),
      r.horasAbierta,
      r.establishment.nombre,
      r.cashRegister.nombre,
      r.user.nombre,
      r.estado === CashSessionStatus.ABIERTA ? 'Abierta' : 'Cerrada',
      r.closedBy?.nombre ?? '',
      r.cierreForzado ? 'Sí' : 'No',
      r.motivoCierreForzado ?? '',
      num(r.montoApertura),
      r.numVentas,
      num(r.totalVentas),
      num(r.efectivoEsperado),
      num(r.montoCierreFisico),
      num(r.diferenciaArqueo),
      r.notasCierre ?? '',
    ]);
    const sheet = XLSX.utils.aoa_to_sheet([
      [`Historial de cajas · ${establishmentLabel} · ${rango}`],
      [],
      header,
      ...data,
    ]);
    sheet['!cols'] = header.map((h) => ({ wch: Math.max(12, h.length + 2) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, 'Cajas');
    return {
      buffer: writeWorkbookBuffer(wb),
      filename: `historial-cajas-${stamp}.xlsx`,
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  /** Reporte de cierre / arqueo (reimpresión) de una sesión. */
  async sessionReport(
    actor: CashActor,
    sessionId: string,
    format: 'a4' | 'ticket',
  ): Promise<{ buffer: Buffer; filename: string }> {
    const summary = await this.registers.sessionSummary(sessionId, actor);
    const paper =
      format === 'ticket'
        ? summary.cashRegister.printerPaperWidth === 'MM_58'
          ? 'TICKET_58'
          : 'TICKET_80'
        : 'A4';
    return {
      buffer: await this.pdf.buildSessionReport(summary, paper),
      filename: `arqueo-caja-${summary.openedAt.slice(0, 10)}-${summary.id.slice(0, 8)}.pdf`,
    };
  }

  async mapRows(
    actor: CashActor,
    rows: Prisma.CashSessionGetPayload<{
      select: typeof SESSION_LIST_SELECT;
    }>[],
  ) {
    const ids = rows.map((r) => r.id);
    const openIds = rows
      .filter((r) => r.estado === CashSessionStatus.ABIERTA)
      .map((r) => r.id);
    const [sales, expected] = await Promise.all([
      this.prisma.sale.groupBy({
        by: ['cashSessionId'],
        where: {
          cashSessionId: { in: ids },
          estado: { not: SaleStatus.ANULADA },
        },
        _sum: { total: true },
        _count: { _all: true },
      }),
      expectedCashBySession(this.prisma, openIds),
    ]);
    const salesBy = new Map(sales.map((s) => [s.cashSessionId, s]));
    const forceClose = canForceCloseCashSessions(actor);
    const now = new Date();

    return rows.map((r) => {
      const open = r.estado === CashSessionStatus.ABIERTA;
      const isMine = r.userId === actor.userId;
      const horas = hoursOpen(r.openedAt, r.closedAt ?? now);
      const s = salesBy.get(r.id);
      return {
        id: r.id,
        estado: r.estado,
        openedAt: r.openedAt.toISOString(),
        closedAt: r.closedAt?.toISOString() ?? null,
        horasAbierta: horas,
        pendiente: open && horas >= STALE_CASH_SESSION_HOURS,
        establishment: r.cashRegister.establishment,
        cashRegister: { id: r.cashRegister.id, nombre: r.cashRegister.nombre },
        user: r.user,
        closedBy: r.closedBy,
        isMine,
        canClose: open && (isMine || forceClose),
        cierreForzado: r.cierreForzado,
        motivoCierreForzado: r.motivoCierreForzado,
        montoApertura: r.montoApertura.toString(),
        efectivoEsperado: open
          ? (expected.get(r.id) ?? r.montoApertura).toString()
          : (r.montoCierreSistema?.toString() ?? null),
        montoCierreFisico: r.montoCierreFisico?.toString() ?? null,
        diferenciaArqueo: r.diferenciaArqueo?.toString() ?? null,
        notasCierre: r.notasCierre,
        numVentas: s?._count._all ?? 0,
        totalVentas: dec(s?._sum.total ?? null),
      };
    });
  }

  private async buildWhere(
    actor: CashActor,
    filters: CashSessionFiltersDto,
  ): Promise<{
    where: Prisma.CashSessionWhereInput;
    timeZone: string;
    establishmentLabel: string;
  }> {
    const and: Prisma.CashSessionWhereInput[] = [];
    const requested = filters.establishmentId?.trim();
    let establishmentLabel: string;
    let tzSource = actor.establishmentId;

    if (requested === 'ALL') {
      if (!hasChainScope(actor.role)) {
        throw new ForbiddenException(
          'Solo los administradores de cadena pueden consultar todas las sucursales',
        );
      }
      if (actor.tenantId) {
        and.push({
          cashRegister: { establishment: { tenantId: actor.tenantId } },
        });
      } else {
        and.push({ cashRegister: { establishmentId: actor.establishmentId } });
      }
      establishmentLabel = 'Todas las sucursales';
    } else {
      const establishmentId = requested || actor.establishmentId;
      if (
        establishmentId !== actor.establishmentId &&
        !hasChainScope(actor.role)
      ) {
        throw new ForbiddenException(
          'No puede consultar cajas de otra sucursal',
        );
      }
      const est = await this.prisma.establishment.findFirst({
        where: { id: establishmentId, deletedAt: null },
        select: { nombre: true, tenantId: true },
      });
      if (
        !est ||
        (!isPlatformAdmin(actor.role) && est.tenantId !== actor.tenantId)
      ) {
        throw new ForbiddenException(
          'No puede consultar cajas de otro cliente',
        );
      }
      and.push({ cashRegister: { establishmentId } });
      establishmentLabel = est.nombre;
      tzSource = establishmentId;
    }

    // Sin permiso de supervisión, cada cajero solo ve sus propias sesiones.
    if (!canReadAllCashSessions(actor)) {
      and.push({ userId: actor.userId });
    } else if (filters.userId) {
      and.push({ userId: filters.userId });
    }
    if (filters.cashRegisterId)
      and.push({ cashRegisterId: filters.cashRegisterId });
    if (filters.estado) and.push({ estado: filters.estado });
    if (filters.forzado === 'true') and.push({ cierreForzado: true });
    if (filters.forzado === 'false') and.push({ cierreForzado: false });

    switch (filters.diferencia) {
      case 'CON_DIFERENCIA':
        and.push(
          { diferenciaArqueo: { not: null } },
          { NOT: { diferenciaArqueo: 0 } },
        );
        break;
      case 'FALTANTE':
        and.push({ diferenciaArqueo: { lt: 0 } });
        break;
      case 'SOBRANTE':
        and.push({ diferenciaArqueo: { gt: 0 } });
        break;
      case 'SIN_DIFERENCIA':
        and.push({ diferenciaArqueo: 0 });
        break;
    }

    const tzRow = await this.prisma.establishment.findUnique({
      where: { id: tzSource },
      select: { timeZone: true },
    });
    const timeZone = normalizeTimeZone(tzRow?.timeZone);
    if (filters.from || filters.to) {
      const { start, end } = dateRangeBoundsInTimeZone(
        filters.from ?? '2000-01-01',
        filters.to ?? '2999-12-31',
        timeZone,
      );
      and.push({ openedAt: { gte: start, lt: end } });
    }

    return { where: { AND: and }, timeZone, establishmentLabel };
  }
}

const SESSION_LIST_SELECT = {
  id: true,
  estado: true,
  userId: true,
  openedAt: true,
  closedAt: true,
  montoApertura: true,
  montoCierreSistema: true,
  montoCierreFisico: true,
  diferenciaArqueo: true,
  notasCierre: true,
  cierreForzado: true,
  motivoCierreForzado: true,
  user: { select: { id: true, nombre: true } },
  closedBy: { select: { id: true, nombre: true } },
  cashRegister: {
    select: {
      id: true,
      nombre: true,
      establishment: { select: { id: true, nombre: true } },
    },
  },
} satisfies Prisma.CashSessionSelect;

function dec(value: Prisma.Decimal | null | undefined): string {
  return (value ?? new Prisma.Decimal(0)).toString();
}
