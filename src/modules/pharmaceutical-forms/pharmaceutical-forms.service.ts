import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { buildPaginatedResult, paginationArgs } from '../../common/dto/pagination.dto';
import type { MaestroListQueryDto } from '../../common/dto/maestro-list-query.dto';
import { AuditLogService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePharmaceuticalFormDto } from './dto/create-pharmaceutical-form.dto';
import { UpdatePharmaceuticalFormDto } from './dto/update-pharmaceutical-form.dto';

const selectRow = {
  id: true,
  nombre: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PharmaceuticalFormSelect;

@Injectable()
export class PharmaceuticalFormsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  async findAll(filters?: MaestroListQueryDto) {
    const where = this.buildWhere(filters);
    if (filters?.page == null) {
      return this.prisma.pharmaceuticalForm.findMany({
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
      this.prisma.pharmaceuticalForm.findMany({ where, orderBy: { nombre: 'asc' }, skip, take, select: selectRow }),
      this.prisma.pharmaceuticalForm.count({ where }),
    ]);
    return buildPaginatedResult(items, total, page, pageSize);
  }

  async create(dto: CreatePharmaceuticalFormDto, actorId?: string) {
    const nombre = dto.nombre.trim().toUpperCase();
    try {
      const created = await this.prisma.pharmaceuticalForm.create({ data: { nombre }, select: selectRow });
      await this.audit.log({ userId: actorId, action: 'CREATE', entity: 'PharmaceuticalForm', entityId: created.id });
      return created;
    } catch (err) {
      this.handleKnownError(err);
    }
  }

  async update(id: string, dto: UpdatePharmaceuticalFormDto, actorId?: string) {
    const current = await this.prisma.pharmaceuticalForm.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!current) throw new NotFoundException('Forma farmacéutica no encontrada');
    try {
      const updated = await this.prisma.pharmaceuticalForm.update({
        where: { id },
        data: dto.nombre !== undefined ? { nombre: dto.nombre.trim().toUpperCase() } : {},
        select: selectRow,
      });
      await this.audit.log({
        userId: actorId,
        action: 'UPDATE',
        entity: 'PharmaceuticalForm',
        entityId: id,
        diff: dto,
      });
      return updated;
    } catch (err) {
      this.handleKnownError(err);
    }
  }

  async remove(id: string, actorId?: string) {
    const current = await this.prisma.pharmaceuticalForm.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!current) throw new NotFoundException('Forma farmacéutica no encontrada');
    await this.prisma.pharmaceuticalForm.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.log({ userId: actorId, action: 'DELETE', entity: 'PharmaceuticalForm', entityId: id });
  }

  private buildWhere(filters?: MaestroListQueryDto): Prisma.PharmaceuticalFormWhereInput {
    const search = filters?.search?.trim();
    return {
      deletedAt: null,
      ...(search ? { nombre: { contains: search, mode: 'insensitive' } } : {}),
    };
  }

  private handleKnownError(err: unknown): never {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictException('Ya existe una forma farmacéutica con ese nombre.');
    }
    throw err;
  }
}
