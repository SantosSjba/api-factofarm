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
  constructor(
    private readonly service: PromotionsService,
    private readonly scope: EstablishmentScopeService,
  ) {}

  @Get()
  @RequirePermissions('promotions.read', 'nav.promociones')
  async findAll(@Query() query: PromotionListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.findAll(await this.scope.resolve(actor), query);
  }

  @Get('validate')
  @RequirePermissions('promotions.read', 'sales.write', 'nav.promociones')
  async validate(@Query('code') code: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.validateCode(await this.scope.resolve(actor), code ?? '');
  }

  @Get(':id')
  @RequirePermissions('promotions.read', 'nav.promociones')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.findOne(id, await this.scope.resolve(actor));
  }

  @Post()
  @RequirePermissions('promotions.write', 'nav.promociones')
  async create(@Body() dto: CreatePromotionDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.create(await this.scope.resolve(actor), dto, actor.sub);
  }

  @Patch(':id')
  @RequirePermissions('promotions.write', 'nav.promociones')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePromotionDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.update(id, await this.scope.resolve(actor), dto, actor.sub);
  }

  @Delete(':id')
  @RequirePermissions('promotions.write', 'nav.promociones')
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.remove(id, await this.scope.resolve(actor), actor.sub);
  }
}

@ApiTags('marketing')
@ApiBearerAuth()
@Controller('marketing')
export class MarketingController {
  constructor(
    private readonly loyalty: LoyaltyService,
    private readonly scope: EstablishmentScopeService,
  ) {}

  @Get('customers/:customerId/loyalty')
  @RequirePermissions('customers.read', 'nav.clientes_list')
  async loyaltyHistory(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.loyalty.listHistory(customerId, await this.scope.resolve(actor));
  }

  @Post('customers/:customerId/loyalty/adjust')
  @RequirePermissions('customers.write', 'nav.clientes_list')
  @ApiOperation({ summary: 'Ajustar puntos de fidelización' })
  async adjustLoyalty(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Body() dto: LoyaltyAdjustDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    const establishmentId = await this.scope.resolve(actor);
    return this.loyalty.adjustPoints(
      establishmentId,
      customerId,
      dto.puntos,
      dto.referencia,
      actor.sub,
    );
  }

  @Get('customers/:customerId/recommendations')
  @RequirePermissions('customers.read', 'nav.clientes_list')
  async recommendations(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.loyalty.purchaseRecommendations(customerId, await this.scope.resolve(actor));
  }
}
