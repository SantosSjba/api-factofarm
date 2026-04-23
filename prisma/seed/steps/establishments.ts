import type { PrismaClient } from '../../../src/generated/prisma/client';
import { establishmentsData } from '../data/establishments';

export async function seedEstablishments(prisma: PrismaClient): Promise<void> {
  for (const row of establishmentsData) {
    const establishment = await prisma.establishment.upsert({
      where: { codigo: row.codigo },
      update: {
        nombre: row.nombre,
        activo: row.activo,
        pais: row.pais ?? 'PERU',
        direccionFiscal: row.direccionFiscal,
        correoContacto: row.correoContacto,
      },
      create: {
        nombre: row.nombre,
        codigo: row.codigo,
        activo: row.activo,
        pais: row.pais ?? 'PERU',
        direccionFiscal: row.direccionFiscal,
        correoContacto: row.correoContacto,
      },
      select: { id: true },
    });

    for (const serie of row.series ?? []) {
      await prisma.establishmentSeries.upsert({
        where: {
          establishmentId_documentType_numero: {
            establishmentId: establishment.id,
            documentType: serie.documentType,
            numero: serie.numero,
          },
        },
        update: { esContingencia: serie.esContingencia ?? false },
        create: {
          establishmentId: establishment.id,
          documentType: serie.documentType,
          numero: serie.numero,
          esContingencia: serie.esContingencia ?? false,
        },
      });
    }
  }
}
