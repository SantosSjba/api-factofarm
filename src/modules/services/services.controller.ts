import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateServiceDto } from './dto/create-service.dto';
import { ServiceListQueryDto } from './dto/service-list-query.dto';
import { UpdateServiceBarcodeDto } from './dto/update-service-barcode.dto';
import { UpdateServiceStatusDto } from './dto/update-service-status.dto';
import { ServicesService } from './services.service';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get('catalogs/units')
  @ApiOperation({ summary: 'Catálogo de unidades para servicios' })
  catalogUnits() {
    return this.servicesService.listUnits();
  }

  @Get('catalogs/currencies')
  @ApiOperation({ summary: 'Catálogo de monedas' })
  catalogCurrencies() {
    return this.servicesService.listCurrencies();
  }

  @Get('catalogs/tax-affectation-types')
  @ApiOperation({ summary: 'Catálogo de tipos de afectación al IGV' })
  catalogTaxTypes() {
    return this.servicesService.listTaxAffectationTypes();
  }

  @Get('catalogs/product-locations')
  @ApiOperation({ summary: 'Ubicaciones de servicio' })
  catalogLocations() {
    return this.servicesService.listProductLocations();
  }

  @Get('catalogs/attribute-types')
  @ApiOperation({ summary: 'Tipos de atributo para servicios' })
  catalogAttributeTypes() {
    return this.servicesService.listAttributeTypes();
  }

  @Get('catalogs/isc-systems')
  @ApiOperation({ summary: 'Catálogo de tipos de sistema ISC' })
  catalogIscSystems() {
    return this.servicesService.listIscSystems();
  }

  @Get()
  @ApiOperation({ summary: 'Listar servicios con paginación' })
  list(@Query() query: ServiceListQueryDto) {
    return this.servicesService.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Crear servicio' })
  @ApiBody({ type: CreateServiceDto })
  create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar servicio' })
  @ApiBody({ type: CreateServiceDto })
  update(@Param('id') id: string, @Body() dto: CreateServiceDto) {
    return this.servicesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar (lógico) servicio' })
  remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicar servicio' })
  duplicate(@Param('id') id: string) {
    return this.servicesService.duplicate(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Actualizar estado habilitado del servicio' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateServiceStatusDto) {
    return this.servicesService.updateStatus(id, dto);
  }

  @Patch(':id/barcode')
  @ApiOperation({ summary: 'Actualizar código de barras del servicio' })
  updateBarcode(@Param('id') id: string, @Body() dto: UpdateServiceBarcodeDto) {
    return this.servicesService.updateBarcode(id, dto);
  }
}
