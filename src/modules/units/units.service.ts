import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { buildPaginatedResult, paginationArgs } from '../../common/dto/pagination.dto';
import type { MaestroListQueryDto } from '../../common/dto/maestro-list-query.dto';
import { AuditLogService } from '../../common/services/audit-log.service';
import { EntityIntegrityService } from '../../common/services/entity-integrity.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

const selectRow = {
  id: true,
  codigo: true,
  nombre: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UnitOfMeasureSelect;

@Injectable()
export class UnitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
    private readonly integrity: EntityIntegrityService,
  ) {}

  async findAll(filters?: MaestroListQueryDto) {
    const where = this.buildWhere(filters);
    if (filters?.page == null) {
      return this.prisma.unitOfMeasure.findMany({
        where,
        orderBy: { nombre: 'asc' },
        select: selectRow,
      });
    }
    const { page, pageSize, skip, take } = paginationArgs({
      page: filters.page,
      pageSize: filters.pageSize,
    });
    const [items, total] = await Promise.all([
      this.prisma.unitOfMeasure.findMany({ where, orderBy: { nombre: 'asc' }, skip, take, select: selectRow }),
      this.prisma.unitOfMeasure.count({ where }),
    ]);
    return buildPaginatedResult(items, total, page, pageSize);
  }

  async create(dto: CreateUnitDto, actorId?: string) {
    const codigo = dto.codigo.trim().toUpperCase();
    const nombre = dto.nombre.trim().toUpperCase();
    try {
      const created = await this.prisma.unitOfMeasure.create({
        data: { codigo, nombre },
        select: selectRow,
      });
      await this.audit.log({ userId: actorId, action: 'CREATE', entity: 'UnitOfMeasure', entityId: created.id });
      return created;
    } catch (err) {
      this.handleKnownError(err);
    }
  }

  async update(id: string, dto: UpdateUnitDto, actorId?: string) {
    const current = await this.prisma.unitOfMeasure.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!current) throw new NotFoundException('Unidad no encontrada');
    const data: Prisma.UnitOfMeasureUpdateInput = {};
    if (dto.codigo !== undefined) data.codigo = dto.codigo.trim().toUpperCase();
    if (dto.nombre !== undefined) data.nombre = dto.nombre.trim().toUpperCase();
    try {
      const updated = await this.prisma.unitOfMeasure.update({ where: { id }, data, select: selectRow });
      await this.audit.log({ userId: actorId, action: 'UPDATE', entity: 'UnitOfMeasure', entityId: id, diff: dto });
      return updated;
    } catch (err) {
      this.handleKnownError(err);
    }
  }

  async remove(id: string, actorId?: string) {
    const current = await this.prisma.unitOfMeasure.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!current) throw new NotFoundException('Unidad no encontrada');
    await this.integrity.assertCanDeleteUnit(id);
    await this.prisma.unitOfMeasure.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.log({ userId: actorId, action: 'DELETE', entity: 'UnitOfMeasure', entityId: id });
  }

  private buildWhere(filters?: MaestroListQueryDto): Prisma.UnitOfMeasureWhereInput {
    const search = filters?.search?.trim();
    return {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { nombre: { contains: search, mode: 'insensitive' } },
              { codigo: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
  }

  private handleKnownError(err: unknown): never {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictException('Ya existe una unidad con ese código o nombre.');
    }
    throw err;
  }
}
