import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DataRetentionController } from './data-retention.controller';
import { DataRetentionScheduler } from './data-retention.scheduler';
import { DataRetentionService } from './data-retention.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [DataRetentionController],
  providers: [DataRetentionService, DataRetentionScheduler],
  exports: [DataRetentionService],
})
export class DataRetentionModule {}
