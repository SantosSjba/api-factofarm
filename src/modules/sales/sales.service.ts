import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AccountReceivableStatus,
  CashMovementType,
  DocumentSeriesType,
  PaymentMethod,
  Prisma,
  PromotionType,
  QuotationStatus,
  SaleDocumentType,
  SaleVoidRequestStatus,
  SaleStatus,
  UserRole,
} from '../../generated/prisma/client';
import { buildPaginatedResult, paginationArgs } from '../../common/dto/pagination.dto';
import { AuditLogService } from '../../common/services/audit-log.service';
import { canVoidSaleDirectly } from '../../common/permissions/role-policy.util';
import {
  applySaleLevelDiscount,
  computeSaleLineTotals,
} from '../../common/utils/sale-pricing.util';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryMovementsService } from '../inventory-movements/inventory-movements.service';
import { InventoryLotAllocationService } from '../inventory-movements/inventory-lot-allocation.service';
import { BillingService } from '../billing/billing.service';
import { PrescriptionsService } from '../prescriptions/prescriptions.service';
import { PharmaceuticalService } from '../pharmaceutical/pharmaceutical.service';
import { PharmacistLicenseService } from '../compliance/services/pharmacist-license.service';
import { RegulatedPriceService } from '../compliance/services/regulated-price.service';
import { RealtimeService } from '../realtime/realtime.service';
import { LoyaltyService } from '../marketing/loyalty.service';
import { PromotionsService } from '../marketing/promotions.service';
import { validateSalePayments } from './utils/payment-validation.util';
import { SaleLotAllocationMode } from '../inventory-movements/dto/sale-lot-allocation-preview.dto';
import {
  CreateSaleDto,
  CreateSaleDebitNoteDto,
  CreateSaleReturnDto,
  SyncSalesDto,
  VoidSaleDto,
} from './dto/create-sale.dto';
import { SaleListQueryDto } from './dto/sale-list-query.dto';

const DOC_SERIES_MAP: Record<SaleDocumentType, DocumentSeriesType> = {
  BOLETA: DocumentSeriesType.BOLETA_VENTA_ELECTRONICA,
  FACTURA: DocumentSeriesType.FACTURA_ELECTRONICA,
  NOTA_VENTA: DocumentSeriesType.NOTA_VENTA,
  TICKET: DocumentSeriesType.BOLETA_VENTA_ELECTRONICA,
};

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
    private readonly inventory: InventoryMovementsService,
    private readonly lotAllocation: InventoryLotAllocationService,
    private readonly billing: BillingService,
    private readonly prescriptions: PrescriptionsService,
    private readonly pharmaceutical: PharmaceuticalService,
    private readonly pharmacistLicenses: PharmacistLicenseService,
    private readonly regulatedPrices: RegulatedPriceService,
    private readonly realtime: RealtimeService,
    private readonly loyalty: LoyaltyService,
    private readonly promotions: PromotionsService,
  ) {}

  async findAll(establishmentId: string, query: SaleListQueryDto) {
    const storage = query.storage ?? 'hot';
    if (storage === 'archived') {
      return this.findArchived(establishmentId, query);
    }

    const { page, pageSize, skip, take } = paginationArgs(query);
    const where: Prisma.SaleWhereInput = {
      establishmentId,
      deletedAt: null,
      ...(storage === 'hot' ? { archivedAt: null } : {}),
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.sellerId ? { sellerId: query.sellerId } : {}),
      ...(query.estado ? { estado: query.estado } : {}),
      ...(query.documentType ? { documentType: query.documentType } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
      ...(query.paymentMetodo || query.paymentReferencia?.trim()
        ? {
            payments: {
              some: {
                ...(query.paymentMetodo ? { metodo: query.paymentMetodo } : {}),
                ...(query.paymentReferencia?.trim()
                  ? {
                      referencia: {
                        contains: query.paymentReferencia.trim(),
                        mode: 'insensitive' as const,
                      },
                    }
                  : {}),
              },
            },
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.sale.count({ where }),
      this.prisma.sale.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          documentType: true,
          serie: true,
          numero: true,
          estado: true,
          subtotal: true,
          descuentoTotal: true,
          igvTotal: true,
          total: true,
          archivedAt: true,
          createdAt: true,
          customer: { select: { id: true, nombre: true } },
          seller: { select: { id: true, nombre: true } },
        },
      }),
    ]);

    return buildPaginatedResult(
      rows.map((row) => ({
        ...row,
        storage: row.archivedAt ? 'archived' : 'hot',
        subtotal: row.subtotal.toString(),
        descuentoTotal: row.descuentoTotal.toString(),
        igvTotal: row.igvTotal.toString(),
        total: row.total.toString(),
      })),
      total,
      page,
      pageSize,
    );
  }

  async findArchived(establishmentId: string, query: SaleListQueryDto) {
    const { page, pageSize, skip, take } = paginationArgs(query);
    const where: Prisma.ArchivedSaleWhereInput = {
      establishmentId,
      ...(query.from || query.to
        ? {
            originalCreatedAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.archivedSale.count({ where }),
      this.prisma.archivedSale.findMany({
        where,
        skip,
        take,
        orderBy: { originalCreatedAt: 'desc' },
      }),
    ]);

    return buildPaginatedResult(
      rows.map((row) => this.mapArchivedSaleListItem(row)),
      total,
      page,
      pageSize,
    );
  }

  async findOne(id: string, establishmentId: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id, establishmentId, deletedAt: null },
      include: {
        customer: { select: { id: true, nombre: true, numeroDocumento: true } },
        seller: { select: { id: true, nombre: true } },
        items: {
          include: {
            product: { select: { id: true, nombre: true, codigoInterno: true } },
            lotLines: true,
          },
        },
        payments: true,
      },
    });
    if (sale) {
      return {
        ...this.mapSaleDetail(sale),
        storage: sale.archivedAt ? 'archived' : 'hot',
        archivedAt: sale.archivedAt,
      };
    }

    const archived = await this.prisma.archivedSale.findFirst({
      where: { id, establishmentId },
    });
    if (!archived) throw new NotFoundException('Venta no encontrada');
    return this.mapArchivedSaleDetail(archived);
  }

  private mapArchivedSaleListItem(row: {
    id: string;
    establishmentId: string;
    originalCreatedAt: Date;
    archivedAt: Date;
    payload: unknown;
  }) {
    const payload = (row.payload ?? {}) as Record<string, unknown>;
    const customer = payload.customer as { id?: string; nombre?: string } | undefined;
    const seller = payload.seller as { id?: string; nombre?: string } | undefined;
    return {
      id: row.id,
      documentType: payload.documentType ?? null,
      serie: payload.serie ?? null,
      numero: payload.numero ?? null,
      estado: payload.estado ?? null,
      subtotal: String(payload.subtotal ?? ''),
      descuentoTotal: String(payload.descuentoTotal ?? ''),
      igvTotal: String(payload.igvTotal ?? ''),
      total: String(payload.total ?? ''),
      createdAt: row.originalCreatedAt,
      archivedAt: row.archivedAt,
      storage: 'archived' as const,
      customer: customer ? { id: customer.id, nombre: customer.nombre } : null,
      seller: seller ? { id: seller.id, nombre: seller.nombre } : null,
    };
  }

  private mapArchivedSaleDetail(row: {
    id: string;
    establishmentId: string;
    originalCreatedAt: Date;
    archivedAt: Date;
    payload: unknown;
  }) {
    const payload = (row.payload ?? {}) as Record<string, unknown>;
    return {
      ...payload,
      id: row.id,
      establishmentId: row.establishmentId,
      createdAt: row.originalCreatedAt,
      archivedAt: row.archivedAt,
      storage: 'archived' as const,
      fromColdStorage: true as const,
      total: String(payload.total ?? '0'),
      documentType: payload.documentType ?? null,
      serie: (payload.serie as string | null | undefined) ?? null,
      numero: payload.numero ?? null,
    };
  }

  async create(
    dto: CreateSaleDto,
    actor: { sub: string; establecimientoId: string },
    idempotencyKey?: string,
  ) {
    if (idempotencyKey?.trim()) {
      const existing = await this.prisma.sale.findFirst({
        where: { idempotencyKey: idempotencyKey.trim() },
        select: { id: true },
      });
      if (existing) {
        return this.findOne(existing.id, actor.establecimientoId);
      }
    }

    const warehouse = await this.prisma.warehouse.findFirst({
      where: {
        id: dto.warehouseId,
        establishmentId: actor.establecimientoId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!warehouse) throw new NotFoundException('Almacén no válido');

    if (dto.cashSessionId) {
      const session = await this.prisma.cashSession.findFirst({
        where: {
          id: dto.cashSessionId,
          estado: 'ABIERTA',
          cashRegister: { establishmentId: actor.establecimientoId },
        },
        select: { id: true },
      });
      if (!session) throw new BadRequestException('Sesión de caja no abierta');
    }

    const resolvedAgreement = await this.resolveSaleAgreement(
      actor.establecimientoId,
      dto.customerId,
      dto.agreementId,
    );

    const pricedItems = await this.buildPricedItems(
      dto,
      actor.establecimientoId,
      resolvedAgreement?.id,
    );
    await this.regulatedPrices.checkSalePrices(
      actor.establecimientoId,
      pricedItems.map((item) => ({
        productId: item.productId,
        precioUnitario: item.precioUnitario,
      })),
    );
    await this.validateSubstitutions(dto.substitutions);
    const controlledLicense = await this.validateControlledApproval(
      actor,
      pricedItems.map((item) => item.productId),
      dto.controlledApprovedById,
      dto.controlledDigitalSignature,
    );

    const requiresRx = pricedItems.some((item) => item.necesitaRecetaMedica);
    if (requiresRx) {
      if (dto.prescriptionId) {
        await this.prescriptions.validateForSale(
          dto.prescriptionId,
          actor.establecimientoId,
          pricedItems.map((item) => ({ productId: item.productId, cantidad: item.cantidad })),
          dto.substitutions?.map((s) => ({
            originalProductId: s.originalProductId,
            substituteProductId: s.substituteProductId,
          })),
        );
      } else if (!dto.prescriptionValidated) {
        throw new BadRequestException(
          'La venta incluye productos con receta obligatoria. Seleccione una receta o valide manualmente.',
        );
      }
    }

    let subtotal = new Prisma.Decimal(0);
    let igvTotal = new Prisma.Decimal(0);
    let total = new Prisma.Decimal(0);
    for (const item of pricedItems) {
      subtotal = subtotal.plus(item.subtotalLinea);
      igvTotal = igvTotal.plus(item.igvLinea);
      total = total.plus(item.totalLinea);
    }

    let descuentoTotal = new Prisma.Decimal(0);
    if (dto.saleDiscountType && dto.saleDiscountValue) {
      const adjusted = applySaleLevelDiscount(
        subtotal,
        igvTotal,
        total,
        dto.saleDiscountType,
        new Prisma.Decimal(dto.saleDiscountValue),
      );
      subtotal = adjusted.subtotal;
      igvTotal = adjusted.igv;
      total = adjusted.total;
      descuentoTotal = adjusted.descuento;
    }

    if (dto.promotionCode?.trim()) {
      const promoDiscount = await this.applyPromotion(
        actor.establecimientoId,
        dto.promotionCode.trim(),
        pricedItems,
        total,
      );
      if (promoDiscount.greaterThan(0)) {
        descuentoTotal = descuentoTotal.plus(promoDiscount);
        total = Prisma.Decimal.max(total.minus(promoDiscount), new Prisma.Decimal(0));
      }
    }

    let coberturaConvenio = new Prisma.Decimal(0);
    let copagoPaciente = total;
    if (resolvedAgreement) {
      coberturaConvenio = total
        .times(resolvedAgreement.coberturaPorcentaje)
        .div(100);
      copagoPaciente = total.minus(coberturaConvenio);
    }

    const amountToCollect = coberturaConvenio.greaterThan(0) ? copagoPaciente : total;
    if (amountToCollect.greaterThan(0)) {
      validateSalePayments(dto.payments, amountToCollect);
    } else if (!dto.payments.length) {
      dto.payments = [{ metodo: PaymentMethod.EFECTIVO, monto: 0 }];
    }

    const { serie, numero } = await this.resolveDocumentNumber(
      actor.establecimientoId,
      dto.documentType,
      dto.serie,
    );

    const stockAllocations: Array<{
      index: number;
      asignacion: { codigoLote: string; cantidad: string }[];
    }> = [];
    for (let i = 0; i < pricedItems.length; i++) {
      const priced = pricedItems[i];
      const dispatch = await this.inventory.dispatchSaleStock(
        {
          productId: priced.productId,
          warehouseId: dto.warehouseId,
          quantity: Number(priced.cantidad.toString()),
          mode: priced.lotAllocationMode ?? SaleLotAllocationMode.AUTO,
          manualLots: priced.manualLots,
          reference: `${serie}-${numero}`,
          comment: 'Reserva previa venta POS',
        },
        actor.sub,
      );
      stockAllocations.push({ index: i, asignacion: dispatch.asignacion ?? [] });
    }

    const saleId = await this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          establishmentId: actor.establecimientoId,
          warehouseId: dto.warehouseId,
          cashSessionId: dto.cashSessionId ?? null,
          customerId: dto.customerId ?? null,
          sellerId: actor.sub,
          quotationId: dto.quotationId ?? null,
          documentType: dto.documentType,
          serie,
          numero,
          subtotal,
          descuentoTotal,
          igvTotal,
          total,
          saleDiscountType: dto.saleDiscountType ?? null,
          saleDiscountValue:
            dto.saleDiscountValue !== undefined
              ? new Prisma.Decimal(dto.saleDiscountValue)
              : null,
          promotionCode: dto.promotionCode?.trim() || null,
          idempotencyKey: idempotencyKey?.trim() || null,
          prescriptionValidated: dto.prescriptionValidated ?? !!dto.prescriptionId,
          prescriptionNote: dto.prescriptionNote?.trim() || null,
          prescriptionId: dto.prescriptionId ?? null,
          controlledApprovedById: dto.controlledApprovedById ?? null,
          controlledApprovedAt: dto.controlledApprovedById ? new Date() : null,
          controlledPharmacistLicenseId: controlledLicense?.id ?? null,
          controlledDigitalSignature: dto.controlledDigitalSignature?.trim() || null,
          comentario: dto.comentario?.trim() || null,
          agreementId: resolvedAgreement?.id ?? null,
          coberturaConvenio,
          copagoPaciente,
          items: {
            create: pricedItems.map((item) => ({
              productId: item.productId,
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              discountType: item.discountType ?? null,
              discountValue: item.discountValue ?? null,
              subtotalLinea: item.subtotalLinea,
              igvLinea: item.igvLinea,
              totalLinea: item.totalLinea,
              promotionLabel: item.promotionLabel ?? null,
            })),
          },
          payments: {
            create: dto.payments.map((p) => ({
              metodo: p.metodo,
              monto: new Prisma.Decimal(p.monto),
              referencia: p.referencia?.trim() || null,
            })),
          },
        },
        include: { items: true },
      });

      for (const alloc of stockAllocations) {
        const saleItem = sale.items[alloc.index];
        if (alloc.asignacion.length > 0) {
          await tx.saleItemLot.createMany({
            data: alloc.asignacion.map((line) => ({
              saleItemId: saleItem.id,
              codigoLote: line.codigoLote,
              cantidad: new Prisma.Decimal(line.cantidad),
            })),
          });
        }
      }

      if (dto.substitutions?.length) {
        await tx.saleSubstitution.createMany({
          data: dto.substitutions.map((sub) => ({
            saleId: sale.id,
            productOriginalId: sub.originalProductId,
            productSustitutoId: sub.substituteProductId,
            motivo: sub.motivo?.trim() || null,
            userId: actor.sub,
          })),
        });
      }

      if (dto.cashSessionId) {
        const cashTotal = dto.payments
          .filter((p) => p.metodo === PaymentMethod.EFECTIVO)
          .reduce((acc, p) => acc.plus(new Prisma.Decimal(p.monto)), new Prisma.Decimal(0));
        if (cashTotal.greaterThan(0)) {
          await tx.cashMovement.create({
            data: {
              cashSessionId: dto.cashSessionId,
              tipo: CashMovementType.VENTA,
              monto: cashTotal,
              metodoPago: PaymentMethod.EFECTIVO,
              saleId: sale.id,
              referencia: `${serie}-${numero}`,
            },
          });
        }
      }

      if (dto.quotationId) {
        await tx.quotation.update({
          where: { id: dto.quotationId },
          data: { estado: QuotationStatus.CONVERTIDA },
        });
      }

      if (dto.customerId && coberturaConvenio.greaterThan(0) && resolvedAgreement) {
        const vencimiento = new Date();
        vencimiento.setDate(vencimiento.getDate() + resolvedAgreement.diasCredito);
        await tx.accountReceivable.create({
          data: {
            establishmentId: actor.establecimientoId,
            customerId: dto.customerId,
            saleId: sale.id,
            agreementId: resolvedAgreement.id,
            documentoRef: `${serie}-${numero}`,
            montoTotal: coberturaConvenio,
            montoPagado: new Prisma.Decimal(0),
            saldo: coberturaConvenio,
            fechaVencimiento: vencimiento,
            estado: AccountReceivableStatus.PENDIENTE,
            comentario: `Cobertura convenio ${resolvedAgreement.codigo}`,
          },
        });
      }

      const creditPayment = dto.payments.find((p) => p.metodo === PaymentMethod.CREDITO);
      if (
        dto.customerId &&
        !resolvedAgreement &&
        creditPayment &&
        new Prisma.Decimal(creditPayment.monto).greaterThan(0)
      ) {
        const customer = await tx.customer.findFirst({
          where: { id: dto.customerId },
          select: { diasCredito: true },
        });
        const creditAmount = new Prisma.Decimal(creditPayment.monto);
        const vencimiento = new Date();
        vencimiento.setDate(vencimiento.getDate() + (customer?.diasCredito ?? 0));
        await tx.accountReceivable.create({
          data: {
            establishmentId: actor.establecimientoId,
            customerId: dto.customerId,
            saleId: sale.id,
            documentoRef: `${serie}-${numero}`,
            montoTotal: creditAmount,
            montoPagado: new Prisma.Decimal(0),
            saldo: creditAmount,
            fechaVencimiento: vencimiento,
            estado: AccountReceivableStatus.PENDIENTE,
            comentario: 'Venta a crédito',
          },
        });
      }

      return sale.id;
    });

    await this.audit.log({
      userId: actor.sub,
      action: 'CREATE',
      entity: 'Sale',
      entityId: saleId,
    });

    void this.billing.scheduleEmitFromSale(saleId).catch(() => undefined);

    if (dto.prescriptionId) {
      void this.prescriptions
        .applyDispenseFromSale(
          dto.prescriptionId,
          pricedItems.map((item) => ({ productId: item.productId, cantidad: item.cantidad })),
          actor.sub,
        )
        .catch(() => undefined);
    }

    void this.pharmaceutical
      .recordControlledOutflow(
        actor.establecimientoId,
        pricedItems.map((item) => ({ productId: item.productId, cantidad: item.cantidad })),
        `Venta ${saleId}`,
        actor.sub,
      )
      .catch(() => undefined);

    const saleDetail = await this.findOne(saleId, actor.establecimientoId);
    this.realtime.emitSaleCompleted(actor.establecimientoId, {
      saleId: saleDetail.id,
      total: String(saleDetail.total ?? '0'),
      documentType: String(saleDetail.documentType ?? ''),
      serie: saleDetail.serie == null ? null : String(saleDetail.serie),
      numero: saleDetail.numero == null ? null : String(saleDetail.numero),
    });
    this.realtime.emitStockUpdated(actor.establecimientoId, dto.warehouseId);

    if (dto.customerId) {
      void this.loyalty
        .awardForSale(
          actor.establecimientoId,
          dto.customerId,
          new Prisma.Decimal(saleDetail.total),
          saleDetail.id,
          actor.sub,
        )
        .catch(() => undefined);
    }
    if (dto.promotionCode?.trim()) {
      void this.promotions
        .recordRedemption(
          actor.establecimientoId,
          dto.promotionCode.trim(),
          saleDetail.id,
          dto.customerId,
        )
        .catch(() => undefined);
    }

    return saleDetail;
  }

  async syncOfflineBatch(
    dto: SyncSalesDto,
    actor: { sub: string; establecimientoId: string },
  ) {
    const results: Array<{
      offlineLocalId: string;
      ok: boolean;
      saleId?: string;
      error?: string;
    }> = [];

    for (const row of dto.sales) {
      try {
        const sale = await this.create(row.sale, actor, row.offlineLocalId);
        results.push({ offlineLocalId: row.offlineLocalId, ok: true, saleId: sale.id });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al sincronizar venta';
        results.push({ offlineLocalId: row.offlineLocalId, ok: false, error: message });
      }
    }

    return {
      synced: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      results,
    };
  }

  async voidSale(
    id: string,
    dto: VoidSaleDto,
    actor: { sub: string; establecimientoId: string; role: UserRole },
  ) {
    if (!canVoidSaleDirectly(actor.role)) {
      throw new ForbiddenException(
        'Su rol debe solicitar autorización para anular ventas. Use la solicitud de anulación.',
      );
    }
    const sale = await this.prisma.sale.findFirst({
      where: { id, establishmentId: actor.establecimientoId, deletedAt: null },
      include: { items: { include: { lotLines: true } } },
    });
    if (!sale) throw new NotFoundException('Venta no encontrada');
    if (sale.estado !== SaleStatus.COMPLETADA) {
      throw new BadRequestException('Solo se pueden anular ventas completadas');
    }
    if (sale.sellerId === actor.sub) {
      throw new ForbiddenException('Otro usuario debe autorizar la anulación');
    }

    await this.prisma.$transaction(async (tx) => {
      for (const item of sale.items) {
        const delta = item.cantidad;
        if (item.lotLines.length > 0) {
          for (const lot of item.lotLines) {
            await this.inventory.executeAdjustmentDelta({
              productId: item.productId,
              warehouseId: sale.warehouseId,
              lotCode: lot.codigoLote,
              delta: lot.cantidad,
              reason: `Anulación venta ${sale.serie}-${sale.numero}: ${dto.reason}`,
              userId: actor.sub,
            });
          }
        } else {
          await this.inventory.executeAdjustmentDelta({
            productId: item.productId,
            warehouseId: sale.warehouseId,
            lotCode: null,
            delta,
            reason: `Anulación venta ${sale.serie}-${sale.numero}`,
            userId: actor.sub,
          });
        }
      }

      await tx.sale.update({
        where: { id },
        data: {
          estado: SaleStatus.ANULADA,
          voidReason: dto.reason.trim(),
          voidedById: actor.sub,
          voidedAt: new Date(),
        },
      });

      if (sale.cashSessionId) {
        await tx.cashMovement.create({
          data: {
            cashSessionId: sale.cashSessionId,
            tipo: CashMovementType.ANULACION,
            monto: sale.total.negated(),
            saleId: sale.id,
            comentario: dto.reason.trim(),
          },
        });
      }
    });

    await this.audit.log({
      userId: actor.sub,
      action: 'VOID',
      entity: 'Sale',
      entityId: id,
    });

    await this.billing
      .voidFromSale(id, actor.establecimientoId, dto.reason.trim(), actor.sub)
      .catch(() => undefined);

    return { ok: true, message: 'Venta anulada y stock revertido' };
  }

  async listVoidRequests(establishmentId: string, status?: SaleVoidRequestStatus) {
    const rows = await this.prisma.saleVoidRequest.findMany({
      where: {
        establishmentId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        sale: { select: { id: true, serie: true, numero: true, total: true, sellerId: true } },
        requestedBy: { select: { id: true, nombre: true } },
        approvedBy: { select: { id: true, nombre: true } },
      },
    });
    return rows.map((r) => ({
      id: r.id,
      saleId: r.saleId,
      reason: r.reason,
      status: r.status,
      rejectedReason: r.rejectedReason,
      createdAt: r.createdAt.toISOString(),
      resolvedAt: r.resolvedAt?.toISOString() ?? null,
      sale: {
        ...r.sale,
        total: r.sale.total.toString(),
      },
      requestedBy: r.requestedBy,
      approvedBy: r.approvedBy,
    }));
  }

  async requestVoidSale(
    id: string,
    dto: VoidSaleDto,
    actor: { sub: string; establecimientoId: string; role: UserRole },
  ) {
    if (canVoidSaleDirectly(actor.role)) {
      return this.voidSale(id, dto, actor);
    }

    const sale = await this.prisma.sale.findFirst({
      where: { id, establishmentId: actor.establecimientoId, deletedAt: null },
      select: { id: true, estado: true },
    });
    if (!sale) throw new NotFoundException('Venta no encontrada');
    if (sale.estado !== SaleStatus.COMPLETADA) {
      throw new BadRequestException('Solo se pueden solicitar anulaciones de ventas completadas');
    }

    const existing = await this.prisma.saleVoidRequest.findUnique({ where: { saleId: id } });
    if (existing?.status === SaleVoidRequestStatus.PENDIENTE) {
      throw new BadRequestException('Ya existe una solicitud pendiente para esta venta');
    }
    if (existing?.status === SaleVoidRequestStatus.APROBADA) {
      throw new BadRequestException('La venta ya fue anulada');
    }

    const row = await this.prisma.saleVoidRequest.upsert({
      where: { saleId: id },
      create: {
        establishmentId: actor.establecimientoId,
        saleId: id,
        requestedById: actor.sub,
        reason: dto.reason.trim(),
        status: SaleVoidRequestStatus.PENDIENTE,
      },
      update: {
        requestedById: actor.sub,
        reason: dto.reason.trim(),
        status: SaleVoidRequestStatus.PENDIENTE,
        rejectedReason: null,
        resolvedAt: null,
        approvedById: null,
      },
    });

    await this.audit.log({
      userId: actor.sub,
      action: 'REQUEST_VOID',
      entity: 'SaleVoidRequest',
      entityId: row.id,
    });

    return { ok: true, requestId: row.id, status: row.status };
  }

  async approveVoidRequest(
    requestId: string,
    actor: { sub: string; establecimientoId: string; role: UserRole },
  ) {
    if (!canVoidSaleDirectly(actor.role)) {
      throw new ForbiddenException('No autorizado para aprobar anulaciones');
    }

    const request = await this.prisma.saleVoidRequest.findFirst({
      where: { id: requestId, establishmentId: actor.establecimientoId },
      include: { sale: { select: { sellerId: true } } },
    });
    if (!request) throw new NotFoundException('Solicitud no encontrada');
    if (request.status !== SaleVoidRequestStatus.PENDIENTE) {
      throw new BadRequestException('La solicitud ya fue procesada');
    }
    if (request.sale.sellerId === actor.sub) {
      throw new ForbiddenException('Otro usuario debe autorizar la anulación');
    }

    await this.prisma.saleVoidRequest.update({
      where: { id: requestId },
      data: {
        status: SaleVoidRequestStatus.APROBADA,
        approvedById: actor.sub,
        resolvedAt: new Date(),
      },
    });

    return this.voidSale(request.saleId, { reason: request.reason }, actor);
  }

  async rejectVoidRequest(
    requestId: string,
    rejectedReason: string,
    actor: { sub: string; establecimientoId: string; role: UserRole },
  ) {
    if (!canVoidSaleDirectly(actor.role)) {
      throw new ForbiddenException('No autorizado para rechazar anulaciones');
    }

    const request = await this.prisma.saleVoidRequest.findFirst({
      where: { id: requestId, establishmentId: actor.establecimientoId },
    });
    if (!request) throw new NotFoundException('Solicitud no encontrada');
    if (request.status !== SaleVoidRequestStatus.PENDIENTE) {
      throw new BadRequestException('La solicitud ya fue procesada');
    }

    await this.prisma.saleVoidRequest.update({
      where: { id: requestId },
      data: {
        status: SaleVoidRequestStatus.RECHAZADA,
        approvedById: actor.sub,
        rejectedReason: rejectedReason.trim(),
        resolvedAt: new Date(),
      },
    });

    return { ok: true };
  }

  async createReturn(
    saleId: string,
    dto: CreateSaleReturnDto,
    actor: { sub: string; establecimientoId: string },
  ) {
    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, establishmentId: actor.establecimientoId, deletedAt: null },
      include: { items: true },
    });
    if (!sale) throw new NotFoundException('Venta no encontrada');
    if (sale.estado === SaleStatus.ANULADA) {
      throw new BadRequestException('No se puede devolver una venta anulada');
    }

    let totalDevuelto = new Prisma.Decimal(0);
    for (const line of dto.items) {
      const item = sale.items.find((row) => row.id === line.saleItemId);
      if (!item) throw new BadRequestException('Ítem de venta no válido');
      const qty = new Prisma.Decimal(line.quantity);
      if (qty.greaterThan(item.cantidad)) {
        throw new BadRequestException('Cantidad devuelta supera la vendida');
      }
      totalDevuelto = totalDevuelto.plus(
        item.totalLinea.times(qty).div(item.cantidad),
      );
      await this.inventory.executeAdjustmentDelta({
        productId: item.productId,
        warehouseId: sale.warehouseId,
        lotCode: line.lotCode?.trim() || null,
        delta: qty,
        reason: `Devolución venta ${sale.serie}-${sale.numero}`,
        userId: actor.sub,
      });
    }

    const saleReturn = await this.prisma.saleReturn.create({
      data: {
        saleId,
        userId: actor.sub,
        motivo: dto.motivo.trim(),
        totalDevuelto,
        items: {
          create: dto.items.map((line) => ({
            saleItemId: line.saleItemId,
            cantidad: new Prisma.Decimal(line.quantity),
            codigoLote: line.lotCode?.trim() || null,
          })),
        },
      },
    });

    const allItemsFullyReturned = sale.items.every((item) => {
      const returnedQty = dto.items
        .filter((line) => line.saleItemId === item.id)
        .reduce((acc, line) => acc.plus(new Prisma.Decimal(line.quantity)), new Prisma.Decimal(0));
      return returnedQty.greaterThanOrEqualTo(item.cantidad);
    });
    await this.prisma.sale.update({
      where: { id: saleId },
      data: {
        estado: allItemsFullyReturned ? SaleStatus.ANULADA : SaleStatus.PARCIALMENTE_DEVUELTA,
      },
    });

    if (sale.cashSessionId) {
      await this.prisma.cashMovement.create({
        data: {
          cashSessionId: sale.cashSessionId,
          tipo: CashMovementType.EGRESO,
          monto: totalDevuelto.negated(),
          saleId: sale.id,
          comentario: `Devolución: ${dto.motivo.trim()}`,
        },
      });
    }

    const electronicDocumentId = await this.billing
      .scheduleEmitFromReturn(saleReturn.id)
      .catch(() => null);

    return {
      ok: true,
      message: 'Devolución registrada',
      saleReturnId: saleReturn.id,
      totalDevuelto: totalDevuelto.toString(),
      electronicDocumentId,
    };
  }

  async createDebitNote(
    saleId: string,
    dto: CreateSaleDebitNoteDto,
    actor: { sub: string; establecimientoId: string },
  ) {
    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, establishmentId: actor.establecimientoId, deletedAt: null },
      include: { electronicDocument: { select: { id: true, sunatStatus: true } } },
    });
    if (!sale) throw new NotFoundException('Venta no encontrada');
    if (sale.estado === SaleStatus.ANULADA) {
      throw new BadRequestException('No se puede emitir ND sobre una venta anulada');
    }
    if (sale.documentType !== SaleDocumentType.BOLETA && sale.documentType !== SaleDocumentType.FACTURA) {
      throw new BadRequestException('La nota de débito solo aplica a boletas o facturas');
    }
    if (!sale.electronicDocument) {
      throw new BadRequestException('La venta no tiene comprobante electrónico asociado');
    }

    const electronicDocumentId = await this.billing.scheduleDebitNoteFromSale(saleId, {
      motivo: dto.motivo.trim(),
      descripcion: dto.descripcion.trim(),
      total: dto.total,
    });
    if (!electronicDocumentId) {
      throw new BadRequestException(
        'No se pudo programar la nota de débito. Verifique OSE, estado SUNAT del comprobante y series ND.',
      );
    }

    return {
      ok: true,
      message: 'Nota de débito en proceso de emisión',
      electronicDocumentId,
    };
  }

  async checkInteractions(productIds: string[]) {
    const uniqueIds = [...new Set(productIds)];
    const catalogRows = await this.prisma.drugInteraction.findMany({
      where: { deletedAt: null },
      select: {
        principioA: true,
        principioB: true,
        severidad: true,
        descripcion: true,
        recomendacion: true,
      },
    });

    const knownPrinciples = new Set<string>();
    for (const row of catalogRows) {
      knownPrinciples.add(row.principioA);
      knownPrinciples.add(row.principioB);
    }

    const products = await this.prisma.product.findMany({
      where: { id: { in: uniqueIds }, deletedAt: null },
      select: { id: true, nombre: true, principioActivo: true },
    });

    const mapped = products.map((p) => {
      const resolved = this.resolveActivePrinciple(p.principioActivo, knownPrinciples);
      return {
        id: p.id,
        nombre: p.nombre,
        principioActivo: p.principioActivo,
        resolved,
      };
    });

    const withPrinciple = mapped.filter((p) => p.resolved != null);
    const principlesInCart = new Set(withPrinciple.map((p) => p.resolved!));
    const missingPrinciples = mapped
      .filter((p) => !p.resolved)
      .map((p) => ({ id: p.id, nombre: p.nombre }));

    if (principlesInCart.size < 2 || catalogRows.length === 0) {
      return { hasAlerts: false, alerts: [], missingPrinciples };
    }

    const alerts = catalogRows
      .filter((row) => principlesInCart.has(row.principioA) && principlesInCart.has(row.principioB))
      .map((row) => ({
        severidad: row.severidad,
        principioA: row.principioA,
        principioB: row.principioB,
        descripcion: row.descripcion,
        recomendacion: row.recomendacion,
        productos: withPrinciple
          .filter((p) => p.resolved === row.principioA || p.resolved === row.principioB)
          .map((p) => ({
            id: p.id,
            nombre: p.nombre,
            principioActivo: p.principioActivo ?? p.resolved!,
          })),
      }));

    return {
      hasAlerts: alerts.length > 0,
      alerts,
      missingPrinciples,
    };
  }

  async posCatalog(establishmentId: string, warehouseId: string, search?: string) {
    const term = search?.trim();
    const products = await this.prisma.product.findMany({
      where: {
        deletedAt: null,
        habilitado: true,
        ...(term
          ? {
              OR: [
                { nombre: { contains: term, mode: 'insensitive' } },
                { codigoInterno: { contains: term, mode: 'insensitive' } },
                { codigoBarra: { contains: term, mode: 'insensitive' } },
              ],
            }
          : {}),
        warehouseStocks: { some: { warehouseId, cantidad: { gt: 0 } } },
      },
      take: 50,
      orderBy: { nombre: 'asc' },
      select: {
        id: true,
        nombre: true,
        codigoInterno: true,
        codigoBarra: true,
        precioUnitarioVenta: true,
        incluyeIgvVenta: true,
        necesitaRecetaMedica: true,
        manejaLotes: true,
        saleTaxAffectation: { select: { codigo: true } },
        warehouseStocks: {
          where: { warehouseId },
          select: { cantidad: true },
        },
        esControlado: true,
        imagenArchivoId: true,
      },
    });

    const lotProductIds = products.filter((p) => p.manejaLotes).map((p) => p.id);
    const eligibleByProduct = await this.lotAllocation.batchSumEligibleStock(
      lotProductIds,
      warehouseId,
    );

    return products
      .map((p) => {
        const warehouseStock = p.warehouseStocks[0]?.cantidad ?? new Prisma.Decimal(0);
        const sellable = p.manejaLotes
          ? (eligibleByProduct.get(p.id) ?? new Prisma.Decimal(0))
          : warehouseStock;
        if (sellable.lte(0)) return null;

        return {
          id: p.id,
          nombre: p.nombre,
          codigoInterno: p.codigoInterno,
          codigoBarra: p.codigoBarra,
          precio: p.precioUnitarioVenta.toString(),
          stock: sellable.toString(),
          warehouseStock: warehouseStock.toString(),
          necesitaRecetaMedica: p.necesitaRecetaMedica,
          manejaLotes: p.manejaLotes,
          esControlado: p.esControlado,
          imagenArchivoId: p.imagenArchivoId,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);
  }

  async suggestGenericSubstitutes(
    establishmentId: string,
    productId: string,
    warehouseId: string,
  ) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: warehouseId, establishmentId, deletedAt: null },
      select: { id: true },
    });
    if (!warehouse) throw new NotFoundException('Almacén no válido');

    const links = await this.prisma.productEquivalent.findMany({
      where: { productId },
      include: {
        equivalentProduct: {
          select: {
            id: true,
            nombre: true,
            codigoInterno: true,
            generico: true,
            precioUnitarioVenta: true,
            habilitado: true,
            deletedAt: true,
            warehouseStocks: {
              where: { warehouseId },
              select: { cantidad: true },
            },
          },
        },
      },
    });

    return links
      .map((link) => link.equivalentProduct)
      .filter((p) => p.deletedAt === null && p.habilitado)
      .map((p) => ({
        id: p.id,
        nombre: p.nombre,
        codigoInterno: p.codigoInterno,
        generico: p.generico,
        precio: p.precioUnitarioVenta.toString(),
        stock: p.warehouseStocks[0]?.cantidad.toString() ?? '0',
      }))
      .filter((p) => Number.parseFloat(p.stock) > 0)
      .sort((a, b) => (b.generico ? 1 : 0) - (a.generico ? 1 : 0));
  }

  private async validateSubstitutions(
    substitutions?: CreateSaleDto['substitutions'],
  ) {
    if (!substitutions?.length) return;
    for (const sub of substitutions) {
      const link = await this.prisma.productEquivalent.findFirst({
        where: {
          OR: [
            { productId: sub.originalProductId, equivalentProductId: sub.substituteProductId },
            { productId: sub.substituteProductId, equivalentProductId: sub.originalProductId },
          ],
        },
      });
      if (!link) {
        throw new BadRequestException(
          `Sustituto no autorizado para el producto ${sub.originalProductId}`,
        );
      }
    }
  }

  private async validateControlledApproval(
    actor: { sub: string; establecimientoId: string },
    productIds: string[],
    controlledApprovedById?: string,
    controlledDigitalSignature?: string,
  ) {
    const controlledCount = await this.prisma.product.count({
      where: { id: { in: productIds }, esControlado: true, deletedAt: null },
    });
    if (controlledCount === 0) return null;

    if (!controlledApprovedById) {
      throw new BadRequestException(
        'La venta incluye medicamentos controlados. Se requiere aprobación del farmacéutico titular.',
      );
    }
    if (controlledApprovedById === actor.sub) {
      throw new ForbiddenException('Un segundo usuario debe autorizar la dispensación de controlados');
    }

    return this.pharmacistLicenses.validateApproverForControlled(
      controlledApprovedById,
      actor.establecimientoId,
      controlledDigitalSignature,
    );
  }

  private async buildPricedItems(
    dto: CreateSaleDto,
    establishmentId: string,
    agreementId?: string,
  ) {
    const items: Array<{
      productId: string;
      cantidad: Prisma.Decimal;
      precioUnitario: Prisma.Decimal;
      discountType?: CreateSaleDto['items'][0]['discountType'];
      discountValue?: Prisma.Decimal | null;
      subtotalLinea: Prisma.Decimal;
      igvLinea: Prisma.Decimal;
      totalLinea: Prisma.Decimal;
      necesitaRecetaMedica: boolean;
      lotAllocationMode?: SaleLotAllocationMode;
      manualLots?: { lotCode: string; quantity: number }[];
      promotionLabel?: string;
    }> = [];

    for (const line of dto.items) {
      const product = await this.prisma.product.findFirst({
        where: { id: line.productId, deletedAt: null, habilitado: true },
        select: {
          id: true,
          precioUnitarioVenta: true,
          incluyeIgvVenta: true,
          necesitaRecetaMedica: true,
          saleTaxAffectation: { select: { codigo: true } },
        },
      });
      if (!product) throw new NotFoundException(`Producto no encontrado: ${line.productId}`);

      const unitPrice = line.unitPrice
        ? new Prisma.Decimal(line.unitPrice)
        : await this.resolveUnitPrice(
            line.productId,
            dto.warehouseId,
            dto.customerId,
            agreementId,
          );

      const qty = new Prisma.Decimal(line.quantity);
      const totals = computeSaleLineTotals({
        unitPrice,
        quantity: qty,
        incluyeIgv: product.incluyeIgvVenta,
        taxCodigo: product.saleTaxAffectation.codigo,
        discountType: line.discountType,
        discountValue:
          line.discountValue !== undefined ? new Prisma.Decimal(line.discountValue) : null,
      });

      items.push({
        productId: product.id,
        cantidad: qty,
        precioUnitario: unitPrice,
        discountType: line.discountType,
        discountValue:
          line.discountValue !== undefined ? new Prisma.Decimal(line.discountValue) : null,
        ...totals,
        necesitaRecetaMedica: product.necesitaRecetaMedica,
        lotAllocationMode: line.lotAllocationMode,
        manualLots: line.manualLots,
      });
    }

    return items;
  }

  private async resolveUnitPrice(
    productId: string,
    warehouseId: string,
    customerId?: string,
    agreementId?: string,
  ) {
    if (agreementId) {
      const agreementPrice = await this.prisma.agreementProductPrice.findUnique({
        where: { agreementId_productId: { agreementId, productId } },
        select: { precio: true },
      });
      if (agreementPrice) return agreementPrice.precio;
    }
    if (customerId) {
      const custom = await this.prisma.customerProductPrice.findUnique({
        where: { customerId_productId: { customerId, productId } },
        select: { precio: true },
      });
      if (custom) return custom.precio;
    }
    const whPrice = await this.prisma.productWarehousePrice.findUnique({
      where: { productId_warehouseId: { productId, warehouseId } },
      select: { precio: true },
    });
    if (whPrice) return whPrice.precio;
    const product = await this.prisma.product.findFirst({
      where: { id: productId },
      select: { precioUnitarioVenta: true },
    });
    return product!.precioUnitarioVenta;
  }

  private async resolveSaleAgreement(
    establishmentId: string,
    customerId?: string,
    agreementIdInput?: string,
  ) {
    let agreementId = agreementIdInput ?? null;
    if (!agreementId && customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: customerId, deletedAt: null },
        select: { agreementId: true },
      });
      agreementId = customer?.agreementId ?? null;
    }
    if (!agreementId) return null;

    const agreement = await this.prisma.agreement.findFirst({
      where: {
        id: agreementId,
        establishmentId,
        activo: true,
        deletedAt: null,
      },
      select: {
        id: true,
        codigo: true,
        coberturaPorcentaje: true,
        diasCredito: true,
      },
    });
    return agreement ?? null;
  }

  private async resolveDocumentNumber(
    establishmentId: string,
    documentType: SaleDocumentType,
    serieInput?: string,
  ) {
    const seriesType = DOC_SERIES_MAP[documentType];
    const series = await this.prisma.establishmentSeries.findFirst({
      where: { establishmentId, documentType: seriesType },
      orderBy: { numero: 'asc' },
      select: { numero: true },
    });
    const serie = serieInput?.trim() || series?.numero || 'NV01';

    const last = await this.prisma.sale.findFirst({
      where: { establishmentId, documentType, serie },
      orderBy: { numero: 'desc' },
      select: { numero: true },
    });
    const next = String((Number.parseInt(last?.numero ?? '0', 10) || 0) + 1).padStart(8, '0');
    return { serie, numero: next };
  }

  private async applyPromotion(
    establishmentId: string,
    code: string,
    items: { cantidad: Prisma.Decimal; totalLinea: Prisma.Decimal }[],
    saleTotal: Prisma.Decimal,
  ) {
    const promo = await this.prisma.promotion.findFirst({
      where: {
        establishmentId,
        codigo: code,
        activo: true,
        deletedAt: null,
        OR: [{ validFrom: null }, { validFrom: { lte: new Date() } }],
      },
    });
    if (!promo) return new Prisma.Decimal(0);
    if (promo.validTo && promo.validTo.getTime() < Date.now()) {
      return new Prisma.Decimal(0);
    }

    switch (promo.tipo) {
      case PromotionType.PORCENTAJE_VENTA:
        return saleTotal.times(promo.valor).div(100);
      case PromotionType.CANTIDAD_MINIMA: {
        const qty = items.reduce((acc, row) => acc.plus(row.cantidad), new Prisma.Decimal(0));
        if (promo.cantidadMinima && qty.greaterThanOrEqualTo(promo.cantidadMinima)) {
          return promo.valor;
        }
        return new Prisma.Decimal(0);
      }
      default:
        return new Prisma.Decimal(0);
    }
  }

  private mapSaleDetail(sale: {
    id: string;
    documentType: SaleDocumentType;
    serie: string | null;
    numero: string | null;
    estado: SaleStatus;
    subtotal: Prisma.Decimal;
    descuentoTotal: Prisma.Decimal;
    igvTotal: Prisma.Decimal;
    total: Prisma.Decimal;
    prescriptionValidated: boolean;
    prescriptionNote: string | null;
    comentario: string | null;
    createdAt: Date;
    customer: { id: string; nombre: string; numeroDocumento: string } | null;
    seller: { id: string; nombre: string };
    items: Array<{
      id: string;
      cantidad: Prisma.Decimal;
      precioUnitario: Prisma.Decimal;
      subtotalLinea: Prisma.Decimal;
      igvLinea: Prisma.Decimal;
      totalLinea: Prisma.Decimal;
      product: { id: string; nombre: string; codigoInterno: string | null };
      lotLines: Array<{ codigoLote: string; cantidad: Prisma.Decimal }>;
    }>;
    payments: Array<{ metodo: PaymentMethod; monto: Prisma.Decimal; referencia: string | null }>;
  }) {
    return {
      id: sale.id,
      documentType: sale.documentType,
      serie: sale.serie,
      numero: sale.numero,
      estado: sale.estado,
      subtotal: sale.subtotal.toString(),
      descuentoTotal: sale.descuentoTotal.toString(),
      igvTotal: sale.igvTotal.toString(),
      total: sale.total.toString(),
      prescriptionValidated: sale.prescriptionValidated,
      prescriptionNote: sale.prescriptionNote,
      comentario: sale.comentario,
      createdAt: sale.createdAt.toISOString(),
      customer: sale.customer,
      seller: sale.seller,
      items: sale.items.map((item) => ({
        id: item.id,
        producto: item.product.nombre,
        codigoInterno: item.product.codigoInterno,
        cantidad: item.cantidad.toString(),
        precioUnitario: item.precioUnitario.toString(),
        subtotalLinea: item.subtotalLinea.toString(),
        igvLinea: item.igvLinea.toString(),
        totalLinea: item.totalLinea.toString(),
        lotes: item.lotLines.map((lot) => ({
          codigoLote: lot.codigoLote,
          cantidad: lot.cantidad.toString(),
        })),
      })),
      payments: sale.payments.map((p) => ({
        metodo: p.metodo,
        monto: p.monto.toString(),
        referencia: p.referencia,
      })),
    };
  }

  private resolveActivePrinciple(
    raw: string | null | undefined,
    knownPrinciples: Set<string>,
  ): string | null {
    const normalized = raw?.trim().toUpperCase().replace(/\s+/g, ' ') ?? '';
    if (!normalized) return null;
    if (knownPrinciples.has(normalized)) return normalized;
    for (const principle of knownPrinciples) {
      if (normalized.includes(principle) || principle.includes(normalized)) {
        return principle;
      }
    }
    return null;
  }
}
