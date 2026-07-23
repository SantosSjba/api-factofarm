import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, QuotationStatus } from '../../generated/prisma/client';
import { buildPaginatedResult, paginationArgs } from '../../common/dto/pagination.dto';
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
        items: { include: { product: { select: { nombre: true, codigoInterno: true } } } },
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

  async create(establishmentId: string, sellerId: string, dto: CreateQuotationDto, actor: JwtRequestUser) {
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
        unitPrice,
        quantity: qty,
        incluyeIgv: product.incluyeIgvVenta,
        taxCodigo: product.saleTaxAffectation.codigo,
        discountType: line.discountType,
        discountValue:
          line.discountValue !== undefined ? new Prisma.Decimal(line.discountValue) : null,
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
          line.discountValue !== undefined ? new Prisma.Decimal(line.discountValue) : null,
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
    await this.prisma.quotation.update({
      where: { id },
      data: { estado: QuotationStatus.ENVIADA },
    });
    return { ok: true };
  }
}
