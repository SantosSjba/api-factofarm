import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { BillingModule } from '../billing/billing.module';
import { PrescriptionsModule } from '../prescriptions/prescriptions.module';
import { PharmaceuticalModule } from '../pharmaceutical/pharmaceutical.module';
import { InventoryMovementsModule } from '../inventory-movements/inventory-movements.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { MarketingModule } from '../marketing/marketing.module';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

@Module({
  imports: [
    CommonModule,
    ComplianceModule,
    InventoryMovementsModule,
    BillingModule,
    PrescriptionsModule,
    PharmaceuticalModule,
    RealtimeModule,
    MarketingModule,
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
