import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '../../generated/prisma/client';
import {
  assertPlatformAdmin,
  assertTenantAccess,
  requireTenantId,
  resolveTenantScope,
} from './tenant-scope.util';

describe('tenant-scope', () => {
  const admin = { tenantId: 'tenant-a', role: UserRole.ADMINISTRADOR };
  const platform = { tenantId: null, role: UserRole.SUPER_ADMIN };

  it('assertPlatformAdmin bloquea al administrador de farmacia', () => {
    expect(() => assertPlatformAdmin(admin)).toThrow(ForbiddenException);
    expect(() => assertPlatformAdmin(admin)).toThrow(
      'Use la consola de plataforma para esta operación',
    );
  });

  it('assertPlatformAdmin permite SUPER_ADMIN', () => {
    expect(() => assertPlatformAdmin(platform)).not.toThrow();
  });

  it('resolveTenantScope no deja al admin consultar otro cliente', () => {
    expect(() => resolveTenantScope(admin, 'tenant-b')).toThrow(ForbiddenException);
    expect(resolveTenantScope(admin)).toBe('tenant-a');
  });

  it('assertTenantAccess bloquea recurso de otro tenant', () => {
    expect(() => assertTenantAccess(admin, 'tenant-b')).toThrow(ForbiddenException);
  });

  it('requireTenantId rechaza operadores de plataforma', () => {
    expect(() => requireTenantId(platform)).toThrow(ForbiddenException);
  });
});
