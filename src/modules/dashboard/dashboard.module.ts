import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardOverviewService } from './dashboard-overview.service';
import { DashboardAlertsService } from './dashboard-alerts.service';

@Module({
  imports: [CommonModule],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardOverviewService, DashboardAlertsService],
})
export class DashboardModule {}
