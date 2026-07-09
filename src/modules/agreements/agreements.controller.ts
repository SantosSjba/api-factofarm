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
import { EstablishmentScopeService } from '../../common/scoping/establishment-scope.service';
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
  constructor(
    private readonly service: AgreementsService,
    private readonly scope: EstablishmentScopeService,
  ) {}

  @Get()
  @RequirePermissions('agreements.read', 'nav.convenios')
  async findAll(@Query() query: AgreementListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.findAll(await this.scope.resolve(actor), query);
  }

  @Get(':id')
  @RequirePermissions('agreements.read', 'nav.convenios')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.findOne(id, await this.scope.resolve(actor));
  }

  @Post()
  @RequirePermissions('agreements.write', 'nav.convenios')
  async create(@Body() dto: CreateAgreementDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.create(await this.scope.resolve(actor), dto, actor.sub);
  }

  @Patch(':id')
  @RequirePermissions('agreements.write', 'nav.convenios')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAgreementDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.update(id, await this.scope.resolve(actor), dto, actor.sub);
  }

  @Delete(':id')
  @RequirePermissions('agreements.write', 'nav.convenios')
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.remove(id, await this.scope.resolve(actor), actor.sub);
  }

  @Post(':id/product-prices')
  @RequirePermissions('agreements.write', 'nav.convenios')
  async upsertPrices(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertAgreementPricesDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.upsertPrices(id, await this.scope.resolve(actor), dto, actor.sub);
  }

  @Get(':id/settlement')
  @ApiOperation({ summary: 'Liquidación de ventas del convenio en un rango' })
  @RequirePermissions('agreements.read', 'nav.convenios')
  async settlement(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: AgreementSettlementQueryDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.getSettlement(id, await this.scope.resolve(actor), query);
  }

  @Post(':id/monthly-billing')
  @ApiOperation({ summary: 'Generar facturación mensual del convenio' })
  @RequirePermissions('agreements.write', 'nav.convenios')
  async monthlyBilling(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GenerateMonthlyBillingDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.generateMonthlyBilling(id, await this.scope.resolve(actor), dto, actor.sub);
  }

  @Get(':id/export-institutional')
  @ApiOperation({ summary: 'Export CSV SIS/EsSalud/EPS' })
  @RequirePermissions('agreements.read', 'nav.convenios')
  async exportInstitutional(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: AgreementSettlementQueryDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.exportInstitutionalCsv(id, await this.scope.resolve(actor), query);
  }
}
