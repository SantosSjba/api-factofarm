import { Prisma } from '../../../src/generated/prisma/client';
import type { PrismaClient } from '../../../src/generated/prisma/client';
import { servicesData } from '../data/services';

export async function seedServices(prisma: PrismaClient): Promise<void> {
  const [unit, currency, saleTax] = await Promise.all([
    prisma.unitOfMeasure.findFirst({
      where: { codigo: 'ZZ', deletedAt: null },
      select: { id: true },
    }),
    prisma.currency.findFirst({
      where: { codigo: 'PEN', deletedAt: null },
      select: { id: true },
    }),
    prisma.taxAffectationType.findFirst({
      where: { codigo: '10', deletedAt: null },
      select: { id: true },
    }),
  ]);

  if (!unit || !currency || !saleTax) {
    throw new Error('Faltan catálogos base para seed de servicios (ZZ/PEN/IGV 10).');
  }

  for (const row of servicesData) {
    const existing = await prisma.service.findFirst({
      where: { codigoInterno: row.codigoInterno, deletedAt: null },
      select: { id: true },
    });

    const data: Prisma.ServiceUncheckedCreateInput = {
      nombre: row.nombre.trim(),
      descripcion: row.descripcion?.trim() || null,
      codigoInterno: row.codigoInterno.trim(),
      unitId: unit.id,
      currencyId: currency.id,
      saleTaxAffectationId: saleTax.id,
      purchaseTaxAffectationId: saleTax.id,
      precioUnitarioVenta: new Prisma.Decimal(row.precioUnitarioVenta),
      incluyeIgvVenta: row.incluyeIgvVenta ?? true,
      incluyeIgvCompra: row.incluyeIgvVenta ?? true,
      generico: row.generico ?? false,
      necesitaRecetaMedica: row.necesitaRecetaMedica ?? false,
      habilitado: true,
      deletedAt: null,
    };

    if (existing) {
      await prisma.service.update({ where: { id: existing.id }, data });
    } else {
      await prisma.service.create({ data });
    }
  }
}
