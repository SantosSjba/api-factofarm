import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import {
  ElectronicDocumentType,
  Prisma,
  SunatDocumentStatus,
  TaxPartyType,
  TaxWithholdingKind,
} from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../../common/services/audit-log.service';
import {
  monthBoundsInTimeZone,
  normalizeTimeZone,
} from '../../../common/utils/timezone.util';
import { BillingService } from '../../billing/billing.service';
import { CreateTaxWithholdingDto } from '../dto/compliance.dto';

const DEFAULT_RATES: Array<{
  codigo: string;
  nombre: string;
  kind: TaxWithholdingKind;
  tasa: number;
}> = [
  { codigo: 'RET-03', nombre: 'Retención 3% — servicios', kind: TaxWithholdingKind.RETENCION, tasa: 3 },
  { codigo: 'RET-065', nombre: 'Retención 6.5% — servicios', kind: TaxWithholdingKind.RETENCION, tasa: 6.5 },
  { codigo: 'RET-10', nombre: 'Retención 10% — dividendos', kind: TaxWithholdingKind.RETENCION, tasa: 10 },
  { codigo: 'PER-02', nombre: 'Percepción 2% — venta interna', kind: TaxWithholdingKind.PERCEPCION, tasa: 2 },
  { codigo: 'PER-05', nombre: 'Percepción 0.5% — venta interna', kind: TaxWithholdingKind.PERCEPCION, tasa: 0.5 },
  { codigo: 'DET-037', nombre: 'Detracción 12% — código bien 037', kind: TaxWithholdingKind.DETRACCION, tasa: 12 },
  { codigo: 'DET-004', nombre: 'Detracción 4% — código bien 004', kind: TaxWithholdingKind.DETRACCION, tasa: 4 },
];

const DETRACCION_MIN_TOTAL = 700;
const DETRACCION_RATE_CODE = 'DET-037';

@Injectable()
export class TaxWithholdingService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
    private readonly billing: BillingService,
  ) {}

  async onModuleInit() {
    await this.ensureDefaultRates();
  }

  async ensureDefaultRates() {
    for (const row of DEFAULT_RATES) {
      await this.prisma.sunatWithholdingRate.upsert({
        where: { codigo: row.codigo },
        update: { nombre: row.nombre, kind: row.kind, tasa: new Prisma.Decimal(row.tasa), activo: true },
        create: {
          codigo: row.codigo,
          nombre: row.nombre,
          kind: row.kind,
          tasa: new Prisma.Decimal(row.tasa),
        },
      });
    }
  }

  listRates(kind?: TaxWithholdingKind) {
    return this.prisma.sunatWithholdingRate.findMany({
      where: { activo: true, ...(kind ? { kind } : {}) },
      orderBy: [{ kind: 'asc' }, { codigo: 'asc' }],
    });
  }

  async listRecords(
    establishmentId: string,
    kind: TaxWithholdingKind,
    period?: string,
  ) {
    const dateFilter = await this.periodFilter(establishmentId, period);
    return this.prisma.taxWithholdingRecord.findMany({
      where: {
        establishmentId,
        kind,
        deletedAt: null,
        ...(dateFilter ? { fechaOperacion: dateFilter } : {}),
      },
      include: {
        electronicDocument: {
          select: {
            id: true,
            serie: true,
            numero: true,
            sunatStatus: true,
            documentType: true,
          },
        },
      },
      orderBy: { fechaOperacion: 'desc' },
      take: 500,
    });
  }

  async createRetention(
    establishmentId: string,
    dto: CreateTaxWithholdingDto,
    actorId?: string,
  ) {
    return this.createWithEmit(
      establishmentId,
      TaxWithholdingKind.RETENCION,
      TaxPartyType.PROVEEDOR,
      dto,
      'Comprobante de retención',
      actorId,
    );
  }

  async createPerception(
    establishmentId: string,
    dto: CreateTaxWithholdingDto,
    actorId?: string,
  ) {
    return this.createWithEmit(
      establishmentId,
      TaxWithholdingKind.PERCEPCION,
      TaxPartyType.CLIENTE,
      dto,
      'Comprobante de percepción',
      actorId,
    );
  }

  async syncDetracciones(establishmentId: string, period?: string, actorId?: string) {
    const config = await this.prisma.establishmentBillingConfig.findUnique({
      where: { establishmentId },
      select: { applyDetraccion: true },
    });
    if (!config?.applyDetraccion) {
      return { synced: 0, message: 'Detracción no habilitada en configuración de facturación' };
    }

    const dateFilter = await this.periodFilter(establishmentId, period);
    const rate = await this.prisma.sunatWithholdingRate.findUnique({
      where: { codigo: DETRACCION_RATE_CODE },
    });
    const tasa = rate?.tasa ?? new Prisma.Decimal(12);

    const docs = await this.prisma.electronicDocument.findMany({
      where: {
        establishmentId,
        deletedAt: null,
        documentType: ElectronicDocumentType.FACTURA,
        sunatStatus: {
          in: [
            SunatDocumentStatus.ACEPTADO,
            SunatDocumentStatus.PENDIENTE,
            SunatDocumentStatus.ENVIANDO,
          ],
        },
        total: { gte: new Prisma.Decimal(DETRACCION_MIN_TOTAL) },
        ...(dateFilter ? { createdAt: dateFilter } : {}),
        taxWithholdingRecord: null,
      },
      include: { sale: { select: { id: true } } },
    });

    let synced = 0;
    for (const doc of docs) {
      const monto = doc.total.mul(tasa).div(100).toDecimalPlaces(4);
      await this.prisma.taxWithholdingRecord.create({
        data: {
          establishmentId,
          kind: TaxWithholdingKind.DETRACCION,
          partyType: TaxPartyType.CLIENTE,
          partyNombre: doc.customerNombre ?? 'CLIENTE',
          partyDocType: doc.customerDocType ?? '6',
          partyDocNumber: doc.customerDocNumber ?? '00000000',
          regimenCodigo: DETRACCION_RATE_CODE,
          saleId: doc.saleId ?? null,
          electronicDocumentId: doc.id,
          fechaOperacion: doc.emittedAt ?? doc.createdAt,
          comprobanteModificadoTipo: '01',
          comprobanteModificadoSerie: doc.serie,
          comprobanteModificadoNumero: doc.numero,
          baseImponible: doc.total,
          tasa,
          monto,
        },
      });
      synced += 1;
    }

    if (synced > 0) {
      await this.audit.log({
        userId: actorId,
        action: 'SYNC_DETRACCION',
        entity: 'TaxWithholdingRecord',
        entityId: establishmentId,
        diff: { synced, period },
      });
    }

    return { synced, totalCandidates: docs.length };
  }

  calculate(baseImponible: number, tasa: number) {
    const base = new Prisma.Decimal(baseImponible);
    const rate = new Prisma.Decimal(tasa);
    const monto = base.mul(rate).div(100).toDecimalPlaces(4);
    return {
      baseImponible: base.toString(),
      tasa: rate.toString(),
      monto: monto.toString(),
    };
  }

  private async createWithEmit(
    establishmentId: string,
    kind: TaxWithholdingKind,
    defaultPartyType: TaxPartyType,
    dto: CreateTaxWithholdingDto,
    label: string,
    actorId?: string | undefined,
  ) {
    const rate = dto.regimenCodigo
      ? await this.prisma.sunatWithholdingRate.findUnique({ where: { codigo: dto.regimenCodigo } })
      : null;
    const tasa = rate
      ? new Prisma.Decimal(rate.tasa.toString())
      : new Prisma.Decimal(dto.tasa ?? 0);
    if (tasa.lessThanOrEqualTo(0)) {
      throw new BadRequestException('Tasa de retención/percepción inválida');
    }

    const base = new Prisma.Decimal(dto.baseImponible);
    const monto = base.mul(tasa).div(100).toDecimalPlaces(4);
    if (monto.lessThanOrEqualTo(0)) {
      throw new BadRequestException('El monto calculado debe ser mayor a cero');
    }

    const partyType = dto.partyType ?? defaultPartyType;
    const fecha = dto.fechaOperacion ? new Date(dto.fechaOperacion) : new Date();
    const ref =
      dto.comprobanteModificadoSerie && dto.comprobanteModificadoNumero
        ? `${dto.comprobanteModificadoSerie}-${dto.comprobanteModificadoNumero}`
        : 'sin referencia';

    const electronicDoc = await this.billing.emitSpecialDocument(
      establishmentId,
      {
        documentType: kind === TaxWithholdingKind.RETENCION ? 'RETENCION' : 'PERCEPCION',
        customerNombre: dto.partyNombre.trim(),
        customerDocType: dto.partyDocType.trim(),
        customerDocNumber: dto.partyDocNumber.trim(),
        subtotal: monto.toString(),
        igvTotal: '0',
        total: monto.toString(),
        lines: [
          {
            descripcion: `${label} sobre ${ref} — base S/ ${base.toString()}`,
            cantidad: '1',
            precioUnitario: monto.toString(),
            subtotalLinea: monto.toString(),
            igvLinea: '0',
            totalLinea: monto.toString(),
            unidadMedida: 'NIU',
          },
        ],
      },
      actorId,
    );

    const record = await this.prisma.taxWithholdingRecord.create({
      data: {
        establishmentId,
        kind,
        partyType,
        partyId: dto.partyId ?? null,
        partyNombre: dto.partyNombre.trim(),
        partyDocType: dto.partyDocType.trim(),
        partyDocNumber: dto.partyDocNumber.trim(),
        regimenCodigo: dto.regimenCodigo ?? rate?.codigo ?? null,
        saleId: dto.saleId ?? null,
        purchaseOrderId: dto.purchaseOrderId ?? null,
        electronicDocumentId: electronicDoc.id,
        fechaOperacion: fecha,
        comprobanteModificadoTipo: dto.comprobanteModificadoTipo ?? null,
        comprobanteModificadoSerie: dto.comprobanteModificadoSerie ?? null,
        comprobanteModificadoNumero: dto.comprobanteModificadoNumero ?? null,
        baseImponible: base,
        tasa,
        monto,
        observaciones: dto.observaciones?.trim() || null,
      },
      include: {
        electronicDocument: {
          select: { id: true, serie: true, numero: true, sunatStatus: true },
        },
      },
    });

    await this.audit.log({
      userId: actorId,
      action: kind === TaxWithholdingKind.RETENCION ? 'CREATE_RETENCION' : 'CREATE_PERCEPCION',
      entity: 'TaxWithholdingRecord',
      entityId: record.id,
    });

    return record;
  }

  private async periodFilter(
    establishmentId: string,
    period?: string,
  ): Promise<Prisma.DateTimeFilter | undefined> {
    if (!period?.trim()) return undefined;
    const match = /^(\d{4})-(\d{2})$/.exec(period.trim());
    if (!match) throw new BadRequestException('Periodo inválido. Use YYYY-MM');
    const tz = await this.resolveTimeZone(establishmentId);
    const { start, end } = monthBoundsInTimeZone(period.trim(), tz);
    return { gte: start, lt: end };
  }

  private async resolveTimeZone(establishmentId: string): Promise<string> {
    const row = await this.prisma.establishment.findFirst({
      where: { id: establishmentId, deletedAt: null },
      select: { timeZone: true },
    });
    return normalizeTimeZone(row?.timeZone);
  }
}
