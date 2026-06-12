import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import {
  CloseCashSessionDto,
  CreateCashMovementDto,
  CreateCashRegisterDto,
  OpenCashSessionDto,
} from './dto/cash-register.dto';
import { CashRegistersService } from './cash-registers.service';

@ApiTags('cash-registers')
@ApiBearerAuth()
@Controller('cash-registers')
export class CashRegistersController {
  constructor(private readonly service: CashRegistersService) {}

  @Get()
  @RequirePermissions('cash.open', 'nav.caja_chica_pos')
  @ApiOperation({ summary: 'Listar cajas del establecimiento' })
  list(@CurrentUser() actor: JwtRequestUser) {
    return this.service.listRegisters(actor.establecimientoId);
  }

  @Post()
  @RequirePermissions('cash.open')
  @ApiOperation({ summary: 'Crear caja POS' })
  create(@Body() dto: CreateCashRegisterDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.createRegister(actor.establecimientoId, dto, actor.sub);
  }

  @Get('sessions/active')
  @RequirePermissions('cash.open', 'nav.caja_chica_pos', 'nav.punto_venta')
  @ApiOperation({ summary: 'Sesión de caja activa del usuario' })
  activeSession(@CurrentUser() actor: JwtRequestUser) {
    return this.service.getActiveSession(actor.establecimientoId, actor.sub);
  }

  @Post('sessions/open')
  @RequirePermissions('cash.open', 'nav.caja_chica_pos')
  @ApiOperation({ summary: 'Apertura de caja' })
  open(@Body() dto: OpenCashSessionDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.openSession(actor.establecimientoId, actor.sub, dto);
  }

  @Post('sessions/:id/close')
  @RequirePermissions('cash.close', 'nav.caja_chica_pos')
  @ApiOperation({ summary: 'Cierre de caja con arqueo' })
  close(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CloseCashSessionDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.closeSession(id, actor.establecimientoId, actor.sub, dto);
  }

  @Get('sessions/:id/summary')
  @RequirePermissions('cash.open', 'nav.caja_chica_pos')
  @ApiOperation({ summary: 'Resumen de sesión (movimientos y ventas)' })
  summary(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.sessionSummary(id, actor.establecimientoId, actor.sub);
  }

  @Post('sessions/:id/movements')
  @RequirePermissions('cash.open', 'nav.caja_chica_pos')
  @ApiOperation({ summary: 'Ingreso/egreso manual de caja' })
  addMovement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCashMovementDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.addMovement(id, actor.establecimientoId, actor.sub, dto);
  }
}
