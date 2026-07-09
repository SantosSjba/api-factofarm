import { BadRequestException } from '@nestjs/common';
import { Prisma, TaxWithholdingKind } from '../../../generated/prisma/client';
import { TaxWithholdingService } from './tax-withholding.service';

describe('TaxWithholdingService', () => {
  const prisma = {
    sunatWithholdingRate: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    taxWithholdingRecord: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    establishmentBillingConfig: { findUnique: jest.fn() },
    electronicDocument: { findMany: jest.fn() },
  };
  const audit = { log: jest.fn() };
  const billing = { emitSpecialDocument: jest.fn() };
  const service = new TaxWithholdingService(prisma as never, audit as never, billing as never);

  beforeEach(() => jest.clearAllMocks());

  describe('calculate', () => {
    it('calcula monto de retención/percepción', () => {
      const result = service.calculate(1000, 3);
      expect(result.baseImponible).toBe('1000');
      expect(result.tasa).toBe('3');
      expect(result.monto).toBe('30');
    });

    it('redondea a 4 decimales', () => {
      const result = service.calculate(100, 2.5);
      expect(result.monto).toBe('2.5');
    });
  });

  it('lista tasas por tipo', async () => {
    prisma.sunatWithholdingRate.findMany.mockResolvedValue([{ codigo: 'RET-03' }]);
    const rows = await service.listRates(TaxWithholdingKind.RETENCION);
    expect(rows).toHaveLength(1);
  });

  it('rechaza periodo inválido al listar registros', async () => {
    await expect(
      service.listRecords('est-1', TaxWithholdingKind.RETENCION, 'julio-2026'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('omite sync detracciones si no está habilitada', async () => {
    prisma.establishmentBillingConfig.findUnique.mockResolvedValue({ applyDetraccion: false });
    const result = await service.syncDetracciones('est-1');
    expect(result.synced).toBe(0);
    expect(result.message).toContain('no habilitada');
  });

  it('crea retención y emite comprobante especial', async () => {
    prisma.sunatWithholdingRate.findUnique.mockResolvedValue({
      codigo: 'RET-03',
      tasa: new Prisma.Decimal(3),
    });
    billing.emitSpecialDocument.mockResolvedValue({ id: 'doc-1' });
    prisma.taxWithholdingRecord.create.mockResolvedValue({
      id: 'rec-1',
      electronicDocument: { id: 'doc-1', serie: 'R001', numero: '1', sunatStatus: 'PENDIENTE' },
    });
    const record = await service.createRetention(
      'est-1',
      {
        partyNombre: 'Proveedor SAC',
        partyDocType: '6',
        partyDocNumber: '20100066603',
        baseImponible: 1000,
        regimenCodigo: 'RET-03',
      },
      'user-1',
    );
    expect(record.id).toBe('rec-1');
    expect(billing.emitSpecialDocument).toHaveBeenCalled();
  });
});
