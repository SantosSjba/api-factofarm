import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CompoundProductListQueryDto } from './dto/compound-product-list-query.dto';
import { CreateCompoundProductDto } from './dto/create-compound-product.dto';

const selectCompoundList = {
  id: true,
  nombre: true,
  nombreSecundario: true,
  descripcion: true,
  modelo: true,
  codigoSunat: true,
  codigoInterno: true,
  precioUnitarioVenta: true,
  precioUnitarioCompra: true,
  incluyeIgvVenta: true,
  totalPrecioCompraReferencia: true,
  categoryId: true,
  brandId: true,
  imagenArchivoId: true,
  unit: { select: { id: true, codigo: true, nombre: true } },
  currency: { select: { id: true, codigo: true, nombre: true } },
  category: { select: { id: true, nombre: true } },
  brand: { select: { id: true, nombre: true } },
} satisfies Prisma.CompoundProductSelect;

const selectCompoundDetail = {
  ...selectCompoundList,
  saleTaxAffectationId: true,
  plataformaId: true,
  items: {
    select: {
      id: true,
      productId: true,
      cantidad: true,
      precioUnitario: true,
      total: true,
      product: {
        select: {
          id: true,
          nombre: true,
          codigoInterno: true,
          descripcion: true,
          precioUnitarioVenta: true,
        },
      },
    },
    orderBy: { id: 'asc' },
  },
} satisfies Prisma.CompoundProductSelect;

function dec(v: Prisma.Decimal | null | undefined): string | null {
  if (v === null || v === undefined) return null;
  return v.toString();
}

@Injectable()
export class CompoundProductsService {
  constructor(private readonly prisma: PrismaService) {}

  listUnits() {
    return this.prisma.unitOfMeasure.findMany({
      where: { deletedAt: null },
      orderBy: { nombre: 'asc' },
      select: { id: true, codigo: true, nombre: true },
    });
  }

  listCurrencies() {
    return this.prisma.currency.findMany({
      where: { deletedAt: null },
      orderBy: { codigo: 'asc' },
      select: { id: true, codigo: true, nombre: true },
    });
  }

  listTaxAffectationTypes() {
    return this.prisma.taxAffectationType.findMany({
      where: { deletedAt: null },
      orderBy: { codigo: 'asc' },
      select: { id: true, codigo: true, descripcion: true },
    });
  }

  listPlatforms() {
    return this.prisma.compoundProductPlatform.findMany({
      where: { deletedAt: null, activo: true },
      orderBy: { nombre: 'asc' },
      select: { id: true, nombre: true },
    });
  }

  async list(query: CompoundProductListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const search = query.search?.trim();
    const field = (query.field ?? 'nombre').trim();

    const or: Prisma.CompoundProductWhereInput[] = [];
    if (search) {
      if (field === 'all' || field === 'nombre') {
        or.push({ nombre: { contains: search, mode: 'insensitive' } });
      }
      if (field === 'all' || field === 'codigoInterno') {
        or.push({ codigoInterno: { contains: search, mode: 'insensitive' } });
      }
      if (field === 'all' || field === 'descripcion') {
        or.push({ descripcion: { contains: search, mode: 'insensitive' } });
      }
    }

    const where: Prisma.CompoundProductWhereInput = {
      deletedAt: null,
      ...(or.length ? { OR: or } : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.compoundProduct.count({ where }),
      this.prisma.compoundProduct.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: selectCompoundList,
      }),
    ]);

    return {
      items: rows.map((row) => ({
        ...row,
        precioUnitarioVenta: row.precioUnitarioVenta.toString(),
        precioUnitarioCompra: row.precioUnitarioCompra.toString(),
        totalPrecioCompraReferencia: row.totalPrecioCompraReferencia.toString(),
        marcaNombre: row.brand?.nombre ?? null,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async getById(id: string) {
    return this.getByIdOrThrow(id);
  }

  async create(dto: CreateCompoundProductDto) {
    await this.validateReferences(dto);
    const normalizedItems = await this.normalizeItems(dto.items ?? []);
    if (!normalizedItems.length) {
      throw new BadRequestException('Debe agregar al menos un producto al compuesto.');
    }

    const totalRef = normalizedItems.reduce((acc, it) => acc.plus(it.total), new Prisma.Decimal(0));

    const created = await this.prisma.$transaction(async (tx) => {
      const row = await tx.compoundProduct.create({
        data: this.buildData(dto, totalRef),
        select: { id: true },
      });
      await tx.compoundProductItem.createMany({
        data: normalizedItems.map((it) => ({
          compoundProductId: row.id,
          productId: it.productId,
          cantidad: it.cantidad,
          precioUnitario: it.precioUnitario,
          total: it.total,
        })),
      });
      return row.id;
    });

    return this.getByIdOrThrow(created);
  }

  async update(id: string, dto: CreateCompoundProductDto) {
    const exists = await this.prisma.compoundProduct.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Producto compuesto no encontrado');

    await this.validateReferences(dto);
    const normalizedItems = await this.normalizeItems(dto.items ?? []);
    if (!normalizedItems.length) {
      throw new BadRequestException('Debe agregar al menos un producto al compuesto.');
    }

    const totalRef = normalizedItems.reduce((acc, it) => acc.plus(it.total), new Prisma.Decimal(0));

    await this.prisma.$transaction(async (tx) => {
      await tx.compoundProduct.update({
        where: { id },
        data: this.buildData(dto, totalRef),
      });
      await tx.compoundProductItem.deleteMany({ where: { compoundProductId: id } });
      await tx.compoundProductItem.createMany({
        data: normalizedItems.map((it) => ({
          compoundProductId: id,
          productId: it.productId,
          cantidad: it.cantidad,
          precioUnitario: it.precioUnitario,
          total: it.total,
        })),
      });
    });

    return this.getByIdOrThrow(id);
  }

  async remove(id: string) {
    const exists = await this.prisma.compoundProduct.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Producto compuesto no encontrado');
    await this.prisma.compoundProduct.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private buildData(dto: CreateCompoundProductDto, totalRef: Prisma.Decimal): Prisma.CompoundProductUncheckedCreateInput {
    return {
      nombre: dto.nombre.trim(),
      nombreSecundario: dto.nombreSecundario?.trim() || null,
      descripcion: dto.descripcion?.trim() || null,
      modelo: dto.modelo?.trim() || null,
      unitId: dto.unitId,
      currencyId: dto.currencyId,
      saleTaxAffectationId: dto.saleTaxAffectationId,
      precioUnitarioVenta: new Prisma.Decimal(dto.precioUnitarioVenta),
      incluyeIgvVenta: dto.incluyeIgvVenta ?? true,
      plataformaId: dto.plataformaId || null,
      codigoSunat: dto.codigoSunat?.trim() || null,
      codigoInterno: dto.codigoInterno?.trim() || null,
      precioUnitarioCompra: new Prisma.Decimal(dto.precioUnitarioCompra),
      totalPrecioCompraReferencia:
        dto.totalPrecioCompraReferencia !== undefined
          ? new Prisma.Decimal(dto.totalPrecioCompraReferencia)
          : totalRef,
      categoryId: dto.categoryId || null,
      brandId: dto.brandId || null,
      imagenArchivoId: dto.imagenArchivoId || null,
    };
  }

  private async getByIdOrThrow(id: string) {
    const row = await this.prisma.compoundProduct.findFirst({
      where: { id, deletedAt: null },
      select: selectCompoundDetail,
    });
    if (!row) throw new NotFoundException('Producto compuesto no encontrado');

    return {
      ...row,
      precioUnitarioVenta: row.precioUnitarioVenta.toString(),
      precioUnitarioCompra: row.precioUnitarioCompra.toString(),
      totalPrecioCompraReferencia: row.totalPrecioCompraReferencia.toString(),
      marcaNombre: row.brand?.nombre ?? null,
      items: row.items.map((it) => ({
        ...it,
        cantidad: it.cantidad.toString(),
        precioUnitario: it.precioUnitario.toString(),
        total: it.total.toString(),
        product: {
          ...it.product,
          precioUnitarioVenta: it.product.precioUnitarioVenta.toString(),
        },
      })),
    };
  }

  private async normalizeItems(items: { productId: string; cantidad: number; precioUnitario?: number }[]) {
    if (!items.length) return [];
    const ids = Array.from(new Set(items.map((x) => x.productId)));
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids }, deletedAt: null },
      select: { id: true, precioUnitarioVenta: true },
    });
    const productById = new Map(products.map((p) => [p.id, p]));
    const normalized: { productId: string; cantidad: Prisma.Decimal; precioUnitario: Prisma.Decimal; total: Prisma.Decimal }[] = [];

    for (const item of items) {
      const product = productById.get(item.productId);
      if (!product) throw new BadRequestException('Uno de los productos agregados no existe.');
      const cantidad = new Prisma.Decimal(item.cantidad);
      if (cantidad.lte(0)) throw new BadRequestException('La cantidad del detalle debe ser mayor a 0.');
      const precioUnitario = new Prisma.Decimal(
        item.precioUnitario !== undefined ? item.precioUnitario : product.precioUnitarioVenta.toNumber(),
      );
      if (precioUnitario.lt(0)) throw new BadRequestException('El precio unitario del detalle no puede ser negativo.');
      normalized.push({
        productId: item.productId,
        cantidad,
        precioUnitario,
        total: cantidad.mul(precioUnitario),
      });
    }
    return normalized;
  }

  private async validateReferences(dto: CreateCompoundProductDto) {
    const checks: Promise<unknown>[] = [];
    checks.push(
      this.prisma.unitOfMeasure.findFirst({ where: { id: dto.unitId, deletedAt: null }, select: { id: true } }).then((x) => {
        if (!x) throw new BadRequestException('Unidad no encontrada.');
      }),
    );
    checks.push(
      this.prisma.currency.findFirst({ where: { id: dto.currencyId, deletedAt: null }, select: { id: true } }).then((x) => {
        if (!x) throw new BadRequestException('Moneda no encontrada.');
      }),
    );
    checks.push(
      this.prisma.taxAffectationType
        .findFirst({ where: { id: dto.saleTaxAffectationId, deletedAt: null }, select: { id: true } })
        .then((x) => {
          if (!x) throw new BadRequestException('Tipo de afectación no encontrado.');
        }),
    );
    if (dto.plataformaId) {
      checks.push(
        this.prisma.compoundProductPlatform
          .findFirst({ where: { id: dto.plataformaId, deletedAt: null }, select: { id: true } })
          .then((x) => {
            if (!x) throw new BadRequestException('Plataforma no encontrada.');
          }),
      );
    }
    if (dto.categoryId) {
      checks.push(
        this.prisma.category.findFirst({ where: { id: dto.categoryId, deletedAt: null }, select: { id: true } }).then((x) => {
          if (!x) throw new BadRequestException('Categoría no encontrada.');
        }),
      );
    }
    if (dto.brandId) {
      checks.push(
        this.prisma.brand.findFirst({ where: { id: dto.brandId, deletedAt: null }, select: { id: true } }).then((x) => {
          if (!x) throw new BadRequestException('Marca no encontrada.');
        }),
      );
    }
    await Promise.all(checks);
  }
}
