import { PleService } from './ple.service';

describe('PleService', () => {
  const prisma = {
    establishmentBillingConfig: { findUnique: jest.fn().mockResolvedValue({ rucEmisor: '20123456789' }) },
    sale: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    goodsReceipt: { findMany: jest.fn() },
    electronicDocument: { groupBy: jest.fn(), findMany: jest.fn() },
    inventoryMovement: { findMany: jest.fn() },
    product: { findMany: jest.fn() },
  };
  const service = new PleService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('resume periodo contable', async () => {
    prisma.sale.aggregate.mockResolvedValue({
      _count: 2,
      _sum: { subtotal: { toString: () => '100' }, igvTotal: { toString: () => '18' }, total: { toString: () => '118' } },
    });
    prisma.goodsReceipt.findMany.mockResolvedValue([]);
    prisma.electronicDocument.groupBy.mockResolvedValue([]);
    const summary = await service.accountantSummary('est-1', '2026-07');
    expect(summary.period).toBe('2026-07');
    expect(summary.ventas.count).toBe(2);
  });

  it('genera libro de ventas 14.1', async () => {
    prisma.sale.findMany.mockResolvedValue([]);
    const txt = await service.buildTxt('est-1', '2026-07', '14.1');
    expect(txt.filename).toContain('141');
    expect(txt.content).toContain('LIBRO');
  });
});
