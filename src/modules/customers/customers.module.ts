import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

@Module({
  imports: [CommonModule, ComplianceModule],
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class CustomersModule {}
