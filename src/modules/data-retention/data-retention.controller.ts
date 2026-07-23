import { Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { DataRetentionService } from './data-retention.service';
import { ArchiveListQueryDto } from './dto/archive-list-query.dto';

@ApiTags('platform-data-retention')
@ApiBearerAuth()
@Controller('platform/data-retention')
export class DataRetentionController {
  constructor(private readonly retention: DataRetentionService) {}

  @Get('metrics')
  @RequirePermissions('tenants.read', 'nav.platform_clientes')
  @ApiOperation({
    summary: 'Métricas de tamaño de tablas críticas (SUPER_ADMIN)',
  })
  async metrics(@CurrentUser() actor: JwtRequestUser) {
    this.retention.assertPlatformAdmin(actor);
    return this.retention.getMetrics();
  }

  @Get('runs')
  @RequirePermissions('tenants.read', 'nav.platform_clientes')
  @ApiOperation({ summary: 'Últimas corridas de retención' })
  async runs(
    @CurrentUser() actor: JwtRequestUser,
    @Query('limit') limit?: string,
  ) {
    this.retention.assertPlatformAdmin(actor);
    return this.retention.listRuns(limit ? Number(limit) : 20);
  }

  @Post('audit/dry-run')
  @RequirePermissions('tenants.write', 'nav.platform_clientes')
  @ApiOperation({ summary: 'Simular purga de AuditLog (no borra)' })
  async auditDryRun(@CurrentUser() actor: JwtRequestUser) {
    this.retention.assertPlatformAdmin(actor);
    return this.retention.runAuditRetention('dry-run');
  }

  @Post('audit/purge')
  @RequirePermissions('tenants.write', 'nav.platform_clientes')
  @ApiOperation({
    summary: 'Purgar AuditLog antiguos (requiere DATA_RETENTION_PURGE_ENABLED=true)',
  })
  async auditPurge(@CurrentUser() actor: JwtRequestUser) {
    this.retention.assertPlatformAdmin(actor);
    return this.retention.runAuditRetention('purge');
  }

  @Post('archive/sales/dry-run')
  @RequirePermissions('tenants.write', 'nav.platform_clientes')
  @ApiOperation({ summary: 'Simular archivado de ventas antiguas (sin DELETE)' })
  async salesArchiveDryRun(@CurrentUser() actor: JwtRequestUser) {
    this.retention.assertPlatformAdmin(actor);
    return this.retention.runSalesArchive('dry-run');
  }

  @Post('archive/sales')
  @RequirePermissions('tenants.write', 'nav.platform_clientes')
  @ApiOperation({
    summary: 'Archivar ventas antiguas a cold storage (requiere DATA_RETENTION_ARCHIVE_ENABLED=true)',
  })
  async salesArchive(@CurrentUser() actor: JwtRequestUser) {
    this.retention.assertPlatformAdmin(actor);
    return this.retention.runSalesArchive('archive');
  }

  @Get('archive/sales')
  @RequirePermissions('tenants.read', 'nav.platform_clientes')
  @ApiOperation({ summary: 'Listar ventas en cold storage (plataforma)' })
  async listArchivedSales(
    @CurrentUser() actor: JwtRequestUser,
    @Query() query: ArchiveListQueryDto,
  ) {
    this.retention.assertPlatformAdmin(actor);
    return this.retention.listArchivedSales(query);
  }

  @Get('archive/sales/:id')
  @RequirePermissions('tenants.read', 'nav.platform_clientes')
  @ApiOperation({ summary: 'Detalle de venta en cold storage' })
  async getArchivedSale(
    @CurrentUser() actor: JwtRequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    this.retention.assertPlatformAdmin(actor);
    return this.retention.getArchivedSale(id);
  }

  @Post('archive/sales/:id/restore')
  @RequirePermissions('tenants.write', 'nav.platform_clientes')
  @ApiOperation({
    summary: 'Restaurar venta al hot path (limpia archivedAt; conserva copia cold)',
  })
  async restoreSale(
    @CurrentUser() actor: JwtRequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    this.retention.assertPlatformAdmin(actor);
    return this.retention.restoreSaleToHot(id);
  }

  @Post('archive/kardex/dry-run')
  @RequirePermissions('tenants.write', 'nav.platform_clientes')
  @ApiOperation({ summary: 'Simular archivado de kardex antiguo (sin DELETE)' })
  async kardexArchiveDryRun(@CurrentUser() actor: JwtRequestUser) {
    this.retention.assertPlatformAdmin(actor);
    return this.retention.runKardexArchive('dry-run');
  }

  @Post('archive/kardex')
  @RequirePermissions('tenants.write', 'nav.platform_clientes')
  @ApiOperation({
    summary: 'Archivar kardex antiguo a cold storage (requiere DATA_RETENTION_ARCHIVE_ENABLED=true)',
  })
  async kardexArchive(@CurrentUser() actor: JwtRequestUser) {
    this.retention.assertPlatformAdmin(actor);
    return this.retention.runKardexArchive('archive');
  }

  @Get('archive/kardex')
  @RequirePermissions('tenants.read', 'nav.platform_clientes')
  @ApiOperation({ summary: 'Listar movimientos kardex en cold storage (plataforma)' })
  async listArchivedKardex(
    @CurrentUser() actor: JwtRequestUser,
    @Query() query: ArchiveListQueryDto,
  ) {
    this.retention.assertPlatformAdmin(actor);
    return this.retention.listArchivedKardex(query);
  }

  @Get('archive/kardex/:id')
  @RequirePermissions('tenants.read', 'nav.platform_clientes')
  @ApiOperation({ summary: 'Detalle de movimiento kardex en cold storage' })
  async getArchivedKardex(
    @CurrentUser() actor: JwtRequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    this.retention.assertPlatformAdmin(actor);
    return this.retention.getArchivedKardex(id);
  }

  @Post('archive/kardex/:id/restore')
  @RequirePermissions('tenants.write', 'nav.platform_clientes')
  @ApiOperation({
    summary: 'Restaurar movimiento kardex al hot path (limpia archivedAt)',
  })
  async restoreKardex(
    @CurrentUser() actor: JwtRequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    this.retention.assertPlatformAdmin(actor);
    return this.retention.restoreKardexToHot(id);
  }
}
