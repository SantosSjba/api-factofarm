import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '../../generated/prisma/client';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { InventoryMovementsService } from './inventory-movements.service';

describe('InventoryMovementsService.listWarehouses (QA-CAMPANA-07)', () => {
  const actor: JwtRequestUser = {
    sub: 'cashier', email: 'cashier@example.test', role: UserRole.CAJERO,
    tenantId: 'tenant-a', establecimientoId: 'branch-a', permissionCodes: ['sales.read'],
  };
  const setup = () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const scope = {
      assertEstablishmentInTenant: jest.fn().mockResolvedValue(undefined),
      establishmentIdsForActor: jest.fn().mockResolvedValue(['branch-a', 'branch-b']),
    };
    const service = new InventoryMovementsService(
      { warehouse: { findMany } } as never, {} as never, {} as never,
      scope as never, {} as never, {} as never,
    );
    return { service, scope, findMany };
  };

  it('valida la pertenencia de la sede antes de listar almacenes para POS', async () => {
    const { service, scope, findMany } = setup();
    await service.listWarehouses(actor);
    expect(scope.assertEstablishmentInTenant).toHaveBeenCalledWith(actor, 'branch-a');
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ establishmentId: 'branch-a', deletedAt: null }),
    }));
  });

  it('rechaza una sede ajena sin consultar sus almacenes', async () => {
    const { service, scope, findMany } = setup();
    scope.assertEstablishmentInTenant.mockRejectedValue(new ForbiddenException());
    await expect(service.listWarehouses(actor)).rejects.toThrow(ForbiddenException);
    expect(findMany).not.toHaveBeenCalled();
  });

  it('rechaza POS sin sede asignada', async () => {
    const { service, findMany } = setup();
    await expect(service.listWarehouses({ ...actor, establecimientoId: '' })).rejects.toThrow(ForbiddenException);
    expect(findMany).not.toHaveBeenCalled();
  });

  it('mantiene el catálogo de inventario limitado a las sedes autorizadas del tenant', async () => {
    const { service, scope, findMany } = setup();
    const inventoryActor = { ...actor, permissionCodes: ['inventory.read'] };
    await service.listWarehouses(inventoryActor);
    expect(scope.establishmentIdsForActor).toHaveBeenCalledWith(inventoryActor);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { deletedAt: null, establishmentId: { in: ['branch-a', 'branch-b'] } },
    }));
  });
});
