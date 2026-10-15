import { TenantPlan, UserRole } from '../../generated/prisma/client';
import { resolveUserPermissionCodes } from './tenant-permissions.util';

describe('resolveUserPermissionCodes', () => {
  const tenant = {
    plan: TenantPlan.CUSTOM,
    enabledModules: ['nav.punto_venta'],
  };

  it('revoca los permisos técnicos persistidos de un módulo deshabilitado', () => {
    const codes = resolveUserPermissionCodes({
      role: UserRole.CAJERO,
      permissionCodes: [
        'nav.usuarios',
        'users.read',
        'users.write',
        'audit.read',
        'nav.punto_venta',
      ],
      tenant,
    });
    expect(codes).toContain('sales.write');
    expect(codes).not.toContain('nav.usuarios');
    expect(codes).not.toContain('users.read');
    expect(codes).not.toContain('users.write');
    expect(codes).not.toContain('audit.read');
  });

  it('no conserva permisos de hospital al bajar al plan Botica', () => {
    const codes = resolveUserPermissionCodes({
      role: UserRole.FARMACEUTICO,
      permissionCodes: [
        'nav.hospital_dispensacion',
        'hospital.read',
        'hospital.write',
      ],
      tenant: { plan: TenantPlan.BOTICA, enabledModules: null },
    });
    expect(codes).not.toContain('hospital.read');
    expect(codes).not.toContain('hospital.write');
  });

  it('conserva un permiso compartido cuando otro módulo autorizado lo necesita', () => {
    const codes = resolveUserPermissionCodes({
      role: UserRole.CAJERO,
      permissionCodes: [
        'nav.usuarios',
        'nav.auditoria',
        'users.read',
        'audit.read',
      ],
      tenant: { plan: TenantPlan.CUSTOM, enabledModules: ['nav.auditoria'] },
    });
    expect(codes).toContain('audit.read');
    expect(codes).not.toContain('users.read');
  });

  it('no concede un módulo contratado que el usuario no tiene asignado', () => {
    const codes = resolveUserPermissionCodes({
      role: UserRole.CAJERO,
      permissionCodes: ['nav.punto_venta'],
      tenant: {
        plan: TenantPlan.CUSTOM,
        enabledModules: ['nav.punto_venta', 'nav.usuarios'],
      },
    });
    expect(codes).not.toContain('users.write');
    expect(codes).not.toContain('nav.usuarios');
  });

  it('mantiene permisos técnicos explícitos fuera del catálogo de módulos', () => {
    expect(
      resolveUserPermissionCodes({
        role: UserRole.CAJERO,
        permissionCodes: ['custom.operation'],
        tenant,
      }),
    ).toContain('custom.operation');
  });

  it('conserva la resolución de plataforma cuando no hay tenant', () => {
    const codes = resolveUserPermissionCodes({
      role: UserRole.SUPER_ADMIN,
      permissionCodes: ['nav.platform_clientes'],
    });
    expect(codes).toEqual(
      expect.arrayContaining(['nav.platform_clientes', 'tenants.write']),
    );
  });
});
