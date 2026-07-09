import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { RegulatedPriceService } from './regulated-price.service';

describe('RegulatedPriceService', () => {
  const audit = { log: jest.fn() };
  const prisma = {
    regulatedDrugPrice: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    establishment: { findFirst: jest.fn() },
    product: { findMany: jest.fn() },
  };
  const service = new RegulatedPriceService(prisma as never, audit as never);

  beforeEach(() => jest.clearAllMocks());

  it('lista precios regulados con búsqueda', async () => {
    prisma.regulatedDrugPrice.findMany.mockResolvedValue([{ id: '1' }]);
    const rows = await service.list('paracetamol');
    expect(rows).toHaveLength(1);
    expect(prisma.regulatedDrugPrice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.any(Array),
        }),
      }),
    );
  });

  it('crea precio regulado nuevo', async () => {
    prisma.regulatedDrugPrice.findFirst.mockResolvedValue(null);
    prisma.regulatedDrugPrice.create.mockResolvedValue({ id: 'rp-1' });
    const row = await service.upsert({ nombre: 'Med A', precioMaximo: 12.5, codigoDigemid: 'DIG-1' });
    expect(row.id).toBe('rp-1');
    expect(audit.log).toHaveBeenCalled();
  });

  it('detecta violación de precio máximo', async () => {
    prisma.establishment.findFirst.mockResolvedValue({ blockSalesAboveRegulatedPrice: false });
    prisma.product.findMany.mockResolvedValue([
      { id: 'p1', nombre: 'Med A', codigoMedicamentoDigemid: 'DIG-1', precioUnitarioVenta: '10' },
    ]);
    prisma.regulatedDrugPrice.findFirst.mockResolvedValue({ precioMaximo: new Prisma.Decimal(8) });
    const result = await service.checkSalePrices('est-1', [
      { productId: 'p1', precioUnitario: new Prisma.Decimal(10) },
    ]);
    expect(result.violations).toHaveLength(1);
    expect(result.blocked).toBe(false);
  });

  it('bloquea venta si excede precio regulado y está habilitado', async () => {
    prisma.establishment.findFirst.mockResolvedValue({ blockSalesAboveRegulatedPrice: true });
    prisma.product.findMany.mockResolvedValue([
      { id: 'p1', nombre: 'Med A', codigoMedicamentoDigemid: 'DIG-1', precioUnitarioVenta: '10' },
    ]);
    prisma.regulatedDrugPrice.findFirst.mockResolvedValue({ precioMaximo: new Prisma.Decimal(8) });
    await expect(
      service.checkSalePrices('est-1', [{ productId: 'p1', precioUnitario: new Prisma.Decimal(10) }]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('elimina precio regulado', async () => {
    prisma.regulatedDrugPrice.findFirst.mockResolvedValue({ id: 'rp-1' });
    prisma.regulatedDrugPrice.update.mockResolvedValue({});
    const result = await service.remove('rp-1', 'user-1');
    expect(result.ok).toBe(true);
  });

  it('importa lote omitiendo filas inválidas', async () => {
    prisma.regulatedDrugPrice.findFirst.mockResolvedValue(null);
    prisma.regulatedDrugPrice.create.mockResolvedValue({ id: 'rp-1' });
    const result = await service.importBatch(
      [
        { nombre: 'Med A', precioMaximo: 10 },
        { nombre: '', precioMaximo: 5 },
      ],
      'user-1',
    );
    expect(result.imported).toBe(1);
    expect(result.total).toBe(2);
  });
});
