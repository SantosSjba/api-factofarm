import { Injectable } from '@nestjs/common';
import { isPlatformAdmin } from '../../common/permissions/role-policy.util';
import { dayBoundsInTimeZone, normalizeTimeZone } from '../../common/utils/timezone.util';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { PrismaService } from '../../prisma/prisma.service';

export type AlertSeverity = 'critical' | 'warning' | 'info';

export type DashboardAlert = {
  /** Estable: el cliente lo usa para saber qué ya vio el usuario. */
  id: string;
  severity: AlertSeverity;
  icon: string;
  title: string;
  detail: string;
  count: number;
  route: string;
  queryParams?: Record<string, string>;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Notificaciones reales de la campana: avisos operativos del establecimiento del usuario
 * (o de la plataforma para operadores FactoFarm). Cada alerta solo se incluye si el usuario
 * tiene permiso para abrir la pantalla a la que lleva.
 */
@Injectable()
export class DashboardAlertsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAlerts(actor: JwtRequestUser): Promise<{ alerts: DashboardAlert[]; generatedAt: string }> {
    const alerts = isPlatformAdmin(actor.role) && !actor.supportSession
      ? await this.platformAlerts()
      : await this.tenantAlerts(actor);
    const order: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => order[a.severity] - order[b.severity] || b.count - a.count);
    return { alerts, generatedAt: new Date().toISOString() };
  }

  private async tenantAlerts(actor: JwtRequestUser): Promise<DashboardAlert[]> {
    const tenantId = actor.tenantId;
    const establishmentId = actor.establecimientoId;
    if (!tenantId || !establishmentId) return [];
    const can = (...codes: string[]) => codes.some((c) => (actor.permissionCodes ?? []).includes(c));

    const est = await this.prisma.establishment.findFirst({
      where: { id: establishmentId, tenantId, deletedAt: null },
      select: { timeZone: true },
    });
    if (!est) return [];
    const now = new Date();
    const { start: startOfDay } = dayBoundsInTimeZone(now, normalizeTimeZone(est.timeZone));
    const in30 = new Date(now.getTime() + 30 * DAY_MS);
    const warehouse = { establishmentId, deletedAt: null };
    const lotWhere = { deletedAt: null, stock: { gt: 0 }, product: { tenantId }, warehouse };
    const out: DashboardAlert[] = [];
    const tasks: Promise<void>[] = [];

    // Caja propia abierta desde un día anterior: hay que cerrarla con arqueo.
    if (can('nav.caja_chica_pos', 'nav.punto_venta')) {
      tasks.push(
        this.prisma.cashSession
          .findFirst({
            where: { estado: 'ABIERTA', userId: actor.sub, cashRegister: { establishmentId }, openedAt: { lt: startOfDay } },
            select: { openedAt: true, cashRegister: { select: { nombre: true } } },
          })
          .then((s) => {
            if (!s) return;
            const days = Math.max(1, Math.floor((now.getTime() - s.openedAt.getTime()) / DAY_MS));
            out.push({
              id: 'cash-stale-own',
              severity: 'critical',
              icon: 'lucide:wallet',
              title: 'Tu caja sigue abierta',
              detail: `${s.cashRegister.nombre} lleva ${days} ${days === 1 ? 'día' : 'días'} abierta. Ciérrala con su arqueo.`,
              count: 1,
              route: '/caja-chica-pos',
            });
          }),
      );
    }

    if (can('nav.historial_cajas')) {
      tasks.push(
        this.prisma.cashSession
          .count({ where: { estado: 'ABIERTA', cashRegister: { establishmentId }, openedAt: { lt: startOfDay }, NOT: { userId: actor.sub } } })
          .then((n) => {
            if (n) out.push({ id: 'cash-stale-others', severity: 'warning', icon: 'lucide:wallet', title: 'Cajas sin cerrar', detail: `${n} ${n === 1 ? 'caja de otro usuario sigue' : 'cajas de otros usuarios siguen'} abiertas desde días anteriores.`, count: n, route: '/historial-cajas' });
          }),
      );
    }

    if (can('nav.anulaciones')) {
      tasks.push(
        this.prisma.saleVoidRequest.count({ where: { establishmentId, status: 'PENDIENTE' } }).then((n) => {
          if (n) out.push({ id: 'void-requests', severity: 'warning', icon: 'lucide:ban', title: 'Anulaciones por aprobar', detail: `${n} ${n === 1 ? 'solicitud espera' : 'solicitudes esperan'} tu revisión.`, count: n, route: '/anulaciones' });
        }),
      );
    }

    if (can('nav.lotes', 'nav.productos')) {
      tasks.push(
        this.prisma.productLotStock.count({ where: { ...lotWhere, fechaVencimiento: { lt: now } } }).then((n) => {
          if (n) out.push({ id: 'lots-expired', severity: 'critical', icon: 'lucide:calendar-x', title: 'Lotes vencidos con stock', detail: `${n} ${n === 1 ? 'lote vencido no se puede vender. Retíralo' : 'lotes vencidos no se pueden vender. Retíralos'} o regulariza el stock.`, count: n, route: '/lotes', queryParams: { expiry: 'expired' } });
        }),
        this.prisma.productLotStock.count({ where: { ...lotWhere, fechaVencimiento: { gte: now, lte: in30 } } }).then((n) => {
          if (n) out.push({ id: 'lots-expiring', severity: 'warning', icon: 'lucide:calendar-clock', title: 'Lotes por vencer', detail: `${n} ${n === 1 ? 'lote vence' : 'lotes vencen'} en los próximos 30 días.`, count: n, route: '/lotes', queryParams: { expiry: '30' } });
        }),
      );
    }

    if (can('nav.productos')) {
      tasks.push(
        this.prisma.productWarehouseStock
          .findMany({
            where: { product: { tenantId, deletedAt: null, habilitado: true }, warehouse },
            select: { cantidad: true, product: { select: { stockMinimo: true } } },
          })
          .then((rows) => {
            const out0 = rows.filter((r) => r.cantidad.lte(0)).length;
            const low = rows.filter((r) => r.cantidad.gt(0) && r.cantidad.lessThan(r.product.stockMinimo)).length;
            if (out0) out.push({ id: 'stock-out', severity: 'warning', icon: 'lucide:package-x', title: 'Productos agotados', detail: `${out0} ${out0 === 1 ? 'producto sin' : 'productos sin'} stock en tu almacén.`, count: out0, route: '/productos' });
            if (low) out.push({ id: 'stock-low', severity: 'info', icon: 'lucide:trending-down', title: 'Stock bajo mínimo', detail: `${low} ${low === 1 ? 'producto está' : 'productos están'} por debajo de su stock mínimo.`, count: low, route: '/productos' });
          }),
      );
    }

    if (can('nav.comprobante_electronico')) {
      tasks.push(
        this.prisma.electronicDocument.count({ where: { establishmentId, deletedAt: null, sunatStatus: 'RECHAZADO' } }).then((n) => {
          if (n) out.push({ id: 'cpe-rejected', severity: 'critical', icon: 'lucide:x-circle', title: 'Comprobantes rechazados', detail: `SUNAT rechazó ${n} ${n === 1 ? 'comprobante' : 'comprobantes'}. Corrígelos y vuelve a emitirlos.`, count: n, route: '/comprobante-electronico' });
        }),
        this.prisma.electronicDocument.count({ where: { establishmentId, deletedAt: null, sunatStatus: { in: ['PENDIENTE', 'OBSERVADO'] }, createdAt: { lt: new Date(now.getTime() - DAY_MS) } } }).then((n) => {
          if (n) out.push({ id: 'cpe-pending', severity: 'warning', icon: 'lucide:send', title: 'Comprobantes sin confirmar', detail: `${n} ${n === 1 ? 'comprobante lleva' : 'comprobantes llevan'} más de un día pendientes u observados.`, count: n, route: '/comprobante-electronico' });
        }),
      );
    }

    if (can('nav.cuentas_pagar')) {
      tasks.push(
        this.prisma.accountPayable.count({ where: { establishmentId, deletedAt: null, estado: { in: ['PENDIENTE', 'PARCIAL', 'VENCIDA'] }, fechaVencimiento: { lt: now } } }).then((n) => {
          if (n) out.push({ id: 'payables-overdue', severity: 'warning', icon: 'lucide:landmark', title: 'Pagos a proveedores vencidos', detail: `${n} ${n === 1 ? 'cuenta por pagar está vencida' : 'cuentas por pagar están vencidas'}.`, count: n, route: '/cuentas-pagar' });
        }),
      );
    }

    if (can('nav.cadena_frio')) {
      tasks.push(
        this.prisma.warehouseZone
          .count({ where: { deletedAt: null, activo: true, tipo: 'REFRIGERADO', warehouse, temperatureLogs: { none: { fecha: { gte: startOfDay } } } } })
          .then((n) => {
            if (n) out.push({ id: 'cold-chain', severity: 'info', icon: 'lucide:thermometer-snowflake', title: 'Registrar temperatura', detail: `${n} ${n === 1 ? 'zona refrigerada no tiene' : 'zonas refrigeradas no tienen'} registro de hoy.`, count: n, route: '/cadena-frio' });
          }),
      );
    }

    await Promise.all(tasks);
    return out;
  }

  private async platformAlerts(): Promise<DashboardAlert[]> {
    const [leads, complaints, pending] = await Promise.all([
      this.prisma.tenantLead.count({ where: { status: 'NEW' } }),
      this.prisma.complaint.count({ where: { status: { in: ['PENDING', 'IN_REVIEW'] } } }),
      this.prisma.tenant.count({ where: { deletedAt: null, status: 'PENDING' } }),
    ]);
    const out: DashboardAlert[] = [];
    if (complaints) out.push({ id: 'complaints', severity: 'critical', icon: 'lucide:message-square-warning', title: 'Reclamaciones abiertas', detail: `${complaints} ${complaints === 1 ? 'reclamación espera' : 'reclamaciones esperan'} respuesta (plazo legal de 15 días hábiles).`, count: complaints, route: '/platform/reclamaciones' });
    if (leads) out.push({ id: 'leads', severity: 'warning', icon: 'lucide:user-plus', title: 'Leads nuevos', detail: `${leads} ${leads === 1 ? 'farmacia pidió' : 'farmacias pidieron'} información y aún no ${leads === 1 ? 'fue contactada' : 'fueron contactadas'}.`, count: leads, route: '/platform/leads' });
    if (pending) out.push({ id: 'tenants-pending', severity: 'info', icon: 'lucide:building-2', title: 'Clientes por activar', detail: `${pending} ${pending === 1 ? 'cliente está pendiente' : 'clientes están pendientes'} de aprovisionamiento.`, count: pending, route: '/platform/clientes', queryParams: { status: 'PENDING' } });
    return out;
  }
}
