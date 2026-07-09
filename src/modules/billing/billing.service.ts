import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BillingJobStatus,
  BillingJobType,
  BillingProviderType,
  CustomerDocumentType,
  DocumentSeriesType,
  ElectronicDocumentType,
  Prisma,
  SaleDocumentType,
  SunatDocumentStatus,
} from '../../generated/prisma/client';
import { buildPaginatedResult, paginationArgs } from '../../common/dto/pagination.dto';
import { decryptBillingSecret, encryptBillingSecret } from '../../common/utils/billing-crypto.util';
import { AuditLogService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { EmitDocumentInput, IBillingProvider } from './domain/billing-provider.port';
import { MockBillingProvider } from './providers/mock-billing.provider';
import { NubefactBillingProvider } from './providers/nubefact-billing.provider';
import { FactilizaBillingProvider } from './providers/factiliza-billing.provider';
import { BillingArtifactService } from './services/billing-artifact.service';
import { UblBuilderService } from './services/ubl-builder.service';
import { FactilizaConsultaClient } from './services/factiliza-consulta.client';
import { getBillingProviderCapabilities } from './utils/billing-capabilities.util';
import { RealtimeService } from '../realtime/realtime.service';
import {
  BillingDocumentListQueryDto,
  DailySummaryDto,
  EmitSpecialDocumentDto,
  UpsertBillingConfigDto,
} from './dto/billing.dto';

const EMITABLE_SALE_TYPES = new Set<SaleDocumentType>([
  SaleDocumentType.BOLETA,
  SaleDocumentType.FACTURA,
]);

const DETRACCION_MIN_TOTAL = 700;
const DETRACCION_CUENTA_BN = '00000000000';

@Injectable()
export class BillingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BillingService.name);
  private processing = false;
  private jobPoller: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
    private readonly config: ConfigService,
    private readonly ubl: UblBuilderService,
    private readonly artifacts: BillingArtifactService,
    private readonly mockProvider: MockBillingProvider,
    private readonly nubefactProvider: NubefactBillingProvider,
    private readonly factilizaProvider: FactilizaBillingProvider,
    private readonly factilizaConsulta: FactilizaConsultaClient,
    private readonly realtime: RealtimeService,
  ) {}

  onModuleInit() {
    this.jobPoller = setInterval(() => {
      void this.processPendingJobs();
    }, 5000);
  }

  onModuleDestroy() {
    if (this.jobPoller) {
      clearInterval(this.jobPoller);
      this.jobPoller = null;
    }
  }

  private encryptionKey(): string {
    const dedicated = this.config.get<string>('BILLING_ENCRYPTION_KEY')?.trim();
    if (dedicated) return dedicated;
    if (this.config.get('NODE_ENV') === 'production') {
      throw new Error('BILLING_ENCRYPTION_KEY es obligatoria en producción');
    }
    return this.config.get<string>('JWT_SECRET') ?? 'factofarm-dev-billing-key';
  }

  async getConfig(establishmentId: string) {
    const nodeEnv = this.config.get<string>('NODE_ENV');
    const defaultProvider =
      nodeEnv === 'production' ? BillingProviderType.FACTILIZA : BillingProviderType.MOCK;
    const row = await this.prisma.establishmentBillingConfig.findUnique({
      where: { establishmentId },
    });
    const provider = row?.provider ?? defaultProvider;
    const capabilities = getBillingProviderCapabilities(provider, nodeEnv);
    if (!row) {
      return {
        provider: defaultProvider,
        modoSandbox: nodeEnv !== 'production',
        autoEmitOnSale: true,
        emitNotaVenta: false,
        applyDetraccion: false,
        autoEmitGuiaOnTransfer: true,
        hasApiToken: false,
        hasCertificate: false,
        capabilities,
      };
    }
    return {
      provider: row.provider,
      rucEmisor: row.rucEmisor,
      razonSocialEmisor: row.razonSocialEmisor,
      apiUrl: row.apiUrl,
      consultaApiUrl: row.consultaApiUrl,
      modoSandbox: row.modoSandbox,
      autoEmitOnSale: row.autoEmitOnSale,
      emitNotaVenta: row.emitNotaVenta,
      applyDetraccion: row.applyDetraccion,
      autoEmitGuiaOnTransfer: row.autoEmitGuiaOnTransfer,
      hasApiToken: !!row.apiTokenEncrypted,
      hasCertificate: !!row.certificateEncrypted,
      capabilities,
    };
  }

  async upsertConfig(establishmentId: string, dto: UpsertBillingConfigDto, actorId?: string) {
    const nodeEnv = this.config.get<string>('NODE_ENV');
    const provider = dto.provider ?? (nodeEnv === 'production' ? BillingProviderType.FACTILIZA : BillingProviderType.MOCK);
    if (nodeEnv === 'production') {
      if (provider === BillingProviderType.MOCK) {
        throw new BadRequestException(
          'El proveedor MOCK no está permitido en producción. Use Factiliza o Nubefact.',
        );
      }
      if (provider === BillingProviderType.BIZLINKS) {
        throw new BadRequestException('El proveedor Bizlinks aún no está implementado.');
      }
    }

    const data: Prisma.EstablishmentBillingConfigUpsertArgs['create'] = {
      establishmentId,
      provider,
      rucEmisor: dto.rucEmisor?.trim() || null,
      razonSocialEmisor: dto.razonSocialEmisor?.trim() || null,
      apiUrl: dto.apiUrl?.trim() || null,
      modoSandbox: dto.modoSandbox ?? true,
      autoEmitOnSale: dto.autoEmitOnSale ?? true,
      consultaApiUrl: dto.consultaApiUrl?.trim() || null,
      emitNotaVenta: dto.emitNotaVenta ?? false,
      applyDetraccion: dto.applyDetraccion ?? false,
      autoEmitGuiaOnTransfer: dto.autoEmitGuiaOnTransfer ?? true,
    };

    if (dto.apiToken !== undefined) {
      data.apiTokenEncrypted = dto.apiToken
        ? encryptBillingSecret(dto.apiToken, this.encryptionKey())
        : null;
    }
    if (dto.certificateBase64 !== undefined) {
      data.certificateEncrypted = dto.certificateBase64
        ? encryptBillingSecret(dto.certificateBase64, this.encryptionKey())
        : null;
    }
    if (dto.certificatePassword !== undefined) {
      data.certificatePasswordEncrypted = dto.certificatePassword
        ? encryptBillingSecret(dto.certificatePassword, this.encryptionKey())
        : null;
    }

    const row = await this.prisma.establishmentBillingConfig.upsert({
      where: { establishmentId },
      create: data,
      update: {
        ...data,
        establishmentId: undefined,
      },
    });

    await this.audit.log({
      userId: actorId,
      action: 'UPDATE',
      entity: 'EstablishmentBillingConfig',
      entityId: row.id,
    });

    return this.getConfig(establishmentId);
  }

  async listDocuments(establishmentId: string, query: BillingDocumentListQueryDto) {
    const { page, pageSize, skip, take } = paginationArgs(query);
    const where: Prisma.ElectronicDocumentWhereInput = {
      establishmentId,
      deletedAt: null,
      ...(query.sunatStatus ? { sunatStatus: query.sunatStatus } : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.electronicDocument.count({ where }),
      this.prisma.electronicDocument.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          documentType: true,
          serie: true,
          numero: true,
          sunatStatus: true,
          total: true,
          customerNombre: true,
          emittedAt: true,
          createdAt: true,
          saleId: true,
        },
      }),
    ]);
    return buildPaginatedResult(
      rows.map((r) => ({
        ...r,
        total: r.total.toString(),
        emittedAt: r.emittedAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    );
  }

  async getDocument(id: string, establishmentId: string) {
    const doc = await this.prisma.electronicDocument.findFirst({
      where: { id, establishmentId, deletedAt: null },
      include: {
        lines: { orderBy: { lineNumber: 'asc' } },
        taxLines: true,
        responses: { orderBy: { createdAt: 'desc' }, take: 5 },
        sale: { select: { id: true, documentType: true } },
        relatedDocument: { select: { id: true, documentType: true, serie: true, numero: true } },
      },
    });
    if (!doc) throw new NotFoundException('Comprobante no encontrado');
    return this.mapDocument(doc);
  }

  async getSaleBillingStatus(saleId: string, establishmentId: string) {
    const doc = await this.prisma.electronicDocument.findFirst({
      where: { saleId, establishmentId, deletedAt: null },
      select: { id: true, sunatStatus: true, sunatCodigo: true, sunatDescripcion: true, serie: true, numero: true },
    });
    return doc
      ? {
          electronicDocumentId: doc.id,
          sunatStatus: doc.sunatStatus,
          sunatCodigo: doc.sunatCodigo,
          sunatDescripcion: doc.sunatDescripcion,
          serie: doc.serie,
          numero: doc.numero,
        }
      : null;
  }

  async scheduleEmitFromSale(saleId: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, deletedAt: null },
      include: {
        establishment: { select: { id: true, nombre: true } },
        customer: { select: { nombre: true, numeroDocumento: true, tipoDocumento: true } },
        items: {
          include: {
            product: {
              select: {
                nombre: true,
                codigoInterno: true,
                codigoSunat: true,
                saleTaxAffectation: { select: { codigo: true, descripcion: true } },
                unit: { select: { codigo: true } },
              },
            },
          },
        },
      },
    });
    if (!sale) return null;

    const config = await this.prisma.establishmentBillingConfig.findUnique({
      where: { establishmentId: sale.establishmentId },
    });
    const emitable =
      EMITABLE_SALE_TYPES.has(sale.documentType) ||
      (sale.documentType === SaleDocumentType.NOTA_VENTA && config?.emitNotaVenta);
    if (!emitable) return null;
    if (config && !config.autoEmitOnSale) return null;

    const existing = await this.prisma.electronicDocument.findFirst({
      where: { saleId: sale.id, deletedAt: null },
    });
    if (existing) return existing.id;

    const docType = this.mapSaleDocumentType(sale.documentType);
    const seriesRow = await this.prisma.establishmentSeries.findFirst({
      where: {
        establishmentId: sale.establishmentId,
        numero: sale.serie ?? undefined,
      },
      select: { esContingencia: true },
    });

    const receptor = this.resolveReceptor(sale.customer, sale.documentType);
    const doc = await this.prisma.electronicDocument.create({
      data: {
        establishmentId: sale.establishmentId,
        saleId: sale.id,
        documentType: docType,
        serie: sale.serie ?? 'B001',
        numero: sale.numero ?? '00000001',
        subtotal: sale.subtotal,
        igvTotal: sale.igvTotal,
        total: sale.total,
        esContingencia: seriesRow?.esContingencia ?? false,
        sunatStatus: SunatDocumentStatus.PENDIENTE,
        customerDocType: receptor.tipoDoc,
        customerDocNumber: receptor.numeroDoc,
        customerNombre: receptor.nombre,
        lines: {
          create: sale.items.map((item, index) => ({
            lineNumber: index + 1,
            descripcion: item.product.nombre,
            codigoProducto: item.product.codigoInterno,
            codigoSunat: item.product.codigoSunat,
            unidadMedida: item.product.unit.codigo,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            subtotalLinea: item.subtotalLinea,
            igvLinea: item.igvLinea,
            totalLinea: item.totalLinea,
            taxAffectationCodigo: item.product.saleTaxAffectation.codigo,
            taxAffectationDesc: item.product.saleTaxAffectation.descripcion,
          })),
        },
        taxLines: {
          create: [
            {
              taxCodigo: '1000',
              taxNombre: 'IGV',
              baseImponible: sale.subtotal,
              monto: sale.igvTotal,
            },
          ],
        },
        jobs: {
          create: { jobType: BillingJobType.EMIT, status: BillingJobStatus.PENDIENTE },
        },
      },
      select: { id: true },
    });

    setImmediate(() => void this.processPendingJobs());
    return doc.id;
  }

  async scheduleEmitFromReturn(saleReturnId: string): Promise<string | null> {
    const saleReturn = await this.prisma.saleReturn.findUnique({
      where: { id: saleReturnId },
      include: {
        items: true,
        electronicDocument: { select: { id: true } },
        sale: {
          include: {
            customer: { select: { nombre: true, numeroDocumento: true, tipoDocumento: true } },
            electronicDocument: true,
            items: {
              include: {
                product: {
                  select: {
                    nombre: true,
                    codigoInterno: true,
                    codigoSunat: true,
                    saleTaxAffectation: { select: { codigo: true, descripcion: true } },
                    unit: { select: { codigo: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!saleReturn) return null;
    if (saleReturn.electronicDocument) return saleReturn.electronicDocument.id;

    const sale = saleReturn.sale;
    if (!EMITABLE_SALE_TYPES.has(sale.documentType)) return null;

    const originalDoc = sale.electronicDocument;
    if (!originalDoc) return null;
    const emitableStatuses = new Set<SunatDocumentStatus>([
      SunatDocumentStatus.ACEPTADO,
      SunatDocumentStatus.OBSERVADO,
      SunatDocumentStatus.CONTINGENCIA,
    ]);
    if (!emitableStatuses.has(originalDoc.sunatStatus)) return null;

    const config = await this.prisma.establishmentBillingConfig.findUnique({
      where: { establishmentId: sale.establishmentId },
    });
    if (config && !config.autoEmitOnSale) return null;

    const { serie, numero } = await this.resolveCreditNoteNumber(
      sale.establishmentId,
      originalDoc.documentType,
    );
    const receptor = this.resolveReceptor(sale.customer, sale.documentType);

    let subtotal = new Prisma.Decimal(0);
    let igvTotal = new Prisma.Decimal(0);
    let total = new Prisma.Decimal(0);
    const linePayload: Prisma.ElectronicDocumentLineCreateWithoutElectronicDocumentInput[] = [];

    for (const [index, returnItem] of saleReturn.items.entries()) {
      const saleItem = sale.items.find((row) => row.id === returnItem.saleItemId);
      if (!saleItem) continue;
      const ratio = new Prisma.Decimal(returnItem.cantidad).div(saleItem.cantidad);
      const lineSubtotal = saleItem.subtotalLinea.times(ratio);
      const lineIgv = saleItem.igvLinea.times(ratio);
      const lineTotal = saleItem.totalLinea.times(ratio);
      subtotal = subtotal.plus(lineSubtotal);
      igvTotal = igvTotal.plus(lineIgv);
      total = total.plus(lineTotal);
      linePayload.push({
        lineNumber: index + 1,
        descripcion: saleItem.product.nombre,
        codigoProducto: saleItem.product.codigoInterno,
        codigoSunat: saleItem.product.codigoSunat,
        unidadMedida: saleItem.product.unit.codigo,
        cantidad: returnItem.cantidad,
        precioUnitario: saleItem.precioUnitario,
        subtotalLinea: lineSubtotal,
        igvLinea: lineIgv,
        totalLinea: lineTotal,
        taxAffectationCodigo: saleItem.product.saleTaxAffectation.codigo,
        taxAffectationDesc: saleItem.product.saleTaxAffectation.descripcion,
      });
    }

    if (linePayload.length === 0) return null;

    const doc = await this.prisma.electronicDocument.create({
      data: {
        establishmentId: sale.establishmentId,
        saleReturnId: saleReturn.id,
        relatedDocumentId: originalDoc.id,
        documentType: ElectronicDocumentType.NOTA_CREDITO,
        serie,
        numero,
        subtotal,
        igvTotal,
        total,
        sunatStatus: SunatDocumentStatus.PENDIENTE,
        customerDocType: receptor.tipoDoc,
        customerDocNumber: receptor.numeroDoc,
        customerNombre: receptor.nombre,
        voidReason: saleReturn.motivo,
        lines: { create: linePayload },
        taxLines: {
          create: [
            {
              taxCodigo: '1000',
              taxNombre: 'IGV',
              baseImponible: subtotal,
              monto: igvTotal,
            },
          ],
        },
        jobs: {
          create: { jobType: BillingJobType.EMIT, status: BillingJobStatus.PENDIENTE },
        },
      },
      select: { id: true },
    });

    setImmediate(() => void this.processPendingJobs());
    return doc.id;
  }

  async scheduleDebitNoteFromSale(
    saleId: string,
    dto: { motivo: string; descripcion: string; total: number },
  ): Promise<string | null> {
    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, deletedAt: null },
      include: {
        customer: { select: { nombre: true, numeroDocumento: true, tipoDocumento: true } },
        electronicDocument: true,
      },
    });
    if (!sale) return null;
    if (!EMITABLE_SALE_TYPES.has(sale.documentType)) return null;

    const originalDoc = sale.electronicDocument;
    if (!originalDoc) return null;
    const emitableStatuses = new Set<SunatDocumentStatus>([
      SunatDocumentStatus.ACEPTADO,
      SunatDocumentStatus.OBSERVADO,
      SunatDocumentStatus.CONTINGENCIA,
    ]);
    if (!emitableStatuses.has(originalDoc.sunatStatus)) return null;

    const config = await this.prisma.establishmentBillingConfig.findUnique({
      where: { establishmentId: sale.establishmentId },
    });
    if (config && !config.autoEmitOnSale) return null;

    const total = new Prisma.Decimal(dto.total);
    if (total.lte(0)) return null;
    const subtotal = total.div(1.18).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
    const igvTotal = total.minus(subtotal).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
    const unitPrice = total;
    const { serie, numero } = await this.resolveDebitNoteNumber(
      sale.establishmentId,
      originalDoc.documentType,
    );
    const receptor = this.resolveReceptor(sale.customer, sale.documentType);

    const doc = await this.prisma.electronicDocument.create({
      data: {
        establishmentId: sale.establishmentId,
        relatedDocumentId: originalDoc.id,
        documentType: ElectronicDocumentType.NOTA_DEBITO,
        serie,
        numero,
        subtotal,
        igvTotal,
        total,
        sunatStatus: SunatDocumentStatus.PENDIENTE,
        customerDocType: receptor.tipoDoc,
        customerDocNumber: receptor.numeroDoc,
        customerNombre: receptor.nombre,
        voidReason: dto.motivo,
        lines: {
          create: [
            {
              lineNumber: 1,
              descripcion: dto.descripcion.trim(),
              cantidad: new Prisma.Decimal(1),
              precioUnitario: unitPrice,
              subtotalLinea: subtotal,
              igvLinea: igvTotal,
              totalLinea: total,
              taxAffectationCodigo: '10',
              taxAffectationDesc: 'Gravado - Operación Onerosa',
              unidadMedida: 'NIU',
            },
          ],
        },
        taxLines: {
          create: [
            {
              taxCodigo: '1000',
              taxNombre: 'IGV',
              baseImponible: subtotal,
              monto: igvTotal,
            },
          ],
        },
        jobs: {
          create: { jobType: BillingJobType.EMIT, status: BillingJobStatus.PENDIENTE },
        },
      },
      select: { id: true },
    });

    setImmediate(() => void this.processPendingJobs());
    return doc.id;
  }

  async emitFromSale(saleId: string, establishmentId: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, establishmentId, deletedAt: null },
      select: { id: true },
    });
    if (!sale) throw new NotFoundException('Venta no encontrada');
    const docId = await this.scheduleEmitFromSale(saleId);
    if (!docId) throw new BadRequestException('Esta venta no requiere CPE electrónico');
    await this.processPendingJobs();
    return this.getDocument(docId, establishmentId);
  }

  async retryDocument(id: string, establishmentId: string, actorId?: string) {
    const doc = await this.ensureDocument(id, establishmentId);
    if (doc.sunatStatus !== SunatDocumentStatus.RECHAZADO) {
      throw new BadRequestException('Solo se reintentan comprobantes rechazados');
    }
    await this.prisma.billingJob.create({
      data: {
        electronicDocumentId: doc.id,
        jobType: BillingJobType.RETRY,
        status: BillingJobStatus.PENDIENTE,
      },
    });
    await this.audit.log({ userId: actorId, action: 'RETRY', entity: 'ElectronicDocument', entityId: id });
    setImmediate(() => void this.processPendingJobs());
    return { ok: true };
  }

  async voidFromSale(
    saleId: string,
    establishmentId: string,
    reason: string,
    actorId?: string,
  ): Promise<string | null> {
    const doc = await this.prisma.electronicDocument.findFirst({
      where: { saleId, establishmentId, deletedAt: null },
    });
    if (!doc) return null;
    if (doc.sunatStatus === SunatDocumentStatus.ANULADO) return doc.id;

    await this.prisma.billingJob.updateMany({
      where: {
        electronicDocumentId: doc.id,
        status: { in: [BillingJobStatus.PENDIENTE, BillingJobStatus.PROCESANDO] },
      },
      data: { status: BillingJobStatus.FALLIDO, lastError: 'Venta anulada' },
    });

    const needsOseVoid =
      !!doc.externalId &&
      (doc.sunatStatus === SunatDocumentStatus.ACEPTADO ||
        doc.sunatStatus === SunatDocumentStatus.OBSERVADO ||
        doc.sunatStatus === SunatDocumentStatus.CONTINGENCIA);

    if (needsOseVoid) {
      const voided = await this.voidDocument(doc.id, establishmentId, reason, actorId);
      return voided.id;
    }

    await this.prisma.electronicDocument.update({
      where: { id: doc.id },
      data: { sunatStatus: SunatDocumentStatus.ANULADO, voidReason: reason },
    });
    await this.audit.log({ userId: actorId, action: 'VOID', entity: 'ElectronicDocument', entityId: doc.id });
    return doc.id;
  }

  async voidDocument(id: string, establishmentId: string, reason: string, actorId?: string) {
    const doc = await this.ensureDocument(id, establishmentId);
    const caps = await this.billingCapabilitiesFor(establishmentId);
    if (!caps.supportsVoidDocument) {
      throw new BadRequestException(
        caps.notes.join(' ') ||
          'Comunicación de baja no disponible con el proveedor OSE configurado. Use Nubefact.',
      );
    }
    const provider = await this.resolveProvider(doc.establishmentId);
    if (!doc.externalId) throw new BadRequestException('Comprobante sin ID externo OSE');

    const result = await provider.voidDocument({
      externalId: doc.externalId,
      reason,
      documentType: doc.documentType,
      serie: doc.serie,
      numero: doc.numero,
    });

    await this.prisma.electronicDocument.update({
      where: { id },
      data: {
        sunatStatus: result.sunatStatus,
        sunatCodigo: result.sunatCodigo,
        sunatDescripcion: result.sunatDescripcion,
        voidReason: reason,
      },
    });

    await this.prisma.sunatResponse.create({
      data: {
        electronicDocumentId: id,
        tipo: 'COMUNICACION_BAJA',
        codigo: result.sunatCodigo,
        descripcion: result.sunatDescripcion,
      },
    });

    await this.audit.log({ userId: actorId, action: 'VOID', entity: 'ElectronicDocument', entityId: id });
    return this.getDocument(id, establishmentId);
  }

  async sendDailySummary(establishmentId: string, dto: DailySummaryDto, actorId?: string) {
    const caps = await this.billingCapabilitiesFor(establishmentId);
    if (!caps.supportsDailySummary) {
      throw new BadRequestException(
        caps.notes.join(' ') ||
          'Resumen diario de boletas (RC) no disponible con Factiliza. Configure Nubefact.',
      );
    }
    const dayStart = new Date(`${dto.fecha}T00:00:00.000Z`);
    const dayEnd = new Date(`${dto.fecha}T23:59:59.999Z`);
    const docs = await this.prisma.electronicDocument.findMany({
      where: {
        establishmentId,
        documentType: ElectronicDocumentType.BOLETA,
        sunatStatus: SunatDocumentStatus.ACEPTADO,
        emittedAt: { gte: dayStart, lte: dayEnd },
        deletedAt: null,
      },
      select: { id: true },
    });
    const provider = await this.resolveProvider(establishmentId);
    const result = await provider.sendDailySummary({
      fecha: dto.fecha,
      documentIds: docs.map((d) => d.id),
    });

    const summary = await this.prisma.electronicDocument.create({
      data: {
        establishmentId,
        documentType: ElectronicDocumentType.RESUMEN_BOLETAS,
        serie: 'RC01',
        numero: dto.fecha.replace(/-/g, ''),
        subtotal: new Prisma.Decimal(0),
        igvTotal: new Prisma.Decimal(0),
        total: new Prisma.Decimal(0),
        sunatStatus: result.sunatStatus,
        sunatCodigo: result.sunatCodigo,
        sunatDescripcion: result.sunatDescripcion,
        externalId: result.externalId,
        emittedAt: new Date(),
      },
      select: { id: true },
    });

    await this.audit.log({
      userId: actorId,
      action: 'DAILY_SUMMARY',
      entity: 'ElectronicDocument',
      entityId: summary.id,
    });

    return { ok: true, id: summary.id, ...result };
  }

  async processPendingJobs() {
    if (this.processing) return;
    this.processing = true;
    try {
      const jobs = await this.prisma.billingJob.findMany({
        where: {
          status: BillingJobStatus.PENDIENTE,
          scheduledAt: { lte: new Date() },
        },
        orderBy: { scheduledAt: 'asc' },
        take: 10,
        include: {
          electronicDocument: {
            include: {
              lines: { orderBy: { lineNumber: 'asc' } },
              establishment: { select: { id: true, nombre: true } },
            },
          },
        },
      });

      for (const job of jobs) {
        await this.prisma.billingJob.update({
          where: { id: job.id },
          data: { status: BillingJobStatus.PROCESANDO, attempts: { increment: 1 } },
        });
        try {
          await this.processEmitJob(job.electronicDocument);
          await this.prisma.billingJob.update({
            where: { id: job.id },
            data: { status: BillingJobStatus.COMPLETADO, processedAt: new Date() },
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Error desconocido';
          await this.prisma.billingJob.update({
            where: { id: job.id },
            data: {
              status: BillingJobStatus.FALLIDO,
              lastError: message.slice(0, 500),
              processedAt: new Date(),
            },
          });
          await this.prisma.electronicDocument.update({
            where: { id: job.electronicDocumentId },
            data: {
              sunatStatus: SunatDocumentStatus.RECHAZADO,
              sunatDescripcion: message.slice(0, 500),
              retryCount: { increment: 1 },
              nextRetryAt: new Date(Date.now() + 15 * 60_000),
            },
          });
          await this.notifyBillingRealtime(job.electronicDocumentId, {
            sunatStatus: SunatDocumentStatus.RECHAZADO,
            sunatCodigo: '0',
            sunatDescripcion: message.slice(0, 500),
          });
        }
      }

      await this.retryRejectedAutomatically();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Cola de facturación: error de base de datos (${message}). Se reintentará.`);
    } finally {
      this.processing = false;
    }
  }

  private async processEmitJob(
    doc: Prisma.ElectronicDocumentGetPayload<{
      include: { lines: true; establishment: { select: { id: true; nombre: true } } };
    }>,
  ) {
    await this.prisma.electronicDocument.update({
      where: { id: doc.id },
      data: { sunatStatus: SunatDocumentStatus.ENVIANDO },
    });

    const config = await this.prisma.establishmentBillingConfig.findUnique({
      where: { establishmentId: doc.establishmentId },
    });
    const provider = await this.resolveProvider(doc.establishmentId);
    const emisorRuc = config?.rucEmisor ?? '20100000001';
    const emisorRazon = config?.razonSocialEmisor ?? doc.establishment.nombre;

    let relatedRef: { documentType: ElectronicDocumentType; serie: string; numero: string } | null =
      null;
    if (doc.documentType === ElectronicDocumentType.NOTA_CREDITO && doc.relatedDocumentId) {
      relatedRef = await this.prisma.electronicDocument.findUnique({
        where: { id: doc.relatedDocumentId },
        select: { documentType: true, serie: true, numero: true },
      });
    }
    if (doc.documentType === ElectronicDocumentType.NOTA_DEBITO && doc.relatedDocumentId) {
      relatedRef = await this.prisma.electronicDocument.findUnique({
        where: { id: doc.relatedDocumentId },
        select: { documentType: true, serie: true, numero: true },
      });
    }

    const lineInputs = doc.lines.map((line) => ({
      lineNumber: line.lineNumber,
      descripcion: line.descripcion,
      cantidad: line.cantidad.toString(),
      precioUnitario: line.precioUnitario.toString(),
      subtotalLinea: line.subtotalLinea.toString(),
      igvLinea: line.igvLinea.toString(),
      totalLinea: line.totalLinea.toString(),
      taxAffectationCodigo: line.taxAffectationCodigo,
    }));

    const fechaEmision = new Date().toISOString();
    const customerAddress = await this.resolveCustomerAddress(doc);
    let ublXml: string;
    let relatedDocument: EmitDocumentInput['relatedDocument'];
    if (doc.documentType === ElectronicDocumentType.NOTA_CREDITO && relatedRef) {
      const relatedType =
        relatedRef.documentType === ElectronicDocumentType.FACTURA ? 'FACTURA' : 'BOLETA';
      relatedDocument = {
        documentType: relatedType,
        serie: relatedRef.serie,
        numero: relatedRef.numero,
      };
      ublXml = this.ubl.buildCreditNote({
        serie: doc.serie,
        numero: doc.numero,
        fechaEmision,
        moneda: doc.moneda,
        emisorRuc,
        emisorRazonSocial: emisorRazon,
        receptorTipoDoc: doc.customerDocType ?? '0',
        receptorNumeroDoc: doc.customerDocNumber ?? '00000000',
        receptorNombre: doc.customerNombre ?? 'CLIENTE VARIOS',
        subtotal: doc.subtotal.toString(),
        igvTotal: doc.igvTotal.toString(),
        total: doc.total.toString(),
        relatedDocumentType: relatedType,
        relatedSerie: relatedRef.serie,
        relatedNumero: relatedRef.numero,
        discrepancyReason: 'Devolución de bienes',
        lines: lineInputs,
      });
    } else if (doc.documentType === ElectronicDocumentType.NOTA_DEBITO && relatedRef) {
      const relatedType =
        relatedRef.documentType === ElectronicDocumentType.FACTURA ? 'FACTURA' : 'BOLETA';
      relatedDocument = {
        documentType: relatedType,
        serie: relatedRef.serie,
        numero: relatedRef.numero,
      };
      ublXml = this.ubl.buildDebitNote({
        serie: doc.serie,
        numero: doc.numero,
        fechaEmision,
        moneda: doc.moneda,
        emisorRuc,
        emisorRazonSocial: emisorRazon,
        receptorTipoDoc: doc.customerDocType ?? '0',
        receptorNumeroDoc: doc.customerDocNumber ?? '00000000',
        receptorNombre: doc.customerNombre ?? 'CLIENTE VARIOS',
        subtotal: doc.subtotal.toString(),
        igvTotal: doc.igvTotal.toString(),
        total: doc.total.toString(),
        relatedDocumentType: relatedType,
        relatedSerie: relatedRef.serie,
        relatedNumero: relatedRef.numero,
        discrepancyReason: doc.voidReason ?? 'Aumento en el valor',
        lines: lineInputs,
      });
    } else {
      const ublType =
        doc.documentType === ElectronicDocumentType.FACTURA
          ? 'FACTURA'
          : doc.documentType === ElectronicDocumentType.BOLETA
            ? 'BOLETA'
            : 'BOLETA';
      ublXml = this.ubl.buildInvoiceOrBoleta({
        documentType: ublType,
        serie: doc.serie,
        numero: doc.numero,
        fechaEmision,
        moneda: doc.moneda,
        emisorRuc,
        emisorRazonSocial: emisorRazon,
        receptorTipoDoc: doc.customerDocType ?? '0',
        receptorNumeroDoc: doc.customerDocNumber ?? '00000000',
        receptorNombre: doc.customerNombre ?? 'CLIENTE VARIOS',
        subtotal: doc.subtotal.toString(),
        igvTotal: doc.igvTotal.toString(),
        total: doc.total.toString(),
        lines: lineInputs,
      });
    }

    const input: EmitDocumentInput = {
      documentId: doc.id,
      documentType: doc.documentType,
      serie: doc.serie,
      numero: doc.numero,
      fechaEmision,
      moneda: doc.moneda,
      subtotal: doc.subtotal.toString(),
      igvTotal: doc.igvTotal.toString(),
      total: doc.total.toString(),
      esContingencia: doc.esContingencia,
      emisor: { ruc: emisorRuc, razonSocial: emisorRazon },
      receptor: {
        tipoDoc: doc.customerDocType ?? '0',
        numeroDoc: doc.customerDocNumber ?? '00000000',
        nombre: doc.customerNombre ?? 'CLIENTE VARIOS',
        direccion: customerAddress,
      },
      lines: doc.lines.map((line) => ({
        descripcion: line.descripcion,
        codigoProducto: line.codigoProducto,
        codigoSunat: line.codigoSunat,
        unidadMedida: line.unidadMedida,
        cantidad: line.cantidad.toString(),
        precioUnitario: line.precioUnitario.toString(),
        subtotalLinea: line.subtotalLinea.toString(),
        igvLinea: line.igvLinea.toString(),
        totalLinea: line.totalLinea.toString(),
        taxAffectationCodigo: line.taxAffectationCodigo,
      })),
      ublXml,
      relatedDocument,
      creditNoteReasonCode: relatedDocument && doc.documentType === ElectronicDocumentType.NOTA_CREDITO ? '09' : undefined,
      debitNoteReasonCode:
        relatedDocument && doc.documentType === ElectronicDocumentType.NOTA_DEBITO ? '02' : undefined,
      voidReasonText: doc.voidReason ?? undefined,
    };

    if (
      doc.documentType === ElectronicDocumentType.FACTURA &&
      config?.applyDetraccion &&
      doc.total.gte(DETRACCION_MIN_TOTAL)
    ) {
      const totalNum = Number(doc.total.toString());
      const porcentaje = 12;
      input.detraccion = {
        codigoBien: '037',
        porcentaje,
        monto: Math.round(totalNum * (porcentaje / 100) * 100) / 100,
        cuentaBanco: DETRACCION_CUENTA_BN,
      };
    }

    if (doc.documentType === ElectronicDocumentType.GUIA_REMISION_REMITENTE && doc.inventoryTransferId) {
      const despatch = await this.buildDespatchFromTransfer(doc.inventoryTransferId, emisorRuc, emisorRazon);
      if (despatch) input.despatch = despatch;
    }

    const result = await provider.emit(input);
    const xmlId = await this.artifacts.saveText(
      `${doc.serie}-${doc.numero}.xml`,
      'application/xml',
      result.xmlContent,
    );
    const pdfId = await this.artifacts.saveBuffer(
      `${doc.serie}-${doc.numero}.pdf`,
      'application/pdf',
      result.pdfContent,
    );
    const cdrId = await this.artifacts.saveBuffer(
      `${doc.serie}-${doc.numero}-cdr.txt`,
      'text/plain',
      result.cdrContent,
    );

    await this.prisma.electronicDocument.update({
      where: { id: doc.id },
      data: {
        sunatStatus: doc.esContingencia ? SunatDocumentStatus.CONTINGENCIA : result.sunatStatus,
        sunatCodigo: result.sunatCodigo,
        sunatDescripcion: result.sunatDescripcion,
        externalId: result.externalId,
        xmlArchivoId: xmlId,
        pdfArchivoId: pdfId,
        cdrArchivoId: cdrId,
        emittedAt: new Date(),
      },
    });

    await this.prisma.sunatResponse.create({
      data: {
        electronicDocumentId: doc.id,
        tipo: 'CDR',
        codigo: result.sunatCodigo,
        descripcion: result.sunatDescripcion,
        payload: result.cdrContent.toString('utf8').slice(0, 4000),
      },
    });

    const sunatStatus = doc.esContingencia ? SunatDocumentStatus.CONTINGENCIA : result.sunatStatus;
    await this.notifyBillingRealtime(doc.id, {
      sunatStatus,
      sunatCodigo: result.sunatCodigo,
      sunatDescripcion: result.sunatDescripcion,
    });
  }

  private async retryRejectedAutomatically() {
    const due = await this.prisma.electronicDocument.findMany({
      where: {
        sunatStatus: SunatDocumentStatus.RECHAZADO,
        nextRetryAt: { lte: new Date() },
        retryCount: { lt: 5 },
        deletedAt: null,
      },
      take: 5,
      select: { id: true },
    });
    for (const doc of due) {
      const pending = await this.prisma.billingJob.findFirst({
        where: {
          electronicDocumentId: doc.id,
          status: BillingJobStatus.PENDIENTE,
        },
      });
      if (!pending) {
        await this.prisma.billingJob.create({
          data: {
            electronicDocumentId: doc.id,
            jobType: BillingJobType.RETRY,
            status: BillingJobStatus.PENDIENTE,
          },
        });
      }
    }
  }

  private async billingCapabilitiesFor(establishmentId: string) {
    const nodeEnv = this.config.get<string>('NODE_ENV');
    const config = await this.prisma.establishmentBillingConfig.findUnique({
      where: { establishmentId },
      select: { provider: true },
    });
    const provider =
      config?.provider ??
      (nodeEnv === 'production' ? BillingProviderType.FACTILIZA : BillingProviderType.MOCK);
    return getBillingProviderCapabilities(provider, nodeEnv);
  }

  private async resolveProvider(establishmentId: string): Promise<IBillingProvider> {
    const nodeEnv = this.config.get<string>('NODE_ENV');
    const config = await this.prisma.establishmentBillingConfig.findUnique({
      where: { establishmentId },
    });

    if (nodeEnv === 'production') {
      if (!config || config.provider === BillingProviderType.MOCK) {
        throw new BadRequestException(
          'Facturación electrónica: en producción debe configurar un proveedor OSE (Factiliza o Nubefact) con credenciales válidas.',
        );
      }
      if (!config.apiTokenEncrypted?.trim()) {
        throw new BadRequestException(
          'Facturación electrónica: configure el token API del proveedor OSE antes de emitir comprobantes.',
        );
      }
    }

    if (config?.provider === BillingProviderType.FACTILIZA) {
      const token = config.apiTokenEncrypted
        ? decryptBillingSecret(config.apiTokenEncrypted, this.encryptionKey())
        : null;
      this.factilizaProvider.setCredentials(config.apiUrl, token);
      return this.factilizaProvider;
    }
    if (config?.provider === BillingProviderType.NUBEFACT) {
      const token = config.apiTokenEncrypted
        ? decryptBillingSecret(config.apiTokenEncrypted, this.encryptionKey())
        : null;
      this.nubefactProvider.setCredentials(config.apiUrl, token);
      return this.nubefactProvider;
    }
    return this.mockProvider;
  }

  private async resolveCustomerAddress(
    doc: Prisma.ElectronicDocumentGetPayload<{ select: { saleId: true; saleReturnId: true } }>,
  ): Promise<string> {
    const loadAddress = async (customerId: string | null | undefined) => {
      if (!customerId) return null;
      const address = await this.prisma.customerAddress.findFirst({
        where: { customerId },
        orderBy: [{ esPrincipal: 'desc' }, { createdAt: 'asc' }],
        select: { direccion: true },
      });
      return address?.direccion?.trim() ?? null;
    };

    if (doc.saleId) {
      const sale = await this.prisma.sale.findUnique({
        where: { id: doc.saleId },
        select: { customerId: true },
      });
      const dir = await loadAddress(sale?.customerId);
      if (dir) return dir;
    }
    if (doc.saleReturnId) {
      const saleReturn = await this.prisma.saleReturn.findUnique({
        where: { id: doc.saleReturnId },
        select: { sale: { select: { customerId: true } } },
      });
      const dir = await loadAddress(saleReturn?.sale.customerId);
      if (dir) return dir;
    }
    return 'SIN DIRECCION';
  }

  private mapSaleDocumentType(type: SaleDocumentType): ElectronicDocumentType {
    if (type === SaleDocumentType.FACTURA) return ElectronicDocumentType.FACTURA;
    if (type === SaleDocumentType.BOLETA) return ElectronicDocumentType.BOLETA;
    return ElectronicDocumentType.NOTA_VENTA;
  }

  private async resolveCreditNoteNumber(
    establishmentId: string,
    originalDocType: ElectronicDocumentType,
  ) {
    const preferredSerie =
      originalDocType === ElectronicDocumentType.FACTURA ? 'FC01' : 'BC01';
    const series =
      (await this.prisma.establishmentSeries.findFirst({
        where: {
          establishmentId,
          documentType: DocumentSeriesType.NOTA_CREDITO,
          numero: preferredSerie,
        },
        select: { numero: true },
      })) ??
      (await this.prisma.establishmentSeries.findFirst({
        where: { establishmentId, documentType: DocumentSeriesType.NOTA_CREDITO },
        orderBy: { numero: 'asc' },
        select: { numero: true },
      }));
    const serie = series?.numero ?? preferredSerie;
    const last = await this.prisma.electronicDocument.findFirst({
      where: {
        establishmentId,
        documentType: ElectronicDocumentType.NOTA_CREDITO,
        serie,
      },
      orderBy: { numero: 'desc' },
      select: { numero: true },
    });
    const next = String((Number.parseInt(last?.numero ?? '0', 10) || 0) + 1).padStart(8, '0');
    return { serie, numero: next };
  }

  private async resolveDebitNoteNumber(
    establishmentId: string,
    originalDocType: ElectronicDocumentType,
  ) {
    const preferredSerie =
      originalDocType === ElectronicDocumentType.FACTURA ? 'FD01' : 'BD01';
    const series =
      (await this.prisma.establishmentSeries.findFirst({
        where: {
          establishmentId,
          documentType: DocumentSeriesType.NOTA_DEBITO,
          numero: preferredSerie,
        },
        select: { numero: true },
      })) ??
      (await this.prisma.establishmentSeries.findFirst({
        where: { establishmentId, documentType: DocumentSeriesType.NOTA_DEBITO },
        orderBy: { numero: 'asc' },
        select: { numero: true },
      }));
    const serie = series?.numero ?? preferredSerie;
    const last = await this.prisma.electronicDocument.findFirst({
      where: {
        establishmentId,
        documentType: ElectronicDocumentType.NOTA_DEBITO,
        serie,
      },
      orderBy: { numero: 'desc' },
      select: { numero: true },
    });
    const next = String((Number.parseInt(last?.numero ?? '0', 10) || 0) + 1).padStart(8, '0');
    return { serie, numero: next };
  }

  private resolveReceptor(
    customer: {
      nombre: string;
      numeroDocumento: string;
      tipoDocumento: CustomerDocumentType;
    } | null,
    saleDocType: SaleDocumentType,
  ) {
    if (!customer) {
      return {
        tipoDoc: saleDocType === SaleDocumentType.FACTURA ? '6' : '0',
        numeroDoc: saleDocType === SaleDocumentType.FACTURA ? '00000000000' : '00000000',
        nombre: 'CLIENTE VARIOS',
      };
    }
    const map: Record<CustomerDocumentType, string> = {
      DNI: '1',
      RUC: '6',
      CE: '4',
      PASAPORTE: '7',
      DOC_SIN_RUC: '0',
      OTRO: '0',
    };
    return {
      tipoDoc: map[customer.tipoDocumento] ?? '0',
      numeroDoc: customer.numeroDocumento,
      nombre: customer.nombre,
    };
  }

  private async ensureDocument(id: string, establishmentId: string) {
    const doc = await this.prisma.electronicDocument.findFirst({
      where: { id, establishmentId, deletedAt: null },
    });
    if (!doc) throw new NotFoundException('Comprobante no encontrado');
    return doc;
  }

  private mapDocument(
    doc: Prisma.ElectronicDocumentGetPayload<{
      include: {
        lines: true;
        taxLines: true;
        responses: true;
        sale: { select: { id: true; documentType: true } };
        relatedDocument: { select: { id: true; documentType: true; serie: true; numero: true } };
      };
    }>,
  ) {
    return {
      id: doc.id,
      saleId: doc.saleId,
      saleReturnId: doc.saleReturnId,
      relatedDocumentId: doc.relatedDocumentId,
      relatedDocument: doc.relatedDocument
        ? {
            id: doc.relatedDocument.id,
            documentType: doc.relatedDocument.documentType,
            serie: doc.relatedDocument.serie,
            numero: doc.relatedDocument.numero,
          }
        : null,
      documentType: doc.documentType,
      serie: doc.serie,
      numero: doc.numero,
      sunatStatus: doc.sunatStatus,
      subtotal: doc.subtotal.toString(),
      igvTotal: doc.igvTotal.toString(),
      total: doc.total.toString(),
      moneda: doc.moneda,
      esContingencia: doc.esContingencia,
      externalId: doc.externalId,
      sunatCodigo: doc.sunatCodigo,
      sunatDescripcion: doc.sunatDescripcion,
      customerNombre: doc.customerNombre,
      customerDocNumber: doc.customerDocNumber,
      xmlArchivoId: doc.xmlArchivoId,
      pdfArchivoId: doc.pdfArchivoId,
      cdrArchivoId: doc.cdrArchivoId,
      emittedAt: doc.emittedAt?.toISOString() ?? null,
      createdAt: doc.createdAt.toISOString(),
      lines: doc.lines.map((l) => ({
        lineNumber: l.lineNumber,
        descripcion: l.descripcion,
        cantidad: l.cantidad.toString(),
        precioUnitario: l.precioUnitario.toString(),
        subtotalLinea: l.subtotalLinea.toString(),
        igvLinea: l.igvLinea.toString(),
        totalLinea: l.totalLinea.toString(),
        taxAffectationCodigo: l.taxAffectationCodigo,
      })),
      taxLines: doc.taxLines.map((t) => ({
        taxCodigo: t.taxCodigo,
        taxNombre: t.taxNombre,
        baseImponible: t.baseImponible.toString(),
        monto: t.monto.toString(),
      })),
      responses: doc.responses.map((r) => ({
        tipo: r.tipo,
        codigo: r.codigo,
        descripcion: r.descripcion,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  async validateRuc(establishmentId: string, ruc: string) {
    const normalized = ruc.trim();
    if (!/^\d{11}$/.test(normalized)) {
      throw new BadRequestException('RUC debe tener 11 dígitos');
    }
    const config = await this.prisma.establishmentBillingConfig.findUnique({
      where: { establishmentId },
    });
    const token = config?.apiTokenEncrypted
      ? decryptBillingSecret(config.apiTokenEncrypted, this.encryptionKey())
      : null;
    if (!token) {
      throw new BadRequestException('Configure token Factiliza en comprobante electrónico para consultar RUC');
    }
    const info = await this.factilizaConsulta.validateRuc(
      config?.consultaApiUrl ?? null,
      token,
      normalized,
    );
    return {
      ruc: info.numero,
      razonSocial: info.nombre_o_razon_social,
      estado: info.estado,
      condicion: info.condicion,
      direccion: info.direccion_completa ?? null,
    };
  }

  async validateDni(establishmentId: string, dni: string) {
    const normalized = dni.trim();
    if (!/^\d{8}$/.test(normalized)) {
      throw new BadRequestException('DNI debe tener 8 dígitos');
    }
    const config = await this.prisma.establishmentBillingConfig.findUnique({
      where: { establishmentId },
    });
    const token = config?.apiTokenEncrypted
      ? decryptBillingSecret(config.apiTokenEncrypted, this.encryptionKey())
      : null;
    if (!token) {
      throw new BadRequestException('Configure token Factiliza en comprobante electrónico para consultar DNI');
    }
    const info = await this.factilizaConsulta.validateDni(
      config?.consultaApiUrl ?? null,
      token,
      normalized,
    );
    const nombre =
      info.nombre_completo?.trim() ||
      [info.nombres, info.apellido_paterno, info.apellido_materno].filter(Boolean).join(' ');
    return {
      dni: info.numero,
      nombre,
    };
  }

  async refreshDocumentStatus(id: string, establishmentId: string, actorId?: string) {
    const doc = await this.ensureDocument(id, establishmentId);
    const config = await this.prisma.establishmentBillingConfig.findUnique({
      where: { establishmentId },
    });
    const token = config?.apiTokenEncrypted
      ? decryptBillingSecret(config.apiTokenEncrypted, this.encryptionKey())
      : null;
    if (!token || !config?.rucEmisor) {
      const provider = await this.resolveProvider(establishmentId);
      const result = doc.externalId
        ? await provider.getStatus(doc.externalId)
        : { sunatStatus: doc.sunatStatus, sunatCodigo: doc.sunatCodigo ?? '0', sunatDescripcion: doc.sunatDescripcion ?? '' };
      return this.applyStatusUpdate(doc.id, result, actorId);
    }

    const tipoDocMap: Record<string, string> = {
      FACTURA: '01',
      BOLETA: '03',
      NOTA_CREDITO: '07',
      NOTA_DEBITO: '08',
      GUIA_REMISION_REMITENTE: '09',
      RETENCION: '20',
      PERCEPCION: '40',
      LIQUIDACION_COMPRA: '04',
    };
    const tipoDoc = tipoDocMap[doc.documentType] ?? '03';
    const fecha = (doc.emittedAt ?? doc.createdAt).toISOString().slice(0, 10);
    const cpe = await this.factilizaConsulta.queryCpeStatus(config.consultaApiUrl, token, {
      rucEmisor: config.rucEmisor,
      tipoDoc,
      serie: doc.serie,
      numero: doc.numero,
      fechaEmision: fecha,
      total: Number(doc.total.toString()),
    });
    const codigo = cpe.comprobante_estado_codigo ?? '0';
    const sunatStatus =
      codigo === '1' || codigo === '0'
        ? SunatDocumentStatus.ACEPTADO
        : codigo === '2'
          ? SunatDocumentStatus.OBSERVADO
          : SunatDocumentStatus.RECHAZADO;
    return this.applyStatusUpdate(
      doc.id,
      {
        sunatStatus,
        sunatCodigo: codigo,
        sunatDescripcion: cpe.comprobante_estado_descripcion ?? 'Consulta SUNAT',
      },
      actorId,
    );
  }

  private async applyStatusUpdate(
    id: string,
    result: { sunatStatus: SunatDocumentStatus; sunatCodigo: string; sunatDescripcion: string },
    actorId?: string,
  ) {
    await this.prisma.electronicDocument.update({
      where: { id },
      data: {
        sunatStatus: result.sunatStatus,
        sunatCodigo: result.sunatCodigo,
        sunatDescripcion: result.sunatDescripcion,
      },
    });
    await this.audit.log({ userId: actorId, action: 'QUERY_STATUS', entity: 'ElectronicDocument', entityId: id });
    await this.notifyBillingRealtime(id, result);
    return { ok: true, ...result };
  }

  private async notifyBillingRealtime(
    docId: string,
    result: { sunatStatus: SunatDocumentStatus; sunatCodigo: string; sunatDescripcion: string },
  ) {
    const doc = await this.prisma.electronicDocument.findUnique({
      where: { id: docId },
      select: { establishmentId: true, saleId: true },
    });
    if (!doc?.saleId) return;
    this.realtime.emitBillingStatus(doc.establishmentId, doc.saleId, {
      saleId: doc.saleId,
      sunatStatus: result.sunatStatus,
      sunatCodigo: result.sunatCodigo,
      sunatDescripcion: result.sunatDescripcion,
    });
  }

  async scheduleEmitFromTransfer(transferId: string): Promise<string | null> {
    const transfer = await this.prisma.inventoryStockTransfer.findFirst({
      where: { id: transferId, deletedAt: null },
      include: {
        items: {
          include: {
            product: {
              select: {
                nombre: true,
                codigoInterno: true,
                unit: { select: { codigo: true } },
              },
            },
          },
        },
        fromWarehouse: {
          select: {
            establishmentId: true,
            nombre: true,
            establishment: {
              select: {
                id: true,
                nombre: true,
                direccionFiscal: true,
                direccionComercial: true,
                districtId: true,
              },
            },
          },
        },
        toWarehouse: {
          select: {
            establishmentId: true,
            nombre: true,
            establishment: {
              select: {
                id: true,
                nombre: true,
                direccionFiscal: true,
                direccionComercial: true,
                districtId: true,
              },
            },
          },
        },
        electronicDocument: { select: { id: true } },
      },
    });
    if (!transfer || transfer.electronicDocument) return transfer?.electronicDocument?.id ?? null;

    const establishmentId = transfer.fromWarehouse.establishmentId;
    const config = await this.prisma.establishmentBillingConfig.findUnique({
      where: { establishmentId },
    });
    if (config && !config.autoEmitGuiaOnTransfer) return null;

    const { serie, numero } = await this.resolveNextDocumentNumber(
      establishmentId,
      ElectronicDocumentType.GUIA_REMISION_REMITENTE,
      DocumentSeriesType.GUIA_REMISION_REMITENTE,
      'T001',
    );

    const destEstablishment = transfer.toWarehouse.establishment;
    const doc = await this.prisma.electronicDocument.create({
      data: {
        establishmentId,
        inventoryTransferId: transfer.id,
        documentType: ElectronicDocumentType.GUIA_REMISION_REMITENTE,
        serie,
        numero,
        subtotal: new Prisma.Decimal(0),
        igvTotal: new Prisma.Decimal(0),
        total: new Prisma.Decimal(0),
        sunatStatus: SunatDocumentStatus.PENDIENTE,
        customerDocType: '6',
        customerDocNumber: config?.rucEmisor ?? '00000000000',
        customerNombre: destEstablishment.nombre,
        lines: {
          create: transfer.items.map((item, index) => ({
            lineNumber: index + 1,
            descripcion: item.product.nombre,
            codigoProducto: item.product.codigoInterno,
            unidadMedida: item.product.unit.codigo,
            cantidad: item.cantidad,
            precioUnitario: new Prisma.Decimal(0),
            subtotalLinea: new Prisma.Decimal(0),
            igvLinea: new Prisma.Decimal(0),
            totalLinea: new Prisma.Decimal(0),
          })),
        },
        jobs: {
          create: { jobType: BillingJobType.EMIT, status: BillingJobStatus.PENDIENTE },
        },
      },
      select: { id: true },
    });

    setImmediate(() => void this.processPendingJobs());
    return doc.id;
  }

  async emitGuiaFromTransfer(transferId: string, establishmentId: string) {
    const transfer = await this.prisma.inventoryStockTransfer.findFirst({
      where: { id: transferId, deletedAt: null },
      include: {
        fromWarehouse: { select: { establishmentId: true } },
        electronicDocument: { select: { id: true } },
      },
    });
    if (!transfer) throw new NotFoundException('Transferencia no encontrada');
    if (transfer.fromWarehouse.establishmentId !== establishmentId) {
      throw new BadRequestException('La transferencia no pertenece a su establecimiento');
    }
    const docId =
      transfer.electronicDocument?.id ?? (await this.scheduleEmitFromTransfer(transferId));
    if (!docId) throw new BadRequestException('No se pudo programar la guía de remisión');
    await this.processPendingJobs();
    return this.getDocument(docId, establishmentId);
  }

  async emitSpecialDocument(establishmentId: string, dto: EmitSpecialDocumentDto, actorId?: string) {
    const caps = await this.billingCapabilitiesFor(establishmentId);
    const blocked = caps.unsupportedSpecialDocuments.find(
      (row) => row.documentType === dto.documentType,
    );
    if (blocked) {
      throw new BadRequestException(blocked.reason);
    }
    const docType = dto.documentType as ElectronicDocumentType;
    const seriesTypeMap: Record<string, DocumentSeriesType> = {
      RETENCION: DocumentSeriesType.COMPROBANTE_RETENCION_ELECTRONICA,
      PERCEPCION: DocumentSeriesType.COMPROBANTE_PERCEPCION_ELECTRONICA,
      LIQUIDACION_COMPRA: DocumentSeriesType.LIQUIDACION_COMPRA,
      GUIA_REMISION_TRANSPORTISTA: DocumentSeriesType.GUIA_REMISION_TRANSPORTISTA,
    };
    const preferredSerieMap: Record<string, string> = {
      RETENCION: 'R001',
      PERCEPCION: 'P001',
      LIQUIDACION_COMPRA: 'L001',
      GUIA_REMISION_TRANSPORTISTA: 'V001',
    };
    const { serie, numero } = await this.resolveNextDocumentNumber(
      establishmentId,
      docType,
      seriesTypeMap[dto.documentType],
      preferredSerieMap[dto.documentType],
    );

    const subtotal = new Prisma.Decimal(dto.subtotal);
    const igvTotal = new Prisma.Decimal(dto.igvTotal);
    const total = new Prisma.Decimal(dto.total);

    const doc = await this.prisma.electronicDocument.create({
      data: {
        establishmentId,
        documentType: docType,
        serie,
        numero,
        subtotal,
        igvTotal,
        total,
        sunatStatus: SunatDocumentStatus.PENDIENTE,
        customerDocType: dto.customerDocType,
        customerDocNumber: dto.customerDocNumber,
        customerNombre: dto.customerNombre,
        lines: {
          create: dto.lines.map((line, index) => ({
            lineNumber: index + 1,
            descripcion: line.descripcion,
            codigoProducto: line.codigoProducto ?? null,
            unidadMedida: line.unidadMedida ?? 'NIU',
            cantidad: new Prisma.Decimal(line.cantidad),
            precioUnitario: new Prisma.Decimal(line.precioUnitario),
            subtotalLinea: new Prisma.Decimal(line.subtotalLinea),
            igvLinea: new Prisma.Decimal(line.igvLinea),
            totalLinea: new Prisma.Decimal(line.totalLinea),
          })),
        },
        taxLines: {
          create: [
            {
              taxCodigo: '1000',
              taxNombre: 'IGV',
              baseImponible: subtotal,
              monto: igvTotal,
            },
          ],
        },
        jobs: {
          create: { jobType: BillingJobType.EMIT, status: BillingJobStatus.PENDIENTE },
        },
      },
      select: { id: true },
    });

    await this.audit.log({
      userId: actorId,
      action: 'EMIT_SPECIAL',
      entity: 'ElectronicDocument',
      entityId: doc.id,
    });
    setImmediate(() => void this.processPendingJobs());
    return this.getDocument(doc.id, establishmentId);
  }

  private async resolveNextDocumentNumber(
    establishmentId: string,
    electronicType: ElectronicDocumentType,
    seriesType: DocumentSeriesType,
    preferredSerie: string,
  ) {
    const series =
      (await this.prisma.establishmentSeries.findFirst({
        where: { establishmentId, documentType: seriesType, numero: preferredSerie },
        select: { numero: true },
      })) ??
      (await this.prisma.establishmentSeries.findFirst({
        where: { establishmentId, documentType: seriesType },
        orderBy: { numero: 'asc' },
        select: { numero: true },
      }));
    const serie = series?.numero ?? preferredSerie;
    const last = await this.prisma.electronicDocument.findFirst({
      where: { establishmentId, documentType: electronicType, serie },
      orderBy: { numero: 'desc' },
      select: { numero: true },
    });
    const next = String((Number.parseInt(last?.numero ?? '0', 10) || 0) + 1).padStart(8, '0');
    return { serie, numero: next };
  }

  private async buildDespatchFromTransfer(
    transferId: string,
    emisorRuc: string,
    emisorRazon: string,
  ): Promise<EmitDocumentInput['despatch'] | null> {
    const transfer = await this.prisma.inventoryStockTransfer.findUnique({
      where: { id: transferId },
      include: {
        fromWarehouse: {
          select: {
            establishmentId: true,
            nombre: true,
            establishment: {
              select: {
                nombre: true,
                direccionFiscal: true,
                direccionComercial: true,
                districtId: true,
              },
            },
          },
        },
        toWarehouse: {
          select: {
            establishmentId: true,
            nombre: true,
            establishment: {
              select: {
                nombre: true,
                direccionFiscal: true,
                direccionComercial: true,
                districtId: true,
              },
            },
          },
        },
        items: true,
      },
    });
    if (!transfer) return null;

    const fromEst = transfer.fromWarehouse.establishment;
    const toEst = transfer.toWarehouse.establishment;
    const sameEstablishment = transfer.fromWarehouse.establishmentId === transfer.toWarehouse.establishmentId;
    const modalidad: 'MISMA_EMPRESA' | 'PRIVADO' = sameEstablishment ? 'MISMA_EMPRESA' : 'PRIVADO';
    const pesoBruto = transfer.items.reduce(
      (sum, item) => sum + Number(item.cantidad.toString()),
      0,
    );

    return {
      modalidad,
      motivoTraslado: '04',
      partidaUbigeo: fromEst.districtId ?? '150101',
      partidaDireccion:
        fromEst.direccionFiscal ?? fromEst.direccionComercial ?? transfer.fromWarehouse.nombre,
      llegadaUbigeo: toEst.districtId ?? '150101',
      llegadaDireccion:
        toEst.direccionFiscal ?? toEst.direccionComercial ?? transfer.toWarehouse.nombre,
      pesoBrutoTotal: Math.max(pesoBruto, 1),
      numeroBultos: transfer.items.length,
      destinatarioTipoDoc: '6',
      destinatarioNumDoc: emisorRuc,
      destinatarioRazonSocial: toEst.nombre || emisorRazon,
    };
  }
}
