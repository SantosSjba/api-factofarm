import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { CashRegistersController } from './cash-registers.controller';
import { CashRegistersService } from './cash-registers.service';

@Module({
  imports: [CommonModule],
  controllers: [CashRegistersController],
  providers: [CashRegistersService],
  exports: [CashRegistersService],
})
export class CashRegistersModule {}
