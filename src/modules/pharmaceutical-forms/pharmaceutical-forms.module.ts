import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { PharmaceuticalFormsController } from './pharmaceutical-forms.controller';
import { PharmaceuticalFormsService } from './pharmaceutical-forms.service';

@Module({
  imports: [CommonModule],
  controllers: [PharmaceuticalFormsController],
  providers: [PharmaceuticalFormsService],
})
export class PharmaceuticalFormsModule {}
