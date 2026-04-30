import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PresentationDefaultPrice } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import * as XLSX from 'xlsx';
import { CreateProductLocationDto } from './dto/create-product-location.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductImportMode } from './dto/import-products.dto';
import { ProductListQueryDto } from './dto/product-list-query.dto';
import { UpdateProductBarcodeDto } from './dto/update-product-barcode.dto';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';

const selectProductList = {
  id: true,
  nombre: true,
  descripcion: true,
  principioActivo: true,
  concentracion: true,
  formaFarmaceutica: true,
  codigoBusqueda: true,
  codigoInterno: true,
  codigoBarra: true,
  codigoSunat: true,
  modelo: true,
  lineaProducto: true,
  registroSanitario: true,
  codigoMedicamentoDigemid: true,
  saleTaxAffectationId: true,
  purchaseTaxAffectationId: true,
  precioUnitarioVenta: true,
  precioUnitarioCompra: true,
  incluyeIgvVenta: true,
  incluyeIgvCompra: true,
  tipoSistemaIscId: true,
  porcentajeIsc: true,
  codigoLote: true,
  fechaVencimientoLote: true,
  numeroPuntos: true,
  marcaLaboratorio: true,
  stockMinimo: true,
  categoryId: true,
  brandId: true,
  productLocationId: true,
  habilitado: true,
  unit: { select: { id: true, codigo: true, nombre: true } },
  brand: { select: { id: true, nombre: true } },
  currency: { select: { id: true, codigo: true, nombre: true } },
  tipoSistemaIsc: { select: { id: true, codigo: true, nombre: true } },
  warehouseStocks: { select: { cantidad: true } },
} satisfies Prisma.ProductSelect;

function decStr(v: Prisma.Decimal | null | undefined): string | null {
  if (v === null || v === undefined) return null;
  return v.toString();
}

function sumStock(stocks: { cantidad: Prisma.Decimal }[]): string {
  let t = new Prisma.Decimal(0);
  for (const s of stocks) {
    t = t.add(s.cantidad);
  }
  return t.toString();
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ProductListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const search = query.search?.trim();
    const field = (query.field ?? 'nombre').trim();

    const searchable: Prisma.ProductWhereInput[] = [];
    if (search) {
      if (field === 'all' || field === 'nombre') {
        searchable.push({ nombre: { contains: search, mode: 'insensitive' } });
      }
      if (field === 'all' || field === 'codigoInterno') {
        searchable.push({ codigoInterno: { contains: search, mode: 'insensitive' } });
      }
      if (field === 'all' || field === 'codigoBarra') {
        searchable.push({ codigoBarra: { contains: search, mode: 'insensitive' } });
      }
      if (field === 'all' || field === 'codigoBusqueda') {
        searchable.push({ codigoBusqueda: { contains: search, mode: 'insensitive' } });
      }
      if (field === 'all' || field === 'descripcion') {
        searchable.push({ descripcion: { contains: search, mode: 'insensitive' } });
      }
    }

    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(searchable.length ? { OR: searchable } : {}),
    };

    // Evita transacción para lecturas paginadas y reduce riesgo de P2028 (maxWait).
    const [total, rows] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: selectProductList,
      }),
    ]);

    const items = rows.map((row) => ({
      id: row.id,
      nombre: row.nombre,
      descripcion: row.descripcion,
      principioActivo: row.principioActivo,
      concentracion: row.concentracion,
      formaFarmaceutica: row.formaFarmaceutica,
      codigoBusqueda: row.codigoBusqueda,
      codigoInterno: row.codigoInterno,
      codigoBarra: row.codigoBarra,
      codigoSunat: row.codigoSunat,
      modelo: row.modelo,
      lineaProducto: row.lineaProducto,
      registroSanitario: row.registroSanitario,
      codigoMedicamentoDigemid: row.codigoMedicamentoDigemid,
      saleTaxAffectationId: row.saleTaxAffectationId,
      purchaseTaxAffectationId: row.purchaseTaxAffectationId,
      precioUnitarioVenta: decStr(row.precioUnitarioVenta)!,
      precioUnitarioCompra: decStr(row.precioUnitarioCompra),
      incluyeIgvVenta: row.incluyeIgvVenta,
      incluyeIgvCompra: row.incluyeIgvCompra,
      tipoSistemaIscId: row.tipoSistemaIscId,
      tipoSistemaIscNombre: row.tipoSistemaIsc?.nombre ?? null,
      porcentajeIsc: decStr(row.porcentajeIsc),
      codigoLote: row.codigoLote,
      fechaVencimientoLote: row.fechaVencimientoLote?.toISOString() ?? null,
      numeroPuntos: decStr(row.numeroPuntos),
      stockMinimo: row.stockMinimo,
      habilitado: row.habilitado,
      marcaLaboratorio: row.marcaLaboratorio,
      marcaNombre: row.brand?.nombre ?? null,
      categoryId: row.categoryId,
      brandId: row.brandId,
      productLocationId: row.productLocationId,
      unit: row.unit,
      currency: row.currency,
      totalStock: sumStock(row.warehouseStocks),
    }));

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async create(dto: CreateProductDto) {
    const unit = await this.prisma.unitOfMeasure.findFirst({
      where: { id: dto.unitId, deletedAt: null },
    });
    if (!unit) throw new BadRequestException('Unidad de medida no válida');

    const currency = await this.prisma.currency.findFirst({
      where: { id: dto.currencyId, deletedAt: null },
    });
    if (!currency) throw new BadRequestException('Moneda no válida');

    const saleTax = await this.prisma.taxAffectationType.findFirst({
      where: { id: dto.saleTaxAffectationId, deletedAt: null },
    });
    if (!saleTax) throw new BadRequestException('Tipo de afectación (venta) no válido');

    if (dto.purchaseTaxAffectationId) {
      const pt = await this.prisma.taxAffectationType.findFirst({
        where: { id: dto.purchaseTaxAffectationId, deletedAt: null },
      });
      if (!pt) throw new BadRequestException('Tipo de afectación (compra) no válido');
    }

    if (dto.categoryId) {
      const c = await this.prisma.category.findFirst({ where: { id: dto.categoryId, deletedAt: null } });
      if (!c) throw new BadRequestException('Categoría no válida');
    }

    if (dto.brandId) {
      const b = await this.prisma.brand.findFirst({ where: { id: dto.brandId, deletedAt: null } });
      if (!b) throw new BadRequestException('Marca no válida');
    }

    const productLocation = dto.productLocationId
      ? await this.prisma.productLocation.findFirst({
        where: { id: dto.productLocationId, deletedAt: null },
      })
      : null;
    if (dto.productLocationId && !productLocation) throw new BadRequestException('Ubicación no válida');

    const defaultWarehouse = dto.defaultWarehouseId
      ? await this.prisma.warehouse.findFirst({
        where: { id: dto.defaultWarehouseId, deletedAt: null },
      })
      : null;
    if (dto.defaultWarehouseId && !defaultWarehouse) throw new BadRequestException('Almacén por defecto no válido');

    if (productLocation && defaultWarehouse && productLocation.establishmentId !== defaultWarehouse.establishmentId) {
      throw new BadRequestException(
        'La ubicación debe pertenecer al mismo establecimiento del almacén por defecto.',
      );
    }

    if (dto.imagenArchivoId) {
      const a = await this.prisma.archivo.findUnique({ where: { id: dto.imagenArchivoId } });
      if (!a) throw new BadRequestException('Archivo de imagen no válido');
    }

    if (dto.tipoSistemaIscId) {
      const iscSystem = await this.prisma.productIscSystem.findFirst({
        where: { id: dto.tipoSistemaIscId, deletedAt: null, activo: true },
      });
      if (!iscSystem) throw new BadRequestException('Tipo de sistema ISC no válido');
    }
    if ((dto.incluyeIscVenta || dto.incluyeIscCompra) && !dto.tipoSistemaIscId) {
      throw new BadRequestException('Debe seleccionar un tipo de sistema ISC');
    }

    const warehouseIds = new Set<string>();
    for (const p of dto.warehousePrices ?? []) {
      warehouseIds.add(p.warehouseId);
    }
    for (const s of dto.warehouseStocks ?? []) {
      warehouseIds.add(s.warehouseId);
    }
    for (const wid of warehouseIds) {
      const w = await this.prisma.warehouse.findFirst({ where: { id: wid, deletedAt: null } });
      if (!w) throw new BadRequestException(`Almacén no válido: ${wid}`);
    }

    for (const pr of dto.presentations ?? []) {
      const u = await this.prisma.unitOfMeasure.findFirst({ where: { id: pr.unitId, deletedAt: null } });
      if (!u) throw new BadRequestException('Unidad en presentación no válida');
    }

    for (const at of dto.attributes ?? []) {
      const t = await this.prisma.productAttributeType.findFirst({
        where: { id: at.attributeTypeId, deletedAt: null },
      });
      if (!t) throw new BadRequestException('Tipo de atributo no válido');
    }

    const purchaseTaxId = dto.purchaseTaxAffectationId ?? dto.saleTaxAffectationId;

    const created = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          nombre: dto.nombre.trim(),
          descripcion: dto.descripcion?.trim() || null,
          principioActivo: dto.principioActivo?.trim() || null,
          concentracion: dto.concentracion?.trim() || null,
          registroSanitario: dto.registroSanitario?.trim() || null,
          formaFarmaceutica: dto.formaFarmaceutica?.trim() || null,
          codigoBusqueda: dto.codigoBusqueda?.trim() || null,
          codigoInterno: dto.codigoInterno?.trim() || null,
          codigoBarra: dto.codigoBarra?.trim() || null,
          codigoSunat: dto.codigoSunat?.trim() || null,
          codigoMedicamentoDigemid: dto.codigoMedicamentoDigemid?.trim() || null,
          lineaProducto: dto.lineaProducto?.trim() || null,
          modelo: dto.modelo?.trim() || null,
          marcaLaboratorio: dto.marcaLaboratorio?.trim() || null,
          unitId: dto.unitId,
          currencyId: dto.currencyId,
          saleTaxAffectationId: dto.saleTaxAffectationId,
          purchaseTaxAffectationId: purchaseTaxId,
          precioUnitarioVenta: new Prisma.Decimal(dto.precioUnitarioVenta),
          precioUnitarioCompra:
            dto.precioUnitarioCompra !== undefined && dto.precioUnitarioCompra !== null
              ? new Prisma.Decimal(dto.precioUnitarioCompra)
              : null,
          incluyeIgvVenta: dto.incluyeIgvVenta ?? true,
          incluyeIgvCompra: dto.incluyeIgvCompra ?? true,
          generico: dto.generico ?? false,
          necesitaRecetaMedica: dto.necesitaRecetaMedica ?? false,
          calcularCantidadPorPrecio: dto.calcularCantidadPorPrecio ?? false,
          manejaLotes: dto.manejaLotes ?? false,
          codigoLote: dto.manejaLotes ? dto.codigoLote?.trim() || null : null,
          fechaVencimientoLote:
            dto.manejaLotes && dto.fechaVencimientoLote ? new Date(dto.fechaVencimientoLote) : null,
          incluyeIscVenta: dto.incluyeIscVenta ?? false,
          incluyeIscCompra: dto.incluyeIscCompra ?? false,
          tipoSistemaIscId: dto.incluyeIscVenta || dto.incluyeIscCompra ? dto.tipoSistemaIscId ?? null : null,
          porcentajeIsc:
            (dto.incluyeIscVenta || dto.incluyeIscCompra) &&
            dto.porcentajeIsc !== undefined &&
            dto.porcentajeIsc !== null
              ? new Prisma.Decimal(dto.porcentajeIsc)
              : null,
          sujetoDetraccion: dto.sujetoDetraccion ?? false,
          sePuedeCanjearPorPuntos: dto.sePuedeCanjearPorPuntos ?? false,
          numeroPuntos:
            dto.sePuedeCanjearPorPuntos && dto.numeroPuntos !== undefined && dto.numeroPuntos !== null
              ? new Prisma.Decimal(dto.numeroPuntos)
              : null,
          aplicaGanancia: dto.aplicaGanancia ?? false,
          porcentajeGanancia:
            dto.porcentajeGanancia !== undefined && dto.porcentajeGanancia !== null
              ? new Prisma.Decimal(dto.porcentajeGanancia)
              : null,
          costoUnitario:
            dto.costoUnitario !== undefined && dto.costoUnitario !== null
              ? new Prisma.Decimal(dto.costoUnitario)
              : null,
          stockMinimo: dto.stockMinimo ?? 1,
          categoryId: dto.categoryId ?? null,
          brandId: dto.brandId ?? null,
          productLocationId: dto.productLocationId ?? null,
          defaultWarehouseId: dto.defaultWarehouseId ?? null,
          imagenArchivoId: dto.imagenArchivoId ?? null,
        },
      });

      for (const wp of dto.warehousePrices ?? []) {
        await tx.productWarehousePrice.create({
          data: {
            productId: product.id,
            warehouseId: wp.warehouseId,
            precio: new Prisma.Decimal(wp.precio),
          },
        });
      }

      for (const ws of dto.warehouseStocks ?? []) {
        await tx.productWarehouseStock.create({
          data: {
            productId: product.id,
            warehouseId: ws.warehouseId,
            cantidad: new Prisma.Decimal(ws.cantidad),
          },
        });
      }

      let orden = 0;
      for (const pr of dto.presentations ?? []) {
        const factor = Number(pr.factor ?? 0);
        const precio1 = Number(pr.precio1 ?? 0);
        const precio2 = Number(pr.precio2 ?? 0);
        const precio3 = Number(pr.precio3 ?? 0);
        const precioDefecto = pr.precioDefecto ?? PresentationDefaultPrice.PRECIO_1;

        if (!(factor > 0)) {
          throw new BadRequestException('En presentaciones, el factor debe ser mayor a 0');
        }
        if (precio1 < 0 || precio2 < 0 || precio3 < 0) {
          throw new BadRequestException('En presentaciones, los precios deben ser mayores o iguales a 0');
        }
        if (precio1 <= 0 && precio2 <= 0 && precio3 <= 0) {
          throw new BadRequestException('En presentaciones, al menos un precio debe ser mayor a 0');
        }
        const precioPorDefecto =
          precioDefecto === PresentationDefaultPrice.PRECIO_1
            ? precio1
            : precioDefecto === PresentationDefaultPrice.PRECIO_2
              ? precio2
              : precio3;
        if (precioPorDefecto <= 0) {
          throw new BadRequestException(
            'En presentaciones, el precio por defecto debe apuntar a un precio mayor a 0',
          );
        }

        await tx.productPresentation.create({
          data: {
            productId: product.id,
            orden: orden++,
            codigoBarra: pr.codigoBarra?.trim() || null,
            unitId: pr.unitId,
            descripcion: pr.descripcion?.trim() || null,
            factor: new Prisma.Decimal(factor),
            precio1: new Prisma.Decimal(precio1),
            precio2: new Prisma.Decimal(precio2),
            precio3: new Prisma.Decimal(precio3),
            precioDefecto,
            precioPuntos:
              pr.precioPuntos !== undefined && pr.precioPuntos !== null
                ? new Prisma.Decimal(pr.precioPuntos)
                : null,
          },
        });
      }

      for (const at of dto.attributes ?? []) {
        await tx.productAttribute.create({
          data: {
            productId: product.id,
            attributeTypeId: at.attributeTypeId,
            descripcion: at.descripcion.trim(),
          },
        });
      }

      return product.id;
    });

    const row = await this.prisma.product.findFirst({
      where: { id: created },
      select: selectProductList,
    });
    if (!row) throw new NotFoundException('Producto no encontrado tras crear');

    return {
      id: row.id,
      nombre: row.nombre,
      descripcion: row.descripcion,
      codigoInterno: row.codigoInterno,
      codigoSunat: row.codigoSunat,
      modelo: row.modelo,
      registroSanitario: row.registroSanitario,
      codigoMedicamentoDigemid: row.codigoMedicamentoDigemid,
      precioUnitarioVenta: decStr(row.precioUnitarioVenta)!,
      precioUnitarioCompra: decStr(row.precioUnitarioCompra),
      incluyeIgvVenta: row.incluyeIgvVenta,
      incluyeIgvCompra: row.incluyeIgvCompra,
      tipoSistemaIscId: row.tipoSistemaIscId,
      tipoSistemaIscNombre: row.tipoSistemaIsc?.nombre ?? null,
      porcentajeIsc: decStr(row.porcentajeIsc),
      codigoLote: row.codigoLote,
      fechaVencimientoLote: row.fechaVencimientoLote?.toISOString() ?? null,
      numeroPuntos: decStr(row.numeroPuntos),
      stockMinimo: row.stockMinimo,
      habilitado: row.habilitado,
      marcaLaboratorio: row.marcaLaboratorio,
      marcaNombre: row.brand?.nombre ?? null,
      unit: row.unit,
      currency: row.currency,
      totalStock: sumStock(row.warehouseStocks),
    };
  }

  async update(id: string, dto: CreateProductDto) {
    const exists = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, manejaLotes: true, codigoLote: true, fechaVencimientoLote: true },
    });
    if (!exists) throw new NotFoundException('Producto no encontrado');

    const unit = await this.prisma.unitOfMeasure.findFirst({
      where: { id: dto.unitId, deletedAt: null },
    });
    if (!unit) throw new BadRequestException('Unidad de medida no válida');

    const currency = await this.prisma.currency.findFirst({
      where: { id: dto.currencyId, deletedAt: null },
    });
    if (!currency) throw new BadRequestException('Moneda no válida');

    const saleTax = await this.prisma.taxAffectationType.findFirst({
      where: { id: dto.saleTaxAffectationId, deletedAt: null },
    });
    if (!saleTax) throw new BadRequestException('Tipo de afectación (venta) no válido');

    if (dto.purchaseTaxAffectationId) {
      const pt = await this.prisma.taxAffectationType.findFirst({
        where: { id: dto.purchaseTaxAffectationId, deletedAt: null },
      });
      if (!pt) throw new BadRequestException('Tipo de afectación (compra) no válido');
    }

    if (dto.categoryId) {
      const c = await this.prisma.category.findFirst({ where: { id: dto.categoryId, deletedAt: null } });
      if (!c) throw new BadRequestException('Categoría no válida');
    }

    if (dto.brandId) {
      const b = await this.prisma.brand.findFirst({ where: { id: dto.brandId, deletedAt: null } });
      if (!b) throw new BadRequestException('Marca no válida');
    }

    const productLocation = dto.productLocationId
      ? await this.prisma.productLocation.findFirst({
          where: { id: dto.productLocationId, deletedAt: null },
        })
      : null;
    if (dto.productLocationId && !productLocation) throw new BadRequestException('Ubicación no válida');

    const defaultWarehouse = dto.defaultWarehouseId
      ? await this.prisma.warehouse.findFirst({
          where: { id: dto.defaultWarehouseId, deletedAt: null },
        })
      : null;
    if (dto.defaultWarehouseId && !defaultWarehouse) throw new BadRequestException('Almacén por defecto no válido');

    if (productLocation && defaultWarehouse && productLocation.establishmentId !== defaultWarehouse.establishmentId) {
      throw new BadRequestException(
        'La ubicación debe pertenecer al mismo establecimiento del almacén por defecto.',
      );
    }

    if (dto.imagenArchivoId) {
      const a = await this.prisma.archivo.findUnique({ where: { id: dto.imagenArchivoId } });
      if (!a) throw new BadRequestException('Archivo de imagen no válido');
    }

    if (dto.tipoSistemaIscId) {
      const iscSystem = await this.prisma.productIscSystem.findFirst({
        where: { id: dto.tipoSistemaIscId, deletedAt: null, activo: true },
      });
      if (!iscSystem) throw new BadRequestException('Tipo de sistema ISC no válido');
    }
    if ((dto.incluyeIscVenta || dto.incluyeIscCompra) && !dto.tipoSistemaIscId) {
      throw new BadRequestException('Debe seleccionar un tipo de sistema ISC');
    }

    const warehouseIds = new Set<string>();
    for (const p of dto.warehousePrices ?? []) {
      warehouseIds.add(p.warehouseId);
    }
    for (const s of dto.warehouseStocks ?? []) {
      warehouseIds.add(s.warehouseId);
    }
    for (const wid of warehouseIds) {
      const w = await this.prisma.warehouse.findFirst({ where: { id: wid, deletedAt: null } });
      if (!w) throw new BadRequestException(`Almacén no válido: ${wid}`);
    }

    for (const pr of dto.presentations ?? []) {
      const u = await this.prisma.unitOfMeasure.findFirst({ where: { id: pr.unitId, deletedAt: null } });
      if (!u) throw new BadRequestException('Unidad en presentación no válida');
    }

    for (const at of dto.attributes ?? []) {
      const t = await this.prisma.productAttributeType.findFirst({
        where: { id: at.attributeTypeId, deletedAt: null },
      });
      if (!t) throw new BadRequestException('Tipo de atributo no válido');
    }

    const purchaseTaxId = dto.purchaseTaxAffectationId ?? dto.saleTaxAffectationId;

    await this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          nombre: dto.nombre.trim(),
          descripcion: dto.descripcion?.trim() || null,
          principioActivo: dto.principioActivo?.trim() || null,
          concentracion: dto.concentracion?.trim() || null,
          registroSanitario: dto.registroSanitario?.trim() || null,
          formaFarmaceutica: dto.formaFarmaceutica?.trim() || null,
          codigoBusqueda: dto.codigoBusqueda?.trim() || null,
          codigoInterno: dto.codigoInterno?.trim() || null,
          codigoBarra: dto.codigoBarra?.trim() || null,
          codigoSunat: dto.codigoSunat?.trim() || null,
          codigoMedicamentoDigemid: dto.codigoMedicamentoDigemid?.trim() || null,
          lineaProducto: dto.lineaProducto?.trim() || null,
          modelo: dto.modelo?.trim() || null,
          marcaLaboratorio: dto.marcaLaboratorio?.trim() || null,
          unitId: dto.unitId,
          currencyId: dto.currencyId,
          saleTaxAffectationId: dto.saleTaxAffectationId,
          purchaseTaxAffectationId: purchaseTaxId,
          precioUnitarioVenta: new Prisma.Decimal(dto.precioUnitarioVenta),
          precioUnitarioCompra:
            dto.precioUnitarioCompra !== undefined && dto.precioUnitarioCompra !== null
              ? new Prisma.Decimal(dto.precioUnitarioCompra)
              : null,
          incluyeIgvVenta: dto.incluyeIgvVenta ?? true,
          incluyeIgvCompra: dto.incluyeIgvCompra ?? true,
          generico: dto.generico ?? false,
          necesitaRecetaMedica: dto.necesitaRecetaMedica ?? false,
          calcularCantidadPorPrecio: dto.calcularCantidadPorPrecio ?? false,
          // Nota: edición de lote/vencimiento se gestiona en módulo de Inventario.
          manejaLotes: exists.manejaLotes,
          codigoLote: exists.codigoLote,
          fechaVencimientoLote: exists.fechaVencimientoLote,
          incluyeIscVenta: dto.incluyeIscVenta ?? false,
          incluyeIscCompra: dto.incluyeIscCompra ?? false,
          tipoSistemaIscId: dto.incluyeIscVenta || dto.incluyeIscCompra ? dto.tipoSistemaIscId ?? null : null,
          porcentajeIsc:
            (dto.incluyeIscVenta || dto.incluyeIscCompra) &&
            dto.porcentajeIsc !== undefined &&
            dto.porcentajeIsc !== null
              ? new Prisma.Decimal(dto.porcentajeIsc)
              : null,
          sujetoDetraccion: dto.sujetoDetraccion ?? false,
          sePuedeCanjearPorPuntos: dto.sePuedeCanjearPorPuntos ?? false,
          numeroPuntos:
            dto.sePuedeCanjearPorPuntos && dto.numeroPuntos !== undefined && dto.numeroPuntos !== null
              ? new Prisma.Decimal(dto.numeroPuntos)
              : null,
          aplicaGanancia: dto.aplicaGanancia ?? false,
          porcentajeGanancia:
            dto.porcentajeGanancia !== undefined && dto.porcentajeGanancia !== null
              ? new Prisma.Decimal(dto.porcentajeGanancia)
              : null,
          costoUnitario:
            dto.costoUnitario !== undefined && dto.costoUnitario !== null
              ? new Prisma.Decimal(dto.costoUnitario)
              : null,
          stockMinimo: dto.stockMinimo ?? 1,
          categoryId: dto.categoryId ?? null,
          brandId: dto.brandId ?? null,
          productLocationId: dto.productLocationId ?? null,
          defaultWarehouseId: dto.defaultWarehouseId ?? null,
          imagenArchivoId: dto.imagenArchivoId ?? null,
        },
      });

      if (dto.warehousePrices) {
        await tx.productWarehousePrice.deleteMany({ where: { productId: id } });
        for (const wp of dto.warehousePrices) {
          await tx.productWarehousePrice.create({
            data: {
              productId: id,
              warehouseId: wp.warehouseId,
              precio: new Prisma.Decimal(wp.precio),
            },
          });
        }
      }

      if (dto.warehouseStocks) {
        await tx.productWarehouseStock.deleteMany({ where: { productId: id } });
        for (const ws of dto.warehouseStocks) {
          await tx.productWarehouseStock.create({
            data: {
              productId: id,
              warehouseId: ws.warehouseId,
              cantidad: new Prisma.Decimal(ws.cantidad),
            },
          });
        }
      }

      if (dto.presentations) {
        await tx.productPresentation.deleteMany({ where: { productId: id } });
        let orden = 0;
        for (const pr of dto.presentations) {
          const factor = Number(pr.factor ?? 0);
          const precio1 = Number(pr.precio1 ?? 0);
          const precio2 = Number(pr.precio2 ?? 0);
          const precio3 = Number(pr.precio3 ?? 0);
          const precioDefecto = pr.precioDefecto ?? PresentationDefaultPrice.PRECIO_1;

          if (!(factor > 0)) {
            throw new BadRequestException('En presentaciones, el factor debe ser mayor a 0');
          }
          if (precio1 < 0 || precio2 < 0 || precio3 < 0) {
            throw new BadRequestException('En presentaciones, los precios deben ser mayores o iguales a 0');
          }
          if (precio1 <= 0 && precio2 <= 0 && precio3 <= 0) {
            throw new BadRequestException('En presentaciones, al menos un precio debe ser mayor a 0');
          }
          const precioPorDefecto =
            precioDefecto === PresentationDefaultPrice.PRECIO_1
              ? precio1
              : precioDefecto === PresentationDefaultPrice.PRECIO_2
                ? precio2
                : precio3;
          if (precioPorDefecto <= 0) {
            throw new BadRequestException(
              'En presentaciones, el precio por defecto debe apuntar a un precio mayor a 0',
            );
          }

          await tx.productPresentation.create({
            data: {
              productId: id,
              orden: orden++,
              codigoBarra: pr.codigoBarra?.trim() || null,
              unitId: pr.unitId,
              descripcion: pr.descripcion?.trim() || null,
              factor: new Prisma.Decimal(factor),
              precio1: new Prisma.Decimal(precio1),
              precio2: new Prisma.Decimal(precio2),
              precio3: new Prisma.Decimal(precio3),
              precioDefecto,
              precioPuntos:
                pr.precioPuntos !== undefined && pr.precioPuntos !== null
                  ? new Prisma.Decimal(pr.precioPuntos)
                  : null,
            },
          });
        }
      }

      if (dto.attributes) {
        await tx.productAttribute.deleteMany({ where: { productId: id } });
        for (const at of dto.attributes) {
          await tx.productAttribute.create({
            data: {
              productId: id,
              attributeTypeId: at.attributeTypeId,
              descripcion: at.descripcion.trim(),
            },
          });
        }
      }
    });

    const row = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      select: selectProductList,
    });
    if (!row) throw new NotFoundException('Producto no encontrado tras actualizar');

    return {
      id: row.id,
      nombre: row.nombre,
      descripcion: row.descripcion,
      codigoInterno: row.codigoInterno,
      codigoSunat: row.codigoSunat,
      modelo: row.modelo,
      registroSanitario: row.registroSanitario,
      codigoMedicamentoDigemid: row.codigoMedicamentoDigemid,
      precioUnitarioVenta: decStr(row.precioUnitarioVenta)!,
      precioUnitarioCompra: decStr(row.precioUnitarioCompra),
      incluyeIgvVenta: row.incluyeIgvVenta,
      incluyeIgvCompra: row.incluyeIgvCompra,
      tipoSistemaIscId: row.tipoSistemaIscId,
      tipoSistemaIscNombre: row.tipoSistemaIsc?.nombre ?? null,
      porcentajeIsc: decStr(row.porcentajeIsc),
      codigoLote: row.codigoLote,
      fechaVencimientoLote: row.fechaVencimientoLote?.toISOString() ?? null,
      numeroPuntos: decStr(row.numeroPuntos),
      stockMinimo: row.stockMinimo,
      habilitado: row.habilitado,
      marcaLaboratorio: row.marcaLaboratorio,
      marcaNombre: row.brand?.nombre ?? null,
      unit: row.unit,
      currency: row.currency,
      totalStock: sumStock(row.warehouseStocks),
    };
  }

  async remove(id: string) {
    const row = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!row) throw new NotFoundException('Producto no encontrado');
    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), habilitado: false },
    });
    return { ok: true };
  }

  async updateStatus(id: string, dto: UpdateProductStatusDto) {
    const row = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!row) throw new NotFoundException('Producto no encontrado');
    return this.prisma.product.update({
      where: { id },
      data: { habilitado: dto.habilitado },
      select: selectProductList,
    });
  }

  async updateBarcode(id: string, dto: UpdateProductBarcodeDto) {
    const row = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!row) throw new NotFoundException('Producto no encontrado');
    return this.prisma.product.update({
      where: { id },
      data: { codigoBarra: dto.codigoBarra.trim() || null },
      select: selectProductList,
    });
  }

  async duplicate(id: string) {
    const source = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        warehousePrices: true,
        warehouseStocks: true,
        presentations: true,
        attributes: true,
      },
    });
    if (!source) throw new NotFoundException('Producto no encontrado');

    const cloneId = await this.prisma.$transaction(async (tx) => {
      const baseName = source.nombre.trim();
      let nextName = `${baseName} (Copia)`;
      let n = 2;
      while (
        await tx.product.findFirst({
          where: { nombre: nextName, deletedAt: null },
          select: { id: true },
        })
      ) {
        nextName = `${baseName} (Copia ${n++})`;
      }

      const created = await tx.product.create({
        data: {
          nombre: nextName,
          descripcion: source.descripcion,
          principioActivo: source.principioActivo,
          concentracion: source.concentracion,
          registroSanitario: source.registroSanitario,
          formaFarmaceutica: source.formaFarmaceutica,
          codigoBusqueda: source.codigoBusqueda,
          codigoInterno: null,
          codigoBarra: null,
          codigoSunat: source.codigoSunat,
          codigoMedicamentoDigemid: source.codigoMedicamentoDigemid,
          lineaProducto: source.lineaProducto,
          modelo: source.modelo,
          marcaLaboratorio: source.marcaLaboratorio,
          unitId: source.unitId,
          currencyId: source.currencyId,
          saleTaxAffectationId: source.saleTaxAffectationId,
          purchaseTaxAffectationId: source.purchaseTaxAffectationId,
          precioUnitarioVenta: source.precioUnitarioVenta,
          precioUnitarioCompra: source.precioUnitarioCompra,
          incluyeIgvVenta: source.incluyeIgvVenta,
          incluyeIgvCompra: source.incluyeIgvCompra,
          generico: source.generico,
          necesitaRecetaMedica: source.necesitaRecetaMedica,
          calcularCantidadPorPrecio: source.calcularCantidadPorPrecio,
          manejaLotes: source.manejaLotes,
          codigoLote: source.codigoLote,
          fechaVencimientoLote: source.fechaVencimientoLote,
          incluyeIscVenta: source.incluyeIscVenta,
          incluyeIscCompra: source.incluyeIscCompra,
          tipoSistemaIscId: source.tipoSistemaIscId,
          porcentajeIsc: source.porcentajeIsc,
          sujetoDetraccion: source.sujetoDetraccion,
          sePuedeCanjearPorPuntos: source.sePuedeCanjearPorPuntos,
          numeroPuntos: source.numeroPuntos,
          aplicaGanancia: source.aplicaGanancia,
          porcentajeGanancia: source.porcentajeGanancia,
          costoUnitario: source.costoUnitario,
          stockMinimo: source.stockMinimo,
          categoryId: source.categoryId,
          brandId: source.brandId,
          productLocationId: source.productLocationId,
          defaultWarehouseId: source.defaultWarehouseId,
          imagenArchivoId: null,
          habilitado: source.habilitado,
        },
        select: { id: true },
      });

      for (const wp of source.warehousePrices) {
        await tx.productWarehousePrice.create({
          data: {
            productId: created.id,
            warehouseId: wp.warehouseId,
            precio: wp.precio,
          },
        });
      }

      for (const ws of source.warehouseStocks) {
        await tx.productWarehouseStock.create({
          data: {
            productId: created.id,
            warehouseId: ws.warehouseId,
            cantidad: ws.cantidad,
          },
        });
      }

      for (const pr of source.presentations) {
        await tx.productPresentation.create({
          data: {
            productId: created.id,
            orden: pr.orden,
            codigoBarra: pr.codigoBarra,
            unitId: pr.unitId,
            descripcion: pr.descripcion,
            factor: pr.factor,
            precio1: pr.precio1,
            precio2: pr.precio2,
            precio3: pr.precio3,
            precioDefecto: pr.precioDefecto,
            precioPuntos: pr.precioPuntos,
          },
        });
      }

      for (const at of source.attributes) {
        await tx.productAttribute.create({
          data: {
            productId: created.id,
            attributeTypeId: at.attributeTypeId,
            descripcion: at.descripcion,
          },
        });
      }

      return created.id;
    });

    const row = await this.prisma.product.findFirst({
      where: { id: cloneId, deletedAt: null },
      select: selectProductList,
    });
    if (!row) throw new NotFoundException('Producto duplicado no encontrado');
    return row;
  }

  async importFromExcel(mode: ProductImportMode, file: Express.Multer.File) {
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

    switch (mode) {
      case 'PRODUCTOS':
        return this.importItemsRows(rows);
      case 'L_PRECIOS':
        return this.importPriceListRows(rows);
      case 'ACTUALIZAR_PRECIOS':
        return this.importUpdatePricesRows(rows);
      default:
        throw new BadRequestException('Modo de importación no soportado');
    }
  }

  buildImportTemplateBuffer(mode: ProductImportMode) {
    const workbook = XLSX.utils.book_new();
    let rows: Record<string, unknown>[] = [];
    if (mode === 'L_PRECIOS') {
      rows = [
        {
          'Código Interno (Producto)': 'P001',
          Descripcion: 'Desc Precio 1',
          'Código Tipo de Unidad': 'NIU',
          Factor: 5,
          'Precio 1': 10,
          'Precio 2': 20,
          'Precio 3': 30,
          'Precio por defecto': 1,
        },
      ];
    } else if (mode === 'ACTUALIZAR_PRECIOS') {
      rows = [
        {
          'Código Interno': 'BI001',
          'Precio Unitario Venta': 250,
          'Precio Unitario Compra (Opcional)': 200,
        },
        {
          'Código Interno': 'BI002',
          'Precio Unitario Venta': 300,
          'Precio Unitario Compra (Opcional)': '',
        },
      ];
    } else {
      rows = [
        {
          Nombre: 'ACIDO FOLICO TABLETA 0.5 mg',
          'Código Interno': 'A000001',
          Modelo: '',
          'Código Sunat': 20202020,
          'Código Tipo de Unidad': 'NIU',
          'Código Tipo de Moneda': 'PEN',
          'Precio Unitario Venta': 12.25,
          'Codigo Tipo de Afectación del Igv Venta': 10,
          'Tiene Igv': 'SI',
          'Precio Unitario Compra': 120.5,
          'Codigo Tipo de Afectación del Igv Compra': 10,
          Stock: 10,
          'Stock Mínimo': 1,
          Categoria: 'MEDICAMENTO',
          Marca: 'FARMINDUSTRIA',
          Descripcion: 'ACIDO FOLICO TABLETA 0.5 mg',
          'Principio Activo': 'ACIDO FOLICO',
          'Código lote': '',
          'Fec. Vencimiento': '',
          'Cód barras': 10000001,
          'Concentración': '0.5 mg',
          'Código Medicamento DIGEMID': 'A000001',
          Presentación: 'Tabletas',
          'Registro Sanitario': '1234-1235',
          'Es Generico': 'SI',
          Ubicación: 'Inv 1 Est 2',
        },
      ];
    }
    const sheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Hoja1');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  private async importItemsRows(rows: Record<string, unknown>[]) {
    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    const warehouses = await this.prisma.warehouse.findMany({
      where: { deletedAt: null },
      orderBy: [{ establishmentId: 'asc' }, { nombre: 'asc' }],
      select: { id: true, establishmentId: true, nombre: true },
    });
    if (!warehouses.length) {
      throw new BadRequestException('No hay almacenes configurados para importar productos.');
    }
    const defaultWarehouse =
      warehouses.find((w) => w.nombre.toUpperCase().includes('OFICINA PRINCIPAL')) ?? warehouses[0];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const displayRow = i + 2;
      const nombre = this.cellString(row, 'Nombre');
      const codigoInterno = this.cellString(row, 'Código Interno');
      const unitCode = this.cellString(row, 'Código Tipo de Unidad').toUpperCase();
      const currencyCode = this.cellString(row, 'Código Tipo de Moneda').toUpperCase();
      const saleTaxCode = this.cellString(row, 'Codigo Tipo de Afectación del Igv Venta');

      if (!nombre && !codigoInterno && !unitCode && !currencyCode) {
        continue;
      }
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

        const purchaseTaxCode = this.cellString(row, 'Codigo Tipo de Afectación del Igv Compra') || saleTaxCode;
        const purchaseTax = await this.prisma.taxAffectationType.findFirst({
          where: { codigo: purchaseTaxCode, deletedAt: null },
          select: { id: true },
        });
        if (!purchaseTax) {
          throw new BadRequestException(`Tipo afectación compra no encontrado (${purchaseTaxCode})`);
        }

        const categoryId = await this.resolveCategoryId(this.cellString(row, 'Categoria'));
        const brandId = await this.resolveBrandId(this.cellString(row, 'Marca'));
        const productLocationId = await this.resolveProductLocationId(
          defaultWarehouse.establishmentId,
          this.cellString(row, 'Ubicación'),
        );

        const precioVenta = this.toNumber(row['Precio Unitario Venta']);
        const precioCompra = this.toNumber(row['Precio Unitario Compra']);
        const stock = this.toNumber(row['Stock']) ?? 0;
        const stockMinimo = this.toInteger(row['Stock Mínimo']) ?? 1;
        const tieneIgv = this.toBooleanSiNo(row['Tiene Igv'], true);
        const esGenerico = this.toBooleanSiNo(row['Es Generico'], false);
        const codigoLote = this.cellString(row, 'Código lote');
        const fechaVencimiento = this.toDateIso(row['Fec. Vencimiento']);
        const manejaLotes = !!(codigoLote || fechaVencimiento);

        if (precioVenta === null || precioVenta < 0) {
          throw new BadRequestException('Precio Unitario Venta inválido.');
        }
        if (precioCompra !== null && precioCompra < 0) {
          throw new BadRequestException('Precio Unitario Compra inválido.');
        }

        const current = await this.prisma.product.findFirst({
          where: { deletedAt: null, codigoInterno },
          select: { id: true },
        });

        const product = current
          ? await this.prisma.product.update({
              where: { id: current.id },
              data: {
                nombre,
                codigoBusqueda: this.cellString(row, 'Código Interno') || codigoInterno,
                codigoInterno,
                modelo: this.cellString(row, 'Modelo') || null,
                codigoSunat: this.cellString(row, 'Código Sunat') || null,
                precioUnitarioVenta: new Prisma.Decimal(precioVenta),
                precioUnitarioCompra: precioCompra !== null ? new Prisma.Decimal(precioCompra) : null,
                saleTaxAffectationId: saleTax.id,
                purchaseTaxAffectationId: purchaseTax.id,
                incluyeIgvVenta: tieneIgv,
                incluyeIgvCompra: tieneIgv,
                stockMinimo,
                categoryId,
                brandId,
                descripcion: this.cellString(row, 'Descripcion') || null,
                principioActivo: this.cellString(row, 'Principio Activo') || null,
                concentracion: this.cellString(row, 'Concentración') || null,
                formaFarmaceutica: this.cellString(row, 'Presentación') || null,
                registroSanitario: this.cellString(row, 'Registro Sanitario') || null,
                codigoBarra: this.cellString(row, 'Cód barras') || null,
                codigoMedicamentoDigemid: this.cellString(row, 'Código Medicamento DIGEMID') || null,
                unitId: unit.id,
                currencyId: currency.id,
                generico: esGenerico,
                manejaLotes,
                codigoLote: manejaLotes ? codigoLote || null : null,
                fechaVencimientoLote: manejaLotes && fechaVencimiento ? new Date(fechaVencimiento) : null,
                defaultWarehouseId: defaultWarehouse.id,
                productLocationId,
              },
              select: { id: true },
            })
          : await this.prisma.product.create({
              data: {
                nombre,
                codigoBusqueda: this.cellString(row, 'Código Interno') || codigoInterno,
                codigoInterno,
                modelo: this.cellString(row, 'Modelo') || null,
                codigoSunat: this.cellString(row, 'Código Sunat') || null,
                precioUnitarioVenta: new Prisma.Decimal(precioVenta),
                precioUnitarioCompra: precioCompra !== null ? new Prisma.Decimal(precioCompra) : null,
                saleTaxAffectationId: saleTax.id,
                purchaseTaxAffectationId: purchaseTax.id,
                incluyeIgvVenta: tieneIgv,
                incluyeIgvCompra: tieneIgv,
                stockMinimo,
                categoryId,
                brandId,
                descripcion: this.cellString(row, 'Descripcion') || null,
                principioActivo: this.cellString(row, 'Principio Activo') || null,
                concentracion: this.cellString(row, 'Concentración') || null,
                formaFarmaceutica: this.cellString(row, 'Presentación') || null,
                registroSanitario: this.cellString(row, 'Registro Sanitario') || null,
                codigoBarra: this.cellString(row, 'Cód barras') || null,
                codigoMedicamentoDigemid: this.cellString(row, 'Código Medicamento DIGEMID') || null,
                unitId: unit.id,
                currencyId: currency.id,
                generico: esGenerico,
                manejaLotes,
                codigoLote: manejaLotes ? codigoLote || null : null,
                fechaVencimientoLote: manejaLotes && fechaVencimiento ? new Date(fechaVencimiento) : null,
                defaultWarehouseId: defaultWarehouse.id,
                productLocationId,
              },
              select: { id: true },
            });

        await this.prisma.productWarehouseStock.upsert({
          where: {
            productId_warehouseId: {
              productId: product.id,
              warehouseId: defaultWarehouse.id,
            },
          },
          update: { cantidad: new Prisma.Decimal(stock) },
          create: {
            productId: product.id,
            warehouseId: defaultWarehouse.id,
            cantidad: new Prisma.Decimal(stock),
          },
        });

        if (current) updated++;
        else created++;
      } catch (error) {
        const message =
          error instanceof BadRequestException
            ? String((error.getResponse() as { message?: string })?.message ?? error.message)
            : error instanceof Error
              ? error.message
              : 'Error no controlado';
        errors.push(`Fila ${displayRow}: ${message}`);
      }
    }

    return { totalRows: rows.length, created, updated, errors };
  }

  private async importPriceListRows(rows: Record<string, unknown>[]) {
    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const displayRow = i + 2;
      const codigoInterno = this.cellString(row, 'Código Interno (Producto)');
      const unitCode = this.cellString(row, 'Código Tipo de Unidad').toUpperCase();

      if (!codigoInterno && !unitCode) continue;
      if (!codigoInterno || !unitCode) {
        errors.push(`Fila ${displayRow}: código interno y unidad son obligatorios.`);
        continue;
      }

      try {
        const product = await this.prisma.product.findFirst({
          where: { deletedAt: null, codigoInterno },
          select: { id: true },
        });
        if (!product) throw new BadRequestException(`Producto no encontrado (${codigoInterno})`);

        const unit = await this.prisma.unitOfMeasure.findFirst({
          where: { codigo: unitCode, deletedAt: null },
          select: { id: true },
        });
        if (!unit) throw new BadRequestException(`Unidad no encontrada (${unitCode})`);

        const factor = this.toNumber(row['Factor']);
        const precio1 = this.toNumber(row['Precio 1']);
        const precio2 = this.toNumber(row['Precio 2']);
        const precio3 = this.toNumber(row['Precio 3']);
        const defaultNo = this.toInteger(row['Precio por defecto']) ?? 1;

        if (factor === null || factor <= 0) throw new BadRequestException('Factor inválido.');
        if (precio1 === null || precio2 === null || precio3 === null) {
          throw new BadRequestException('Precios 1, 2 y 3 son obligatorios.');
        }
        if (precio1 < 0 || precio2 < 0 || precio3 < 0) {
          throw new BadRequestException('Los precios no pueden ser negativos.');
        }

        const precioDefecto =
          defaultNo === 2
            ? PresentationDefaultPrice.PRECIO_2
            : defaultNo === 3
              ? PresentationDefaultPrice.PRECIO_3
              : PresentationDefaultPrice.PRECIO_1;
        const descripcion = this.cellString(row, 'Descripcion') || null;
        const selectedPrice = precioDefecto === 'PRECIO_1' ? precio1 : precioDefecto === 'PRECIO_2' ? precio2 : precio3;
        if (selectedPrice <= 0) {
          throw new BadRequestException('El precio por defecto debe ser mayor a 0.');
        }

        const exists = await this.prisma.productPresentation.findFirst({
          where: { productId: product.id, unitId: unit.id, descripcion: descripcion ?? undefined },
          orderBy: { orden: 'asc' },
          select: { id: true },
        });

        if (exists) {
          await this.prisma.productPresentation.update({
            where: { id: exists.id },
            data: {
              factor: new Prisma.Decimal(factor),
              precio1: new Prisma.Decimal(precio1),
              precio2: new Prisma.Decimal(precio2),
              precio3: new Prisma.Decimal(precio3),
              precioDefecto,
              descripcion,
            },
          });
          updated++;
        } else {
          const lastOrder = await this.prisma.productPresentation.findFirst({
            where: { productId: product.id },
            orderBy: { orden: 'desc' },
            select: { orden: true },
          });
          await this.prisma.productPresentation.create({
            data: {
              productId: product.id,
              unitId: unit.id,
              descripcion,
              factor: new Prisma.Decimal(factor),
              precio1: new Prisma.Decimal(precio1),
              precio2: new Prisma.Decimal(precio2),
              precio3: new Prisma.Decimal(precio3),
              precioDefecto,
              orden: (lastOrder?.orden ?? -1) + 1,
            },
          });
          created++;
        }
      } catch (error) {
        const message =
          error instanceof BadRequestException
            ? String((error.getResponse() as { message?: string })?.message ?? error.message)
            : error instanceof Error
              ? error.message
              : 'Error no controlado';
        errors.push(`Fila ${displayRow}: ${message}`);
      }
    }

    return { totalRows: rows.length, created, updated, errors };
  }

  private async importUpdatePricesRows(rows: Record<string, unknown>[]) {
    let updated = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const displayRow = i + 2;
      const codigoInterno = this.cellString(row, 'Código Interno');
      if (!codigoInterno) continue;

      try {
        const product = await this.prisma.product.findFirst({
          where: { deletedAt: null, codigoInterno },
          select: { id: true },
        });
        if (!product) throw new BadRequestException(`Producto no encontrado (${codigoInterno})`);

        const venta = this.toNumber(row['Precio Unitario Venta']);
        const compra = this.toNumber(row['Precio Unitario Compra (Opcional)']);
        if (venta === null || venta < 0) {
          throw new BadRequestException('Precio Unitario Venta inválido.');
        }
        if (compra !== null && compra < 0) {
          throw new BadRequestException('Precio Unitario Compra inválido.');
        }

        await this.prisma.product.update({
          where: { id: product.id },
          data: {
            precioUnitarioVenta: new Prisma.Decimal(venta),
            ...(compra !== null ? { precioUnitarioCompra: new Prisma.Decimal(compra) } : {}),
          },
        });
        updated++;
      } catch (error) {
        const message =
          error instanceof BadRequestException
            ? String((error.getResponse() as { message?: string })?.message ?? error.message)
            : error instanceof Error
              ? error.message
              : 'Error no controlado';
        errors.push(`Fila ${displayRow}: ${message}`);
      }
    }

    return { totalRows: rows.length, created: 0, updated, errors };
  }

  private cellString(row: Record<string, unknown>, key: string): string {
    const raw = row[key];
    if (raw === null || raw === undefined) return '';
    if (typeof raw === 'number') return String(raw).trim();
    return String(raw).trim();
  }

  private toNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(String(value).replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }

  private toInteger(value: unknown): number | null {
    const n = this.toNumber(value);
    if (n === null) return null;
    return Math.trunc(n);
  }

  private toBooleanSiNo(value: unknown, fallback = false): boolean {
    if (value === null || value === undefined || value === '') return fallback;
    const v = String(value).trim().toUpperCase();
    if (['SI', 'SÍ', 'YES', 'TRUE', '1'].includes(v)) return true;
    if (['NO', 'FALSE', '0'].includes(v)) return false;
    return fallback;
  }

  private toDateIso(value: unknown): string | null {
    if (value === null || value === undefined || value === '') return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
    if (typeof value === 'number') {
      const date = XLSX.SSF.parse_date_code(value);
      if (!date) return null;
      const d = new Date(Date.UTC(date.y, date.m - 1, date.d));
      return Number.isNaN(d.getTime()) ? null : d.toISOString();
    }
    const d = new Date(String(value));
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
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

  private async resolveProductLocationId(establishmentId: string, nombre: string): Promise<string | null> {
    const clean = nombre.trim();
    if (!clean) return null;
    const existing = await this.prisma.productLocation.findFirst({
      where: {
        deletedAt: null,
        establishmentId,
        nombre: { equals: clean, mode: 'insensitive' },
      },
      select: { id: true },
    });
    if (existing) return existing.id;
    const created = await this.prisma.productLocation.create({
      data: { establishmentId, nombre: clean.toUpperCase() },
      select: { id: true },
    });
    return created.id;
  }

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
      orderBy: { nombre: 'asc' },
      select: { id: true, codigo: true, nombre: true },
    });
  }

  listTaxAffectationTypes() {
    return this.prisma.taxAffectationType.findMany({
      where: { deletedAt: null },
      orderBy: { descripcion: 'asc' },
      select: { id: true, codigo: true, descripcion: true },
    });
  }

  listWarehouses() {
    return this.prisma.warehouse.findMany({
      where: { deletedAt: null },
      orderBy: [{ establishmentId: 'asc' }, { nombre: 'asc' }],
      select: {
        id: true,
        nombre: true,
        establishment: { select: { id: true, nombre: true, codigo: true } },
      },
    });
  }

  async historyStock(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');

    const rows = await this.prisma.productWarehouseStock.findMany({
      where: {
        productId: id,
        warehouse: { deletedAt: null },
      },
      orderBy: { warehouseId: 'asc' },
      select: {
        cantidad: true,
        warehouse: {
          select: {
            id: true,
            nombre: true,
            establishment: { select: { id: true, nombre: true, codigo: true } },
          },
        },
      },
    });

    return rows.map((r) => ({
      warehouseId: r.warehouse.id,
      ubicacion: `${r.warehouse.nombre} · ${r.warehouse.establishment.nombre}`,
      stock: r.cantidad.toString(),
      series: r.warehouse.establishment.codigo ?? '—',
    }));
  }

  listProductLocations(establishmentId?: string) {
    return this.prisma.productLocation.findMany({
      where: { deletedAt: null, establishmentId: establishmentId || undefined },
      orderBy: [{ establishmentId: 'asc' }, { nombre: 'asc' }],
      select: {
        id: true,
        nombre: true,
        establishment: { select: { id: true, nombre: true, codigo: true } },
      },
    });
  }

  async createProductLocation(dto: CreateProductLocationDto) {
    const nombre = dto.nombre.trim().toUpperCase();
    if (!nombre) {
      throw new BadRequestException('El nombre de la ubicación es obligatorio.');
    }

    const establishment = await this.prisma.establishment.findFirst({
      where: { id: dto.establishmentId, deletedAt: null },
      select: { id: true },
    });
    if (!establishment) {
      throw new NotFoundException('Establecimiento no encontrado');
    }

    try {
      return await this.prisma.productLocation.create({
        data: {
          establishmentId: dto.establishmentId,
          nombre,
        },
        select: {
          id: true,
          nombre: true,
          establishment: { select: { id: true, nombre: true, codigo: true } },
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Ya existe una ubicación con ese nombre en el establecimiento.');
      }
      throw err;
    }
  }

  listAttributeTypes() {
    return this.prisma.productAttributeType.findMany({
      where: { deletedAt: null },
      orderBy: { nombre: 'asc' },
      select: { id: true, nombre: true },
    });
  }

  listIscSystems() {
    return this.prisma.productIscSystem.findMany({
      where: { deletedAt: null, activo: true },
      orderBy: { nombre: 'asc' },
      select: { id: true, codigo: true, nombre: true },
    });
  }
}
