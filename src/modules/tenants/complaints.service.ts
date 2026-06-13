import { Injectable, NotFoundException } from '@nestjs/common';
import { ComplaintStatus, Prisma } from '../../generated/prisma/client';
import {
  buildPaginatedResult,
  paginationArgs,
} from '../../common/dto/pagination.dto';
import { AuditLogService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { UpdateComplaintDto } from './dto/complaint.dto';

const complaintSelect = {
  id: true,
  numeroRegistro: true,
  tipo: true,
  status: true,
  nombresApellidos: true,
  domicilio: true,
  documentoIdentidad: true,
  telefono: true,
  email: true,
  bienContratado: true,
  montoReclamado: true,
  detalle: true,
  pedido: true,
  internalNotes: true,
  responseNotes: true,
  resolvedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ComplaintSelect;

@Injectable()
export class ComplaintsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  async findAll(filters?: {
    search?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }) {
    const search = filters?.search?.trim();
    const statusRaw = filters?.status?.trim().toUpperCase();
    const status =
      statusRaw &&
      statusRaw !== 'ALL' &&
      Object.values(ComplaintStatus).includes(statusRaw as ComplaintStatus)
        ? (statusRaw as ComplaintStatus)
        : undefined;

    const where: Prisma.ComplaintWhereInput = {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { numeroRegistro: { contains: search, mode: 'insensitive' } },
              { nombresApellidos: { contains: search, mode: 'insensitive' } },
              { documentoIdentidad: { contains: search } },
              { email: { contains: search, mode: 'insensitive' } },
              { telefono: { contains: search } },
            ],
          }
        : {}),
    };

    const { page, pageSize, skip, take } = paginationArgs({
      page: filters?.page,
      pageSize: filters?.pageSize,
    });

    const [items, total] = await Promise.all([
      this.prisma.complaint.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: complaintSelect,
      }),
      this.prisma.complaint.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, pageSize);
  }

  async findOne(id: string) {
    const row = await this.prisma.complaint.findUnique({
      where: { id },
      select: complaintSelect,
    });
    if (!row) {
      throw new NotFoundException('Reclamo no encontrado');
    }
    return row;
  }

  async update(id: string, dto: UpdateComplaintDto, actorId?: string) {
    await this.findOne(id);

    const status = dto.status;
    const data: Prisma.ComplaintUpdateInput = {
      ...(status !== undefined ? { status } : {}),
      ...(dto.internalNotes !== undefined
        ? { internalNotes: dto.internalNotes.trim() || null }
        : {}),
      ...(dto.responseNotes !== undefined
        ? { responseNotes: dto.responseNotes.trim() || null }
        : {}),
    };

    if (
      status === ComplaintStatus.RESOLVED ||
      status === ComplaintStatus.CLOSED
    ) {
      data.resolvedAt = new Date();
    }

    const updated = await this.prisma.complaint.update({
      where: { id },
      data,
      select: complaintSelect,
    });

    await this.audit.log({
      userId: actorId,
      action: 'UPDATE',
      entity: 'Complaint',
      entityId: id,
    });

    return updated;
  }
}
