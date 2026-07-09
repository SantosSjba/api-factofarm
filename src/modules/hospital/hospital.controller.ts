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
import { EstablishmentScopeService } from '../../common/scoping/establishment-scope.service';
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
  constructor(
    private readonly service: HospitalService,
    private readonly scope: EstablishmentScopeService,
  ) {}

  @Get('areas')
  @RequirePermissions('hospital.read', 'nav.hospital_dispensacion')
  async listAreas(@Query() query: HospitalAreaListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.listAreas(await this.scope.resolve(actor), query);
  }

  @Post('areas')
  @RequirePermissions('hospital.write', 'nav.hospital_dispensacion')
  async createArea(@Body() dto: CreateHospitalAreaDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.createArea(await this.scope.resolve(actor), dto, actor.sub);
  }

  @Get('consumptions')
  @RequirePermissions('hospital.read', 'nav.hospital_dispensacion')
  async listConsumptions(
    @Query() query: HospitalConsumptionListQueryDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.listConsumptions(await this.scope.resolve(actor), query);
  }

  @Post('consumptions')
  @RequirePermissions('hospital.write', 'nav.hospital_dispensacion')
  async createConsumption(
    @Body() dto: CreateHospitalConsumptionDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.createConsumption(await this.scope.resolve(actor), dto, actor.sub);
  }

  @Patch('consumptions/:id/dispense')
  @RequirePermissions('hospital.write', 'nav.hospital_dispensacion')
  async dispense(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.dispenseConsumption(id, await this.scope.resolve(actor), actor.sub);
  }

  @Patch('consumptions/:id/cancel')
  @RequirePermissions('hospital.write', 'nav.hospital_dispensacion')
  async cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.cancelConsumption(id, await this.scope.resolve(actor), actor.sub);
  }
}
