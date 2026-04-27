import { Module } from '@nestjs/common';
import { CustomerTypesController } from './customer-types.controller';
import { CustomerTypesService } from './customer-types.service';

@Module({
  controllers: [CustomerTypesController],
  providers: [CustomerTypesService],
})
export class CustomerTypesModule {}
