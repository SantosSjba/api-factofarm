import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { AgreementsService } from './agreements.service';
import {
  AgreementListQueryDto,
  AgreementSettlementQueryDto,
  CreateAgreementDto,
  GenerateMonthlyBillingDto,
  UpdateAgreementDto,
  UpsertAgreementPricesDto,
} from './dto/agreements.dto';

@ApiTags('agreements')
@ApiBearerAuth()
@Controller('agreements')
export class AgreementsController {
  constructor(private readonly service: AgreementsService) {}

  @Get()
  @RequirePermissions('agreements.read', 'nav.convenios')
  findAll(@Query() query: AgreementListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.findAll(actor.establecimientoId, query);
  }

  @Get(':id')
  @RequirePermissions('agreements.read', 'nav.convenios')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.findOne(id, actor.establecimientoId);
  }

  @Post()
  @RequirePermissions('agreements.write', 'nav.convenios')
  create(@Body() dto: CreateAgreementDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.create(actor.establecimientoId, dto, actor.sub);
  }

  @Patch(':id')
  @RequirePermissions('agreements.write', 'nav.convenios')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAgreementDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.update(id, actor.establecimientoId, dto, actor.sub);
  }

  @Delete(':id')
  @RequirePermissions('agreements.write', 'nav.convenios')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.remove(id, actor.establecimientoId, actor.sub);
  }

  @Post(':id/product-prices')
  @RequirePermissions('agreements.write', 'nav.convenios')
  upsertPrices(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertAgreementPricesDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.upsertPrices(id, actor.establecimientoId, dto, actor.sub);
  }

  @Get(':id/settlement')
  @ApiOperation({ summary: 'Liquidación de ventas del convenio en un rango' })
  @RequirePermissions('agreements.read', 'nav.convenios')
  settlement(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: AgreementSettlementQueryDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.getSettlement(id, actor.establecimientoId, query);
  }

  @Post(':id/monthly-billing')
  @ApiOperation({ summary: 'Generar facturación mensual del convenio' })
  @RequirePermissions('agreements.write', 'nav.convenios')
  monthlyBilling(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GenerateMonthlyBillingDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.generateMonthlyBilling(id, actor.establecimientoId, dto, actor.sub);
  }

  @Get(':id/export-institutional')
  @ApiOperation({ summary: 'Export CSV SIS/EsSalud/EPS' })
  @RequirePermissions('agreements.read', 'nav.convenios')
  exportInstitutional(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: AgreementSettlementQueryDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.exportInstitutionalCsv(id, actor.establecimientoId, query);
  }
}
