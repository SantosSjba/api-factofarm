import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LoyaltyTransactionType, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LoyaltyService {
  constructor(private readonly prisma: PrismaService) {}

  async awardForSale(
    establishmentId: string,
    customerId: string,
    saleTotal: Prisma.Decimal,
    saleId: string,
    createdById?: string,
  ) {
    const establishment = await this.prisma.establishment.findUnique({
      where: { id: establishmentId },
      select: { loyaltyPointsPerSol: true },
    });
    const rate = establishment?.loyaltyPointsPerSol ?? 1;
    if (rate <= 0) return;

    const points = Math.floor(Number(saleTotal.toString()) * rate);
    if (points <= 0) return;

    await this.addPoints(
      establishmentId,
      customerId,
      points,
      LoyaltyTransactionType.VENTA,
      `Venta ${saleId.slice(0, 8)}`,
      saleId,
      undefined,
      createdById,
    );
  }

  async adjustPoints(
    establishmentId: string,
    customerId: string,
    puntos: number,
    referencia?: string,
    actorId?: string,
  ) {
    if (!puntos) throw new BadRequestException('Indique puntos distintos de cero');
    const tipo = puntos > 0 ? LoyaltyTransactionType.AJUSTE : LoyaltyTransactionType.CANJE;
    return this.addPoints(
      establishmentId,
      customerId,
      puntos,
      tipo,
      referencia ?? 'Ajuste manual',
      undefined,
      undefined,
      actorId,
    );
  }

  async listHistory(customerId: string, establishmentId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, deletedAt: null },
      select: { id: true, nombre: true, puntosAcumulados: true },
    });
    if (!customer) throw new NotFoundException('Cliente no encontrado');

    const rows = await this.prisma.customerLoyaltyTransaction.findMany({
      where: { customerId, establishmentId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        tipo: true,
        puntos: true,
        saldoAfter: true,
        referencia: true,
        createdAt: true,
      },
    });

    return {
      customerId: customer.id,
      nombre: customer.nombre,
      puntosAcumulados: customer.puntosAcumulados,
      transactions: rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  async purchaseRecommendations(customerId: string, establishmentId: string) {
    const sales = await this.prisma.saleItem.findMany({
      where: {
        sale: {
          customerId,
          establishmentId,
          deletedAt: null,
          estado: 'COMPLETADA',
        },
      },
      select: {
        productId: true,
        cantidad: true,
        product: { select: { nombre: true, codigoInterno: true } },
        sale: { select: { createdAt: true } },
      },
      take: 200,
      orderBy: { sale: { createdAt: 'desc' } },
    });

    const totals = new Map<string, { nombre: string; codigoInterno: string | null; qty: number }>();
    for (const row of sales) {
      const prev = totals.get(row.productId);
      const qty = Number(row.cantidad.toString());
      if (prev) {
        prev.qty += qty;
      } else {
        totals.set(row.productId, {
          nombre: row.product.nombre,
          codigoInterno: row.product.codigoInterno,
          qty,
        });
      }
    }

    const frequent = [...totals.entries()]
      .map(([productId, meta]) => ({ productId, ...meta }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);

    const recentIds = new Set(
      sales.slice(0, 30).map((s) => s.productId),
    );
    const suggestions = frequent.filter((f) => !recentIds.has(f.productId)).slice(0, 5);

    return {
      frequentPurchases: frequent,
      recommendations: suggestions.length ? suggestions : frequent.slice(0, 5),
    };
  }

  private async addPoints(
    establishmentId: string,
    customerId: string,
    puntos: number,
    tipo: LoyaltyTransactionType,
    referencia: string,
    saleId?: string,
    deliveryOrderId?: string,
    createdById?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { id: customerId },
        select: { puntosAcumulados: true },
      });
      if (!customer) throw new NotFoundException('Cliente no encontrado');

      const saldoAfter = customer.puntosAcumulados + puntos;
      if (saldoAfter < 0) {
        throw new BadRequestException('El cliente no tiene puntos suficientes');
      }

      await tx.customer.update({
        where: { id: customerId },
        data: { puntosAcumulados: saldoAfter },
      });

      const txRow = await tx.customerLoyaltyTransaction.create({
        data: {
          customerId,
          establishmentId,
          tipo,
          puntos,
          saldoAfter,
          referencia,
          saleId,
          deliveryOrderId,
          createdById,
        },
        select: { id: true, puntos: true, saldoAfter: true, tipo: true, createdAt: true },
      });

      return {
        ...txRow,
        createdAt: txRow.createdAt.toISOString(),
      };
    });
  }
}
