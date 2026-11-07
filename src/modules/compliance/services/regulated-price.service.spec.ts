import { BadRequestException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { RegulatedPriceService } from './regulated-price.service';

const tenantA = { sub: 'user-1', role: 'ADMIN', tenantId: 'tenant-a' } as never;

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
  const integrity = {
    assertCanDeleteRegulatedPrice: jest.fn().mockResolvedValue(undefined),
  };
  const service = new RegulatedPriceService(
    prisma as never,
    audit as never,
    integrity as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('lista precios regulados con búsqueda', async () => {
    prisma.regulatedDrugPrice.findMany.mockResolvedValue([{ id: '1' }]);
    const rows = await service.list(tenantA, 'paracetamol');
    expect(rows).toHaveLength(1);
    expect(prisma.regulatedDrugPrice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-a',
          OR: expect.any(Array) as unknown,
        }) as unknown,
      }) as unknown,
    );
  });

  it('crea precio regulado nuevo', async () => {
    prisma.regulatedDrugPrice.findFirst.mockResolvedValue(null);
    prisma.regulatedDrugPrice.create.mockResolvedValue({ id: 'rp-1' });
    const row = await service.upsert(
      {
        nombre: 'Med A',
        precioMaximo: 12.5,
        codigoDigemid: 'DIG-1',
      },
      tenantA,
    );
    expect(row.id).toBe('rp-1');
    expect(prisma.regulatedDrugPrice.findFirst).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-a', codigoDigemid: 'DIG-1', deletedAt: null },
    });
    expect(prisma.regulatedDrugPrice.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ tenantId: 'tenant-a' }) as unknown,
    });
    expect(audit.log).toHaveBeenCalled();
  });

  it('detecta violación de precio máximo', async () => {
    prisma.establishment.findFirst.mockResolvedValue({
      blockSalesAboveRegulatedPrice: false,
    });
    prisma.product.findMany.mockResolvedValue([
      {
        id: 'p1',
        nombre: 'Med A',
        codigoMedicamentoDigemid: 'DIG-1',
        precioUnitarioVenta: '10',
      },
    ]);
    prisma.regulatedDrugPrice.findFirst.mockResolvedValue({
      precioMaximo: new Prisma.Decimal(8),
    });
    const result = await service.checkSalePrices('est-1', [
      { productId: 'p1', precioUnitario: new Prisma.Decimal(10) },
    ]);
    expect(result.violations).toHaveLength(1);
    expect(result.blocked).toBe(false);
  });

  it('bloquea venta si excede precio regulado y está habilitado', async () => {
    prisma.establishment.findFirst.mockResolvedValue({
      blockSalesAboveRegulatedPrice: true,
    });
    prisma.product.findMany.mockResolvedValue([
      {
        id: 'p1',
        nombre: 'Med A',
        codigoMedicamentoDigemid: 'DIG-1',
        precioUnitarioVenta: '10',
      },
    ]);
    prisma.regulatedDrugPrice.findFirst.mockResolvedValue({
      precioMaximo: new Prisma.Decimal(8),
    });
    await expect(
      service.checkSalePrices('est-1', [
        { productId: 'p1', precioUnitario: new Prisma.Decimal(10) },
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('elimina precio regulado', async () => {
    prisma.regulatedDrugPrice.findFirst.mockResolvedValue({ id: 'rp-1' });
    prisma.regulatedDrugPrice.update.mockResolvedValue({});
    const result = await service.remove('rp-1', tenantA);
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
      tenantA,
    );
    expect(result.imported).toBe(1);
    expect(result.total).toBe(2);
  });

  it('al vender compara solo con el catálogo del cliente del establecimiento', async () => {
    prisma.establishment.findFirst.mockResolvedValue({
      blockSalesAboveRegulatedPrice: true,
      tenantId: 'tenant-b',
    });
    prisma.product.findMany.mockResolvedValue([
      { id: 'p1', nombre: 'Med', codigoMedicamentoDigemid: 'DIG-1' },
    ]);
    // Otro cliente podría tener ese código: su fila no aplica aquí.
    prisma.regulatedDrugPrice.findFirst.mockResolvedValue(null);
    const result = await service.checkSalePrices('est-1', [
      { productId: 'p1', precioUnitario: new Prisma.Decimal(99) },
    ]);
    expect(result.violations).toHaveLength(0);
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-b' }) as unknown,
      }) as unknown,
    );
    expect(prisma.regulatedDrugPrice.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-b',
          codigoDigemid: 'DIG-1',
        }) as unknown,
      }) as unknown,
    );
  });

  it('no elimina un precio de otro cliente', async () => {
    prisma.regulatedDrugPrice.findFirst.mockResolvedValue(null);
    await expect(service.remove('rp-otro', tenantA)).rejects.toThrow(
      'Precio regulado no encontrado',
    );
    expect(prisma.regulatedDrugPrice.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-a' }) as unknown,
      }) as unknown,
    );
    expect(prisma.regulatedDrugPrice.update).not.toHaveBeenCalled();
  });
});
