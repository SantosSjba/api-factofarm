import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { MaestroListQueryDto } from '../../common/dto/maestro-list-query.dto';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { CreateMedicoDto, UpdateMedicoDto } from './dto/medico.dto';
import { MedicosService } from './medicos.service';

@ApiTags('medicos')
@ApiBearerAuth()
@Controller('medicos')
export class MedicosController {
  constructor(private readonly service: MedicosService) {}

  @Get()
  @RequirePermissions('medicos.read', 'nav.medicos')
  @ApiOperation({ summary: 'Listar médicos prescriptores' })
  findAll(@Query() query: MaestroListQueryDto) {
    return this.service.findAll(query);
  }

  @Post()
  @RequirePermissions('medicos.write')
  create(@Body() dto: CreateMedicoDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.create(dto, actor.sub);
  }

  @Patch(':id')
  @RequirePermissions('medicos.write')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMedicoDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.update(id, dto, actor.sub);
  }

  @Delete(':id')
  @RequirePermissions('medicos.write')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.remove(id, actor.sub);
  }
}
