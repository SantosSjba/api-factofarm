import { Module } from '@nestjs/common';
import { TenantsModule } from '../tenants/tenants.module';
import { EstablishmentsController } from './establishments.controller';
import { EstablishmentsService } from './application/establishments.service';

@Module({
  imports: [TenantsModule],
  controllers: [EstablishmentsController],
  providers: [EstablishmentsService],
})
export class EstablishmentsModule {}
