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
import {
  CreatePromotionDto,
  LoyaltyAdjustDto,
  PromotionListQueryDto,
  UpdatePromotionDto,
} from './dto/marketing.dto';
import { LoyaltyService } from './loyalty.service';
import { PromotionsService } from './promotions.service';

@ApiTags('promotions')
@ApiBearerAuth()
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly service: PromotionsService) {}

  @Get()
  @RequirePermissions('promotions.read', 'nav.promociones')
  findAll(@Query() query: PromotionListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.findAll(actor.establecimientoId, query);
  }

  @Get('validate')
  @RequirePermissions('promotions.read', 'sales.write', 'nav.promociones')
  validate(@Query('code') code: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.validateCode(actor.establecimientoId, code ?? '');
  }

  @Get(':id')
  @RequirePermissions('promotions.read', 'nav.promociones')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.findOne(id, actor.establecimientoId);
  }

  @Post()
  @RequirePermissions('promotions.write', 'nav.promociones')
  create(@Body() dto: CreatePromotionDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.create(actor.establecimientoId, dto, actor.sub);
  }

  @Patch(':id')
  @RequirePermissions('promotions.write', 'nav.promociones')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePromotionDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.update(id, actor.establecimientoId, dto, actor.sub);
  }

  @Delete(':id')
  @RequirePermissions('promotions.write', 'nav.promociones')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.remove(id, actor.establecimientoId, actor.sub);
  }
}

@ApiTags('marketing')
@ApiBearerAuth()
@Controller('marketing')
export class MarketingController {
  constructor(private readonly loyalty: LoyaltyService) {}

  @Get('customers/:customerId/loyalty')
  @RequirePermissions('customers.read', 'nav.clientes_list')
  loyaltyHistory(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.loyalty.listHistory(customerId, actor.establecimientoId);
  }

  @Post('customers/:customerId/loyalty/adjust')
  @RequirePermissions('customers.write', 'nav.clientes_list')
  @ApiOperation({ summary: 'Ajustar puntos de fidelización' })
  adjustLoyalty(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Body() dto: LoyaltyAdjustDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.loyalty.adjustPoints(
      actor.establecimientoId,
      customerId,
      dto.puntos,
      dto.referencia,
      actor.sub,
    );
  }

  @Get('customers/:customerId/recommendations')
  @RequirePermissions('customers.read', 'nav.clientes_list')
  recommendations(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.loyalty.purchaseRecommendations(customerId, actor.establecimientoId);
  }
}
