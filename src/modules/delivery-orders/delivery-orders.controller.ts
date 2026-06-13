import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { DeliveryOrdersService } from './delivery-orders.service';
import {
  AssignDeliveryOrderDto,
  CreateDeliveryOrderDto,
  DeliveryOrderListQueryDto,
  UpdateDeliveryOrderStatusDto,
} from './dto/delivery-order.dto';
import { CompleteDeliverySaleDto } from './dto/complete-delivery-sale.dto';

@ApiTags('delivery-orders')
@ApiBearerAuth()
@Controller('delivery-orders')
export class DeliveryOrdersController {
  constructor(private readonly service: DeliveryOrdersService) {}

  @Get()
  @RequirePermissions('delivery.read', 'nav.ordenes_pedido')
  findAll(@Query() query: DeliveryOrderListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.findAll(actor.establecimientoId, query);
  }

  @Get(':id')
  @RequirePermissions('delivery.read', 'nav.ordenes_pedido')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.findOne(id, actor.establecimientoId);
  }

  @Post()
  @RequirePermissions('delivery.write', 'nav.ordenes_pedido')
  @ApiOperation({ summary: 'Crear pedido delivery' })
  create(@Body() dto: CreateDeliveryOrderDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.create(actor.establecimientoId, actor.sub, dto);
  }

  @Patch(':id/status')
  @RequirePermissions('delivery.write', 'nav.ordenes_pedido')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDeliveryOrderStatusDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.updateStatus(id, actor.establecimientoId, dto, actor.sub);
  }

  @Patch(':id/assign')
  @RequirePermissions('delivery.write', 'nav.ordenes_pedido')
  assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignDeliveryOrderDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.assign(id, actor.establecimientoId, dto, actor.sub);
  }

  @Post(':id/complete-sale')
  @RequirePermissions('delivery.write', 'sales.write', 'nav.ordenes_pedido')
  @ApiOperation({ summary: 'Registrar venta y marcar pedido entregado' })
  completeSale(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteDeliverySaleDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.completeAsSale(
      id,
      actor.establecimientoId,
      actor,
      dto.payments,
      dto.cashSessionId,
    );
  }
}
