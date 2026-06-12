import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { InventoryMovementsModule } from '../inventory-movements/inventory-movements.module';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

@Module({
  imports: [CommonModule, InventoryMovementsModule],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
