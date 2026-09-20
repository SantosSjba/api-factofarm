import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [CommonModule, RealtimeModule],
  controllers: [PurchasesController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
