import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { ComplaintsService } from './complaints.service';
import { TenantsService } from './tenants.service';

@Module({
  controllers: [TenantsController],
  providers: [TenantsService, ComplaintsService],
  exports: [TenantsService, ComplaintsService],
})
export class TenantsModule {}
