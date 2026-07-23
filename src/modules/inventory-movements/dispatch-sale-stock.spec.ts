import { BadRequestException } from '@nestjs/common';
import { InventoryMovementType, Prisma } from '../../generated/prisma/client';
import { InventoryMovementsService } from './inventory-movements.service';
import { SaleLotAllocationMode } from './dto/sale-lot-allocation-preview.dto';

describe('InventoryMovementsService.dispatchSaleStock', () => {
  it('descuenta ProductWarehouseStock aunque el producto no maneje lotes', async () => {
    const createMovement = jest.fn().mockResolvedValue({});
    const lotUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
    const warehouseUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
    const transaction = jest.fn(async (fn: (tx: unknown) => Promise<void>) =>
      fn({
        inventoryInboundMovement: { create: createMovement },
        productLotStock: { updateMany: lotUpdateMany },
        productWarehouseStock: { updateMany: warehouseUpdateMany },
      }),
    );

    const prisma = {
      product: {
        findFirst: jest.fn().mockResolvedValue({ id: 'p1', manejaLotes: false }),
      },
      inventoryTransferReason: {
        findFirst: jest.fn().mockResolvedValue({ id: 'tr-out' }),
      },
      productWarehouseStock: {
        findUnique: jest.fn().mockResolvedValue({ cantidad: new Prisma.Decimal(20) }),
      },
      $transaction: transaction,
    };

    const lotAllocation = {
      getPolicyFromWarehouse: jest.fn().mockResolvedValue({
        establishmentId: 'e1',
        blockExpiredProductSales: true,
        inventoryLotAllocationMethod: 'FEFO',
      }),
      listEligibleLots: jest.fn(),
      planAutoAllocation: jest.fn(),
      planManualAllocation: jest.fn(),
    };

    const service = new InventoryMovementsService(
      prisma as never,
      lotAllocation as never,
      { log: jest.fn() } as never,
      {} as never,
      {} as never,
    );

    const result = await service.dispatchSaleStock(
      {
        productId: 'p1',
        warehouseId: 'w1',
        quantity: 3,
        mode: SaleLotAllocationMode.AUTO,
        reference: 'NV01-1',
      },
      'user-1',
    );

    expect(result.ok).toBe(true);
    expect(result.asignacion).toEqual([]);
    expect(createMovement).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          movementType: InventoryMovementType.SALIDA,
          cantidad: new Prisma.Decimal(-3),
        }),
      }),
    );
    expect(warehouseUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          productId: 'p1',
          warehouseId: 'w1',
          cantidad: { gte: new Prisma.Decimal(3) },
        }),
        data: { cantidad: { decrement: new Prisma.Decimal(3) } },
      }),
    );
  });

  it('rechaza cantidad cero', async () => {
    const prisma = {
      product: {
        findFirst: jest.fn().mockResolvedValue({ id: 'p1', manejaLotes: false }),
      },
      inventoryTransferReason: {
        findFirst: jest.fn().mockResolvedValue({ id: 'tr-out' }),
      },
      productWarehouseStock: { findUnique: jest.fn() },
      $transaction: jest.fn(),
    };
    const service = new InventoryMovementsService(
      prisma as never,
      {
        getPolicyFromWarehouse: jest.fn().mockResolvedValue({}),
        listEligibleLots: jest.fn(),
        planAutoAllocation: jest.fn(),
        planManualAllocation: jest.fn(),
      } as never,
      { log: jest.fn() } as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.dispatchSaleStock(
        {
          productId: 'p1',
          warehouseId: 'w1',
          quantity: 0,
          mode: SaleLotAllocationMode.AUTO,
        },
        'user-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
