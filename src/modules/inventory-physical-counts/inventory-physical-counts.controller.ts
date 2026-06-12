import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { CreatePhysicalCountDto } from './dto/create-physical-count.dto';
import { UpsertPhysicalCountItemDto } from './dto/upsert-physical-count-item.dto';
import { InventoryPhysicalCountsService } from './inventory-physical-counts.service';

@ApiTags('inventory-physical-counts')
@ApiBearerAuth()
@Controller('inventory-physical-counts')
export class InventoryPhysicalCountsController {
  constructor(private readonly service: InventoryPhysicalCountsService) {}

  @Get()
  @RequirePermissions('inventory.read', 'nav.reporte_inventario')
  @ApiOperation({ summary: 'Listar conteos físicos' })
  findAll(@Query('page') page?: number, @Query('pageSize') pageSize?: number) {
    return this.service.findAll(Number(page) || 1, Number(pageSize) || 10);
  }

  @Get(':id')
  @RequirePermissions('inventory.read', 'nav.reporte_inventario')
  @ApiOperation({ summary: 'Detalle de conteo físico' })
  @ApiParam({ name: 'id', format: 'uuid' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions('inventory.adjust', 'nav.reporte_inventario')
  @ApiOperation({ summary: 'Iniciar conteo físico' })
  @ApiBody({ type: CreatePhysicalCountDto })
  create(@Body() dto: CreatePhysicalCountDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.create(dto, actor.sub);
  }

  @Post(':id/items')
  @RequirePermissions('inventory.adjust', 'nav.reporte_inventario')
  @ApiOperation({ summary: 'Registrar o actualizar línea de conteo' })
  @ApiParam({ name: 'id', format: 'uuid' })
  upsertItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertPhysicalCountItemDto,
  ) {
    return this.service.upsertItem(id, dto);
  }

  @Post(':id/finalize')
  @RequirePermissions('inventory.adjust', 'nav.reporte_inventario')
  @ApiOperation({ summary: 'Finalizar conteo y generar ajustes' })
  @ApiParam({ name: 'id', format: 'uuid' })
  finalize(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.finalize(id, actor.sub);
  }
}
