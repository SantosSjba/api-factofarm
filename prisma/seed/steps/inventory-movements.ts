import { Prisma } from '../../../src/generated/prisma/client';
import { productLotStocksSeed } from '../data/inventory-movements';
import type { SeedDb } from '../types';

export async function seedInventoryMovements(prisma: SeedDb) {
  const defaultWarehouse = await prisma.warehouse.findFirst({
    where: { deletedAt: null },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  if (!defaultWarehouse) return;

  for (const row of productLotStocksSeed) {
    const product = await prisma.product.findFirst({
      where: { codigoInterno: row.productCodigoInterno, deletedAt: null },
      select: { id: true },
    });
    if (!product) continue;

    const warehouse = row.warehouseNombre
      ? await prisma.warehouse.findFirst({
          where: { nombre: row.warehouseNombre, deletedAt: null },
          select: { id: true },
        })
      : null;
    const warehouseId = warehouse?.id ?? defaultWarehouse.id;
    const stock = new Prisma.Decimal(row.stock);

    await prisma.productLotStock.upsert({
      where: {
        productId_warehouseId_codigoLote: {
          productId: product.id,
          warehouseId,
          codigoLote: row.codigoLote,
        },
      },
      update: {
        stock,
        fechaVencimiento: row.fechaVencimiento ? new Date(row.fechaVencimiento) : null,
        deletedAt: null,
      },
      create: {
        productId: product.id,
        warehouseId,
        codigoLote: row.codigoLote,
        stock,
        fechaVencimiento: row.fechaVencimiento ? new Date(row.fechaVencimiento) : null,
      },
    });
  }
}
