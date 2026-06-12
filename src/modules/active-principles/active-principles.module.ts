import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { ActivePrinciplesController } from './active-principles.controller';
import { ActivePrinciplesService } from './active-principles.service';

@Module({
  imports: [CommonModule],
  controllers: [ActivePrinciplesController],
  providers: [ActivePrinciplesService],
})
export class ActivePrinciplesModule {}
