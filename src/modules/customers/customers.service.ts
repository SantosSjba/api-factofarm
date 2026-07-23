import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CustomerDocumentType, Prisma } from '../../generated/prisma/client';
import { AuditLogService } from '../../common/services/audit-log.service';
import { EntityIntegrityService } from '../../common/services/entity-integrity.service';
import { assertTenantAccess, actorFromJwt, requireTenantId, tenantWhere } from '../../common/scoping/tenant-scope.util';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { PrismaService } from '../../prisma/prisma.service';
import { LpdpService } from '../compliance/services/lpdp.service';
import { CreateCustomerZoneDto } from './dto/create-customer-zone.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomerListQueryDto } from './dto/customer-list-query.dto';
import { ExportCustomersDto } from './dto/export-customers.dto';
import { UpdateCustomerBarcodeDto } from './dto/update-customer-barcode.dto';
import { UpdateCustomerZoneDto } from './dto/update-customer-zone.dto';
import { UpdateCustomerStatusDto } from './dto/update-customer-status.dto';
import { UpdateCustomerTagsDto } from './dto/update-customer-tags.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import * as XLSX from 'xlsx';

const CUSTOMER_DOC_LABELS: Record<CustomerDocumentType, string> = {
  DNI: 'DNI',
  RUC: 'RUC',
  CE: 'CARNET EXTRANJERIA',
  PASAPORTE: 'PASAPORTE',
  DOC_SIN_RUC: 'Doc.trib.no.dom.sin.ruc',
  OTRO: 'OTRO',
};

const selectCustomerAddress = {
  id: true,
  esPrincipal: true,
  pais: true,
  departmentId: true,
  provinceId: true,
  districtId: true,
  direccion: true,
  telefono: true,
  correoElectronico: true,
  correosOpcionales: true,
} satisfies Prisma.CustomerAddressSelect;

const selectCustomer = {
  id: true,
  nombre: true,
  nombreComercial: true,
  tipoDocumento: true,
  numeroDocumento: true,
  nacionalidad: true,
  diasCredito: true,
  limiteCredito: true,
  codigoInterno: true,
  codigoBarra: true,
  observaciones: true,
  sitioWeb: true,
  contactoNombre: true,
  contactoTelefono: true,
  telefono: true,
  correoElectronico: true,
  correosOpcionales: true,
  puntosAcumulados: true,
  activo: true,
  habilitado: true,
  etiquetas: true,
  customerTypeId: true,
  zoneId: true,
  vendedorAsignadoId: true,
  createdAt: true,
  updatedAt: true,
  customerType: { select: { id: true, descripcion: true } },
  zone: { select: { id: true, nombre: true } },
  vendedorAsignado: { select: { id: true, nombre: true } },
  addresses: { select: selectCustomerAddress, orderBy: [{ esPrincipal: 'desc' }, { createdAt: 'asc' }] },
} satisfies Prisma.CustomerSelect;

type CustomerRow = Prisma.CustomerGetPayload<{ select: typeof selectCustomer }>;

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
    private readonly lpdp: LpdpService,
    private readonly integrity: EntityIntegrityService,
  ) {}

  async list(query: CustomerListQueryDto, actor?: JwtRequestUser) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const search = query.search?.trim();
    const field = (query.field ?? 'all').trim();
    const estado = query.estado ?? 'all';

    const searchable: Prisma.CustomerWhereInput[] = [];
    if (search) {
      if (field === 'all' || field === 'nombre') {
        searchable.push({ nombre: { contains: search, mode: 'insensitive' } });
      }
      if (field === 'all' || field === 'numeroDocumento') {
        searchable.push({ numeroDocumento: { contains: search, mode: 'insensitive' } });
      }
      if (field === 'all' || field === 'codigoInterno') {
        searchable.push({ codigoInterno: { contains: search, mode: 'insensitive' } });
      }
    }

    const where: Prisma.CustomerWhereInput = {
      deletedAt: null,
      ...(actor ? tenantWhere(actorFromJwt(actor)) : {}),
      ...(query.customerTypeId ? { customerTypeId: query.customerTypeId } : {}),
      ...(query.zoneId ? { zoneId: query.zoneId } : {}),
      ...(estado === 'habilitado'
        ? { habilitado: true }
        : estado === 'inhabilitado'
          ? { habilitado: false }
          : {}),
      ...(searchable.length ? { OR: searchable } : {}),
    };

    // Evita transacción para lecturas paginadas y reduce riesgo de P2028 (maxWait).
    const [total, items] = await Promise.all([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: selectCustomer,
      }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async findOne(id: string, actor?: JwtRequestUser) {
    const row = await this.prisma.customer.findFirst({
      where: { id, deletedAt: null },
      select: { ...selectCustomer, tenantId: true },
    });
    if (!row) throw new NotFoundException('Cliente no encontrado');
    if (actor) {
      assertTenantAccess(actorFromJwt(actor), row.tenantId);
    }
    const { tenantId: _tenantId, ...customer } = row;
    return customer;
  }

  async create(dto: CreateCustomerDto, actor?: JwtRequestUser) {
    const tenantId = actor ? requireTenantId(actorFromJwt(actor)) : undefined;
    if (!tenantId) {
      throw new ForbiddenException('Debe operar dentro de un cliente');
    }
    try {
      const created = await this.prisma.customer.create({
        data: { ...this.toCreateInput(dto), tenantId },
        select: { id: true },
      });
      if (dto.addresses?.length) {
        await this.replaceAddresses(created.id, dto.addresses);
      }
      await this.lpdp.ensureCustomerConsentOnCreate(dto, created.id, actor?.sub);
      await this.audit.log({
        userId: actor?.sub,
        action: 'CREATE',
        entity: 'Customer',
        entityId: created.id,
      });
      return this.findOne(created.id, actor);
    } catch (err) {
      this.handleKnownError(err);
    }
  }

  async update(id: string, dto: UpdateCustomerDto, actor?: JwtRequestUser) {
    await this.ensureCustomer(id, actor);
    const data: Prisma.CustomerUncheckedUpdateInput = this.toUpdateInput(dto);
    try {
      await this.prisma.customer.update({ where: { id }, data });
      if (dto.addresses) {
        await this.replaceAddresses(id, dto.addresses);
      }
      await this.audit.log({
        userId: actor?.sub,
        action: 'UPDATE',
        entity: 'Customer',
        entityId: id,
        diff: dto,
      });
      return this.findOne(id, actor);
    } catch (err) {
      this.handleKnownError(err);
    }
  }

  async remove(id: string, actor?: JwtRequestUser) {
    await this.ensureCustomer(id, actor);
    await this.integrity.assertCanDeleteCustomer(id);
    await this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date(), activo: false, habilitado: false },
    });
    await this.audit.log({
      userId: actor?.sub,
      action: 'DELETE',
      entity: 'Customer',
      entityId: id,
    });
  }

  async updateStatus(id: string, dto: UpdateCustomerStatusDto, actor?: JwtRequestUser) {
    await this.ensureCustomer(id, actor);
    const updated = await this.prisma.customer.update({
      where: { id },
      data: { habilitado: dto.habilitado },
      select: selectCustomer,
    });
    await this.audit.log({
      userId: actor?.sub,
      action: 'UPDATE_STATUS',
      entity: 'Customer',
      entityId: id,
      diff: dto,
    });
    return updated;
  }

  async updateBarcode(id: string, dto: UpdateCustomerBarcodeDto, actor?: JwtRequestUser) {
    await this.ensureCustomer(id, actor);
    const updated = await this.prisma.customer.update({
      where: { id },
      data: { codigoBarra: dto.codigoBarra.trim() || null },
      select: selectCustomer,
    });
    await this.audit.log({
      userId: actor?.sub,
      action: 'UPDATE_BARCODE',
      entity: 'Customer',
      entityId: id,
      diff: dto,
    });
    return updated;
  }

  async updateTags(id: string, dto: UpdateCustomerTagsDto, actor?: JwtRequestUser) {
    await this.ensureCustomer(id, actor);
    const updated = await this.prisma.customer.update({
      where: { id },
      data: {
        etiquetas: dto.etiquetas.map((x) => x.trim()).filter(Boolean),
      },
      select: selectCustomer,
    });
    await this.audit.log({
      userId: actor?.sub,
      action: 'UPDATE_TAGS',
      entity: 'Customer',
      entityId: id,
      diff: dto,
    });
    return updated;
  }

  listZones(actor?: JwtRequestUser) {
    const tenantFilter = actor ? tenantWhere(actorFromJwt(actor)) : {};
    return this.prisma.customerZone.findMany({
      where: { deletedAt: null, ...tenantFilter },
      orderBy: { nombre: 'asc' },
      select: { id: true, nombre: true },
    });
  }

  async createZone(dto: CreateCustomerZoneDto, actor: JwtRequestUser) {
    const tenantId = requireTenantId(actorFromJwt(actor));
    try {
      const created = await this.prisma.customerZone.create({
        data: { nombre: dto.nombre.trim().toUpperCase(), tenantId },
        select: { id: true, nombre: true },
      });
      await this.audit.log({
        userId: actor?.sub,
        action: 'CREATE',
        entity: 'CustomerZone',
        entityId: created.id,
      });
      return created;
    } catch (err) {
      this.handleKnownError(err, 'Ya existe una zona con ese nombre.');
    }
  }

  async updateZone(id: string, dto: UpdateCustomerZoneDto, actor?: JwtRequestUser) {
    const zone = await this.prisma.customerZone.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, tenantId: true },
    });
    if (!zone) throw new NotFoundException('Zona no encontrada');
    if (actor) {
      assertTenantAccess(actorFromJwt(actor), zone.tenantId);
    }
    try {
      const updated = await this.prisma.customerZone.update({
        where: { id },
        data: { nombre: dto.nombre?.trim().toUpperCase() || undefined },
        select: { id: true, nombre: true },
      });
      await this.audit.log({
        userId: actor?.sub,
        action: 'UPDATE',
        entity: 'CustomerZone',
        entityId: id,
        diff: dto,
      });
      return updated;
    } catch (err) {
      this.handleKnownError(err, 'Ya existe una zona con ese nombre.');
    }
  }

  async removeZone(id: string, actor?: JwtRequestUser) {
    const zone = await this.prisma.customerZone.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, tenantId: true },
    });
    if (!zone) throw new NotFoundException('Zona no encontrada');
    if (actor) {
      assertTenantAccess(actorFromJwt(actor), zone.tenantId);
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.customer.updateMany({
        where: { zoneId: id, deletedAt: null, tenantId: zone.tenantId },
        data: { zoneId: null },
      });
      await tx.customerZone.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    });
    await this.audit.log({
      userId: actor?.sub,
      action: 'DELETE',
      entity: 'CustomerZone',
      entityId: id,
    });
  }

  async listSellers(actor?: JwtRequestUser) {
    const tenantFilter = actor ? tenantWhere(actorFromJwt(actor)) : {};
    return this.prisma.user.findMany({
      where: { deletedAt: null, role: 'VENDEDOR', ...tenantFilter },
      orderBy: { nombre: 'asc' },
      select: { id: true, nombre: true },
    });
  }

  getDocumentTypes() {
    return Object.values(CustomerDocumentType).map((value) => ({
      value,
      label: CUSTOMER_DOC_LABELS[value],
    }));
  }

  getNationalities() {
    return ['PERU', 'BOLIVIA', 'CHILE', 'ECUADOR', 'COLOMBIA'].map((v) => ({
      value: v,
      label: v,
    }));
  }

  async previewImportFromExcel(file: Express.Multer.File, actor?: JwtRequestUser) {
    return this.importFromExcel(file, actor, { dryRun: true });
  }

  async importFromExcel(
    file: Express.Multer.File,
    actor?: JwtRequestUser,
    options?: { dryRun?: boolean },
  ) {
    if (!file?.buffer?.length) {
      throw new NotFoundException('Archivo no válido para importar');
    }
    const tenantId = actor ? requireTenantId(actorFromJwt(actor)) : undefined;
    if (!tenantId) {
      throw new ForbiddenException('Debe operar dentro de un cliente');
    }
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const first = workbook.SheetNames[0];
    const sheet = workbook.Sheets[first];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const nombre = String(r['Nombre/Razón Social'] ?? '').trim();
      const nombreComercial = String(r['Nombre Comercial'] ?? '').trim();
      const numeroDocumento = String(r['Número de documento'] ?? '').trim();
      const tipoDocumentoRaw = String(r['Código documento de identidad'] ?? '').trim();
      const tipoDocumento = this.mapPersonDocumentType(tipoDocumentoRaw);

      if (!nombre || !tipoDocumento || !numeroDocumento) {
        errors.push(`Fila ${i + 2}: faltan datos obligatorios.`);
        continue;
      }

      const countryCode = String(r['Código del Páis'] ?? '').trim();
      const ubigeoCode = String(r['Código de Ubigeo'] ?? '').trim();
      const direccion = String(r['Dirección'] ?? '').trim();
      const correo = String(r['Correo electrónico'] ?? '').trim();
      const telefono = String(r['Teléfono'] ?? '').trim();
      const tipoClienteNombre = String(r['Tipo Cliente'] ?? '').trim();

      const customerTypeId = tipoClienteNombre
        ? (
            await this.prisma.customerType.findFirst({
              where: { deletedAt: null, descripcion: { equals: tipoClienteNombre, mode: 'insensitive' } },
              select: { id: true },
            })
          )?.id ?? null
        : null;

      const district = ubigeoCode
        ? await this.prisma.district.findFirst({
            where: { id: ubigeoCode },
            select: { id: true, provinceId: true, province: { select: { departmentId: true } } },
          })
        : null;

      if (ubigeoCode && !district) {
        errors.push(`Fila ${i + 2}: código de ubigeo inválido (${ubigeoCode}).`);
        continue;
      }

      if (tipoDocumentoRaw && !tipoDocumento) {
        errors.push(`Fila ${i + 2}: tipo documento inválido (${tipoDocumentoRaw}).`);
        continue;
      }

      try {
        const existing = await this.prisma.customer.findFirst({
          where: {
            tenantId,
            tipoDocumento,
            numeroDocumento,
          },
          select: { id: true, deletedAt: true },
        });
        if (options?.dryRun) {
          if (existing) updated++;
          else created++;
          continue;
        }
        if (existing) {
          await this.prisma.customer.update({
            where: { id: existing.id },
            data: {
              nombre: nombre.toUpperCase(),
              nombreComercial: nombreComercial || null,
              telefono: telefono || null,
              correoElectronico: correo || null,
              customerTypeId,
              deletedAt: null,
            },
          });
          if (direccion || correo || telefono || district || countryCode) {
            const principal = await this.prisma.customerAddress.findFirst({
              where: { customerId: existing.id, esPrincipal: true },
              select: { id: true },
            });
            const addressData = {
              pais: countryCode ? this.mapCountryCode(countryCode) : 'PERU',
              departmentId: district?.province.departmentId ?? null,
              provinceId: district?.provinceId ?? null,
              districtId: district?.id ?? null,
              direccion: direccion || null,
              telefono: telefono || null,
              correoElectronico: correo || null,
              correosOpcionales: null,
            };
            if (principal) {
              await this.prisma.customerAddress.update({
                where: { id: principal.id },
                data: addressData,
              });
            } else {
              await this.prisma.customerAddress.create({
                data: {
                  customerId: existing.id,
                  esPrincipal: true,
                  ...addressData,
                },
              });
            }
          }
          updated++;
        } else {
          const createdCustomer = await this.prisma.customer.create({
            data: {
              tenantId,
              nombre: nombre.toUpperCase(),
              nombreComercial: nombreComercial || null,
              tipoDocumento,
              numeroDocumento,
              telefono: telefono || null,
              correoElectronico: correo || null,
              customerTypeId,
            },
            select: { id: true },
          });
          if (direccion || correo || telefono || district || countryCode) {
            await this.prisma.customerAddress.create({
              data: {
                customerId: createdCustomer.id,
                esPrincipal: true,
                pais: countryCode ? this.mapCountryCode(countryCode) : 'PERU',
                departmentId: district?.province.departmentId ?? null,
                provinceId: district?.provinceId ?? null,
                districtId: district?.id ?? null,
                direccion: direccion || null,
                telefono: telefono || null,
                correoElectronico: correo || null,
                correosOpcionales: null,
              },
            });
          }
          created++;
        }
      } catch (e) {
        errors.push(`Fila ${i + 2}: error al procesar.`);
      }
    }

    const result = {
      totalRows: rows.length,
      created,
      updated,
      errors,
      preview: options?.dryRun ?? false,
    };
    if (!options?.dryRun) {
      await this.audit.log({
        userId: actor?.sub,
        action: 'IMPORT',
        entity: 'Customer',
        diff: result,
      });
    }
    return result;
  }

  buildImportTemplateBuffer() {
    const rows = [
      {
        'Código documento de identidad': 1,
        'Número de documento': 41784438,
        'Nombre/Razón Social': 'Juan Pinedo',
        'Nombre Comercial': '',
        'Código del Páis': '',
        'Código de Ubigeo': '',
        'Dirección': '',
        'Correo electrónico': '',
        'Teléfono': '',
        'Tipo Cliente': 'Interno',
      },
      {
        'Código documento de identidad': 6,
        'Número de documento': 20505973522,
        'Nombre/Razón Social': 'Empresa SAC',
        'Nombre Comercial': 'Empresa SAC',
        'Código del Páis': 'PE',
        'Código de Ubigeo': 150101,
        'Dirección': 'Los pinos 125',
        'Correo electrónico': 'embo@gmail.com',
        'Teléfono': 7152233,
        'Tipo Cliente': '',
      },
    ];
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Hoja1');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  private mapPersonDocumentType(rawCode: string): CustomerDocumentType | null {
    const clean = rawCode.trim();
    if (!clean) return null;
    const map: Record<string, CustomerDocumentType> = {
      '1': 'DNI',
      '6': 'RUC',
      '4': 'CE',
      '7': 'PASAPORTE',
      A: 'DOC_SIN_RUC',
      B: 'OTRO',
      DNI: 'DNI',
      RUC: 'RUC',
      CE: 'CE',
      PASAPORTE: 'PASAPORTE',
      DOC_SIN_RUC: 'DOC_SIN_RUC',
      OTRO: 'OTRO',
    };
    return map[clean.toUpperCase()] ?? null;
  }

  private mapCountryCode(code: string): string {
    const clean = code.trim().toUpperCase();
    if (!clean) return 'PERU';
    if (clean === 'PE' || clean === 'PER') return 'PERU';
    return clean;
  }

  async buildExportBuffer(dto: ExportCustomersDto, actor?: JwtRequestUser) {
    const where: Prisma.CustomerWhereInput = {
      deletedAt: null,
      ...(actor ? tenantWhere(actorFromJwt(actor)) : {}),
    };
    if (dto.sellerId) where.vendedorAsignadoId = dto.sellerId;

    const period = dto.period ?? 'all';
    if (period === 'month' && dto.month) {
      const range = this.parseMonth(dto.month);
      if (range) {
        where.createdAt = { gte: range.start, lt: range.end };
      }
    }
    if (period === 'between-months' && dto.fromMonth && dto.toMonth) {
      const fromRange = this.parseMonth(dto.fromMonth);
      const toRange = this.parseMonth(dto.toMonth);
      if (fromRange && toRange) {
        where.createdAt = { gte: fromRange.start, lt: toRange.end };
      }
    }
    if (period === 'seller' && dto.sellerId) {
      where.vendedorAsignadoId = dto.sellerId;
    }
    const rows = await this.prisma.customer.findMany({
      where,
      orderBy: { nombre: 'asc' },
      select: {
        nombre: true,
        tipoDocumento: true,
        numeroDocumento: true,
        codigoInterno: true,
        diasCredito: true,
        observaciones: true,
        puntosAcumulados: true,
        customerType: { select: { descripcion: true } },
        vendedorAsignado: { select: { nombre: true } },
        zone: { select: { nombre: true } },
      },
    });
    const normalized = rows.map((r) => ({
      NOMBRE: r.nombre,
      TIPO_DOCUMENTO: r.tipoDocumento,
      NUMERO_DOCUMENTO: r.numeroDocumento,
      CODIGO_INTERNO: r.codigoInterno ?? '',
      TIPO_CLIENTE: r.customerType?.descripcion ?? '',
      DIAS_CREDITO: r.diasCredito,
      VENDEDOR: r.vendedorAsignado?.nombre ?? '',
      ZONA: r.zone?.nombre ?? '',
      OBSERVACIONES: r.observaciones ?? '',
      PUNTOS: r.puntosAcumulados,
    }));
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(normalized);
    XLSX.utils.book_append_sheet(workbook, sheet, 'clientes');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  private parseMonth(value: string): { start: Date; end: Date } | null {
    const m = /^(\d{2})\/(\d{4})$/.exec(value.trim());
    if (!m) return null;
    const month = Number(m[1]);
    const year = Number(m[2]);
    if (!Number.isFinite(month) || !Number.isFinite(year) || month < 1 || month > 12) return null;
    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));
    return { start, end };
  }

  private toCreateInput(dto: CreateCustomerDto): Omit<Prisma.CustomerUncheckedCreateInput, 'tenantId'> {
    return {
      nombre: dto.nombre.trim().toUpperCase(),
      nombreComercial: this.norm(dto.nombreComercial),
      tipoDocumento: dto.tipoDocumento,
      numeroDocumento: dto.numeroDocumento.trim(),
      nacionalidad: this.normUpper(dto.nacionalidad) ?? 'PERU',
      diasCredito: dto.diasCredito ?? 0,
      limiteCredito:
        dto.limiteCredito !== undefined && dto.limiteCredito !== null
          ? new Prisma.Decimal(dto.limiteCredito)
          : null,
      codigoInterno: this.norm(dto.codigoInterno),
      codigoBarra: this.norm(dto.codigoBarra),
      observaciones: this.norm(dto.observaciones),
      sitioWeb: this.norm(dto.sitioWeb),
      contactoNombre: this.norm(dto.contactoNombre),
      contactoTelefono: this.norm(dto.contactoTelefono),
      telefono: this.norm(dto.telefono),
      correoElectronico: this.normLower(dto.correoElectronico),
      correosOpcionales: this.norm(dto.correosOpcionales),
      puntosAcumulados: dto.puntosAcumulados ?? 0,
      activo: dto.activo ?? true,
      habilitado: dto.habilitado ?? true,
      etiquetas: (dto.etiquetas ?? []).map((x) => x.trim()).filter(Boolean),
      customerTypeId: dto.customerTypeId ?? null,
      zoneId: dto.zoneId ?? null,
      vendedorAsignadoId: dto.vendedorAsignadoId ?? null,
    };
  }

  private toUpdateInput(dto: UpdateCustomerDto): Prisma.CustomerUncheckedUpdateInput {
    const data: Prisma.CustomerUncheckedUpdateInput = {};
    if (dto.nombre !== undefined) data.nombre = dto.nombre.trim().toUpperCase();
    if (dto.nombreComercial !== undefined) data.nombreComercial = this.norm(dto.nombreComercial);
    if (dto.tipoDocumento !== undefined) data.tipoDocumento = dto.tipoDocumento;
    if (dto.numeroDocumento !== undefined) data.numeroDocumento = dto.numeroDocumento.trim();
    if (dto.nacionalidad !== undefined) data.nacionalidad = this.normUpper(dto.nacionalidad);
    if (dto.diasCredito !== undefined) data.diasCredito = dto.diasCredito;
    if (dto.limiteCredito !== undefined) {
      data.limiteCredito =
        dto.limiteCredito !== null ? new Prisma.Decimal(dto.limiteCredito) : null;
    }
    if (dto.codigoInterno !== undefined) data.codigoInterno = this.norm(dto.codigoInterno);
    if (dto.codigoBarra !== undefined) data.codigoBarra = this.norm(dto.codigoBarra);
    if (dto.observaciones !== undefined) data.observaciones = this.norm(dto.observaciones);
    if (dto.sitioWeb !== undefined) data.sitioWeb = this.norm(dto.sitioWeb);
    if (dto.contactoNombre !== undefined) data.contactoNombre = this.norm(dto.contactoNombre);
    if (dto.contactoTelefono !== undefined) data.contactoTelefono = this.norm(dto.contactoTelefono);
    if (dto.telefono !== undefined) data.telefono = this.norm(dto.telefono);
    if (dto.correoElectronico !== undefined) data.correoElectronico = this.normLower(dto.correoElectronico);
    if (dto.correosOpcionales !== undefined) data.correosOpcionales = this.norm(dto.correosOpcionales);
    if (dto.puntosAcumulados !== undefined) data.puntosAcumulados = dto.puntosAcumulados;
    if (dto.activo !== undefined) data.activo = dto.activo;
    if (dto.habilitado !== undefined) data.habilitado = dto.habilitado;
    if (dto.etiquetas !== undefined) data.etiquetas = dto.etiquetas.map((x) => x.trim()).filter(Boolean);
    if (dto.customerTypeId !== undefined) data.customerTypeId = dto.customerTypeId ?? null;
    if (dto.zoneId !== undefined) data.zoneId = dto.zoneId ?? null;
    if (dto.vendedorAsignadoId !== undefined) data.vendedorAsignadoId = dto.vendedorAsignadoId ?? null;
    return data;
  }

  private async replaceAddresses(
    customerId: string,
    addresses: NonNullable<CreateCustomerDto['addresses']>,
  ) {
    await this.prisma.customerAddress.deleteMany({ where: { customerId } });
    if (!addresses.length) return;
    await this.prisma.customerAddress.createMany({
      data: addresses.map((a, i) => ({
        customerId,
        esPrincipal: a.esPrincipal ?? i === 0,
        pais: a.pais?.trim().toUpperCase() || 'PERU',
        departmentId: this.norm(a.departmentId) ?? null,
        provinceId: this.norm(a.provinceId) ?? null,
        districtId: this.norm(a.districtId) ?? null,
        direccion: this.norm(a.direccion) ?? null,
        telefono: this.norm(a.telefono) ?? null,
        correoElectronico: this.normLower(a.correoElectronico) ?? null,
        correosOpcionales: this.norm(a.correosOpcionales) ?? null,
      })),
    });
  }

  private async ensureCustomer(id: string, actor?: JwtRequestUser): Promise<void> {
    const row = await this.prisma.customer.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, tenantId: true },
    });
    if (!row) throw new NotFoundException('Cliente no encontrado');
    if (actor) {
      assertTenantAccess(actorFromJwt(actor), row.tenantId);
    }
  }

  private norm(v?: string | null): string | undefined {
    if (v === undefined || v === null) return undefined;
    const t = v.trim();
    return t || undefined;
  }

  private normLower(v?: string | null): string | undefined {
    const n = this.norm(v);
    return n ? n.toLowerCase() : undefined;
  }

  private normUpper(v?: string | null): string | undefined {
    const n = this.norm(v);
    return n ? n.toUpperCase() : undefined;
  }

  private handleKnownError(err: unknown, conflictMessage = 'Ya existe un cliente con ese documento.'): never {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictException(conflictMessage);
    }
    throw err;
  }
}
