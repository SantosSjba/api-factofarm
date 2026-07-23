import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TenantsController } from './tenants.controller';
import { ComplaintsService } from './complaints.service';
import { TenantsService } from './tenants.service';

@Module({
  imports: [AuthModule],
  controllers: [TenantsController],
  providers: [TenantsService, ComplaintsService],
  exports: [TenantsService, ComplaintsService],
})
export class TenantsModule {}
