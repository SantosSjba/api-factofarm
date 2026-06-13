import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  InventoryLotAllocationMethod,
  Prisma,
} from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type EstablishmentInventoryPolicy = {
  establishmentId: string;
  blockExpiredProductSales: boolean;
  inventoryLotAllocationMethod: InventoryLotAllocationMethod;
};

export type EligibleLotRow = {
  id: string;
  codigoLote: string;
  stock: Prisma.Decimal;
  fechaVencimiento: Date | null;
  createdAt: Date;
  vencido: boolean;
};

export type LotAllocationLine = {
  lotId: string;
  codigoLote: string;
  cantidad: string;
  fechaVencimiento: string | null;
  vencido: boolean;
};

@Injectable()
export class InventoryLotAllocationService {
  constructor(private readonly prisma: PrismaService) {}

  async getPolicyFromWarehouse(warehouseId: string): Promise<EstablishmentInventoryPolicy> {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: warehouseId, deletedAt: null },
      select: {
        establishmentId: true,
        establishment: {
          select: {
            blockExpiredProductSales: true,
            inventoryLotAllocationMethod: true,
          },
        },
      },
    });
    if (!warehouse) throw new NotFoundException('Almacén no encontrado');
    return {
      establishmentId: warehouse.establishmentId,
      blockExpiredProductSales: warehouse.establishment.blockExpiredProductSales,
      inventoryLotAllocationMethod: warehouse.establishment.inventoryLotAllocationMethod,
    };
  }

  async listEligibleLots(
    productId: string,
    warehouseId: string,
    policy?: EstablishmentInventoryPolicy,
  ): Promise<EligibleLotRow[]> {
    const resolvedPolicy = policy ?? (await this.getPolicyFromWarehouse(warehouseId));
    const now = new Date();
    const rows = await this.prisma.productLotStock.findMany({
      where: {
        productId,
        warehouseId,
        deletedAt: null,
        stock: { gt: 0 },
      },
      select: {
        id: true,
        codigoLote: true,
        stock: true,
        fechaVencimiento: true,
        createdAt: true,
      },
    });

    return rows
      .map((row) => ({
        ...row,
        vencido: this.isExpired(row.fechaVencimiento, now),
      }))
      .filter((row) => !(resolvedPolicy.blockExpiredProductSales && row.vencido))
      .sort((a, b) => this.compareLotsForAllocation(a, b, resolvedPolicy.inventoryLotAllocationMethod));
  }

  planAutoAllocation(
    lots: EligibleLotRow[],
    quantity: Prisma.Decimal,
  ): LotAllocationLine[] {
    let remaining = quantity;
    const lines: LotAllocationLine[] = [];

    for (const lot of lots) {
      if (remaining.lte(0)) break;
      if (lot.stock.lte(0)) continue;
      const take = Prisma.Decimal.min(lot.stock, remaining);
      if (take.lte(0)) continue;
      lines.push(this.toAllocationLine(lot, take));
      remaining = remaining.minus(take);
    }

    if (remaining.gt(0)) {
      const disponible = this.sumEligibleStock(lots);
      throw new BadRequestException(
        disponible.lte(0)
          ? 'No hay lotes elegibles para venta. Revise vencimientos o registre lotes con stock.'
          : `Stock vendible por lotes: ${disponible.toString()}. Cantidad solicitada: ${quantity.toString()}.`,
      );
    }

    return lines;
  }

  sumEligibleStock(lots: EligibleLotRow[]): Prisma.Decimal {
    return lots.reduce((acc, lot) => acc.plus(lot.stock), new Prisma.Decimal(0));
  }

  /** Suma stock en lotes no vencidos (o todos si no bloquea vencidos) por producto. */
  async batchSumEligibleStock(
    productIds: string[],
    warehouseId: string,
  ): Promise<Map<string, Prisma.Decimal>> {
    const totals = new Map<string, Prisma.Decimal>();
    if (!productIds.length) return totals;

    const policy = await this.getPolicyFromWarehouse(warehouseId);
    const now = new Date();
    const rows = await this.prisma.productLotStock.findMany({
      where: {
        productId: { in: productIds },
        warehouseId,
        deletedAt: null,
        stock: { gt: 0 },
      },
      select: {
        productId: true,
        stock: true,
        fechaVencimiento: true,
      },
    });

    for (const productId of productIds) {
      totals.set(productId, new Prisma.Decimal(0));
    }

    for (const row of rows) {
      if (policy.blockExpiredProductSales && this.isExpired(row.fechaVencimiento, now)) {
        continue;
      }
      const current = totals.get(row.productId) ?? new Prisma.Decimal(0);
      totals.set(row.productId, current.plus(row.stock));
    }

    return totals;
  }

  planManualAllocation(
    lots: EligibleLotRow[],
    manualLots: { lotCode: string; quantity: number }[],
    policy: EstablishmentInventoryPolicy,
  ): LotAllocationLine[] {
    const lotByCode = new Map(lots.map((lot) => [lot.codigoLote.toLowerCase(), lot]));
    const lines: LotAllocationLine[] = [];

    for (const item of manualLots) {
      const code = item.lotCode.trim();
      if (!code) {
        throw new BadRequestException('Código de lote requerido en asignación manual');
      }
      const lot = lotByCode.get(code.toLowerCase());
      if (!lot) {
        throw new BadRequestException(`Lote no disponible para venta: ${code}`);
      }
      if (policy.blockExpiredProductSales && lot.vencido) {
        throw new BadRequestException(`No se puede vender el lote vencido: ${code}`);
      }
      const qty = new Prisma.Decimal(item.quantity);
      if (qty.lte(0)) {
        throw new BadRequestException(`Cantidad inválida para el lote ${code}`);
      }
      if (lot.stock.lessThan(qty)) {
        throw new BadRequestException(`Stock insuficiente en el lote ${code}`);
      }
      lines.push(this.toAllocationLine(lot, qty));
    }

    return lines;
  }

  assertLotSellable(
    fechaVencimiento: Date | null,
    blockExpiredProductSales: boolean,
    lotCode?: string,
  ) {
    if (blockExpiredProductSales && this.isExpired(fechaVencimiento)) {
      throw new BadRequestException(
        lotCode
          ? `No se puede despachar el lote vencido: ${lotCode}`
          : 'No se puede despachar un lote vencido',
      );
    }
  }

  private toAllocationLine(lot: EligibleLotRow, cantidad: Prisma.Decimal): LotAllocationLine {
    return {
      lotId: lot.id,
      codigoLote: lot.codigoLote,
      cantidad: cantidad.toString(),
      fechaVencimiento: lot.fechaVencimiento?.toISOString() ?? null,
      vencido: lot.vencido,
    };
  }

  private isExpired(fechaVencimiento: Date | null | undefined, now = new Date()) {
    if (!fechaVencimiento) return false;
    return fechaVencimiento.getTime() < now.getTime();
  }

  private compareLotsForAllocation(
    a: Pick<EligibleLotRow, 'fechaVencimiento' | 'createdAt' | 'codigoLote'>,
    b: Pick<EligibleLotRow, 'fechaVencimiento' | 'createdAt' | 'codigoLote'>,
    method: InventoryLotAllocationMethod,
  ) {
    if (method === InventoryLotAllocationMethod.FEFO) {
      const aExp = a.fechaVencimiento?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bExp = b.fechaVencimiento?.getTime() ?? Number.MAX_SAFE_INTEGER;
      if (aExp !== bExp) return aExp - bExp;
    }
    const createdDiff = a.createdAt.getTime() - b.createdAt.getTime();
    if (createdDiff !== 0) return createdDiff;
    return a.codigoLote.localeCompare(b.codigoLote);
  }
}
