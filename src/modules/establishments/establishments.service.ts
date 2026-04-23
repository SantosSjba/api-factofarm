import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DocumentSeriesType, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEstablishmentSeriesDto } from './dto/create-establishment-series.dto';
import { CreateEstablishmentDto } from './dto/create-establishment.dto';
import { UpdateEstablishmentDto } from './dto/update-establishment.dto';

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
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.EstablishmentSelect;

@Injectable()
export class EstablishmentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(filters?: { search?: string; hospital?: string }) {
    const search = filters?.search?.trim();
    const hospital = filters?.hospital?.trim().toLowerCase();
    const hospitalFlag =
      hospital === 'hospital' ? true : hospital === 'no-hospital' ? false : undefined;

    const where: Prisma.EstablishmentWhereInput = {
      deletedAt: null,
      activo: true,
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

    return this.prisma.establishment.findMany({
      where,
      orderBy: { nombre: 'asc' },
      select: selectEstablishment,
    });
  }

  async create(dto: CreateEstablishmentDto) {
    try {
      const created = await this.prisma.establishment.create({
        data: this.mapEstablishmentCreateInput(dto),
        select: selectEstablishment,
      });
      await this.ensureDefaultSeries(created.id);
      return created;
    } catch (err) {
      this.handleKnownError(err, 'Ya existe un establecimiento con ese código.');
    }
  }

  async update(id: string, dto: UpdateEstablishmentDto) {
    const current = await this.prisma.establishment.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!current) {
      throw new NotFoundException('Establecimiento no encontrado');
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

  async remove(id: string) {
    const current = await this.prisma.establishment.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!current) {
      throw new NotFoundException('Establecimiento no encontrado');
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
    return this.prisma.department.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
  }

  listProvinces(departmentId: string) {
    return this.prisma.province.findMany({
      where: { departmentId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, departmentId: true },
    });
  }

  listDistricts(provinceId: string) {
    return this.prisma.district.findMany({
      where: { provinceId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, provinceId: true },
    });
  }

  async listSeries(establishmentId: string) {
    await this.ensureEstablishment(establishmentId);
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

  async addSeries(establishmentId: string, dto: CreateEstablishmentSeriesDto) {
    await this.ensureEstablishment(establishmentId);

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

  async deleteSeries(establishmentId: string, seriesId: string) {
    await this.ensureEstablishment(establishmentId);
    const removed = await this.prisma.establishmentSeries.deleteMany({
      where: { id: seriesId, establishmentId },
    });
    if (removed.count === 0) {
      throw new NotFoundException('Serie no encontrada para el establecimiento');
    }
  }

  private async ensureEstablishment(id: string) {
    const current = await this.prisma.establishment.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!current) {
      throw new NotFoundException('Establecimiento no encontrado');
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

  private mapEstablishmentCreateInput(
    dto: CreateEstablishmentDto,
  ): Prisma.EstablishmentUncheckedCreateInput {
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

    return data;
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
