import { UserRole } from '../../generated/prisma/client';
import { hasChainScope } from '../../common/permissions/role-policy.util';

/** Datos del actor que deciden qué cajas puede ver y cerrar. */
export type CashActor = {
  userId: string;
  role: UserRole;
  permissionCodes: readonly string[];
  tenantId: string | null;
  /** Establecimiento efectivo (scope resuelto). */
  establishmentId: string;
};

/** Gerente de sucursal supervisa las cajas de su local sin permiso adicional. */
function isCashSupervisorRole(role: UserRole): boolean {
  return hasChainScope(role) || role === UserRole.GERENTE_SUCURSAL;
}

/** Ver sesiones de todos los cajeros (historial / supervisión). */
export function canReadAllCashSessions(actor: CashActor): boolean {
  return (
    isCashSupervisorRole(actor.role) ||
    actor.permissionCodes.includes('cash.sessions.read_all')
  );
}

/** Cerrar (forzado) la caja que otro usuario dejó abierta. */
export function canForceCloseCashSessions(actor: CashActor): boolean {
  return (
    isCashSupervisorRole(actor.role) ||
    actor.permissionCodes.includes('cash.close.force')
  );
}

/** Horas transcurridas desde la apertura (1 decimal). */
export function hoursOpen(openedAt: Date, now = new Date()): number {
  return Math.round(((now.getTime() - openedAt.getTime()) / 36e5) * 10) / 10;
}

/** Una caja abierta más de este tiempo se considera pendiente de cierre. */
export const STALE_CASH_SESSION_HOURS = 24;
