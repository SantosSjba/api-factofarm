import { Module } from '@nestjs/common';
import { ShippingGuidesController } from './shipping-guides.controller';
import { ShippingGuidesService } from './shipping-guides.service';

@Module({
  controllers: [ShippingGuidesController],
  providers: [ShippingGuidesService],
  exports: [ShippingGuidesService],
})
export class ShippingGuidesModule {}
