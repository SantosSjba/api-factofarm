import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { WarehouseZonesController } from './warehouse-zones.controller';
import { WarehouseZonesService } from './warehouse-zones.service';

@Module({
  imports: [CommonModule],
  controllers: [WarehouseZonesController],
  providers: [WarehouseZonesService],
})
export class WarehouseZonesModule {}
