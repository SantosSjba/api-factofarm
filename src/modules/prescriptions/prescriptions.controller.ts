import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { EstablishmentScopeService } from '../../common/scoping/establishment-scope.service';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import {
  AttachPrescriptionImageDto,
  CreatePrescriptionDto,
  DispensePrescriptionDto,
  PrescriptionListQueryDto,
} from './dto/prescription.dto';
import { PrescriptionsService } from './prescriptions.service';

@ApiTags('prescriptions')
@ApiBearerAuth()
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(
    private readonly service: PrescriptionsService,
    private readonly scope: EstablishmentScopeService,
  ) {}

  @Get()
  @RequirePermissions('prescriptions.read', 'nav.recetas')
  @ApiOperation({ summary: 'Listar recetas médicas' })
  async findAll(@Query() query: PrescriptionListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.findAll(await this.scope.resolve(actor), query);
  }

  @Get('customer/:customerId')
  @RequirePermissions('prescriptions.read', 'nav.punto_venta', 'nav.recetas')
  @ApiOperation({ summary: 'Recetas activas de un paciente' })
  async findByCustomer(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.findByCustomer(customerId, await this.scope.resolve(actor));
  }

  @Get(':id')
  @RequirePermissions('prescriptions.read', 'nav.recetas')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.findOne(id, await this.scope.resolve(actor));
  }

  @Post()
  @RequirePermissions('prescriptions.write', 'nav.recetas')
  async create(@Body() dto: CreatePrescriptionDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.create(await this.scope.resolve(actor), dto, actor.sub);
  }

  @Post(':id/dispense')
  @RequirePermissions('prescriptions.write', 'nav.recetas', 'nav.punto_venta')
  async dispense(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DispensePrescriptionDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.manualDispense(id, await this.scope.resolve(actor), dto, actor.sub);
  }

  @Patch(':id/image')
  @RequirePermissions('prescriptions.write', 'nav.recetas')
  @ApiOperation({ summary: 'Adjuntar imagen escaneada de receta' })
  async attachImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AttachPrescriptionImageDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.attachImage(id, await this.scope.resolve(actor), dto.imagenArchivoId, actor.sub);
  }
}
