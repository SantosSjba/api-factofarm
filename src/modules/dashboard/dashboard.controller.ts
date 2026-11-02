import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { DashboardService } from './dashboard.service';
import { DashboardOverviewService } from './dashboard-overview.service';
import { DashboardAlertsService } from './dashboard-alerts.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboard: DashboardService,
    private readonly overview: DashboardOverviewService,
    private readonly alertsService: DashboardAlertsService,
  ) {}

  /** Sin permiso específico: cada alerta se filtra por los permisos del usuario. */
  @Get('alerts')
  @ApiOperation({ summary: 'Notificaciones de la campana (alertas operativas según rol y permisos)' })
  getAlerts(@CurrentUser() actor: JwtRequestUser) {
    return this.alertsService.getAlerts(actor);
  }

  @Get('overview')
  @RequirePermissions('nav.dashboard_admin')
  @ApiOperation({
    summary: 'Resumen del cliente: ventas, medios de pago, comprobantes, horas, productos, caja, inventario y finanzas',
  })
  @ApiQuery({ name: 'days', required: false, enum: [1, 7, 30, 90] })
  getOverview(@Query('days') days: string | undefined, @CurrentUser() actor: JwtRequestUser) {
    return this.overview.getTenantOverview(actor, Number(days));
  }

  @Get('platform/overview')
  @RequirePermissions('tenants.read', 'nav.platform_dashboard')
  @ApiOperation({ summary: 'Actividad comercial de todos los clientes SaaS (últimos 30 días)' })
  getPlatformOverview(@CurrentUser() actor: JwtRequestUser) {
    return this.overview.getPlatformOverview(actor);
  }

  @Get('stats')
  @RequirePermissions('nav.dashboard_admin')
  @ApiOperation({ summary: 'KPIs del panel administrativo (por tenant)' })
  getStats(@CurrentUser() actor: JwtRequestUser) {
    return this.dashboard.getStats(actor);
  }

  @Get('chain-summary')
  @RequirePermissions('nav.dashboard_admin')
  @ApiOperation({
    summary: 'Vista consolidada multi-sucursal del tenant (últimos 30 días)',
  })
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

  @Get('warehouse')
  @RequirePermissions('nav.dashboard_admin', 'nav.inventario_movimientos')
  @ApiOperation({ summary: 'Dashboard almacenero' })
  getWarehouse(@CurrentUser() actor: JwtRequestUser) {
    return this.dashboard.getWarehouseDashboard(actor);
  }

  @Get('accountant')
  @RequirePermissions(
    'nav.dashboard_admin',
    'nav.cuentas_pagar',
    'nav.cuentas_cobrar',
  )
  @ApiOperation({ summary: 'Dashboard contador / finanzas' })
  getAccountant(@CurrentUser() actor: JwtRequestUser) {
    return this.dashboard.getAccountantDashboard(actor);
  }

  @Get('platform')
  @RequirePermissions('tenants.read', 'nav.platform_dashboard')
  @ApiOperation({ summary: 'Dashboard operador plataforma FactoFarm' })
  getPlatform(@CurrentUser() actor: JwtRequestUser) {
    return this.dashboard.getPlatformDashboard(actor);
  }
}
