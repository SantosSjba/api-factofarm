import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import {
  buildPaginatedResult,
  paginationArgs,
} from '../../common/dto/pagination.dto';
import type { MaestroListQueryDto } from '../../common/dto/maestro-list-query.dto';
import { AuditLogService } from '../../common/services/audit-log.service';
import { assertTenantAccess, actorFromJwt, requireTenantId, tenantWhere } from '../../common/scoping/tenant-scope.util';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

const selectBrand = {
  id: true,
  nombre: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.BrandSelect;

@Injectable()
export class BrandsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  async findAll(filters?: MaestroListQueryDto, actor?: JwtRequestUser) {
    const where = this.buildWhere(filters, actor ? tenantWhere(actorFromJwt(actor)) : {});

    if (filters?.page == null) {
      return this.prisma.brand.findMany({
        where,
        orderBy: { nombre: 'asc' },
        select: selectBrand,
      });
    }

    const { page, pageSize, skip, take } = paginationArgs({
      page: filters.page,
      pageSize: filters.pageSize,
    });

    const [items, total] = await Promise.all([
      this.prisma.brand.findMany({
        where,
        orderBy: { nombre: 'asc' },
        skip,
        take,
        select: selectBrand,
      }),
      this.prisma.brand.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, pageSize);
  }

  async create(dto: CreateBrandDto, actor: JwtRequestUser) {
    const tenantId = requireTenantId(actorFromJwt(actor));
    const nombre = this.normalizeNombre(dto.nombre);
    try {
      const created = await this.prisma.brand.create({
        data: { nombre, tenantId },
        select: selectBrand,
      });
      await this.audit.log({
        userId: actor?.sub,
        action: 'CREATE',
        entity: 'Brand',
        entityId: created.id,
      });
      return created;
    } catch (err) {
      this.handleKnownError(err);
    }
  }

  async update(id: string, dto: UpdateBrandDto, actor?: JwtRequestUser) {
    const current = await this.prisma.brand.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, tenantId: true },
    });
    if (!current) {
      throw new NotFoundException('Marca no encontrada');
    }
    if (actor) {
      assertTenantAccess(actorFromJwt(actor), current.tenantId);
    }

    const data: Prisma.BrandUpdateInput = {};
    if (dto.nombre !== undefined) {
      data.nombre = this.normalizeNombre(dto.nombre);
    }

    try {
      const updated = await this.prisma.brand.update({
        where: { id },
        data,
        select: selectBrand,
      });
      await this.audit.log({
        userId: actor?.sub,
        action: 'UPDATE',
        entity: 'Brand',
        entityId: id,
        diff: dto,
      });
      return updated;
    } catch (err) {
      this.handleKnownError(err);
    }
  }

  async remove(id: string, actor?: JwtRequestUser) {
    const current = await this.prisma.brand.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, tenantId: true },
    });
    if (!current) {
      throw new NotFoundException('Marca no encontrada');
    }
    if (actor) {
      assertTenantAccess(actorFromJwt(actor), current.tenantId);
    }

    await this.prisma.brand.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.audit.log({
      userId: actor?.sub,
      action: 'DELETE',
      entity: 'Brand',
      entityId: id,
    });
  }

  private buildWhere(
    filters?: MaestroListQueryDto,
    tenantFilter: Prisma.BrandWhereInput = {},
  ): Prisma.BrandWhereInput {
    const search = filters?.search?.trim();
    const field = filters?.field?.trim().toLowerCase();

    const searchableFields: Prisma.BrandWhereInput[] = [
      { nombre: { contains: search, mode: 'insensitive' } },
    ];

    return {
      deletedAt: null,
      ...tenantFilter,
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

  private normalizeNombre(value: string): string {
    return value.trim().toUpperCase();
  }

  private handleKnownError(err: unknown): never {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictException('Ya existe una marca con ese nombre.');
    }
    throw err;
  }
}
