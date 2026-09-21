import { Prisma, PrescriptionStatus } from '../../generated/prisma/client';
import { PrescriptionsService } from './prescriptions.service';

describe('Dispensación atómica de recetas', () => {
  function setup(stock = 5) {
    let dispensed = new Prisma.Decimal(0);
    const line = { id: 'line', productId: 'original', cantidadPrescrita: new Prisma.Decimal(stock), cantidadDispensada: dispensed };
    const tx = {
      prescription: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ items: [line] }),
        update: jest.fn(),
      },
      prescriptionItem: {
        updateMany: jest.fn(async ({ where, data }) => {
          if (dispensed.gt(where.cantidadDispensada.lte)) return { count: 0 };
          dispensed = dispensed.plus(data.cantidadDispensada.increment);
          return { count: 1 };
        }),
        findMany: jest.fn(async () => [{ ...line, cantidadDispensada: dispensed }]),
      },
    };
    const prisma = { $transaction: jest.fn(async (fn) => fn(tx)) };
    const audit = { log: jest.fn() };
    return { tx, prisma, audit, service: new PrescriptionsService(prisma as never, audit as never, {} as never, {} as never) };
  }

  it('usa la transacción de venta y descuenta el producto original de una sustitución', async () => {
    const { service, tx, prisma } = setup();
    await service.applyDispenseFromSale('rx', [{ productId: 'substitute', cantidad: new Prisma.Decimal(5) }], 'actor', tx as never, 'est', [{ originalProductId: 'original', substituteProductId: 'substitute' }]);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(tx.prescription.updateMany.mock.calls[0][0].where.establishmentId).toBe('est');
    expect(tx.prescription.update).toHaveBeenCalledWith({ where: { id: 'rx' }, data: { estado: PrescriptionStatus.COMPLETADA } });
  });

  it('rechaza líneas repetidas que superan juntas lo prescrito', async () => {
    const { service, tx } = setup();
    await expect(service.applyDispenseFromSale('rx', [
      { productId: 'original', cantidad: new Prisma.Decimal(3) },
      { productId: 'original', cantidad: new Prisma.Decimal(3) },
    ], 'actor', tx as never, 'est')).rejects.toThrow(/excede/);
  });

  it('rechaza receta vencida, de otro establecimiento o completada antes de dispensar', async () => {
    const { service, tx } = setup();
    tx.prescription.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.applyDispenseFromSale('rx', [{ productId: 'original', cantidad: new Prisma.Decimal(1) }], 'actor', tx as never, 'est')).rejects.toThrow(/Receta no válida/);
    expect(tx.prescriptionItem.updateMany).not.toHaveBeenCalled();
  });

  it('rechaza receta de otro cliente en validateForSale', async () => {
    const prisma = {
      prescription: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'rx',
          customerId: 'cust-a',
          validUntil: null,
          items: [
            {
              productId: 'p',
              cantidadPrescrita: new Prisma.Decimal(1),
              cantidadDispensada: new Prisma.Decimal(0),
            },
          ],
        }),
      },
    };
    const service = new PrescriptionsService(
      prisma as never,
      { log: jest.fn() } as never,
      {} as never,
      {} as never,
    );
    await expect(
      service.validateForSale(
        'rx',
        'est',
        [{ productId: 'p', cantidad: new Prisma.Decimal(1) }],
        undefined,
        'cust-b',
      ),
    ).rejects.toThrow(/no pertenece al cliente/);
  });

  it('filtra por cliente titular al dispensar desde venta', async () => {
    const { service, tx } = setup();
    await service.applyDispenseFromSale(
      'rx',
      [{ productId: 'original', cantidad: new Prisma.Decimal(1) }],
      'actor',
      tx as never,
      'est',
      undefined,
      'customer-a',
    );
    expect(tx.prescription.updateMany.mock.calls[0][0].where.customerId).toBe('customer-a');
  });
});
