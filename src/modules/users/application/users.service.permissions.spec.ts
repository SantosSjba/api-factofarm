import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '../../../generated/prisma/client';
import type { JwtRequestUser } from '../../auth/domain/auth.types';
import type { UserSnapshot } from '../domain/user.types';
import { UsersService } from './users.service';

const TENANT = 'tenant-1';

function snapshot(partial: Partial<UserSnapshot>): UserSnapshot {
  return {
    id: 'target',
    role: UserRole.CAJERO,
    tenantId: TENANT,
    permissionCodes: [],
    ...partial,
  } as UserSnapshot;
}

function actor(partial: Partial<JwtRequestUser>): JwtRequestUser {
  return {
    sub: 'actor',
    email: 'actor@test.pe',
    role: UserRole.GERENTE_SUCURSAL,
    tenantId: TENANT,
    establecimientoId: 'est-1',
    permissionCodes: [],
    ...partial,
  };
}

describe('UsersService · control de permisos', () => {
  let repo: {
    findById: jest.Mock;
    syncPermissions: jest.Mock;
    update: jest.Mock;
    findByEmail: jest.Mock;
  };
  let service: UsersService;

  beforeEach(() => {
    repo = {
      findById: jest.fn(),
      syncPermissions: jest.fn((id: string, codes: string[]) =>
        Promise.resolve(snapshot({ id, permissionCodes: codes })),
      ),
      update: jest.fn((id: string) => Promise.resolve(snapshot({ id }))),
      findByEmail: jest.fn().mockResolvedValue(null),
    };
    service = new UsersService(
      repo as never,
      { log: jest.fn() } as never,
      {} as never,
      {} as never,
      { invalidate: jest.fn() } as never,
    );
  });

  const gerente = actor({
    permissionCodes: ['nav.usuarios', 'nav.punto_venta', 'users.write'],
  });

  it('descarta códigos técnicos y módulos que el gestor no tiene', async () => {
    repo.findById.mockResolvedValue(snapshot({}));
    await service.updatePermissions(
      'target',
      [
        'nav.punto_venta',
        'nav.libro_mayor',
        'inventory.adjust',
        'tenants.write',
      ],
      gerente,
    );
    const saved = (repo.syncPermissions.mock.calls[0] as [string, string[]])[1];
    expect(saved).toContain('nav.punto_venta');
    expect(saved).not.toContain('nav.libro_mayor');
    expect(saved).not.toContain('inventory.adjust');
    expect(saved).not.toContain('tenants.write');
  });

  it('conserva los módulos del usuario que el gestor no puede tocar', async () => {
    repo.findById.mockResolvedValue(
      snapshot({ permissionCodes: ['nav.libro_mayor', 'finance.read'] }),
    );
    await service.updatePermissions('target', ['nav.punto_venta'], gerente);
    const saved = (repo.syncPermissions.mock.calls[0] as [string, string[]])[1];
    expect(saved).toEqual(
      expect.arrayContaining(['nav.punto_venta', 'nav.libro_mayor']),
    );
  });

  it('impide que un gestor cambie sus propios permisos', async () => {
    repo.findById.mockResolvedValue(
      snapshot({ id: 'actor', role: UserRole.GERENTE_SUCURSAL }),
    );
    await expect(
      service.updatePermissions('actor', ['nav.punto_venta'], gerente),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('impide que un gestor se asigne un rol de administración', async () => {
    repo.findById.mockResolvedValue(
      snapshot({ id: 'actor', role: UserRole.GERENTE_SUCURSAL }),
    );
    await expect(
      service.update('actor', { role: UserRole.ADMINISTRADOR }, gerente),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('impide que un gestor modifique a un administrador', async () => {
    repo.findById.mockResolvedValue(snapshot({ role: UserRole.ADMINISTRADOR }));
    await expect(
      service.update('target', { password: 'Otra-Clave-123!' }, gerente),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('permite al gestor editar sus datos si no cambia rol ni permisos', async () => {
    repo.findById.mockResolvedValue(
      snapshot({
        id: 'actor',
        role: UserRole.GERENTE_SUCURSAL,
        permissionCodes: gerente.permissionCodes,
      }),
    );
    await expect(
      service.update(
        'actor',
        {
          nombre: 'Nuevo nombre',
          role: UserRole.GERENTE_SUCURSAL,
          permissionCodes: ['nav.usuarios', 'nav.punto_venta'],
        },
        gerente,
      ),
    ).resolves.toBeDefined();
  });

  it('el administrador puede otorgar cualquier módulo de tenant, no los de plataforma', async () => {
    repo.findById.mockResolvedValue(snapshot({}));
    await service.updatePermissions(
      'target',
      ['nav.libro_mayor', 'nav.platform_clientes'],
      actor({ role: UserRole.ADMINISTRADOR }),
    );
    const saved = (repo.syncPermissions.mock.calls[0] as [string, string[]])[1];
    expect(saved).toContain('nav.libro_mayor');
    expect(saved).not.toContain('nav.platform_clientes');
  });
});
