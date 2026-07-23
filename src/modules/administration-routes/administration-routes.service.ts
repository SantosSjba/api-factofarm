import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { buildPaginatedResult, paginationArgs } from '../../common/dto/pagination.dto';
import type { MaestroListQueryDto } from '../../common/dto/maestro-list-query.dto';
import { AuditLogService } from '../../common/services/audit-log.service';
import { EntityIntegrityService } from '../../common/services/entity-integrity.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAdministrationRouteDto } from './dto/create-administration-route.dto';
import { UpdateAdministrationRouteDto } from './dto/update-administration-route.dto';

const selectRow = {
  id: true,
  nombre: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AdministrationRouteSelect;

@Injectable()
export class AdministrationRoutesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
    private readonly integrity: EntityIntegrityService,
  ) {}

  async findAll(filters?: MaestroListQueryDto) {
    const where = this.buildWhere(filters);
    if (filters?.page == null) {
      return this.prisma.administrationRoute.findMany({
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
      this.prisma.administrationRoute.findMany({ where, orderBy: { nombre: 'asc' }, skip, take, select: selectRow }),
      this.prisma.administrationRoute.count({ where }),
    ]);
    return buildPaginatedResult(items, total, page, pageSize);
  }

  async create(dto: CreateAdministrationRouteDto, actorId?: string) {
    const nombre = dto.nombre.trim().toUpperCase();
    try {
      const created = await this.prisma.administrationRoute.create({ data: { nombre }, select: selectRow });
      await this.audit.log({ userId: actorId, action: 'CREATE', entity: 'AdministrationRoute', entityId: created.id });
      return created;
    } catch (err) {
      this.handleKnownError(err);
    }
  }

  async update(id: string, dto: UpdateAdministrationRouteDto, actorId?: string) {
    const current = await this.prisma.administrationRoute.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!current) throw new NotFoundException('Vía de administración no encontrada');
    try {
      const updated = await this.prisma.administrationRoute.update({
        where: { id },
        data: dto.nombre !== undefined ? { nombre: dto.nombre.trim().toUpperCase() } : {},
        select: selectRow,
      });
      await this.audit.log({
        userId: actorId,
        action: 'UPDATE',
        entity: 'AdministrationRoute',
        entityId: id,
        diff: dto,
      });
      return updated;
    } catch (err) {
      this.handleKnownError(err);
    }
  }

  async remove(id: string, actorId?: string) {
    const current = await this.prisma.administrationRoute.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!current) throw new NotFoundException('Vía de administración no encontrada');
    await this.integrity.assertCanDeleteAdministrationRoute(id);
    await this.prisma.administrationRoute.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.log({ userId: actorId, action: 'DELETE', entity: 'AdministrationRoute', entityId: id });
  }

  private buildWhere(filters?: MaestroListQueryDto): Prisma.AdministrationRouteWhereInput {
    const search = filters?.search?.trim();
    return {
      deletedAt: null,
      ...(search ? { nombre: { contains: search, mode: 'insensitive' } } : {}),
    };
  }

  private handleKnownError(err: unknown): never {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictException('Ya existe una vía de administración con ese nombre.');
    }
    throw err;
  }
}
