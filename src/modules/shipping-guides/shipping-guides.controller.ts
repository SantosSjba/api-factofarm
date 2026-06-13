import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import {
  CreateDepartureAddressDto,
  CreateShippingCarrierDto,
  CreateShippingDriverDto,
  CreateShippingVehicleDto,
  ShippingListQueryDto,
  UpdateDepartureAddressDto,
  UpdateShippingCarrierDto,
  UpdateShippingDriverDto,
  UpdateShippingVehicleDto,
} from './dto/shipping-guides.dto';
import { ShippingGuidesService } from './shipping-guides.service';

@ApiTags('shipping-guides')
@ApiBearerAuth()
@Controller('shipping-guides')
export class ShippingGuidesController {
  constructor(private readonly service: ShippingGuidesService) {}

  @Get('carriers')
  @RequirePermissions('shipping.read', 'nav.transportistas', 'nav.gr_transportista')
  listCarriers(@Query() query: ShippingListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.listCarriers(actor.establecimientoId, query);
  }

  @Post('carriers')
  @RequirePermissions('shipping.write', 'nav.transportistas')
  createCarrier(@Body() dto: CreateShippingCarrierDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.createCarrier(actor.establecimientoId, dto, actor.sub);
  }

  @Patch('carriers/:id')
  @RequirePermissions('shipping.write', 'nav.transportistas')
  updateCarrier(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShippingCarrierDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.updateCarrier(actor.establecimientoId, id, dto, actor.sub);
  }

  @Delete('carriers/:id')
  @RequirePermissions('shipping.write', 'nav.transportistas')
  removeCarrier(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.removeCarrier(actor.establecimientoId, id, actor.sub);
  }

  @Get('drivers')
  @RequirePermissions('shipping.read', 'nav.conductores', 'nav.gr_transportista')
  listDrivers(@Query() query: ShippingListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.listDrivers(actor.establecimientoId, query);
  }

  @Post('drivers')
  @RequirePermissions('shipping.write', 'nav.conductores')
  createDriver(@Body() dto: CreateShippingDriverDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.createDriver(actor.establecimientoId, dto, actor.sub);
  }

  @Patch('drivers/:id')
  @RequirePermissions('shipping.write', 'nav.conductores')
  updateDriver(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShippingDriverDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.updateDriver(actor.establecimientoId, id, dto, actor.sub);
  }

  @Delete('drivers/:id')
  @RequirePermissions('shipping.write', 'nav.conductores')
  removeDriver(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.removeDriver(actor.establecimientoId, id, actor.sub);
  }

  @Get('vehicles')
  @RequirePermissions('shipping.read', 'nav.vehiculos', 'nav.gr_transportista')
  listVehicles(@Query() query: ShippingListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.listVehicles(actor.establecimientoId, query);
  }

  @Post('vehicles')
  @RequirePermissions('shipping.write', 'nav.vehiculos')
  createVehicle(@Body() dto: CreateShippingVehicleDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.createVehicle(actor.establecimientoId, dto, actor.sub);
  }

  @Patch('vehicles/:id')
  @RequirePermissions('shipping.write', 'nav.vehiculos')
  updateVehicle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShippingVehicleDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.updateVehicle(actor.establecimientoId, id, dto, actor.sub);
  }

  @Delete('vehicles/:id')
  @RequirePermissions('shipping.write', 'nav.vehiculos')
  removeVehicle(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.removeVehicle(actor.establecimientoId, id, actor.sub);
  }

  @Get('departure-addresses')
  @RequirePermissions('shipping.read', 'nav.direcciones_partida', 'nav.gr_remitente')
  listDepartureAddresses(@Query() query: ShippingListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.listDepartureAddresses(actor.establecimientoId, query);
  }

  @Post('departure-addresses')
  @RequirePermissions('shipping.write', 'nav.direcciones_partida')
  createDepartureAddress(
    @Body() dto: CreateDepartureAddressDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.createDepartureAddress(actor.establecimientoId, dto, actor.sub);
  }

  @Patch('departure-addresses/:id')
  @RequirePermissions('shipping.write', 'nav.direcciones_partida')
  updateDepartureAddress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDepartureAddressDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.updateDepartureAddress(actor.establecimientoId, id, dto, actor.sub);
  }

  @Delete('departure-addresses/:id')
  @RequirePermissions('shipping.write', 'nav.direcciones_partida')
  removeDepartureAddress(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.removeDepartureAddress(actor.establecimientoId, id, actor.sub);
  }
}
