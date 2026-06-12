import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { buildPaginatedResult, paginationArgs } from '../../common/dto/pagination.dto';
import { AuditLogService } from '../../common/services/audit-log.service';
import { EstablishmentScopeService } from '../../common/scoping/establishment-scope.service';
import type { JwtRequestUser } from '../auth/domain/auth.types';
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
    private readonly scope: EstablishmentScopeService,
  ) {}

  async findAll(query: WarehouseListQueryDto, actor: JwtRequestUser) {
    const scopedEstablishmentId = this.scope.resolve(actor, query.establishmentId);
    const { page, pageSize, skip, take } = paginationArgs({
      page: query.page,
      pageSize: query.pageSize,
    });
    const search = query.search?.trim();
    const where: Prisma.WarehouseWhereInput = {
      deletedAt: null,
      establishmentId: scopedEstablishmentId,
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

  async create(dto: CreateWarehouseDto, actor: JwtRequestUser) {
    this.scope.assertAccess(actor, dto.establishmentId);

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
        userId: actor.sub,
        action: 'CREATE',
        entity: 'Warehouse',
        entityId: created.id,
      });
      return created;
    } catch (err) {
      this.handleKnownError(err);
    }
  }

  async update(id: string, dto: UpdateWarehouseDto, actor: JwtRequestUser) {
    const current = await this.prisma.warehouse.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, establishmentId: true },
    });
    if (!current) throw new NotFoundException('Almacén no encontrado');
    this.scope.assertAccess(actor, current.establishmentId);

    try {
      const updated = await this.prisma.warehouse.update({
        where: { id },
        data: dto.nombre !== undefined ? { nombre: dto.nombre.trim() } : {},
        select: selectRow,
      });
      await this.audit.log({
        userId: actor.sub,
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

  async remove(id: string, actor: JwtRequestUser) {
    const current = await this.prisma.warehouse.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, establishmentId: true },
    });
    if (!current) throw new NotFoundException('Almacén no encontrado');
    this.scope.assertAccess(actor, current.establishmentId);

    await this.prisma.warehouse.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.log({
      userId: actor.sub,
      action: 'DELETE',
      entity: 'Warehouse',
      entityId: id,
    });
    return { ok: true };
  }

  private handleKnownError(err: unknown): void {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictException('Ya existe un almacén con ese nombre en el establecimiento');
    }
    throw err;
  }
}
