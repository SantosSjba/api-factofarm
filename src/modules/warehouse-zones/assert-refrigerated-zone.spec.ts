import { BadRequestException } from '@nestjs/common';
import { WarehouseZoneType } from '../../generated/prisma/client';
import {
  REFRIGERATED_ZONE_QUARANTINE_MESSAGE,
  assertActiveColdZoneForRefrigeratedProducts,
} from './assert-refrigerated-zone';

describe('assertActiveColdZoneForRefrigeratedProducts', () => {
  const prisma = {
    product: { count: jest.fn() },
    warehouseZone: { findFirst: jest.fn() },
  };

  beforeEach(() => {
    prisma.product.count.mockReset();
    prisma.warehouseZone.findFirst.mockReset();
  });

  it('no consulta zona si no hay refrigerados', async () => {
    prisma.product.count.mockResolvedValue(0);
    await assertActiveColdZoneForRefrigeratedProducts(prisma, 'wh-1', ['p1']);
    expect(prisma.warehouseZone.findFirst).not.toHaveBeenCalled();
  });

  it('permite venta si hay zona REFRIGERADO activa', async () => {
    prisma.product.count.mockResolvedValue(1);
    prisma.warehouseZone.findFirst.mockResolvedValue({ id: 'zone-1' });
    await expect(
      assertActiveColdZoneForRefrigeratedProducts(prisma, 'wh-1', ['p1']),
    ).resolves.toBeUndefined();
    expect(prisma.warehouseZone.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          warehouseId: 'wh-1',
          activo: true,
          tipo: WarehouseZoneType.REFRIGERADO,
        }) as unknown,
      }) as unknown,
    );
  });

  it('bloquea si la zona de frío está inactiva o ausente', async () => {
    prisma.product.count.mockResolvedValue(1);
    prisma.warehouseZone.findFirst.mockResolvedValue(null);
    await expect(
      assertActiveColdZoneForRefrigeratedProducts(prisma, 'wh-1', ['p1']),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      assertActiveColdZoneForRefrigeratedProducts(prisma, 'wh-1', ['p1']),
    ).rejects.toThrow(REFRIGERATED_ZONE_QUARANTINE_MESSAGE);
  });
});
