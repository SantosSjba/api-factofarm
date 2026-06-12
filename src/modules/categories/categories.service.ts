import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import {
  buildPaginatedResult,
  paginationArgs,
} from '../../common/dto/pagination.dto';
import type { MaestroListQueryDto } from '../../common/dto/maestro-list-query.dto';
import { AuditLogService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

const selectCategory = {
  id: true,
  nombre: true,
  parentId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CategorySelect;

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  async findAll(filters?: MaestroListQueryDto) {
    const where = this.buildWhere(filters);

    if (filters?.page == null) {
      return this.prisma.category.findMany({
        where,
        orderBy: { nombre: 'asc' },
        select: selectCategory,
      });
    }

    const { page, pageSize, skip, take } = paginationArgs({
      page: filters.page,
      pageSize: filters.pageSize,
    });

    const [items, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        orderBy: { nombre: 'asc' },
        skip,
        take,
        select: selectCategory,
      }),
      this.prisma.category.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, pageSize);
  }

  async findTree() {
    const rows = await this.prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { nombre: 'asc' },
      select: selectCategory,
    });
    const byId = new Map(rows.map((r) => [r.id, { ...r, children: [] as typeof rows }]));
    const roots: (typeof rows[number] & { children: typeof rows })[] = [];
    for (const row of rows) {
      const node = byId.get(row.id)!;
      if (row.parentId && byId.has(row.parentId)) {
        byId.get(row.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }

  async create(dto: CreateCategoryDto, actorId?: string) {
    const nombre = this.normalizeNombre(dto.nombre);
    if (dto.parentId) {
      await this.assertParentExists(dto.parentId);
    }
    try {
      const created = await this.prisma.category.create({
        data: { nombre, parentId: dto.parentId ?? null },
        select: selectCategory,
      });
      await this.audit.log({
        userId: actorId,
        action: 'CREATE',
        entity: 'Category',
        entityId: created.id,
      });
      return created;
    } catch (err) {
      this.handleKnownError(err);
    }
  }

  async update(id: string, dto: UpdateCategoryDto, actorId?: string) {
    const current = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!current) {
      throw new NotFoundException('Categoría no encontrada');
    }

    const data: Prisma.CategoryUpdateInput = {};
    if (dto.nombre !== undefined) {
      data.nombre = this.normalizeNombre(dto.nombre);
    }
    if (dto.parentId !== undefined) {
      if (dto.parentId === id) {
        throw new ConflictException('Una categoría no puede ser padre de sí misma.');
      }
      if (dto.parentId) {
        await this.assertParentExists(dto.parentId);
      }
      data.parent = dto.parentId ? { connect: { id: dto.parentId } } : { disconnect: true };
    }

    try {
      const updated = await this.prisma.category.update({
        where: { id },
        data,
        select: selectCategory,
      });
      await this.audit.log({
        userId: actorId,
        action: 'UPDATE',
        entity: 'Category',
        entityId: id,
        diff: dto,
      });
      return updated;
    } catch (err) {
      this.handleKnownError(err);
    }
  }

  async remove(id: string, actorId?: string) {
    const current = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!current) {
      throw new NotFoundException('Categoría no encontrada');
    }

    await this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.audit.log({
      userId: actorId,
      action: 'DELETE',
      entity: 'Category',
      entityId: id,
    });
  }

  private buildWhere(filters?: MaestroListQueryDto): Prisma.CategoryWhereInput {
    const search = filters?.search?.trim();
    const field = filters?.field?.trim().toLowerCase();

    const searchableFields: Prisma.CategoryWhereInput[] = [
      { nombre: { contains: search, mode: 'insensitive' } },
    ];

    return {
      deletedAt: null,
      ...(search
        ? {
            OR:
              field === 'nombre' || !field || field === 'all'
                ? searchableFields
                : searchableFields,
          }
        : {}),
    };
  }

  private async assertParentExists(parentId: string) {
    const parent = await this.prisma.category.findFirst({
      where: { id: parentId, deletedAt: null },
      select: { id: true },
    });
    if (!parent) {
      throw new NotFoundException('Categoría padre no encontrada');
    }
  }

  private normalizeNombre(value: string): string {
    return value.trim().toUpperCase();
  }

  private handleKnownError(err: unknown): never {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictException('Ya existe una categoría con ese nombre.');
    }
    throw err;
  }
}
