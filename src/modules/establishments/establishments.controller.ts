import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { CreateEstablishmentSeriesDto } from './dto/create-establishment-series.dto';
import { CreateEstablishmentDto } from './dto/create-establishment.dto';
import { EstablishmentListQueryDto } from './dto/establishment-list-query.dto';
import { UpdateEstablishmentDto } from './dto/update-establishment.dto';
import { EstablishmentsService } from './application/establishments.service';

@ApiTags('establishments')
@ApiBearerAuth()
@Controller('establishments')
export class EstablishmentsController {
  constructor(private readonly establishmentsService: EstablishmentsService) {}

  @Get('series/document-types')
  @ApiOperation({
    summary: 'Tipos de documento disponibles para series',
  })
  getSeriesDocumentTypes() {
    return this.establishmentsService.getDocumentTypes();
  }

  @Get('ubigeo/departments')
  @ApiOperation({ summary: 'Listar departamentos (ubigeo)' })
  listDepartments() {
    return this.establishmentsService.listDepartments();
  }

  @Get('ubigeo/provinces/:departmentId')
  @ApiOperation({ summary: 'Listar provincias por departamento' })
  @ApiParam({ name: 'departmentId', description: 'Ubigeo departamento id' })
  listProvinces(@Param('departmentId') departmentId: string) {
    return this.establishmentsService.listProvinces(departmentId);
  }

  @Get('ubigeo/districts/:provinceId')
  @ApiOperation({ summary: 'Listar distritos por provincia' })
  @ApiParam({ name: 'provinceId', description: 'Ubigeo provincia id' })
  listDistricts(@Param('provinceId') provinceId: string) {
    return this.establishmentsService.listDistricts(provinceId);
  }

  @Get()
  @RequirePermissions('establishments.read', 'nav.establecimientos', 'users.write')
  @ApiOperation({
    summary: 'Listar establecimientos activos (paginado si se envía page)',
  })
  findAll(@Query() query: EstablishmentListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.establishmentsService.findAll(
      {
        search: query.search,
        hospital: query.hospital === 'all' ? undefined : query.hospital,
        tenantId: query.tenantId,
        page: query.page,
        pageSize: query.pageSize,
      },
      actor,
    );
  }

  @Get('pos-payment-settings')
  @RequirePermissions('sales.read', 'nav.punto_venta')
  @ApiOperation({ summary: 'Números Yape/Plin del establecimiento activo (referencia POS)' })
  posPaymentSettings(@CurrentUser() actor: JwtRequestUser) {
    return this.establishmentsService.getPosPaymentSettings(actor.establecimientoId, actor);
  }

  @Post()
  @RequirePermissions('establishments.write', 'nav.establecimientos')
  @ApiOperation({ summary: 'Crear establecimiento' })
  @ApiBody({ type: CreateEstablishmentDto })
  create(@Body() dto: CreateEstablishmentDto, @CurrentUser() actor: JwtRequestUser) {
    return this.establishmentsService.create(dto, actor);
  }

  @Patch(':id')
  @RequirePermissions('establishments.write', 'nav.establecimientos')
  @ApiOperation({ summary: 'Actualizar establecimiento' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: UpdateEstablishmentDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEstablishmentDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.establishmentsService.update(id, dto, actor);
  }

  @Delete(':id')
  @RequirePermissions('establishments.write', 'nav.establecimientos')
  @ApiOperation({ summary: 'Eliminar establecimiento (soft delete)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.establishmentsService.remove(id, actor);
  }

  @Get(':id/series')
  @RequirePermissions('establishments.read', 'nav.establecimientos')
  @ApiOperation({ summary: 'Listar series de un establecimiento' })
  @ApiParam({ name: 'id', format: 'uuid' })
  listSeries(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.establishmentsService.listSeries(id, actor);
  }

  @Post(':id/series')
  @RequirePermissions('establishments.write', 'nav.establecimientos')
  @ApiOperation({ summary: 'Crear serie para un establecimiento' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: CreateEstablishmentSeriesDto })
  addSeries(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateEstablishmentSeriesDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.establishmentsService.addSeries(id, dto, actor);
  }

  @Delete(':id/series/:seriesId')
  @RequirePermissions('establishments.write', 'nav.establecimientos')
  @ApiOperation({ summary: 'Eliminar serie de un establecimiento' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'seriesId', format: 'uuid' })
  deleteSeries(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('seriesId', ParseUUIDPipe) seriesId: string,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.establishmentsService.deleteSeries(id, seriesId, actor);
  }
}
