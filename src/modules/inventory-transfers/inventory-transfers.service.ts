import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  InventoryMovementType,
  InventoryTransferStatus,
  Prisma,
} from '../../generated/prisma/client';
import { buildPaginatedResult, paginationArgs } from '../../common/dto/pagination.dto';
import { AuditLogService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BillingService } from '../billing/billing.service';
import { CreateInventoryTransferDto } from './dto/create-inventory-transfer.dto';
import { InventoryTransferListQueryDto } from './dto/inventory-transfer-list-query.dto';

const TRANSFER_IN_CODE = 'TRANSFERENCIA_ALMACENES';
const TRANSFER_OUT_CODE = 'OUT_TRANSFERENCIA_ALMACENES';

@Injectable()
export class InventoryTransfersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
    private readonly billing: BillingService,
  ) {}

  async findAll(query: InventoryTransferListQueryDto) {
    const { page, pageSize, skip, take } = paginationArgs({
      page: query.page,
      pageSize: query.pageSize,
    });

    const where: Prisma.InventoryStockTransferWhereInput = {
      deletedAt: null,
      ...(query.estado ? { estado: query.estado } : {}),
      ...(query.warehouseId
        ? {
            OR: [
              { fromWarehouseId: query.warehouseId },
              { toWarehouseId: query.warehouseId },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.inventoryStockTransfer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          estado: true,
          guiaNumero: true,
          comentario: true,
          fechaEnvio: true,
          fechaRecepcion: true,
          createdAt: true,
          fromWarehouse: { select: { id: true, nombre: true } },
          toWarehouse: { select: { id: true, nombre: true } },
          user: { select: { nombre: true } },
          items: {
            select: {
              id: true,
              cantidad: true,
              codigoLote: true,
              product: { select: { id: true, nombre: true, codigoInterno: true } },
            },
          },
        },
      }),
      this.prisma.inventoryStockTransfer.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, pageSize);
  }

  async create(dto: CreateInventoryTransferDto, actorId?: string) {
    if (dto.fromWarehouseId === dto.toWarehouseId) {
      throw new BadRequestException('El almacén origen y destino deben ser distintos');
    }

    const [fromWarehouse, toWarehouse] = await Promise.all([
      this.prisma.warehouse.findFirst({
        where: { id: dto.fromWarehouseId, deletedAt: null },
        select: { id: true },
      }),
      this.prisma.warehouse.findFirst({
        where: { id: dto.toWarehouseId, deletedAt: null },
        select: { id: true },
      }),
    ]);
    if (!fromWarehouse || !toWarehouse) {
      throw new NotFoundException('Almacén origen o destino no encontrado');
    }

    const created = await this.prisma.inventoryStockTransfer.create({
      data: {
        fromWarehouseId: dto.fromWarehouseId,
        toWarehouseId: dto.toWarehouseId,
        userId: actorId ?? null,
        guiaNumero: dto.guiaNumero?.trim() || null,
        comentario: dto.comentario?.trim() || null,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            codigoLote: item.codigoLote?.trim() || null,
            cantidad: new Prisma.Decimal(item.cantidad),
            costoUnitario:
              item.costoUnitario != null ? new Prisma.Decimal(item.costoUnitario) : null,
          })),
        },
      },
      select: { id: true },
    });

    await this.audit.log({
      userId: actorId,
      action: 'CREATE',
      entity: 'InventoryStockTransfer',
      entityId: created.id,
    });

    return { id: created.id, message: 'Transferencia registrada en borrador' };
  }

  async dispatch(id: string, actorId?: string) {
    const transfer = await this.loadTransfer(id);
    if (transfer.estado !== InventoryTransferStatus.BORRADOR) {
      throw new BadRequestException('Solo se pueden despachar transferencias en borrador');
    }

    const outReason = await this.prisma.inventoryTransferReason.findFirst({
      where: { codigo: TRANSFER_OUT_CODE, deletedAt: null, activo: true },
      select: { id: true },
    });
    if (!outReason) {
      throw new BadRequestException('Motivo de salida por transferencia no configurado');
    }

    await this.prisma.$transaction(async (tx) => {
      for (const item of transfer.items) {
        await this.applyStockDelta(tx, {
          productId: item.productId,
          warehouseId: transfer.fromWarehouseId,
          lotCode: item.codigoLote,
          delta: item.cantidad.negated(),
          movementType: InventoryMovementType.TRANSFERENCIA_SALIDA,
          transferReasonId: outReason.id,
          unitCost: item.costoUnitario,
          reference: transfer.guiaNumero ?? transfer.id,
          userId: actorId,
        });
      }

      await tx.inventoryStockTransfer.update({
        where: { id },
        data: {
          estado: InventoryTransferStatus.EN_TRANSITO,
          fechaEnvio: new Date(),
        },
      });
    });

    await this.audit.log({
      userId: actorId,
      action: 'DISPATCH',
      entity: 'InventoryStockTransfer',
      entityId: id,
    });

    void this.billing.scheduleEmitFromTransfer(id);

    return { ok: true, message: 'Transferencia despachada' };
  }

  async receive(id: string, actorId?: string) {
    const transfer = await this.loadTransfer(id);
    if (transfer.estado !== InventoryTransferStatus.EN_TRANSITO) {
      throw new BadRequestException('Solo se pueden recibir transferencias en tránsito');
    }

    const inReason = await this.prisma.inventoryTransferReason.findFirst({
      where: { codigo: TRANSFER_IN_CODE, deletedAt: null, activo: true },
      select: { id: true },
    });
    if (!inReason) {
      throw new BadRequestException('Motivo de ingreso por transferencia no configurado');
    }

    await this.prisma.$transaction(async (tx) => {
      for (const item of transfer.items) {
        await this.applyStockDelta(tx, {
          productId: item.productId,
          warehouseId: transfer.toWarehouseId,
          lotCode: item.codigoLote,
          delta: item.cantidad,
          movementType: InventoryMovementType.TRANSFERENCIA_ENTRADA,
          transferReasonId: inReason.id,
          unitCost: item.costoUnitario,
          reference: transfer.guiaNumero ?? transfer.id,
          userId: actorId,
        });
      }

      await tx.inventoryStockTransfer.update({
        where: { id },
        data: {
          estado: InventoryTransferStatus.RECIBIDO,
          fechaRecepcion: new Date(),
        },
      });
    });

    await this.audit.log({
      userId: actorId,
      action: 'RECEIVE',
      entity: 'InventoryStockTransfer',
      entityId: id,
    });

    return { ok: true, message: 'Transferencia recibida en almacén destino' };
  }

  async cancel(id: string, actorId?: string) {
    const transfer = await this.loadTransfer(id);
    if (transfer.estado !== InventoryTransferStatus.BORRADOR) {
      throw new BadRequestException('Solo se pueden anular transferencias en borrador');
    }

    await this.prisma.inventoryStockTransfer.update({
      where: { id },
      data: { estado: InventoryTransferStatus.ANULADO },
    });

    await this.audit.log({
      userId: actorId,
      action: 'CANCEL',
      entity: 'InventoryStockTransfer',
      entityId: id,
    });

    return { ok: true, message: 'Transferencia anulada' };
  }

  private async loadTransfer(id: string) {
    const transfer = await this.prisma.inventoryStockTransfer.findFirst({
      where: { id, deletedAt: null },
      include: { items: true },
    });
    if (!transfer) throw new NotFoundException('Transferencia no encontrada');
    return transfer;
  }

  private async applyStockDelta(
    tx: Prisma.TransactionClient,
    input: {
      productId: string;
      warehouseId: string;
      lotCode: string | null;
      delta: Prisma.Decimal;
      movementType: InventoryMovementType;
      transferReasonId: string;
      unitCost: Prisma.Decimal | null;
      reference: string;
      userId?: string;
    },
  ) {
    const absQty = input.delta.abs();
    if (input.delta.isNegative()) {
      const stock = await tx.productWarehouseStock.findUnique({
        where: {
          productId_warehouseId: {
            productId: input.productId,
            warehouseId: input.warehouseId,
          },
        },
        select: { cantidad: true },
      });
      const current = stock?.cantidad ?? new Prisma.Decimal(0);
      if (current.lessThan(absQty)) {
        throw new BadRequestException('Stock insuficiente para despachar la transferencia');
      }
    }

    await tx.inventoryInboundMovement.create({
      data: {
        productId: input.productId,
        warehouseId: input.warehouseId,
        transferReasonId: input.transferReasonId,
        movementType: input.movementType,
        cantidad: input.delta,
        costoUnitario: input.unitCost,
        codigoLote: input.lotCode,
        referencia: input.reference,
        userId: input.userId ?? null,
      },
    });

    if (input.lotCode) {
      const lot = await tx.productLotStock.findFirst({
        where: {
          productId: input.productId,
          warehouseId: input.warehouseId,
          codigoLote: input.lotCode,
          deletedAt: null,
        },
        select: { id: true, stock: true },
      });

      if (input.delta.isNegative()) {
        if (!lot || lot.stock.lessThan(absQty)) {
          throw new BadRequestException(`Stock insuficiente en lote ${input.lotCode}`);
        }
        await tx.productLotStock.update({
          where: { id: lot.id },
          data: { stock: lot.stock.plus(input.delta) },
        });
      } else if (lot) {
        await tx.productLotStock.update({
          where: { id: lot.id },
          data: {
            stock: lot.stock.plus(input.delta),
            costoUnitario: input.unitCost ?? undefined,
          },
        });
      } else {
        await tx.productLotStock.create({
          data: {
            productId: input.productId,
            warehouseId: input.warehouseId,
            codigoLote: input.lotCode,
            stock: input.delta,
            costoUnitario: input.unitCost,
          },
        });
      }
    }

    const warehouseStock = await tx.productWarehouseStock.findUnique({
      where: {
        productId_warehouseId: {
          productId: input.productId,
          warehouseId: input.warehouseId,
        },
      },
      select: { cantidad: true },
    });

    await tx.productWarehouseStock.upsert({
      where: {
        productId_warehouseId: {
          productId: input.productId,
          warehouseId: input.warehouseId,
        },
      },
      update: {
        cantidad: (warehouseStock?.cantidad ?? new Prisma.Decimal(0)).plus(input.delta),
      },
      create: {
        productId: input.productId,
        warehouseId: input.warehouseId,
        cantidad: input.delta.isNegative() ? new Prisma.Decimal(0) : input.delta,
      },
    });
  }
}
