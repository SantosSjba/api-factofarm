import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateProductLocationDto } from './dto/create-product-location.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductListQueryDto } from './dto/product-list-query.dto';
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
  catalogLocations() {
    return this.productsService.listProductLocations();
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
}
