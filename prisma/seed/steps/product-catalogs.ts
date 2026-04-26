import type { PrismaClient } from '../../../src/generated/prisma/client';
import { currenciesData } from '../data/currencies';
import { productAttributeTypesData } from '../data/product-attribute-types';
import { productIscSystemsData } from '../data/product-isc-systems';
import { taxAffectationTypesData } from '../data/tax-affectation-types';
import { unitsOfMeasureData } from '../data/units-of-measure';

export async function seedProductCatalogs(prisma: PrismaClient): Promise<void> {
  for (const row of unitsOfMeasureData) {
    await prisma.unitOfMeasure.upsert({
      where: { codigo: row.codigo },
      update: { nombre: row.nombre, deletedAt: null },
      create: { codigo: row.codigo, nombre: row.nombre },
    });
  }

  for (const row of currenciesData) {
    await prisma.currency.upsert({
      where: { codigo: row.codigo },
      update: { nombre: row.nombre, deletedAt: null },
      create: { codigo: row.codigo, nombre: row.nombre },
    });
  }

  for (const row of taxAffectationTypesData) {
    await prisma.taxAffectationType.upsert({
      where: { codigo: row.codigo },
      update: { descripcion: row.descripcion, deletedAt: null },
      create: { codigo: row.codigo, descripcion: row.descripcion },
    });
  }

  for (const nombre of productAttributeTypesData) {
    await prisma.productAttributeType.upsert({
      where: { nombre },
      update: { deletedAt: null },
      create: { nombre },
    });
  }

  for (const row of productIscSystemsData) {
    await prisma.productIscSystem.upsert({
      where: { codigo: row.codigo },
      update: { nombre: row.nombre, activo: true, deletedAt: null },
      create: { codigo: row.codigo, nombre: row.nombre, activo: true },
    });
  }

  const establishments = await prisma.establishment.findMany({
    where: { deletedAt: null },
    select: { id: true, codigo: true, nombre: true },
    orderBy: { codigo: 'asc' },
  });

  for (const est of establishments) {
    const warehouseNombre =
      est.codigo === '0001' || est.nombre.toLowerCase().includes('sucursal')
        ? 'Almacén - SUCURSAL'
        : 'Almacén Oficina Principal';

    await prisma.warehouse.upsert({
      where: {
        establishmentId_nombre: {
          establishmentId: est.id,
          nombre: warehouseNombre,
        },
      },
      update: { deletedAt: null },
      create: {
        establishmentId: est.id,
        nombre: warehouseNombre,
      },
    });

    await prisma.productLocation.upsert({
      where: {
        establishmentId_nombre: {
          establishmentId: est.id,
          nombre: 'UNICO',
        },
      },
      update: { deletedAt: null },
      create: {
        establishmentId: est.id,
        nombre: 'UNICO',
      },
    });

    if (est.codigo === '0001' || est.nombre.toLowerCase().includes('sucursal')) {
      await prisma.productLocation.upsert({
        where: {
          establishmentId_nombre: {
            establishmentId: est.id,
            nombre: 'ANAQUEL 3',
          },
        },
        update: { deletedAt: null },
        create: {
          establishmentId: est.id,
          nombre: 'ANAQUEL 3',
        },
      });
    }
  }
}
