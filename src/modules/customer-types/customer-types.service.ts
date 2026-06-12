import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import {
  buildPaginatedResult,
  paginationArgs,
} from '../../common/dto/pagination.dto';
import type { MaestroListQueryDto } from '../../common/dto/maestro-list-query.dto';
import { AuditLogService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerTypeDto } from './dto/create-customer-type.dto';
import { UpdateCustomerTypeDto } from './dto/update-customer-type.dto';

const selectCustomerType = {
  id: true,
  descripcion: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CustomerTypeSelect;

@Injectable()
export class CustomerTypesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  async findAll(filters?: MaestroListQueryDto) {
    const where = this.buildWhere(filters);

    if (filters?.page == null) {
      return this.prisma.customerType.findMany({
        where,
        orderBy: { descripcion: 'asc' },
        select: selectCustomerType,
      });
    }

    const { page, pageSize, skip, take } = paginationArgs({
      page: filters.page,
      pageSize: filters.pageSize,
    });

    const [items, total] = await Promise.all([
      this.prisma.customerType.findMany({
        where,
        orderBy: { descripcion: 'asc' },
        skip,
        take,
        select: selectCustomerType,
      }),
      this.prisma.customerType.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, pageSize);
  }

  async create(dto: CreateCustomerTypeDto, actorId?: string) {
    const descripcion = this.normalizeDescripcion(dto.descripcion);
    try {
      const created = await this.prisma.customerType.create({
        data: { descripcion },
        select: selectCustomerType,
      });
      await this.audit.log({
        userId: actorId,
        action: 'CREATE',
        entity: 'CustomerType',
        entityId: created.id,
      });
      return created;
    } catch (err) {
      this.handleKnownError(err);
    }
  }

  async update(id: string, dto: UpdateCustomerTypeDto, actorId?: string) {
    const current = await this.prisma.customerType.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!current) {
      throw new NotFoundException('Tipo de cliente no encontrado');
    }

    const data: Prisma.CustomerTypeUpdateInput = {};
    if (dto.descripcion !== undefined) {
      data.descripcion = this.normalizeDescripcion(dto.descripcion);
    }

    try {
      const updated = await this.prisma.customerType.update({
        where: { id },
        data,
        select: selectCustomerType,
      });
      await this.audit.log({
        userId: actorId,
        action: 'UPDATE',
        entity: 'CustomerType',
        entityId: id,
        diff: dto,
      });
      return updated;
    } catch (err) {
      this.handleKnownError(err);
    }
  }

  async remove(id: string, actorId?: string) {
    const current = await this.prisma.customerType.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!current) {
      throw new NotFoundException('Tipo de cliente no encontrado');
    }

    await this.prisma.customerType.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.audit.log({
      userId: actorId,
      action: 'DELETE',
      entity: 'CustomerType',
      entityId: id,
    });
  }

  private buildWhere(filters?: MaestroListQueryDto): Prisma.CustomerTypeWhereInput {
    const search = filters?.search?.trim();
    const field = filters?.field?.trim().toLowerCase();

    const searchableFields: Prisma.CustomerTypeWhereInput[] = [
      { descripcion: { contains: search, mode: 'insensitive' } },
    ];

    return {
      deletedAt: null,
      ...(search
        ? {
            OR:
              field === 'descripcion' || !field || field === 'all'
                ? searchableFields
                : searchableFields,
          }
        : {}),
    };
  }

  private normalizeDescripcion(value: string): string {
    return value.trim().toUpperCase();
  }

  private handleKnownError(err: unknown): never {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictException('Ya existe un tipo de cliente con esa descripción.');
    }
    throw err;
  }
}
