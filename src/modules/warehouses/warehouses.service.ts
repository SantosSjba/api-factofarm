import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { buildPaginatedResult, paginationArgs } from '../../common/dto/pagination.dto';
import { AuditLogService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { WarehouseListQueryDto } from './dto/warehouse-list-query.dto';

const selectRow = {
  id: true,
  nombre: true,
  establishmentId: true,
  establishment: { select: { id: true, nombre: true, codigo: true } },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.WarehouseSelect;

@Injectable()
export class WarehousesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  async findAll(query: WarehouseListQueryDto) {
    const { page, pageSize, skip, take } = paginationArgs({
      page: query.page,
      pageSize: query.pageSize,
    });
    const search = query.search?.trim();
    const where: Prisma.WarehouseWhereInput = {
      deletedAt: null,
      ...(query.establishmentId ? { establishmentId: query.establishmentId } : {}),
      ...(search
        ? {
            OR: [
              { nombre: { contains: search, mode: 'insensitive' } },
              { establishment: { nombre: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.warehouse.findMany({
        where,
        orderBy: [{ establishment: { nombre: 'asc' } }, { nombre: 'asc' }],
        skip,
        take,
        select: selectRow,
      }),
      this.prisma.warehouse.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, pageSize);
  }

  async create(dto: CreateWarehouseDto, actorId?: string) {
    const establishment = await this.prisma.establishment.findFirst({
      where: { id: dto.establishmentId, deletedAt: null },
      select: { id: true },
    });
    if (!establishment) throw new NotFoundException('Establecimiento no encontrado');

    const nombre = dto.nombre.trim();
    try {
      const created = await this.prisma.warehouse.create({
        data: { establishmentId: dto.establishmentId, nombre },
        select: selectRow,
      });
      await this.audit.log({
        userId: actorId,
        action: 'CREATE',
        entity: 'Warehouse',
        entityId: created.id,
      });
      return created;
    } catch (err) {
      this.handleKnownError(err);
    }
  }

  async update(id: string, dto: UpdateWarehouseDto, actorId?: string) {
    const current = await this.prisma.warehouse.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!current) throw new NotFoundException('Almacén no encontrado');

    try {
      const updated = await this.prisma.warehouse.update({
        where: { id },
        data: dto.nombre !== undefined ? { nombre: dto.nombre.trim() } : {},
        select: selectRow,
      });
      await this.audit.log({
        userId: actorId,
        action: 'UPDATE',
        entity: 'Warehouse',
        entityId: id,
        diff: dto,
      });
      return updated;
    } catch (err) {
      this.handleKnownError(err);
    }
  }

  async remove(id: string, actorId?: string) {
    const current = await this.prisma.warehouse.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!current) throw new NotFoundException('Almacén no encontrado');

    await this.prisma.warehouse.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.log({
      userId: actorId,
      action: 'DELETE',
      entity: 'Warehouse',
      entityId: id,
    });
  }

  private handleKnownError(err: unknown): never {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictException('Ya existe un almacén con ese nombre en el establecimiento');
    }
    throw err;
  }
}
