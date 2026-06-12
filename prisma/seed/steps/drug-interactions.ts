import type { PrismaClient } from '../../../src/generated/prisma/client';
import { drugInteractionsData } from '../data/drug-interactions';

export async function seedDrugInteractions(prisma: PrismaClient): Promise<void> {
  for (const row of drugInteractionsData) {
    await prisma.drugInteraction.upsert({
      where: {
        principioA_principioB: {
          principioA: row.principioA,
          principioB: row.principioB,
        },
      },
      update: {
        severidad: row.severidad,
        descripcion: row.descripcion,
        recomendacion: row.recomendacion ?? null,
        deletedAt: null,
      },
      create: {
        principioA: row.principioA,
        principioB: row.principioB,
        severidad: row.severidad,
        descripcion: row.descripcion,
        recomendacion: row.recomendacion ?? null,
      },
    });
  }
}
