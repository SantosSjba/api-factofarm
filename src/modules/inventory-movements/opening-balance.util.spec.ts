import { BadRequestException } from '@nestjs/common';
import { InventoryMovementType, Prisma } from '../../generated/prisma/client';
import {
  OPENING_BALANCE_REASON_CODE,
  recordOpeningBalance,
} from './opening-balance.util';

function makeDb(reason: { id: string } | null) {
  const created: Record<string, unknown>[] = [];
  const db = {
    inventoryTransferReason: { findFirst: jest.fn().mockResolvedValue(reason) },
    inventoryInboundMovement: {
      create: jest.fn(({ data }: { data: Record<string, unknown> }) => {
        created.push(data);
        return Promise.resolve({ ...data, id: 'mov-1' });
      }),
    },
    product: { findUnique: jest.fn().mockResolvedValue({ esControlado: false }) },
    warehouse: { findUnique: jest.fn() },
    controlledSubstanceLedgerEntry: { findFirst: jest.fn(), create: jest.fn() },
  };
  return { db: db as never, raw: db, created };
}

describe('recordOpeningBalance', () => {
  it('registra un INGRESO con el motivo de inventario inicial', async () => {
    const { db, raw, created } = makeDb({ id: 'reason-1' });
    await recordOpeningBalance(db, {
      productId: 'p1',
      warehouseId: 'w1',
      cantidad: 100,
      codigoLote: 'L1',
      costoUnitario: 2.5,
      comentario: 'Stock inicial al crear el producto',
      userId: 'u1',
    });
    expect(raw.inventoryTransferReason.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ codigo: OPENING_BALANCE_REASON_CODE }),
      }),
    );
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({
      productId: 'p1',
      warehouseId: 'w1',
      transferReasonId: 'reason-1',
      movementType: InventoryMovementType.INGRESO,
      codigoLote: 'L1',
      userId: 'u1',
    });
    expect((created[0].cantidad as Prisma.Decimal).toString()).toBe('100');
  });

  it('no hace nada con cantidad cero', async () => {
    const { db, raw } = makeDb({ id: 'reason-1' });
    await recordOpeningBalance(db, {
      productId: 'p1',
      warehouseId: 'w1',
      cantidad: 0,
      comentario: 'x',
    });
    expect(raw.inventoryInboundMovement.create).not.toHaveBeenCalled();
  });

  it('avisa si falta el motivo', async () => {
    const { db } = makeDb(null);
    await expect(
      recordOpeningBalance(db, {
        productId: 'p1',
        warehouseId: 'w1',
        cantidad: 5,
        comentario: 'x',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
