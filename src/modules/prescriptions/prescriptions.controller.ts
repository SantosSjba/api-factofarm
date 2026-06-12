import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
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
  constructor(private readonly service: PrescriptionsService) {}

  @Get()
  @RequirePermissions('prescriptions.read', 'nav.recetas')
  @ApiOperation({ summary: 'Listar recetas médicas' })
  findAll(@Query() query: PrescriptionListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.findAll(actor.establecimientoId, query);
  }

  @Get('customer/:customerId')
  @RequirePermissions('prescriptions.read', 'nav.punto_venta', 'nav.recetas')
  @ApiOperation({ summary: 'Recetas activas de un paciente' })
  findByCustomer(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.findByCustomer(customerId, actor.establecimientoId);
  }

  @Get(':id')
  @RequirePermissions('prescriptions.read', 'nav.recetas')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.findOne(id, actor.establecimientoId);
  }

  @Post()
  @RequirePermissions('prescriptions.write', 'nav.recetas')
  create(@Body() dto: CreatePrescriptionDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.create(actor.establecimientoId, dto, actor.sub);
  }

  @Post(':id/dispense')
  @RequirePermissions('prescriptions.write', 'nav.recetas', 'nav.punto_venta')
  dispense(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DispensePrescriptionDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.manualDispense(id, actor.establecimientoId, dto, actor.sub);
  }

  @Patch(':id/image')
  @RequirePermissions('prescriptions.write', 'nav.recetas')
  @ApiOperation({ summary: 'Adjuntar imagen escaneada de receta' })
  attachImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AttachPrescriptionImageDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.attachImage(id, actor.establecimientoId, dto.imagenArchivoId, actor.sub);
  }
}
