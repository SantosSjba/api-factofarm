import type { PrismaClient } from '../../../src/generated/prisma/client';
import { brandsData } from '../data/brands';

export async function seedBrands(prisma: PrismaClient): Promise<void> {
  for (const row of brandsData) {
    const nombre = row.nombre.trim().toUpperCase();
    if (!nombre) continue;

    await prisma.brand.upsert({
      where: { nombre },
      update: { nombre, deletedAt: null },
      create: { nombre },
    });
  }
}
