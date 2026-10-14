import { JwtAuthGuard } from './jwt-auth.guard';
import {
  UserRole,
  TenantPlan,
  TenantStatus,
} from '../../generated/prisma/client';

describe('Autorización vigente de sesión', () => {
  const payload = {
    sub: 'user',
    email: 'u@example.com',
    role: UserRole.CAJERO,
    tenantId: 'tenant',
    establecimientoId: 'establishment',
    permissionCodes: ['users.write'],
  };
  function setup(overrides = {}) {
    const user = {
      email: payload.email,
      role: payload.role,
      tenantId: payload.tenantId,
      establecimientoId: payload.establecimientoId,
      establecimiento: { activo: true, deletedAt: null },
      permissions: [],
      tenant: {
        status: TenantStatus.ACTIVE,
        deletedAt: null,
        plan: TenantPlan.CUSTOM,
        enabledModules: [],
      },
      ...overrides,
    };
    const prisma = {
      user: { findFirst: jest.fn().mockResolvedValue(user) },
      establishment: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    return {
      guard: new JwtAuthGuard({} as never, {} as never, prisma as never),
      prisma,
    };
  }
  it('no confía en permisos antiguos del token', async () => {
    const { guard } = setup();
    expect(
      (await guard.validateSession(payload)).permissionCodes,
    ).not.toContain('users.write');
  });
  it('rechaza usuario eliminado', async () => {
    const { guard, prisma } = setup();
    prisma.user.findFirst.mockResolvedValue(null);
    await expect(guard.validateSession(payload)).rejects.toThrow();
  });
  it.each([
    { authVersion: 1 },
    { role: UserRole.ADMINISTRADOR },
    { tenantId: 'other' },
    { establecimientoId: 'other' },
    { establecimiento: { activo: false, deletedAt: null } },
    { tenant: { status: TenantStatus.SUSPENDED } },
    { tenant: { status: TenantStatus.PENDING } },
    { tenant: { status: TenantStatus.ACTIVE, deletedAt: new Date() } },
    { tenant: null },
  ])('invalida sesión cuando cambia acceso %j', async (overrides) => {
    const { guard } = setup(overrides);
    await expect(guard.validateSession(payload)).rejects.toThrow();
  });
  it('soporte requiere operador SUPER_ADMIN vigente', async () => {
    const { guard } = setup();
    await expect(
      guard.validateSession({
        ...payload,
        role: UserRole.ADMINISTRADOR,
        supportSession: true,
      }),
    ).rejects.toThrow();
  });
});
