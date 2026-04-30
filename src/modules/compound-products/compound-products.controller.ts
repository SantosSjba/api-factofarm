import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CompoundProductsService } from './compound-products.service';
import { CompoundProductListQueryDto } from './dto/compound-product-list-query.dto';
import { CreateCompoundProductDto } from './dto/create-compound-product.dto';

@ApiTags('CompoundProducts')
@Controller('compound-products')
export class CompoundProductsController {
  constructor(private readonly service: CompoundProductsService) {}

  @Get('catalogs/units')
  @ApiOperation({ summary: 'Listar unidades para productos compuestos' })
  listUnits() {
    return this.service.listUnits();
  }

  @Get('catalogs/currencies')
  @ApiOperation({ summary: 'Listar monedas para productos compuestos' })
  listCurrencies() {
    return this.service.listCurrencies();
  }

  @Get('catalogs/tax-affectation-types')
  @ApiOperation({ summary: 'Listar tipos de afectación para productos compuestos' })
  listTaxAffectationTypes() {
    return this.service.listTaxAffectationTypes();
  }

  @Get('catalogs/platforms')
  @ApiOperation({ summary: 'Listar plataformas para productos compuestos' })
  listPlatforms() {
    return this.service.listPlatforms();
  }

  @Get()
  @ApiOperation({ summary: 'Listar productos compuestos con paginación' })
  list(@Query() query: CompoundProductListQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle del producto compuesto' })
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear producto compuesto' })
  create(@Body() dto: CreateCompoundProductDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar producto compuesto' })
  update(@Param('id') id: string, @Body() dto: CreateCompoundProductDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar producto compuesto (soft delete)' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
