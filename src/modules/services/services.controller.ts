import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { CreateServiceDto } from './dto/create-service.dto';
import { ServiceListQueryDto } from './dto/service-list-query.dto';
import { UpdateServiceBarcodeDto } from './dto/update-service-barcode.dto';
import { UpdateServiceStatusDto } from './dto/update-service-status.dto';
import { ServicesService } from './services.service';

@ApiTags('services')
@ApiBearerAuth()
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
  catalogLocations(@CurrentUser() actor: JwtRequestUser) {
    return this.servicesService.listProductLocations(actor);
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
  list(@Query() query: ServiceListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.servicesService.list(query, actor);
  }

  @Get(':id/history/stock')
  @ApiOperation({ summary: 'Historial de stock del servicio' })
  historyStock(@Param('id') id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.servicesService.listHistoryStock(id, actor);
  }

  @Post()
  @ApiOperation({ summary: 'Crear servicio' })
  @ApiBody({ type: CreateServiceDto })
  create(@Body() dto: CreateServiceDto, @CurrentUser() actor: JwtRequestUser) {
    return this.servicesService.create(dto, actor);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar servicio' })
  @ApiBody({ type: CreateServiceDto })
  update(@Param('id') id: string, @Body() dto: CreateServiceDto, @CurrentUser() actor: JwtRequestUser) {
    return this.servicesService.update(id, dto, actor);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar (lógico) servicio' })
  remove(@Param('id') id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.servicesService.remove(id, actor);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicar servicio' })
  duplicate(@Param('id') id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.servicesService.duplicate(id, actor);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Actualizar estado habilitado del servicio' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateServiceStatusDto, @CurrentUser() actor: JwtRequestUser) {
    return this.servicesService.updateStatus(id, dto, actor);
  }

  @Patch(':id/barcode')
  @ApiOperation({ summary: 'Actualizar código de barras del servicio' })
  updateBarcode(@Param('id') id: string, @Body() dto: UpdateServiceBarcodeDto, @CurrentUser() actor: JwtRequestUser) {
    return this.servicesService.updateBarcode(id, dto, actor);
  }
}
