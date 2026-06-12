import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { CreateSaleDto, CreateSaleReturnDto, VoidSaleDto } from './dto/create-sale.dto';
import { CheckSaleInteractionsDto } from './dto/check-sale-interactions.dto';
import { SaleListQueryDto } from './dto/sale-list-query.dto';
import { SalesService } from './sales.service';

@ApiTags('sales')
@ApiBearerAuth()
@Controller('sales')
export class SalesController {
  constructor(private readonly service: SalesService) {}

  @Get()
  @RequirePermissions('sales.read', 'nav.notas_venta', 'nav.punto_venta')
  @ApiOperation({ summary: 'Historial de ventas' })
  findAll(@Query() query: SaleListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.findAll(actor.establecimientoId, query);
  }

  @Get('pos-catalog')
  @RequirePermissions('sales.read', 'nav.punto_venta')
  @ApiOperation({ summary: 'Catálogo rápido POS (búsqueda por nombre/código/barras)' })
  posCatalog(
    @Query('warehouseId', ParseUUIDPipe) warehouseId: string,
    @Query('search') search: string | undefined,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.posCatalog(actor.establecimientoId, warehouseId, search);
  }

  @Get('pos-substitutes')
  @RequirePermissions('sales.read', 'nav.punto_venta')
  @ApiOperation({ summary: 'Sugerencias de sustitutos genéricos/bioequivalentes con stock' })
  posSubstitutes(
    @Query('productId', ParseUUIDPipe) productId: string,
    @Query('warehouseId', ParseUUIDPipe) warehouseId: string,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.suggestGenericSubstitutes(actor.establecimientoId, productId, warehouseId);
  }

  @Post('check-interactions')
  @RequirePermissions('sales.read', 'nav.punto_venta')
  @ApiOperation({ summary: 'Alertas de interacciones entre principios activos del carrito' })
  checkInteractions(@Body() dto: CheckSaleInteractionsDto) {
    return this.service.checkInteractions(dto.productIds);
  }

  @Get(':id')
  @RequirePermissions('sales.read')
  @ApiOperation({ summary: 'Detalle de venta' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.findOne(id, actor.establecimientoId);
  }

  @Post()
  @RequirePermissions('sales.write', 'nav.punto_venta')
  @ApiOperation({ summary: 'Registrar venta (POS)' })
  @ApiHeader({ name: 'Idempotency-Key', required: false })
  create(
    @Body() dto: CreateSaleDto,
    @CurrentUser() actor: JwtRequestUser,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.service.create(dto, actor, idempotencyKey);
  }

  @Post(':id/void')
  @RequirePermissions('sales.void', 'nav.anulaciones')
  @ApiOperation({ summary: 'Anular venta con reversión de stock' })
  voidSale(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VoidSaleDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.voidSale(id, dto, actor);
  }

  @Post(':id/returns')
  @RequirePermissions('sales.write', 'nav.anulaciones')
  @ApiOperation({ summary: 'Devolución parcial o total' })
  createReturn(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateSaleReturnDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.createReturn(id, dto, actor);
  }
}
