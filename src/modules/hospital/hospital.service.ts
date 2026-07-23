import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  HospitalConsumptionStatus,
  Prisma,
} from '../../generated/prisma/client';
import { buildPaginatedResult, paginationArgs } from '../../common/dto/pagination.dto';
import { EstablishmentScopeService } from '../../common/scoping/establishment-scope.service';
import { AuditLogService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { InventoryMovementsService } from '../inventory-movements/inventory-movements.service';
import { SaleLotAllocationMode } from '../inventory-movements/dto/sale-lot-allocation-preview.dto';
import {
  CreateHospitalAreaDto,
  CreateHospitalConsumptionDto,
  HospitalAreaListQueryDto,
  HospitalConsumptionListQueryDto,
} from './dto/hospital.dto';

@Injectable()
export class HospitalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
    private readonly inventory: InventoryMovementsService,
    private readonly scope: EstablishmentScopeService,
  ) {}

  async listAreas(establishmentId: string, query: HospitalAreaListQueryDto) {
    const { page, pageSize, skip, take } = paginationArgs(query);
    const where: Prisma.HospitalAreaWhereInput = {
      establishmentId,
      deletedAt: null,
      ...(query.search?.trim()
        ? {
            OR: [
              { codigo: { contains: query.search.trim(), mode: 'insensitive' } },
              { nombre: { contains: query.search.trim(), mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.hospitalArea.count({ where }),
      this.prisma.hospitalArea.findMany({
        where,
        skip,
        take,
        orderBy: { nombre: 'asc' },
      }),
    ]);
    return buildPaginatedResult(
      rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    );
  }

  async createArea(establishmentId: string, dto: CreateHospitalAreaDto, userId: string) {
    const establishment = await this.prisma.establishment.findFirst({
      where: { id: establishmentId, deletedAt: null },
      select: { esHospital: true },
    });
    if (!establishment?.esHospital) {
      throw new BadRequestException('El establecimiento no está marcado como hospital');
    }

    const codigo = dto.codigo.trim().toUpperCase();
    const exists = await this.prisma.hospitalArea.findFirst({
      where: { establishmentId, codigo, deletedAt: null },
      select: { id: true },
    });
    if (exists) throw new BadRequestException('Ya existe un área con ese código');

    const row = await this.prisma.hospitalArea.create({
      data: {
        establishmentId,
        codigo,
        nombre: dto.nombre.trim(),
        tipo: dto.tipo,
      },
    });
    await this.audit.log({ userId, action: 'CREATE', entity: 'HospitalArea', entityId: row.id });
    return row;
  }

  async listConsumptions(establishmentId: string, query: HospitalConsumptionListQueryDto) {
    const { page, pageSize, skip, take } = paginationArgs(query);
    const where: Prisma.HospitalInternalConsumptionWhereInput = {
      establishmentId,
      deletedAt: null,
      ...(query.estado ? { estado: query.estado } : {}),
      ...(query.hospitalAreaId ? { hospitalAreaId: query.hospitalAreaId } : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.hospitalInternalConsumption.count({ where }),
      this.prisma.hospitalInternalConsumption.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          hospitalArea: { select: { id: true, codigo: true, nombre: true, tipo: true } },
          solicitadoPor: { select: { id: true, nombre: true } },
          items: {
            include: { product: { select: { id: true, nombre: true } } },
          },
        },
      }),
    ]);
    return buildPaginatedResult(
      rows.map((r) => ({
        id: r.id,
        estado: r.estado,
        motivo: r.motivo,
        comentario: r.comentario,
        dispensadoAt: r.dispensadoAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
        hospitalArea: r.hospitalArea,
        solicitadoPor: r.solicitadoPor,
        items: r.items.map((i) => ({
          id: i.id,
          productId: i.productId,
          cantidad: i.cantidad.toString(),
          notas: i.notas,
          product: i.product,
        })),
      })),
      total,
      page,
      pageSize,
    );
  }

  async createConsumption(
    establishmentId: string,
    dto: CreateHospitalConsumptionDto,
    actor: JwtRequestUser,
  ) {
    if (!dto.items?.length) throw new BadRequestException('Debe incluir al menos un producto');

    await this.scope.assertWarehouseInTenant(actor, dto.warehouseId);
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: dto.warehouseId, establishmentId, deletedAt: null },
      select: { id: true },
    });
    if (!warehouse) throw new NotFoundException('Almacén no válido');

    const area = await this.prisma.hospitalArea.findFirst({
      where: { id: dto.hospitalAreaId, establishmentId, deletedAt: null, activo: true },
      select: { id: true, codigo: true },
    });
    if (!area) throw new NotFoundException('Área hospitalaria no válida');

    for (const item of dto.items) {
      await this.scope.assertProductInTenant(actor, item.productId);
    }

    const row = await this.prisma.hospitalInternalConsumption.create({
      data: {
        establishmentId,
        warehouseId: dto.warehouseId,
        hospitalAreaId: dto.hospitalAreaId,
        solicitadoPorId: actor.sub,
        motivo: dto.motivo?.trim() || null,
        comentario: dto.comentario?.trim() || null,
        items: {
          create: dto.items.map((i) => ({
            productId: i.productId,
            cantidad: new Prisma.Decimal(i.cantidad),
            notas: i.notas?.trim() || null,
          })),
        },
      },
      include: { items: true },
    });

    await this.audit.log({
      userId: actor.sub,
      action: 'CREATE',
      entity: 'HospitalInternalConsumption',
      entityId: row.id,
    });

    return { id: row.id, estado: row.estado };
  }

  async dispenseConsumption(id: string, establishmentId: string, userId: string) {
    const consumption = await this.prisma.hospitalInternalConsumption.findFirst({
      where: { id, establishmentId, deletedAt: null },
      include: { items: true, hospitalArea: { select: { codigo: true } } },
    });
    if (!consumption) throw new NotFoundException('Solicitud no encontrada');
    if (consumption.estado !== HospitalConsumptionStatus.SOLICITADO) {
      throw new BadRequestException('La solicitud ya fue procesada');
    }

    const ref = `HOSP-${consumption.hospitalArea.codigo}-${consumption.id.slice(0, 8)}`;
    await this.prisma.$transaction(async (tx) => {
      const locked = await tx.hospitalInternalConsumption.updateMany({
        where: { id, estado: HospitalConsumptionStatus.SOLICITADO },
        data: {
          estado: HospitalConsumptionStatus.DISPENSADO,
          dispensadoPorId: userId,
          dispensadoAt: new Date(),
        },
      });
      if (locked.count !== 1) {
        throw new BadRequestException('La solicitud ya fue procesada');
      }

      for (const item of consumption.items) {
        await this.inventory.dispatchSaleStock(
          {
            productId: item.productId,
            warehouseId: consumption.warehouseId,
            quantity: Number(item.cantidad.toString()),
            mode: SaleLotAllocationMode.AUTO,
            reference: ref,
            comment: `Consumo interno área ${consumption.hospitalArea.codigo}`,
          },
          userId,
          tx,
        );
      }
    });

    await this.audit.log({
      userId,
      action: 'DISPENSE',
      entity: 'HospitalInternalConsumption',
      entityId: id,
    });

    return { ok: true, estado: HospitalConsumptionStatus.DISPENSADO };
  }

  async cancelConsumption(id: string, establishmentId: string, userId: string) {
    const consumption = await this.prisma.hospitalInternalConsumption.findFirst({
      where: { id, establishmentId, deletedAt: null },
      select: { id: true, estado: true },
    });
    if (!consumption) throw new NotFoundException('Solicitud no encontrada');
    if (consumption.estado !== HospitalConsumptionStatus.SOLICITADO) {
      throw new BadRequestException('Solo se pueden cancelar solicitudes pendientes');
    }

    await this.prisma.hospitalInternalConsumption.update({
      where: { id },
      data: { estado: HospitalConsumptionStatus.CANCELADO },
    });

    await this.audit.log({
      userId,
      action: 'CANCEL',
      entity: 'HospitalInternalConsumption',
      entityId: id,
    });

    return { ok: true };
  }
}
