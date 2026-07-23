import type { PrismaClient } from '../../../src/generated/prisma/client';
import { establishmentsData } from '../data/establishments';

export async function seedEstablishments(
  prisma: PrismaClient,
  tenantId: string,
): Promise<void> {
  for (const row of establishmentsData) {
    const establishment = await prisma.establishment.upsert({
      where: { codigo: row.codigo },
      update: {
        tenantId,
        nombre: row.nombre,
        activo: row.activo,
        pais: row.pais ?? 'PERU',
        direccionFiscal: row.direccionFiscal,
        correoContacto: row.correoContacto,
      },
      create: {
        tenantId,
        nombre: row.nombre,
        codigo: row.codigo,
        activo: row.activo,
        pais: row.pais ?? 'PERU',
        direccionFiscal: row.direccionFiscal,
        correoContacto: row.correoContacto,
      },
      select: { id: true, nombre: true, codigo: true },
    });

    await prisma.warehouse.upsert({
      where: {
        establishmentId_nombre: {
          establishmentId: establishment.id,
          nombre: 'Almacén principal',
        },
      },
      update: { deletedAt: null },
      create: {
        establishmentId: establishment.id,
        nombre: 'Almacén principal',
      },
    });

    await prisma.productLocation.upsert({
      where: {
        establishmentId_nombre: {
          establishmentId: establishment.id,
          nombre: 'Anaquel general',
        },
      },
      update: { deletedAt: null },
      create: {
        establishmentId: establishment.id,
        nombre: 'Anaquel general',
      },
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
