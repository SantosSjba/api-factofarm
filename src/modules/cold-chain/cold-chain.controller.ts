import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParseUUIDPipe } from '@nestjs/common/pipes';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { CreateTemperatureLogDto } from './dto/create-temperature-log.dto';
import { ColdChainService } from './cold-chain.service';

@ApiTags('cold-chain')
@ApiBearerAuth()
@Controller('cold-chain')
export class ColdChainController {
  constructor(private readonly service: ColdChainService) {}

  @Get('temperature-logs')
  @RequirePermissions('inventory.read')
  @ApiOperation({ summary: 'Listar registros de temperatura por zona' })
  list(@Query('warehouseZoneId', ParseUUIDPipe) warehouseZoneId: string) {
    return this.service.listByZone(warehouseZoneId);
  }

  @Post('temperature-logs')
  @RequirePermissions('inventory.write')
  @ApiOperation({ summary: 'Registrar temperatura de cadena de frío' })
  @ApiBody({ type: CreateTemperatureLogDto })
  create(@Body() dto: CreateTemperatureLogDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.create(dto, actor.sub);
  }
}
