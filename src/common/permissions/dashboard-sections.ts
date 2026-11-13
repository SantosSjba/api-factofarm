import type { JwtRequestUser } from '../../modules/auth/domain/auth.types';
import { hasChainScope } from './role-policy.util';

/**
 * Secciones del panel general (dashboard de empresa). Cada una es un ítem del árbol de permisos
 * bajo «Dashboard»: el API solo calcula y entrega las secciones permitidas.
 * Administrador / admin cadena ven todas (mismo bypass que `PermissionsGuard`).
 */
export const DASHBOARD_SECTION_CODES = {
  ventas: 'nav.dashboard_ventas',
  margenes: 'nav.dashboard_margenes',
  caja: 'nav.dashboard_caja',
  inventario: 'nav.dashboard_inventario',
  cuentas: 'nav.dashboard_cuentas',
} as const;

export type DashboardSection = keyof typeof DASHBOARD_SECTION_CODES;
export type DashboardSectionAccess = Record<DashboardSection, boolean>;

export const DASHBOARD_SECTION_CODE_LIST: string[] = Object.values(DASHBOARD_SECTION_CODES);

export function dashboardSectionAccess(actor: JwtRequestUser): DashboardSectionAccess {
  const all = hasChainScope(actor.role);
  const has = (code: string) => all || (actor.permissionCodes ?? []).includes(code);
  const ventas = has(DASHBOARD_SECTION_CODES.ventas);
  return {
    ventas,
    // Costo y ganancia se calculan sobre las ventas: sin ventas no tienen sentido.
    margenes: ventas && has(DASHBOARD_SECTION_CODES.margenes),
    caja: has(DASHBOARD_SECTION_CODES.caja),
    inventario: has(DASHBOARD_SECTION_CODES.inventario),
    cuentas: has(DASHBOARD_SECTION_CODES.cuentas),
  };
}
