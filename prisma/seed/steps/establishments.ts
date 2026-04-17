import type { PrismaClient } from '../../../src/generated/prisma/client';
import { establishmentsData } from '../data/establishments';

export async function seedEstablishments(prisma: PrismaClient): Promise<void> {
  for (const row of establishmentsData) {
    await prisma.establishment.upsert({
      where: { codigo: row.codigo },
      update: {},
      create: row,
    });
  }
}
