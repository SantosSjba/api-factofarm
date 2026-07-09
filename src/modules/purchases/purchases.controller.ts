import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { EstablishmentScopeService } from '../../common/scoping/establishment-scope.service';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import {
  CreateGoodsReceiptDto,
  CreatePurchaseOrderDto,
  CreateSupplierCreditNoteDto,
  RegisterAccountPayablePaymentDto,
} from './dto/purchase.dto';
import {
  AccountPayableListQueryDto,
  PriceComparisonQueryDto,
  PurchaseOrderListQueryDto,
  ReplenishmentReportQueryDto,
} from './dto/purchase-query.dto';
import { PurchasesService } from './purchases.service';

@ApiTags('purchases')
@ApiBearerAuth()
@Controller('purchases')
export class PurchasesController {
  constructor(
    private readonly service: PurchasesService,
    private readonly scope: EstablishmentScopeService,
  ) {}

  @Get('purchase-orders')
  @RequirePermissions('purchases.read', 'nav.ordenes_compra')
  @ApiOperation({ summary: 'Listar órdenes de compra' })
  async listOrders(@Query() query: PurchaseOrderListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.listPurchaseOrders(await this.scope.resolve(actor), query);
  }

  @Get('purchase-orders/:id')
  @RequirePermissions('purchases.read', 'nav.ordenes_compra')
  @ApiOperation({ summary: 'Detalle orden de compra' })
  async getOrder(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.getPurchaseOrder(id, await this.scope.resolve(actor));
  }

  @Post('purchase-orders')
  @RequirePermissions('purchases.write', 'nav.ordenes_compra')
  @ApiOperation({ summary: 'Crear orden de compra' })
  async createOrder(@Body() dto: CreatePurchaseOrderDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.createPurchaseOrder(await this.scope.resolve(actor), actor.sub, dto);
  }

  @Post('purchase-orders/:id/approve')
  @RequirePermissions('purchases.write', 'nav.ordenes_compra')
  @ApiOperation({ summary: 'Aprobar orden de compra' })
  async approveOrder(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.approvePurchaseOrder(id, await this.scope.resolve(actor), actor.sub);
  }

  @Post('purchase-orders/:id/send')
  @RequirePermissions('purchases.write', 'nav.ordenes_compra')
  @ApiOperation({ summary: 'Enviar orden al proveedor' })
  async sendOrder(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.sendPurchaseOrder(id, await this.scope.resolve(actor), actor.sub);
  }

  @Post('purchase-orders/:id/cancel')
  @RequirePermissions('purchases.write', 'nav.ordenes_compra')
  @ApiOperation({ summary: 'Anular orden de compra' })
  async cancelOrder(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.cancelPurchaseOrder(id, await this.scope.resolve(actor), actor.sub);
  }

  @Post('purchase-orders/:id/receipts')
  @RequirePermissions('purchases.receive', 'nav.recepcion_mercaderia')
  @ApiOperation({ summary: 'Registrar recepción de mercadería (parcial o total)' })
  async receiveGoods(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateGoodsReceiptDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.createGoodsReceipt(id, await this.scope.resolve(actor), actor.sub, dto);
  }

  @Get('accounts-payable')
  @RequirePermissions('purchases.read', 'nav.cuentas_pagar')
  @ApiOperation({ summary: 'Listar cuentas por pagar' })
  async listPayables(@Query() query: AccountPayableListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.listAccountsPayable(await this.scope.resolve(actor), query);
  }

  @Post('accounts-payable/:id/payments')
  @RequirePermissions('purchases.write', 'nav.cuentas_pagar')
  @ApiOperation({ summary: 'Registrar pago a proveedor' })
  async registerPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegisterAccountPayablePaymentDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.registerPayment(id, await this.scope.resolve(actor), dto, actor.sub);
  }

  @Get('supplier-credit-notes')
  @RequirePermissions('purchases.read', 'nav.ordenes_compra')
  @ApiOperation({ summary: 'Listar notas de crédito proveedor' })
  async listCreditNotes(@CurrentUser() actor: JwtRequestUser) {
    return this.service.listSupplierCreditNotes(await this.scope.resolve(actor));
  }

  @Post('supplier-credit-notes')
  @RequirePermissions('purchases.write', 'nav.ordenes_compra')
  @ApiOperation({ summary: 'Registrar nota de crédito proveedor' })
  async createCreditNote(@Body() dto: CreateSupplierCreditNoteDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.createSupplierCreditNote(await this.scope.resolve(actor), dto, actor.sub);
  }

  @Get('reports/replenishment')
  @RequirePermissions('purchases.read', 'nav.reporte_compras_sugerido')
  @ApiOperation({ summary: 'Sugerencias de reabastecimiento (stock mínimo + ABC)' })
  async replenishment(
    @Query() query: ReplenishmentReportQueryDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.replenishmentSuggestions(await this.scope.resolve(actor), query);
  }

  @Get('reports/price-comparison')
  @RequirePermissions('purchases.read', 'nav.comparativo_precios')
  @ApiOperation({ summary: 'Comparativo de precios entre proveedores' })
  async priceComparison(
    @Query() query: PriceComparisonQueryDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.priceComparison(await this.scope.resolve(actor), query);
  }
}
