import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import {
  buildCursorPaginatedResult,
  decodeCursor,
  encodeCursor,
} from '../../common/dto/cursor-pagination.dto';
import { buildPaginatedResult, paginationArgs } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import {
  dateRangeBoundsInTimeZone,
  DEFAULT_TIME_ZONE,
  normalizeTimeZone,
} from '../../common/utils/timezone.util';
import { AuditLogExportQueryDto, AuditLogQueryDto } from './dto/audit-log.dto';
import * as XLSX from 'xlsx';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { actorFromJwt, tenantWhere } from '../../common/scoping/tenant-scope.util';

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

  async findAll(query: AuditLogQueryDto, actor: JwtRequestUser) {
    const where = await this.buildWhere(query, actor);

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

  private async buildWhere(
    query: AuditLogExportQueryDto | AuditLogQueryDto,
    actor: JwtRequestUser,
  ): Promise<Prisma.AuditLogWhereInput> {
    const dateFilter = await this.dateFilterForActor(actor, query.from, query.to);
    return {
      ...tenantWhere(actorFromJwt(actor)),
      ...(query.entity ? { entity: query.entity } : {}),
      ...('action' in query && query.action ? { action: query.action } : {}),
      ...('userId' in query && query.userId ? { userId: query.userId } : {}),
      ...(dateFilter ? { createdAt: dateFilter } : {}),
    };
  }

  private async dateFilterForActor(
    actor: JwtRequestUser,
    from?: string,
    to?: string,
  ): Promise<{ gte?: Date; lt?: Date } | undefined> {
    if (!from && !to) return undefined;
    const tz = actor.establecimientoId
      ? await this.resolveTimeZone(actor.establecimientoId)
      : DEFAULT_TIME_ZONE;
    const fromYmd = from?.trim();
    const toYmd = to?.trim();
    if (fromYmd && toYmd) {
      const { start, end } = dateRangeBoundsInTimeZone(fromYmd, toYmd, tz);
      return { gte: start, lt: end };
    }
    if (fromYmd) {
      const { start } = dateRangeBoundsInTimeZone(fromYmd, fromYmd, tz);
      return { gte: start };
    }
    const { end } = dateRangeBoundsInTimeZone(toYmd!, toYmd!, tz);
    return { lt: end };
  }

  private async resolveTimeZone(establishmentId: string): Promise<string> {
    const row = await this.prisma.establishment.findFirst({
      where: { id: establishmentId, deletedAt: null },
      select: { timeZone: true },
    });
    return normalizeTimeZone(row?.timeZone);
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

  async buildExportBuffer(query: AuditLogExportQueryDto, actor: JwtRequestUser) {
    const limit = query.limit ?? 5000;
    const rows = await this.prisma.auditLog.findMany({
      where: await this.buildWhere(query, actor),
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
