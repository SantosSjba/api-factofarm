import { ProductSerialStatus } from '../../../src/generated/prisma/client';
import { productSerialsSeed } from '../data/series';
import type { SeedDb } from '../types';

export async function seedSeries(prisma: SeedDb) {
  const defaultWarehouse = await prisma.warehouse.findFirst({
    where: { deletedAt: null },
    orderBy: { createdAt: 'asc' },
    select: { id: true, nombre: true },
  });
  if (!defaultWarehouse) return;

  for (const row of productSerialsSeed) {
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

    await prisma.productSerial.upsert({
      where: { warehouseId_serie: { warehouseId, serie: row.serie } },
      update: {
        productId: product.id,
        warehouseId,
        estado: (row.estado as ProductSerialStatus | undefined) ?? ProductSerialStatus.DISPONIBLE,
        vendido: row.vendido ?? false,
      },
      create: {
        serie: row.serie,
        productId: product.id,
        warehouseId,
        estado: (row.estado as ProductSerialStatus | undefined) ?? ProductSerialStatus.DISPONIBLE,
        vendido: row.vendido ?? false,
      },
    });
  }
}
