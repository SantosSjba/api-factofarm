import { BadRequestException } from '@nestjs/common';
import { BillingProviderType } from '../../generated/prisma/client';
import { BillingService } from './billing.service';

describe('BillingService', () => {
  const prisma = {
    establishmentBillingConfig: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    electronicDocument: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };
  const audit = { log: jest.fn() };
  const config = { get: jest.fn() };
  const ubl = {};
  const artifacts = {};
  const mockProvider = {};
  const nubefactProvider = {};
  const factilizaProvider = {};
  const apisperuProvider = {};
  const factilizaConsulta = {};
  const realtime = { emitToEstablishment: jest.fn() };

  const service = new BillingService(
    prisma as never,
    audit as never,
    config as never,
    ubl as never,
    artifacts as never,
    mockProvider as never,
    nubefactProvider as never,
    factilizaProvider as never,
    apisperuProvider as never,
    factilizaConsulta as never,
    realtime as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    config.get.mockImplementation((key: string) => {
      if (key === 'NODE_ENV') return 'development';
      if (key === 'JWT_SECRET') return 'dev-secret';
      return undefined;
    });
  });

  it('devuelve configuración por defecto (solo notas de venta)', async () => {
    prisma.establishmentBillingConfig.findUnique.mockResolvedValue(null);
    const cfg = await service.getConfig('est-1');
    expect(cfg.provider).toBe(BillingProviderType.MOCK);
    expect(cfg.autoEmitOnSale).toBe(false);
    expect(cfg.capabilities.mockAllowed).toBe(true);
  });

  it('devuelve configuración persistida', async () => {
    prisma.establishmentBillingConfig.findUnique.mockResolvedValue({
      provider: BillingProviderType.FACTILIZA,
      rucEmisor: '20123456789',
      razonSocialEmisor: 'BOTICA SAC',
      apiUrl: 'https://api.test',
      consultaApiUrl: null,
      modoSandbox: true,
      autoEmitOnSale: true,
      emitNotaVenta: false,
      applyDetraccion: false,
      autoEmitGuiaOnTransfer: true,
      apiTokenEncrypted: 'enc',
      certificateEncrypted: null,
    });
    const cfg = await service.getConfig('est-1');
    expect(cfg.provider).toBe(BillingProviderType.FACTILIZA);
    expect(cfg.hasApiToken).toBe(true);
    expect(cfg.capabilities.supportsDailySummary).toBe(false);
  });

  it('permite MOCK en producción (farmacia sin OSE / solo NV)', async () => {
    config.get.mockImplementation((key: string) => (key === 'NODE_ENV' ? 'production' : 'secret'));
    prisma.establishmentBillingConfig.findUnique.mockResolvedValue(null);
    prisma.establishmentBillingConfig.upsert.mockResolvedValue({ id: 'cfg-1' });
    const cfg = await service.upsertConfig('est-1', { provider: BillingProviderType.MOCK });
    expect(prisma.establishmentBillingConfig.upsert).toHaveBeenCalled();
    expect(cfg.provider).toBe(BillingProviderType.MOCK);
  });

  it('rechaza Bizlinks no implementado', async () => {
    config.get.mockImplementation((key: string) => (key === 'NODE_ENV' ? 'production' : 'secret'));
    await expect(
      service.upsertConfig('est-1', { provider: BillingProviderType.BIZLINKS }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('no borra el token al actualizar solo RUC', async () => {
    prisma.establishmentBillingConfig.findUnique
      .mockResolvedValueOnce({
        provider: BillingProviderType.FACTILIZA,
        rucEmisor: '20111111111',
        razonSocialEmisor: 'OLD',
        apiUrl: 'https://api.old',
        consultaApiUrl: null,
        modoSandbox: true,
        autoEmitOnSale: true,
        emitNotaVenta: false,
        applyDetraccion: false,
        autoEmitGuiaOnTransfer: true,
        apiTokenEncrypted: 'keep-me',
      })
      .mockResolvedValueOnce({
        provider: BillingProviderType.FACTILIZA,
        rucEmisor: '20999999999',
        razonSocialEmisor: 'OLD',
        apiUrl: 'https://api.old',
        consultaApiUrl: null,
        modoSandbox: true,
        autoEmitOnSale: true,
        emitNotaVenta: false,
        applyDetraccion: false,
        autoEmitGuiaOnTransfer: true,
        apiTokenEncrypted: 'keep-me',
        certificateEncrypted: null,
      });
    prisma.establishmentBillingConfig.upsert.mockResolvedValue({ id: 'cfg-1' });

    await service.upsertConfig('est-1', { rucEmisor: '20999999999' });

    const args = prisma.establishmentBillingConfig.upsert.mock.calls[0][0];
    expect(args.update.apiTokenEncrypted).toBeUndefined();
    expect(args.update.rucEmisor).toBe('20999999999');
    expect(args.update.apiUrl).toBe('https://api.old');
  });

  it('lista documentos electrónicos paginados', async () => {
    prisma.electronicDocument.count.mockResolvedValue(1);
    prisma.electronicDocument.findMany.mockResolvedValue([
      {
        id: 'doc-1',
        serie: 'B001',
        numero: '00000001',
        documentType: 'BOLETA',
        sunatStatus: 'ACEPTADO',
        total: { toString: () => '10.00' },
        createdAt: new Date('2026-07-09'),
      },
    ]);
    const result = await service.listDocuments('est-1', { page: 1, pageSize: 10 });
    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
  });

  it('limpia el poller al destruir módulo', () => {
    jest.useFakeTimers();
    service.onModuleInit();
    service.onModuleDestroy();
    jest.useRealTimers();
  });

  it('obtiene documento electrónico por id', async () => {
    prisma.electronicDocument = {
      ...prisma.electronicDocument,
      findFirst: jest.fn().mockResolvedValue({
        id: 'doc-1',
        serie: 'B001',
        numero: '00000001',
        documentType: 'BOLETA',
        sunatStatus: 'ACEPTADO',
        subtotal: { toString: () => '8.47' },
        igvTotal: { toString: () => '1.53' },
        total: { toString: () => '10' },
        moneda: 'PEN',
        createdAt: new Date('2026-07-09'),
        lines: [],
        taxLines: [],
        responses: [],
        sale: null,
        relatedDocument: null,
      }),
    };
    const doc = await service.getDocument('doc-1', 'est-1');
    expect(doc.id).toBe('doc-1');
  });

  it('indica ausencia de comprobante en venta', async () => {
    prisma.electronicDocument = {
      ...prisma.electronicDocument,
      findFirst: jest.fn().mockResolvedValue(null),
    };
    const status = await service.getSaleBillingStatus('sale-1', 'est-1');
    expect(status).toBeNull();
  });
});
