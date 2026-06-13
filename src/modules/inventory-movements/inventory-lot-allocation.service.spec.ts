import { BadRequestException } from '@nestjs/common';
import { InventoryLotAllocationMethod, Prisma } from '../../generated/prisma/client';
import { InventoryLotAllocationService, type EligibleLotRow } from './inventory-lot-allocation.service';

describe('InventoryLotAllocationService', () => {
  const service = new InventoryLotAllocationService({} as never);

  const lot = (
    codigoLote: string,
    stock: number,
    fechaVencimiento: Date | null,
    createdAt: Date,
  ): EligibleLotRow => ({
    id: codigoLote,
    codigoLote,
    stock: new Prisma.Decimal(stock),
    fechaVencimiento,
    createdAt,
    vencido: fechaVencimiento ? fechaVencimiento.getTime() < Date.now() : false,
  });

  it('asigna por FEFO (vencimiento más próximo primero)', () => {
    const lots = [
      lot('L-B', 5, new Date('2026-12-01'), new Date('2026-01-01')),
      lot('L-A', 5, new Date('2026-08-01'), new Date('2026-02-01')),
    ].sort((a, b) =>
      service['compareLotsForAllocation'](a, b, InventoryLotAllocationMethod.FEFO),
    );

    expect(lots.map((row) => row.codigoLote)).toEqual(['L-A', 'L-B']);
    const plan = service.planAutoAllocation(lots, new Prisma.Decimal(7));
    expect(plan).toEqual([
      expect.objectContaining({ codigoLote: 'L-A', cantidad: '5' }),
      expect.objectContaining({ codigoLote: 'L-B', cantidad: '2' }),
    ]);
  });

  it('asigna por FIFO (ingreso más antiguo primero)', () => {
    const lots = [
      lot('L-NEW', 4, new Date('2026-12-01'), new Date('2026-06-01')),
      lot('L-OLD', 4, new Date('2026-12-01'), new Date('2026-01-01')),
    ].sort((a, b) =>
      service['compareLotsForAllocation'](a, b, InventoryLotAllocationMethod.FIFO),
    );

    expect(lots.map((row) => row.codigoLote)).toEqual(['L-OLD', 'L-NEW']);
  });

  it('rechaza asignación manual de lote vencido si está bloqueado', () => {
    const expired = lot('L-V', 3, new Date('2020-01-01'), new Date('2020-01-01'));
    expired.vencido = true;
    expect(() =>
      service.planManualAllocation([expired], [{ lotCode: 'L-V', quantity: 1 }], {
        establishmentId: 'e1',
        blockExpiredProductSales: true,
        inventoryLotAllocationMethod: InventoryLotAllocationMethod.FEFO,
      }),
    ).toThrow(BadRequestException);
  });

  it('falla si no hay stock suficiente en lotes elegibles', () => {
    const lots = [lot('L-1', 2, new Date('2026-12-01'), new Date('2026-01-01'))];
    expect(() => service.planAutoAllocation(lots, new Prisma.Decimal(5))).toThrow(
      /Stock vendible por lotes: 2/,
    );
  });
});
