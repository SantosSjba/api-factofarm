import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { EstablishmentScopeService } from '../../common/scoping/establishment-scope.service';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { PharmaceuticalService } from './pharmaceutical.service';
import {
  ControlledMonthlyQueryDto,
  CreateAdverseEventDto,
  NotifyDigemidAdverseEventDto,
  PharmaReportQueryDto,
  ProfitabilityQueryDto,
  SalesAnalyticsQueryDto,
  ShrinkageExpiryQueryDto,
} from './dto/pharmaceutical.dto';
import { formatDateYmdInTimeZone, normalizeTimeZone } from '../../common/utils/timezone.util';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../common/services/audit-log.service';

@ApiTags('pharmaceutical')
@ApiBearerAuth()
@Controller('pharmaceutical')
export class PharmaceuticalController {
  constructor(
    private readonly service: PharmaceuticalService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
    private readonly scope: EstablishmentScopeService,
  ) {}

  @Get('approvers')
  @RequirePermissions('pharmaceutical.read', 'nav.punto_venta')
  @ApiOperation({ summary: 'Usuarios disponibles para segunda validación (controlados)' })
  async approvers(@CurrentUser() actor: JwtRequestUser, @Query('excludeSelf') excludeSelf?: string) {
    const establishmentId = await this.scope.resolve(actor);
    return this.service.listApprovers(
      establishmentId,
      excludeSelf === 'true' ? actor.sub : undefined,
    );
  }

  @Get('reports/top-products')
  @RequirePermissions('pharmaceutical.read', 'nav.reportes_panel')
  async topProducts(@CurrentUser() actor: JwtRequestUser) {
    return this.service.topProducts(await this.scope.resolve(actor));
  }

  @Get('reports/rotation-abc')
  @RequirePermissions('pharmaceutical.read', 'nav.reportes_panel')
  async rotationAbc(@CurrentUser() actor: JwtRequestUser) {
    return this.service.rotationAbc(await this.scope.resolve(actor));
  }

  @Get('reports/shrinkage-expiry')
  @RequirePermissions('pharmaceutical.read', 'nav.reporte_digemid', 'nav.reportes_panel')
  async shrinkageExpiry(@CurrentUser() actor: JwtRequestUser, @Query() query: ShrinkageExpiryQueryDto) {
    const establishmentId = await this.scope.resolve(actor);
    return this.service.shrinkageAndExpiryReport(
      establishmentId,
      query.warehouseId,
      query.expiryDaysAhead ?? 90,
      { from: query.from, to: query.to },
    );
  }

  @Get('reports/profitability')
  @RequirePermissions('pharmaceutical.read', 'nav.reporte_digemid', 'nav.reportes_panel')
  async profitability(@CurrentUser() actor: JwtRequestUser, @Query() query: ProfitabilityQueryDto) {
    const establishmentId = await this.scope.resolve(actor);
    return this.service.profitabilityReport(
      establishmentId,
      query.groupBy ?? 'product',
      { from: query.from, to: query.to },
    );
  }

  @Get('reports/sales-analytics')
  @RequirePermissions('pharmaceutical.read', 'nav.reporte_digemid', 'nav.reportes_panel')
  async salesAnalytics(@CurrentUser() actor: JwtRequestUser, @Query() query: SalesAnalyticsQueryDto) {
    const establishmentId = await this.scope.resolve(actor);
    return this.service.salesAnalyticsReport(
      establishmentId,
      query.groupBy ?? 'seller',
      { from: query.from, to: query.to },
      query.warehouseId,
    );
  }

  @Get('reports/dispensation-by-medico')
  @RequirePermissions('pharmaceutical.read', 'nav.reporte_digemid', 'nav.reportes_panel')
  async dispensationByMedico(@CurrentUser() actor: JwtRequestUser, @Query() query: PharmaReportQueryDto) {
    return this.service.dispensationByMedicoReport(await this.scope.resolve(actor), {
      from: query.from,
      to: query.to,
    });
  }

  @Get('reports/controlled-monthly')
  @RequirePermissions('pharmaceutical.read', 'nav.reporte_psicotropicos')
  async controlledMonthly(@CurrentUser() actor: JwtRequestUser, @Query() query: ControlledMonthlyQueryDto) {
    const establishmentId = await this.scope.resolve(actor);
    const tz = await this.resolveTimeZone(establishmentId);
    const todayYmd = formatDateYmdInTimeZone(new Date(), tz);
    const [y, m] = todayYmd.split('-').map(Number);
    const year = query.year ?? y;
    const month = query.month ?? m;
    return this.service.monthlyControlledReport(establishmentId, year, month);
  }

  @Post('reports/controlled-ledger/export')
  @RequirePermissions('pharmaceutical.read', 'nav.reporte_psicotropicos')
  @ApiOperation({ summary: 'Exportar libro controlados (Excel DIGEMID)' })
  async exportControlledLedger(
    @CurrentUser() actor: JwtRequestUser,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const buffer = await this.service.buildControlledLedgerExportBuffer(await this.scope.resolve(actor), from, to);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent('libro-controlados-digemid.xlsx')}`,
    );
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return new StreamableFile(buffer);
  }

  @Post('reports/adverse-events/export')
  @RequirePermissions('pharmaceutical.read', 'nav.reporte_digemid')
  @ApiOperation({ summary: 'Exportar farmacovigilancia (Excel DIGEMID)' })
  async exportAdverseEvents(
    @CurrentUser() actor: JwtRequestUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const buffer = await this.service.buildAdverseEventsExportBuffer(await this.scope.resolve(actor));
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent('farmacovigilancia-digemid.xlsx')}`,
    );
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return new StreamableFile(buffer);
  }

  @Get('controlled-ledger')
  @RequirePermissions('pharmaceutical.read', 'nav.reporte_psicotropicos')
  async ledger(
    @CurrentUser() actor: JwtRequestUser,
    @Query('productId') productId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.listControlledLedger(await this.scope.resolve(actor), productId, from, to);
  }

  @Get('controlled-categories')
  @RequirePermissions('pharmaceutical.read', 'nav.reporte_psicotropicos')
  categories() {
    return this.prisma.controlledSubstanceCategory.findMany({
      where: { deletedAt: null, activo: true },
      orderBy: { codigo: 'asc' },
    });
  }

  @Get('cie10')
  @RequirePermissions('pharmaceutical.read', 'nav.cie_10')
  cie10(@Query('search') search?: string) {
    const q = search?.trim();
    return this.prisma.cie10Code.findMany({
      where: {
        deletedAt: null,
        activo: true,
        ...(q
          ? {
              OR: [
                { codigo: { contains: q, mode: 'insensitive' } },
                { descripcion: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      take: 50,
      orderBy: { codigo: 'asc' },
    });
  }

  @Post('adverse-events')
  @RequirePermissions('pharmaceutical.write', 'nav.reporte_digemid')
  async createAdverseEvent(@Body() dto: CreateAdverseEventDto, @CurrentUser() actor: JwtRequestUser) {
    const establishmentId = await this.scope.resolve(actor);
    const row = await this.prisma.adverseEvent.create({
      data: {
        establishmentId,
        productId: dto.productId,
        customerId: dto.customerId ?? null,
        descripcion: dto.descripcion.trim(),
        severidad: dto.severidad ?? 'LEVE',
        pacienteEdad: dto.pacienteEdad ?? null,
        pacienteSexo: dto.pacienteSexo?.trim() || null,
        reaccionTipo: dto.reaccionTipo?.trim() || null,
        cie10Codigo: dto.cie10Codigo?.trim() || null,
        registeredById: actor.sub,
      },
    });
    await this.audit.log({ userId: actor.sub, action: 'CREATE', entity: 'AdverseEvent', entityId: row.id });
    return row;
  }

  @Patch('adverse-events/:id/notify-digemid')
  @RequirePermissions('pharmaceutical.write', 'nav.reporte_digemid')
  @ApiOperation({ summary: 'Registrar notificación oficial DIGEMID' })
  async notifyDigemid(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: NotifyDigemidAdverseEventDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    const establishmentId = await this.scope.resolve(actor);
    const current = await this.prisma.adverseEvent.findFirst({
      where: { id, establishmentId, deletedAt: null },
    });
    if (!current) throw new NotFoundException('Evento adverso no encontrado');

    const row = await this.prisma.adverseEvent.update({
      where: { id },
      data: {
        notificadoDigemid: true,
        digemidReportNumber: dto.digemidReportNumber.trim(),
        medidasCorrectivas: dto.medidasCorrectivas?.trim() || null,
        fechaNotificacion: dto.fechaNotificacion ? new Date(dto.fechaNotificacion) : new Date(),
        pacienteEdad: dto.pacienteEdad ?? current.pacienteEdad,
        pacienteSexo: dto.pacienteSexo?.trim() || current.pacienteSexo,
        reaccionTipo: dto.reaccionTipo?.trim() || current.reaccionTipo,
        cie10Codigo: dto.cie10Codigo?.trim() || current.cie10Codigo,
      },
    });
    await this.audit.log({ userId: actor.sub, action: 'NOTIFY_DIGEMID', entity: 'AdverseEvent', entityId: id });
    return row;
  }

  @Get('adverse-events')
  @RequirePermissions('pharmaceutical.read', 'nav.reporte_digemid')
  async adverseEvents(@CurrentUser() actor: JwtRequestUser) {
    return this.prisma.adverseEvent.findMany({
      where: { establishmentId: await this.scope.resolve(actor), deletedAt: null },
      orderBy: { fecha: 'desc' },
      take: 100,
      include: {
        product: { select: { nombre: true, codigoInterno: true } },
        customer: { select: { nombre: true, numeroDocumento: true } },
      },
    });
  }

  @Get('reports/sanitary-registry-alerts')
  @RequirePermissions('pharmaceutical.read', 'nav.reporte_digemid', 'products.read')
  async sanitaryAlerts(@CurrentUser() actor: JwtRequestUser, @Query('daysAhead') daysAhead?: string) {
    return this.service.sanitaryRegistryAlerts(
      await this.scope.resolve(actor),
      daysAhead ? Number(daysAhead) : 90,
    );
  }

  @Get('reports/lot-traceability')
  @RequirePermissions('pharmaceutical.read', 'nav.reporte_digemid')
  async lotTraceability(@CurrentUser() actor: JwtRequestUser, @Query('codigoLote') codigoLote: string) {
    return this.service.lotTraceabilityReport(await this.scope.resolve(actor), codigoLote);
  }

  @Get('reports/bpa-storage')
  @RequirePermissions('pharmaceutical.read', 'nav.reporte_digemid')
  async bpaStorage(@CurrentUser() actor: JwtRequestUser) {
    return this.service.bpaStorageReport(await this.scope.resolve(actor));
  }

  @Get('reports/inspection-export')
  @RequirePermissions('pharmaceutical.read', 'nav.reporte_digemid')
  @ApiOperation({ summary: 'Exportación inspección DIGEMID (Excel)' })
  async inspectionExport(@CurrentUser() actor: JwtRequestUser, @Res() res: Response) {
    const buffer = await this.service.buildInspectionExportBuffer(await this.scope.resolve(actor));
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent('inspeccion-digemid.xlsx')}`,
    );
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  }

  @Get('reports/anonymized-sales-stats')
  @RequirePermissions('pharmaceutical.read', 'nav.reportes_panel')
  async anonymizedStats(@CurrentUser() actor: JwtRequestUser) {
    return this.service.anonymizedSalesStats(await this.scope.resolve(actor));
  }

  private async resolveTimeZone(establishmentId: string): Promise<string> {
    const row = await this.prisma.establishment.findFirst({
      where: { id: establishmentId, deletedAt: null },
      select: { timeZone: true },
    });
    return normalizeTimeZone(row?.timeZone);
  }
}
