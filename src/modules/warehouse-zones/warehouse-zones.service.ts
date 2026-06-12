import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { AuditLogService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWarehouseZoneDto } from './dto/create-warehouse-zone.dto';
import { UpdateWarehouseZoneDto } from './dto/update-warehouse-zone.dto';

@Injectable()
export class WarehouseZonesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  findByWarehouse(warehouseId: string) {
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

  async create(dto: CreateWarehouseZoneDto, actorId?: string) {
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
        userId: actorId,
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

  async update(id: string, dto: UpdateWarehouseZoneDto, actorId?: string) {
    const current = await this.prisma.warehouseZone.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!current) throw new NotFoundException('Zona de almacén no encontrada');

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
      userId: actorId,
      action: 'UPDATE',
      entity: 'WarehouseZone',
      entityId: id,
      diff: dto,
    });
    return updated;
  }

  async remove(id: string, actorId?: string) {
    const current = await this.prisma.warehouseZone.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!current) throw new NotFoundException('Zona de almacén no encontrada');

    await this.prisma.warehouseZone.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.log({
      userId: actorId,
      action: 'DELETE',
      entity: 'WarehouseZone',
      entityId: id,
    });
  }
}
