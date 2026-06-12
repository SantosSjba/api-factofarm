import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { InventoryMovementsModule } from '../inventory-movements/inventory-movements.module';
import { InventoryPhysicalCountsController } from './inventory-physical-counts.controller';
import { InventoryPhysicalCountsService } from './inventory-physical-counts.service';

@Module({
  imports: [CommonModule, InventoryMovementsModule],
  controllers: [InventoryPhysicalCountsController],
  providers: [InventoryPhysicalCountsService],
})
export class InventoryPhysicalCountsModule {}
