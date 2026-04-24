import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CustomerDocumentType, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerZoneDto } from './dto/create-customer-zone.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomerListQueryDto } from './dto/customer-list-query.dto';
import { ExportCustomersDto } from './dto/export-customers.dto';
import { UpdateCustomerBarcodeDto } from './dto/update-customer-barcode.dto';
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
  constructor(private readonly prisma: PrismaService) {}

  async list(query: CustomerListQueryDto) {
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
      ...(query.customerTypeId ? { customerTypeId: query.customerTypeId } : {}),
      ...(query.zoneId ? { zoneId: query.zoneId } : {}),
      ...(estado === 'habilitado'
        ? { habilitado: true }
        : estado === 'inhabilitado'
          ? { habilitado: false }
          : {}),
      ...(searchable.length ? { OR: searchable } : {}),
    };

    const [total, items] = await this.prisma.$transaction([
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

  async findOne(id: string) {
    const row = await this.prisma.customer.findFirst({
      where: { id, deletedAt: null },
      select: selectCustomer,
    });
    if (!row) throw new NotFoundException('Cliente no encontrado');
    return row;
  }

  async create(dto: CreateCustomerDto) {
    try {
      const created = await this.prisma.customer.create({
        data: this.toCreateInput(dto),
        select: { id: true },
      });
      if (dto.addresses?.length) {
        await this.replaceAddresses(created.id, dto.addresses);
      }
      return this.findOne(created.id);
    } catch (err) {
      this.handleKnownError(err);
    }
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.ensureCustomer(id);
    const data: Prisma.CustomerUncheckedUpdateInput = this.toUpdateInput(dto);
    try {
      await this.prisma.customer.update({ where: { id }, data });
      if (dto.addresses) {
        await this.replaceAddresses(id, dto.addresses);
      }
      return this.findOne(id);
    } catch (err) {
      this.handleKnownError(err);
    }
  }

  async remove(id: string) {
    await this.ensureCustomer(id);
    await this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date(), activo: false, habilitado: false },
    });
  }

  async updateStatus(id: string, dto: UpdateCustomerStatusDto) {
    await this.ensureCustomer(id);
    return this.prisma.customer.update({
      where: { id },
      data: { habilitado: dto.habilitado },
      select: selectCustomer,
    });
  }

  async updateBarcode(id: string, dto: UpdateCustomerBarcodeDto) {
    await this.ensureCustomer(id);
    return this.prisma.customer.update({
      where: { id },
      data: { codigoBarra: dto.codigoBarra.trim() || null },
      select: selectCustomer,
    });
  }

  async updateTags(id: string, dto: UpdateCustomerTagsDto) {
    await this.ensureCustomer(id);
    return this.prisma.customer.update({
      where: { id },
      data: {
        etiquetas: dto.etiquetas.map((x) => x.trim()).filter(Boolean),
      },
      select: selectCustomer,
    });
  }

  listZones() {
    return this.prisma.customerZone.findMany({
      where: { deletedAt: null },
      orderBy: { nombre: 'asc' },
      select: { id: true, nombre: true },
    });
  }

  async createZone(dto: CreateCustomerZoneDto) {
    try {
      return await this.prisma.customerZone.create({
        data: { nombre: dto.nombre.trim().toUpperCase() },
        select: { id: true, nombre: true },
      });
    } catch (err) {
      this.handleKnownError(err, 'Ya existe una zona con ese nombre.');
    }
  }

  async listSellers() {
    return this.prisma.user.findMany({
      where: { deletedAt: null, role: 'VENDEDOR' },
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

  async importFromExcel(file: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new NotFoundException('Archivo no válido para importar');
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
      const nombre = String(r['NOMBRE'] ?? '').trim();
      const tipoDocumento = String(r['TIPO_DOCUMENTO'] ?? '').trim().toUpperCase();
      const numeroDocumento = String(r['NUMERO_DOCUMENTO'] ?? '').trim();
      if (!nombre || !tipoDocumento || !numeroDocumento) {
        errors.push(`Fila ${i + 2}: faltan datos obligatorios.`);
        continue;
      }
      if (!Object.values(CustomerDocumentType).includes(tipoDocumento as CustomerDocumentType)) {
        errors.push(`Fila ${i + 2}: tipo documento inválido (${tipoDocumento}).`);
        continue;
      }
      try {
        const existing = await this.prisma.customer.findFirst({
          where: {
            tipoDocumento: tipoDocumento as CustomerDocumentType,
            numeroDocumento,
          },
          select: { id: true, deletedAt: true },
        });
        if (existing) {
          await this.prisma.customer.update({
            where: { id: existing.id },
            data: {
              nombre: nombre.toUpperCase(),
              codigoInterno: String(r['CODIGO_INTERNO'] ?? '').trim() || null,
              diasCredito: Number(r['DIAS_CREDITO'] || 0),
              observaciones: String(r['OBSERVACIONES'] ?? '').trim() || null,
              puntosAcumulados: Number(r['PUNTOS'] || 0),
              deletedAt: null,
            },
          });
          updated++;
        } else {
          await this.prisma.customer.create({
            data: {
              nombre: nombre.toUpperCase(),
              tipoDocumento: tipoDocumento as CustomerDocumentType,
              numeroDocumento,
              codigoInterno: String(r['CODIGO_INTERNO'] ?? '').trim() || null,
              diasCredito: Number(r['DIAS_CREDITO'] || 0),
              observaciones: String(r['OBSERVACIONES'] ?? '').trim() || null,
              puntosAcumulados: Number(r['PUNTOS'] || 0),
            },
          });
          created++;
        }
      } catch (e) {
        errors.push(`Fila ${i + 2}: error al procesar.`);
      }
    }

    return {
      totalRows: rows.length,
      created,
      updated,
      errors,
    };
  }

  buildImportTemplateBuffer() {
    const rows = [
      {
        NOMBRE: 'CLIENTE DEMO SAC',
        TIPO_DOCUMENTO: 'RUC',
        NUMERO_DOCUMENTO: '20123456789',
        CODIGO_INTERNO: 'CL-001',
        DIAS_CREDITO: 0,
        OBSERVACIONES: '',
        PUNTOS: 0,
      },
    ];
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, sheet, 'clientes-formato');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async buildExportBuffer(dto: ExportCustomersDto) {
    const where: Prisma.CustomerWhereInput = { deletedAt: null };
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

  private toCreateInput(dto: CreateCustomerDto): Prisma.CustomerUncheckedCreateInput {
    return {
      nombre: dto.nombre.trim().toUpperCase(),
      nombreComercial: this.norm(dto.nombreComercial),
      tipoDocumento: dto.tipoDocumento,
      numeroDocumento: dto.numeroDocumento.trim(),
      nacionalidad: this.normUpper(dto.nacionalidad) ?? 'PERU',
      diasCredito: dto.diasCredito ?? 0,
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

  private async ensureCustomer(id: string): Promise<void> {
    const row = await this.prisma.customer.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!row) throw new NotFoundException('Cliente no encontrado');
  }

  private norm(v?: string): string | undefined {
    if (v === undefined) return undefined;
    const t = v.trim();
    return t || undefined;
  }

  private normLower(v?: string): string | undefined {
    const n = this.norm(v);
    return n ? n.toLowerCase() : undefined;
  }

  private normUpper(v?: string): string | undefined {
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
