import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { EstablishmentScopeService } from '../../common/scoping/establishment-scope.service';
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
  constructor(
    private readonly service: ShippingGuidesService,
    private readonly scope: EstablishmentScopeService,
  ) {}

  @Get('carriers')
  @RequirePermissions('shipping.read', 'nav.transportistas', 'nav.gr_transportista')
  async listCarriers(@Query() query: ShippingListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.listCarriers(await this.scope.resolve(actor), query);
  }

  @Post('carriers')
  @RequirePermissions('shipping.write', 'nav.transportistas')
  async createCarrier(@Body() dto: CreateShippingCarrierDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.createCarrier(await this.scope.resolve(actor), dto, actor.sub);
  }

  @Patch('carriers/:id')
  @RequirePermissions('shipping.write', 'nav.transportistas')
  async updateCarrier(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShippingCarrierDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.updateCarrier(await this.scope.resolve(actor), id, dto, actor.sub);
  }

  @Delete('carriers/:id')
  @RequirePermissions('shipping.write', 'nav.transportistas')
  async removeCarrier(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.removeCarrier(await this.scope.resolve(actor), id, actor.sub);
  }

  @Get('drivers')
  @RequirePermissions('shipping.read', 'nav.conductores', 'nav.gr_transportista')
  async listDrivers(@Query() query: ShippingListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.listDrivers(await this.scope.resolve(actor), query);
  }

  @Post('drivers')
  @RequirePermissions('shipping.write', 'nav.conductores')
  async createDriver(@Body() dto: CreateShippingDriverDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.createDriver(await this.scope.resolve(actor), dto, actor.sub);
  }

  @Patch('drivers/:id')
  @RequirePermissions('shipping.write', 'nav.conductores')
  async updateDriver(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShippingDriverDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.updateDriver(await this.scope.resolve(actor), id, dto, actor.sub);
  }

  @Delete('drivers/:id')
  @RequirePermissions('shipping.write', 'nav.conductores')
  async removeDriver(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.removeDriver(await this.scope.resolve(actor), id, actor.sub);
  }

  @Get('vehicles')
  @RequirePermissions('shipping.read', 'nav.vehiculos', 'nav.gr_transportista')
  async listVehicles(@Query() query: ShippingListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.listVehicles(await this.scope.resolve(actor), query);
  }

  @Post('vehicles')
  @RequirePermissions('shipping.write', 'nav.vehiculos')
  async createVehicle(@Body() dto: CreateShippingVehicleDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.createVehicle(await this.scope.resolve(actor), dto, actor.sub);
  }

  @Patch('vehicles/:id')
  @RequirePermissions('shipping.write', 'nav.vehiculos')
  async updateVehicle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShippingVehicleDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.updateVehicle(await this.scope.resolve(actor), id, dto, actor.sub);
  }

  @Delete('vehicles/:id')
  @RequirePermissions('shipping.write', 'nav.vehiculos')
  async removeVehicle(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.removeVehicle(await this.scope.resolve(actor), id, actor.sub);
  }

  @Get('departure-addresses')
  @RequirePermissions('shipping.read', 'nav.direcciones_partida', 'nav.gr_remitente')
  async listDepartureAddresses(
    @Query() query: ShippingListQueryDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.listDepartureAddresses(await this.scope.resolve(actor), query);
  }

  @Post('departure-addresses')
  @RequirePermissions('shipping.write', 'nav.direcciones_partida')
  async createDepartureAddress(
    @Body() dto: CreateDepartureAddressDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.createDepartureAddress(await this.scope.resolve(actor), dto, actor.sub);
  }

  @Patch('departure-addresses/:id')
  @RequirePermissions('shipping.write', 'nav.direcciones_partida')
  async updateDepartureAddress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDepartureAddressDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.updateDepartureAddress(await this.scope.resolve(actor), id, dto, actor.sub);
  }

  @Delete('departure-addresses/:id')
  @RequirePermissions('shipping.write', 'nav.direcciones_partida')
  async removeDepartureAddress(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.removeDepartureAddress(await this.scope.resolve(actor), id, actor.sub);
  }
}
