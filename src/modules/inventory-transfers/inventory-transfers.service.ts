import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InventoryMovementType,
  InventoryTransferStatus,
  Prisma,
} from '../../generated/prisma/client';
import {
  buildPaginatedResult,
  paginationArgs,
} from '../../common/dto/pagination.dto';
import { AuditLogService } from '../../common/services/audit-log.service';
import { EstablishmentScopeService } from '../../common/scoping/establishment-scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BillingService } from '../billing/billing.service';
import { CreateInventoryTransferDto } from './dto/create-inventory-transfer.dto';
import { InventoryTransferListQueryDto } from './dto/inventory-transfer-list-query.dto';
import type { JwtRequestUser } from '../auth/domain/auth.types';

const TRANSFER_IN_CODE = 'TRANSFERENCIA_ALMACENES';
const TRANSFER_OUT_CODE = 'OUT_TRANSFERENCIA_ALMACENES';

@Injectable()
export class InventoryTransfersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
    private readonly billing: BillingService,
    private readonly scope: EstablishmentScopeService,
  ) {}

  async findAll(query: InventoryTransferListQueryDto, actor: JwtRequestUser) {
    const { page, pageSize, skip, take } = paginationArgs({
      page: query.page,
      pageSize: query.pageSize,
    });

    const scopedEstablishmentId = await this.scope.resolve(
      actor,
      query.establishmentId,
    );
    const scopedWarehouses = await this.prisma.warehouse.findMany({
      where: { establishmentId: scopedEstablishmentId, deletedAt: null },
      select: { id: true },
    });
    const warehouseIds = scopedWarehouses.map((w) => w.id);

    const where: Prisma.InventoryStockTransferWhereInput = {
      deletedAt: null,
      ...(warehouseIds.length
        ? {
            OR: [
              { fromWarehouseId: { in: warehouseIds } },
              { toWarehouseId: { in: warehouseIds } },
            ],
          }
        : { id: '__none__' }),
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
              product: {
                select: { id: true, nombre: true, codigoInterno: true },
              },
            },
          },
        },
      }),
      this.prisma.inventoryStockTransfer.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, pageSize);
  }

  async create(dto: CreateInventoryTransferDto, actor: JwtRequestUser) {
    if (dto.fromWarehouseId === dto.toWarehouseId) {
      throw new BadRequestException(
        'El almacén origen y destino deben ser distintos',
      );
    }

    await this.scope.assertWarehouseInTenant(actor, dto.fromWarehouseId);
    await this.scope.assertWarehouseInTenant(actor, dto.toWarehouseId);

    const [fromWarehouse, toWarehouse] = await Promise.all([
      this.prisma.warehouse.findFirst({
        where: { id: dto.fromWarehouseId, deletedAt: null },
        select: { id: true, establishmentId: true },
      }),
      this.prisma.warehouse.findFirst({
        where: { id: dto.toWarehouseId, deletedAt: null },
        select: { id: true, establishmentId: true },
      }),
    ]);
    if (!fromWarehouse || !toWarehouse) {
      throw new NotFoundException('Almacén origen o destino no encontrado');
    }

    if (fromWarehouse.establishmentId !== toWarehouse.establishmentId) {
      const canCross = actor.permissionCodes.includes(
        'inventory.transfer.cross',
      );
      if (!canCross) {
        throw new ForbiddenException(
          'Transferencia entre sucursales requiere permiso inventory.transfer.cross',
        );
      }
    }

    const productIds = [...new Set(dto.items.map((item) => item.productId))];
    for (const productId of productIds) {
      await this.scope.assertProductInTenant(actor, productId);
    }
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, deletedAt: null },
      select: { id: true, manejaLotes: true, nombre: true },
    });
    const productById = new Map(products.map((p) => [p.id, p]));
    for (const item of dto.items) {
      const product = productById.get(item.productId);
      if (!product) throw new NotFoundException('Producto no encontrado');
      const lotCode = item.codigoLote?.trim() || null;
      if (product.manejaLotes && !lotCode) {
        throw new BadRequestException(
          `El producto ${product.nombre} maneja lotes: indique código de lote`,
        );
      }
    }

    const created = await this.prisma.inventoryStockTransfer.create({
      data: {
        fromWarehouseId: dto.fromWarehouseId,
        toWarehouseId: dto.toWarehouseId,
        userId: actor.sub,
        guiaNumero: dto.guiaNumero?.trim() || null,
        comentario: dto.comentario?.trim() || null,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            codigoLote: item.codigoLote?.trim() || null,
            cantidad: new Prisma.Decimal(item.cantidad),
            costoUnitario:
              item.costoUnitario != null
                ? new Prisma.Decimal(item.costoUnitario)
                : null,
          })),
        },
      },
      select: { id: true },
    });

    await this.audit.log({
      userId: actor.sub,
      action: 'CREATE',
      entity: 'InventoryStockTransfer',
      entityId: created.id,
    });

    return { id: created.id, message: 'Transferencia registrada en borrador' };
  }

  async dispatch(id: string, actor: JwtRequestUser) {
    const transfer = await this.loadTransfer(id, actor);
    if (transfer.estado !== InventoryTransferStatus.BORRADOR) {
      throw new BadRequestException(
        'Solo se pueden despachar transferencias en borrador',
      );
    }

    await this.assertTransferLots(transfer.items);

    const outReason = await this.prisma.inventoryTransferReason.findFirst({
      where: { codigo: TRANSFER_OUT_CODE, deletedAt: null, activo: true },
      select: { id: true },
    });
    if (!outReason) {
      throw new BadRequestException(
        'Motivo de salida por transferencia no configurado',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.inventoryStockTransfer.updateMany({
        where: {
          id,
          estado: InventoryTransferStatus.BORRADOR,
          deletedAt: null,
        },
        data: {
          estado: InventoryTransferStatus.EN_TRANSITO,
          fechaEnvio: new Date(),
        },
      });
      if (claimed.count !== 1)
        throw new BadRequestException(
          'La transferencia ya fue despachada o anulada',
        );
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
          userId: actor.sub,
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
      userId: actor.sub,
      action: 'DISPATCH',
      entity: 'InventoryStockTransfer',
      entityId: id,
    });

    void this.billing.scheduleEmitFromTransfer(id);

    return { ok: true, message: 'Transferencia despachada' };
  }

  async receive(id: string, actor: JwtRequestUser) {
    const transfer = await this.loadTransfer(id, actor);
    if (transfer.estado !== InventoryTransferStatus.EN_TRANSITO) {
      throw new BadRequestException(
        'Solo se pueden recibir transferencias en tránsito',
      );
    }

    await this.assertTransferLots(transfer.items);

    const inReason = await this.prisma.inventoryTransferReason.findFirst({
      where: { codigo: TRANSFER_IN_CODE, deletedAt: null, activo: true },
      select: { id: true },
    });
    if (!inReason) {
      throw new BadRequestException(
        'Motivo de ingreso por transferencia no configurado',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.inventoryStockTransfer.updateMany({
        where: {
          id,
          estado: InventoryTransferStatus.EN_TRANSITO,
          deletedAt: null,
        },
        data: {
          estado: InventoryTransferStatus.RECIBIDO,
          fechaRecepcion: new Date(),
        },
      });
      if (claimed.count !== 1)
        throw new BadRequestException('La transferencia ya fue recibida');
      for (const item of transfer.items) {
        const sourceLot = item.codigoLote
          ? await tx.productLotStock.findFirst({
              where: {
                productId: item.productId,
                warehouseId: transfer.fromWarehouseId,
                codigoLote: item.codigoLote,
                deletedAt: null,
              },
              select: { fechaVencimiento: true },
            })
          : null;
        await this.applyStockDelta(tx, {
          productId: item.productId,
          warehouseId: transfer.toWarehouseId,
          expirationDate: sourceLot?.fechaVencimiento,
          lotCode: item.codigoLote,
          delta: item.cantidad,
          movementType: InventoryMovementType.TRANSFERENCIA_ENTRADA,
          transferReasonId: inReason.id,
          unitCost: item.costoUnitario,
          reference: transfer.guiaNumero ?? transfer.id,
          userId: actor.sub,
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
      userId: actor.sub,
      action: 'RECEIVE',
      entity: 'InventoryStockTransfer',
      entityId: id,
    });

    return { ok: true, message: 'Transferencia recibida en almacén destino' };
  }

  async cancel(id: string, actor: JwtRequestUser) {
    const transfer = await this.loadTransfer(id, actor);
    if (transfer.estado !== InventoryTransferStatus.BORRADOR) {
      throw new BadRequestException(
        'Solo se pueden anular transferencias en borrador',
      );
    }

    const cancelled = await this.prisma.inventoryStockTransfer.updateMany({
      where: { id, estado: InventoryTransferStatus.BORRADOR, deletedAt: null },
      data: { estado: InventoryTransferStatus.ANULADO },
    });
    if (cancelled.count !== 1)
      throw new BadRequestException('La transferencia ya no está en borrador');

    await this.audit.log({
      userId: actor.sub,
      action: 'CANCEL',
      entity: 'InventoryStockTransfer',
      entityId: id,
    });

    return { ok: true, message: 'Transferencia anulada' };
  }

  private async assertTransferLots(
    items: Array<{ productId: string; codigoLote: string | null }>,
  ) {
    const productIds = [...new Set(items.map((item) => item.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, deletedAt: null },
      select: { id: true, manejaLotes: true, nombre: true },
    });
    const productById = new Map(products.map((p) => [p.id, p]));
    for (const item of items) {
      const product = productById.get(item.productId);
      if (!product) throw new NotFoundException('Producto no encontrado');
      if (product.manejaLotes && !item.codigoLote?.trim()) {
        throw new BadRequestException(
          `El producto ${product.nombre} maneja lotes: indique código de lote`,
        );
      }
    }
  }

  private async loadTransfer(id: string, actor: JwtRequestUser) {
    const transfer = await this.prisma.inventoryStockTransfer.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(actor.tenantId
          ? {
              fromWarehouse: { establishment: { tenantId: actor.tenantId } },
              toWarehouse: { establishment: { tenantId: actor.tenantId } },
            }
          : {}),
      },
      include: { items: true },
    });
    if (!transfer) throw new NotFoundException('Transferencia no encontrada');
    await this.scope.assertWarehouseInTenant(actor, transfer.fromWarehouseId);
    await this.scope.assertWarehouseInTenant(actor, transfer.toWarehouseId);
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
      expirationDate?: Date | null;
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
        throw new BadRequestException(
          'Stock insuficiente para despachar la transferencia',
        );
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
        fechaVencimiento: input.expirationDate,
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
          throw new BadRequestException(
            `Stock insuficiente en lote ${input.lotCode}`,
          );
        }
        const updated = await tx.productLotStock.updateMany({
          where: { id: lot.id, stock: { gte: absQty }, deletedAt: null },
          data: { stock: { decrement: absQty } },
        });
        if (updated.count !== 1)
          throw new BadRequestException(
            `Stock insuficiente en lote ${input.lotCode}`,
          );
      } else if (lot) {
        await tx.productLotStock.update({
          where: { id: lot.id },
          data: {
            stock: { increment: input.delta },
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
            fechaVencimiento: input.expirationDate,
          },
        });
      }
    }

    if (input.delta.isNegative()) {
      const updated = await tx.productWarehouseStock.updateMany({
        where: {
          productId: input.productId,
          warehouseId: input.warehouseId,
          cantidad: { gte: absQty },
        },
        data: { cantidad: { decrement: absQty } },
      });
      if (updated.count !== 1)
        throw new BadRequestException(
          'Stock insuficiente para despachar la transferencia',
        );
      return;
    }

    await tx.productWarehouseStock.upsert({
      where: {
        productId_warehouseId: {
          productId: input.productId,
          warehouseId: input.warehouseId,
        },
      },
      update: {
        cantidad: { increment: input.delta },
      },
      create: {
        productId: input.productId,
        warehouseId: input.warehouseId,
        cantidad: input.delta.isNegative()
          ? new Prisma.Decimal(0)
          : input.delta,
      },
    });
  }
}
