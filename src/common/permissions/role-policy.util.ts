import { UserRole } from '../../generated/prisma/client';

/** Roles con acceso cross-sucursal (cadena / plataforma). */
export const CHAIN_SCOPE_ROLES: ReadonlySet<UserRole> = new Set([
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN_CADENA,
  UserRole.ADMINISTRADOR,
]);

/** Roles que pueden anular ventas directamente (sin solicitud). */
export const DIRECT_SALE_VOID_ROLES: ReadonlySet<UserRole> = new Set([
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN_CADENA,
  UserRole.ADMINISTRADOR,
  UserRole.GERENTE_SUCURSAL,
  UserRole.FARMACEUTICO_TITULAR,
  UserRole.FARMACEUTICO,
]);

/** Roles que pueden aprobar dispensación de controlados. */
export const CONTROLLED_DISPENSE_ROLES: ReadonlySet<UserRole> = new Set([
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN_CADENA,
  UserRole.ADMINISTRADOR,
  UserRole.GERENTE_SUCURSAL,
  UserRole.FARMACEUTICO_TITULAR,
  UserRole.FARMACEUTICO,
]);

export function hasChainScope(role: UserRole): boolean {
  return CHAIN_SCOPE_ROLES.has(role);
}

export function isPlatformAdmin(role: UserRole): boolean {
  return role === UserRole.SUPER_ADMIN;
}

export function canVoidSaleDirectly(role: UserRole): boolean {
  return DIRECT_SALE_VOID_ROLES.has(role);
}

export function canApproveControlledDispense(role: UserRole): boolean {
  return CONTROLLED_DISPENSE_ROLES.has(role);
}

/** VENDEDOR se trata como CAJERO en políticas operativas. */
export function normalizeOperationalRole(role: UserRole): UserRole {
  if (role === UserRole.VENDEDOR) return UserRole.CAJERO;
  return role;
}
