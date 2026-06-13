import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsService } from './prescriptions.service';

@Module({
  imports: [CommonModule, ComplianceModule],
  controllers: [PrescriptionsController],
  providers: [PrescriptionsService],
  exports: [PrescriptionsService],
})
export class PrescriptionsModule {}
