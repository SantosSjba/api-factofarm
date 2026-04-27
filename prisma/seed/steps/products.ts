import { Prisma } from '../../../src/generated/prisma/client';
import type { PrismaClient } from '../../../src/generated/prisma/client';
import { productsData } from '../data/products';

export async function seedProducts(prisma: PrismaClient): Promise<void> {
  const [unit, currency, saleTax, establishments, categories, brands, attrTypes] = await Promise.all([
    prisma.unitOfMeasure.findFirst({
      where: { codigo: 'NIU', deletedAt: null },
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
    prisma.establishment.findMany({
      where: { deletedAt: null },
      select: { id: true, codigo: true },
      orderBy: { codigo: 'asc' },
    }),
    prisma.category.findMany({
      where: { deletedAt: null },
      select: { id: true, nombre: true },
    }),
    prisma.brand.findMany({
      where: { deletedAt: null },
      select: { id: true, nombre: true },
    }),
    prisma.productAttributeType.findMany({
      where: { deletedAt: null },
      select: { id: true, nombre: true },
    }),
  ]);

  if (!unit || !currency || !saleTax) {
    throw new Error('Faltan catálogos base para seed de productos (NIU/PEN/IGV 10).');
  }

  const branch = establishments.find((e) => e.codigo === '0001') ?? establishments[0];
  if (!branch) {
    throw new Error('No hay establecimientos para seed de productos.');
  }

  const [defaultWarehouse, defaultLocation] = await Promise.all([
    prisma.warehouse.findFirst({
      where: { establishmentId: branch.id, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    }),
    prisma.productLocation.findFirst({
      where: { establishmentId: branch.id, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    }),
  ]);

  if (!defaultWarehouse) {
    throw new Error('No hay almacén para seed de productos.');
  }

  const categoryByName = new Map(categories.map((c) => [c.nombre.toUpperCase(), c.id]));
  const brandByName = new Map(brands.map((b) => [b.nombre.toUpperCase(), b.id]));
  const attrByName = new Map(attrTypes.map((a) => [a.nombre.toUpperCase(), a.id]));

  for (const row of productsData) {
    const codigoInterno = row.codigoInterno.trim();
    const categoryId = row.categoryNombre
      ? (categoryByName.get(row.categoryNombre.trim().toUpperCase()) ?? null)
      : null;
    const brandId = row.brandNombre
      ? (brandByName.get(row.brandNombre.trim().toUpperCase()) ?? null)
      : null;

    const existing = await prisma.product.findFirst({
      where: { codigoInterno },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    const productData: Prisma.ProductUncheckedCreateInput = {
      nombre: row.nombre.trim(),
      descripcion: row.descripcion?.trim() || null,
      codigoInterno,
      codigoBarra: row.codigoBarra?.trim() || null,
      marcaLaboratorio: row.marcaLaboratorio?.trim() || null,
      unitId: unit.id,
      currencyId: currency.id,
      saleTaxAffectationId: saleTax.id,
      purchaseTaxAffectationId: saleTax.id,
      precioUnitarioVenta: new Prisma.Decimal(row.precioUnitarioVenta),
      precioUnitarioCompra:
        row.precioUnitarioCompra !== undefined
          ? new Prisma.Decimal(row.precioUnitarioCompra)
          : null,
      incluyeIgvVenta: row.incluyeIgvVenta ?? true,
      incluyeIgvCompra: true,
      stockMinimo: row.stockMinimo ?? 1,
      categoryId,
      brandId,
      productLocationId: defaultLocation?.id ?? null,
      defaultWarehouseId: defaultWarehouse.id,
      habilitado: true,
      deletedAt: null,
    };

    const product = existing
      ? await prisma.product.update({
          where: { id: existing.id },
          data: productData,
          select: { id: true },
        })
      : await prisma.product.create({
          data: productData,
          select: { id: true },
        });

    await prisma.productWarehouseStock.upsert({
      where: {
        productId_warehouseId: {
          productId: product.id,
          warehouseId: defaultWarehouse.id,
        },
      },
      update: {
        cantidad: new Prisma.Decimal(row.stockInicial ?? '0'),
      },
      create: {
        productId: product.id,
        warehouseId: defaultWarehouse.id,
        cantidad: new Prisma.Decimal(row.stockInicial ?? '0'),
      },
    });

    await prisma.productWarehousePrice.upsert({
      where: {
        productId_warehouseId: {
          productId: product.id,
          warehouseId: defaultWarehouse.id,
        },
      },
      update: {
        precio: new Prisma.Decimal(row.precioUnitarioVenta),
      },
      create: {
        productId: product.id,
        warehouseId: defaultWarehouse.id,
        precio: new Prisma.Decimal(row.precioUnitarioVenta),
      },
    });

    await prisma.productPresentation.deleteMany({ where: { productId: product.id } });
    await prisma.productPresentation.create({
      data: {
        productId: product.id,
        orden: 0,
        unitId: unit.id,
        descripcion: row.presentacionDescripcion?.trim() || null,
        factor: new Prisma.Decimal('1'),
        precio1: new Prisma.Decimal(row.precioUnitarioVenta),
        precio2: new Prisma.Decimal(row.precioUnitarioVenta),
        precio3: new Prisma.Decimal(row.precioUnitarioVenta),
      },
    });

    const observacionAttrId = attrByName.get('OBSERVACIÓN') ?? attrByName.get('OBSERVACION');
    await prisma.productAttribute.deleteMany({ where: { productId: product.id } });
    if (observacionAttrId && row.attributeObservacion?.trim()) {
      await prisma.productAttribute.create({
        data: {
          productId: product.id,
          attributeTypeId: observacionAttrId,
          descripcion: row.attributeObservacion.trim(),
        },
      });
    }
  }
}
