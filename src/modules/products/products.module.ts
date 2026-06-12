import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { ProductsController } from './products.controller';
import { ProductPriceHistoryService } from './product-price-history.service';
import { ProductsService } from './products.service';

@Module({
  imports: [CommonModule],
  controllers: [ProductsController],
  providers: [ProductsService, ProductPriceHistoryService],
})
export class ProductsModule {}
