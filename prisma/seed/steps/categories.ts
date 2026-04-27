import type { PrismaClient } from '../../../src/generated/prisma/client';
import { categoriesData } from '../data/categories';

export async function seedCategories(prisma: PrismaClient): Promise<void> {
  for (const row of categoriesData) {
    const nombre = row.nombre.trim().toUpperCase();
    if (!nombre) continue;

    await prisma.category.upsert({
      where: { nombre },
      update: { nombre, deletedAt: null },
      create: { nombre },
    });
  }
}
