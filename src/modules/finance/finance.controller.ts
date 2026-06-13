import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import {
  AccountingExportQueryDto,
  BankMovementListQueryDto,
  BulkReconcileMovementsDto,
  CreateBankAccountDto,
  CreateBankMovementDto,
  FinancePeriodQueryDto,
  PurchaseBudgetReportQueryDto,
  UpsertPurchaseBudgetDto,
} from './dto/finance.dto';
import { FinanceService } from './finance.service';

@ApiTags('finance')
@ApiBearerAuth()
@Controller('finance')
export class FinanceController {
  constructor(private readonly service: FinanceService) {}

  @Get('cash-flow')
  @RequirePermissions('finance.read', 'nav.finanzas_movimientos')
  cashFlow(@Query() query: FinancePeriodQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.getCashFlow(actor.establecimientoId, query);
  }

  @Get('margin-report')
  @RequirePermissions('finance.read', 'nav.balance')
  margin(@Query() query: FinancePeriodQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.getMarginReport(actor.establecimientoId, query);
  }

  @Get('accounting-export')
  @RequirePermissions('finance.read', 'nav.contabilidad_exportar_formatos')
  accountingExport(
    @Query() query: AccountingExportQueryDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.exportAccounting(actor.establecimientoId, query);
  }

  @Get('bank-accounts')
  @RequirePermissions('finance.read', 'nav.balance')
  bankAccounts(@CurrentUser() actor: JwtRequestUser) {
    return this.service.listBankAccounts(actor.establecimientoId);
  }

  @Post('bank-accounts')
  @RequirePermissions('finance.write', 'nav.balance')
  createBankAccount(@Body() dto: CreateBankAccountDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.createBankAccount(actor.establecimientoId, dto, actor.sub);
  }

  @Get('bank-movements')
  @RequirePermissions('finance.read', 'nav.balance')
  bankMovements(@Query() query: BankMovementListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.listBankMovements(actor.establecimientoId, query);
  }

  @Post('bank-movements')
  @RequirePermissions('finance.write', 'nav.balance')
  createBankMovement(@Body() dto: CreateBankMovementDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.createBankMovement(actor.establecimientoId, dto, actor.sub);
  }

  @Post('bank-movements/reconcile')
  @RequirePermissions('finance.write', 'nav.balance')
  reconcile(@Body() dto: BulkReconcileMovementsDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.reconcileMovements(actor.establecimientoId, dto.movementIds, actor.sub);
  }

  @Post('purchase-budgets')
  @RequirePermissions('finance.write', 'nav.finanzas_ingresos')
  upsertBudget(@Body() dto: UpsertPurchaseBudgetDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.upsertPurchaseBudget(actor.establecimientoId, dto, actor.sub);
  }

  @Get('purchase-budgets/vs-actual')
  @RequirePermissions('finance.read', 'nav.finanzas_ingresos')
  budgetVsActual(@Query() query: PurchaseBudgetReportQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.getPurchaseBudgetVsActual(actor.establecimientoId, query);
  }
}
