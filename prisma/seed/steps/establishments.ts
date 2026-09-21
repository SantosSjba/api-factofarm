import type { PrismaClient } from '../../../src/generated/prisma/client';
import { establishmentsData } from '../data/establishments';

export async function seedEstablishments(
  prisma: PrismaClient,
  tenantId: string,
): Promise<void> {
  for (const row of establishmentsData) {
    const byCodigo = await prisma.establishment.findFirst({
      where: { codigo: row.codigo, deletedAt: null },
      select: { id: true, tenantId: true },
    });

    if (byCodigo && byCodigo.tenantId !== tenantId) {
      throw new Error(
        `Seed establecimientos: código ${row.codigo} ya pertenece a otro tenant (${byCodigo.tenantId}). No se sobrescribe tenantId.`,
      );
    }

    const establishment = byCodigo
      ? await prisma.establishment.update({
          where: { id: byCodigo.id },
          data: {
            nombre: row.nombre,
            activo: row.activo,
            pais: row.pais ?? 'PERU',
            direccionFiscal: row.direccionFiscal,
            correoContacto: row.correoContacto,
          },
          select: { id: true, nombre: true, codigo: true },
        })
      : await prisma.establishment.create({
          data: {
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

    if (establishment.codigo === '0000') {
      await prisma.warehouse.upsert({
        where: {
          establishmentId_nombre: {
            establishmentId: establishment.id,
            nombre: 'Almacén secundario',
          },
        },
        update: { deletedAt: null },
        create: {
          establishmentId: establishment.id,
          nombre: 'Almacén secundario',
        },
      });
    }

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
