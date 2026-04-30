import { Module } from '@nestjs/common';
import { CompoundProductsController } from './compound-products.controller';
import { CompoundProductsService } from './compound-products.service';

@Module({
  controllers: [CompoundProductsController],
  providers: [CompoundProductsService],
})
export class CompoundProductsModule {}
