import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { ServiceListQueryDto } from './dto/service-list-query.dto';
import { UpdateServiceBarcodeDto } from './dto/update-service-barcode.dto';
import { UpdateServiceStatusDto } from './dto/update-service-status.dto';

const selectServiceList = {
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
  numeroPuntos: true,
  marcaLaboratorio: true,
  categoryId: true,
  brandId: true,
  productLocationId: true,
  habilitado: true,
  unit: { select: { id: true, codigo: true, nombre: true } },
  brand: { select: { id: true, nombre: true } },
  currency: { select: { id: true, codigo: true, nombre: true } },
  tipoSistemaIsc: { select: { id: true, codigo: true, nombre: true } },
} satisfies Prisma.ServiceSelect;

function decStr(v: Prisma.Decimal | null | undefined): string | null {
  if (v === null || v === undefined) return null;
  return v.toString();
}

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ServiceListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const search = query.search?.trim();
    const field = (query.field ?? 'nombre').trim();

    const searchable: Prisma.ServiceWhereInput[] = [];
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

    const where: Prisma.ServiceWhereInput = {
      deletedAt: null,
      ...(searchable.length ? { OR: searchable } : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.service.count({ where }),
      this.prisma.service.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: selectServiceList,
      }),
    ]);

    const items = rows.map((row) => ({
      ...row,
      precioUnitarioVenta: row.precioUnitarioVenta.toString(),
      precioUnitarioCompra: decStr(row.precioUnitarioCompra),
      tipoSistemaIscNombre: row.tipoSistemaIsc?.nombre ?? null,
      porcentajeIsc: decStr(row.porcentajeIsc),
      numeroPuntos: decStr(row.numeroPuntos),
      marcaNombre: row.brand?.nombre ?? null,
      totalStock: '0',
    }));

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  listUnits() {
    return this.prisma.unitOfMeasure.findMany({
      where: { deletedAt: null, codigo: 'ZZ' },
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

  listIscSystems() {
    return this.prisma.productIscSystem.findMany({
      where: { deletedAt: null, activo: true },
      orderBy: { codigo: 'asc' },
      select: { id: true, codigo: true, nombre: true },
    });
  }

  listAttributeTypes() {
    return this.prisma.productAttributeType.findMany({
      where: { deletedAt: null },
      orderBy: { nombre: 'asc' },
      select: { id: true, nombre: true },
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

  async create(dto: CreateServiceDto) {
    const unitId = await this.resolveServiceUnitId(dto.unitId);
    await this.validateReferences(dto);

    const created = await this.prisma.$transaction(async (tx) => {
      const service = await tx.service.create({
        data: this.buildData(dto, unitId),
        select: { id: true },
      });

      if (dto.attributes?.length) {
        await tx.serviceAttribute.createMany({
          data: dto.attributes.map((a) => ({
            serviceId: service.id,
            attributeTypeId: a.attributeTypeId,
            descripcion: a.descripcion.trim(),
          })),
        });
      }
      return service.id;
    });

    return this.getByIdOrThrow(created);
  }

  async update(id: string, dto: CreateServiceDto) {
    const current = await this.prisma.service.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, unitId: true },
    });
    if (!current) throw new NotFoundException('Servicio no encontrado');

    const unitId = await this.resolveServiceUnitId(dto.unitId ?? current.unitId);
    await this.validateReferences(dto);

    await this.prisma.$transaction(async (tx) => {
      await tx.service.update({
        where: { id },
        data: this.buildData(dto, unitId),
      });

      if (dto.attributes) {
        await tx.serviceAttribute.deleteMany({ where: { serviceId: id } });
        if (dto.attributes.length) {
          await tx.serviceAttribute.createMany({
            data: dto.attributes.map((a) => ({
              serviceId: id,
              attributeTypeId: a.attributeTypeId,
              descripcion: a.descripcion.trim(),
            })),
          });
        }
      }
    });

    return this.getByIdOrThrow(id);
  }

  async remove(id: string) {
    const current = await this.prisma.service.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!current) throw new NotFoundException('Servicio no encontrado');
    await this.prisma.service.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async updateStatus(id: string, dto: UpdateServiceStatusDto) {
    const row = await this.prisma.service.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!row) throw new NotFoundException('Servicio no encontrado');
    await this.prisma.service.update({
      where: { id },
      data: { habilitado: dto.habilitado },
    });
    return this.getByIdOrThrow(id);
  }

  async updateBarcode(id: string, dto: UpdateServiceBarcodeDto) {
    const row = await this.prisma.service.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!row) throw new NotFoundException('Servicio no encontrado');
    await this.prisma.service.update({
      where: { id },
      data: { codigoBarra: dto.codigoBarra.trim() || null },
    });
    return this.getByIdOrThrow(id);
  }

  async duplicate(id: string) {
    const source = await this.prisma.service.findFirst({
      where: { id, deletedAt: null },
      include: { attributes: true },
    });
    if (!source) throw new NotFoundException('Servicio no encontrado');

    const cloneId = await this.prisma.$transaction(async (tx) => {
      const baseName = source.nombre.trim();
      let nextName = `${baseName} (Copia)`;
      let n = 2;
      while (
        await tx.service.findFirst({
          where: { nombre: nextName, deletedAt: null },
          select: { id: true },
        })
      ) {
        nextName = `${baseName} (Copia ${n++})`;
      }

      const created = await tx.service.create({
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
          incluyeIscVenta: source.incluyeIscVenta,
          incluyeIscCompra: source.incluyeIscCompra,
          tipoSistemaIscId: source.tipoSistemaIscId,
          porcentajeIsc: source.porcentajeIsc,
          sujetoDetraccion: source.sujetoDetraccion,
          sePuedeCanjearPorPuntos: source.sePuedeCanjearPorPuntos,
          numeroPuntos: source.numeroPuntos,
          categoryId: source.categoryId,
          brandId: source.brandId,
          productLocationId: source.productLocationId,
          habilitado: source.habilitado,
        },
        select: { id: true },
      });

      for (const at of source.attributes) {
        await tx.serviceAttribute.create({
          data: {
            serviceId: created.id,
            attributeTypeId: at.attributeTypeId,
            descripcion: at.descripcion,
          },
        });
      }

      return created.id;
    });

    return this.getByIdOrThrow(cloneId);
  }

  private async getByIdOrThrow(id: string) {
    const row = await this.prisma.service.findFirst({
      where: { id, deletedAt: null },
      select: selectServiceList,
    });
    if (!row) throw new NotFoundException('Servicio no encontrado');
    return {
      ...row,
      precioUnitarioVenta: row.precioUnitarioVenta.toString(),
      precioUnitarioCompra: decStr(row.precioUnitarioCompra),
      tipoSistemaIscNombre: row.tipoSistemaIsc?.nombre ?? null,
      porcentajeIsc: decStr(row.porcentajeIsc),
      numeroPuntos: decStr(row.numeroPuntos),
      marcaNombre: row.brand?.nombre ?? null,
      totalStock: '0',
    };
  }

  private buildData(dto: CreateServiceDto, unitId: string): Prisma.ServiceUncheckedCreateInput {
    return {
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
      unitId,
      currencyId: dto.currencyId,
      saleTaxAffectationId: dto.saleTaxAffectationId,
      purchaseTaxAffectationId: dto.purchaseTaxAffectationId || dto.saleTaxAffectationId,
      precioUnitarioVenta: new Prisma.Decimal(dto.precioUnitarioVenta),
      precioUnitarioCompra:
        dto.precioUnitarioCompra !== undefined && dto.precioUnitarioCompra !== null
          ? new Prisma.Decimal(dto.precioUnitarioCompra)
          : null,
      incluyeIgvVenta: dto.incluyeIgvVenta ?? true,
      incluyeIgvCompra: dto.incluyeIgvCompra ?? true,
      generico: dto.generico ?? false,
      necesitaRecetaMedica: dto.necesitaRecetaMedica ?? false,
      incluyeIscVenta: dto.incluyeIscVenta ?? false,
      incluyeIscCompra: dto.incluyeIscCompra ?? false,
      tipoSistemaIscId: dto.incluyeIscVenta || dto.incluyeIscCompra ? (dto.tipoSistemaIscId ?? null) : null,
      porcentajeIsc:
        dto.incluyeIscVenta || dto.incluyeIscCompra
          ? dto.porcentajeIsc !== undefined && dto.porcentajeIsc !== null
            ? new Prisma.Decimal(dto.porcentajeIsc)
            : null
          : null,
      sujetoDetraccion: dto.sujetoDetraccion ?? false,
      sePuedeCanjearPorPuntos: dto.sePuedeCanjearPorPuntos ?? false,
      numeroPuntos:
        dto.sePuedeCanjearPorPuntos && dto.numeroPuntos !== undefined && dto.numeroPuntos !== null
          ? new Prisma.Decimal(dto.numeroPuntos)
          : null,
      categoryId: dto.categoryId || null,
      brandId: dto.brandId || null,
      productLocationId: dto.productLocationId || null,
      imagenArchivoId: dto.imagenArchivoId || null,
    };
  }

  private async resolveServiceUnitId(unitId?: string): Promise<string> {
    if (unitId) {
      const unit = await this.prisma.unitOfMeasure.findFirst({
        where: { id: unitId, deletedAt: null },
        select: { id: true, codigo: true },
      });
      if (!unit) throw new BadRequestException('Unidad base no encontrada.');
      if (unit.codigo !== 'ZZ') throw new BadRequestException('Para servicios, la unidad debe ser "Servicio (ZZ)".');
      return unit.id;
    }

    const serviceUnit = await this.prisma.unitOfMeasure.findFirst({
      where: { codigo: 'ZZ', deletedAt: null },
      select: { id: true },
    });
    if (!serviceUnit) throw new BadRequestException('No existe la unidad "Servicio (ZZ)" en catálogos.');
    return serviceUnit.id;
  }

  private async validateReferences(dto: CreateServiceDto) {
    const checks: Promise<unknown>[] = [];

    checks.push(
      this.prisma.currency.findFirst({ where: { id: dto.currencyId, deletedAt: null }, select: { id: true } }).then((x) => {
        if (!x) throw new BadRequestException('Moneda no encontrada.');
      }),
    );
    checks.push(
      this.prisma.taxAffectationType
        .findFirst({ where: { id: dto.saleTaxAffectationId, deletedAt: null }, select: { id: true } })
        .then((x) => {
          if (!x) throw new BadRequestException('Tipo de afectación de venta no encontrado.');
        }),
    );
    if (dto.purchaseTaxAffectationId) {
      checks.push(
        this.prisma.taxAffectationType
          .findFirst({ where: { id: dto.purchaseTaxAffectationId, deletedAt: null }, select: { id: true } })
          .then((x) => {
            if (!x) throw new BadRequestException('Tipo de afectación de compra no encontrado.');
          }),
      );
    }
    if (dto.tipoSistemaIscId) {
      checks.push(
        this.prisma.productIscSystem
          .findFirst({ where: { id: dto.tipoSistemaIscId, deletedAt: null }, select: { id: true } })
          .then((x) => {
            if (!x) throw new BadRequestException('Tipo de sistema ISC no encontrado.');
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
    if (dto.productLocationId) {
      checks.push(
        this.prisma.productLocation
          .findFirst({ where: { id: dto.productLocationId, deletedAt: null }, select: { id: true } })
          .then((x) => {
            if (!x) throw new BadRequestException('Ubicación no encontrada.');
          }),
      );
    }
    if (dto.attributes?.length) {
      for (const at of dto.attributes) {
        checks.push(
          this.prisma.productAttributeType
            .findFirst({ where: { id: at.attributeTypeId, deletedAt: null }, select: { id: true } })
            .then((x) => {
              if (!x) throw new BadRequestException('Tipo de atributo no encontrado.');
            }),
        );
      }
    }
    await Promise.all(checks);
  }
}
