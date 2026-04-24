import type { PrismaClient } from '../../../src/generated/prisma/client';
import { customerTypesData } from '../data/customer-types';

export async function seedCustomerTypes(prisma: PrismaClient): Promise<void> {
  for (const row of customerTypesData) {
    const descripcion = row.descripcion.trim().toUpperCase();
    if (!descripcion) continue;

    await prisma.customerType.upsert({
      where: { descripcion },
      update: { descripcion, deletedAt: null },
      create: { descripcion },
    });
  }
}
