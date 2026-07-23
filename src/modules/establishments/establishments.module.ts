import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { BillingModule } from '../billing/billing.module';
import { TenantsModule } from '../tenants/tenants.module';
import { EstablishmentsController } from './establishments.controller';
import { EstablishmentsService } from './application/establishments.service';

@Module({
  imports: [CommonModule, TenantsModule, BillingModule],
  controllers: [EstablishmentsController],
  providers: [EstablishmentsService],
  exports: [EstablishmentsService],
})
export class EstablishmentsModule {}
