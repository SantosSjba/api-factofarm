import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DeliveryChannel,
  DeliveryOrderStatus,
  Prisma,
  SaleDocumentType,
} from '../../generated/prisma/client';
import { buildPaginatedResult, paginationArgs } from '../../common/dto/pagination.dto';
import { computeSaleLineTotals } from '../../common/utils/sale-pricing.util';
import {
  formatDateYmdInTimeZone,
  normalizeTimeZone,
} from '../../common/utils/timezone.util';
import { EstablishmentScopeService } from '../../common/scoping/establishment-scope.service';
import { AuditLogService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { SalesService } from '../sales/sales.service';
import { DeliveryNotificationService } from './delivery-notification.service';
import {
  AssignDeliveryOrderDto,
  CreateDeliveryOrderDto,
  DeliveryOrderListQueryDto,
  PublicCreateDeliveryOrderDto,
  UpdateDeliveryOrderStatusDto,
} from './dto/delivery-order.dto';
import type { CreatePaymentDto } from '../sales/dto/create-sale.dto';

const STATUS_FLOW: Record<DeliveryOrderStatus, DeliveryOrderStatus[]> = {
  RECIBIDO: [DeliveryOrderStatus.PREPARANDO, DeliveryOrderStatus.CANCELADO],
  PREPARANDO: [DeliveryOrderStatus.EN_CAMINO, DeliveryOrderStatus.CANCELADO],
  EN_CAMINO: [DeliveryOrderStatus.ENTREGADO, DeliveryOrderStatus.CANCELADO],
  ENTREGADO: [],
  CANCELADO: [],
};

@Injectable()
export class DeliveryOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
    private readonly notifications: DeliveryNotificationService,
    private readonly sales: SalesService,
    private readonly scope: EstablishmentScopeService,
  ) {}

  async findAll(establishmentId: string, query: DeliveryOrderListQueryDto) {
    const { page, pageSize, skip, take } = paginationArgs(query);
    const search = query.search?.trim();
    const where: Prisma.DeliveryOrderWhereInput = {
      establishmentId,
      deletedAt: null,
      ...(query.estado ? { estado: query.estado } : {}),
      ...(search
        ? {
            OR: [
              { numero: { contains: search, mode: 'insensitive' } },
              { clienteNombre: { contains: search, mode: 'insensitive' } },
              { clienteTelefono: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.deliveryOrder.count({ where }),
      this.prisma.deliveryOrder.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          numero: true,
          estado: true,
          canal: true,
          clienteNombre: true,
          clienteTelefono: true,
          total: true,
          createdAt: true,
          assignedTo: { select: { id: true, nombre: true } },
        },
      }),
    ]);

    return buildPaginatedResult(
      rows.map((r) => ({ ...r, total: r.total.toString() })),
      total,
      page,
      pageSize,
    );
  }

  async findOne(id: string, establishmentId: string) {
    const row = await this.prisma.deliveryOrder.findFirst({
      where: { id, establishmentId, deletedAt: null },
      include: {
        customer: { select: { id: true, nombre: true, numeroDocumento: true } },
        warehouse: { select: { id: true, nombre: true } },
        createdBy: { select: { id: true, nombre: true } },
        assignedTo: { select: { id: true, nombre: true } },
        sale: { select: { id: true, serie: true, numero: true, total: true } },
        items: {
          include: {
            product: { select: { id: true, nombre: true, codigoInterno: true } },
          },
        },
        notifications: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!row) throw new NotFoundException('Pedido delivery no encontrado');
    return this.mapDetail(row);
  }

  async create(
    establishmentId: string,
    createdById: string,
    dto: CreateDeliveryOrderDto,
    canalOverride?: DeliveryChannel,
    actor?: JwtRequestUser,
  ) {
    if (actor) {
      await this.scope.assertWarehouseInTenant(actor, dto.warehouseId);
    }
    await this.validateWarehouse(dto.warehouseId, establishmentId);

    if (dto.customerId) {
      if (actor) {
        await this.scope.assertCustomerInTenant(actor, dto.customerId);
      } else {
        const establishment = await this.prisma.establishment.findFirst({
          where: { id: establishmentId, deletedAt: null },
          select: { tenantId: true },
        });
        const customer = await this.prisma.customer.findFirst({
          where: {
            id: dto.customerId,
            deletedAt: null,
            ...(establishment?.tenantId ? { tenantId: establishment.tenantId } : {}),
          },
          select: { id: true },
        });
        if (!customer) throw new NotFoundException('Cliente no encontrado');
      }
    }

    const { subtotal, igvTotal, total, itemRows } = await this.buildItems(
      dto.items,
      actor,
      establishmentId,
    );
    const costoDelivery = new Prisma.Decimal(dto.costoDelivery ?? 0);
    const numero = await this.nextNumber(establishmentId);

    const created = await this.prisma.deliveryOrder.create({
      data: {
        establishmentId,
        warehouseId: dto.warehouseId,
        customerId: dto.customerId ?? null,
        createdById,
        numero,
        canal: canalOverride ?? dto.canal ?? DeliveryChannel.TELEFONO,
        clienteNombre: dto.clienteNombre.trim(),
        clienteTelefono: dto.clienteTelefono.trim(),
        clienteEmail: dto.clienteEmail?.trim() || null,
        direccionEntrega: dto.direccionEntrega.trim(),
        referenciaDireccion: dto.referenciaDireccion?.trim() || null,
        distritoEntrega: dto.distritoEntrega?.trim() || null,
        costoDelivery,
        subtotal,
        igvTotal,
        total: total.plus(costoDelivery),
        notasCliente: dto.notasCliente?.trim() || null,
        notasInternas: dto.notasInternas?.trim() || null,
        programadoPara: dto.programadoPara ? new Date(dto.programadoPara) : null,
        items: { create: itemRows },
      },
      select: { id: true },
    });

    await this.audit.log({
      userId: createdById,
      action: 'CREATE',
      entity: 'DeliveryOrder',
      entityId: created.id,
    });

    await this.notifications.notifyStatusChange(created.id, DeliveryOrderStatus.RECIBIDO);

    return this.findOne(created.id, establishmentId);
  }

  async createFromPublicPortal(slug: string, dto: PublicCreateDeliveryOrderDto) {
    const establishment = await this.prisma.establishment.findFirst({
      where: {
        deliveryPublicSlug: slug.trim(),
        deliveryPortalEnabled: true,
        deletedAt: null,
        activo: true,
      },
      select: { id: true },
    });
    if (!establishment) throw new NotFoundException('Portal de pedidos no disponible');

    const warehouse = await this.prisma.warehouse.findFirst({
      where: { establishmentId: establishment.id, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (!warehouse) throw new BadRequestException('Sin almacén configurado');

    const admin = await this.prisma.user.findFirst({
      where: { establecimientoId: establishment.id, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (!admin) throw new BadRequestException('Sin usuario operativo');

    return this.create(
      establishment.id,
      admin.id,
      {
        warehouseId: warehouse.id,
        clienteNombre: dto.clienteNombre,
        clienteTelefono: dto.clienteTelefono,
        clienteEmail: dto.clienteEmail,
        direccionEntrega: dto.direccionEntrega,
        referenciaDireccion: dto.referenciaDireccion,
        distritoEntrega: dto.distritoEntrega,
        notasCliente: dto.notasCliente,
        items: dto.items,
      },
      DeliveryChannel.WEB,
    );
  }

  async getPublicPortalInfo(slug: string) {
    const row = await this.prisma.establishment.findFirst({
      where: {
        deliveryPublicSlug: slug.trim(),
        deliveryPortalEnabled: true,
        deletedAt: null,
        activo: true,
      },
      select: {
        id: true,
        nombre: true,
        direccionComercial: true,
        telefono: true,
        deliveryWhatsappNumero: true,
      },
    });
    if (!row) throw new NotFoundException('Portal no encontrado');
    return row;
  }

  async updateStatus(
    id: string,
    establishmentId: string,
    dto: UpdateDeliveryOrderStatusDto,
    actorId: string,
  ) {
    const order = await this.prisma.deliveryOrder.findFirst({
      where: { id, establishmentId, deletedAt: null },
      select: { id: true, estado: true },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');

    const allowed = STATUS_FLOW[order.estado];
    if (!allowed.includes(dto.estado)) {
      throw new BadRequestException(`No se puede cambiar de ${order.estado} a ${dto.estado}`);
    }
    if (dto.estado === DeliveryOrderStatus.CANCELADO && !dto.cancelReason?.trim()) {
      throw new BadRequestException('Indique el motivo de cancelación');
    }

    await this.prisma.deliveryOrder.update({
      where: { id },
      data: {
        estado: dto.estado,
        cancelReason:
          dto.estado === DeliveryOrderStatus.CANCELADO ? dto.cancelReason?.trim() : null,
        entregadoAt: dto.estado === DeliveryOrderStatus.ENTREGADO ? new Date() : undefined,
      },
    });

    await this.audit.log({
      userId: actorId,
      action: 'UPDATE_STATUS',
      entity: 'DeliveryOrder',
      entityId: id,
    });

    const notify = await this.notifications.notifyStatusChange(id, dto.estado);
    const detail = await this.findOne(id, establishmentId);
    return { ...detail, whatsappLink: notify?.whatsappLink ?? null };
  }

  async assign(
    id: string,
    establishmentId: string,
    dto: AssignDeliveryOrderDto,
    actorId: string,
  ) {
    const order = await this.prisma.deliveryOrder.findFirst({
      where: { id, establishmentId, deletedAt: null },
      select: { id: true },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');

    if (dto.assignedToId) {
      const user = await this.prisma.user.findFirst({
        where: { id: dto.assignedToId, establecimientoId: establishmentId, deletedAt: null },
        select: { id: true },
      });
      if (!user) throw new NotFoundException('Usuario no encontrado en el establecimiento');
    }

    await this.prisma.deliveryOrder.update({
      where: { id },
      data: { assignedToId: dto.assignedToId ?? null },
    });

    await this.audit.log({
      userId: actorId,
      action: 'ASSIGN',
      entity: 'DeliveryOrder',
      entityId: id,
    });

    return this.findOne(id, establishmentId);
  }

  async completeAsSale(
    id: string,
    establishmentId: string,
    actor: { sub: string; establecimientoId: string },
    payments: CreatePaymentDto[],
    cashSessionId?: string,
  ) {
    const order = await this.prisma.deliveryOrder.findFirst({
      where: { id, establishmentId, deletedAt: null },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    if (order.saleId) throw new BadRequestException('El pedido ya tiene venta asociada');
    if (
      order.estado === DeliveryOrderStatus.CANCELADO ||
      order.estado === DeliveryOrderStatus.ENTREGADO
    ) {
      throw new BadRequestException('El pedido no puede facturarse en este estado');
    }

    const sale = await this.sales.create(
      {
        warehouseId: order.warehouseId,
        cashSessionId,
        customerId: order.customerId ?? undefined,
        documentType: SaleDocumentType.TICKET,
        comentario: `Pedido delivery ${order.numero}`,
        items: order.items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.cantidad.toString()),
          unitPrice: Number(item.precioUnitario.toString()),
        })),
        payments,
      },
      actor,
    );

    await this.prisma.deliveryOrder.update({
      where: { id },
      data: {
        saleId: sale.id,
        estado: DeliveryOrderStatus.ENTREGADO,
        entregadoAt: new Date(),
      },
    });

    return { order: await this.findOne(id, establishmentId), sale };
  }

  private async buildItems(
    items: CreateDeliveryOrderDto['items'],
    actor?: JwtRequestUser,
    establishmentId?: string,
  ): Promise<{
    subtotal: Prisma.Decimal;
    igvTotal: Prisma.Decimal;
    total: Prisma.Decimal;
    itemRows: Prisma.DeliveryOrderItemCreateWithoutDeliveryOrderInput[];
  }> {
    let subtotal = new Prisma.Decimal(0);
    let igvTotal = new Prisma.Decimal(0);
    let total = new Prisma.Decimal(0);
    const itemRows: Prisma.DeliveryOrderItemCreateWithoutDeliveryOrderInput[] = [];

    let tenantId: string | null = null;
    if (!actor && establishmentId) {
      const establishment = await this.prisma.establishment.findFirst({
        where: { id: establishmentId, deletedAt: null },
        select: { tenantId: true },
      });
      tenantId = establishment?.tenantId ?? null;
    }

    for (const line of items) {
      if (actor) {
        await this.scope.assertProductInTenant(actor, line.productId);
      }
      const product = await this.prisma.product.findFirst({
        where: {
          id: line.productId,
          deletedAt: null,
          ...(tenantId ? { tenantId } : {}),
        },
        select: {
          precioUnitarioVenta: true,
          incluyeIgvVenta: true,
          saleTaxAffectation: { select: { codigo: true } },
        },
      });
      if (!product) throw new NotFoundException(`Producto ${line.productId} no encontrado`);

      const unitPrice = line.unitPrice
        ? new Prisma.Decimal(line.unitPrice)
        : product.precioUnitarioVenta;
      const qty = new Prisma.Decimal(line.quantity);
      const totals = computeSaleLineTotals({
        quantity: qty,
        unitPrice,
        incluyeIgv: product.incluyeIgvVenta,
        taxCodigo: product.saleTaxAffectation?.codigo ?? '10',
      });

      subtotal = subtotal.plus(totals.subtotalLinea);
      igvTotal = igvTotal.plus(totals.igvLinea);
      total = total.plus(totals.totalLinea);

      itemRows.push({
        product: { connect: { id: line.productId } },
        cantidad: qty,
        precioUnitario: unitPrice,
        subtotalLinea: totals.subtotalLinea,
        igvLinea: totals.igvLinea,
        totalLinea: totals.totalLinea,
        notas: line.notas?.trim() || null,
      });
    }

    return { subtotal, igvTotal, total, itemRows };
  }

  private async validateWarehouse(warehouseId: string, establishmentId: string) {
    const wh = await this.prisma.warehouse.findFirst({
      where: { id: warehouseId, establishmentId, deletedAt: null },
      select: { id: true },
    });
    if (!wh) throw new NotFoundException('Almacén no válido para el establecimiento');
  }

  private async nextNumber(establishmentId: string): Promise<string> {
    const tz = await this.resolveTimeZone(establishmentId);
    const day = formatDateYmdInTimeZone(new Date(), tz).replace(/-/g, '');
    const prefix = `D${day}`;
    const last = await this.prisma.deliveryOrder.findFirst({
      where: { establishmentId, numero: { startsWith: prefix } },
      orderBy: { numero: 'desc' },
      select: { numero: true },
    });
    const seq = (Number.parseInt(last?.numero?.slice(prefix.length) ?? '0', 10) || 0) + 1;
    return `${prefix}${String(seq).padStart(4, '0')}`;
  }

  private async resolveTimeZone(establishmentId: string): Promise<string> {
    const row = await this.prisma.establishment.findFirst({
      where: { id: establishmentId, deletedAt: null },
      select: { timeZone: true },
    });
    return normalizeTimeZone(row?.timeZone);
  }

  private mapDetail(row: {
    id: string;
    numero: string;
    estado: DeliveryOrderStatus;
    canal: DeliveryChannel;
    clienteNombre: string;
    clienteTelefono: string;
    clienteEmail: string | null;
    direccionEntrega: string;
    referenciaDireccion: string | null;
    distritoEntrega: string | null;
    costoDelivery: Prisma.Decimal;
    subtotal: Prisma.Decimal;
    igvTotal: Prisma.Decimal;
    total: Prisma.Decimal;
    notasCliente: string | null;
    notasInternas: string | null;
    programadoPara: Date | null;
    entregadoAt: Date | null;
    cancelReason: string | null;
    saleId: string | null;
    createdAt: Date;
    customer: { id: string; nombre: string; numeroDocumento: string } | null;
    warehouse: { id: string; nombre: string };
    createdBy: { id: string; nombre: string };
    assignedTo: { id: string; nombre: string } | null;
    sale: { id: string; serie: string | null; numero: string | null; total: Prisma.Decimal } | null;
    items: Array<{
      id: string;
      productId: string;
      cantidad: Prisma.Decimal;
      precioUnitario: Prisma.Decimal;
      totalLinea: Prisma.Decimal;
      notas: string | null;
      product: { id: string; nombre: string; codigoInterno: string | null };
    }>;
    notifications: Array<{
      id: string;
      channel: string;
      templateKey: string;
      destino: string;
      enviadoOk: boolean;
      createdAt: Date;
    }>;
  }) {
    return {
      id: row.id,
      numero: row.numero,
      estado: row.estado,
      canal: row.canal,
      clienteNombre: row.clienteNombre,
      clienteTelefono: row.clienteTelefono,
      clienteEmail: row.clienteEmail,
      direccionEntrega: row.direccionEntrega,
      referenciaDireccion: row.referenciaDireccion,
      distritoEntrega: row.distritoEntrega,
      costoDelivery: row.costoDelivery.toString(),
      subtotal: row.subtotal.toString(),
      igvTotal: row.igvTotal.toString(),
      total: row.total.toString(),
      notasCliente: row.notasCliente,
      notasInternas: row.notasInternas,
      programadoPara: row.programadoPara?.toISOString() ?? null,
      entregadoAt: row.entregadoAt?.toISOString() ?? null,
      cancelReason: row.cancelReason,
      saleId: row.saleId,
      createdAt: row.createdAt.toISOString(),
      customer: row.customer,
      warehouse: row.warehouse,
      createdBy: row.createdBy,
      assignedTo: row.assignedTo,
      sale: row.sale
        ? {
            id: row.sale.id,
            serie: row.sale.serie,
            numero: row.sale.numero,
            total: row.sale.total.toString(),
          }
        : null,
      items: row.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        producto: item.product.nombre,
        codigoInterno: item.product.codigoInterno,
        cantidad: item.cantidad.toString(),
        precioUnitario: item.precioUnitario.toString(),
        totalLinea: item.totalLinea.toString(),
        notas: item.notas,
      })),
      notifications: row.notifications.map((n) => ({
        id: n.id,
        channel: n.channel,
        templateKey: n.templateKey,
        destino: n.destino,
        enviadoOk: n.enviadoOk,
        createdAt: n.createdAt.toISOString(),
      })),
    };
  }
}
