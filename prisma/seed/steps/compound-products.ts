import { Prisma } from '../../../src/generated/prisma/client';
import type { PrismaClient } from '../../../src/generated/prisma/client';
import { compoundProductsData, compoundProductPlatformsData } from '../data/compound-products';

export async function seedCompoundProducts(prisma: PrismaClient): Promise<void> {
  for (const row of compoundProductPlatformsData) {
    const found = await prisma.compoundProductPlatform.findFirst({
      where: { nombre: row.nombre.trim() },
      select: { id: true },
    });
    if (found) {
      await prisma.compoundProductPlatform.update({
        where: { id: found.id },
        data: { activo: true, deletedAt: null },
      });
    } else {
      await prisma.compoundProductPlatform.create({
        data: { nombre: row.nombre.trim(), activo: true },
      });
    }
  }

  const [unit, currency, saleTax, categories, brands, platforms, products] = await Promise.all([
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
    prisma.category.findMany({
      where: { deletedAt: null },
      select: { id: true, nombre: true },
    }),
    prisma.brand.findMany({
      where: { deletedAt: null },
      select: { id: true, nombre: true },
    }),
    prisma.compoundProductPlatform.findMany({
      where: { deletedAt: null, activo: true },
      select: { id: true, nombre: true },
    }),
    prisma.product.findMany({
      where: { deletedAt: null },
      select: { id: true, codigoInterno: true, precioUnitarioVenta: true, nombre: true },
    }),
  ]);

  if (!unit || !currency || !saleTax) {
    throw new Error('Faltan catálogos base para seed de productos compuestos (NIU/PEN/IGV 10).');
  }

  const categoryByName = new Map(categories.map((x) => [x.nombre.trim().toUpperCase(), x.id]));
  const brandByName = new Map(brands.map((x) => [x.nombre.trim().toUpperCase(), x.id]));
  const platformByName = new Map(platforms.map((x) => [x.nombre.trim().toUpperCase(), x.id]));
  const productByCode = new Map(products.map((x) => [(x.codigoInterno ?? '').trim().toUpperCase(), x]));

  for (const row of compoundProductsData) {
    const code = row.codigoInterno.trim();
    const categoryId = row.categoryNombre ? (categoryByName.get(row.categoryNombre.trim().toUpperCase()) ?? null) : null;
    const brandId = row.brandNombre ? (brandByName.get(row.brandNombre.trim().toUpperCase()) ?? null) : null;
    const plataformaId = row.plataformaNombre
      ? (platformByName.get(row.plataformaNombre.trim().toUpperCase()) ?? null)
      : null;

    const parsedItems = row.items
      .map((it) => {
        const product = productByCode.get(it.productCodigoInterno.trim().toUpperCase());
        if (!product) return null;
        const cantidad = new Prisma.Decimal(it.cantidad);
        const precioUnitario = new Prisma.Decimal(it.precioUnitario ?? product.precioUnitarioVenta.toString());
        const total = cantidad.mul(precioUnitario);
        return {
          productId: product.id,
          cantidad,
          precioUnitario,
          total,
        };
      })
      .filter((x): x is { productId: string; cantidad: Prisma.Decimal; precioUnitario: Prisma.Decimal; total: Prisma.Decimal } => !!x);

    const totalRef = parsedItems.reduce((acc, it) => acc.plus(it.total), new Prisma.Decimal(0));

    const existing = await prisma.compoundProduct.findFirst({
      where: { codigoInterno: code, deletedAt: null },
      select: { id: true },
    });

    const data: Prisma.CompoundProductUncheckedCreateInput = {
      codigoInterno: code,
      nombre: row.nombre.trim(),
      nombreSecundario: row.nombreSecundario?.trim() || null,
      descripcion: row.descripcion?.trim() || null,
      modelo: row.modelo?.trim() || null,
      unitId: unit.id,
      currencyId: currency.id,
      saleTaxAffectationId: saleTax.id,
      precioUnitarioVenta: new Prisma.Decimal(row.precioUnitarioVenta),
      incluyeIgvVenta: true,
      plataformaId,
      codigoSunat: row.codigoSunat?.trim() || null,
      precioUnitarioCompra: new Prisma.Decimal(row.precioUnitarioCompra),
      totalPrecioCompraReferencia: totalRef,
      categoryId,
      brandId,
      deletedAt: null,
    };

    const compound = existing
      ? await prisma.compoundProduct.update({
          where: { id: existing.id },
          data,
          select: { id: true },
        })
      : await prisma.compoundProduct.create({
          data,
          select: { id: true },
        });

    await prisma.compoundProductItem.deleteMany({ where: { compoundProductId: compound.id } });
    if (parsedItems.length) {
      await prisma.compoundProductItem.createMany({
        data: parsedItems.map((it) => ({
          compoundProductId: compound.id,
          productId: it.productId,
          cantidad: it.cantidad,
          precioUnitario: it.precioUnitario,
          total: it.total,
        })),
      });
    }
  }
}
