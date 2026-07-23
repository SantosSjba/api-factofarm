import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { buildPaginatedResult, paginationArgs } from '../../common/dto/pagination.dto';
import type { MaestroListQueryDto } from '../../common/dto/maestro-list-query.dto';
import { AuditLogService } from '../../common/services/audit-log.service';
import { EntityIntegrityService } from '../../common/services/entity-integrity.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLaboratoryDto } from './dto/create-laboratory.dto';
import { UpdateLaboratoryDto } from './dto/update-laboratory.dto';

const selectRow = {
  id: true,
  nombre: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.LaboratorySelect;

@Injectable()
export class LaboratoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
    private readonly integrity: EntityIntegrityService,
  ) {}

  async findAll(filters?: MaestroListQueryDto) {
    const where = this.buildWhere(filters);
    if (filters?.page == null) {
      return this.prisma.laboratory.findMany({
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
      this.prisma.laboratory.findMany({ where, orderBy: { nombre: 'asc' }, skip, take, select: selectRow }),
      this.prisma.laboratory.count({ where }),
    ]);
    return buildPaginatedResult(items, total, page, pageSize);
  }

  async create(dto: CreateLaboratoryDto, actorId?: string) {
    const nombre = dto.nombre.trim().toUpperCase();
    try {
      const created = await this.prisma.laboratory.create({ data: { nombre }, select: selectRow });
      await this.audit.log({ userId: actorId, action: 'CREATE', entity: 'Laboratory', entityId: created.id });
      return created;
    } catch (err) {
      this.handleKnownError(err);
    }
  }

  async update(id: string, dto: UpdateLaboratoryDto, actorId?: string) {
    const current = await this.prisma.laboratory.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!current) throw new NotFoundException('Laboratorio no encontrado');
    try {
      const updated = await this.prisma.laboratory.update({
        where: { id },
        data: dto.nombre !== undefined ? { nombre: dto.nombre.trim().toUpperCase() } : {},
        select: selectRow,
      });
      await this.audit.log({ userId: actorId, action: 'UPDATE', entity: 'Laboratory', entityId: id, diff: dto });
      return updated;
    } catch (err) {
      this.handleKnownError(err);
    }
  }

  async remove(id: string, actorId?: string) {
    const current = await this.prisma.laboratory.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!current) throw new NotFoundException('Laboratorio no encontrado');
    await this.integrity.assertCanDeleteLaboratory(id);
    await this.prisma.laboratory.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.log({ userId: actorId, action: 'DELETE', entity: 'Laboratory', entityId: id });
  }

  private buildWhere(filters?: MaestroListQueryDto): Prisma.LaboratoryWhereInput {
    const search = filters?.search?.trim();
    return {
      deletedAt: null,
      ...(search ? { nombre: { contains: search, mode: 'insensitive' } } : {}),
    };
  }

  private handleKnownError(err: unknown): never {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictException('Ya existe un laboratorio con ese nombre.');
    }
    throw err;
  }
}
