import { auditActionLabel, auditEntityLabel } from './audit-labels';
import { writeWorkbookBuffer } from '../../common/utils/spreadsheet.util';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import {
  buildCursorPaginatedResult,
  decodeCursor,
  encodeCursor,
} from '../../common/dto/cursor-pagination.dto';
import {
  buildPaginatedResult,
  paginationArgs,
} from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import {
  dateRangeBoundsInTimeZone,
  DEFAULT_TIME_ZONE,
  normalizeTimeZone,
} from '../../common/utils/timezone.util';
import { AuditLogExportQueryDto, AuditLogQueryDto } from './dto/audit-log.dto';
import * as XLSX from 'xlsx';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import {
  actorFromJwt,
  tenantWhere,
} from '../../common/scoping/tenant-scope.util';

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

    const names = await this.userNames(rows);
    return buildPaginatedResult(
      rows.map((r) => this.mapRow(r, names)),
      total,
      page,
      pageSize,
    );
  }

  /** Acciones y entidades registradas (para los filtros de la pantalla). */
  async facets(actor: JwtRequestUser) {
    const where = tenantWhere(actorFromJwt(actor));
    const [actions, entities] = await Promise.all([
      this.prisma.auditLog.groupBy({ by: ['action'], where, orderBy: { action: 'asc' } }),
      this.prisma.auditLog.groupBy({ by: ['entity'], where, orderBy: { entity: 'asc' } }),
    ]);
    return {
      actions: actions.map((a) => ({ value: a.action, label: auditActionLabel(a.action) })),
      entities: entities.map((e) => ({ value: e.entity, label: auditEntityLabel(e.entity) })),
    };
  }

  /** Nombre y correo de quien hizo cada acción (el registro solo guarda el id). */
  private async userNames(rows: { userId: string | null }[]) {
    const ids = [...new Set(rows.map((r) => r.userId).filter((v): v is string => !!v))];
    if (!ids.length) return new Map<string, { nombre: string; email: string }>();
    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, nombre: true, email: true },
    });
    return new Map(users.map((u) => [u.id, { nombre: u.nombre, email: u.email }]));
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

    const names = await this.userNames(page.items);
    return {
      items: page.items.map((r) => this.mapRow(r, names)),
      nextCursor: page.nextCursor,
      pageSize: page.pageSize,
    };
  }

  private async buildWhere(
    query: AuditLogExportQueryDto | AuditLogQueryDto,
    actor: JwtRequestUser,
  ): Promise<Prisma.AuditLogWhereInput> {
    const dateFilter = await this.dateFilterForActor(
      actor,
      query.from,
      query.to,
    );
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

  private mapRow(r: AuditLogRow, names?: Map<string, { nombre: string; email: string }>) {
    return {
      id: r.id,
      userId: r.userId,
      user: r.userId ? (names?.get(r.userId) ?? null) : null,
      actionLabel: auditActionLabel(r.action),
      entityLabel: auditEntityLabel(r.entity),
      action: r.action,
      entity: r.entity,
      entityId: r.entityId,
      diff: r.diff,
      ipAddress: r.ipAddress,
      userAgent: r.userAgent,
      createdAt: r.createdAt.toISOString(),
    };
  }

  async buildExportBuffer(
    query: AuditLogExportQueryDto,
    actor: JwtRequestUser,
  ) {
    const limit = query.limit ?? 5000;
    const rows = await this.prisma.auditLog.findMany({
      where: await this.buildWhere(query, actor),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
    });

    const names = await this.userNames(rows);
    const normalized = rows.map((r) => {
      const u = r.userId ? names.get(r.userId) : undefined;
      return {
        Fecha: r.createdAt.toISOString(),
        Usuario: u?.nombre ?? '',
        Correo: u?.email ?? '',
        Acción: auditActionLabel(r.action),
        Módulo: auditEntityLabel(r.entity),
        'Id del registro': r.entityId ?? '',
        IP: r.ipAddress ?? '',
        Dispositivo: r.userAgent ?? '',
        Detalle: r.diff ? JSON.stringify(r.diff) : '',
      };
    });

    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(normalized);
    XLSX.utils.book_append_sheet(workbook, sheet, 'auditoria');
    return writeWorkbookBuffer(workbook);
  }
}
