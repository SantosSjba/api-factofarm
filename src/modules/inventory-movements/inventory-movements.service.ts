import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InventoryMovementType,
  InventoryPendingAdjustmentStatus,
  Prisma,
  ProductSerialStatus,
} from '../../generated/prisma/client';
import { buildPaginatedResult, paginationArgs } from '../../common/dto/pagination.dto';
import { AuditLogService } from '../../common/services/audit-log.service';
import { EstablishmentScopeService } from '../../common/scoping/establishment-scope.service';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { PrismaService } from '../../prisma/prisma.service';
import * as XLSX from 'xlsx';
import { CreateInboundMovementDto } from './dto/create-inbound-movement.dto';
import { CreateOutboundMovementDto } from './dto/create-outbound-movement.dto';
import { ImportInventoryFileDto } from './dto/import-inventory-file.dto';
import { InventoryMovementListQueryDto } from './dto/inventory-movement-list-query.dto';
import { InventoryImportTemplateMode } from './dto/inventory-import-template-query.dto';
import { LotCodeSearchQueryDto } from './dto/lot-code-search-query.dto';
import { InventoryLotListQueryDto } from './dto/inventory-lot-list-query.dto';
import { KardexQueryDto } from './dto/kardex-query.dto';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { InventoryValuationReportQueryDto } from './dto/inventory-valuation-report-query.dto';
import { DispatchSaleStockDto } from './dto/dispatch-sale-stock.dto';
import {
  SaleLotAllocationMode,
  SaleLotAllocationPreviewDto,
} from './dto/sale-lot-allocation-preview.dto';
import {
  InventoryLotAllocationService,
  type LotAllocationLine,
} from './inventory-lot-allocation.service';

const ADJUST_OUT_CODE = 'OUT_AJUSTE_DIFERENCIA';
const ADJUST_IN_CODE = 'INGRESO_OTROS';
const SALE_OUT_CODE = 'OUT_VENTA_NACIONAL';

const serialAvailableStates: ProductSerialStatus[] = [
  ProductSerialStatus.DISPONIBLE,
  ProductSerialStatus.RESERVADO,
];

@Injectable()
export class InventoryMovementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lotAllocation: InventoryLotAllocationService,
    private readonly audit: AuditLogService,
    private readonly scope: EstablishmentScopeService,
  ) {}

  async list(query: InventoryMovementListQueryDto, actor: JwtRequestUser) {
    const establishmentId = this.scope.resolve(actor, query.establishmentId);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const search = query.search?.trim();
    const field = query.field ?? 'producto';
    const or: Prisma.ProductWarehouseStockWhereInput[] = [];
    if (search) {
      if (field === 'all' || field === 'producto') {
        or.push({ product: { nombre: { contains: search, mode: 'insensitive' } } });
      }
      if (field === 'all' || field === 'marca') {
        or.push({ product: { brand: { nombre: { contains: search, mode: 'insensitive' } } } });
      }
      if (field === 'all' || field === 'almacen') {
        or.push({ warehouse: { nombre: { contains: search, mode: 'insensitive' } } });
      }
    }
    const where: Prisma.ProductWarehouseStockWhereInput = {
      product: {
        deletedAt: null,
        ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      },
      warehouse: {
        deletedAt: null,
        establishmentId,
        ...(query.warehouseId ? { id: query.warehouseId } : {}),
      },
      ...(or.length ? { OR: or } : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.productWarehouseStock.count({ where }),
      this.prisma.productWarehouseStock.findMany({
        where,
        orderBy: [{ product: { nombre: 'asc' } }, { warehouse: { nombre: 'asc' } }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          cantidad: true,
          product: {
            select: {
              id: true,
              nombre: true,
              codigoInterno: true,
              brand: { select: { nombre: true } },
            },
          },
          warehouse: {
            select: {
              id: true,
              nombre: true,
              establishment: { select: { nombre: true } },
            },
          },
        },
      }),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        productId: row.product.id,
        producto: row.product.nombre,
        codigoInterno: row.product.codigoInterno ?? null,
        marca: row.product.brand?.nombre ?? '—',
        almacen: row.warehouse.nombre,
        stock: row.cantidad.toString(),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  listWarehouses() {
    return this.prisma.warehouse.findMany({
      where: { deletedAt: null },
      orderBy: [{ establishmentId: 'asc' }, { nombre: 'asc' }],
      select: {
        id: true,
        nombre: true,
        establishment: { select: { id: true, nombre: true, codigo: true } },
      },
    });
  }

  listTransferReasons() {
    return this.prisma.inventoryTransferReason.findMany({
      where: { deletedAt: null, activo: true, codigo: { not: { startsWith: 'OUT_' } } },
      orderBy: { nombre: 'asc' },
      select: {
        id: true,
        codigo: true,
        nombre: true,
      },
    });
  }

  listOutputReasons() {
    return this.prisma.inventoryTransferReason.findMany({
      where: { deletedAt: null, activo: true, codigo: { startsWith: 'OUT_' } },
      orderBy: { nombre: 'asc' },
      select: {
        id: true,
        codigo: true,
        nombre: true,
      },
    });
  }

  async searchLotCodes(query: LotCodeSearchQueryDto) {
    const mode = query.mode ?? 'INBOUND';
    const search = query.search?.trim();
    const rows = await this.prisma.productLotStock.findMany({
      where: {
        productId: query.productId,
        warehouseId: query.warehouseId,
        deletedAt: null,
        ...(search ? { codigoLote: { contains: search, mode: 'insensitive' } } : {}),
        ...(mode === 'OUTBOUND' ? { stock: { gt: new Prisma.Decimal(0) } } : {}),
      },
      orderBy: [{ codigoLote: 'asc' }],
      take: 20,
      select: {
        id: true,
        codigoLote: true,
        stock: true,
        fechaVencimiento: true,
      },
    });
    return rows.map((row) => ({
      id: row.id,
      codigoLote: row.codigoLote,
      stock: row.stock.toString(),
      fechaVencimiento: row.fechaVencimiento?.toISOString() ?? null,
    }));
  }

  async listLots(query: InventoryLotListQueryDto, actor: JwtRequestUser) {
    const establishmentId = this.scope.resolve(actor, query.establishmentId);
    const { page, pageSize, skip, take } = paginationArgs({
      page: query.page,
      pageSize: query.pageSize,
    });
    const search = query.search?.trim();
    const field = query.field ?? 'producto';
    const now = new Date();
    const expiryWhere = this.buildExpiryWhere(query.expiryFilter, now);

    const or: Prisma.ProductLotStockWhereInput[] = [];
    if (search) {
      if (field === 'all' || field === 'producto') {
        or.push({ product: { nombre: { contains: search, mode: 'insensitive' } } });
      }
      if (field === 'all' || field === 'lote') {
        or.push({ codigoLote: { contains: search, mode: 'insensitive' } });
      }
      if (field === 'all' || field === 'almacen') {
        or.push({ warehouse: { nombre: { contains: search, mode: 'insensitive' } } });
      }
    }

    const where: Prisma.ProductLotStockWhereInput = {
      deletedAt: null,
      stock: { gt: 0 },
      product: {
        deletedAt: null,
        ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      },
      warehouse: {
        deletedAt: null,
        establishmentId,
        ...(query.warehouseId ? { id: query.warehouseId } : {}),
      },
      ...expiryWhere,
      ...(or.length ? { OR: or } : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.productLotStock.count({ where }),
      this.prisma.productLotStock.findMany({
        where,
        orderBy: [{ fechaVencimiento: 'asc' }, { codigoLote: 'asc' }],
        skip,
        take,
        select: {
          id: true,
          codigoLote: true,
          stock: true,
          costoUnitario: true,
          fechaVencimiento: true,
          product: {
            select: {
              id: true,
              nombre: true,
              codigoInterno: true,
              stockMinimo: true,
              category: { select: { nombre: true } },
            },
          },
          warehouse: {
            select: {
              id: true,
              nombre: true,
              establishment: { select: { id: true, nombre: true } },
            },
          },
        },
      }),
    ]);

    return buildPaginatedResult(
      rows.map((row) => ({
        id: row.id,
        productId: row.product.id,
        producto: row.product.nombre,
        codigoInterno: row.product.codigoInterno,
        categoria: row.product.category?.nombre ?? '—',
        almacen: row.warehouse.nombre,
        establecimiento: row.warehouse.establishment.nombre,
        codigoLote: row.codigoLote,
        stock: row.stock.toString(),
        costoUnitario: row.costoUnitario?.toString() ?? null,
        fechaVencimiento: row.fechaVencimiento?.toISOString() ?? null,
        stockMinimo: row.product.stockMinimo,
      })),
      total,
      page,
      pageSize,
    );
  }

  async kardex(query: KardexQueryDto, actor: JwtRequestUser) {
    const establishmentId = this.scope.resolve(actor);
    const { page, pageSize, skip, take } = paginationArgs({
      page: query.page,
      pageSize: query.pageSize,
    });
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;

    const where: Prisma.InventoryInboundMovementWhereInput = {
      productId: query.productId,
      deletedAt: null,
      warehouse: {
        deletedAt: null,
        establishmentId,
        ...(query.warehouseId ? { id: query.warehouseId } : {}),
      },
      ...(from || to
        ? {
            fechaRegistro: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.inventoryInboundMovement.count({ where }),
      this.prisma.inventoryInboundMovement.findMany({
        where,
        orderBy: { fechaRegistro: 'asc' },
        skip,
        take,
        select: {
          id: true,
          movementType: true,
          cantidad: true,
          costoUnitario: true,
          codigoLote: true,
          fechaRegistro: true,
          referencia: true,
          comentario: true,
          transferReason: { select: { nombre: true } },
          warehouse: { select: { nombre: true } },
          user: { select: { nombre: true } },
        },
      }),
    ]);

    let saldo = new Prisma.Decimal(0);
    const items = rows.map((row) => {
      saldo = saldo.plus(row.cantidad);
      const unitCost = row.costoUnitario ?? new Prisma.Decimal(0);
      return {
        id: row.id,
        fecha: row.fechaRegistro.toISOString(),
        tipo: row.movementType,
        motivo: row.transferReason.nombre,
        almacen: row.warehouse.nombre,
        lote: row.codigoLote,
        cantidad: row.cantidad.toString(),
        saldo: saldo.toString(),
        costoUnitario: row.costoUnitario?.toString() ?? null,
        valorLinea: row.cantidad.abs().times(unitCost).toString(),
        referencia: row.referencia,
        comentario: row.comentario,
        usuario: row.user?.nombre ?? null,
      };
    });

    return { ...buildPaginatedResult(items, total, page, pageSize) };
  }

  async alerts(actor: JwtRequestUser) {
    const establishmentId = this.scope.resolve(actor);
    const now = new Date();
    const in30 = new Date(now);
    in30.setDate(in30.getDate() + 30);
    const in60 = new Date(now);
    in60.setDate(in60.getDate() + 60);
    const in90 = new Date(now);
    in90.setDate(in90.getDate() + 90);

    const lotScope = { warehouse: { establishmentId } };
    const [vencidos, porVencer30, porVencer60, porVencer90, zonasFrioSinLogHoy] = await Promise.all([
        this.prisma.productLotStock.count({
          where: {
            deletedAt: null,
            stock: { gt: 0 },
            fechaVencimiento: { lt: now },
            ...lotScope,
          },
        }),
        this.prisma.productLotStock.count({
          where: {
            deletedAt: null,
            stock: { gt: 0 },
            fechaVencimiento: { gte: now, lte: in30 },
            ...lotScope,
          },
        }),
        this.prisma.productLotStock.count({
          where: {
            deletedAt: null,
            stock: { gt: 0 },
            fechaVencimiento: { gt: in30, lte: in60 },
            ...lotScope,
          },
        }),
        this.prisma.productLotStock.count({
          where: {
            deletedAt: null,
            stock: { gt: 0 },
            fechaVencimiento: { gt: in60, lte: in90 },
            ...lotScope,
          },
        }),
        this.prisma.warehouseZone.count({
          where: {
            deletedAt: null,
            activo: true,
            tipo: 'REFRIGERADO',
            warehouse: { establishmentId },
            temperatureLogs: {
              none: {
                fecha: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
              },
            },
          },
        }),
      ]);

    const stockBajoCount = await this.countLowStock(establishmentId);

    return {
      stockBajo: stockBajoCount,
      lotesVencidos: vencidos,
      porVencer30,
      porVencer60,
      porVencer90,
      zonasFrioSinLogHoy,
    };
  }

  async createAdjustment(dto: CreateAdjustmentDto, actorId: string) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: dto.warehouseId, deletedAt: null },
      select: {
        id: true,
        establishment: {
          select: { adjustmentQtyThreshold: true },
        },
      },
    });
    if (!warehouse) throw new NotFoundException('Almacén no encontrado');

    const systemQty = await this.resolveSystemQuantity(
      dto.productId,
      dto.warehouseId,
      dto.lotCode,
    );
    const counted = new Prisma.Decimal(dto.countedQuantity);
    const delta = counted.minus(systemQty);
    if (delta.isZero()) {
      return { ok: true, message: 'Sin diferencia de stock', applied: true };
    }

    const threshold = warehouse.establishment.adjustmentQtyThreshold;
    if (delta.abs().greaterThanOrEqualTo(threshold)) {
      const pending = await this.prisma.inventoryPendingAdjustment.create({
        data: {
          productId: dto.productId,
          warehouseId: dto.warehouseId,
          codigoLote: dto.lotCode?.trim() || null,
          cantidadAjuste: delta,
          motivo: dto.reason.trim(),
          requestedById: actorId,
        },
        select: { id: true },
      });
      return {
        ok: true,
        applied: false,
        pendingApproval: true,
        pendingId: pending.id,
        message: 'Ajuste enviado a aprobación (supera umbral configurado)',
      };
    }

    await this.executeAdjustmentDelta({
      productId: dto.productId,
      warehouseId: dto.warehouseId,
      lotCode: dto.lotCode?.trim() || null,
      delta,
      reason: dto.reason.trim(),
      userId: actorId,
    });

    await this.audit.log({
      userId: actorId,
      action: 'ADJUST',
      entity: 'InventoryMovement',
      diff: {
        productId: dto.productId,
        warehouseId: dto.warehouseId,
        lotCode: dto.lotCode?.trim() || null,
        delta: delta.toString(),
        reason: dto.reason.trim(),
      },
    });

    return { ok: true, applied: true, message: 'Ajuste aplicado correctamente' };
  }

  async listPendingAdjustments(actor: JwtRequestUser) {
    const establishmentId = this.scope.resolve(actor);
    return this.prisma.inventoryPendingAdjustment.findMany({
      where: {
        estado: InventoryPendingAdjustmentStatus.PENDIENTE,
        deletedAt: null,
        warehouse: { establishmentId },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        cantidadAjuste: true,
        codigoLote: true,
        motivo: true,
        createdAt: true,
        product: { select: { id: true, nombre: true, codigoInterno: true } },
        warehouse: { select: { id: true, nombre: true } },
        requestedBy: { select: { id: true, nombre: true } },
      },
    });
  }

  async approveAdjustment(id: string, actorId: string) {
    const pending = await this.prisma.inventoryPendingAdjustment.findFirst({
      where: { id, deletedAt: null, estado: InventoryPendingAdjustmentStatus.PENDIENTE },
    });
    if (!pending) throw new NotFoundException('Ajuste pendiente no encontrado');
    if (pending.requestedById === actorId) {
      throw new ForbiddenException('Otro usuario debe aprobar el ajuste');
    }

    await this.executeAdjustmentDelta({
      productId: pending.productId,
      warehouseId: pending.warehouseId,
      lotCode: pending.codigoLote,
      delta: pending.cantidadAjuste,
      reason: pending.motivo,
      userId: actorId,
    });

    await this.prisma.inventoryPendingAdjustment.update({
      where: { id },
      data: {
        estado: InventoryPendingAdjustmentStatus.APROBADO,
        approvedById: actorId,
        approvedAt: new Date(),
      },
    });

    await this.audit.log({
      userId: actorId,
      action: 'ADJUST_APPROVE',
      entity: 'InventoryPendingAdjustment',
      entityId: id,
    });

    return { ok: true, message: 'Ajuste aprobado y aplicado' };
  }

  async rejectAdjustment(id: string, actorId: string) {
    const pending = await this.prisma.inventoryPendingAdjustment.findFirst({
      where: { id, deletedAt: null, estado: InventoryPendingAdjustmentStatus.PENDIENTE },
      select: { id: true, requestedById: true },
    });
    if (!pending) throw new NotFoundException('Ajuste pendiente no encontrado');
    if (pending.requestedById === actorId) {
      throw new ForbiddenException('Otro usuario debe rechazar el ajuste');
    }

    await this.prisma.inventoryPendingAdjustment.update({
      where: { id },
      data: {
        estado: InventoryPendingAdjustmentStatus.RECHAZADO,
        approvedById: actorId,
        approvedAt: new Date(),
      },
    });

    return { ok: true, message: 'Ajuste rechazado' };
  }

  async valuationReport(query: InventoryValuationReportQueryDto, actor: JwtRequestUser) {
    const establishmentId = this.scope.resolve(actor, query.establishmentId);
    const { page, pageSize, skip, take } = paginationArgs({
      page: query.page,
      pageSize: query.pageSize,
    });

    const where: Prisma.ProductWarehouseStockWhereInput = {
      product: { deletedAt: null },
      warehouse: {
        deletedAt: null,
        establishmentId,
        ...(query.warehouseId ? { id: query.warehouseId } : {}),
      },
      cantidad: { gt: 0 },
    };

    const [total, rows] = await Promise.all([
      this.prisma.productWarehouseStock.count({ where }),
      this.prisma.productWarehouseStock.findMany({
        where,
        skip,
        take,
        orderBy: [{ warehouse: { nombre: 'asc' } }, { product: { nombre: 'asc' } }],
        select: {
          cantidad: true,
          product: {
            select: {
              id: true,
              nombre: true,
              codigoInterno: true,
              costoUnitario: true,
            },
          },
          warehouse: {
            select: {
              id: true,
              nombre: true,
              establishment: {
                select: { nombre: true, inventoryValuationMethod: true },
              },
            },
          },
        },
      }),
    ]);

    const items = await Promise.all(
      rows.map(async (row) => {
        const method = row.warehouse.establishment.inventoryValuationMethod;
        const unitCost = await this.resolveUnitCost(
          row.product.id,
          row.warehouse.id,
          method,
          row.product.costoUnitario,
        );
        const totalValue = row.cantidad.times(unitCost);
        return {
          productId: row.product.id,
          producto: row.product.nombre,
          codigoInterno: row.product.codigoInterno,
          almacen: row.warehouse.nombre,
          establecimiento: row.warehouse.establishment.nombre,
          metodoValoracion: method,
          stock: row.cantidad.toString(),
          costoUnitario: unitCost.toString(),
          valorTotal: totalValue.toString(),
        };
      }),
    );

    const grandTotal = items.reduce(
      (acc, row) => acc.plus(new Prisma.Decimal(row.valorTotal)),
      new Prisma.Decimal(0),
    );

    return {
      ...buildPaginatedResult(items, total, page, pageSize),
      valorTotalPagina: grandTotal.toString(),
    };
  }

  /** Aplica delta de ajuste (usado por conteo físico y aprobaciones). */
  async executeAdjustmentDelta(input: {
    productId: string;
    warehouseId: string;
    lotCode: string | null;
    delta: Prisma.Decimal;
    reason: string;
    userId: string;
  }) {
    if (input.delta.isZero()) return;

    const isInbound = input.delta.greaterThan(0);
    const reasonCode = isInbound ? ADJUST_IN_CODE : ADJUST_OUT_CODE;
    const transferReason = await this.prisma.inventoryTransferReason.findFirst({
      where: { codigo: reasonCode, deletedAt: null, activo: true },
      select: { id: true },
    });
    if (!transferReason) {
      throw new BadRequestException(`Motivo de ajuste no configurado (${reasonCode})`);
    }

    const amount = input.delta.abs();

    await this.prisma.$transaction(async (tx) => {
      await tx.inventoryInboundMovement.create({
        data: {
          productId: input.productId,
          warehouseId: input.warehouseId,
          transferReasonId: transferReason.id,
          movementType: InventoryMovementType.AJUSTE,
          cantidad: isInbound ? amount : amount.negated(),
          codigoLote: input.lotCode,
          comentario: input.reason,
          userId: input.userId,
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

        if (isInbound) {
          if (lot) {
            await tx.productLotStock.update({
              where: { id: lot.id },
              data: { stock: lot.stock.plus(amount) },
            });
          } else {
            await tx.productLotStock.create({
              data: {
                productId: input.productId,
                warehouseId: input.warehouseId,
                codigoLote: input.lotCode,
                stock: amount,
              },
            });
          }
        } else {
          if (!lot || lot.stock.lessThan(amount)) {
            throw new BadRequestException('Stock insuficiente en el lote para el ajuste');
          }
          await tx.productLotStock.update({
            where: { id: lot.id },
            data: { stock: lot.stock.minus(amount) },
          });
        }
      }

      const current = await tx.productWarehouseStock.findUnique({
        where: {
          productId_warehouseId: {
            productId: input.productId,
            warehouseId: input.warehouseId,
          },
        },
        select: { cantidad: true },
      });
      const base = current?.cantidad ?? new Prisma.Decimal(0);
      const next = base.plus(input.delta);
      if (next.lessThan(0)) {
        throw new BadRequestException('El ajuste dejaría stock negativo');
      }

      await tx.productWarehouseStock.upsert({
        where: {
          productId_warehouseId: {
            productId: input.productId,
            warehouseId: input.warehouseId,
          },
        },
        update: { cantidad: next },
        create: {
          productId: input.productId,
          warehouseId: input.warehouseId,
          cantidad: next,
        },
      });
    });
  }

  async createInboundMovement(dto: CreateInboundMovementDto, actorId?: string) {
    const [product, warehouse, transferReason] = await Promise.all([
      this.prisma.product.findFirst({
        where: { id: dto.productId, deletedAt: null },
        select: { id: true, nombre: true },
      }),
      this.prisma.warehouse.findFirst({
        where: { id: dto.warehouseId, deletedAt: null },
        select: { id: true, nombre: true },
      }),
      this.prisma.inventoryTransferReason.findFirst({
        where: { id: dto.transferReasonId, deletedAt: null, activo: true },
        select: { id: true, nombre: true },
      }),
    ]);
    if (!product) throw new NotFoundException('Producto no encontrado');
    if (!warehouse) throw new NotFoundException('Almacén no encontrado');
    if (!transferReason) throw new NotFoundException('Motivo de traslado no encontrado');

    const amount = new Prisma.Decimal(dto.quantity);
    const fechaVencimiento = dto.expirationDate ? new Date(dto.expirationDate) : null;
    const fechaRegistro = dto.registeredAt ? new Date(dto.registeredAt) : new Date();
    if (Number.isNaN(fechaRegistro.getTime())) {
      throw new BadRequestException('Fecha de registro inválida');
    }
    if (fechaVencimiento && Number.isNaN(fechaVencimiento.getTime())) {
      throw new BadRequestException('Fecha de vencimiento inválida');
    }

    await this.prisma.$transaction(async (tx) => {
      const unitCost =
        dto.unitCost != null ? new Prisma.Decimal(dto.unitCost) : null;

      await tx.inventoryInboundMovement.create({
        data: {
          productId: product.id,
          warehouseId: warehouse.id,
          transferReasonId: transferReason.id,
          movementType: InventoryMovementType.INGRESO,
          cantidad: amount,
          costoUnitario: unitCost,
          codigoLote: dto.lotCode || null,
          fechaVencimiento,
          fechaRegistro,
          referencia: dto.reference || null,
          comentario: dto.comment || null,
          userId: actorId ?? null,
        },
      });

      if (dto.lotCode) {
        const existingLot = await tx.productLotStock.findFirst({
          where: {
            productId: product.id,
            warehouseId: warehouse.id,
            codigoLote: dto.lotCode,
            deletedAt: null,
          },
          select: { id: true, stock: true },
        });
        if (existingLot) {
          await tx.productLotStock.update({
            where: { id: existingLot.id },
            data: {
              stock: existingLot.stock.plus(amount),
              fechaVencimiento: fechaVencimiento ?? undefined,
              costoUnitario: unitCost ?? undefined,
            },
          });
        } else {
          await tx.productLotStock.create({
            data: {
              productId: product.id,
              warehouseId: warehouse.id,
              codigoLote: dto.lotCode,
              stock: amount,
              costoUnitario: unitCost,
              fechaVencimiento,
            },
          });
        }
      }

      const current = await tx.productWarehouseStock.findUnique({
        where: {
          productId_warehouseId: {
            productId: product.id,
            warehouseId: warehouse.id,
          },
        },
        select: { cantidad: true },
      });
      await tx.productWarehouseStock.upsert({
        where: {
          productId_warehouseId: {
            productId: product.id,
            warehouseId: warehouse.id,
          },
        },
        update: { cantidad: (current?.cantidad ?? new Prisma.Decimal(0)).plus(amount) },
        create: {
          productId: product.id,
          warehouseId: warehouse.id,
          cantidad: amount,
        },
      });
    });

    await this.audit.log({
      userId: actorId,
      action: 'INBOUND',
      entity: 'InventoryMovement',
      diff: {
        productId: product.id,
        warehouseId: warehouse.id,
        quantity: amount.toString(),
        lotCode: dto.lotCode || null,
      },
    });

    return {
      ok: true,
      message: 'Ingreso registrado correctamente',
    };
  }

  async listSaleAvailableLots(productId: string, warehouseId: string) {
    const policy = await this.lotAllocation.getPolicyFromWarehouse(warehouseId);
    const lots = await this.lotAllocation.listEligibleLots(productId, warehouseId, policy);
    return {
      metodoAsignacion: policy.inventoryLotAllocationMethod,
      blockExpiredProductSales: policy.blockExpiredProductSales,
      items: lots.map((lot) => ({
        id: lot.id,
        codigoLote: lot.codigoLote,
        stock: lot.stock.toString(),
        fechaVencimiento: lot.fechaVencimiento?.toISOString() ?? null,
        vencido: lot.vencido,
      })),
    };
  }

  async previewSaleLotAllocation(dto: SaleLotAllocationPreviewDto) {
    const { policy, lines } = await this.resolveSaleLotAllocation(dto);
    const eligible = await this.lotAllocation.listEligibleLots(
      dto.productId,
      dto.warehouseId,
      policy,
    );
    return {
      mode: dto.mode,
      quantity: String(dto.quantity),
      metodoAsignacion: policy.inventoryLotAllocationMethod,
      blockExpiredProductSales: policy.blockExpiredProductSales,
      lotesDisponibles: eligible.map((lot) => ({
        codigoLote: lot.codigoLote,
        stock: lot.stock.toString(),
        fechaVencimiento: lot.fechaVencimiento?.toISOString() ?? null,
        vencido: lot.vencido,
      })),
      asignacion: lines,
    };
  }

  async dispatchSaleStock(dto: DispatchSaleStockDto, actorId: string) {
    const previewDto: SaleLotAllocationPreviewDto = {
      productId: dto.productId,
      warehouseId: dto.warehouseId,
      quantity: dto.quantity,
      mode: dto.mode,
      manualLots: dto.manualLots,
    };
    const { lines } = await this.resolveSaleLotAllocation(previewDto);

    const transferReason = await this.prisma.inventoryTransferReason.findFirst({
      where: { codigo: SALE_OUT_CODE, deletedAt: null, activo: true },
      select: { id: true },
    });
    if (!transferReason) {
      throw new BadRequestException(`Motivo de venta no configurado (${SALE_OUT_CODE})`);
    }

    await this.executeOutboundWithLotLines({
      productId: dto.productId,
      warehouseId: dto.warehouseId,
      transferReasonId: transferReason.id,
      lines: lines.map((line) => ({
        codigoLote: line.codigoLote,
        cantidad: new Prisma.Decimal(line.cantidad),
      })),
      fechaRegistro: new Date(),
      reference: dto.reference ?? null,
      comment: dto.comment ?? null,
      userId: actorId,
    });

    return {
      ok: true,
      message: 'Salida de venta registrada con trazabilidad por lote',
      asignacion: lines,
    };
  }

  async createOutboundMovement(dto: CreateOutboundMovementDto, actorId?: string) {
    const [product, warehouse, transferReason, currentStock, policy] = await Promise.all([
      this.prisma.product.findFirst({
        where: { id: dto.productId, deletedAt: null },
        select: { id: true, nombre: true, manejaLotes: true },
      }),
      this.prisma.warehouse.findFirst({
        where: { id: dto.warehouseId, deletedAt: null },
        select: { id: true, nombre: true },
      }),
      this.prisma.inventoryTransferReason.findFirst({
        where: {
          id: dto.transferReasonId,
          deletedAt: null,
          activo: true,
          codigo: { startsWith: 'OUT_' },
        },
        select: { id: true, nombre: true },
      }),
      this.prisma.productWarehouseStock.findUnique({
        where: {
          productId_warehouseId: {
            productId: dto.productId,
            warehouseId: dto.warehouseId,
          },
        },
        select: { cantidad: true },
      }),
      this.lotAllocation.getPolicyFromWarehouse(dto.warehouseId),
    ]);
    if (!product) throw new NotFoundException('Producto no encontrado');
    if (!warehouse) throw new NotFoundException('Almacén no encontrado');
    if (!transferReason) throw new NotFoundException('Motivo de salida no encontrado');

    const amount = new Prisma.Decimal(dto.quantity);
    const current = currentStock?.cantidad ?? new Prisma.Decimal(0);
    if (current.lessThan(amount)) {
      throw new BadRequestException('Stock insuficiente para realizar la salida');
    }
    const fechaRegistro = dto.registeredAt ? new Date(dto.registeredAt) : new Date();
    if (Number.isNaN(fechaRegistro.getTime())) {
      throw new BadRequestException('Fecha de registro inválida');
    }

    let lotLines: { codigoLote: string; cantidad: Prisma.Decimal }[] = [];

    if (dto.lotCode?.trim()) {
      const lot = await this.prisma.productLotStock.findFirst({
        where: {
          productId: product.id,
          warehouseId: warehouse.id,
          codigoLote: dto.lotCode.trim(),
          deletedAt: null,
        },
        select: { id: true, stock: true, fechaVencimiento: true, codigoLote: true },
      });
      if (!lot) {
        throw new BadRequestException('No existe el lote indicado en el almacén seleccionado');
      }
      this.lotAllocation.assertLotSellable(
        lot.fechaVencimiento,
        policy.blockExpiredProductSales,
        lot.codigoLote,
      );
      if (lot.stock.lessThan(amount)) {
        throw new BadRequestException('Stock insuficiente en el lote indicado');
      }
      lotLines = [{ codigoLote: lot.codigoLote, cantidad: amount }];
    } else {
      const eligibleLots = await this.lotAllocation.listEligibleLots(
        product.id,
        warehouse.id,
        policy,
      );
      if (eligibleLots.length > 0) {
        const planned = this.lotAllocation.planAutoAllocation(eligibleLots, amount);
        lotLines = planned.map((line) => ({
          codigoLote: line.codigoLote,
          cantidad: new Prisma.Decimal(line.cantidad),
        }));
      }
    }

    await this.executeOutboundWithLotLines({
      productId: product.id,
      warehouseId: warehouse.id,
      transferReasonId: transferReason.id,
      lines: lotLines,
      totalQuantity: amount,
      fechaRegistro,
      reference: dto.reference ?? null,
      comment: dto.comment ?? null,
      userId: actorId ?? null,
    });

    await this.audit.log({
      userId: actorId,
      action: 'OUTBOUND',
      entity: 'InventoryMovement',
      diff: {
        productId: product.id,
        warehouseId: warehouse.id,
        quantity: amount.toString(),
        lotCode: dto.lotCode?.trim() || null,
      },
    });

    return {
      ok: true,
      message: 'Salida registrada correctamente',
      asignacionAutomatica: lotLines.length > 0 && !dto.lotCode?.trim(),
      lotes: lotLines.map((line) => ({
        codigoLote: line.codigoLote,
        cantidad: line.cantidad.toString(),
      })),
    };
  }

  private async resolveSaleLotAllocation(dto: SaleLotAllocationPreviewDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, deletedAt: null },
      select: { id: true },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');

    const policy = await this.lotAllocation.getPolicyFromWarehouse(dto.warehouseId);
    const eligible = await this.lotAllocation.listEligibleLots(
      dto.productId,
      dto.warehouseId,
      policy,
    );
    const quantity = new Prisma.Decimal(dto.quantity);

    let lines: LotAllocationLine[];
    if (dto.mode === SaleLotAllocationMode.MANUAL) {
      if (!dto.manualLots?.length) {
        throw new BadRequestException('Indique los lotes para asignación manual');
      }
      lines = this.lotAllocation.planManualAllocation(eligible, dto.manualLots, policy);
      const manualTotal = lines.reduce(
        (acc, line) => acc.plus(new Prisma.Decimal(line.cantidad)),
        new Prisma.Decimal(0),
      );
      if (!manualTotal.equals(quantity)) {
        throw new BadRequestException(
          'La suma de cantidades manuales debe coincidir con la cantidad total',
        );
      }
    } else {
      lines = this.lotAllocation.planAutoAllocation(eligible, quantity);
    }

    return { policy, lines };
  }

  private async executeOutboundWithLotLines(input: {
    productId: string;
    warehouseId: string;
    transferReasonId: string;
    lines: { codigoLote: string; cantidad: Prisma.Decimal }[];
    totalQuantity?: Prisma.Decimal;
    fechaRegistro: Date;
    reference?: string | null;
    comment?: string | null;
    userId?: string | null;
  }) {
    const total =
      input.totalQuantity ??
      input.lines.reduce((acc, line) => acc.plus(line.cantidad), new Prisma.Decimal(0));

    const currentStock = await this.prisma.productWarehouseStock.findUnique({
      where: {
        productId_warehouseId: {
          productId: input.productId,
          warehouseId: input.warehouseId,
        },
      },
      select: { cantidad: true },
    });
    const current = currentStock?.cantidad ?? new Prisma.Decimal(0);
    if (current.lessThan(total)) {
      throw new BadRequestException('Stock insuficiente para realizar la salida');
    }

    await this.prisma.$transaction(async (tx) => {
      if (input.lines.length === 0) {
        await tx.inventoryInboundMovement.create({
          data: {
            productId: input.productId,
            warehouseId: input.warehouseId,
            transferReasonId: input.transferReasonId,
            movementType: InventoryMovementType.SALIDA,
            cantidad: total.negated(),
            fechaRegistro: input.fechaRegistro,
            referencia: input.reference,
            comentario: input.comment,
            userId: input.userId,
          },
        });
      } else {
        for (const line of input.lines) {
          await tx.inventoryInboundMovement.create({
            data: {
              productId: input.productId,
              warehouseId: input.warehouseId,
              transferReasonId: input.transferReasonId,
              movementType: InventoryMovementType.SALIDA,
              cantidad: line.cantidad.negated(),
              codigoLote: line.codigoLote,
              fechaRegistro: input.fechaRegistro,
              referencia: input.reference,
              comentario: input.comment,
              userId: input.userId,
            },
          });

          const existingLot = await tx.productLotStock.findFirst({
            where: {
              productId: input.productId,
              warehouseId: input.warehouseId,
              codigoLote: line.codigoLote,
              deletedAt: null,
            },
            select: { id: true, stock: true },
          });
          if (!existingLot || existingLot.stock.lessThan(line.cantidad)) {
            throw new BadRequestException(`Stock insuficiente en el lote ${line.codigoLote}`);
          }
          await tx.productLotStock.update({
            where: { id: existingLot.id },
            data: { stock: existingLot.stock.minus(line.cantidad) },
          });
        }
      }

      await tx.productWarehouseStock.upsert({
        where: {
          productId_warehouseId: {
            productId: input.productId,
            warehouseId: input.warehouseId,
          },
        },
        update: { cantidad: current.minus(total) },
        create: {
          productId: input.productId,
          warehouseId: input.warehouseId,
          cantidad: new Prisma.Decimal(0),
        },
      });
    });
  }

  async importLots(dto: ImportInventoryFileDto, file: Express.Multer.File) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: dto.warehouseId, deletedAt: null },
      select: { id: true },
    });
    if (!warehouse) throw new NotFoundException('Almacén no encontrado');
    const rows = this.readRows(file);

    let created = 0;
    let updated = 0;
    const errors: string[] = [];
    const touched = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const displayRow = i + 2;
      const codigoInterno = this.cellString(row, 'Código Interno');
      const codigoLote = this.cellString(row, 'Código Lote');
      const stock = this.toNumber(row['Stock']);
      const fechaVenc = this.toDate(row['Fec. Vencimiento']);

      if (!codigoInterno && !codigoLote && stock === null) continue;
      if (!codigoInterno || !codigoLote || stock === null || stock < 0) {
        errors.push(`Fila ${displayRow}: faltan campos obligatorios o stock inválido.`);
        continue;
      }

      try {
        const product = await this.prisma.product.findFirst({
          where: { codigoInterno, deletedAt: null },
          select: { id: true },
        });
        if (!product) throw new BadRequestException(`Producto no encontrado (${codigoInterno})`);

        const existing = await this.prisma.productLotStock.findFirst({
          where: { productId: product.id, warehouseId: warehouse.id, codigoLote, deletedAt: null },
          select: { id: true },
        });

        if (existing) {
          await this.prisma.productLotStock.update({
            where: { id: existing.id },
            data: {
              stock: new Prisma.Decimal(stock),
              fechaVencimiento: fechaVenc,
            },
          });
          updated += 1;
        } else {
          await this.prisma.productLotStock.create({
            data: {
              productId: product.id,
              warehouseId: warehouse.id,
              codigoLote,
              stock: new Prisma.Decimal(stock),
              fechaVencimiento: fechaVenc,
            },
          });
          created += 1;
        }

        await this.prisma.product.update({
          where: { id: product.id },
          data: { manejaLotes: true },
        });
        touched.add(product.id);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error no identificado';
        errors.push(`Fila ${displayRow}: ${message}`);
      }
    }

    for (const productId of touched) {
      await this.recalculateStock(productId, warehouse.id);
    }

    return { totalRows: rows.length, created, updated, errors };
  }

  async importSeries(dto: ImportInventoryFileDto, file: Express.Multer.File) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: dto.warehouseId, deletedAt: null },
      select: { id: true },
    });
    if (!warehouse) throw new NotFoundException('Almacén no encontrado');
    const rows = this.readRows(file);

    let created = 0;
    let updated = 0;
    const errors: string[] = [];
    const touched = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const displayRow = i + 2;
      const codigoInterno = this.cellString(row, 'Código Interno');
      const serie = this.cellString(row, 'Serie');
      const estadoRaw = this.cellString(row, 'Estado');
      const fecha = this.toDate(row['Fecha']);

      if (!codigoInterno && !serie && !estadoRaw) continue;
      if (!codigoInterno || !serie) {
        errors.push(`Fila ${displayRow}: faltan campos obligatorios.`);
        continue;
      }

      try {
        const product = await this.prisma.product.findFirst({
          where: { codigoInterno, deletedAt: null },
          select: { id: true },
        });
        if (!product) throw new BadRequestException(`Producto no encontrado (${codigoInterno})`);

        const { estado, vendido } = this.mapEstado(estadoRaw);
        const existing = await this.prisma.productSerial.findFirst({
          where: { warehouseId: warehouse.id, serie, deletedAt: null },
          select: { id: true },
        });

        if (existing) {
          await this.prisma.productSerial.update({
            where: { id: existing.id },
            data: {
              productId: product.id,
              fecha: fecha ?? undefined,
              estado,
              vendido,
              soldAt: vendido ? new Date() : null,
            },
          });
          updated += 1;
        } else {
          await this.prisma.productSerial.create({
            data: {
              productId: product.id,
              warehouseId: warehouse.id,
              serie,
              fecha: fecha ?? undefined,
              estado,
              vendido,
              soldAt: vendido ? new Date() : null,
            },
          });
          created += 1;
        }

        touched.add(product.id);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error no identificado';
        errors.push(`Fila ${displayRow}: ${message}`);
      }
    }

    for (const productId of touched) {
      await this.recalculateStock(productId, warehouse.id);
    }

    return { totalRows: rows.length, created, updated, errors };
  }

  buildImportTemplateBuffer(mode: InventoryImportTemplateMode) {
    const workbook = XLSX.utils.book_new();
    const rows =
      mode === 'SERIES'
        ? [
            {
              'Código Interno': 'SERBI001',
              Serie: 'SERPXAB1',
              Estado: 'Activo',
              Fecha: '12/10/2023',
            },
          ]
        : [
            {
              'Código Interno': 'BI001',
              'Código Lote': 'LOTZBC001',
              Stock: 40,
              'Fec. Vencimiento': '12/10/2023',
            },
          ];
    const sheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Hoja1');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  private readRows(file: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Archivo no válido para importar');
    }
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const first = workbook.SheetNames[0];
    const sheet = workbook.Sheets[first];
    return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  }

  private async recalculateStock(productId: string, warehouseId: string) {
    const [lots, serialCount] = await Promise.all([
      this.prisma.productLotStock.findMany({
        where: { productId, warehouseId, deletedAt: null },
        select: { stock: true },
      }),
      this.prisma.productSerial.count({
        where: { productId, warehouseId, deletedAt: null, estado: { in: serialAvailableStates } },
      }),
    ]);
    const lotTotal = lots.reduce((acc, row) => acc.plus(row.stock), new Prisma.Decimal(0));
    const total = lotTotal.plus(serialCount);

    await this.prisma.productWarehouseStock.upsert({
      where: {
        productId_warehouseId: {
          productId,
          warehouseId,
        },
      },
      update: { cantidad: total },
      create: {
        productId,
        warehouseId,
        cantidad: total,
      },
    });
  }

  private mapEstado(value: string): { estado: ProductSerialStatus; vendido: boolean } {
    const key = value.trim().toUpperCase();
    if (!key) return { estado: ProductSerialStatus.DISPONIBLE, vendido: false };
    if (key.includes('ACT')) return { estado: ProductSerialStatus.DISPONIBLE, vendido: false };
    if (key.includes('INACT')) return { estado: ProductSerialStatus.ANULADO, vendido: false };
    if (key.includes('VEND')) return { estado: ProductSerialStatus.VENDIDO, vendido: true };
    if (key.includes('RES')) return { estado: ProductSerialStatus.RESERVADO, vendido: false };
    return { estado: ProductSerialStatus.DISPONIBLE, vendido: false };
  }

  private cellString(row: Record<string, unknown>, key: string): string {
    const value = row[key];
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }

  private toNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    const normalized = String(value).replace(',', '.').trim();
    if (!normalized) return null;
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private async resolveSystemQuantity(
    productId: string,
    warehouseId: string,
    lotCode?: string,
  ): Promise<Prisma.Decimal> {
    if (lotCode?.trim()) {
      const lot = await this.prisma.productLotStock.findFirst({
        where: { productId, warehouseId, codigoLote: lotCode.trim(), deletedAt: null },
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

  private async resolveUnitCost(
    productId: string,
    warehouseId: string,
    method: string,
    productCost: Prisma.Decimal | null,
  ): Promise<Prisma.Decimal> {
    if (method === 'PROMEDIO_PONDERADO') {
      const movements = await this.prisma.inventoryInboundMovement.findMany({
        where: {
          productId,
          warehouseId,
          deletedAt: null,
          cantidad: { gt: 0 },
          costoUnitario: { not: null },
        },
        select: { cantidad: true, costoUnitario: true },
        take: 50,
        orderBy: { fechaRegistro: 'desc' },
      });
      if (movements.length === 0) {
        return productCost ?? new Prisma.Decimal(0);
      }
      let totalQty = new Prisma.Decimal(0);
      let totalValue = new Prisma.Decimal(0);
      for (const m of movements) {
        totalQty = totalQty.plus(m.cantidad);
        totalValue = totalValue.plus(m.cantidad.times(m.costoUnitario!));
      }
      return totalQty.isZero() ? new Prisma.Decimal(0) : totalValue.dividedBy(totalQty);
    }

    const lot = await this.prisma.productLotStock.findFirst({
      where: {
        productId,
        warehouseId,
        deletedAt: null,
        stock: { gt: 0 },
        costoUnitario: { not: null },
      },
      orderBy: { fechaVencimiento: 'asc' },
      select: { costoUnitario: true },
    });
    return lot?.costoUnitario ?? productCost ?? new Prisma.Decimal(0);
  }

  private async countLowStock(establishmentId: string): Promise<number> {
    const rows = await this.prisma.productWarehouseStock.findMany({
      where: {
        product: { deletedAt: null, habilitado: true },
        warehouse: { deletedAt: null, establishmentId },
      },
      select: {
        cantidad: true,
        product: { select: { stockMinimo: true } },
      },
    });
    return rows.filter((row) => row.cantidad.lessThan(row.product.stockMinimo)).length;
  }

  private buildExpiryWhere(
    filter: InventoryLotListQueryDto['expiryFilter'],
    now: Date,
  ): Prisma.ProductLotStockWhereInput {
    if (!filter || filter === 'all') return {};
    if (filter === 'expired') {
      return { fechaVencimiento: { lt: now } };
    }
    const days = Number.parseInt(filter, 10);
    const limit = new Date(now);
    limit.setDate(limit.getDate() + days);
    return { fechaVencimiento: { gte: now, lte: limit } };
  }

  private toDate(value: unknown): Date | null {
    if (value === null || value === undefined || value === '') return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    if (typeof value === 'number') {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (!parsed) return null;
      return new Date(parsed.y, parsed.m - 1, parsed.d);
    }
    const text = String(value).trim();
    if (!text) return null;
    const [a, b, c] = text.split(/[\/\-]/).map((x) => Number.parseInt(x, 10));
    if (!a || !b || !c) {
      const fallback = new Date(text);
      return Number.isNaN(fallback.getTime()) ? null : fallback;
    }
    if (text.includes('/')) return new Date(c, b - 1, a);
    return new Date(a, b - 1, c);
  }
}
