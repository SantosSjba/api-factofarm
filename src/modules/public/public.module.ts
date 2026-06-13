import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { TenantsModule } from '../tenants/tenants.module';
import { PublicContactController } from './public-contact.controller';
import { PublicComplaintsService } from './public-complaints.service';
import { PublicContactService } from './public-contact.service';

@Module({
  imports: [CommonModule, TenantsModule],
  controllers: [PublicContactController],
  providers: [PublicContactService, PublicComplaintsService],
})
export class PublicModule {}
