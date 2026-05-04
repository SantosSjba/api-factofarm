import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { CreateInboundMovementDto } from './dto/create-inbound-movement.dto';
import { CreateOutboundMovementDto } from './dto/create-outbound-movement.dto';
import { ImportInventoryFileDto } from './dto/import-inventory-file.dto';
import {
  InventoryImportTemplateQueryDto,
  inventoryImportTemplateModes,
} from './dto/inventory-import-template-query.dto';
import { InventoryMovementListQueryDto } from './dto/inventory-movement-list-query.dto';
import { LotCodeSearchQueryDto } from './dto/lot-code-search-query.dto';
import { InventoryMovementsService } from './inventory-movements.service';

@ApiTags('InventoryMovements')
@Controller('inventory-movements')
export class InventoryMovementsController {
  constructor(private readonly service: InventoryMovementsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar inventario por producto y almacén' })
  list(@Query() query: InventoryMovementListQueryDto) {
    return this.service.list(query);
  }

  @Get('catalogs/warehouses')
  @ApiOperation({ summary: 'Listar almacenes para importación de inventario' })
  listWarehouses() {
    return this.service.listWarehouses();
  }

  @Get('catalogs/transfer-reasons')
  @ApiOperation({ summary: 'Listar motivos de traslado para ingreso de inventario' })
  listTransferReasons() {
    return this.service.listTransferReasons();
  }

  @Get('catalogs/output-reasons')
  @ApiOperation({ summary: 'Listar motivos de salida de inventario' })
  listOutputReasons() {
    return this.service.listOutputReasons();
  }

  @Get('catalogs/lot-codes')
  @ApiOperation({ summary: 'Buscar códigos de lote por producto y almacén' })
  searchLotCodes(@Query() query: LotCodeSearchQueryDto) {
    return this.service.searchLotCodes(query);
  }

  @Post('inbound')
  @ApiOperation({ summary: 'Registrar ingreso de inventario (acción +)' })
  createInboundMovement(@Body() dto: CreateInboundMovementDto) {
    return this.service.createInboundMovement(dto);
  }

  @Post('outbound')
  @ApiOperation({ summary: 'Registrar salida de inventario (acción -)' })
  createOutboundMovement(@Body() dto: CreateOutboundMovementDto) {
    return this.service.createOutboundMovement(dto);
  }

  @Post('import/lots')
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
