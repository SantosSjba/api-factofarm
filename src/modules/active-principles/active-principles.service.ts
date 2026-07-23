import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { buildPaginatedResult, paginationArgs } from '../../common/dto/pagination.dto';
import type { MaestroListQueryDto } from '../../common/dto/maestro-list-query.dto';
import { AuditLogService } from '../../common/services/audit-log.service';
import { EntityIntegrityService } from '../../common/services/entity-integrity.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateActivePrincipleDto } from './dto/create-active-principle.dto';
import { UpdateActivePrincipleDto } from './dto/update-active-principle.dto';

const selectRow = {
  id: true,
  nombre: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ActivePrincipleSelect;

@Injectable()
export class ActivePrinciplesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
    private readonly integrity: EntityIntegrityService,
  ) {}

  async findAll(filters?: MaestroListQueryDto) {
    const where = this.buildWhere(filters);
    if (filters?.page == null) {
      return this.prisma.activePrinciple.findMany({
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
      this.prisma.activePrinciple.findMany({ where, orderBy: { nombre: 'asc' }, skip, take, select: selectRow }),
      this.prisma.activePrinciple.count({ where }),
    ]);
    return buildPaginatedResult(items, total, page, pageSize);
  }

  async create(dto: CreateActivePrincipleDto, actorId?: string) {
    const nombre = dto.nombre.trim().toUpperCase();
    try {
      const created = await this.prisma.activePrinciple.create({ data: { nombre }, select: selectRow });
      await this.audit.log({ userId: actorId, action: 'CREATE', entity: 'ActivePrinciple', entityId: created.id });
      return created;
    } catch (err) {
      this.handleKnownError(err);
    }
  }

  async update(id: string, dto: UpdateActivePrincipleDto, actorId?: string) {
    const current = await this.prisma.activePrinciple.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!current) throw new NotFoundException('Principio activo no encontrado');
    try {
      const updated = await this.prisma.activePrinciple.update({
        where: { id },
        data: dto.nombre !== undefined ? { nombre: dto.nombre.trim().toUpperCase() } : {},
        select: selectRow,
      });
      await this.audit.log({
        userId: actorId,
        action: 'UPDATE',
        entity: 'ActivePrinciple',
        entityId: id,
        diff: dto,
      });
      return updated;
    } catch (err) {
      this.handleKnownError(err);
    }
  }

  async remove(id: string, actorId?: string) {
    const current = await this.prisma.activePrinciple.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!current) throw new NotFoundException('Principio activo no encontrado');
    await this.integrity.assertCanDeleteActivePrinciple(id);
    await this.prisma.activePrinciple.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.log({ userId: actorId, action: 'DELETE', entity: 'ActivePrinciple', entityId: id });
  }

  private buildWhere(filters?: MaestroListQueryDto): Prisma.ActivePrincipleWhereInput {
    const search = filters?.search?.trim();
    return {
      deletedAt: null,
      ...(search ? { nombre: { contains: search, mode: 'insensitive' } } : {}),
    };
  }

  private handleKnownError(err: unknown): never {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictException('Ya existe un principio activo con ese nombre.');
    }
    throw err;
  }
}
