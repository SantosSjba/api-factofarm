import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PresentationDefaultPrice } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductLocationDto } from './dto/create-product-location.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductListQueryDto } from './dto/product-list-query.dto';

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

    const [total, rows] = await this.prisma.$transaction([
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

    if (dto.productLocationId) {
      const pl = await this.prisma.productLocation.findFirst({
        where: { id: dto.productLocationId, deletedAt: null },
      });
      if (!pl) throw new BadRequestException('Ubicación no válida');
    }

    if (dto.defaultWarehouseId) {
      const w = await this.prisma.warehouse.findFirst({
        where: { id: dto.defaultWarehouseId, deletedAt: null },
      });
      if (!w) throw new BadRequestException('Almacén por defecto no válido');
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
      marcaLaboratorio: row.marcaLaboratorio,
      marcaNombre: row.brand?.nombre ?? null,
      unit: row.unit,
      currency: row.currency,
      totalStock: sumStock(row.warehouseStocks),
    };
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

  listProductLocations() {
    return this.prisma.productLocation.findMany({
      where: { deletedAt: null },
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
