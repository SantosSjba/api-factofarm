import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AgreementBillingStatus,
  Prisma,
} from '../../generated/prisma/client';
import { buildPaginatedResult, paginationArgs } from '../../common/dto/pagination.dto';
import { AuditLogService } from '../../common/services/audit-log.service';
import { EntityIntegrityService } from '../../common/services/entity-integrity.service';
import {
  dateRangeBoundsInTimeZone,
  monthBoundsInTimeZone,
  normalizeTimeZone,
} from '../../common/utils/timezone.util';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AgreementListQueryDto,
  AgreementSettlementQueryDto,
  CreateAgreementDto,
  GenerateMonthlyBillingDto,
  UpdateAgreementDto,
  UpsertAgreementPricesDto,
} from './dto/agreements.dto';

@Injectable()
export class AgreementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
    private readonly integrity: EntityIntegrityService,
  ) {}

  async findAll(establishmentId: string, query: AgreementListQueryDto) {
    const { page, pageSize, skip, take } = paginationArgs(query);
    const where: Prisma.AgreementWhereInput = {
      establishmentId,
      deletedAt: null,
      ...(query.tipo ? { tipo: query.tipo } : {}),
      ...(query.search?.trim()
        ? {
            OR: [
              { codigo: { contains: query.search.trim(), mode: 'insensitive' } },
              { nombre: { contains: query.search.trim(), mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.agreement.count({ where }),
      this.prisma.agreement.findMany({
        where,
        skip,
        take,
        orderBy: { nombre: 'asc' },
        select: {
          id: true,
          codigo: true,
          nombre: true,
          tipo: true,
          institucionTipo: true,
          coberturaPorcentaje: true,
          diasCredito: true,
          activo: true,
          createdAt: true,
        },
      }),
    ]);
    return buildPaginatedResult(
      rows.map((r) => ({
        ...r,
        coberturaPorcentaje: r.coberturaPorcentaje.toString(),
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    );
  }

  async findOne(id: string, establishmentId: string) {
    const row = await this.prisma.agreement.findFirst({
      where: { id, establishmentId, deletedAt: null },
      include: {
        productPrices: {
          include: {
            product: { select: { id: true, nombre: true, codigoInterno: true } },
          },
        },
      },
    });
    if (!row) throw new NotFoundException('Convenio no encontrado');
    return {
      ...row,
      coberturaPorcentaje: row.coberturaPorcentaje.toString(),
      productPrices: row.productPrices.map((p) => ({
        id: p.id,
        productId: p.productId,
        precio: p.precio.toString(),
        product: p.product,
      })),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async create(establishmentId: string, dto: CreateAgreementDto, userId: string) {
    const codigo = dto.codigo.trim().toUpperCase();
    const exists = await this.prisma.agreement.findFirst({
      where: { establishmentId, codigo, deletedAt: null },
      select: { id: true },
    });
    if (exists) throw new BadRequestException('Ya existe un convenio con ese código');

    const row = await this.prisma.agreement.create({
      data: {
        establishmentId,
        codigo,
        nombre: dto.nombre.trim(),
        tipo: dto.tipo,
        institucionTipo: dto.institucionTipo ?? null,
        coberturaPorcentaje:
          dto.coberturaPorcentaje !== undefined
            ? new Prisma.Decimal(dto.coberturaPorcentaje)
            : new Prisma.Decimal(100),
        diasCredito: dto.diasCredito ?? 30,
        contactoNombre: dto.contactoNombre?.trim() || null,
        contactoEmail: dto.contactoEmail?.trim() || null,
        contactoTelefono: dto.contactoTelefono?.trim() || null,
        notas: dto.notas?.trim() || null,
      },
    });

    await this.audit.log({ userId, action: 'CREATE', entity: 'Agreement', entityId: row.id });
    return this.findOne(row.id, establishmentId);
  }

  async update(
    id: string,
    establishmentId: string,
    dto: UpdateAgreementDto,
    userId: string,
  ) {
    await this.ensureExists(id, establishmentId);
    await this.prisma.agreement.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined ? { nombre: dto.nombre.trim() } : {}),
        ...(dto.tipo !== undefined ? { tipo: dto.tipo } : {}),
        ...(dto.institucionTipo !== undefined ? { institucionTipo: dto.institucionTipo } : {}),
        ...(dto.coberturaPorcentaje !== undefined
          ? { coberturaPorcentaje: new Prisma.Decimal(dto.coberturaPorcentaje) }
          : {}),
        ...(dto.diasCredito !== undefined ? { diasCredito: dto.diasCredito } : {}),
        ...(dto.activo !== undefined ? { activo: dto.activo } : {}),
        ...(dto.contactoNombre !== undefined
          ? { contactoNombre: dto.contactoNombre?.trim() || null }
          : {}),
        ...(dto.contactoEmail !== undefined
          ? { contactoEmail: dto.contactoEmail?.trim() || null }
          : {}),
        ...(dto.contactoTelefono !== undefined
          ? { contactoTelefono: dto.contactoTelefono?.trim() || null }
          : {}),
        ...(dto.notas !== undefined ? { notas: dto.notas?.trim() || null } : {}),
      },
    });
    await this.audit.log({ userId, action: 'UPDATE', entity: 'Agreement', entityId: id });
    return this.findOne(id, establishmentId);
  }

  async remove(id: string, establishmentId: string, userId: string) {
    await this.ensureExists(id, establishmentId);
    await this.integrity.assertCanDeleteAgreement(id);
    await this.prisma.agreement.update({
      where: { id },
      data: { deletedAt: new Date(), activo: false },
    });
    await this.audit.log({ userId, action: 'DELETE', entity: 'Agreement', entityId: id });
    return { ok: true };
  }

  async upsertPrices(
    id: string,
    establishmentId: string,
    dto: UpsertAgreementPricesDto,
    userId: string,
  ) {
    await this.ensureExists(id, establishmentId);
    for (const item of dto.items) {
      await this.prisma.agreementProductPrice.upsert({
        where: { agreementId_productId: { agreementId: id, productId: item.productId } },
        create: {
          agreementId: id,
          productId: item.productId,
          precio: new Prisma.Decimal(item.precio),
        },
        update: { precio: new Prisma.Decimal(item.precio) },
      });
    }
    await this.audit.log({ userId, action: 'UPDATE', entity: 'AgreementProductPrice', entityId: id });
    return this.findOne(id, establishmentId);
  }

  async getSettlement(id: string, establishmentId: string, query: AgreementSettlementQueryDto) {
    await this.ensureExists(id, establishmentId);
    const fromYmd = query.from?.trim();
    const toYmd = query.to?.trim();
    if (
      !fromYmd ||
      !toYmd ||
      !/^\d{4}-\d{2}-\d{2}$/.test(fromYmd) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(toYmd)
    ) {
      throw new BadRequestException('Rango de fechas inválido');
    }
    const tz = await this.resolveTimeZone(establishmentId);
    const { start: from, end: to } = dateRangeBoundsInTimeZone(fromYmd, toYmd, tz);

    const sales = await this.prisma.sale.findMany({
      where: {
        establishmentId,
        agreementId: id,
        deletedAt: null,
        estado: 'COMPLETADA',
        createdAt: { gte: from, lt: to },
      },
      select: {
        id: true,
        serie: true,
        numero: true,
        total: true,
        coberturaConvenio: true,
        copagoPaciente: true,
        createdAt: true,
        customer: { select: { id: true, nombre: true, numeroDocumento: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    let totalVentas = new Prisma.Decimal(0);
    let totalCobertura = new Prisma.Decimal(0);
    let totalCopago = new Prisma.Decimal(0);
    for (const s of sales) {
      totalVentas = totalVentas.plus(s.total);
      totalCobertura = totalCobertura.plus(s.coberturaConvenio);
      totalCopago = totalCopago.plus(s.copagoPaciente);
    }

    return {
      agreementId: id,
      from: from.toISOString(),
      to: to.toISOString(),
      ventasCount: sales.length,
      totalVentas: totalVentas.toString(),
      totalCobertura: totalCobertura.toString(),
      totalCopago: totalCopago.toString(),
      sales: sales.map((s) => ({
        id: s.id,
        documento: `${s.serie ?? ''}-${s.numero ?? ''}`,
        total: s.total.toString(),
        cobertura: s.coberturaConvenio.toString(),
        copago: s.copagoPaciente.toString(),
        createdAt: s.createdAt.toISOString(),
        customer: s.customer,
      })),
    };
  }

  async generateMonthlyBilling(
    id: string,
    establishmentId: string,
    dto: GenerateMonthlyBillingDto,
    userId: string,
  ) {
    await this.ensureExists(id, establishmentId);
    const periodo = dto.periodo.trim();
    if (!/^\d{4}-\d{2}$/.test(periodo)) {
      throw new BadRequestException('Periodo debe ser YYYY-MM');
    }
    const tz = await this.resolveTimeZone(establishmentId);
    const { start: from, end: to } = monthBoundsInTimeZone(periodo, tz);

    const existing = await this.prisma.agreementBillingStatement.findUnique({
      where: { agreementId_periodo: { agreementId: id, periodo } },
    });
    if (existing && existing.estado !== AgreementBillingStatus.BORRADOR) {
      throw new BadRequestException('Ya existe liquidación emitida para ese periodo');
    }

    const sales = await this.prisma.sale.findMany({
      where: {
        establishmentId,
        agreementId: id,
        deletedAt: null,
        estado: 'COMPLETADA',
        createdAt: { gte: from, lt: to },
      },
      select: {
        id: true,
        total: true,
        coberturaConvenio: true,
        copagoPaciente: true,
      },
    });

    let totalVentas = new Prisma.Decimal(0);
    let totalCobertura = new Prisma.Decimal(0);
    let totalCopago = new Prisma.Decimal(0);
    for (const s of sales) {
      totalVentas = totalVentas.plus(s.total);
      totalCobertura = totalCobertura.plus(s.coberturaConvenio);
      totalCopago = totalCopago.plus(s.copagoPaciente);
    }

    const statement = await this.prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.agreementBillingStatementLine.deleteMany({
          where: { billingStatementId: existing.id },
        });
        return tx.agreementBillingStatement.update({
          where: { id: existing.id },
          data: {
            totalVentas,
            totalCobertura,
            totalCopago,
            estado: AgreementBillingStatus.EMITIDA,
            emittedAt: new Date(),
            lines: {
              create: sales.map((s) => ({
                saleId: s.id,
                totalVenta: s.total,
                cobertura: s.coberturaConvenio,
                copago: s.copagoPaciente,
              })),
            },
          },
        });
      }
      return tx.agreementBillingStatement.create({
        data: {
          agreementId: id,
          periodo,
          totalVentas,
          totalCobertura,
          totalCopago,
          estado: AgreementBillingStatus.EMITIDA,
          emittedAt: new Date(),
          lines: {
            create: sales.map((s) => ({
              saleId: s.id,
              totalVenta: s.total,
              cobertura: s.coberturaConvenio,
              copago: s.copagoPaciente,
            })),
          },
        },
      });
    });

    await this.audit.log({
      userId,
      action: 'CREATE',
      entity: 'AgreementBillingStatement',
      entityId: statement.id,
    });

    return {
      id: statement.id,
      periodo: statement.periodo,
      totalVentas: statement.totalVentas.toString(),
      totalCobertura: statement.totalCobertura.toString(),
      totalCopago: statement.totalCopago.toString(),
      estado: statement.estado,
      ventasCount: sales.length,
    };
  }

  async exportInstitutionalCsv(
    id: string,
    establishmentId: string,
    query: AgreementSettlementQueryDto,
  ) {
    const agreement = await this.ensureExists(id, establishmentId);
    const settlement = await this.getSettlement(id, establishmentId, query);
    const tipo = agreement.institucionTipo ?? 'OTRO';
    const header =
      'INSTITUCION;FECHA;DOCUMENTO_PACIENTE;NOMBRE_PACIENTE;COMPROBANTE;TOTAL;COBERTURA;COPAGO';
    const lines = settlement.sales.map((s) => {
      const doc = s.customer?.numeroDocumento ?? '';
      const nombre = (s.customer?.nombre ?? '').replace(/;/g, ',');
      return [
        tipo,
        s.createdAt.slice(0, 10),
        doc,
        nombre,
        s.documento,
        s.total,
        s.cobertura,
        s.copago,
      ].join(';');
    });
    return {
      filename: `convenio-${agreement.codigo}-${query.from}-${query.to}.csv`,
      content: [header, ...lines].join('\n'),
      mimeType: 'text/csv; charset=utf-8',
    };
  }

  private async ensureExists(id: string, establishmentId: string) {
    const row = await this.prisma.agreement.findFirst({
      where: { id, establishmentId, deletedAt: null },
    });
    if (!row) throw new NotFoundException('Convenio no encontrado');
    return row;
  }

  private async resolveTimeZone(establishmentId: string): Promise<string> {
    const row = await this.prisma.establishment.findFirst({
      where: { id: establishmentId, deletedAt: null },
      select: { timeZone: true },
    });
    return normalizeTimeZone(row?.timeZone);
  }
}
