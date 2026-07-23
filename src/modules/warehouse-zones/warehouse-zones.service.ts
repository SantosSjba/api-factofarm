import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { AuditLogService } from '../../common/services/audit-log.service';
import { EntityIntegrityService } from '../../common/services/entity-integrity.service';
import { EstablishmentScopeService } from '../../common/scoping/establishment-scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { CreateWarehouseZoneDto } from './dto/create-warehouse-zone.dto';
import { UpdateWarehouseZoneDto } from './dto/update-warehouse-zone.dto';

@Injectable()
export class WarehouseZonesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
    private readonly scope: EstablishmentScopeService,
    private readonly integrity: EntityIntegrityService,
  ) {}

  async findByWarehouse(warehouseId: string, actor: JwtRequestUser) {
    await this.scope.assertWarehouseInTenant(actor, warehouseId);
    return this.prisma.warehouseZone.findMany({
      where: { warehouseId, deletedAt: null },
      orderBy: [{ tipo: 'asc' }, { nombre: 'asc' }],
      select: {
        id: true,
        nombre: true,
        tipo: true,
        activo: true,
        warehouse: { select: { id: true, nombre: true } },
      },
    });
  }

  async create(dto: CreateWarehouseZoneDto, actor: JwtRequestUser) {
    await this.scope.assertWarehouseInTenant(actor, dto.warehouseId);
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: dto.warehouseId, deletedAt: null },
      select: { id: true },
    });
    if (!warehouse) throw new NotFoundException('Almacén no encontrado');

    try {
      const created = await this.prisma.warehouseZone.create({
        data: {
          warehouseId: dto.warehouseId,
          nombre: dto.nombre.trim(),
          tipo: dto.tipo,
        },
        select: { id: true, nombre: true, tipo: true, activo: true },
      });
      await this.audit.log({
        userId: actor.sub,
        action: 'CREATE',
        entity: 'WarehouseZone',
        entityId: created.id,
      });
      return created;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Ya existe una zona con ese nombre en el almacén');
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdateWarehouseZoneDto, actor: JwtRequestUser) {
    const current = await this.prisma.warehouseZone.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, warehouseId: true },
    });
    if (!current) throw new NotFoundException('Zona de almacén no encontrada');
    await this.scope.assertWarehouseInTenant(actor, current.warehouseId);

    const updated = await this.prisma.warehouseZone.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined ? { nombre: dto.nombre.trim() } : {}),
        ...(dto.tipo !== undefined ? { tipo: dto.tipo } : {}),
        ...(dto.activo !== undefined ? { activo: dto.activo } : {}),
      },
      select: { id: true, nombre: true, tipo: true, activo: true },
    });

    await this.audit.log({
      userId: actor.sub,
      action: 'UPDATE',
      entity: 'WarehouseZone',
      entityId: id,
      diff: dto,
    });
    return updated;
  }

  async remove(id: string, actor: JwtRequestUser) {
    const current = await this.prisma.warehouseZone.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, warehouseId: true },
    });
    if (!current) throw new NotFoundException('Zona de almacén no encontrada');
    await this.scope.assertWarehouseInTenant(actor, current.warehouseId);
    await this.integrity.assertCanDeleteWarehouseZone(id);

    await this.prisma.warehouseZone.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.log({
      userId: actor.sub,
      action: 'DELETE',
      entity: 'WarehouseZone',
      entityId: id,
    });
  }
}
