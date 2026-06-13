import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { AccountsReceivableController } from './accounts-receivable.controller';
import { AccountsReceivableService } from './accounts-receivable.service';

@Module({
  imports: [CommonModule],
  controllers: [AccountsReceivableController],
  providers: [AccountsReceivableService],
  exports: [AccountsReceivableService],
})
export class AccountsReceivableModule {}
