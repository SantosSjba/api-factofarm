import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import * as XLSX from 'xlsx';
import { CompoundProductListQueryDto } from './dto/compound-product-list-query.dto';
import { CreateCompoundProductDto } from './dto/create-compound-product.dto';
import { CompoundProductImportMode } from './dto/import-compound-products.dto';

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

  async importFromExcel(mode: CompoundProductImportMode, file: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new NotFoundException('Archivo no válido para importar');
    }
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const first = workbook.SheetNames[0];
    const sheet = workbook.Sheets[first];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
    if (!rows.length) {
      return { totalRows: 0, created: 0, updated: 0, errors: [] as string[] };
    }
    if (mode === 'DETALLE_PRODUCTOS_COMPUESTOS') {
      return this.importCompoundDetailRows(rows);
    }
    return this.importCompoundRows(rows);
  }

  buildImportTemplateBuffer(mode: CompoundProductImportMode) {
    const workbook = XLSX.utils.book_new();
    const rows =
      mode === 'DETALLE_PRODUCTOS_COMPUESTOS'
        ? [
            {
              'Código Interno (Producto compuesto/kit)': 'CODKIT1',
              'Código Interno (Producto individual pertenece al kit)': 'C150',
              Cantidad: 1,
            },
          ]
        : [
            {
              Nombre: 'kit 1',
              'Código Interno': 'CODKIT1',
              'Código Sunat': '20202020',
              'Código Tipo de Unidad': 'NIU',
              'Código Tipo de Moneda': 'PEN',
              'Precio Unitario Venta': 120.25,
              'Codigo Tipo de Afectación del Igv Venta': '10',
              Categoria: 'Bebidas',
              Marca: 'Adidas',
              Descripcion: 'desc 1',
              'Nombre secundario': 'nombre sec 1',
              Plataforma: 'Saga Falabella',
              'Tiene Igv': 'SI',
              Modelo: 'Modelo A',
            },
          ];
    const sheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Hoja1');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  private async importCompoundRows(rows: Record<string, unknown>[]) {
    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const displayRow = i + 2;
      const nombre = this.cellString(row, 'Nombre');
      const codigoInterno = this.cellString(row, 'Código Interno');
      const unitCode = this.cellString(row, 'Código Tipo de Unidad').toUpperCase();
      const currencyCode = this.cellString(row, 'Código Tipo de Moneda').toUpperCase();
      const saleTaxCode = this.cellString(row, 'Codigo Tipo de Afectación del Igv Venta');

      if (!nombre && !codigoInterno && !unitCode && !currencyCode) continue;
      if (!nombre || !codigoInterno || !unitCode || !currencyCode || !saleTaxCode) {
        errors.push(`Fila ${displayRow}: faltan campos obligatorios.`);
        continue;
      }

      try {
        const unit = await this.prisma.unitOfMeasure.findFirst({
          where: { codigo: unitCode, deletedAt: null },
          select: { id: true },
        });
        if (!unit) throw new BadRequestException(`Unidad no encontrada (${unitCode})`);

        const currency = await this.prisma.currency.findFirst({
          where: { codigo: currencyCode, deletedAt: null },
          select: { id: true },
        });
        if (!currency) throw new BadRequestException(`Moneda no encontrada (${currencyCode})`);

        const saleTax = await this.prisma.taxAffectationType.findFirst({
          where: { codigo: saleTaxCode, deletedAt: null },
          select: { id: true },
        });
        if (!saleTax) throw new BadRequestException(`Tipo afectación venta no encontrado (${saleTaxCode})`);

        const venta = this.toNumber(row['Precio Unitario Venta']);
        if (venta === null || venta < 0) throw new BadRequestException('Precio Unitario Venta inválido.');

        const categoryId = await this.resolveCategoryId(this.cellString(row, 'Categoria'));
        const brandId = await this.resolveBrandId(this.cellString(row, 'Marca'));
        const plataformaId = await this.resolvePlatformId(this.cellString(row, 'Plataforma'));

        const payload: Prisma.CompoundProductUncheckedCreateInput = {
          nombre,
          codigoInterno,
          nombreSecundario: this.cellString(row, 'Nombre secundario') || null,
          descripcion: this.cellStringAlias(row, ['Descripcion', 'Descripción']) || null,
          modelo: this.cellString(row, 'Modelo') || null,
          codigoSunat: this.cellString(row, 'Código Sunat') || null,
          unitId: unit.id,
          currencyId: currency.id,
          saleTaxAffectationId: saleTax.id,
          precioUnitarioVenta: new Prisma.Decimal(venta),
          precioUnitarioCompra: new Prisma.Decimal(this.toNumber(row['Precio Unitario Compra']) ?? 0),
          incluyeIgvVenta: this.toBooleanSiNo(row['Tiene Igv'], true),
          totalPrecioCompraReferencia: new Prisma.Decimal(0),
          plataformaId,
          categoryId,
          brandId,
        };

        const current = await this.prisma.compoundProduct.findFirst({
          where: { deletedAt: null, codigoInterno },
          select: { id: true },
        });
        if (current) {
          await this.prisma.compoundProduct.update({ where: { id: current.id }, data: payload });
          updated += 1;
        } else {
          await this.prisma.compoundProduct.create({ data: payload });
          created += 1;
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error no identificado';
        errors.push(`Fila ${displayRow}: ${message}`);
      }
    }

    return { totalRows: rows.length, created, updated, errors };
  }

  private async importCompoundDetailRows(rows: Record<string, unknown>[]) {
    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const displayRow = i + 2;
      const codigoCompuesto = this.cellStringAlias(row, [
        'Código Interno (Producto compuesto/kit)',
        'Codigo Interno (Producto compuesto/kit)',
      ]);
      const codigoProducto = this.cellStringAlias(row, [
        'Código Interno (Producto individual pertenece al kit)',
        'Codigo Interno (Producto individual pertenece al kit)',
      ]);
      const cantidad = this.toNumber(row['Cantidad']);

      if (!codigoCompuesto && !codigoProducto && cantidad === null) continue;
      if (!codigoCompuesto || !codigoProducto || cantidad === null || cantidad <= 0) {
        errors.push(`Fila ${displayRow}: faltan campos obligatorios o cantidad inválida.`);
        continue;
      }

      try {
        const compound = await this.prisma.compoundProduct.findFirst({
          where: { codigoInterno: codigoCompuesto, deletedAt: null },
          select: { id: true },
        });
        if (!compound) throw new BadRequestException(`Compuesto no encontrado (${codigoCompuesto})`);

        const product = await this.prisma.product.findFirst({
          where: { codigoInterno: codigoProducto, deletedAt: null },
          select: { id: true, precioUnitarioVenta: true },
        });
        if (!product) throw new BadRequestException(`Producto no encontrado (${codigoProducto})`);

        const precioUnitario = product.precioUnitarioVenta;
        const cantidadDec = new Prisma.Decimal(cantidad);
        const total = cantidadDec.mul(precioUnitario);

        const current = await this.prisma.compoundProductItem.findFirst({
          where: { compoundProductId: compound.id, productId: product.id },
          select: { id: true },
        });
        if (current) {
          await this.prisma.compoundProductItem.update({
            where: { id: current.id },
            data: { cantidad: cantidadDec, precioUnitario, total },
          });
          updated += 1;
        } else {
          await this.prisma.compoundProductItem.create({
            data: { compoundProductId: compound.id, productId: product.id, cantidad: cantidadDec, precioUnitario, total },
          });
          created += 1;
        }

        await this.recalculateCompoundTotal(compound.id);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error no identificado';
        errors.push(`Fila ${displayRow}: ${message}`);
      }
    }

    return { totalRows: rows.length, created, updated, errors };
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

  private async recalculateCompoundTotal(compoundProductId: string) {
    const items = await this.prisma.compoundProductItem.findMany({
      where: { compoundProductId },
      select: { total: true },
    });
    const total = items.reduce((acc, row) => acc.plus(row.total), new Prisma.Decimal(0));
    await this.prisma.compoundProduct.update({
      where: { id: compoundProductId },
      data: { totalPrecioCompraReferencia: total },
    });
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

  private cellStringAlias(row: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
      const value = this.cellString(row, key);
      if (value) return value;
    }
    return '';
  }

  private cellString(row: Record<string, unknown>, key: string): string {
    const value = row[key];
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }

  private toNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    const normalized = String(value).replace(',', '.').trim();
    if (!normalized) return null;
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private toBooleanSiNo(value: unknown, fallback: boolean): boolean {
    const text = String(value ?? '')
      .trim()
      .toUpperCase();
    if (!text) return fallback;
    if (['SI', 'S', 'YES', 'Y', '1', 'TRUE'].includes(text)) return true;
    if (['NO', 'N', '0', 'FALSE'].includes(text)) return false;
    return fallback;
  }

  private async resolveCategoryId(nombre: string): Promise<string | null> {
    const clean = nombre.trim();
    if (!clean) return null;
    const existing = await this.prisma.category.findFirst({
      where: { deletedAt: null, nombre: { equals: clean, mode: 'insensitive' } },
      select: { id: true },
    });
    if (existing) return existing.id;
    const created = await this.prisma.category.create({ data: { nombre: clean }, select: { id: true } });
    return created.id;
  }

  private async resolveBrandId(nombre: string): Promise<string | null> {
    const clean = nombre.trim();
    if (!clean) return null;
    const existing = await this.prisma.brand.findFirst({
      where: { deletedAt: null, nombre: { equals: clean, mode: 'insensitive' } },
      select: { id: true },
    });
    if (existing) return existing.id;
    const created = await this.prisma.brand.create({ data: { nombre: clean }, select: { id: true } });
    return created.id;
  }

  private async resolvePlatformId(nombre: string): Promise<string | null> {
    const clean = nombre.trim();
    if (!clean) return null;
    const existing = await this.prisma.compoundProductPlatform.findFirst({
      where: { deletedAt: null, nombre: { equals: clean, mode: 'insensitive' } },
      select: { id: true },
    });
    if (existing) return existing.id;
    const created = await this.prisma.compoundProductPlatform.create({
      data: { nombre: clean, activo: true },
      select: { id: true },
    });
    return created.id;
  }
}
