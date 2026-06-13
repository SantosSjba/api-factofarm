import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import {
  CreateHospitalAreaDto,
  CreateHospitalConsumptionDto,
  HospitalAreaListQueryDto,
  HospitalConsumptionListQueryDto,
} from './dto/hospital.dto';
import { HospitalService } from './hospital.service';

@ApiTags('hospital')
@ApiBearerAuth()
@Controller('hospital')
export class HospitalController {
  constructor(private readonly service: HospitalService) {}

  @Get('areas')
  @RequirePermissions('hospital.read', 'nav.hospital_dispensacion')
  listAreas(@Query() query: HospitalAreaListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.listAreas(actor.establecimientoId, query);
  }

  @Post('areas')
  @RequirePermissions('hospital.write', 'nav.hospital_dispensacion')
  createArea(@Body() dto: CreateHospitalAreaDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.createArea(actor.establecimientoId, dto, actor.sub);
  }

  @Get('consumptions')
  @RequirePermissions('hospital.read', 'nav.hospital_dispensacion')
  listConsumptions(
    @Query() query: HospitalConsumptionListQueryDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.listConsumptions(actor.establecimientoId, query);
  }

  @Post('consumptions')
  @RequirePermissions('hospital.write', 'nav.hospital_dispensacion')
  createConsumption(
    @Body() dto: CreateHospitalConsumptionDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.createConsumption(actor.establecimientoId, dto, actor.sub);
  }

  @Patch('consumptions/:id/dispense')
  @RequirePermissions('hospital.write', 'nav.hospital_dispensacion')
  dispense(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.dispenseConsumption(id, actor.establecimientoId, actor.sub);
  }

  @Patch('consumptions/:id/cancel')
  @RequirePermissions('hospital.write', 'nav.hospital_dispensacion')
  cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.cancelConsumption(id, actor.establecimientoId, actor.sub);
  }
}
