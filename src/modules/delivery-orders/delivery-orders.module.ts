import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { SalesModule } from '../sales/sales.module';
import { DeliveryOrdersController } from './delivery-orders.controller';
import { PublicDeliveryController } from './public-delivery.controller';
import { DeliveryOrdersService } from './delivery-orders.service';
import { DeliveryNotificationService } from './delivery-notification.service';

@Module({
  imports: [CommonModule, SalesModule],
  controllers: [DeliveryOrdersController, PublicDeliveryController],
  providers: [DeliveryOrdersService, DeliveryNotificationService],
  exports: [DeliveryOrdersService],
})
export class DeliveryOrdersModule {}
