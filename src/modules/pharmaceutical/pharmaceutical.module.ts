import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { PharmaceuticalController } from './pharmaceutical.controller';
import { PharmaceuticalService } from './pharmaceutical.service';

@Module({
  imports: [CommonModule],
  controllers: [PharmaceuticalController],
  providers: [PharmaceuticalService],
  exports: [PharmaceuticalService],
})
export class PharmaceuticalModule {}
