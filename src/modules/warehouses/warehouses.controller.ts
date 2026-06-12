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
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { WarehouseListQueryDto } from './dto/warehouse-list-query.dto';
import { WarehousesService } from './warehouses.service';

@ApiTags('warehouses')
@ApiBearerAuth()
@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Get()
  @RequirePermissions('inventory.read', 'nav.inventario_movimientos')
  @ApiOperation({ summary: 'Listar almacenes' })
  findAll(@Query() query: WarehouseListQueryDto) {
    return this.warehousesService.findAll(query);
  }

  @Post()
  @RequirePermissions('inventory.write')
  @ApiOperation({ summary: 'Crear almacén' })
  @ApiBody({ type: CreateWarehouseDto })
  create(@Body() dto: CreateWarehouseDto, @CurrentUser() actor: JwtRequestUser) {
    return this.warehousesService.create(dto, actor.sub);
  }

  @Patch(':id')
  @RequirePermissions('inventory.write')
  @ApiOperation({ summary: 'Actualizar almacén' })
  @ApiParam({ name: 'id', format: 'uuid' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWarehouseDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.warehousesService.update(id, dto, actor.sub);
  }

  @Delete(':id')
  @RequirePermissions('inventory.write')
  @ApiOperation({ summary: 'Eliminar almacén (soft delete)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.warehousesService.remove(id, actor.sub);
  }
}
