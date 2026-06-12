import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { AdministrationRoutesController } from './administration-routes.controller';
import { AdministrationRoutesService } from './administration-routes.service';

@Module({
  imports: [CommonModule],
  controllers: [AdministrationRoutesController],
  providers: [AdministrationRoutesService],
})
export class AdministrationRoutesModule {}
