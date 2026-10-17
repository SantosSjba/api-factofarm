import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { CashRegistersController } from './cash-registers.controller';
import { CashRegistersService } from './cash-registers.service';
import { CashReportPdfService } from './cash-report-pdf.service';
import { CashSessionsHistoryService } from './cash-sessions-history.service';

@Module({
  imports: [CommonModule],
  controllers: [CashRegistersController],
  providers: [
    CashRegistersService,
    CashSessionsHistoryService,
    CashReportPdfService,
  ],
  exports: [CashRegistersService],
})
export class CashRegistersModule {}
