import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { MaestroListQueryDto } from '../../common/dto/maestro-list-query.dto';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { CreateLaboratoryDto } from './dto/create-laboratory.dto';
import { UpdateLaboratoryDto } from './dto/update-laboratory.dto';
import { LaboratoriesService } from './laboratories.service';

@ApiTags('laboratories')
@ApiBearerAuth()
@Controller('laboratories')
export class LaboratoriesController {
  constructor(private readonly laboratoriesService: LaboratoriesService) {}

  @Get()
  @RequirePermissions('laboratories.read', 'nav.laboratorios')
  @ApiOperation({ summary: 'Listar laboratorios' })
  findAll(@Query() query: MaestroListQueryDto) {
    return this.laboratoriesService.findAll(query);
  }

  @Post()
  @RequirePermissions('laboratories.write')
  @ApiOperation({ summary: 'Crear laboratorio' })
  @ApiBody({ type: CreateLaboratoryDto })
  create(@Body() dto: CreateLaboratoryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.laboratoriesService.create(dto, actor.sub);
  }

  @Patch(':id')
  @RequirePermissions('laboratories.write')
  @ApiOperation({ summary: 'Actualizar laboratorio' })
  @ApiParam({ name: 'id', format: 'uuid' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLaboratoryDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.laboratoriesService.update(id, dto, actor.sub);
  }

  @Delete(':id')
  @RequirePermissions('laboratories.write')
  @ApiOperation({ summary: 'Eliminar laboratorio (soft delete)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.laboratoriesService.remove(id, actor.sub);
  }
}
