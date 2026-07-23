import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '../../generated/prisma/client';
import { buildPaginatedResult, paginationArgs } from '../../common/dto/pagination.dto';
import { isPlatformAdmin } from '../../common/permissions/role-policy.util';
import {
  dateRangeBoundsInTimeZone,
  DEFAULT_TIME_ZONE,
  normalizeTimeZone,
} from '../../common/utils/timezone.util';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import type { ArchiveListQueryDto } from './dto/archive-list-query.dto';

const AUDIT_JOB = 'audit-log-purge';
const ARCHIVE_SALES_JOB = 'archive-sales';
const ARCHIVE_KARDEX_JOB = 'archive-kardex';

export type RetentionMode = 'dry-run' | 'purge';
export type ArchiveMode = 'dry-run' | 'archive';

@Injectable()
export class DataRetentionService {
  private readonly logger = new Logger(DataRetentionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  assertPlatformAdmin(actor: JwtRequestUser): void {
    if (!isPlatformAdmin(actor.role)) {
      throw new ForbiddenException('Solo SUPER_ADMIN puede gestionar retención de datos');
    }
  }

  getAuditRetentionDays(): number {
    return Number(this.config.get<number>('DATA_RETENTION_AUDIT_DAYS') ?? 730);
  }

  getArchiveDays(): number {
    return Number(this.config.get<number>('DATA_RETENTION_ARCHIVE_DAYS') ?? 1825);
  }

  isPurgeEnabled(): boolean {
    const value = this.config.get<boolean | string>('DATA_RETENTION_PURGE_ENABLED');
    return value === true || value === 'true';
  }

  isArchiveEnabled(): boolean {
    const value = this.config.get<boolean | string>('DATA_RETENTION_ARCHIVE_ENABLED');
    return value === true || value === 'true';
  }

  getBatchSize(): number {
    return Number(this.config.get<number>('DATA_RETENTION_BATCH_SIZE') ?? 5000);
  }

  getCronExpression(): string {
    return this.config.get<string>('DATA_RETENTION_CRON') ?? '0 3 * * *';
  }

  getArchiveCronExpression(): string {
    return this.config.get<string>('DATA_RETENTION_ARCHIVE_CRON') ?? '0 4 * * 0';
  }

  cutoffForAudit(): Date {
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - this.getAuditRetentionDays());
    return cutoff;
  }

  cutoffForArchive(): Date {
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - this.getArchiveDays());
    return cutoff;
  }

  async getMetrics() {
    const rows = await this.prisma.$queryRaw<
      Array<{ table_name: string; approx_rows: bigint; total_bytes: bigint }>
    >`
      SELECT
        c.relname AS table_name,
        GREATEST(c.reltuples::bigint, 0) AS approx_rows,
        pg_total_relation_size(c.oid) AS total_bytes
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind = 'r'
        AND c.relname = ANY(ARRAY[
          'Sale',
          'SaleItem',
          'SaleItemLot',
          'Payment',
          'ElectronicDocument',
          'InventoryInboundMovement',
          'AuditLog',
          'DataRetentionRun',
          'ArchivedSale',
          'ArchivedInventoryInboundMovement'
        ])
      ORDER BY pg_total_relation_size(c.oid) DESC
    `;

    const tables = rows.map((row) => ({
      table: row.table_name,
      approxRows: Number(row.approx_rows),
      totalBytes: Number(row.total_bytes),
      totalMb: Math.round((Number(row.total_bytes) / (1024 * 1024)) * 100) / 100,
    }));

    const [hotSales, archivedSales, hotKardex, archivedKardex] = await Promise.all([
      this.prisma.sale.count({ where: { archivedAt: null, deletedAt: null } }),
      this.prisma.archivedSale.count(),
      this.prisma.inventoryInboundMovement.count({
        where: { archivedAt: null, deletedAt: null },
      }),
      this.prisma.archivedInventoryInboundMovement.count(),
    ]);

    const recentRuns = await this.prisma.dataRetentionRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: 10,
    });

    return {
      generatedAt: new Date().toISOString(),
      config: {
        auditRetentionDays: this.getAuditRetentionDays(),
        archiveDays: this.getArchiveDays(),
        purgeEnabled: this.isPurgeEnabled(),
        archiveEnabled: this.isArchiveEnabled(),
        cron: this.getCronExpression(),
        archiveCron: this.getArchiveCronExpression(),
        batchSize: this.getBatchSize(),
      },
      hotPath: {
        sales: hotSales,
        kardexMovements: hotKardex,
      },
      coldStorage: {
        archivedSales,
        archivedKardexMovements: archivedKardex,
      },
      tables,
      recentRuns,
    };
  }

  async runAuditRetention(mode: RetentionMode) {
    if (mode === 'purge' && !this.isPurgeEnabled()) {
      throw new ForbiddenException(
        'Purga deshabilitada. Configure DATA_RETENTION_PURGE_ENABLED=true tras validar dry-run y backups.',
      );
    }

    const cutoffAt = this.cutoffForAudit();
    const batchSize = this.getBatchSize();
    const startedAt = new Date();

    const run = await this.prisma.dataRetentionRun.create({
      data: {
        jobName: AUDIT_JOB,
        mode,
        cutoffAt,
        status: 'running',
        details: { batchSize },
      },
    });

    let deletedCount = 0;

    try {
      if (mode === 'dry-run') {
        deletedCount = await this.prisma.auditLog.count({
          where: { createdAt: { lt: cutoffAt } },
        });
      } else {
        for (;;) {
          const batch = await this.prisma.auditLog.findMany({
            where: { createdAt: { lt: cutoffAt } },
            select: { id: true },
            take: batchSize,
            orderBy: { createdAt: 'asc' },
          });
          if (batch.length === 0) break;

          const result = await this.prisma.auditLog.deleteMany({
            where: { id: { in: batch.map((row) => row.id) } },
          });
          deletedCount += result.count;
          this.logger.log(
            `AuditLog purge lote: ${result.count} (acumulado ${deletedCount})`,
          );
        }
      }

      return this.finishRun(run.id, deletedCount, startedAt, batchSize, mode, cutoffAt, AUDIT_JOB);
    } catch (error) {
      await this.failRun(run.id, deletedCount, error);
      throw error;
    }
  }

  async runSalesArchive(mode: ArchiveMode) {
    if (mode === 'archive' && !this.isArchiveEnabled()) {
      throw new ForbiddenException(
        'Archivado deshabilitado. Configure DATA_RETENTION_ARCHIVE_ENABLED=true tras validar dry-run.',
      );
    }

    const cutoffAt = this.cutoffForArchive();
    const batchSize = this.getBatchSize();
    const startedAt = new Date();
    const run = await this.prisma.dataRetentionRun.create({
      data: {
        jobName: ARCHIVE_SALES_JOB,
        mode,
        cutoffAt,
        status: 'running',
        details: { batchSize },
      },
    });

    let archivedCount = 0;

    try {
      if (mode === 'dry-run') {
        archivedCount = await this.prisma.sale.count({
          where: {
            archivedAt: null,
            deletedAt: null,
            createdAt: { lt: cutoffAt },
          },
        });
      } else {
        for (;;) {
          const batch = await this.prisma.sale.findMany({
            where: {
              archivedAt: null,
              deletedAt: null,
              createdAt: { lt: cutoffAt },
            },
            take: batchSize,
            orderBy: { createdAt: 'asc' },
            include: {
              items: { include: { lotLines: true } },
              payments: true,
            },
          });
          if (batch.length === 0) break;

          for (const sale of batch) {
            await this.prisma.$transaction(async (tx) => {
              await tx.archivedSale.upsert({
                where: { id: sale.id },
                create: {
                  id: sale.id,
                  establishmentId: sale.establishmentId,
                  originalCreatedAt: sale.createdAt,
                  payload: sale as unknown as Prisma.InputJsonValue,
                },
                update: {
                  payload: sale as unknown as Prisma.InputJsonValue,
                  archivedAt: new Date(),
                },
              });
              await tx.sale.update({
                where: { id: sale.id },
                data: { archivedAt: new Date() },
              });
            });
            archivedCount += 1;
          }

          this.logger.log(`Archivo ventas lote: ${batch.length} (acumulado ${archivedCount})`);
        }
      }

      return this.finishRun(
        run.id,
        archivedCount,
        startedAt,
        batchSize,
        mode,
        cutoffAt,
        ARCHIVE_SALES_JOB,
      );
    } catch (error) {
      await this.failRun(run.id, archivedCount, error);
      throw error;
    }
  }

  async runKardexArchive(mode: ArchiveMode) {
    if (mode === 'archive' && !this.isArchiveEnabled()) {
      throw new ForbiddenException(
        'Archivado deshabilitado. Configure DATA_RETENTION_ARCHIVE_ENABLED=true tras validar dry-run.',
      );
    }

    const cutoffAt = this.cutoffForArchive();
    const batchSize = this.getBatchSize();
    const startedAt = new Date();
    const run = await this.prisma.dataRetentionRun.create({
      data: {
        jobName: ARCHIVE_KARDEX_JOB,
        mode,
        cutoffAt,
        status: 'running',
        details: { batchSize },
      },
    });

    let archivedCount = 0;

    try {
      if (mode === 'dry-run') {
        archivedCount = await this.prisma.inventoryInboundMovement.count({
          where: {
            archivedAt: null,
            deletedAt: null,
            fechaRegistro: { lt: cutoffAt },
          },
        });
      } else {
        for (;;) {
          const batch = await this.prisma.inventoryInboundMovement.findMany({
            where: {
              archivedAt: null,
              deletedAt: null,
              fechaRegistro: { lt: cutoffAt },
            },
            take: batchSize,
            orderBy: { fechaRegistro: 'asc' },
          });
          if (batch.length === 0) break;

          for (const movement of batch) {
            await this.prisma.$transaction(async (tx) => {
              await tx.archivedInventoryInboundMovement.upsert({
                where: { id: movement.id },
                create: {
                  id: movement.id,
                  warehouseId: movement.warehouseId,
                  productId: movement.productId,
                  originalFechaRegistro: movement.fechaRegistro,
                  payload: movement as unknown as Prisma.InputJsonValue,
                },
                update: {
                  payload: movement as unknown as Prisma.InputJsonValue,
                  archivedAt: new Date(),
                },
              });
              await tx.inventoryInboundMovement.update({
                where: { id: movement.id },
                data: { archivedAt: new Date() },
              });
            });
            archivedCount += 1;
          }

          this.logger.log(`Archivo kardex lote: ${batch.length} (acumulado ${archivedCount})`);
        }
      }

      return this.finishRun(
        run.id,
        archivedCount,
        startedAt,
        batchSize,
        mode,
        cutoffAt,
        ARCHIVE_KARDEX_JOB,
      );
    } catch (error) {
      await this.failRun(run.id, archivedCount, error);
      throw error;
    }
  }

  async listRuns(limit = 20) {
    return this.prisma.dataRetentionRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 100),
    });
  }

  async listArchivedSales(query: ArchiveListQueryDto) {
    const { page, pageSize, skip, take } = paginationArgs(query);
    const dateFilter = await this.archiveDateFilter(query);
    const where: Prisma.ArchivedSaleWhereInput = {
      ...(query.establishmentId ? { establishmentId: query.establishmentId } : {}),
      ...(dateFilter ? { originalCreatedAt: dateFilter } : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.archivedSale.count({ where }),
      this.prisma.archivedSale.findMany({
        where,
        skip,
        take,
        orderBy: { originalCreatedAt: 'desc' },
      }),
    ]);

    return buildPaginatedResult(
      rows.map((row) => {
        const payload = (row.payload ?? {}) as Record<string, unknown>;
        return {
          id: row.id,
          establishmentId: row.establishmentId,
          originalCreatedAt: row.originalCreatedAt,
          archivedAt: row.archivedAt,
          documentType: payload.documentType ?? null,
          serie: payload.serie ?? null,
          numero: payload.numero ?? null,
          estado: payload.estado ?? null,
          total: payload.total != null ? String(payload.total) : null,
        };
      }),
      total,
      page,
      pageSize,
    );
  }

  async getArchivedSale(id: string) {
    const row = await this.prisma.archivedSale.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Venta archivada no encontrada');
    return {
      id: row.id,
      establishmentId: row.establishmentId,
      originalCreatedAt: row.originalCreatedAt,
      archivedAt: row.archivedAt,
      fromColdStorage: true,
      payload: row.payload,
    };
  }

  async listArchivedKardex(query: ArchiveListQueryDto) {
    const { page, pageSize, skip, take } = paginationArgs(query);
    const dateFilter = await this.archiveDateFilter(query);
    const where: Prisma.ArchivedInventoryInboundMovementWhereInput = {
      ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
      ...(query.productId ? { productId: query.productId } : {}),
      ...(dateFilter ? { originalFechaRegistro: dateFilter } : {}),
    };

    if (query.establishmentId && !query.warehouseId) {
      const warehouses = await this.prisma.warehouse.findMany({
        where: { establishmentId: query.establishmentId, deletedAt: null },
        select: { id: true },
      });
      if (warehouses.length === 0) {
        return buildPaginatedResult([], 0, page, pageSize);
      }
      where.warehouseId = { in: warehouses.map((w) => w.id) };
    }

    const [total, rows] = await Promise.all([
      this.prisma.archivedInventoryInboundMovement.count({ where }),
      this.prisma.archivedInventoryInboundMovement.findMany({
        where,
        skip,
        take,
        orderBy: { originalFechaRegistro: 'desc' },
      }),
    ]);

    return buildPaginatedResult(
      rows.map((row) => {
        const payload = (row.payload ?? {}) as Record<string, unknown>;
        return {
          id: row.id,
          warehouseId: row.warehouseId,
          productId: row.productId,
          originalFechaRegistro: row.originalFechaRegistro,
          archivedAt: row.archivedAt,
          movementType: payload.movementType ?? null,
          cantidad: payload.cantidad != null ? String(payload.cantidad) : null,
          codigoLote: payload.codigoLote ?? null,
        };
      }),
      total,
      page,
      pageSize,
    );
  }

  async getArchivedKardex(id: string) {
    const row = await this.prisma.archivedInventoryInboundMovement.findUnique({
      where: { id },
    });
    if (!row) throw new NotFoundException('Movimiento archivado no encontrado');
    return {
      id: row.id,
      warehouseId: row.warehouseId,
      productId: row.productId,
      originalFechaRegistro: row.originalFechaRegistro,
      archivedAt: row.archivedAt,
      fromColdStorage: true,
      payload: row.payload,
    };
  }

  /** Vuelve a listados hot: limpia archivedAt. La copia en cold permanece (upsert seguro). */
  async restoreSaleToHot(id: string) {
    const archived = await this.prisma.archivedSale.findUnique({ where: { id } });
    if (!archived) throw new NotFoundException('Venta archivada no encontrada');

    const sale = await this.prisma.sale.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, archivedAt: true },
    });
    if (!sale) {
      throw new NotFoundException(
        'La fila hot de la venta no existe; no se puede restaurar al hot path',
      );
    }
    if (!sale.archivedAt) {
      return { id, restored: false, reason: 'already_hot' };
    }

    await this.prisma.sale.update({
      where: { id },
      data: { archivedAt: null },
    });
    return { id, restored: true, establishmentId: archived.establishmentId };
  }

  async restoreKardexToHot(id: string) {
    const archived = await this.prisma.archivedInventoryInboundMovement.findUnique({
      where: { id },
    });
    if (!archived) throw new NotFoundException('Movimiento archivado no encontrado');

    const movement = await this.prisma.inventoryInboundMovement.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, archivedAt: true },
    });
    if (!movement) {
      throw new NotFoundException(
        'La fila hot del movimiento no existe; no se puede restaurar al hot path',
      );
    }
    if (!movement.archivedAt) {
      return { id, restored: false, reason: 'already_hot' };
    }

    await this.prisma.inventoryInboundMovement.update({
      where: { id },
      data: { archivedAt: null },
    });
    return {
      id,
      restored: true,
      warehouseId: archived.warehouseId,
      productId: archived.productId,
    };
  }

  private async finishRun(
    runId: string,
    deletedCount: number,
    startedAt: Date,
    batchSize: number,
    mode: string,
    cutoffAt: Date,
    jobName: string,
  ) {
    const finished = await this.prisma.dataRetentionRun.update({
      where: { id: runId },
      data: {
        deletedCount,
        status: 'success',
        finishedAt: new Date(),
        details: {
          batchSize,
          durationMs: Date.now() - startedAt.getTime(),
        },
      },
    });

    this.logger.log(
      `Retención [${jobName}] mode=${mode} cutoff=${cutoffAt.toISOString()} count=${deletedCount}`,
    );
    return finished;
  }

  private async failRun(runId: string, deletedCount: number, error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    await this.prisma.dataRetentionRun.update({
      where: { id: runId },
      data: {
        deletedCount,
        status: 'failed',
        errorMessage: message.slice(0, 1000),
        finishedAt: new Date(),
      },
    });
  }

  private async archiveDateFilter(
    query: ArchiveListQueryDto,
  ): Promise<{ gte?: Date; lt?: Date } | undefined> {
    if (!query.from && !query.to) return undefined;
    const tz = query.establishmentId
      ? await this.resolveTimeZone(query.establishmentId)
      : DEFAULT_TIME_ZONE;
    const fromYmd = query.from?.trim();
    const toYmd = query.to?.trim();
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
}
