import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { EstablishmentScopeService } from '../../common/scoping/establishment-scope.service';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import {
  AccountingExportQueryDto,
  BankMovementListQueryDto,
  BulkReconcileMovementsDto,
  CreateBankAccountDto,
  CreateBankMovementDto,
  FinancePeriodQueryDto,
  GeneralLedgerQueryDto,
  PurchaseBudgetReportQueryDto,
  RecentPaymentsQueryDto,
  UpsertPurchaseBudgetDto,
} from './dto/finance.dto';
import { FinanceService } from './finance.service';

@ApiTags('finance')
@ApiBearerAuth()
@Controller('finance')
export class FinanceController {
  constructor(
    private readonly service: FinanceService,
    private readonly scope: EstablishmentScopeService,
  ) {}

  @Get('cash-flow')
  @RequirePermissions('finance.read', 'nav.finanzas_movimientos', 'nav.contabilidad_reporte_resumido')
  async cashFlow(@Query() query: FinancePeriodQueryDto, @CurrentUser() actor: JwtRequestUser) {
    const establishmentId = await this.scope.resolve(actor);
    return this.service.getCashFlow(establishmentId, query);
  }

  @Get('margin-report')
  @RequirePermissions('finance.read', 'nav.balance', 'nav.contabilidad_resumen_venta')
  async margin(@Query() query: FinancePeriodQueryDto, @CurrentUser() actor: JwtRequestUser) {
    const establishmentId = await this.scope.resolve(actor);
    return this.service.getMarginReport(establishmentId, query);
  }

  @Get('accounting-export')
  @RequirePermissions(
    'finance.read',
    'nav.contabilidad_exportar_formatos',
    'nav.contabilidad_exportar_reporte',
  )
  async accountingExport(
    @Query() query: AccountingExportQueryDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    const establishmentId = await this.scope.resolve(actor);
    return this.service.exportAccounting(establishmentId, query);
  }

  @Get('bank-accounts')
  @RequirePermissions('finance.read', 'nav.balance')
  async bankAccounts(@CurrentUser() actor: JwtRequestUser) {
    const establishmentId = await this.scope.resolve(actor);
    return this.service.listBankAccounts(establishmentId);
  }

  @Post('bank-accounts')
  @RequirePermissions('finance.write', 'nav.balance')
  async createBankAccount(@Body() dto: CreateBankAccountDto, @CurrentUser() actor: JwtRequestUser) {
    const establishmentId = await this.scope.resolve(actor);
    return this.service.createBankAccount(establishmentId, dto, actor.sub);
  }

  @Get('bank-movements')
  @RequirePermissions('finance.read', 'nav.balance', 'nav.transacciones', 'nav.conciliacion_bancaria')
  async bankMovements(@Query() query: BankMovementListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    const establishmentId = await this.scope.resolve(actor);
    return this.service.listBankMovements(establishmentId, query);
  }

  @Post('bank-movements')
  @RequirePermissions('finance.write', 'nav.balance')
  async createBankMovement(@Body() dto: CreateBankMovementDto, @CurrentUser() actor: JwtRequestUser) {
    const establishmentId = await this.scope.resolve(actor);
    return this.service.createBankMovement(establishmentId, dto, actor.sub);
  }

  @Post('bank-movements/reconcile')
  @RequirePermissions('finance.write', 'nav.balance')
  async reconcile(@Body() dto: BulkReconcileMovementsDto, @CurrentUser() actor: JwtRequestUser) {
    const establishmentId = await this.scope.resolve(actor);
    return this.service.reconcileMovements(establishmentId, dto.movementIds, actor.sub);
  }

  @Post('purchase-budgets')
  @RequirePermissions('finance.write', 'nav.finanzas_ingresos')
  async upsertBudget(@Body() dto: UpsertPurchaseBudgetDto, @CurrentUser() actor: JwtRequestUser) {
    const establishmentId = await this.scope.resolve(actor);
    return this.service.upsertPurchaseBudget(establishmentId, dto, actor.sub);
  }

  @Get('purchase-budgets/vs-actual')
  @RequirePermissions('finance.read', 'nav.finanzas_ingresos')
  async budgetVsActual(
    @Query() query: PurchaseBudgetReportQueryDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    const establishmentId = await this.scope.resolve(actor);
    return this.service.getPurchaseBudgetVsActual(establishmentId, query);
  }

  @Get('payments-by-method')
  @RequirePermissions('finance.read', 'nav.ingresos_egresos_medio_pago')
  async paymentsByMethod(@Query() query: FinancePeriodQueryDto, @CurrentUser() actor: JwtRequestUser) {
    const establishmentId = await this.scope.resolve(actor);
    return this.service.getPaymentsByMethod(establishmentId, query);
  }

  @Get('recent-payments')
  @RequirePermissions('finance.read', 'nav.pagos')
  async recentPayments(@Query() query: RecentPaymentsQueryDto, @CurrentUser() actor: JwtRequestUser) {
    const establishmentId = await this.scope.resolve(actor);
    return this.service.getRecentPayments(establishmentId, query);
  }

  @Get('general-ledger')
  @RequirePermissions('finance.read', 'nav.libro_mayor')
  async generalLedger(@Query() query: GeneralLedgerQueryDto, @CurrentUser() actor: JwtRequestUser) {
    const establishmentId = await this.scope.resolve(actor);
    return this.service.getGeneralLedger(establishmentId, query);
  }
}
