import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { CustomerTypesController } from './customer-types.controller';
import { CustomerTypesService } from './customer-types.service';

@Module({
  imports: [CommonModule],
  controllers: [CustomerTypesController],
  providers: [CustomerTypesService],
})
export class CustomerTypesModule {}
