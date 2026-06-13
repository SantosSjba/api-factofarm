import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { AgreementsController } from './agreements.controller';
import { AgreementsService } from './agreements.service';

@Module({
  imports: [CommonModule],
  controllers: [AgreementsController],
  providers: [AgreementsService],
  exports: [AgreementsService],
})
export class AgreementsModule {}
