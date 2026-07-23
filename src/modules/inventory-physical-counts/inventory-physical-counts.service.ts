import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InventoryPhysicalCountStatus, Prisma } from '../../generated/prisma/client';
import { buildPaginatedResult, paginationArgs } from '../../common/dto/pagination.dto';
import { AuditLogService } from '../../common/services/audit-log.service';
import { EstablishmentScopeService } from '../../common/scoping/establishment-scope.service';
import { actorFromJwt, tenantWhere } from '../../common/scoping/tenant-scope.util';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { InventoryMovementsService } from '../inventory-movements/inventory-movements.service';
import { CreatePhysicalCountDto } from './dto/create-physical-count.dto';
import { UpsertPhysicalCountItemDto } from './dto/upsert-physical-count-item.dto';

@Injectable()
export class InventoryPhysicalCountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
    private readonly movements: InventoryMovementsService,
    private readonly scope: EstablishmentScopeService,
  ) {}

  async findAll(page = 1, pageSize = 10, actor: JwtRequestUser) {
    const { skip, take } = paginationArgs({ page, pageSize });
    const where: Prisma.InventoryPhysicalCountWhereInput = {
      deletedAt: null,
      warehouse: { establishment: tenantWhere(actorFromJwt(actor)) },
    };
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

  async findOne(id: string, actor: JwtRequestUser) {
    const count = await this.prisma.inventoryPhysicalCount.findFirst({
      where: {
        id,
        deletedAt: null,
        warehouse: { establishment: tenantWhere(actorFromJwt(actor)) },
      },
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
    await this.scope.assertWarehouseInTenant(actor, count.warehouse.id);
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

  async create(dto: CreatePhysicalCountDto, actor: JwtRequestUser) {
    await this.scope.assertWarehouseInTenant(actor, dto.warehouseId);
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: dto.warehouseId, deletedAt: null },
      select: { id: true },
    });
    if (!warehouse) throw new NotFoundException('Almacén no encontrado');

    const created = await this.prisma.inventoryPhysicalCount.create({
      data: {
        warehouseId: dto.warehouseId,
        userId: actor.sub,
        comentario: dto.comentario?.trim() || null,
      },
      select: { id: true },
    });

    await this.audit.log({
      userId: actor.sub,
      action: 'CREATE',
      entity: 'InventoryPhysicalCount',
      entityId: created.id,
    });

    return { id: created.id };
  }

  async upsertItem(countId: string, dto: UpsertPhysicalCountItemDto, actor: JwtRequestUser) {
    const count = await this.loadOpenCount(countId, actor);
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

  async finalize(countId: string, actor: JwtRequestUser) {
    const count = await this.prisma.inventoryPhysicalCount.findFirst({
      where: {
        id: countId,
        deletedAt: null,
        estado: InventoryPhysicalCountStatus.EN_PROCESO,
        warehouse: { establishment: tenantWhere(actorFromJwt(actor)) },
      },
      include: { items: true },
    });
    if (!count) throw new NotFoundException('Conteo no encontrado o ya finalizado');

    let applied = 0;
    let pendingApproval = 0;
    for (const item of count.items) {
      const delta = item.stockContado.minus(item.stockSistema);
      if (delta.isZero()) continue;

      const result = await this.movements.createAdjustment(
        {
          productId: item.productId,
          warehouseId: count.warehouseId,
          countedQuantity: Number(item.stockContado.toString()),
          lotCode: item.codigoLote ?? undefined,
          reason: `Conteo físico ${countId}`,
        },
        actor,
      );
      if (result.pendingApproval) pendingApproval += 1;
      else if (result.applied) applied += 1;
    }

    if (pendingApproval > 0) {
      return {
        ok: true,
        finalized: false,
        applied,
        pendingApproval,
        message: `${applied} ajuste(s) aplicados; ${pendingApproval} pendiente(s) de aprobación. El conteo permanece en proceso hasta aprobar los ajustes.`,
      };
    }

    await this.prisma.inventoryPhysicalCount.update({
      where: { id: countId },
      data: { estado: InventoryPhysicalCountStatus.FINALIZADO },
    });

    await this.audit.log({
      userId: actor.sub,
      action: 'FINALIZE',
      entity: 'InventoryPhysicalCount',
      entityId: countId,
    });

    return {
      ok: true,
      finalized: true,
      applied,
      pendingApproval: 0,
      message: 'Conteo finalizado; ajustes generados según diferencias',
    };
  }

  private async loadOpenCount(id: string, actor: JwtRequestUser) {
    const count = await this.prisma.inventoryPhysicalCount.findFirst({
      where: {
        id,
        deletedAt: null,
        estado: InventoryPhysicalCountStatus.EN_PROCESO,
        warehouse: { establishment: tenantWhere(actorFromJwt(actor)) },
      },
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
