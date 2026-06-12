import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { LaboratoriesController } from './laboratories.controller';
import { LaboratoriesService } from './laboratories.service';

@Module({
  imports: [CommonModule],
  controllers: [LaboratoriesController],
  providers: [LaboratoriesService],
})
export class LaboratoriesModule {}
