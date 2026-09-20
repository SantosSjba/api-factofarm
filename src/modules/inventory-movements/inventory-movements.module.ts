import { Module } from '@nestjs/common';
import { InventoryLotAllocationService } from './inventory-lot-allocation.service';
import { InventoryMovementsController } from './inventory-movements.controller';
import { InventoryMovementsService } from './inventory-movements.service';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [RealtimeModule],
  controllers: [InventoryMovementsController],
  providers: [InventoryMovementsService, InventoryLotAllocationService],
  exports: [InventoryMovementsService, InventoryLotAllocationService],
})
export class InventoryMovementsModule {}
