import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '../../generated/prisma/client';
import { hasChainScope } from '../permissions/role-policy.util';

export type ScopeActor = {
  establecimientoId: string;
  role: UserRole;
};

/** Resuelve el establishmentId efectivo para queries multi-sucursal. */
export function resolveEstablishmentScope(
  actor: ScopeActor,
  requestedEstablishmentId?: string | null,
): string {
  const requested = requestedEstablishmentId?.trim();
  if (!requested || requested === actor.establecimientoId) {
    return actor.establecimientoId;
  }
  if (hasChainScope(actor.role)) {
    return requested;
  }
  throw new ForbiddenException('No puede consultar datos de otra sucursal');
}

/** Filtro Prisma estándar por establecimiento del actor. */
export function establishmentWhere(actor: ScopeActor, field = 'establishmentId') {
  return { [field]: actor.establecimientoId } as Record<string, string>;
}

/** Valida que un recurso pertenece a la sucursal del actor (admin cadena omitido). */
export function assertEstablishmentAccess(
  actor: ScopeActor,
  resourceEstablishmentId: string,
): void {
  if (hasChainScope(actor.role)) {
    return;
  }
  if (resourceEstablishmentId !== actor.establecimientoId) {
    throw new ForbiddenException('No puede acceder a datos de otra sucursal');
  }
}
