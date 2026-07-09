import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { EstablishmentScopeService } from '../../common/scoping/establishment-scope.service';
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
  constructor(
    private readonly service: DeliveryOrdersService,
    private readonly scope: EstablishmentScopeService,
  ) {}

  @Get()
  @RequirePermissions('delivery.read', 'nav.ordenes_pedido')
  async findAll(@Query() query: DeliveryOrderListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.findAll(await this.scope.resolve(actor), query);
  }

  @Get(':id')
  @RequirePermissions('delivery.read', 'nav.ordenes_pedido')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.findOne(id, await this.scope.resolve(actor));
  }

  @Post()
  @RequirePermissions('delivery.write', 'nav.ordenes_pedido')
  @ApiOperation({ summary: 'Crear pedido delivery' })
  async create(@Body() dto: CreateDeliveryOrderDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.create(await this.scope.resolve(actor), actor.sub, dto);
  }

  @Patch(':id/status')
  @RequirePermissions('delivery.write', 'nav.ordenes_pedido')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDeliveryOrderStatusDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.updateStatus(id, await this.scope.resolve(actor), dto, actor.sub);
  }

  @Patch(':id/assign')
  @RequirePermissions('delivery.write', 'nav.ordenes_pedido')
  async assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignDeliveryOrderDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.assign(id, await this.scope.resolve(actor), dto, actor.sub);
  }

  @Post(':id/complete-sale')
  @RequirePermissions('delivery.write', 'sales.write', 'nav.ordenes_pedido')
  @ApiOperation({ summary: 'Registrar venta y marcar pedido entregado' })
  async completeSale(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteDeliverySaleDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.completeAsSale(
      id,
      await this.scope.resolve(actor),
      actor,
      dto.payments,
      dto.cashSessionId,
    );
  }
}
