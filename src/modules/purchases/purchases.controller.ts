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
  constructor(private readonly service: PurchasesService) {}

  @Get('purchase-orders')
  @RequirePermissions('purchases.read', 'nav.ordenes_compra')
  @ApiOperation({ summary: 'Listar órdenes de compra' })
  listOrders(@Query() query: PurchaseOrderListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.listPurchaseOrders(actor.establecimientoId, query);
  }

  @Get('purchase-orders/:id')
  @RequirePermissions('purchases.read', 'nav.ordenes_compra')
  @ApiOperation({ summary: 'Detalle orden de compra' })
  getOrder(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.getPurchaseOrder(id, actor.establecimientoId);
  }

  @Post('purchase-orders')
  @RequirePermissions('purchases.write', 'nav.ordenes_compra')
  @ApiOperation({ summary: 'Crear orden de compra' })
  createOrder(@Body() dto: CreatePurchaseOrderDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.createPurchaseOrder(actor.establecimientoId, actor.sub, dto);
  }

  @Post('purchase-orders/:id/approve')
  @RequirePermissions('purchases.write', 'nav.ordenes_compra')
  @ApiOperation({ summary: 'Aprobar orden de compra' })
  approveOrder(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.approvePurchaseOrder(id, actor.establecimientoId, actor.sub);
  }

  @Post('purchase-orders/:id/send')
  @RequirePermissions('purchases.write', 'nav.ordenes_compra')
  @ApiOperation({ summary: 'Enviar orden al proveedor' })
  sendOrder(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.sendPurchaseOrder(id, actor.establecimientoId, actor.sub);
  }

  @Post('purchase-orders/:id/cancel')
  @RequirePermissions('purchases.write', 'nav.ordenes_compra')
  @ApiOperation({ summary: 'Anular orden de compra' })
  cancelOrder(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.cancelPurchaseOrder(id, actor.establecimientoId, actor.sub);
  }

  @Post('purchase-orders/:id/receipts')
  @RequirePermissions('purchases.receive', 'nav.recepcion_mercaderia')
  @ApiOperation({ summary: 'Registrar recepción de mercadería (parcial o total)' })
  receiveGoods(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateGoodsReceiptDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.createGoodsReceipt(id, actor.establecimientoId, actor.sub, dto);
  }

  @Get('accounts-payable')
  @RequirePermissions('purchases.read', 'nav.cuentas_pagar')
  @ApiOperation({ summary: 'Listar cuentas por pagar' })
  listPayables(@Query() query: AccountPayableListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.listAccountsPayable(actor.establecimientoId, query);
  }

  @Post('accounts-payable/:id/payments')
  @RequirePermissions('purchases.write', 'nav.cuentas_pagar')
  @ApiOperation({ summary: 'Registrar pago a proveedor' })
  registerPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegisterAccountPayablePaymentDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.registerPayment(id, actor.establecimientoId, dto, actor.sub);
  }

  @Get('supplier-credit-notes')
  @RequirePermissions('purchases.read', 'nav.ordenes_compra')
  @ApiOperation({ summary: 'Listar notas de crédito proveedor' })
  listCreditNotes(@CurrentUser() actor: JwtRequestUser) {
    return this.service.listSupplierCreditNotes(actor.establecimientoId);
  }

  @Post('supplier-credit-notes')
  @RequirePermissions('purchases.write', 'nav.ordenes_compra')
  @ApiOperation({ summary: 'Registrar nota de crédito proveedor' })
  createCreditNote(@Body() dto: CreateSupplierCreditNoteDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.createSupplierCreditNote(actor.establecimientoId, dto, actor.sub);
  }

  @Get('reports/replenishment')
  @RequirePermissions('purchases.read', 'nav.reporte_compras_sugerido')
  @ApiOperation({ summary: 'Sugerencias de reabastecimiento (stock mínimo + ABC)' })
  replenishment(
    @Query() query: ReplenishmentReportQueryDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.replenishmentSuggestions(actor.establecimientoId, query);
  }

  @Get('reports/price-comparison')
  @RequirePermissions('purchases.read', 'nav.comparativo_precios')
  @ApiOperation({ summary: 'Comparativo de precios entre proveedores' })
  priceComparison(
    @Query() query: PriceComparisonQueryDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.priceComparison(actor.establecimientoId, query);
  }
}
