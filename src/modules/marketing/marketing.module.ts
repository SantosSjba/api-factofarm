import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { MarketingController, PromotionsController } from './marketing.controller';
import { LoyaltyService } from './loyalty.service';
import { PromotionsService } from './promotions.service';

@Module({
  imports: [CommonModule],
  controllers: [PromotionsController, MarketingController],
  providers: [PromotionsService, LoyaltyService],
  exports: [PromotionsService, LoyaltyService],
})
export class MarketingModule {}
