import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { EstablishmentScopeService } from '../../common/scoping/establishment-scope.service';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { CreateQuotationDto, QuotationListQueryDto } from './dto/quotation.dto';
import { QuotationsService } from './quotations.service';

@ApiTags('quotations')
@ApiBearerAuth()
@Controller('quotations')
export class QuotationsController {
  constructor(
    private readonly service: QuotationsService,
    private readonly scope: EstablishmentScopeService,
  ) {}

  @Get()
  @RequirePermissions('sales.read', 'nav.cotizaciones')
  async findAll(@Query() query: QuotationListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.findAll(await this.scope.resolve(actor), query);
  }

  @Get(':id')
  @RequirePermissions('sales.read', 'nav.cotizaciones')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.findOne(id, await this.scope.resolve(actor));
  }

  @Post()
  @RequirePermissions('sales.write', 'nav.cotizaciones')
  @ApiOperation({ summary: 'Crear cotización' })
  async create(@Body() dto: CreateQuotationDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.create(await this.scope.resolve(actor), actor.sub, dto);
  }

  @Post(':id/send')
  @RequirePermissions('sales.write', 'nav.cotizaciones')
  async markSent(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.markSent(id, await this.scope.resolve(actor));
  }
}
