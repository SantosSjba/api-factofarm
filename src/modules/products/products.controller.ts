import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { CreateProductLocationDto } from './dto/create-product-location.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { ImportProductsDto } from './dto/import-products.dto';
import { ProductListQueryDto } from './dto/product-list-query.dto';
import { UpdateProductBarcodeDto } from './dto/update-product-barcode.dto';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('catalogs/units')
  @ApiOperation({ summary: 'Catálogo de unidades de medida' })
  catalogUnits() {
    return this.productsService.listUnits();
  }

  @Get('catalogs/currencies')
  @ApiOperation({ summary: 'Catálogo de monedas' })
  catalogCurrencies() {
    return this.productsService.listCurrencies();
  }

  @Get('catalogs/tax-affectation-types')
  @ApiOperation({ summary: 'Catálogo de tipos de afectación al IGV' })
  catalogTaxTypes() {
    return this.productsService.listTaxAffectationTypes();
  }

  @Get('catalogs/warehouses')
  @ApiOperation({ summary: 'Almacenes por establecimiento' })
  catalogWarehouses() {
    return this.productsService.listWarehouses();
  }

  @Get('catalogs/product-locations')
  @ApiOperation({ summary: 'Ubicaciones de producto por establecimiento' })
  catalogLocations(@Query('establishmentId') establishmentId?: string) {
    return this.productsService.listProductLocations(establishmentId);
  }

  @Post('catalogs/product-locations')
  @ApiOperation({ summary: 'Crear ubicación de producto por establecimiento' })
  @ApiBody({ type: CreateProductLocationDto })
  createLocation(@Body() dto: CreateProductLocationDto) {
    return this.productsService.createProductLocation(dto);
  }

  @Get('catalogs/attribute-types')
  @ApiOperation({ summary: 'Tipos de atributo para el listado dinámico' })
  catalogAttributeTypes() {
    return this.productsService.listAttributeTypes();
  }

  @Get('catalogs/isc-systems')
  @ApiOperation({ summary: 'Catálogo de tipos de sistema ISC' })
  catalogIscSystems() {
    return this.productsService.listIscSystems();
  }

  @Get(':id/history/stock')
  @ApiOperation({ summary: 'Historial de stock por ubicación del producto' })
  historyStock(@Param('id') id: string) {
    return this.productsService.historyStock(id);
  }

  @Get(':id/stock')
  @ApiOperation({ summary: 'Stock de producto y lista de precios creados' })
  stock(@Param('id') id: string) {
    return this.productsService.stockSummary(id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar productos con paginación' })
  list(@Query() query: ProductListQueryDto) {
    return this.productsService.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Crear producto' })
  @ApiBody({ type: CreateProductDto })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar producto' })
  @ApiBody({ type: CreateProductDto })
  update(@Param('id') id: string, @Body() dto: CreateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar (lógico) producto' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicar producto' })
  duplicate(@Param('id') id: string) {
    return this.productsService.duplicate(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Actualizar estado habilitado del producto' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateProductStatusDto) {
    return this.productsService.updateStatus(id, dto);
  }

  @Patch(':id/barcode')
  @ApiOperation({ summary: 'Actualizar código de barras del producto' })
  updateBarcode(@Param('id') id: string, @Body() dto: UpdateProductBarcodeDto) {
    return this.productsService.updateBarcode(id, dto);
  }

  @Post('import')
  @ApiOperation({ summary: 'Importar productos (productos, lista de precios, actualizar precios)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        mode: { type: 'string', enum: ['PRODUCTOS', 'L_PRECIOS', 'ACTUALIZAR_PRECIOS'] },
        file: { type: 'string', format: 'binary' },
      },
      required: ['mode', 'file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  importProducts(@Body() dto: ImportProductsDto, @UploadedFile() file: Express.Multer.File) {
    return this.productsService.importFromExcel(dto.mode, file);
  }

  @Get('import/template')
  @ApiOperation({ summary: 'Descargar plantilla de importación por modo' })
  async downloadImportTemplate(
    @Query('mode') mode: ImportProductsDto['mode'],
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const selectedMode = mode ?? 'PRODUCTOS';
    const buffer = this.productsService.buildImportTemplateBuffer(selectedMode);
    const filename =
      selectedMode === 'L_PRECIOS'
        ? 'item_price_lists.xlsx'
        : selectedMode === 'ACTUALIZAR_PRECIOS'
          ? 'items_update_prices.xlsx'
          : 'items.xlsx';
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return new StreamableFile(buffer);
  }
}
