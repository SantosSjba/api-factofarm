import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { BillingModule } from '../billing/billing.module';
import { PrescriptionsModule } from '../prescriptions/prescriptions.module';
import { PharmaceuticalModule } from '../pharmaceutical/pharmaceutical.module';
import { InventoryMovementsModule } from '../inventory-movements/inventory-movements.module';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

@Module({
  imports: [CommonModule, InventoryMovementsModule, BillingModule, PrescriptionsModule, PharmaceuticalModule],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
