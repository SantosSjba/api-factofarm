import type { PrismaClient } from '../../../src/generated/prisma/client';
import { brandsData } from '../data/brands';

export async function seedBrands(prisma: PrismaClient, demoTenantId: string): Promise<void> {
  for (const row of brandsData) {
    const nombre = row.nombre.trim().toUpperCase();
    if (!nombre) continue;

    await prisma.brand.upsert({
      where: { tenantId_nombre: { tenantId: demoTenantId, nombre } },
      update: { nombre, deletedAt: null },
      create: { tenantId: demoTenantId, nombre },
    });
  }
}
