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
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { CreateProductLocationDto } from './dto/create-product-location.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { ImportProductsDto } from './dto/import-products.dto';
import { ProductListQueryDto } from './dto/product-list-query.dto';
import { ProductPriceHistoryQueryDto } from './dto/product-price-history-query.dto';
import { UpdateProductBarcodeDto } from './dto/update-product-barcode.dto';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';
import { SetProductEquivalentsDto } from './dto/set-product-equivalents.dto';
import { UpsertProductSupplierDto } from './dto/upsert-product-supplier.dto';
import { EstablishmentScopeService } from '../../common/scoping/establishment-scope.service';
import { ProductsService } from './products.service';

@ApiTags('products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly scope: EstablishmentScopeService,
  ) {}

  @Get('catalogs/units')
  @RequirePermissions('products.read')
  @ApiOperation({ summary: 'Cat?logo de unidades de medida' })
  catalogUnits() {
    return this.productsService.listUnits();
  }

  @Get('catalogs/currencies')
  @RequirePermissions('products.read')
  @ApiOperation({ summary: 'Cat?logo de monedas' })
  catalogCurrencies() {
    return this.productsService.listCurrencies();
  }

  @Get('catalogs/tax-affectation-types')
  @RequirePermissions('products.read')
  @ApiOperation({ summary: 'Cat?logo de tipos de afectaci?n al IGV' })
  catalogTaxTypes() {
    return this.productsService.listTaxAffectationTypes();
  }

  @Get('catalogs/warehouses')
  @RequirePermissions('products.read')
  @ApiOperation({ summary: 'Almacenes por establecimiento' })
  async catalogWarehouses(@CurrentUser() actor: JwtRequestUser) {
    return this.productsService.listWarehouses(await this.scope.resolve(actor));
  }

  @Get('catalogs/product-locations')
  @RequirePermissions('products.read')
  @ApiOperation({ summary: 'Ubicaciones de producto por establecimiento' })
  async catalogLocations(
    @CurrentUser() actor: JwtRequestUser,
    @Query('establishmentId') establishmentId?: string,
  ) {
    return this.productsService.listProductLocations(
      await this.scope.resolve(actor, establishmentId),
    );
  }

  @Post('catalogs/product-locations')
  @RequirePermissions('products.write')
  @ApiOperation({ summary: 'Crear ubicaci?n de producto por establecimiento' })
  @ApiBody({ type: CreateProductLocationDto })
  async createLocation(
    @Body() dto: CreateProductLocationDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    await this.scope.assertAccess(actor, dto.establishmentId);
    return this.productsService.createProductLocation(dto);
  }

  @Get('catalogs/attribute-types')
  @RequirePermissions('products.read')
  @ApiOperation({ summary: 'Tipos de atributo para el listado din?mico' })
  catalogAttributeTypes() {
    return this.productsService.listAttributeTypes();
  }

  @Get('catalogs/isc-systems')
  @RequirePermissions('products.read')
  @ApiOperation({ summary: 'Cat?logo de tipos de sistema ISC' })
  catalogIscSystems() {
    return this.productsService.listIscSystems();
  }

  @Get(':id/equivalents')
  @RequirePermissions('products.read')
  @ApiOperation({ summary: 'Productos bioequivalentes / gen?ricos relacionados' })
  listEquivalents(@Param('id') id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.productsService.listEquivalents(id, actor);
  }

  @Post(':id/equivalents')
  @RequirePermissions('products.write')
  @ApiOperation({ summary: 'Definir productos bioequivalentes' })
  setEquivalents(
    @Param('id') id: string,
    @Body() dto: SetProductEquivalentsDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.productsService.setEquivalents(id, dto.equivalentProductIds, actor);
  }

  @Get(':id/suppliers')
  @RequirePermissions('products.read')
  @ApiOperation({ summary: 'Proveedores vinculados al producto' })
  listSuppliers(@Param('id') id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.productsService.listSupplierLinks(id, actor);
  }

  @Post(':id/suppliers')
  @RequirePermissions('products.write')
  @ApiOperation({ summary: 'Vincular o actualizar proveedor del producto' })
  upsertSupplier(
    @Param('id') id: string,
    @Body() dto: UpsertProductSupplierDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.productsService.upsertSupplierLink(id, dto, actor);
  }

  @Delete(':id/suppliers/:supplierId')
  @RequirePermissions('products.write')
  @ApiOperation({ summary: 'Desvincular proveedor del producto' })
  removeSupplier(
    @Param('id') id: string,
    @Param('supplierId') supplierId: string,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.productsService.removeSupplierLink(id, supplierId, actor);
  }

  @Get(':id/history/stock')
  @RequirePermissions('products.read')
  @ApiOperation({ summary: 'Historial de stock por ubicaci?n del producto' })
  historyStock(@Param('id') id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.productsService.historyStock(id, actor);
  }

  @Get(':id/history/prices')
  @RequirePermissions('products.read')
  @ApiOperation({ summary: 'Historial de cambios de precio del producto' })
  historyPrices(
    @Param('id') id: string,
    @Query() query: ProductPriceHistoryQueryDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.productsService.listPriceHistory(id, query, actor);
  }

  @Get(':id/history/sales')
  @RequirePermissions('products.read')
  @ApiOperation({ summary: 'Últimas ventas del producto' })
  historySales(
    @Param('id') id: string,
    @Query() query: ProductPriceHistoryQueryDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.productsService.historySales(id, query, actor);
  }

  @Get(':id/history/purchases')
  @RequirePermissions('products.read')
  @ApiOperation({ summary: 'Últimas compras del producto' })
  historyPurchases(
    @Param('id') id: string,
    @Query() query: ProductPriceHistoryQueryDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.productsService.historyPurchases(id, query, actor);
  }

  @Get(':id/stock')
  @RequirePermissions('products.read')
  @ApiOperation({ summary: 'Stock de producto y lista de precios creados' })
  stock(@Param('id') id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.productsService.stockSummary(id, actor);
  }

  @Get(':id')
  @RequirePermissions('products.read')
  @ApiOperation({ summary: 'Detalle completo del producto' })
  @ApiParam({ name: 'id', format: 'uuid' })
  findOne(@Param('id') id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.productsService.findOne(id, actor);
  }

  @Get()
  @RequirePermissions('products.read', 'nav.productos')
  @ApiOperation({ summary: 'Listar productos con paginaci?n' })
  list(@Query() query: ProductListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.productsService.list(query, actor);
  }

  @Post()
  @RequirePermissions('products.write')
  @ApiOperation({ summary: 'Crear producto' })
  @ApiBody({ type: CreateProductDto })
  create(@Body() dto: CreateProductDto, @CurrentUser() actor: JwtRequestUser) {
    return this.productsService.create(dto, actor);
  }

  @Patch(':id')
  @RequirePermissions('products.write')
  @ApiOperation({ summary: 'Actualizar producto' })
  @ApiBody({ type: CreateProductDto })
  update(
    @Param('id') id: string,
    @Body() dto: CreateProductDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.productsService.update(id, dto, actor);
  }

  @Delete(':id')
  @RequirePermissions('products.delete')
  @ApiOperation({ summary: 'Eliminar (l?gico) producto' })
  remove(@Param('id') id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.productsService.remove(id, actor);
  }

  @Post(':id/duplicate')
  @RequirePermissions('products.write')
  @ApiOperation({ summary: 'Duplicar producto' })
  duplicate(@Param('id') id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.productsService.duplicate(id, actor);
  }

  @Patch(':id/status')
  @RequirePermissions('products.write')
  @ApiOperation({ summary: 'Actualizar estado habilitado del producto' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateProductStatusDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.productsService.updateStatus(id, dto, actor);
  }

  @Patch(':id/barcode')
  @RequirePermissions('products.write')
  @ApiOperation({ summary: 'Actualizar c?digo de barras del producto' })
  updateBarcode(
    @Param('id') id: string,
    @Body() dto: UpdateProductBarcodeDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.productsService.updateBarcode(id, dto, actor);
  }

  @Post('export')
  @RequirePermissions('products.read')
  @ApiOperation({ summary: 'Exportar cat?logo de productos a Excel' })
  async exportProducts(
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() actor: JwtRequestUser,
  ): Promise<StreamableFile> {
    const buffer = await this.productsService.buildExportBuffer(actor);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent('productos-export.xlsx')}`,
    );
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return new StreamableFile(buffer);
  }

  @Post('import/preview')
  @RequirePermissions('products.write')
  @ApiOperation({ summary: 'Vista previa de importaci?n sin persistir cambios' })
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
  previewImportProducts(
    @Body() dto: ImportProductsDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.productsService.previewImportFromExcel(dto.mode, file, actor);
  }

  @Post('import')
  @RequirePermissions('products.write')
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
  importProducts(
    @Body() dto: ImportProductsDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.productsService.importFromExcel(dto.mode, file, actor);
  }

  @Get('import/template')
  @RequirePermissions('products.write')
  @ApiOperation({ summary: 'Descargar plantilla de importaci?n por modo' })
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
          ? 'items_prices_simsed.xlsx'
          : 'items.xlsx';
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return new StreamableFile(buffer);
  }
}
