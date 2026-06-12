import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import {
  buildCursorPaginatedResult,
  decodeCursor,
  encodeCursor,
} from '../../common/dto/cursor-pagination.dto';
import { buildPaginatedResult, paginationArgs } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogExportQueryDto, AuditLogQueryDto } from './dto/audit-log.dto';
import * as XLSX from 'xlsx';

type AuditLogRow = {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  diff: Prisma.JsonValue | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: AuditLogQueryDto) {
    const where = this.buildWhere(query);

    if (query.cursor) {
      return this.findAllCursor(where, query);
    }

    const { page, pageSize, skip, take } = paginationArgs(query);
    const [total, rows] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
    ]);

    return buildPaginatedResult(
      rows.map((r) => this.mapRow(r)),
      total,
      page,
      pageSize,
    );
  }

  private async findAllCursor(
    where: Prisma.AuditLogWhereInput,
    query: AuditLogQueryDto,
  ) {
    const pageSize = query.pageSize ?? 20;
    const decoded = decodeCursor(query.cursor!);
    if (!decoded) {
      throw new BadRequestException('Cursor de auditoría inválido');
    }

    const rows = await this.prisma.auditLog.findMany({
      where: {
        AND: [
          where,
          {
            OR: [
              { createdAt: { lt: decoded.createdAt } },
              { createdAt: decoded.createdAt, id: { lt: decoded.id } },
            ],
          },
        ],
      },
      take: pageSize + 1,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    const page = buildCursorPaginatedResult(rows, pageSize, (row) =>
      encodeCursor(row.createdAt, row.id),
    );

    return {
      items: page.items.map((r) => this.mapRow(r)),
      nextCursor: page.nextCursor,
      pageSize: page.pageSize,
    };
  }

  private buildWhere(query: AuditLogExportQueryDto | AuditLogQueryDto): Prisma.AuditLogWhereInput {
    return {
      ...(query.entity ? { entity: query.entity } : {}),
      ...('action' in query && query.action ? { action: query.action } : {}),
      ...('userId' in query && query.userId ? { userId: query.userId } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lt: new Date(query.to) } : {}),
            },
          }
        : {}),
    };
  }

  private mapRow(r: AuditLogRow) {
    return {
      id: r.id,
      userId: r.userId,
      action: r.action,
      entity: r.entity,
      entityId: r.entityId,
      diff: r.diff,
      ipAddress: r.ipAddress,
      userAgent: r.userAgent,
      createdAt: r.createdAt.toISOString(),
    };
  }

  async buildExportBuffer(query: AuditLogExportQueryDto) {
    const limit = query.limit ?? 5000;
    const rows = await this.prisma.auditLog.findMany({
      where: this.buildWhere(query),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
    });

    const normalized = rows.map((r) => ({
      FECHA: r.createdAt.toISOString(),
      USUARIO_ID: r.userId ?? '',
      ACCION: r.action,
      ENTIDAD: r.entity,
      ENTIDAD_ID: r.entityId ?? '',
      IP: r.ipAddress ?? '',
      USER_AGENT: r.userAgent ?? '',
      DIFF: r.diff ? JSON.stringify(r.diff) : '',
    }));

    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(normalized);
    XLSX.utils.book_append_sheet(workbook, sheet, 'auditoria');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }
}
