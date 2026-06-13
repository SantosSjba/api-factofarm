import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { DeliveryOrdersService } from './delivery-orders.service';
import { PublicCreateDeliveryOrderDto } from './dto/delivery-order.dto';

@ApiTags('public-delivery')
@Controller('public/delivery-stores')
export class PublicDeliveryController {
  constructor(private readonly service: DeliveryOrdersService) {}

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Info pública del portal de pedidos' })
  getStore(@Param('slug') slug: string) {
    return this.service.getPublicPortalInfo(slug);
  }

  @Public()
  @Post(':slug/orders')
  @ApiOperation({ summary: 'Crear pedido desde portal web público' })
  createOrder(@Param('slug') slug: string, @Body() dto: PublicCreateDeliveryOrderDto) {
    return this.service.createFromPublicPortal(slug, dto);
  }
}
