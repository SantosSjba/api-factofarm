import {
  Body,
  Controller,
  Get,
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
import type { CashActor } from './cash-access.util';
import {
  CashSessionFiltersDto,
  CashSessionReportQueryDto,
  CloseCashSessionDto,
  CreateCashMovementDto,
  CreateCashRegisterDto,
  ExportCashSessionsQueryDto,
  ListCashSessionsQueryDto,
  OpenCashSessionDto,
  UpdateCashRegisterHardwareDto,
} from './dto/cash-register.dto';
import { CashRegistersService } from './cash-registers.service';
import { CashSessionsHistoryService } from './cash-sessions-history.service';

/** Consultar cajas: cajeros (POS / caja chica) y supervisores (historial). */
const CASH_READ = [
  'cash.open',
  'nav.caja_chica_pos',
  'nav.punto_venta',
  'nav.historial_cajas',
] as const;
/** Cerrar: el cajero que abrió desde el POS también debe poder cerrar su caja. */
const CASH_CLOSE = [
  'cash.close',
  'nav.caja_chica_pos',
  'nav.punto_venta',
  'nav.historial_cajas',
] as const;

@ApiTags('cash-registers')
@ApiBearerAuth()
@Controller('cash-registers')
export class CashRegistersController {
  constructor(
    private readonly service: CashRegistersService,
    private readonly history: CashSessionsHistoryService,
    private readonly scope: EstablishmentScopeService,
  ) {}

  private async actor(user: JwtRequestUser): Promise<CashActor> {
    return {
      userId: user.sub,
      role: user.role,
      permissionCodes: user.permissionCodes ?? [],
      tenantId: user.tenantId ?? null,
      establishmentId: await this.scope.resolve(user),
    };
  }

  @Get()
  @RequirePermissions(...CASH_READ)
  @ApiOperation({ summary: 'Listar cajas del establecimiento' })
  async list(@CurrentUser() actor: JwtRequestUser) {
    return this.service.listRegisters(await this.scope.resolve(actor));
  }

  @Post()
  @RequirePermissions('cash.open')
  @ApiOperation({ summary: 'Crear caja POS' })
  async create(
    @Body() dto: CreateCashRegisterDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.createRegister(
      await this.scope.resolve(actor),
      dto,
      actor.sub,
    );
  }

  @Patch(':id/hardware')
  @RequirePermissions('cash.open', 'nav.caja_chica_pos')
  @ApiOperation({
    summary:
      'Configurar hardware POS de la caja (impresora, escáner, pantalla)',
  })
  async updateHardware(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCashRegisterHardwareDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.updateHardware(
      id,
      await this.scope.resolve(actor),
      dto,
      actor.sub,
    );
  }

  @Get('sessions/active')
  @RequirePermissions(...CASH_READ)
  @ApiOperation({ summary: 'Sesión de caja activa del usuario' })
  async activeSession(@CurrentUser() actor: JwtRequestUser) {
    return this.service.getActiveSession(
      await this.scope.resolve(actor),
      actor.sub,
    );
  }

  @Get('sessions/open')
  @RequirePermissions(...CASH_READ)
  @ApiOperation({
    summary:
      'Cajas abiertas ahora en el establecimiento (de cualquier usuario) y si el actor puede cerrarlas',
  })
  async openSessions(@CurrentUser() user: JwtRequestUser) {
    return this.service.listOpenSessions(await this.actor(user));
  }

  @Get('sessions')
  @RequirePermissions(...CASH_READ)
  @ApiOperation({
    summary:
      'Historial paginado de sesiones (sin permiso de supervisión: solo las propias)',
  })
  async listSessions(
    @Query() query: ListCashSessionsQueryDto,
    @CurrentUser() user: JwtRequestUser,
  ) {
    return this.history.list(await this.actor(user), query);
  }

  @Get('sessions/cashiers')
  @RequirePermissions(...CASH_READ)
  @ApiOperation({ summary: 'Cajeros con sesiones (filtro del historial)' })
  async cashiers(
    @Query() query: CashSessionFiltersDto,
    @CurrentUser() user: JwtRequestUser,
  ) {
    return this.history.cashiers(await this.actor(user), query);
  }

  @Get('sessions/kpis')
  @RequirePermissions(...CASH_READ)
  @ApiOperation({
    summary:
      'Indicadores: abiertas ahora, abiertas > 24 h, diferencias acumuladas',
  })
  async kpis(
    @Query() query: CashSessionFiltersDto,
    @CurrentUser() user: JwtRequestUser,
  ) {
    return this.history.kpis(await this.actor(user), query);
  }

  @Get('sessions/export')
  @RequirePermissions(...CASH_READ)
  @ApiOperation({ summary: 'Exportar historial de cajas (Excel o PDF)' })
  async exportSessions(
    @Query() query: ExportCashSessionsQueryDto,
    @CurrentUser() user: JwtRequestUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const file = await this.history.export(
      await this.actor(user),
      query,
      query.format ?? 'xlsx',
    );
    res.setHeader('Content-Type', file.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
    );
    return new StreamableFile(file.buffer);
  }

  @Post('sessions/open')
  @RequirePermissions('cash.open', 'nav.caja_chica_pos')
  @ApiOperation({ summary: 'Apertura de caja' })
  async open(
    @Body() dto: OpenCashSessionDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.openSession(
      await this.scope.resolve(actor),
      actor.sub,
      dto,
    );
  }

  @Post('sessions/:id/close')
  @RequirePermissions(...CASH_CLOSE)
  @ApiOperation({
    summary:
      'Cierre de caja con arqueo (cierre forzado si la abrió otro usuario: requiere supervisión y motivo)',
  })
  async close(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CloseCashSessionDto,
    @CurrentUser() user: JwtRequestUser,
  ) {
    return this.service.closeSession(id, await this.actor(user), dto);
  }

  @Get('sessions/:id/summary')
  @RequirePermissions(...CASH_READ)
  @ApiOperation({ summary: 'Detalle de sesión (arqueo, ventas y movimientos)' })
  async summary(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtRequestUser,
  ) {
    return this.service.sessionSummary(id, await this.actor(user));
  }

  @Get('sessions/:id/report')
  @RequirePermissions(...CASH_READ)
  @ApiOperation({ summary: 'PDF del reporte de cierre / arqueo (reimpresión)' })
  async report(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CashSessionReportQueryDto,
    @CurrentUser() user: JwtRequestUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const file = await this.history.sessionReport(
      await this.actor(user),
      id,
      query.format ?? 'a4',
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
    );
    return new StreamableFile(file.buffer);
  }

  @Post('sessions/:id/movements')
  @RequirePermissions('cash.open', 'nav.caja_chica_pos')
  @ApiOperation({ summary: 'Ingreso/egreso manual de caja' })
  async addMovement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCashMovementDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.addMovement(
      id,
      await this.scope.resolve(actor),
      actor.sub,
      dto,
    );
  }
}
