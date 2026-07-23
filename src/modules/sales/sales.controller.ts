import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { OPENAPI_EXAMPLES } from '../../common/openapi/openapi-examples';
import { EstablishmentScopeService } from '../../common/scoping/establishment-scope.service';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { CreateSaleDto, CreateSaleDebitNoteDto, CreateSaleReturnDto, SyncSalesDto, VoidSaleDto } from './dto/create-sale.dto';
import { ConvertSaleToCpeDto } from './dto/convert-sale-to-cpe.dto';
import { SaleVoidRequestStatus } from '../../generated/prisma/client';
import { CheckSaleInteractionsDto } from './dto/check-sale-interactions.dto';
import { SaleListQueryDto } from './dto/sale-list-query.dto';
import { SalesService } from './sales.service';

@ApiTags('sales')
@ApiBearerAuth()
@Controller('sales')
export class SalesController {
  constructor(
    private readonly service: SalesService,
    private readonly scope: EstablishmentScopeService,
  ) {}

  @Get()
  @RequirePermissions('sales.read', 'nav.notas_venta', 'nav.punto_venta')
  @ApiOperation({
    summary: 'Historial de ventas',
    description:
      'storage=hot (default) | archived (cold storage) | all (hot table incluyendo archivedAt)',
  })
  async findAll(@Query() query: SaleListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    const establishmentId = await this.scope.resolve(actor);
    return this.service.findAll(establishmentId, query);
  }

  @Get('pos-catalog')
  @RequirePermissions('sales.read', 'nav.punto_venta')
  @ApiOperation({ summary: 'Catálogo rápido POS (búsqueda por nombre/código/barras)' })
  async posCatalog(
    @Query('warehouseId', ParseUUIDPipe) warehouseId: string,
    @Query('search') search: string | undefined,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    const establishmentId = await this.scope.resolve(actor);
    return this.service.posCatalog(establishmentId, warehouseId, search);
  }

  @Get('pos-substitutes')
  @RequirePermissions('sales.read', 'nav.punto_venta')
  @ApiOperation({ summary: 'Sugerencias de sustitutos genéricos/bioequivalentes con stock' })
  async posSubstitutes(
    @Query('productId', ParseUUIDPipe) productId: string,
    @Query('warehouseId', ParseUUIDPipe) warehouseId: string,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    const establishmentId = await this.scope.resolve(actor);
    return this.service.suggestGenericSubstitutes(establishmentId, productId, warehouseId);
  }

  @Post('check-interactions')
  @RequirePermissions('sales.read', 'nav.punto_venta')
  @ApiOperation({ summary: 'Alertas de interacciones entre principios activos del carrito' })
  checkInteractions(@Body() dto: CheckSaleInteractionsDto) {
    return this.service.checkInteractions(dto.productIds);
  }

  @Get('void-requests')
  @RequirePermissions('sales.void', 'sales.write', 'nav.anulaciones')
  @ApiOperation({ summary: 'Solicitudes de anulación de venta' })
  async listVoidRequests(
    @Query('status') status: SaleVoidRequestStatus | undefined,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    const establishmentId = await this.scope.resolve(actor);
    return this.service.listVoidRequests(establishmentId, status);
  }

  @Get(':id')
  @RequirePermissions('sales.read')
  @ApiOperation({ summary: 'Detalle de venta' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    const establishmentId = await this.scope.resolve(actor);
    return this.service.findOne(id, establishmentId);
  }

  @Get(':id/pdf')
  @RequirePermissions('sales.read', 'nav.notas_venta', 'nav.punto_venta')
  @ApiOperation({
    summary: 'PDF de la venta',
    description:
      'Devuelve el PDF del OSE/PSE si existe; si no (nota de venta u OSE sin PDF), genera el PDF en el backend.',
  })
  @ApiOkResponse({ description: 'application/pdf' })
  async downloadPdf(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: JwtRequestUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const establishmentId = await this.scope.resolve(actor);
    const pdf = await this.service.getPdf(id, establishmentId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename*=UTF-8''${encodeURIComponent(pdf.filename)}`,
    );
    res.setHeader('X-Factofarm-Pdf-Source', pdf.source);
    return new StreamableFile(pdf.buffer);
  }

  @Post()
  @RequirePermissions('sales.write', 'nav.punto_venta')
  @ApiOperation({ summary: 'Registrar venta (POS)' })
  @ApiHeader({ name: 'Idempotency-Key', required: false })
  @ApiBody({ type: CreateSaleDto, examples: { posBoleta: { value: OPENAPI_EXAMPLES.createSale } } })
  @ApiOkResponse({ description: 'Venta registrada' })
  create(
    @Body() dto: CreateSaleDto,
    @CurrentUser() actor: JwtRequestUser,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.service.create(dto, actor, idempotencyKey);
  }

  @Post('sync')
  @RequirePermissions('sales.write', 'nav.punto_venta')
  @ApiOperation({ summary: 'Sincronizar ventas registradas offline (idempotente por offlineLocalId)' })
  syncOffline(@Body() dto: SyncSalesDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.syncOfflineBatch(dto, actor);
  }

  @Post('void-requests/:requestId/approve')
  @RequirePermissions('sales.void', 'nav.anulaciones')
  approveVoidRequest(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.approveVoidRequest(requestId, actor);
  }

  @Post('void-requests/:requestId/reject')
  @RequirePermissions('sales.void', 'nav.anulaciones')
  rejectVoidRequest(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Body('rejectedReason') rejectedReason: string,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.rejectVoidRequest(requestId, rejectedReason ?? '', actor);
  }

  @Post(':id/convert-to-cpe')
  @RequirePermissions('sales.write', 'billing.write', 'nav.notas_venta', 'nav.comprobante_electronico')
  @ApiOperation({
    summary: 'Migrar nota de venta a boleta/factura e iniciar emisión SUNAT',
    description:
      'Requiere OSE configurado. Cambia serie/número al comprobante electrónico y encola la emisión.',
  })
  async convertToCpe(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConvertSaleToCpeDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    const establishmentId = await this.scope.resolve(actor);
    return this.service.convertToCpe(id, establishmentId, dto.documentType, actor.sub);
  }

  @Post(':id/void-request')
  @RequirePermissions('sales.write', 'nav.punto_venta', 'nav.anulaciones')
  @ApiOperation({ summary: 'Solicitar anulación (cajero) o anular directo (gerente/farmacéutico)' })
  requestVoid(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VoidSaleDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.requestVoidSale(id, dto, actor);
  }

  @Post(':id/void')
  @RequirePermissions('sales.void', 'nav.anulaciones')
  @ApiOperation({ summary: 'Anular venta con reversión de stock' })
  voidSale(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VoidSaleDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.voidSale(id, dto, actor);
  }

  @Post(':id/returns')
  @RequirePermissions('sales.write', 'nav.anulaciones')
  @ApiOperation({ summary: 'Devolución parcial o total' })
  createReturn(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateSaleReturnDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.createReturn(id, dto, actor);
  }

  @Post(':id/debit-notes')
  @RequirePermissions('sales.write', 'nav.notas_venta', 'billing.write')
  @ApiOperation({ summary: 'Emitir nota de débito (cargo adicional) sobre venta facturada' })
  createDebitNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateSaleDebitNoteDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.createDebitNote(id, dto, actor);
  }
}
