import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { CreateInventoryTransferDto } from './dto/create-inventory-transfer.dto';
import { InventoryTransferListQueryDto } from './dto/inventory-transfer-list-query.dto';
import { InventoryTransfersService } from './inventory-transfers.service';

@ApiTags('inventory-transfers')
@ApiBearerAuth()
@Controller('inventory-transfers')
export class InventoryTransfersController {
  constructor(private readonly service: InventoryTransfersService) {}

  @Get()
  @RequirePermissions('inventory.read', 'nav.traslados')
  @ApiOperation({ summary: 'Listar transferencias entre almacenes' })
  findAll(@Query() query: InventoryTransferListQueryDto) {
    return this.service.findAll(query);
  }

  @Post()
  @RequirePermissions('inventory.write', 'nav.traslados')
  @ApiOperation({ summary: 'Crear transferencia (borrador)' })
  @ApiBody({ type: CreateInventoryTransferDto })
  create(@Body() dto: CreateInventoryTransferDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.create(dto, actor.sub);
  }

  @Post(':id/dispatch')
  @RequirePermissions('inventory.write', 'nav.traslados')
  @ApiOperation({ summary: 'Despachar transferencia (salida origen)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  dispatch(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.dispatch(id, actor.sub);
  }

  @Post(':id/receive')
  @RequirePermissions('inventory.write', 'nav.traslados')
  @ApiOperation({ summary: 'Recibir transferencia (ingreso destino)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  receive(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.receive(id, actor.sub);
  }

  @Post(':id/cancel')
  @RequirePermissions('inventory.write', 'nav.traslados')
  @ApiOperation({ summary: 'Anular transferencia en borrador' })
  @ApiParam({ name: 'id', format: 'uuid' })
  cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.cancel(id, actor.sub);
  }
}
