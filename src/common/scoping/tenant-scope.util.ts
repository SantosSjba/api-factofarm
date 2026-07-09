import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '../../generated/prisma/client';
import { isPlatformAdmin } from '../permissions/role-policy.util';

export type TenantScopeActor = {
  tenantId: string | null;
  role: UserRole;
};

export function resolveTenantScope(
  actor: TenantScopeActor,
  requestedTenantId?: string | null,
): string | null {
  if (isPlatformAdmin(actor.role)) {
    return requestedTenantId?.trim() || null;
  }
  if (!actor.tenantId) {
    throw new ForbiddenException('Usuario sin tenant asignado');
  }
  const requested = requestedTenantId?.trim();
  if (requested && requested !== actor.tenantId) {
    throw new ForbiddenException('No puede consultar datos de otro cliente');
  }
  return actor.tenantId;
}

export function tenantWhere(actor: TenantScopeActor, field = 'tenantId') {
  if (isPlatformAdmin(actor.role)) {
    return {};
  }
  if (!actor.tenantId) {
    throw new ForbiddenException('Usuario sin tenant asignado');
  }
  return { [field]: actor.tenantId } as Record<string, string>;
}

export function assertTenantAccess(
  actor: TenantScopeActor,
  resourceTenantId: string,
): void {
  if (isPlatformAdmin(actor.role)) {
    return;
  }
  if (!actor.tenantId || resourceTenantId !== actor.tenantId) {
    throw new ForbiddenException('No puede acceder a datos de otro cliente');
  }
}

export function requireTenantId(actor: TenantScopeActor): string {
  if (isPlatformAdmin(actor.role)) {
    throw new ForbiddenException('Use la consola de plataforma para esta operación');
  }
  if (!actor.tenantId) {
    throw new ForbiddenException('Usuario sin tenant asignado');
  }
  return actor.tenantId;
}

export function actorFromJwt(actor: {
  role: UserRole;
  tenantId?: string | null;
}): TenantScopeActor {
  return {
    role: actor.role,
    tenantId: actor.tenantId ?? null,
  };
}
