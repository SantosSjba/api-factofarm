import { Prisma } from '../../../src/generated/prisma/client';
import type { PrismaClient } from '../../../src/generated/prisma/client';
import { productsData } from '../data/products';

export async function seedProducts(prisma: PrismaClient, demoTenantId: string): Promise<void> {
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
      where: { tenantId: demoTenantId, deletedAt: null },
      select: { id: true, codigo: true },
      orderBy: { codigo: 'asc' },
    }),
    prisma.category.findMany({
      where: { tenantId: demoTenantId, deletedAt: null },
      select: { id: true, nombre: true },
    }),
    prisma.brand.findMany({
      where: { tenantId: demoTenantId, deletedAt: null },
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
    throw new Error('No hay establecimientos del tenant demo para seed de productos.');
  }

  // Un almacén "principal" por sede (evita duplicar stock en almacenes demo redundantes).
  const principalWarehouses = await prisma.warehouse.findMany({
    where: {
      establishmentId: { in: establishments.map((e) => e.id) },
      deletedAt: null,
      nombre: 'Almacén principal',
    },
    orderBy: [{ establishmentId: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, establishmentId: true },
  });

  const defaultLocation = await prisma.productLocation.findFirst({
    where: { establishmentId: branch.id, deletedAt: null },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  const defaultWarehouse =
    principalWarehouses.find((w) => w.establishmentId === branch.id) ?? principalWarehouses[0];

  if (!defaultWarehouse) {
    throw new Error('No hay almacén principal para seed de productos.');
  }

  const categoryByName = new Map(categories.map((c) => [c.nombre.toUpperCase(), c.id]));
  const brandByName = new Map(brands.map((b) => [b.nombre.toUpperCase(), b.id]));
  const attrByName = new Map(attrTypes.map((a) => [a.nombre.toUpperCase(), a.id]));

  const syncWarehouseCatalog = async (
    productId: string,
    warehouseId: string,
    row: (typeof productsData)[number],
  ) => {
    await prisma.productWarehouseStock.upsert({
      where: { productId_warehouseId: { productId, warehouseId } },
      update: { cantidad: new Prisma.Decimal(row.stockInicial ?? '0') },
      create: {
        productId,
        warehouseId,
        cantidad: new Prisma.Decimal(row.stockInicial ?? '0'),
      },
    });
    await prisma.productWarehousePrice.upsert({
      where: { productId_warehouseId: { productId, warehouseId } },
      update: { precio: new Prisma.Decimal(row.precioUnitarioVenta) },
      create: {
        productId,
        warehouseId,
        precio: new Prisma.Decimal(row.precioUnitarioVenta),
      },
    });
  };

  for (const row of productsData) {
    const codigoInterno = row.codigoInterno.trim();
    const categoryId = row.categoryNombre
      ? (categoryByName.get(row.categoryNombre.trim().toUpperCase()) ?? null)
      : null;
    const brandId = row.brandNombre
      ? (brandByName.get(row.brandNombre.trim().toUpperCase()) ?? null)
      : null;

    const existing = await prisma.product.findFirst({
      where: { tenantId: demoTenantId, codigoInterno },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    const productData: Prisma.ProductUncheckedCreateInput = {
      tenantId: demoTenantId,
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

    // Stock demo solo en almacenes principales del tenant (una fila por sede).
    const syncedWarehouseIds = new Set<string>();
    for (const warehouse of principalWarehouses) {
      if (syncedWarehouseIds.has(warehouse.id)) continue;
      syncedWarehouseIds.add(warehouse.id);
      await syncWarehouseCatalog(product.id, warehouse.id, row);
    }

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
