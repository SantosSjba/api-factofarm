import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { CreateQuotationDto, QuotationListQueryDto } from './dto/quotation.dto';
import { QuotationsService } from './quotations.service';

@ApiTags('quotations')
@ApiBearerAuth()
@Controller('quotations')
export class QuotationsController {
  constructor(private readonly service: QuotationsService) {}

  @Get()
  @RequirePermissions('sales.read', 'nav.cotizaciones')
  findAll(@Query() query: QuotationListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.findAll(actor.establecimientoId, query);
  }

  @Get(':id')
  @RequirePermissions('sales.read', 'nav.cotizaciones')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.findOne(id, actor.establecimientoId);
  }

  @Post()
  @RequirePermissions('sales.write', 'nav.cotizaciones')
  @ApiOperation({ summary: 'Crear cotización' })
  create(@Body() dto: CreateQuotationDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.create(actor.establecimientoId, actor.sub, dto);
  }

  @Post(':id/send')
  @RequirePermissions('sales.write', 'nav.cotizaciones')
  markSent(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.markSent(id, actor.establecimientoId);
  }
}
