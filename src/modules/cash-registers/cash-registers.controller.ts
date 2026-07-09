import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { EstablishmentScopeService } from '../../common/scoping/establishment-scope.service';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import {
  CloseCashSessionDto,
  CreateCashMovementDto,
  CreateCashRegisterDto,
  OpenCashSessionDto,
  UpdateCashRegisterHardwareDto,
} from './dto/cash-register.dto';
import { CashRegistersService } from './cash-registers.service';

@ApiTags('cash-registers')
@ApiBearerAuth()
@Controller('cash-registers')
export class CashRegistersController {
  constructor(
    private readonly service: CashRegistersService,
    private readonly scope: EstablishmentScopeService,
  ) {}

  @Get()
  @RequirePermissions('cash.open', 'nav.caja_chica_pos')
  @ApiOperation({ summary: 'Listar cajas del establecimiento' })
  async list(@CurrentUser() actor: JwtRequestUser) {
    return this.service.listRegisters(await this.scope.resolve(actor));
  }

  @Post()
  @RequirePermissions('cash.open')
  @ApiOperation({ summary: 'Crear caja POS' })
  async create(@Body() dto: CreateCashRegisterDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.createRegister(await this.scope.resolve(actor), dto, actor.sub);
  }

  @Patch(':id/hardware')
  @RequirePermissions('cash.open', 'nav.caja_chica_pos')
  @ApiOperation({ summary: 'Configurar hardware POS de la caja (impresora, escáner, pantalla)' })
  async updateHardware(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCashRegisterHardwareDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.updateHardware(id, await this.scope.resolve(actor), dto, actor.sub);
  }

  @Get('sessions/active')
  @RequirePermissions('cash.open', 'nav.caja_chica_pos', 'nav.punto_venta')
  @ApiOperation({ summary: 'Sesión de caja activa del usuario' })
  async activeSession(@CurrentUser() actor: JwtRequestUser) {
    return this.service.getActiveSession(await this.scope.resolve(actor), actor.sub);
  }

  @Post('sessions/open')
  @RequirePermissions('cash.open', 'nav.caja_chica_pos')
  @ApiOperation({ summary: 'Apertura de caja' })
  async open(@Body() dto: OpenCashSessionDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.openSession(await this.scope.resolve(actor), actor.sub, dto);
  }

  @Post('sessions/:id/close')
  @RequirePermissions('cash.close', 'nav.caja_chica_pos')
  @ApiOperation({ summary: 'Cierre de caja con arqueo' })
  async close(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CloseCashSessionDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.closeSession(id, await this.scope.resolve(actor), actor.sub, dto);
  }

  @Get('sessions/:id/summary')
  @RequirePermissions('cash.open', 'nav.caja_chica_pos')
  @ApiOperation({ summary: 'Resumen de sesión (movimientos y ventas)' })
  async summary(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.sessionSummary(id, await this.scope.resolve(actor), actor.sub);
  }

  @Post('sessions/:id/movements')
  @RequirePermissions('cash.open', 'nav.caja_chica_pos')
  @ApiOperation({ summary: 'Ingreso/egreso manual de caja' })
  async addMovement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCashMovementDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.addMovement(id, await this.scope.resolve(actor), actor.sub, dto);
  }
}
