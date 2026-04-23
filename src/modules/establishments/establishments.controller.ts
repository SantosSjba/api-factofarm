import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateEstablishmentSeriesDto } from './dto/create-establishment-series.dto';
import { CreateEstablishmentDto } from './dto/create-establishment.dto';
import { UpdateEstablishmentDto } from './dto/update-establishment.dto';
import { EstablishmentsService } from './establishments.service';

@ApiTags('establishments')
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

  @Get()
  @ApiOperation({
    summary: 'Listar establecimientos activos',
  })
  findAll() {
    return this.establishmentsService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Crear establecimiento' })
  @ApiBody({ type: CreateEstablishmentDto })
  create(@Body() dto: CreateEstablishmentDto) {
    return this.establishmentsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar establecimiento' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: UpdateEstablishmentDto })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEstablishmentDto) {
    return this.establishmentsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar establecimiento (soft delete)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.establishmentsService.remove(id);
  }

  @Get(':id/series')
  @ApiOperation({ summary: 'Listar series de un establecimiento' })
  @ApiParam({ name: 'id', format: 'uuid' })
  listSeries(@Param('id', ParseUUIDPipe) id: string) {
    return this.establishmentsService.listSeries(id);
  }

  @Post(':id/series')
  @ApiOperation({ summary: 'Crear serie para un establecimiento' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: CreateEstablishmentSeriesDto })
  addSeries(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateEstablishmentSeriesDto,
  ) {
    return this.establishmentsService.addSeries(id, dto);
  }

  @Delete(':id/series/:seriesId')
  @ApiOperation({ summary: 'Eliminar serie de un establecimiento' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'seriesId', format: 'uuid' })
  deleteSeries(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('seriesId', ParseUUIDPipe) seriesId: string,
  ) {
    return this.establishmentsService.deleteSeries(id, seriesId);
  }
}
