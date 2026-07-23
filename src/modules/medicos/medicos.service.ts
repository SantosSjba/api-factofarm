import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { buildPaginatedResult, paginationArgs } from '../../common/dto/pagination.dto';
import type { MaestroListQueryDto } from '../../common/dto/maestro-list-query.dto';
import { AuditLogService } from '../../common/services/audit-log.service';
import { EntityIntegrityService } from '../../common/services/entity-integrity.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMedicoDto, UpdateMedicoDto } from './dto/medico.dto';

const selectRow = {
  id: true,
  cmp: true,
  nombres: true,
  apellidos: true,
  especialidad: true,
  activo: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.MedicoSelect;

@Injectable()
export class MedicosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
    private readonly integrity: EntityIntegrityService,
  ) {}

  async findAll(filters?: MaestroListQueryDto) {
    const where = this.buildWhere(filters);
    if (filters?.page == null) {
      return this.prisma.medico.findMany({ where, orderBy: { apellidos: 'asc' }, select: selectRow });
    }
    const { page, pageSize, skip, take } = paginationArgs(filters);
    const [items, total] = await Promise.all([
      this.prisma.medico.findMany({ where, orderBy: { apellidos: 'asc' }, skip, take, select: selectRow }),
      this.prisma.medico.count({ where }),
    ]);
    return buildPaginatedResult(items, total, page, pageSize);
  }

  async create(dto: CreateMedicoDto, actorId?: string) {
    try {
      const created = await this.prisma.medico.create({
        data: {
          cmp: dto.cmp.trim(),
          nombres: dto.nombres.trim(),
          apellidos: dto.apellidos.trim(),
          especialidad: dto.especialidad?.trim() || null,
        },
        select: selectRow,
      });
      await this.audit.log({ userId: actorId, action: 'CREATE', entity: 'Medico', entityId: created.id });
      return created;
    } catch (err) {
      this.handleKnownError(err);
    }
  }

  async update(id: string, dto: UpdateMedicoDto, actorId?: string) {
    const current = await this.prisma.medico.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!current) throw new NotFoundException('Médico no encontrado');
    const updated = await this.prisma.medico.update({
      where: { id },
      data: {
        ...(dto.nombres !== undefined ? { nombres: dto.nombres.trim() } : {}),
        ...(dto.apellidos !== undefined ? { apellidos: dto.apellidos.trim() } : {}),
        ...(dto.especialidad !== undefined ? { especialidad: dto.especialidad?.trim() || null } : {}),
        ...(dto.activo !== undefined ? { activo: dto.activo } : {}),
      },
      select: selectRow,
    });
    await this.audit.log({ userId: actorId, action: 'UPDATE', entity: 'Medico', entityId: id, diff: dto });
    return updated;
  }

  async remove(id: string, actorId?: string) {
    const current = await this.prisma.medico.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!current) throw new NotFoundException('Médico no encontrado');
    await this.integrity.assertCanDeleteMedico(id);
    await this.prisma.medico.update({ where: { id }, data: { deletedAt: new Date(), activo: false } });
    await this.audit.log({ userId: actorId, action: 'DELETE', entity: 'Medico', entityId: id });
  }

  private buildWhere(filters?: MaestroListQueryDto): Prisma.MedicoWhereInput {
    const search = filters?.search?.trim();
    return {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { cmp: { contains: search, mode: 'insensitive' } },
              { nombres: { contains: search, mode: 'insensitive' } },
              { apellidos: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
  }

  private handleKnownError(err: unknown): never {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictException('Ya existe un médico con ese CMP.');
    }
    throw err;
  }
}
