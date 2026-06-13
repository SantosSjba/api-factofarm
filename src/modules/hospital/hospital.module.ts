import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { InventoryMovementsModule } from '../inventory-movements/inventory-movements.module';
import { HospitalController } from './hospital.controller';
import { HospitalService } from './hospital.service';

@Module({
  imports: [CommonModule, InventoryMovementsModule],
  controllers: [HospitalController],
  providers: [HospitalService],
  exports: [HospitalService],
})
export class HospitalModule {}
