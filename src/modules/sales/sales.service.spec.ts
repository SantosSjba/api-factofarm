import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  PaymentMethod,
  Prisma,
  SaleStatus,
  SaleVoidRequestStatus,
  UserRole,
} from '../../generated/prisma/client';
import { SalesService } from './sales.service';

function buildService() {
  const prisma = {
    sale: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    archivedSale: {
      findFirst: jest.fn().mockResolvedValue(null),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    product: { findMany: jest.fn() },
    warehouse: { findFirst: jest.fn() },
    drugInteraction: { findMany: jest.fn() },
    saleVoidRequest: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    saleReturn: { create: jest.fn() },
    cashMovement: { create: jest.fn() },
    $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma)),
  };
  const audit = { log: jest.fn() };
  const inventory = { executeAdjustmentDelta: jest.fn() };
  const lotAllocation = { batchSumEligibleStock: jest.fn().mockResolvedValue(new Map()) };
  const billing = {
    voidFromSale: jest.fn().mockResolvedValue(undefined),
    scheduleEmitFromReturn: jest.fn().mockResolvedValue('doc-nc'),
    scheduleDebitNoteFromSale: jest.fn().mockResolvedValue('doc-nd'),
  };
  const realtime = { emitStockUpdated: jest.fn(), emitSaleCompleted: jest.fn() };
  const service = new SalesService(
    prisma as never,
    audit as never,
    inventory as never,
    lotAllocation as never,
    billing as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    realtime as never,
    {} as never,
    {} as never,
    { build: jest.fn() } as never,
    { exists: jest.fn(), resolveAbsolutePath: jest.fn() } as never,
    {
      assertCustomerInTenant: jest.fn().mockResolvedValue(undefined),
      assertProductInTenant: jest.fn().mockResolvedValue(undefined),
    } as never,
  );
  return { service, prisma, audit, inventory, billing, lotAllocation, realtime };
}

describe('SalesService', () => {
  it('lista ventas paginadas', async () => {
    const { service, prisma } = buildService();
    prisma.sale.count.mockResolvedValue(1);
    prisma.sale.findMany.mockResolvedValue([
      {
        id: 's1',
        documentType: 'BOLETA',
        serie: 'B001',
        numero: '00000001',
        estado: SaleStatus.COMPLETADA,
        archivedAt: null,
        subtotal: new Prisma.Decimal(8.47),
        descuentoTotal: new Prisma.Decimal(0),
        igvTotal: new Prisma.Decimal(1.53),
        total: new Prisma.Decimal(10),
        createdAt: new Date('2026-07-09'),
        customer: { nombre: 'Cliente' },
        seller: { nombre: 'Cajero' },
        payments: [{ metodo: PaymentMethod.EFECTIVO, monto: new Prisma.Decimal(10) }],
        electronicDocument: null,
        _count: { returns: 0 },
      },
    ]);
    const result = await service.findAll('est-1', { page: 1, pageSize: 10 });
    expect(result.total).toBe(1);
    expect(result.items[0].total).toBe('10');
  });

  it('obtiene detalle de venta', async () => {
    const { service, prisma } = buildService();
    prisma.sale.findFirst.mockResolvedValue({
      id: 's1',
      documentType: 'BOLETA',
      serie: 'B001',
      numero: '1',
      estado: SaleStatus.COMPLETADA,
      subtotal: new Prisma.Decimal(8.47),
      descuentoTotal: new Prisma.Decimal(0),
      igvTotal: new Prisma.Decimal(1.53),
      total: new Prisma.Decimal(10),
      prescriptionValidated: false,
      prescriptionNote: null,
      comentario: null,
      createdAt: new Date('2026-07-09'),
      customer: { id: 'c1', nombre: 'Cliente', numeroDocumento: '12345678' },
      seller: { id: 'u1', nombre: 'Cajero' },
      items: [
        {
          id: 'i1',
          cantidad: new Prisma.Decimal(1),
          precioUnitario: new Prisma.Decimal(10),
          subtotalLinea: new Prisma.Decimal(8.47),
          igvLinea: new Prisma.Decimal(1.53),
          totalLinea: new Prisma.Decimal(10),
          product: { id: 'p1', nombre: 'Producto', codigoInterno: 'P1' },
          lotLines: [],
        },
      ],
      payments: [{ metodo: PaymentMethod.EFECTIVO, monto: new Prisma.Decimal(10), referencia: null }],
    });
    const detail = await service.findOne('s1', 'est-1');
    expect(detail.id).toBe('s1');
    expect('items' in detail).toBe(true);
    if (!('items' in detail)) return;
    expect(detail.items[0].producto).toBe('Producto');
  });

  it('lanza not found si venta no existe', async () => {
    const { service, prisma } = buildService();
    prisma.sale.findFirst.mockResolvedValue(null);
    await expect(service.findOne('missing', 'est-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('detecta interacciones medicamentosas en carrito', async () => {
    const { service, prisma } = buildService();
    prisma.drugInteraction.findMany.mockResolvedValue([
      {
        principioA: 'WARFARINA',
        principioB: 'ASPIRINA',
        severidad: 'ALTA',
        descripcion: 'Riesgo hemorrágico',
        recomendacion: 'Evitar combinación',
      },
    ]);
    prisma.product.findMany.mockResolvedValue([
      { id: 'p1', nombre: 'Warfarina 5mg', principioActivo: 'warfarina' },
      { id: 'p2', nombre: 'Aspirina 100mg', principioActivo: 'aspirina' },
    ]);
    const result = await service.checkInteractions(['p1', 'p2']);
    expect(result.hasAlerts).toBe(true);
    expect(result.alerts).toHaveLength(1);
  });

  it('no alerta con un solo principio activo', async () => {
    const { service, prisma } = buildService();
    prisma.drugInteraction.findMany.mockResolvedValue([
      {
        principioA: 'A',
        principioB: 'B',
        severidad: 'MEDIA',
        descripcion: 'x',
        recomendacion: 'y',
      },
    ]);
    prisma.product.findMany.mockResolvedValue([
      { id: 'p1', nombre: 'Solo A', principioActivo: 'A' },
    ]);
    const result = await service.checkInteractions(['p1']);
    expect(result.hasAlerts).toBe(false);
  });

  it('lista solicitudes de anulación', async () => {
    const { service, prisma } = buildService();
    prisma.saleVoidRequest.findMany.mockResolvedValue([
      {
        id: 'vr1',
        saleId: 's1',
        reason: 'Error',
        status: 'PENDIENTE',
        rejectedReason: null,
        createdAt: new Date('2026-07-09'),
        resolvedAt: null,
        sale: {
          id: 's1',
          serie: 'B001',
          numero: '1',
          total: new Prisma.Decimal(20),
          sellerId: 'u2',
        },
        requestedBy: { id: 'u1', nombre: 'Cajero' },
        approvedBy: null,
      },
    ]);
    const rows = await service.listVoidRequests('est-1');
    expect(rows[0].sale.total).toBe('20');
  });

  it('impide anulación directa a vendedor', async () => {
    const { service } = buildService();
    await expect(
      service.voidSale(
        's1',
        { reason: 'Error' },
        { sub: 'u1', establecimientoId: 'est-1', role: UserRole.VENDEDOR },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('impide que el vendedor anule su propia venta', async () => {
    const { service, prisma } = buildService();
    prisma.sale.findFirst.mockResolvedValue({
      id: 's1',
      estado: SaleStatus.COMPLETADA,
      sellerId: 'u1',
      establishmentId: 'est-1',
      items: [],
      serie: 'B001',
      numero: '1',
      warehouseId: 'w1',
      cashSessionId: null,
      total: new Prisma.Decimal(10),
      archivedAt: null,
      documentType: 'BOLETA',
      _count: { returns: 0 },
      electronicDocument: null,
    });
    await expect(
      service.voidSale(
        's1',
        { reason: 'Error' },
        { sub: 'u1', establecimientoId: 'est-1', role: UserRole.ADMINISTRADOR },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('anula venta completada y revierte stock', async () => {
    const { service, prisma, inventory, billing, realtime } = buildService();
    prisma.sale.findFirst.mockResolvedValue({
      id: 's1',
      estado: SaleStatus.COMPLETADA,
      sellerId: 'u2',
      establishmentId: 'est-1',
      items: [
        {
          productId: 'p1',
          cantidad: new Prisma.Decimal(2),
          lotLines: [{ codigoLote: 'L1', cantidad: new Prisma.Decimal(2) }],
        },
      ],
      serie: 'B001',
      numero: '1',
      warehouseId: 'w1',
      cashSessionId: null,
      total: new Prisma.Decimal(10),
      archivedAt: null,
      documentType: 'BOLETA',
      _count: { returns: 0 },
      electronicDocument: null,
    });
    const result = await service.voidSale(
      's1',
      { reason: 'Error de caja' },
      { sub: 'u1', establecimientoId: 'est-1', role: UserRole.ADMINISTRADOR },
    );
    expect(result.ok).toBe(true);
    expect(prisma.sale.updateMany).toHaveBeenCalled();
    expect(inventory.executeAdjustmentDelta).toHaveBeenCalled();
    expect(billing.voidFromSale).toHaveBeenCalled();
    expect(realtime.emitStockUpdated).toHaveBeenCalledWith('est-1', 'w1');
  });

  it('sincroniza lote offline reportando errores por fila', async () => {
    const { service } = buildService();
    jest.spyOn(service, 'create').mockRejectedValueOnce(new Error('fallo POS'));
    const result = await service.syncOfflineBatch(
      {
        sales: [
          { offlineLocalId: 'off-1', sale: { warehouseId: 'w1', items: [], payments: [] } as never },
        ],
      },
      { sub: 'u1', establecimientoId: 'est-1' },
    );
    expect(result.failed).toBe(1);
    expect(result.results[0].error).toBe('fallo POS');
  });

  it('crea solicitud de anulación para cajero', async () => {
    const { service, prisma } = buildService();
    prisma.sale.findFirst.mockResolvedValue({ id: 's1', estado: SaleStatus.COMPLETADA });
    prisma.saleVoidRequest.findUnique.mockResolvedValue(null);
    prisma.saleVoidRequest.upsert.mockResolvedValue({
      id: 'req-1',
      status: SaleVoidRequestStatus.PENDIENTE,
    });
    const result = await service.requestVoidSale(
      's1',
      { reason: 'Error de cobro' },
      { sub: 'u1', establecimientoId: 'est-1', role: UserRole.CAJERO },
    );
    expect('requestId' in result).toBe(true);
    if (!('requestId' in result)) return;
    expect(result.requestId).toBe('req-1');
  });

  it('rechaza solicitud de anulación duplicada', async () => {
    const { service, prisma } = buildService();
    prisma.sale.findFirst.mockResolvedValue({ id: 's1', estado: SaleStatus.COMPLETADA });
    prisma.saleVoidRequest.findUnique.mockResolvedValue({ status: SaleVoidRequestStatus.PENDIENTE });
    await expect(
      service.requestVoidSale(
        's1',
        { reason: 'Error' },
        { sub: 'u1', establecimientoId: 'est-1', role: UserRole.CAJERO },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza solicitud de anulación', async () => {
    const { service, prisma } = buildService();
    prisma.saleVoidRequest.findFirst.mockResolvedValue({
      id: 'req-1',
      status: SaleVoidRequestStatus.PENDIENTE,
    });
    prisma.saleVoidRequest.update.mockResolvedValue({});
    const result = await service.rejectVoidRequest(
      'req-1',
      'Sin sustento',
      { sub: 'admin', establecimientoId: 'est-1', role: UserRole.ADMINISTRADOR },
    );
    expect(result.ok).toBe(true);
  });

  it('registra devolución parcial de venta', async () => {
    const { service, prisma, inventory, realtime } = buildService();
    prisma.sale.findFirst.mockResolvedValue({
      id: 's1',
      estado: SaleStatus.COMPLETADA,
      documentType: 'BOLETA',
      archivedAt: null,
      warehouseId: 'w1',
      cashSessionId: null,
      serie: 'B001',
      numero: '1',
      electronicDocument: null,
      returns: [],
      items: [
        {
          id: 'si1',
          productId: 'p1',
          cantidad: new Prisma.Decimal(2),
          totalLinea: new Prisma.Decimal(20),
          lotLines: [],
        },
      ],
    });
    prisma.saleReturn.create.mockResolvedValue({ id: 'ret-1' });
    prisma.sale.update.mockResolvedValue({});
    const result = await service.createReturn(
      's1',
      { motivo: 'Cliente devolvió 1 unidad', items: [{ saleItemId: 'si1', quantity: 1 }] },
      { sub: 'u1', establecimientoId: 'est-1' },
    );
    expect(result.saleReturnId).toBe('ret-1');
    expect(inventory.executeAdjustmentDelta).toHaveBeenCalled();
    expect(realtime.emitStockUpdated).toHaveBeenCalledWith('est-1', 'w1');
  });

  it('expone catálogo POS con stock vendible', async () => {
    const { service, prisma, lotAllocation } = buildService();
    prisma.product.findMany.mockResolvedValue([
      {
        id: 'p1',
        nombre: 'Paracetamol',
        codigoInterno: 'PARA',
        codigoBarra: '123',
        precioUnitarioVenta: new Prisma.Decimal(5),
        incluyeIgvVenta: true,
        necesitaRecetaMedica: false,
        manejaLotes: false,
        esControlado: false,
        imagenArchivoId: null,
        saleTaxAffectation: { codigo: '10' },
        warehouseStocks: [{ cantidad: new Prisma.Decimal(3) }],
      },
    ]);
    const rows = await service.posCatalog('est-1', 'w1', 'para');
    expect(rows).toHaveLength(1);
    expect(rows[0].stock).toBe('3');
  });
});
