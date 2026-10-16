import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DiscountType,
  Prisma,
  QuotationStatus,
} from '../../generated/prisma/client';
import {
  buildPaginatedResult,
  paginationArgs,
} from '../../common/dto/pagination.dto';
import { EstablishmentScopeService } from '../../common/scoping/establishment-scope.service';
import { computeSaleLineTotals } from '../../common/utils/sale-pricing.util';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { CreateQuotationDto, QuotationListQueryDto } from './dto/quotation.dto';

@Injectable()
export class QuotationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: EstablishmentScopeService,
  ) {}

  private async ensure(id: string, establishmentId: string) {
    const row = await this.prisma.quotation.findFirst({
      where: { id, establishmentId, deletedAt: null },
      select: { id: true },
    });
    if (!row) throw new NotFoundException('Cotización no encontrada');
  }

  async findAll(establishmentId: string, query: QuotationListQueryDto) {
    const { page, pageSize, skip, take } = paginationArgs(query);
    const where = { establishmentId, deletedAt: null };
    const [total, rows] = await Promise.all([
      this.prisma.quotation.count({ where }),
      this.prisma.quotation.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          estado: true,
          total: true,
          createdAt: true,
          customer: { select: { nombre: true } },
          seller: { select: { nombre: true } },
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
    const row = await this.prisma.quotation.findFirst({
      where: { id, establishmentId, deletedAt: null },
      include: {
        customer: { select: { id: true, nombre: true } },
        warehouse: { select: { id: true, nombre: true } },
        items: {
          include: {
            product: { select: { nombre: true, codigoInterno: true } },
          },
        },
      },
    });
    if (!row) throw new NotFoundException('Cotización no encontrada');
    return {
      id: row.id,
      estado: row.estado,
      warehouseId: row.warehouseId,
      customerId: row.customerId,
      total: row.total.toString(),
      subtotal: row.subtotal.toString(),
      igvTotal: row.igvTotal.toString(),
      comentario: row.comentario,
      customer: row.customer,
      items: row.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        producto: item.product.nombre,
        cantidad: item.cantidad.toString(),
        precioUnitario: item.precioUnitario.toString(),
        totalLinea: item.totalLinea.toString(),
      })),
    };
  }

  async create(
    establishmentId: string,
    sellerId: string,
    dto: CreateQuotationDto,
    actor: JwtRequestUser,
  ) {
    await this.scope.assertWarehouseInTenant(actor, dto.warehouseId);
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: dto.warehouseId, establishmentId, deletedAt: null },
      select: { id: true },
    });
    if (!warehouse) throw new NotFoundException('Almacén no válido');

    if (dto.customerId) {
      await this.scope.assertCustomerInTenant(actor, dto.customerId);
    }

    let subtotal = new Prisma.Decimal(0);
    let igvTotal = new Prisma.Decimal(0);
    let total = new Prisma.Decimal(0);
    const itemRows: Prisma.QuotationItemCreateWithoutQuotationInput[] = [];

    for (const line of dto.items) {
      await this.scope.assertProductInTenant(actor, line.productId);
      const product = await this.prisma.product.findFirst({
        where: { id: line.productId, deletedAt: null },
        select: {
          nombre: true,
          precioUnitarioVenta: true,
          incluyeIgvVenta: true,
          saleTaxAffectation: { select: { codigo: true } },
        },
      });
      if (!product)
        throw new NotFoundException(`Producto ${line.productId} no encontrado`);

      // `!= null`: un precio 0 (bonificación) es válido y no debe reemplazarse por el de lista.
      const unitPrice =
        line.unitPrice != null
          ? new Prisma.Decimal(line.unitPrice)
          : product.precioUnitarioVenta;
      const qty = new Prisma.Decimal(line.quantity);
      if (line.discountType && line.discountValue) {
        const gross = unitPrice.times(qty);
        if (
          line.discountType === DiscountType.PORCENTAJE &&
          line.discountValue > 100
        ) {
          throw new BadRequestException(
            `El descuento de ${product.nombre} no puede superar el 100%`,
          );
        }
        if (
          line.discountType !== DiscountType.PORCENTAJE &&
          new Prisma.Decimal(line.discountValue).greaterThan(gross)
        ) {
          throw new BadRequestException(
            `El descuento de ${product.nombre} (${line.discountValue}) supera el importe de la línea (${gross.toFixed(2)})`,
          );
        }
      }
      const totals = computeSaleLineTotals({
        unitPrice,
        quantity: qty,
        incluyeIgv: product.incluyeIgvVenta,
        taxCodigo: product.saleTaxAffectation.codigo,
        discountType: line.discountType,
        discountValue:
          line.discountValue !== undefined
            ? new Prisma.Decimal(line.discountValue)
            : null,
      });

      subtotal = subtotal.plus(totals.subtotalLinea);
      igvTotal = igvTotal.plus(totals.igvLinea);
      total = total.plus(totals.totalLinea);

      itemRows.push({
        product: { connect: { id: line.productId } },
        cantidad: qty,
        precioUnitario: unitPrice,
        discountType: line.discountType ?? null,
        discountValue:
          line.discountValue !== undefined
            ? new Prisma.Decimal(line.discountValue)
            : null,
        subtotalLinea: totals.subtotalLinea,
        igvLinea: totals.igvLinea,
        totalLinea: totals.totalLinea,
      });
    }

    const created = await this.prisma.quotation.create({
      data: {
        establishmentId,
        sellerId,
        warehouseId: dto.warehouseId,
        customerId: dto.customerId ?? null,
        comentario: dto.comentario?.trim() || null,
        subtotal,
        igvTotal,
        total,
        items: { create: itemRows },
      },
      select: { id: true },
    });

    return this.findOne(created.id, establishmentId);
  }

  async markSent(id: string, establishmentId: string) {
    await this.ensure(id, establishmentId);
    // Sólo un borrador pasa a enviada: antes una cotización convertida, rechazada o vencida
    // volvía a "Enviada" y podía reutilizarse.
    const updated = await this.prisma.quotation.updateMany({
      where: {
        id,
        estado: { in: [QuotationStatus.BORRADOR, QuotationStatus.ENVIADA] },
      },
      data: { estado: QuotationStatus.ENVIADA },
    });
    if (updated.count !== 1) {
      throw new BadRequestException(
        'Sólo se puede enviar una cotización en borrador',
      );
    }
    return { ok: true };
  }
}
