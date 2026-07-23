import { BadRequestException } from '@nestjs/common';
import { EntityIntegrityService } from './entity-integrity.service';

describe('EntityIntegrityService', () => {
  const prisma = {
    saleItem: { count: jest.fn() },
    productWarehouseStock: { aggregate: jest.fn(), count: jest.fn() },
    productLotStock: { count: jest.fn() },
    productSerial: { count: jest.fn(), findFirst: jest.fn() },
    purchaseOrderItem: { count: jest.fn() },
    goodsReceiptItem: { count: jest.fn() },
    compoundProductItem: { count: jest.fn() },
    sale: { count: jest.fn() },
    inventoryInboundMovement: { count: jest.fn() },
    inventoryStockTransfer: { count: jest.fn() },
    goodsReceipt: { count: jest.fn() },
    purchaseOrder: { count: jest.fn() },
    deliveryOrder: { count: jest.fn() },
    accountReceivable: { count: jest.fn() },
    accountPayable: { count: jest.fn() },
    electronicDocument: { count: jest.fn() },
    cashSession: { count: jest.fn() },
    user: { count: jest.fn(), findFirst: jest.fn() },
    establishmentSeries: { findFirst: jest.fn(), count: jest.fn() },
    product: { count: jest.fn() },
    service: { count: jest.fn() },
    compoundProduct: { count: jest.fn() },
    productPresentation: { count: jest.fn() },
    category: { count: jest.fn() },
    customer: { count: jest.fn() },
    agreementBillingStatement: { count: jest.fn() },
    establishment: { count: jest.fn() },
  };

  const service = new EntityIntegrityService(prisma as never);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('bloquea eliminar producto con ventas', async () => {
    prisma.saleItem.count.mockResolvedValue(2);
    prisma.productWarehouseStock.aggregate.mockResolvedValue({ _count: { _all: 0 } });
    prisma.productLotStock.count.mockResolvedValue(0);
    prisma.productSerial.count.mockResolvedValue(0);
    prisma.purchaseOrderItem.count.mockResolvedValue(0);
    prisma.goodsReceiptItem.count.mockResolvedValue(0);
    prisma.compoundProductItem.count.mockResolvedValue(0);

    await expect(service.assertCanDeleteProduct('p1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('permite eliminar producto sin dependencias', async () => {
    prisma.saleItem.count.mockResolvedValue(0);
    prisma.productWarehouseStock.aggregate.mockResolvedValue({ _count: { _all: 0 } });
    prisma.productLotStock.count.mockResolvedValue(0);
    prisma.productSerial.count.mockResolvedValue(0);
    prisma.purchaseOrderItem.count.mockResolvedValue(0);
    prisma.goodsReceiptItem.count.mockResolvedValue(0);
    prisma.compoundProductItem.count.mockResolvedValue(0);

    await expect(service.assertCanDeleteProduct('p1')).resolves.toBeUndefined();
  });

  it('bloquea eliminar cliente con CxC pendiente', async () => {
    prisma.accountReceivable.count.mockResolvedValue(1);
    prisma.deliveryOrder.count.mockResolvedValue(0);
    await expect(service.assertCanDeleteCustomer('c1')).rejects.toThrow(/cuentas por cobrar/);
  });

  it('bloquea mutar serie vendida', () => {
    expect(() =>
      service.assertCanMutateProductSerial({
        estado: 'VENDIDO' as never,
        vendido: true,
      }),
    ).toThrow(/vendida o reservada/);
  });

  it('bloquea segunda sesión abierta en la misma caja', async () => {
    prisma.cashSession = { count: jest.fn().mockResolvedValue(1) };
    await expect(service.assertCashRegisterHasNoOpenSession('caja-1')).rejects.toThrow(
      /sesión abierta/,
    );
  });
});
