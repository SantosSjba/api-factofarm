import { ProductSerialStatus } from '../../../src/generated/prisma/client';
import { productSerialsSeed } from '../data/series';
import type { SeedDb } from '../types';

export async function seedSeries(prisma: SeedDb) {
  for (const row of productSerialsSeed) {
    const product = await prisma.product.findFirst({
      where: { codigoInterno: row.productCodigoInterno, deletedAt: null },
      select: { id: true },
    });
    if (!product) continue;

    await prisma.productSerial.upsert({
      where: { serie: row.serie },
      update: {
        productId: product.id,
        estado: (row.estado as ProductSerialStatus | undefined) ?? ProductSerialStatus.DISPONIBLE,
        vendido: row.vendido ?? false,
      },
      create: {
        serie: row.serie,
        productId: product.id,
        estado: (row.estado as ProductSerialStatus | undefined) ?? ProductSerialStatus.DISPONIBLE,
        vendido: row.vendido ?? false,
      },
    });
  }
}
