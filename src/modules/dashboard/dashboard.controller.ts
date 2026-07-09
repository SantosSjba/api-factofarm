import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('stats')
  @RequirePermissions('nav.dashboard_admin')
  @ApiOperation({ summary: 'KPIs del panel administrativo (por tenant)' })
  getStats(@CurrentUser() actor: JwtRequestUser) {
    return this.dashboard.getStats(actor);
  }

  @Get('chain-summary')
  @RequirePermissions('nav.dashboard_admin')
  @ApiOperation({ summary: 'Vista consolidada multi-sucursal del tenant (últimos 30 días)' })
  getChainSummary(@CurrentUser() actor: JwtRequestUser) {
    return this.dashboard.getChainSummary(actor);
  }

  @Get('sales-trend')
  @RequirePermissions('nav.dashboard_admin')
  @ApiOperation({ summary: 'Tendencia de ventas diarias (últimos 14 días)' })
  getSalesTrend(@CurrentUser() actor: JwtRequestUser) {
    return this.dashboard.getSalesTrend(actor);
  }

  @Get('manager')
  @RequirePermissions('nav.dashboard_admin')
  @ApiOperation({ summary: 'Dashboard gerente de sucursal' })
  getManager(@CurrentUser() actor: JwtRequestUser) {
    return this.dashboard.getManagerDashboard(actor);
  }

  @Get('pharmacist')
  @RequirePermissions('nav.dashboard_admin', 'nav.recetas')
  @ApiOperation({ summary: 'Dashboard farmacéutico titular' })
  getPharmacist(@CurrentUser() actor: JwtRequestUser) {
    return this.dashboard.getPharmacistDashboard(actor);
  }

  @Get('cashier')
  @RequirePermissions('nav.dashboard_admin', 'nav.punto_venta')
  @ApiOperation({ summary: 'Dashboard cajero / POS' })
  getCashier(@CurrentUser() actor: JwtRequestUser) {
    return this.dashboard.getCashierDashboard(actor);
  }
}
