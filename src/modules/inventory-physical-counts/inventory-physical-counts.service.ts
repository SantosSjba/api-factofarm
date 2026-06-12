import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InventoryPhysicalCountStatus, Prisma } from '../../generated/prisma/client';
import { buildPaginatedResult, paginationArgs } from '../../common/dto/pagination.dto';
import { AuditLogService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryMovementsService } from '../inventory-movements/inventory-movements.service';
import { CreatePhysicalCountDto } from './dto/create-physical-count.dto';
import { UpsertPhysicalCountItemDto } from './dto/upsert-physical-count-item.dto';

@Injectable()
export class InventoryPhysicalCountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
    private readonly movements: InventoryMovementsService,
  ) {}

  async findAll(page = 1, pageSize = 10) {
    const { skip, take } = paginationArgs({ page, pageSize });
    const where = { deletedAt: null };
    const [items, total] = await Promise.all([
      this.prisma.inventoryPhysicalCount.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          estado: true,
          fecha: true,
          comentario: true,
          warehouse: { select: { id: true, nombre: true } },
          user: { select: { nombre: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.inventoryPhysicalCount.count({ where }),
    ]);
    return buildPaginatedResult(
      items.map((row) => ({
        id: row.id,
        estado: row.estado,
        fecha: row.fecha.toISOString(),
        comentario: row.comentario,
        almacen: row.warehouse.nombre,
        usuario: row.user?.nombre ?? null,
        itemsCount: row._count.items,
      })),
      total,
      page,
      pageSize,
    );
  }

  async findOne(id: string) {
    const count = await this.prisma.inventoryPhysicalCount.findFirst({
      where: { id, deletedAt: null },
      include: {
        warehouse: { select: { id: true, nombre: true } },
        user: { select: { nombre: true } },
        items: {
          include: {
            product: { select: { id: true, nombre: true, codigoInterno: true } },
          },
        },
      },
    });
    if (!count) throw new NotFoundException('Conteo físico no encontrado');
    return {
      id: count.id,
      estado: count.estado,
      comentario: count.comentario,
      almacen: count.warehouse.nombre,
      warehouseId: count.warehouse.id,
      usuario: count.user?.nombre ?? null,
      items: count.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        producto: item.product.nombre,
        codigoInterno: item.product.codigoInterno,
        codigoLote: item.codigoLote,
        stockSistema: item.stockSistema.toString(),
        stockContado: item.stockContado.toString(),
        diferencia: item.stockContado.minus(item.stockSistema).toString(),
      })),
    };
  }

  async create(dto: CreatePhysicalCountDto, actorId?: string) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: dto.warehouseId, deletedAt: null },
      select: { id: true },
    });
    if (!warehouse) throw new NotFoundException('Almacén no encontrado');

    const created = await this.prisma.inventoryPhysicalCount.create({
      data: {
        warehouseId: dto.warehouseId,
        userId: actorId ?? null,
        comentario: dto.comentario?.trim() || null,
      },
      select: { id: true },
    });

    await this.audit.log({
      userId: actorId,
      action: 'CREATE',
      entity: 'InventoryPhysicalCount',
      entityId: created.id,
    });

    return { id: created.id };
  }

  async upsertItem(countId: string, dto: UpsertPhysicalCountItemDto) {
    const count = await this.loadOpenCount(countId);
    const systemQty = await this.resolveSystemQty(
      count.warehouseId,
      dto.productId,
      dto.codigoLote,
    );

    const stockContado = new Prisma.Decimal(dto.stockContado);
    const existing = await this.prisma.inventoryPhysicalCountItem.findFirst({
      where: {
        countId,
        productId: dto.productId,
        codigoLote: dto.codigoLote?.trim() || null,
      },
      select: { id: true },
    });

    if (existing) {
      await this.prisma.inventoryPhysicalCountItem.update({
        where: { id: existing.id },
        data: { stockContado, stockSistema: systemQty },
      });
    } else {
      await this.prisma.inventoryPhysicalCountItem.create({
        data: {
          countId,
          productId: dto.productId,
          codigoLote: dto.codigoLote?.trim() || null,
          stockSistema: systemQty,
          stockContado,
        },
      });
    }

    return { ok: true };
  }

  async finalize(countId: string, actorId: string) {
    const count = await this.prisma.inventoryPhysicalCount.findFirst({
      where: { id: countId, deletedAt: null, estado: InventoryPhysicalCountStatus.EN_PROCESO },
      include: { items: true },
    });
    if (!count) throw new NotFoundException('Conteo no encontrado o ya finalizado');

    for (const item of count.items) {
      const delta = item.stockContado.minus(item.stockSistema);
      if (delta.isZero()) continue;

      await this.movements.createAdjustment(
        {
          productId: item.productId,
          warehouseId: count.warehouseId,
          countedQuantity: Number(item.stockContado.toString()),
          lotCode: item.codigoLote ?? undefined,
          reason: `Conteo físico ${countId}`,
        },
        actorId,
      );
    }

    await this.prisma.inventoryPhysicalCount.update({
      where: { id: countId },
      data: { estado: InventoryPhysicalCountStatus.FINALIZADO },
    });

    await this.audit.log({
      userId: actorId,
      action: 'FINALIZE',
      entity: 'InventoryPhysicalCount',
      entityId: countId,
    });

    return { ok: true, message: 'Conteo finalizado; ajustes generados según diferencias' };
  }

  private async loadOpenCount(id: string) {
    const count = await this.prisma.inventoryPhysicalCount.findFirst({
      where: { id, deletedAt: null, estado: InventoryPhysicalCountStatus.EN_PROCESO },
      select: { id: true, warehouseId: true },
    });
    if (!count) throw new BadRequestException('Conteo no disponible para edición');
    return count;
  }

  private async resolveSystemQty(warehouseId: string, productId: string, lotCode?: string) {
    if (lotCode?.trim()) {
      const lot = await this.prisma.productLotStock.findFirst({
        where: { warehouseId, productId, codigoLote: lotCode.trim(), deletedAt: null },
        select: { stock: true },
      });
      return lot?.stock ?? new Prisma.Decimal(0);
    }
    const stock = await this.prisma.productWarehouseStock.findUnique({
      where: { productId_warehouseId: { productId, warehouseId } },
      select: { cantidad: true },
    });
    return stock?.cantidad ?? new Prisma.Decimal(0);
  }
}
