import type { PrismaClient } from '../../../src/generated/prisma/client';
import { customerTypesData } from '../data/customer-types';

export async function seedCustomerTypes(prisma: PrismaClient, demoTenantId: string): Promise<void> {
  for (const row of customerTypesData) {
    const descripcion = row.descripcion.trim().toUpperCase();
    if (!descripcion) continue;

    await prisma.customerType.upsert({
      where: { tenantId_descripcion: { tenantId: demoTenantId, descripcion } },
      update: { descripcion, deletedAt: null },
      create: { tenantId: demoTenantId, descripcion },
    });
  }
}
