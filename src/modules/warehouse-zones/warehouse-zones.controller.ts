import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { CreateWarehouseZoneDto } from './dto/create-warehouse-zone.dto';
import { UpdateWarehouseZoneDto } from './dto/update-warehouse-zone.dto';
import { WarehouseZonesService } from './warehouse-zones.service';

@ApiTags('warehouse-zones')
@ApiBearerAuth()
@Controller('warehouse-zones')
export class WarehouseZonesController {
  constructor(private readonly service: WarehouseZonesService) {}

  @Get()
  @RequirePermissions('inventory.read')
  @ApiOperation({ summary: 'Listar zonas BPA por almacén' })
  findByWarehouse(@Query('warehouseId', ParseUUIDPipe) warehouseId: string) {
    return this.service.findByWarehouse(warehouseId);
  }

  @Post()
  @RequirePermissions('inventory.write')
  @ApiOperation({ summary: 'Crear zona de almacén (BPA)' })
  @ApiBody({ type: CreateWarehouseZoneDto })
  create(@Body() dto: CreateWarehouseZoneDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.create(dto, actor.sub);
  }

  @Patch(':id')
  @RequirePermissions('inventory.write')
  @ApiOperation({ summary: 'Actualizar zona de almacén' })
  @ApiParam({ name: 'id', format: 'uuid' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWarehouseZoneDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.update(id, dto, actor.sub);
  }

  @Delete(':id')
  @RequirePermissions('inventory.write')
  @ApiOperation({ summary: 'Eliminar zona de almacén' })
  @ApiParam({ name: 'id', format: 'uuid' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.remove(id, actor.sub);
  }
}
