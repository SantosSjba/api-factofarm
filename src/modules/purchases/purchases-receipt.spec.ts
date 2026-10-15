import { Prisma, PurchaseOrderStatus } from '../../generated/prisma/client';
import { PurchasesService } from './purchases.service';

describe('Recepciones de compra', () => {
  it('rechaza la suma de líneas repetidas que exceda la orden antes de crear movimientos', async () => {
    const prisma = {
      purchaseOrder: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'po',
          estado: PurchaseOrderStatus.ENVIADA,
          items: [
            {
              id: 'item',
              productId: 'product',
              cantidadPedida: new Prisma.Decimal(5),
              cantidadRecibida: new Prisma.Decimal(0),
              precioUnitario: new Prisma.Decimal(1),
            },
          ],
        }),
      },
      inventoryTransferReason: {
        findFirst: jest.fn().mockResolvedValue({ id: 'reason' }),
      },
      product: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'product',
            manejaLotes: false,
            incluyeIgvCompra: true,
            saleTaxAffectation: { codigo: '10' },
          },
        ]),
      },
      $transaction: jest.fn(),
    };
    const service = new PurchasesService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
    );
    await expect(
      service.createGoodsReceipt('po', 'est', 'actor', {
        items: [
          { purchaseOrderItemId: 'item', quantity: 3 },
          { purchaseOrderItemId: 'item', quantity: 3 },
        ],
      }),
    ).rejects.toThrow(/excede lo pendiente/);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
