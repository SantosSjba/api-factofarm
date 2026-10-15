import { BadRequestException } from '@nestjs/common';
import {
  InventoryLotAllocationMethod,
  Prisma,
} from '../../generated/prisma/client';
import {
  InventoryLotAllocationService,
  type EligibleLotRow,
} from './inventory-lot-allocation.service';

describe('InventoryLotAllocationService', () => {
  const service = new InventoryLotAllocationService({} as never);
  const policy = {
    establishmentId: 'e1',
    blockExpiredProductSales: true,
    inventoryLotAllocationMethod: InventoryLotAllocationMethod.FEFO,
  };

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
      service['compareLotsForAllocation'](
        a,
        b,
        InventoryLotAllocationMethod.FEFO,
      ),
    );

    expect(lots.map((row) => row.codigoLote)).toEqual(['L-A', 'L-B']);
    const plan = service.planAutoAllocation(lots, new Prisma.Decimal(7));
    expect(plan).toEqual([
      expect.objectContaining({
        codigoLote: 'L-A',
        cantidad: '5',
      }) as unknown,
      expect.objectContaining({
        codigoLote: 'L-B',
        cantidad: '2',
      }) as unknown,
    ]);
  });

  it('asigna por FIFO (ingreso más antiguo primero)', () => {
    const lots = [
      lot('L-NEW', 4, new Date('2026-12-01'), new Date('2026-06-01')),
      lot('L-OLD', 4, new Date('2026-12-01'), new Date('2026-01-01')),
    ].sort((a, b) =>
      service['compareLotsForAllocation'](
        a,
        b,
        InventoryLotAllocationMethod.FIFO,
      ),
    );

    expect(lots.map((row) => row.codigoLote)).toEqual(['L-OLD', 'L-NEW']);
  });

  it('rechaza asignación manual de lote vencido si está bloqueado', () => {
    const expired = lot(
      'L-V',
      3,
      new Date('2020-01-01'),
      new Date('2020-01-01'),
    );
    expired.vencido = true;
    expect(() =>
      service.planManualAllocation(
        [expired],
        [{ lotCode: 'L-V', quantity: 1 }],
        {
          establishmentId: 'e1',
          blockExpiredProductSales: true,
          inventoryLotAllocationMethod: InventoryLotAllocationMethod.FEFO,
        },
      ),
    ).toThrow(BadRequestException);
  });

  it('falla si no hay stock suficiente en lotes elegibles', () => {
    const lots = [
      lot('L-1', 2, new Date('2026-12-01'), new Date('2026-01-01')),
    ];
    expect(() =>
      service.planAutoAllocation(lots, new Prisma.Decimal(5)),
    ).toThrow(/Stock vendible por lotes: 2/);
  });

  it('acumula referencias repetidas al mismo lote sin permitir sobreventa', () => {
    const lots = [lot('L-1', 5, null, new Date())];
    expect(() =>
      service.planManualAllocation(
        lots,
        [
          { lotCode: 'L-1', quantity: 3 },
          { lotCode: ' l-1 ', quantity: 3 },
        ],
        policy,
      ),
    ).toThrow(/Stock insuficiente/);
    expect(lots[0].stock.toString()).toBe('5');
    expect(
      service
        .planManualAllocation(
          lots,
          [
            { lotCode: 'L-1', quantity: 2 },
            { lotCode: 'L-1', quantity: 3 },
          ],
          policy,
        )
        .map((line) => line.cantidad),
    ).toEqual(['2', '3']);
  });

  it.each([0, -1, NaN, Infinity])(
    'rechaza cantidades inválidas: %s',
    (quantity) => {
      const lots = [lot('L-1', 5, null, new Date())];
      expect(() =>
        service.planAutoAllocation(lots, new Prisma.Decimal(quantity)),
      ).toThrow(BadRequestException);
      expect(() =>
        service.planManualAllocation(
          lots,
          [{ lotCode: 'L-1', quantity }],
          policy,
        ),
      ).toThrow(BadRequestException);
    },
  );

  it('bloquea lotes vencidos incluso con una configuración antigua desactivada', async () => {
    const expired = lot(
      'OLD',
      4,
      new Date('2020-01-01'),
      new Date('2020-01-01'),
    );
    const legacyPolicy = { ...policy, blockExpiredProductSales: false };
    const listing = new InventoryLotAllocationService({
      productLotStock: {
        findMany: jest.fn().mockResolvedValue([expired]),
      },
    } as never);
    expect(await listing.listEligibleLots('p', 'w', legacyPolicy)).toEqual([]);
    expect(() =>
      service.planManualAllocation(
        [expired],
        [{ lotCode: 'OLD', quantity: 1 }],
        legacyPolicy,
      ),
    ).toThrow(/vencido/);
    expect(() =>
      service.assertLotSellable(expired.fechaVencimiento, false),
    ).toThrow(/vencido/);
  });
});
