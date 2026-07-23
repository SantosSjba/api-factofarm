import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { CreateInboundMovementDto } from './dto/create-inbound-movement.dto';
import { CreateOutboundMovementDto } from './dto/create-outbound-movement.dto';
import { ImportInventoryFileDto } from './dto/import-inventory-file.dto';
import {
  InventoryImportTemplateQueryDto,
  inventoryImportTemplateModes,
} from './dto/inventory-import-template-query.dto';
import { InventoryLotListQueryDto } from './dto/inventory-lot-list-query.dto';
import { InventoryMovementListQueryDto } from './dto/inventory-movement-list-query.dto';
import { KardexQueryDto } from './dto/kardex-query.dto';
import { LotCodeSearchQueryDto } from './dto/lot-code-search-query.dto';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { InventoryValuationReportQueryDto } from './dto/inventory-valuation-report-query.dto';
import { DispatchSaleStockDto } from './dto/dispatch-sale-stock.dto';
import { SaleLotAllocationPreviewDto } from './dto/sale-lot-allocation-preview.dto';
import { InventoryMovementsService } from './inventory-movements.service';

@ApiTags('InventoryMovements')
@ApiBearerAuth()
@Controller('inventory-movements')
export class InventoryMovementsController {
  constructor(private readonly service: InventoryMovementsService) {}

  @Get()
  @RequirePermissions('inventory.read', 'nav.inventario_movimientos')
  @ApiOperation({ summary: 'Listar inventario por producto y almacén' })
  list(@Query() query: InventoryMovementListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.list(query, actor);
  }

  @Get('lots')
  @RequirePermissions('inventory.read', 'nav.lotes')
  @ApiOperation({ summary: 'Listar lotes con stock' })
  listLots(@Query() query: InventoryLotListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.listLots(query, actor);
  }

  @Get('kardex')
  @RequirePermissions('inventory.read', 'nav.reporte_kardex', 'nav.kardex_valorizado')
  @ApiOperation({
    summary: 'Kardex valorizado por producto',
    description:
      'storage=hot (default) | archived (cold storage) | all (incluye archivados en tabla hot)',
  })
  kardex(@Query() query: KardexQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.kardex(query, actor);
  }

  @Get('alerts')
  @RequirePermissions('inventory.read')
  @ApiOperation({ summary: 'Alertas de inventario (stock bajo, vencimientos, cadena de frío)' })
  alerts(@CurrentUser() actor: JwtRequestUser) {
    return this.service.alerts(actor);
  }

  @Get('valuation-report')
  @RequirePermissions('inventory.read', 'nav.reporte_inventario', 'nav.kardex_valorizado')
  @ApiOperation({ summary: 'Reporte de inventario valorizado (PEPS / promedio)' })
  valuationReport(@Query() query: InventoryValuationReportQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.valuationReport(query, actor);
  }

  @Get('adjustments/pending')
  @RequirePermissions('inventory.adjust')
  @ApiOperation({ summary: 'Listar ajustes pendientes de aprobación' })
  listPendingAdjustments(@CurrentUser() actor: JwtRequestUser) {
    return this.service.listPendingAdjustments(actor);
  }

  @Post('adjustments')
  @RequirePermissions('inventory.adjust', 'nav.inventario_movimientos')
  @ApiOperation({ summary: 'Ajuste de stock (con aprobación si supera umbral)' })
  createAdjustment(@Body() dto: CreateAdjustmentDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.createAdjustment(dto, actor.sub);
  }

  @Post('adjustments/:id/approve')
  @RequirePermissions('inventory.adjust')
  @ApiOperation({ summary: 'Aprobar ajuste pendiente (segunda autorización)' })
  approveAdjustment(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.approveAdjustment(id, actor.sub);
  }

  @Post('adjustments/:id/reject')
  @RequirePermissions('inventory.adjust')
  @ApiOperation({ summary: 'Rechazar ajuste pendiente' })
  rejectAdjustment(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.rejectAdjustment(id, actor.sub);
  }

  @Get('sales/available-lots')
  @RequirePermissions('inventory.read', 'nav.inventario_movimientos', 'nav.lotes')
  @ApiOperation({ summary: 'Lotes elegibles para venta (respeta bloqueo de vencidos)' })
  listSaleAvailableLots(
    @Query('productId', ParseUUIDPipe) productId: string,
    @Query('warehouseId', ParseUUIDPipe) warehouseId: string,
  ) {
    return this.service.listSaleAvailableLots(productId, warehouseId);
  }

  @Post('sales/allocation-preview')
  @RequirePermissions('inventory.read', 'nav.inventario_movimientos', 'nav.lotes')
  @ApiOperation({ summary: 'Previsualizar asignación FEFO/FIFO o manual de lotes para venta' })
  previewSaleLotAllocation(@Body() dto: SaleLotAllocationPreviewDto) {
    return this.service.previewSaleLotAllocation(dto);
  }

  @Post('sales/dispatch')
  @RequirePermissions('inventory.write', 'nav.inventario_movimientos')
  @ApiOperation({ summary: 'Despachar stock de venta con trazabilidad por lote' })
  dispatchSaleStock(@Body() dto: DispatchSaleStockDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.dispatchSaleStock(dto, actor.sub);
  }

  @Get('catalogs/warehouses')
  @RequirePermissions('inventory.read')
  @ApiOperation({ summary: 'Listar almacenes para importación de inventario' })
  listWarehouses() {
    return this.service.listWarehouses();
  }

  @Get('catalogs/transfer-reasons')
  @RequirePermissions('inventory.read')
  @ApiOperation({ summary: 'Listar motivos de traslado para ingreso de inventario' })
  listTransferReasons() {
    return this.service.listTransferReasons();
  }

  @Get('catalogs/output-reasons')
  @RequirePermissions('inventory.read')
  @ApiOperation({ summary: 'Listar motivos de salida de inventario' })
  listOutputReasons() {
    return this.service.listOutputReasons();
  }

  @Get('catalogs/lot-codes')
  @RequirePermissions('inventory.read')
  @ApiOperation({ summary: 'Buscar códigos de lote por producto y almacén' })
  searchLotCodes(@Query() query: LotCodeSearchQueryDto) {
    return this.service.searchLotCodes(query);
  }

  @Post('inbound')
  @RequirePermissions('inventory.write', 'nav.inventario_movimientos')
  @ApiOperation({ summary: 'Registrar ingreso de inventario (acción +)' })
  createInboundMovement(
    @Body() dto: CreateInboundMovementDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.createInboundMovement(dto, actor.sub);
  }

  @Post('outbound')
  @RequirePermissions('inventory.write', 'nav.inventario_movimientos')
  @ApiOperation({ summary: 'Registrar salida de inventario (acción -)' })
  createOutboundMovement(
    @Body() dto: CreateOutboundMovementDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.createOutboundMovement(dto, actor.sub);
  }

  @Post('import/lots')
  @RequirePermissions('inventory.write')
  @ApiOperation({ summary: 'Importar productos con lotes por almacén' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        warehouseId: { type: 'string', format: 'uuid' },
        file: { type: 'string', format: 'binary' },
      },
      required: ['warehouseId', 'file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  importLots(@Body() dto: ImportInventoryFileDto, @UploadedFile() file: Express.Multer.File) {
    return this.service.importLots(dto, file);
  }

  @Post('import/series')
  @RequirePermissions('inventory.write')
  @ApiOperation({ summary: 'Importar productos con series por almacén' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        warehouseId: { type: 'string', format: 'uuid' },
        file: { type: 'string', format: 'binary' },
      },
      required: ['warehouseId', 'file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  importSeries(@Body() dto: ImportInventoryFileDto, @UploadedFile() file: Express.Multer.File) {
    return this.service.importSeries(dto, file);
  }

  @Get('import/template')
  @RequirePermissions('inventory.read')
  @ApiOperation({ summary: 'Descargar plantilla de importación de inventario (lotes/series)' })
  async downloadImportTemplate(
    @Query() query: InventoryImportTemplateQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const mode = query.mode && inventoryImportTemplateModes.includes(query.mode) ? query.mode : 'LOTES';
    const buffer = this.service.buildImportTemplateBuffer(mode);
    const filename = mode === 'SERIES' ? 'movement_item_lots.xlsx' : 'movement_item_lots_group.xlsx';
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return new StreamableFile(buffer);
  }
}
