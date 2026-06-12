import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { BillingModule } from '../billing/billing.module';
import { InventoryTransfersController } from './inventory-transfers.controller';
import { InventoryTransfersService } from './inventory-transfers.service';

@Module({
  imports: [CommonModule, BillingModule],
  controllers: [InventoryTransfersController],
  providers: [InventoryTransfersService],
})
export class InventoryTransfersModule {}
