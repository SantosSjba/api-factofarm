import { BadRequestException } from '@nestjs/common';
import { SaleDocumentType } from '../../generated/prisma/client';
import { SalesService } from './sales.service';

type ResolveDocumentNumber = (
  establishmentId: string,
  documentType: SaleDocumentType,
  serieInput?: string,
) => Promise<{ serie: string; numero: string }>;

function buildResolver(registered: string[], lastNumero: string | null) {
  const prisma = {
    establishmentSeries: {
      findMany: jest
        .fn()
        .mockResolvedValue(registered.map((numero) => ({ numero }))),
    },
    sale: {
      findFirst: jest
        .fn()
        .mockResolvedValue(lastNumero ? { numero: lastNumero } : null),
    },
  };
  const service = Object.create(SalesService.prototype) as {
    prisma: typeof prisma;
    resolveDocumentNumber: ResolveDocumentNumber;
    posDocumentSeries: SalesService['posDocumentSeries'];
  };
  service.prisma = prisma;
  return {
    prisma,
    service,
    resolve: service.resolveDocumentNumber.bind(
      service,
    ) as ResolveDocumentNumber,
  };
}

describe('SalesService.resolveDocumentNumber (C2: serie del catálogo)', () => {
  it('usa la primera serie registrada cuando no se envía serie', async () => {
    const { resolve } = buildResolver(['B001', 'B002'], '00000009');
    await expect(resolve('est-1', SaleDocumentType.BOLETA)).resolves.toEqual({
      serie: 'B001',
      numero: '00000010',
    });
  });

  it('acepta una serie registrada sin distinguir mayúsculas', async () => {
    const { resolve, prisma } = buildResolver(['B001', 'B002'], null);
    await expect(
      resolve('est-1', SaleDocumentType.BOLETA, ' b002 '),
    ).resolves.toEqual({ serie: 'B002', numero: '00000001' });
    expect(prisma.sale.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ serie: 'B002' }) as unknown,
      }),
    );
  });

  it('rechaza una serie que no pertenece al establecimiento', async () => {
    const { resolve, prisma } = buildResolver(['NV01'], null);
    await expect(
      resolve('est-1', SaleDocumentType.NOTA_VENTA, 'XYZ'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.sale.findFirst).not.toHaveBeenCalled();
  });

  it('rechaza una serie de otro tipo de comprobante', async () => {
    const { resolve } = buildResolver(['NV01'], null);
    await expect(
      resolve('est-1', SaleDocumentType.NOTA_VENTA, 'F001'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('sin series registradas solo admite la serie por defecto', async () => {
    const { resolve } = buildResolver([], null);
    await expect(
      resolve('est-1', SaleDocumentType.NOTA_VENTA),
    ).resolves.toEqual({ serie: 'NV01', numero: '00000001' });
    await expect(
      resolve('est-1', SaleDocumentType.NOTA_VENTA, 'NV99'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('expone al POS las mismas series que acepta la venta', async () => {
    const { service } = buildResolver([], null);
    await expect(service.posDocumentSeries('est-1')).resolves.toEqual({
      BOLETA: ['NV01'],
      FACTURA: ['NV01'],
      NOTA_VENTA: ['NV01'],
      TICKET: ['NV01'],
    });
  });
});
