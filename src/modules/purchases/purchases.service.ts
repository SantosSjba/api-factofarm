import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AccountPayableStatus,
  InventoryMovementType,
  Prisma,
  PurchaseOrderStatus,
  SupplierCreditNoteStatus,
} from '../../generated/prisma/client';
import { buildPaginatedResult, paginationArgs } from '../../common/dto/pagination.dto';
import { AuditLogService } from '../../common/services/audit-log.service';
import { computeSaleLineTotals } from '../../common/utils/sale-pricing.util';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateGoodsReceiptDto,
  CreatePurchaseOrderDto,
  CreateSupplierCreditNoteDto,
  RegisterAccountPayablePaymentDto,
} from './dto/purchase.dto';
import {
  AccountPayableListQueryDto,
  PriceComparisonQueryDto,
  PurchaseOrderListQueryDto,
  ReplenishmentReportQueryDto,
} from './dto/purchase-query.dto';

@Injectable()
export class PurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  // —— Órdenes de compra ——

  async listPurchaseOrders(establishmentId: string, query: PurchaseOrderListQueryDto) {
    const { page, pageSize, skip, take } = paginationArgs(query);
    const where: Prisma.PurchaseOrderWhereInput = {
      establishmentId,
      deletedAt: null,
      ...(query.supplierId ? { supplierId: query.supplierId } : {}),
      ...(query.estado ? { estado: query.estado } : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.purchaseOrder.count({ where }),
      this.prisma.purchaseOrder.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          numero: true,
          estado: true,
          total: true,
          fechaEmision: true,
          createdAt: true,
          supplier: { select: { id: true, razonSocial: true } },
          warehouse: { select: { id: true, nombre: true } },
        },
      }),
    ]);
    return buildPaginatedResult(
      rows.map((r) => ({
        ...r,
        total: r.total.toString(),
        fechaEmision: r.fechaEmision.toISOString(),
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    );
  }

  async getPurchaseOrder(id: string, establishmentId: string) {
    const row = await this.prisma.purchaseOrder.findFirst({
      where: { id, establishmentId, deletedAt: null },
      include: {
        supplier: { select: { id: true, razonSocial: true, numeroDocumento: true, diasCredito: true } },
        warehouse: { select: { id: true, nombre: true } },
        createdBy: { select: { id: true, nombre: true } },
        approvedBy: { select: { id: true, nombre: true } },
        items: {
          include: {
            product: { select: { id: true, nombre: true, codigoInterno: true, manejaLotes: true } },
          },
        },
        goodsReceipts: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            numero: true,
            fechaRecepcion: true,
            referenciaDoc: true,
          },
        },
      },
    });
    if (!row) throw new NotFoundException('Orden de compra no encontrada');
    return this.mapPurchaseOrder(row);
  }

  async createPurchaseOrder(
    establishmentId: string,
    createdById: string,
    dto: CreatePurchaseOrderDto,
  ) {
    await this.validateSupplier(dto.supplierId);
    await this.validateWarehouse(dto.warehouseId, establishmentId);

    const { subtotal, igvTotal, total, itemRows } = await this.buildOrderItems(
      dto.supplierId,
      dto.items,
    );
    const numero = await this.nextPurchaseOrderNumber(establishmentId);

    const created = await this.prisma.purchaseOrder.create({
      data: {
        establishmentId,
        supplierId: dto.supplierId,
        warehouseId: dto.warehouseId,
        createdById,
        numero,
        subtotal,
        igvTotal,
        total,
        comentario: dto.comentario?.trim() || null,
        condicionesPago: dto.condicionesPago?.trim() || null,
        fechaEntregaEstimada: dto.fechaEntregaEstimada
          ? new Date(dto.fechaEntregaEstimada)
          : null,
        items: { create: itemRows },
      },
      select: { id: true },
    });

    await this.audit.log({
      userId: createdById,
      action: 'CREATE',
      entity: 'PurchaseOrder',
      entityId: created.id,
    });

    return this.getPurchaseOrder(created.id, establishmentId);
  }

  async approvePurchaseOrder(id: string, establishmentId: string, actorId: string) {
    const po = await this.ensurePurchaseOrder(id, establishmentId);
    if (po.estado !== PurchaseOrderStatus.BORRADOR) {
      throw new BadRequestException('Solo se pueden aprobar órdenes en borrador');
    }
    await this.prisma.purchaseOrder.update({
      where: { id },
      data: { estado: PurchaseOrderStatus.APROBADA, approvedById: actorId },
    });
    await this.audit.log({ userId: actorId, action: 'APPROVE', entity: 'PurchaseOrder', entityId: id });
    return this.getPurchaseOrder(id, establishmentId);
  }

  async sendPurchaseOrder(id: string, establishmentId: string, actorId: string) {
    const po = await this.ensurePurchaseOrder(id, establishmentId);
    if (po.estado !== PurchaseOrderStatus.APROBADA) {
      throw new BadRequestException('Solo se pueden enviar órdenes aprobadas');
    }
    await this.prisma.purchaseOrder.update({
      where: { id },
      data: { estado: PurchaseOrderStatus.ENVIADA },
    });
    await this.audit.log({ userId: actorId, action: 'SEND', entity: 'PurchaseOrder', entityId: id });
    return this.getPurchaseOrder(id, establishmentId);
  }

  async cancelPurchaseOrder(id: string, establishmentId: string, actorId: string) {
    const po = await this.ensurePurchaseOrder(id, establishmentId);
    if (
      po.estado !== PurchaseOrderStatus.BORRADOR &&
      po.estado !== PurchaseOrderStatus.APROBADA
    ) {
      throw new BadRequestException('No se puede anular esta orden en su estado actual');
    }
    await this.prisma.purchaseOrder.update({
      where: { id },
      data: { estado: PurchaseOrderStatus.ANULADA },
    });
    await this.audit.log({ userId: actorId, action: 'CANCEL', entity: 'PurchaseOrder', entityId: id });
    return this.getPurchaseOrder(id, establishmentId);
  }

  // —— Recepción de mercadería ——

  async createGoodsReceipt(
    purchaseOrderId: string,
    establishmentId: string,
    receivedById: string,
    dto: CreateGoodsReceiptDto,
  ) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id: purchaseOrderId, establishmentId, deletedAt: null },
      include: {
        supplier: { select: { id: true, diasCredito: true } },
        items: true,
      },
    });
    if (!po) throw new NotFoundException('Orden de compra no encontrada');
    if (
      po.estado !== PurchaseOrderStatus.ENVIADA &&
      po.estado !== PurchaseOrderStatus.PARCIALMENTE_RECIBIDA
    ) {
      throw new BadRequestException('La orden debe estar enviada o parcialmente recibida');
    }

    const transferReason = await this.prisma.inventoryTransferReason.findFirst({
      where: { codigo: 'COMPRA_NACIONAL', deletedAt: null, activo: true },
      select: { id: true },
    });
    if (!transferReason) {
      throw new BadRequestException('Motivo COMPRA_NACIONAL no configurado');
    }

    const itemMap = new Map(po.items.map((i) => [i.id, i]));
    let receiptTotal = new Prisma.Decimal(0);
    const receiptLines: Array<{
      purchaseOrderItemId: string;
      productId: string;
      cantidad: Prisma.Decimal;
      codigoLote: string | null;
      fechaVencimiento: Date | null;
      costoUnitario: Prisma.Decimal;
      poItem: (typeof po.items)[0];
    }> = [];

    for (const line of dto.items) {
      const poItem = itemMap.get(line.purchaseOrderItemId);
      if (!poItem) throw new BadRequestException(`Ítem ${line.purchaseOrderItemId} no pertenece a la OC`);
      const qty = new Prisma.Decimal(line.quantity);
      const pending = poItem.cantidadPedida.minus(poItem.cantidadRecibida);
      if (qty.greaterThan(pending)) {
        throw new BadRequestException(
          `Cantidad excede lo pendiente para ${poItem.productId}: pendiente ${pending.toString()}`,
        );
      }
      const cost = line.unitCost != null
        ? new Prisma.Decimal(line.unitCost)
        : poItem.precioUnitario;
      receiptTotal = receiptTotal.plus(cost.times(qty));
      receiptLines.push({
        purchaseOrderItemId: poItem.id,
        productId: poItem.productId,
        cantidad: qty,
        codigoLote: line.lotCode?.trim() || null,
        fechaVencimiento: line.expirationDate ? new Date(line.expirationDate) : null,
        costoUnitario: cost,
        poItem,
      });
    }

    const grNumero = await this.nextGoodsReceiptNumber(establishmentId);

    const result = await this.prisma.$transaction(async (tx) => {
      const gr = await tx.goodsReceipt.create({
        data: {
          purchaseOrderId: po.id,
          establishmentId,
          warehouseId: po.warehouseId,
          receivedById,
          numero: grNumero,
          referenciaDoc: dto.referenciaDoc?.trim() || null,
          comentario: dto.comentario?.trim() || null,
          items: {
            create: receiptLines.map((l) => ({
              purchaseOrderItemId: l.purchaseOrderItemId,
              productId: l.productId,
              cantidad: l.cantidad,
              codigoLote: l.codigoLote,
              fechaVencimiento: l.fechaVencimiento,
              costoUnitario: l.costoUnitario,
            })),
          },
        },
        select: { id: true },
      });

      for (const line of receiptLines) {
        await tx.purchaseOrderItem.update({
          where: { id: line.purchaseOrderItemId },
          data: { cantidadRecibida: line.poItem.cantidadRecibida.plus(line.cantidad) },
        });

        await tx.inventoryInboundMovement.create({
          data: {
            productId: line.productId,
            warehouseId: po.warehouseId,
            transferReasonId: transferReason.id,
            movementType: InventoryMovementType.INGRESO,
            cantidad: line.cantidad,
            costoUnitario: line.costoUnitario,
            codigoLote: line.codigoLote,
            fechaVencimiento: line.fechaVencimiento,
            referencia: `${po.numero ?? po.id} / ${grNumero}`,
            comentario: dto.comentario?.trim() || null,
            userId: receivedById,
          },
        });

        if (line.codigoLote) {
          const existingLot = await tx.productLotStock.findFirst({
            where: {
              productId: line.productId,
              warehouseId: po.warehouseId,
              codigoLote: line.codigoLote,
              deletedAt: null,
            },
            select: { id: true, stock: true },
          });
          if (existingLot) {
            await tx.productLotStock.update({
              where: { id: existingLot.id },
              data: {
                stock: existingLot.stock.plus(line.cantidad),
                fechaVencimiento: line.fechaVencimiento ?? undefined,
                costoUnitario: line.costoUnitario,
              },
            });
          } else {
            await tx.productLotStock.create({
              data: {
                productId: line.productId,
                warehouseId: po.warehouseId,
                codigoLote: line.codigoLote,
                stock: line.cantidad,
                costoUnitario: line.costoUnitario,
                fechaVencimiento: line.fechaVencimiento,
              },
            });
          }
        }

        const current = await tx.productWarehouseStock.findUnique({
          where: {
            productId_warehouseId: {
              productId: line.productId,
              warehouseId: po.warehouseId,
            },
          },
          select: { cantidad: true },
        });
        await tx.productWarehouseStock.upsert({
          where: {
            productId_warehouseId: {
              productId: line.productId,
              warehouseId: po.warehouseId,
            },
          },
          update: { cantidad: (current?.cantidad ?? new Prisma.Decimal(0)).plus(line.cantidad) },
          create: {
            productId: line.productId,
            warehouseId: po.warehouseId,
            cantidad: line.cantidad,
          },
        });

        await tx.product.update({
          where: { id: line.productId },
          data: { precioUnitarioCompra: line.costoUnitario },
        });
      }

      const updatedItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: po.id },
      });
      const allReceived = updatedItems.every((i) =>
        i.cantidadRecibida.greaterThanOrEqualTo(i.cantidadPedida),
      );
      const anyReceived = updatedItems.some((i) => i.cantidadRecibida.greaterThan(0));
      const newStatus = allReceived
        ? PurchaseOrderStatus.RECIBIDA
        : anyReceived
          ? PurchaseOrderStatus.PARCIALMENTE_RECIBIDA
          : po.estado;

      await tx.purchaseOrder.update({
        where: { id: po.id },
        data: { estado: newStatus },
      });

      const diasCredito = po.supplier.diasCredito ?? 0;
      const vencimiento = new Date();
      vencimiento.setDate(vencimiento.getDate() + diasCredito);

      const ap = await tx.accountPayable.create({
        data: {
          establishmentId,
          supplierId: po.supplierId,
          purchaseOrderId: po.id,
          goodsReceiptId: gr.id,
          numeroDocumento: dto.referenciaDoc?.trim() || grNumero,
          montoTotal: receiptTotal,
          montoPagado: new Prisma.Decimal(0),
          saldo: receiptTotal,
          fechaVencimiento: vencimiento,
          estado: AccountPayableStatus.PENDIENTE,
          comentario: `Recepción ${grNumero}`,
        },
      });

      return { goodsReceiptId: gr.id, accountPayableId: ap.id };
    });

    await this.audit.log({
      userId: receivedById,
      action: 'RECEIVE',
      entity: 'GoodsReceipt',
      entityId: result.goodsReceiptId,
    });

    return this.getPurchaseOrder(purchaseOrderId, establishmentId);
  }

  // —— Cuentas por pagar ——

  async listAccountsPayable(establishmentId: string, query: AccountPayableListQueryDto) {
    const { page, pageSize, skip, take } = paginationArgs(query);
    const now = new Date();
    await this.prisma.accountPayable.updateMany({
      where: {
        establishmentId,
        deletedAt: null,
        estado: { in: [AccountPayableStatus.PENDIENTE, AccountPayableStatus.PARCIAL] },
        fechaVencimiento: { lt: now },
      },
      data: { estado: AccountPayableStatus.VENCIDA },
    });

    const where: Prisma.AccountPayableWhereInput = {
      establishmentId,
      deletedAt: null,
      ...(query.supplierId ? { supplierId: query.supplierId } : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.accountPayable.count({ where }),
      this.prisma.accountPayable.findMany({
        where,
        skip,
        take,
        orderBy: { fechaVencimiento: 'asc' },
        select: {
          id: true,
          numeroDocumento: true,
          montoTotal: true,
          montoPagado: true,
          saldo: true,
          fechaEmision: true,
          fechaVencimiento: true,
          estado: true,
          supplier: { select: { id: true, razonSocial: true } },
        },
      }),
    ]);
    return buildPaginatedResult(
      rows.map((r) => ({
        ...r,
        montoTotal: r.montoTotal.toString(),
        montoPagado: r.montoPagado.toString(),
        saldo: r.saldo.toString(),
        fechaEmision: r.fechaEmision.toISOString(),
        fechaVencimiento: r.fechaVencimiento.toISOString(),
      })),
      total,
      page,
      pageSize,
    );
  }

  async registerPayment(
    id: string,
    establishmentId: string,
    dto: RegisterAccountPayablePaymentDto,
    actorId: string,
  ) {
    const ap = await this.prisma.accountPayable.findFirst({
      where: { id, establishmentId, deletedAt: null },
    });
    if (!ap) throw new NotFoundException('Cuenta por pagar no encontrada');
    if (ap.estado === AccountPayableStatus.PAGADA || ap.estado === AccountPayableStatus.ANULADA) {
      throw new BadRequestException('Esta cuenta ya está cerrada');
    }

    const monto = new Prisma.Decimal(dto.amount);
    if (monto.greaterThan(ap.saldo)) {
      throw new BadRequestException('El pago excede el saldo pendiente');
    }

    const newPagado = ap.montoPagado.plus(monto);
    const newSaldo = ap.saldo.minus(monto);
    const newEstado = newSaldo.isZero()
      ? AccountPayableStatus.PAGADA
      : AccountPayableStatus.PARCIAL;

    await this.prisma.$transaction([
      this.prisma.accountPayablePayment.create({
        data: {
          accountPayableId: id,
          monto,
          metodo: dto.metodo?.trim() || null,
          referencia: dto.referencia?.trim() || null,
        },
      }),
      this.prisma.accountPayable.update({
        where: { id },
        data: { montoPagado: newPagado, saldo: newSaldo, estado: newEstado },
      }),
    ]);

    await this.audit.log({ userId: actorId, action: 'PAY', entity: 'AccountPayable', entityId: id });
    return { ok: true, saldo: newSaldo.toString(), estado: newEstado };
  }

  // —— Notas de crédito proveedor ——

  async createSupplierCreditNote(
    establishmentId: string,
    dto: CreateSupplierCreditNoteDto,
    actorId: string,
  ) {
    await this.validateSupplier(dto.supplierId);
    const monto = new Prisma.Decimal(dto.monto);

    const created = await this.prisma.$transaction(async (tx) => {
      const nc = await tx.supplierCreditNote.create({
        data: {
          establishmentId,
          supplierId: dto.supplierId,
          accountPayableId: dto.accountPayableId ?? null,
          purchaseOrderId: dto.purchaseOrderId ?? null,
          numero: dto.numero?.trim() || null,
          monto,
          motivo: dto.motivo.trim(),
          estado: SupplierCreditNoteStatus.APLICADA,
        },
        select: { id: true },
      });

      if (dto.accountPayableId) {
        const ap = await tx.accountPayable.findFirst({
          where: { id: dto.accountPayableId, establishmentId, deletedAt: null },
        });
        if (!ap) throw new NotFoundException('Cuenta por pagar no encontrada');
        const newSaldo = Prisma.Decimal.max(ap.saldo.minus(monto), new Prisma.Decimal(0));
        const newPagado = ap.montoPagado.plus(Prisma.Decimal.min(monto, ap.saldo));
        await tx.accountPayable.update({
          where: { id: ap.id },
          data: {
            saldo: newSaldo,
            montoPagado: newPagado,
            estado: newSaldo.isZero() ? AccountPayableStatus.PAGADA : AccountPayableStatus.PARCIAL,
          },
        });
      }

      return nc;
    });

    await this.audit.log({
      userId: actorId,
      action: 'CREATE',
      entity: 'SupplierCreditNote',
      entityId: created.id,
    });

    return { ok: true, id: created.id };
  }

  async listSupplierCreditNotes(establishmentId: string) {
    const rows = await this.prisma.supplierCreditNote.findMany({
      where: { establishmentId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        numero: true,
        monto: true,
        motivo: true,
        estado: true,
        fechaEmision: true,
        supplier: { select: { razonSocial: true } },
      },
    });
    return rows.map((r) => ({
      ...r,
      monto: r.monto.toString(),
      fechaEmision: r.fechaEmision.toISOString(),
    }));
  }

  // —— Reportes ——

  async replenishmentSuggestions(establishmentId: string, query: ReplenishmentReportQueryDto) {
    const since = new Date();
    since.setDate(since.getDate() - 90);

    const warehouses = await this.prisma.warehouse.findMany({
      where: {
        establishmentId,
        deletedAt: null,
        ...(query.warehouseId ? { id: query.warehouseId } : {}),
      },
      select: { id: true, nombre: true },
    });

    const suggestions: Array<{
      productId: string;
      producto: string;
      codigoInterno: string | null;
      warehouseId: string;
      warehouse: string;
      stockActual: string;
      stockMinimo: number;
      cantidadSugerida: number;
      rotacion90d: string;
      claseAbc: 'A' | 'B' | 'C';
      proveedorSugerido: string | null;
      precioSugerido: string | null;
    }> = [];

    for (const wh of warehouses) {
      const stocks = await this.prisma.productWarehouseStock.findMany({
        where: {
          warehouseId: wh.id,
          product: { deletedAt: null, habilitado: true },
        },
        include: {
          product: {
            select: {
              id: true,
              nombre: true,
              codigoInterno: true,
              stockMinimo: true,
              supplierLinks: {
                orderBy: { precioCompra: 'asc' },
                take: 1,
                include: { supplier: { select: { razonSocial: true } } },
              },
            },
          },
        },
      });

      const lowStock = stocks.filter(
        (s) => s.cantidad.lessThan(new Prisma.Decimal(s.product.stockMinimo)),
      );
      if (lowStock.length === 0) continue;

      const productIds = lowStock.map((s) => s.productId);
      const salesAgg = await this.prisma.saleItem.groupBy({
        by: ['productId'],
        where: {
          productId: { in: productIds },
          sale: {
            establishmentId,
            deletedAt: null,
            estado: 'COMPLETADA',
            createdAt: { gte: since },
          },
        },
        _sum: { cantidad: true, totalLinea: true },
      });
      const salesMap = new Map(
        salesAgg.map((s) => [
          s.productId,
          {
            qty: s._sum.cantidad ?? new Prisma.Decimal(0),
            revenue: s._sum.totalLinea ?? new Prisma.Decimal(0),
          },
        ]),
      );

      const ranked = lowStock
        .map((s) => ({
          stock: s,
          revenue: salesMap.get(s.productId)?.revenue ?? new Prisma.Decimal(0),
        }))
        .sort((a, b) => (b.revenue.gt(a.revenue) ? 1 : b.revenue.lt(a.revenue) ? -1 : 0));

      const totalRevenue = ranked.reduce(
        (acc, r) => acc.plus(r.revenue),
        new Prisma.Decimal(0),
      );
      let cumulative = new Prisma.Decimal(0);

      for (const { stock, revenue } of ranked) {
        cumulative = cumulative.plus(revenue);
        const pct = totalRevenue.isZero()
          ? 0
          : cumulative.div(totalRevenue).times(100).toNumber();
        const claseAbc: 'A' | 'B' | 'C' = pct <= 80 ? 'A' : pct <= 95 ? 'B' : 'C';
        const factor = claseAbc === 'A' ? 2 : claseAbc === 'B' ? 1.5 : 1;
        const deficit = Math.max(
          stock.product.stockMinimo * factor - stock.cantidad.toNumber(),
          stock.product.stockMinimo - stock.cantidad.toNumber(),
        );
        const link = stock.product.supplierLinks[0];
        suggestions.push({
          productId: stock.productId,
          producto: stock.product.nombre,
          codigoInterno: stock.product.codigoInterno,
          warehouseId: wh.id,
          warehouse: wh.nombre,
          stockActual: stock.cantidad.toString(),
          stockMinimo: stock.product.stockMinimo,
          cantidadSugerida: Math.ceil(Math.max(deficit, 1)),
          rotacion90d: (salesMap.get(stock.productId)?.qty ?? new Prisma.Decimal(0)).toString(),
          claseAbc,
          proveedorSugerido: link?.supplier.razonSocial ?? null,
          precioSugerido: link?.precioCompra?.toString() ?? null,
        });
      }
    }

    return { items: suggestions, generatedAt: new Date().toISOString() };
  }

  async priceComparison(establishmentId: string, query: PriceComparisonQueryDto) {
    void establishmentId;
    const links = await this.prisma.supplierProduct.findMany({
      where: {
        precioCompra: { not: null },
        product: { deletedAt: null, habilitado: true },
        ...(query.productId ? { productId: query.productId } : {}),
      },
      include: {
        product: { select: { id: true, nombre: true, codigoInterno: true } },
        supplier: { select: { id: true, razonSocial: true, numeroDocumento: true } },
      },
      orderBy: [{ productId: 'asc' }, { precioCompra: 'asc' }],
    });

    const byProduct = new Map<
      string,
      {
        productId: string;
        producto: string;
        codigoInterno: string | null;
        proveedores: Array<{
          supplierId: string;
          razonSocial: string;
          numeroDocumento: string;
          precioCompra: string;
          plazoDias: number;
          codigoProveedor: string | null;
        }>;
        mejorPrecio: string | null;
      }
    >();

    for (const link of links) {
      if (!link.precioCompra) continue;
      let row = byProduct.get(link.productId);
      if (!row) {
        row = {
          productId: link.productId,
          producto: link.product.nombre,
          codigoInterno: link.product.codigoInterno,
          proveedores: [],
          mejorPrecio: null,
        };
        byProduct.set(link.productId, row);
      }
      row.proveedores.push({
        supplierId: link.supplierId,
        razonSocial: link.supplier.razonSocial,
        numeroDocumento: link.supplier.numeroDocumento,
        precioCompra: link.precioCompra.toString(),
        plazoDias: link.plazoDias,
        codigoProveedor: link.codigoProveedor,
      });
      row.mejorPrecio = row.proveedores[0]?.precioCompra ?? null;
    }

    return { items: [...byProduct.values()] };
  }

  async supplierPurchaseHistory(supplierId: string) {
    await this.validateSupplier(supplierId);
    const rows = await this.prisma.purchaseOrder.findMany({
      where: { supplierId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        numero: true,
        estado: true,
        total: true,
        fechaEmision: true,
        warehouse: { select: { nombre: true } },
      },
    });
    return {
      items: rows.map((r) => ({
        id: r.id,
        numero: r.numero,
        estado: r.estado,
        total: r.total.toString(),
        fechaEmision: r.fechaEmision.toISOString(),
        warehouse: r.warehouse.nombre,
      })),
      total: rows.length,
    };
  }

  // —— Helpers ——

  private async ensurePurchaseOrder(id: string, establishmentId: string) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, establishmentId, deletedAt: null },
      select: { id: true, estado: true },
    });
    if (!po) throw new NotFoundException('Orden de compra no encontrada');
    return po;
  }

  private async validateSupplier(supplierId: string) {
    const s = await this.prisma.supplier.findFirst({
      where: { id: supplierId, deletedAt: null, habilitado: true },
      select: { id: true },
    });
    if (!s) throw new NotFoundException('Proveedor no válido');
  }

  private async validateWarehouse(warehouseId: string, establishmentId: string) {
    const w = await this.prisma.warehouse.findFirst({
      where: { id: warehouseId, establishmentId, deletedAt: null },
      select: { id: true },
    });
    if (!w) throw new NotFoundException('Almacén no válido');
  }

  private async buildOrderItems(
    supplierId: string,
    items: CreatePurchaseOrderDto['items'],
  ) {
    let subtotal = new Prisma.Decimal(0);
    let igvTotal = new Prisma.Decimal(0);
    let total = new Prisma.Decimal(0);
    const itemRows: Prisma.PurchaseOrderItemCreateWithoutPurchaseOrderInput[] = [];

    for (const line of items) {
      const product = await this.prisma.product.findFirst({
        where: { id: line.productId, deletedAt: null },
        select: {
          precioUnitarioCompra: true,
          incluyeIgvCompra: true,
          purchaseTaxAffectation: { select: { codigo: true } },
          saleTaxAffectation: { select: { codigo: true } },
        },
      });
      if (!product) throw new NotFoundException(`Producto ${line.productId} no encontrado`);

      const supplierLink = await this.prisma.supplierProduct.findUnique({
        where: { supplierId_productId: { supplierId, productId: line.productId } },
        select: { precioCompra: true, codigoProveedor: true },
      });

      const unitPrice =
        line.unitPrice != null
          ? new Prisma.Decimal(line.unitPrice)
          : supplierLink?.precioCompra ??
            product.precioUnitarioCompra ??
            new Prisma.Decimal(0);

      const taxCodigo =
        product.purchaseTaxAffectation?.codigo ??
        product.saleTaxAffectation.codigo;

      const qty = new Prisma.Decimal(line.quantity);
      const totals = computeSaleLineTotals({
        unitPrice,
        quantity: qty,
        incluyeIgv: product.incluyeIgvCompra,
        taxCodigo,
      });

      subtotal = subtotal.plus(totals.subtotalLinea);
      igvTotal = igvTotal.plus(totals.igvLinea);
      total = total.plus(totals.totalLinea);

      itemRows.push({
        product: { connect: { id: line.productId } },
        cantidadPedida: qty,
        precioUnitario: unitPrice,
        subtotalLinea: totals.subtotalLinea,
        igvLinea: totals.igvLinea,
        totalLinea: totals.totalLinea,
        codigoProveedor: supplierLink?.codigoProveedor ?? null,
      });
    }

    return { subtotal, igvTotal, total, itemRows };
  }

  private async nextPurchaseOrderNumber(establishmentId: string) {
    const year = new Date().getFullYear();
    const count = await this.prisma.purchaseOrder.count({
      where: { establishmentId, createdAt: { gte: new Date(`${year}-01-01`) } },
    });
    return `OC-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  private async nextGoodsReceiptNumber(establishmentId: string) {
    const year = new Date().getFullYear();
    const count = await this.prisma.goodsReceipt.count({
      where: { establishmentId, createdAt: { gte: new Date(`${year}-01-01`) } },
    });
    return `GR-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  private mapPurchaseOrder(row: {
    id: string;
    numero: string | null;
    estado: PurchaseOrderStatus;
    subtotal: Prisma.Decimal;
    igvTotal: Prisma.Decimal;
    total: Prisma.Decimal;
    moneda: string;
    comentario: string | null;
    condicionesPago: string | null;
    fechaEmision: Date;
    fechaEntregaEstimada: Date | null;
    createdAt: Date;
    supplier: { id: string; razonSocial: string; numeroDocumento: string; diasCredito: number };
    warehouse: { id: string; nombre: string };
    createdBy: { id: string; nombre: string };
    approvedBy: { id: string; nombre: string } | null;
    items: Array<{
      id: string;
      productId: string;
      cantidadPedida: Prisma.Decimal;
      cantidadRecibida: Prisma.Decimal;
      precioUnitario: Prisma.Decimal;
      subtotalLinea: Prisma.Decimal;
      igvLinea: Prisma.Decimal;
      totalLinea: Prisma.Decimal;
      codigoProveedor: string | null;
      product: { id: string; nombre: string; codigoInterno: string | null; manejaLotes: boolean };
    }>;
    goodsReceipts: Array<{
      id: string;
      numero: string | null;
      fechaRecepcion: Date;
      referenciaDoc: string | null;
    }>;
  }) {
    return {
      id: row.id,
      numero: row.numero,
      estado: row.estado,
      subtotal: row.subtotal.toString(),
      igvTotal: row.igvTotal.toString(),
      total: row.total.toString(),
      moneda: row.moneda,
      comentario: row.comentario,
      condicionesPago: row.condicionesPago,
      fechaEmision: row.fechaEmision.toISOString(),
      fechaEntregaEstimada: row.fechaEntregaEstimada?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      supplier: row.supplier,
      warehouse: row.warehouse,
      createdBy: row.createdBy,
      approvedBy: row.approvedBy,
      items: row.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        producto: i.product.nombre,
        codigoInterno: i.product.codigoInterno,
        manejaLotes: i.product.manejaLotes,
        cantidadPedida: i.cantidadPedida.toString(),
        cantidadRecibida: i.cantidadRecibida.toString(),
        cantidadPendiente: i.cantidadPedida.minus(i.cantidadRecibida).toString(),
        precioUnitario: i.precioUnitario.toString(),
        subtotalLinea: i.subtotalLinea.toString(),
        igvLinea: i.igvLinea.toString(),
        totalLinea: i.totalLinea.toString(),
        codigoProveedor: i.codigoProveedor,
      })),
      goodsReceipts: row.goodsReceipts.map((g) => ({
        id: g.id,
        numero: g.numero,
        fechaRecepcion: g.fechaRecepcion.toISOString(),
        referenciaDoc: g.referenciaDoc,
      })),
    };
  }
}
