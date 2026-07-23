import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { BillingModule } from '../billing/billing.module';
import { FilesModule } from '../files/files.module';
import { PrescriptionsModule } from '../prescriptions/prescriptions.module';
import { PharmaceuticalModule } from '../pharmaceutical/pharmaceutical.module';
import { InventoryMovementsModule } from '../inventory-movements/inventory-movements.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { MarketingModule } from '../marketing/marketing.module';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { SalePdfService } from './services/sale-pdf.service';

@Module({
  imports: [
    CommonModule,
    ComplianceModule,
    InventoryMovementsModule,
    BillingModule,
    FilesModule,
    PrescriptionsModule,
    PharmaceuticalModule,
    RealtimeModule,
    MarketingModule,
  ],
  controllers: [SalesController],
  providers: [SalesService, SalePdfService],
  exports: [SalesService],
})
export class SalesModule {}
