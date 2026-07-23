import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DocumentSeriesType, Prisma } from '../../../generated/prisma/client';
import {
  buildPaginatedResult,
  paginationArgs,
} from '../../../common/dto/pagination.dto';
import { CacheService } from '../../../common/cache/cache.service';
import { assertTenantAccess, actorFromJwt } from '../../../common/scoping/tenant-scope.util';
import { isPlatformAdmin } from '../../../common/permissions/role-policy.util';
import { PrismaService } from '../../../prisma/prisma.service';
import { BillingService } from '../../billing/billing.service';
import { TenantsService } from '../../tenants/tenants.service';
import type { JwtRequestUser } from '../../auth/domain/auth.types';
import { CreateEstablishmentSeriesDto } from '../dto/create-establishment-series.dto';
import { CreateEstablishmentDto } from '../dto/create-establishment.dto';
import { UpdateEstablishmentDto } from '../dto/update-establishment.dto';
import { UpdatePharmacyProfileDto } from '../dto/update-pharmacy-profile.dto';

const DOCUMENT_LABELS: Record<DocumentSeriesType, string> = {
  FACTURA_ELECTRONICA: 'FACTURA ELECTRONICA',
  BOLETA_VENTA_ELECTRONICA: 'BOLETA DE VENTA ELECTRONICA',
  NOTA_CREDITO: 'NOTA DE CREDITO',
  NOTA_DEBITO: 'NOTA DE DEBITO',
  GUIA_REMISION_REMITENTE: 'GUIA DE REMISION REMITENTE',
  COMPROBANTE_RETENCION_ELECTRONICA: 'COMPROBANTE DE RETENCION ELECTRONICA',
  GUIA_REMISION_TRANSPORTISTA: 'GUIA DE REMISION TRANSPORTISTA',
  COMPROBANTE_PERCEPCION_ELECTRONICA: 'COMPROBANTE DE PERCEPCION ELECTRONICA',
  NOTA_VENTA: 'NOTA DE VENTA',
  LIQUIDACION_COMPRA: 'LIQUIDACION DE COMPRA',
  GUIA_INGRESO_ALMACEN: 'GUIA DE INGRESO ALMACEN',
  GUIA_SALIDA_ALMACEN: 'GUIA DE SALIDA ALMACEN',
  GUIA_TRANSFERENCIA_ALMACEN: 'GUIA DE TRANSFERENCIA ALMACEN',
};

const DEFAULT_SERIES: ReadonlyArray<{
  documentType: DocumentSeriesType;
  numero: string;
  esContingencia: boolean;
}> = [
  { documentType: DocumentSeriesType.FACTURA_ELECTRONICA, numero: 'F001', esContingencia: false },
  { documentType: DocumentSeriesType.BOLETA_VENTA_ELECTRONICA, numero: 'B001', esContingencia: false },
  { documentType: DocumentSeriesType.NOTA_CREDITO, numero: 'FC01', esContingencia: false },
  { documentType: DocumentSeriesType.NOTA_CREDITO, numero: 'BC01', esContingencia: false },
  { documentType: DocumentSeriesType.NOTA_DEBITO, numero: 'FD01', esContingencia: false },
  { documentType: DocumentSeriesType.NOTA_DEBITO, numero: 'BD01', esContingencia: false },
  {
    documentType: DocumentSeriesType.COMPROBANTE_RETENCION_ELECTRONICA,
    numero: 'R001',
    esContingencia: false,
  },
  {
    documentType: DocumentSeriesType.GUIA_REMISION_REMITENTE,
    numero: 'T001',
    esContingencia: false,
  },
  {
    documentType: DocumentSeriesType.COMPROBANTE_PERCEPCION_ELECTRONICA,
    numero: 'P001',
    esContingencia: false,
  },
  { documentType: DocumentSeriesType.NOTA_VENTA, numero: 'NV01', esContingencia: false },
  { documentType: DocumentSeriesType.LIQUIDACION_COMPRA, numero: 'L001', esContingencia: false },
  { documentType: DocumentSeriesType.GUIA_INGRESO_ALMACEN, numero: 'NIA1', esContingencia: false },
  { documentType: DocumentSeriesType.GUIA_SALIDA_ALMACEN, numero: 'NSA1', esContingencia: false },
  {
    documentType: DocumentSeriesType.GUIA_TRANSFERENCIA_ALMACEN,
    numero: 'NTA1',
    esContingencia: false,
  },
];

const selectEstablishment = {
  id: true,
  tenantId: true,
  nombre: true,
  codigo: true,
  activo: true,
  pais: true,
  departmentId: true,
  provinceId: true,
  districtId: true,
  direccionFiscal: true,
  direccionComercial: true,
  telefono: true,
  correoContacto: true,
  direccionWeb: true,
  informacionAdicional: true,
  urlImpresora: true,
  nombreImpresora: true,
  clienteDefault: true,
  logoArchivoId: true,
  sujetoIgv31556: true,
  esHospital: true,
  inventoryValuationMethod: true,
  inventoryLotAllocationMethod: true,
  blockExpiredProductSales: true,
  adjustmentQtyThreshold: true,
  numeroRegistroDigemid: true,
  titularPharmacistLicenseId: true,
  blockSalesAboveRegulatedPrice: true,
  posYapeNumero: true,
  posPlinNumero: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.EstablishmentSelect;

@Injectable()
export class EstablishmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly tenants: TenantsService,
    private readonly billing: BillingService,
  ) {}

  async findAll(
    filters?: {
      search?: string;
      hospital?: string;
      page?: number;
      pageSize?: number;
      tenantId?: string;
    },
    actor?: JwtRequestUser,
  ) {
    const search = filters?.search?.trim();
    const hospital = filters?.hospital?.trim().toLowerCase();
    const hospitalFlag =
      hospital === 'hospital' ? true : hospital === 'no-hospital' ? false : undefined;

    const tenantId = this.resolveTenantFilter(actor, filters?.tenantId);

    const where: Prisma.EstablishmentWhereInput = {
      deletedAt: null,
      activo: true,
      ...(tenantId ? { tenantId } : {}),
      ...(hospitalFlag !== undefined ? { esHospital: hospitalFlag } : {}),
      ...(search
        ? {
            OR: [
              { nombre: { contains: search, mode: 'insensitive' } },
              { codigo: { contains: search, mode: 'insensitive' } },
              { direccionFiscal: { contains: search, mode: 'insensitive' } },
              { direccionComercial: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const orderBy = { nombre: 'asc' } as const;

    if (filters?.page == null) {
      return this.prisma.establishment.findMany({
        where,
        orderBy,
        select: selectEstablishment,
      });
    }

    const { page, pageSize, skip, take } = paginationArgs({
      page: filters.page,
      pageSize: filters.pageSize,
    });

    const [items, total] = await Promise.all([
      this.prisma.establishment.findMany({
        where,
        orderBy,
        skip,
        take,
        select: selectEstablishment,
      }),
      this.prisma.establishment.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, pageSize);
  }

  async create(dto: CreateEstablishmentDto, actor?: JwtRequestUser) {
    const tenantId = this.resolveTenantIdForCreate(dto, actor);
    const tenant = await this.tenants.findOne(tenantId);
    await this.tenants.assertEstablishmentQuota(tenantId, tenant.maxEstablishments);

    try {
      const created = await this.prisma.establishment.create({
        data: {
          ...this.mapEstablishmentCreateInput(dto),
          tenantId,
        },
        select: selectEstablishment,
      });
      await this.ensureDefaultSeries(created.id);
      return created;
    } catch (err) {
      this.handleKnownError(err, 'Ya existe un establecimiento con ese código.');
    }
  }

  async update(id: string, dto: UpdateEstablishmentDto, actor?: JwtRequestUser) {
    const current = await this.prisma.establishment.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, tenantId: true },
    });
    if (!current) {
      throw new NotFoundException('Establecimiento no encontrado');
    }
    if (actor) {
      assertTenantAccess(actorFromJwt(actor), current.tenantId);
    }

    try {
      return await this.prisma.establishment.update({
        where: { id },
        data: this.mapEstablishmentUpdateInput(dto),
        select: selectEstablishment,
      });
    } catch (err) {
      this.handleKnownError(err, 'Ya existe un establecimiento con ese código.');
    }
  }

  async remove(id: string, actor?: JwtRequestUser) {
    const current = await this.prisma.establishment.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, tenantId: true },
    });
    if (!current) {
      throw new NotFoundException('Establecimiento no encontrado');
    }
    if (actor) {
      assertTenantAccess(actorFromJwt(actor), current.tenantId);
    }
    await this.prisma.establishment.update({
      where: { id },
      data: { deletedAt: new Date(), activo: false },
    });
  }

  getDocumentTypes() {
    return Object.values(DocumentSeriesType).map((value) => ({
      value,
      label: DOCUMENT_LABELS[value],
    }));
  }

  listDepartments() {
    return this.cache.getOrSet('ubigeo:departments', () =>
      this.prisma.department.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      }),
    );
  }

  listProvinces(departmentId: string) {
    return this.cache.getOrSet(`ubigeo:provinces:${departmentId}`, () =>
      this.prisma.province.findMany({
        where: { departmentId },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, departmentId: true },
      }),
    );
  }

  listDistricts(provinceId: string) {
    return this.cache.getOrSet(`ubigeo:districts:${provinceId}`, () =>
      this.prisma.district.findMany({
        where: { provinceId },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, provinceId: true },
      }),
    );
  }

  async listSeries(establishmentId: string, actor?: JwtRequestUser) {
    await this.ensureEstablishment(establishmentId, actor);
    await this.ensureDefaultSeries(establishmentId);
    return this.prisma.establishmentSeries.findMany({
      where: { establishmentId },
      orderBy: [{ documentType: 'asc' }, { numero: 'asc' }],
      select: {
        id: true,
        documentType: true,
        numero: true,
        esContingencia: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async addSeries(establishmentId: string, dto: CreateEstablishmentSeriesDto, actor?: JwtRequestUser) {
    await this.ensureEstablishment(establishmentId, actor);

    try {
      return await this.prisma.establishmentSeries.create({
        data: {
          establishmentId,
          documentType: dto.documentType,
          numero: dto.numero.trim().toUpperCase(),
          esContingencia: dto.esContingencia ?? false,
        },
        select: {
          id: true,
          documentType: true,
          numero: true,
          esContingencia: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (err) {
      this.handleKnownError(
        err,
        'La serie ya existe para este establecimiento y tipo de documento.',
      );
    }
  }

  async deleteSeries(establishmentId: string, seriesId: string, actor?: JwtRequestUser) {
    await this.ensureEstablishment(establishmentId, actor);
    const removed = await this.prisma.establishmentSeries.deleteMany({
      where: { id: seriesId, establishmentId },
    });
    if (removed.count === 0) {
      throw new NotFoundException('Serie no encontrada para el establecimiento');
    }
  }

  private async ensureEstablishment(id: string, actor?: JwtRequestUser) {
    const current = await this.prisma.establishment.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, tenantId: true },
    });
    if (!current) {
      throw new NotFoundException('Establecimiento no encontrado');
    }
    if (actor) {
      assertTenantAccess(actorFromJwt(actor), current.tenantId);
    }
  }

  private async ensureDefaultSeries(establishmentId: string) {
    await this.prisma.establishmentSeries.createMany({
      data: DEFAULT_SERIES.map((s) => ({
        establishmentId,
        documentType: s.documentType,
        numero: s.numero,
        esContingencia: s.esContingencia,
      })),
      skipDuplicates: true,
    });
  }

  private resolveTenantFilter(
    actor?: JwtRequestUser,
    requestedTenantId?: string,
  ): string | undefined {
    if (actor && !isPlatformAdmin(actor.role)) {
      return actor.tenantId ?? undefined;
    }
    return requestedTenantId?.trim() || undefined;
  }

  private resolveTenantIdForCreate(
    dto: CreateEstablishmentDto,
    actor?: JwtRequestUser,
  ): string {
    if (actor && !isPlatformAdmin(actor.role)) {
      if (!actor.tenantId) {
        throw new ForbiddenException('Usuario sin tenant asignado');
      }
      return actor.tenantId;
    }
    if (!dto.tenantId) {
      throw new ForbiddenException('Debe indicar tenantId del cliente');
    }
    return dto.tenantId;
  }

  private mapEstablishmentCreateInput(
    dto: CreateEstablishmentDto,
  ): Omit<Prisma.EstablishmentUncheckedCreateInput, 'tenantId'> {
    return {
      nombre: dto.nombre.trim(),
      codigo: this.normNullable(dto.codigo) ?? null,
      activo: dto.activo ?? true,
      pais: (dto.pais?.trim() || 'PERU').toUpperCase(),
      departmentId: this.normNullable(dto.departmentId) ?? null,
      provinceId: this.normNullable(dto.provinceId) ?? null,
      districtId: this.normNullable(dto.districtId) ?? null,
      direccionFiscal: this.normNullable(dto.direccionFiscal) ?? null,
      direccionComercial: this.normNullable(dto.direccionComercial) ?? null,
      telefono: this.normNullable(dto.telefono) ?? null,
      correoContacto: this.normNullable(dto.correoContacto?.toLowerCase()) ?? null,
      direccionWeb: this.normNullable(dto.direccionWeb) ?? null,
      informacionAdicional: this.normNullable(dto.informacionAdicional) ?? null,
      urlImpresora: this.normNullable(dto.urlImpresora) ?? null,
      nombreImpresora: this.normNullable(dto.nombreImpresora) ?? null,
      clienteDefault: this.normNullable(dto.clienteDefault) ?? null,
      logoArchivoId: this.normNullable(dto.logoArchivoId) ?? null,
      sujetoIgv31556: dto.sujetoIgv31556 ?? false,
      esHospital: dto.esHospital ?? false,
      inventoryValuationMethod: dto.inventoryValuationMethod,
      inventoryLotAllocationMethod: dto.inventoryLotAllocationMethod,
      blockExpiredProductSales: dto.blockExpiredProductSales,
      adjustmentQtyThreshold:
        dto.adjustmentQtyThreshold !== undefined
          ? new Prisma.Decimal(dto.adjustmentQtyThreshold)
          : undefined,
      numeroRegistroDigemid: this.normNullable(dto.numeroRegistroDigemid) ?? null,
      titularPharmacistLicenseId: this.normNullable(dto.titularPharmacistLicenseId) ?? null,
      blockSalesAboveRegulatedPrice: dto.blockSalesAboveRegulatedPrice ?? false,
      posYapeNumero: this.normPaymentPhone(dto.posYapeNumero),
      posPlinNumero: this.normPaymentPhone(dto.posPlinNumero),
    };
  }

  private mapEstablishmentUpdateInput(
    dto: UpdateEstablishmentDto,
  ): Prisma.EstablishmentUncheckedUpdateInput {
    const data: Prisma.EstablishmentUncheckedUpdateInput = {};

    if (dto.nombre !== undefined) data.nombre = dto.nombre.trim();
    if (dto.codigo !== undefined) data.codigo = this.normNullable(dto.codigo);
    if (dto.activo !== undefined) data.activo = dto.activo;
    if (dto.pais !== undefined) data.pais = dto.pais.trim().toUpperCase();
    if (dto.departmentId !== undefined) data.departmentId = this.normNullable(dto.departmentId);
    if (dto.provinceId !== undefined) data.provinceId = this.normNullable(dto.provinceId);
    if (dto.districtId !== undefined) data.districtId = this.normNullable(dto.districtId);
    if (dto.direccionFiscal !== undefined) data.direccionFiscal = this.normNullable(dto.direccionFiscal);
    if (dto.direccionComercial !== undefined) data.direccionComercial = this.normNullable(dto.direccionComercial);
    if (dto.telefono !== undefined) data.telefono = this.normNullable(dto.telefono);
    if (dto.correoContacto !== undefined) data.correoContacto = this.normNullable(dto.correoContacto?.toLowerCase());
    if (dto.direccionWeb !== undefined) data.direccionWeb = this.normNullable(dto.direccionWeb);
    if (dto.informacionAdicional !== undefined) data.informacionAdicional = this.normNullable(dto.informacionAdicional);
    if (dto.urlImpresora !== undefined) data.urlImpresora = this.normNullable(dto.urlImpresora);
    if (dto.nombreImpresora !== undefined) data.nombreImpresora = this.normNullable(dto.nombreImpresora);
    if (dto.clienteDefault !== undefined) data.clienteDefault = this.normNullable(dto.clienteDefault);
    if (dto.logoArchivoId !== undefined) data.logoArchivoId = this.normNullable(dto.logoArchivoId);
    if (dto.sujetoIgv31556 !== undefined) data.sujetoIgv31556 = dto.sujetoIgv31556;
    if (dto.esHospital !== undefined) data.esHospital = dto.esHospital;
    if (dto.inventoryValuationMethod !== undefined) {
      data.inventoryValuationMethod = dto.inventoryValuationMethod;
    }
    if (dto.inventoryLotAllocationMethod !== undefined) {
      data.inventoryLotAllocationMethod = dto.inventoryLotAllocationMethod;
    }
    if (dto.blockExpiredProductSales !== undefined) {
      data.blockExpiredProductSales = dto.blockExpiredProductSales;
    }
    if (dto.adjustmentQtyThreshold !== undefined) {
      data.adjustmentQtyThreshold = new Prisma.Decimal(dto.adjustmentQtyThreshold);
    }
    if (dto.numeroRegistroDigemid !== undefined) {
      data.numeroRegistroDigemid = this.normNullable(dto.numeroRegistroDigemid);
    }
    if (dto.titularPharmacistLicenseId !== undefined) {
      data.titularPharmacistLicenseId = this.normNullable(dto.titularPharmacistLicenseId);
    }
    if (dto.blockSalesAboveRegulatedPrice !== undefined) {
      data.blockSalesAboveRegulatedPrice = dto.blockSalesAboveRegulatedPrice;
    }
    if (dto.posYapeNumero !== undefined) {
      data.posYapeNumero = this.normPaymentPhone(dto.posYapeNumero);
    }
    if (dto.posPlinNumero !== undefined) {
      data.posPlinNumero = this.normPaymentPhone(dto.posPlinNumero);
    }

    return data;
  }

  async getPosPaymentSettings(establishmentId: string, actor?: JwtRequestUser) {
    await this.ensureEstablishment(establishmentId, actor);
    const row = await this.prisma.establishment.findFirst({
      where: { id: establishmentId, deletedAt: null },
      select: {
        id: true,
        nombre: true,
        posYapeNumero: true,
        posPlinNumero: true,
      },
    });
    if (!row) throw new NotFoundException('Establecimiento no encontrado');
    return row;
  }

  /** Perfil comercial + fiscal del establecimiento activo del usuario. */
  async getPharmacyProfile(establishmentId: string, actor: JwtRequestUser) {
    await this.ensureEstablishment(establishmentId, actor);
    const row = await this.prisma.establishment.findFirst({
      where: { id: establishmentId, deletedAt: null },
      select: {
        ...selectEstablishment,
        numeroRegistroDigemid: true,
        tenant: { select: { id: true, nombre: true, ruc: true } },
      },
    });
    if (!row) throw new NotFoundException('Establecimiento no encontrado');

    const billing = await this.billing.getConfig(establishmentId);
    const { tenant, ...establishment } = row;

    return {
      establishmentId: establishment.id,
      tenantId: tenant.id,
      tenantNombre: tenant.nombre,
      tenantRuc: tenant.ruc,
      nombre: establishment.nombre,
      codigo: establishment.codigo,
      pais: establishment.pais,
      departmentId: establishment.departmentId,
      provinceId: establishment.provinceId,
      districtId: establishment.districtId,
      direccionFiscal: establishment.direccionFiscal,
      direccionComercial: establishment.direccionComercial,
      telefono: establishment.telefono,
      correoContacto: establishment.correoContacto,
      direccionWeb: establishment.direccionWeb,
      informacionAdicional: establishment.informacionAdicional,
      numeroRegistroDigemid: establishment.numeroRegistroDigemid,
      logoArchivoId: establishment.logoArchivoId,
      logoUrl: establishment.logoArchivoId
        ? `/api/v1/files/${establishment.logoArchivoId}`
        : null,
      rucEmisor: billing.rucEmisor ?? tenant.ruc ?? null,
      razonSocialEmisor: billing.razonSocialEmisor ?? tenant.nombre ?? null,
      billingProvider: billing.provider,
      hasOseCredentials: !!(billing.hasApiToken || billing.hasCertificate),
    };
  }

  async updatePharmacyProfile(
    establishmentId: string,
    dto: UpdatePharmacyProfileDto,
    actor: JwtRequestUser,
  ) {
    await this.ensureEstablishment(establishmentId, actor);

    const establishmentPatch: UpdateEstablishmentDto = {};
    if (dto.nombre !== undefined) establishmentPatch.nombre = dto.nombre;
    if (dto.codigo !== undefined) establishmentPatch.codigo = dto.codigo;
    if (dto.direccionFiscal !== undefined) establishmentPatch.direccionFiscal = dto.direccionFiscal;
    if (dto.direccionComercial !== undefined) {
      establishmentPatch.direccionComercial = dto.direccionComercial;
    }
    if (dto.telefono !== undefined) establishmentPatch.telefono = dto.telefono;
    if (dto.correoContacto !== undefined) establishmentPatch.correoContacto = dto.correoContacto;
    if (dto.direccionWeb !== undefined) establishmentPatch.direccionWeb = dto.direccionWeb;
    if (dto.informacionAdicional !== undefined) {
      establishmentPatch.informacionAdicional = dto.informacionAdicional;
    }
    if (dto.departmentId !== undefined) {
      establishmentPatch.departmentId = dto.departmentId ?? undefined;
    }
    if (dto.provinceId !== undefined) {
      establishmentPatch.provinceId = dto.provinceId ?? undefined;
    }
    if (dto.districtId !== undefined) {
      establishmentPatch.districtId = dto.districtId ?? undefined;
    }
    if (dto.logoArchivoId !== undefined) {
      establishmentPatch.logoArchivoId = dto.logoArchivoId ?? undefined;
      // Allow explicit null clear via raw update below when needed
    }
    if (dto.numeroRegistroDigemid !== undefined) {
      establishmentPatch.numeroRegistroDigemid = dto.numeroRegistroDigemid ?? undefined;
    }

    if (Object.keys(establishmentPatch).length > 0 || dto.logoArchivoId === null) {
      const data = this.mapEstablishmentUpdateInput(establishmentPatch);
      if (dto.logoArchivoId === null) {
        data.logoArchivoId = null;
      }
      if (dto.numeroRegistroDigemid === null) {
        data.numeroRegistroDigemid = null;
      }
      if (dto.departmentId === null) data.departmentId = null;
      if (dto.provinceId === null) data.provinceId = null;
      if (dto.districtId === null) data.districtId = null;

      await this.prisma.establishment.update({
        where: { id: establishmentId },
        data,
      });
    }

    if (dto.rucEmisor !== undefined || dto.razonSocialEmisor !== undefined) {
      const rucEmisor =
        dto.rucEmisor !== undefined ? dto.rucEmisor.trim() || null : undefined;
      const razonSocialEmisor =
        dto.razonSocialEmisor !== undefined
          ? dto.razonSocialEmisor.trim() || null
          : undefined;

      // Solo toca campos fiscales; no altera proveedor/token OSE.
      await this.prisma.establishmentBillingConfig.upsert({
        where: { establishmentId },
        create: {
          establishmentId,
          rucEmisor: rucEmisor ?? null,
          razonSocialEmisor: razonSocialEmisor ?? null,
        },
        update: {
          ...(rucEmisor !== undefined ? { rucEmisor } : {}),
          ...(razonSocialEmisor !== undefined ? { razonSocialEmisor } : {}),
        },
      });

      // Sincroniza RUC comercial del tenant SaaS cuando el cliente lo actualiza.
      if (actor.tenantId && rucEmisor) {
        await this.prisma.tenant
          .update({
            where: { id: actor.tenantId },
            data: { ruc: rucEmisor },
          })
          .catch(() => undefined);
      }
    }

    return this.getPharmacyProfile(establishmentId, actor);
  }

  private normPaymentPhone(value: string | undefined): string | null | undefined {
    if (value === undefined) return undefined;
    const digits = value.replace(/\D/g, '');
    return digits ? digits : null;
  }

  private normNullable(value: string | undefined): string | null | undefined {
    if (value === undefined) return undefined;
    const v = value.trim();
    return v ? v : null;
  }

  private handleKnownError(err: unknown, conflictMessage: string): never {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictException(conflictMessage);
    }
    throw err;
  }
}
