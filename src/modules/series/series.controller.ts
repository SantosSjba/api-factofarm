import { Controller, Delete, Get, Param, Patch, Query, Res, StreamableFile } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { SeriesListQueryDto } from './dto/series-list-query.dto';
import { UpdateSeriesStatusDto } from './dto/update-series-status.dto';
import { SeriesService } from './series.service';
import { Body } from '@nestjs/common';

@ApiTags('Series')
@Controller('series')
export class SeriesController {
  constructor(private readonly seriesService: SeriesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar series' })
  list(@Query() query: SeriesListQueryDto) {
    return this.seriesService.list(query);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Actualizar estado de serie' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateSeriesStatusDto) {
    return this.seriesService.updateStatus(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar serie (soft delete)' })
  remove(@Param('id') id: string) {
    return this.seriesService.remove(id);
  }

  @Get('export')
  @ApiOperation({ summary: 'Exportar series' })
  async export(
    @Query() query: SeriesListQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const buffer = await this.seriesService.buildExportBuffer(query);
    const filename = 'series.xlsx';
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return new StreamableFile(buffer);
  }
}
