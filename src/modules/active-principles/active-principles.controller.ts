import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { MaestroListQueryDto } from '../../common/dto/maestro-list-query.dto';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { CreateActivePrincipleDto } from './dto/create-active-principle.dto';
import { UpdateActivePrincipleDto } from './dto/update-active-principle.dto';
import { ActivePrinciplesService } from './active-principles.service';

@ApiTags('active-principles')
@ApiBearerAuth()
@Controller('active-principles')
export class ActivePrinciplesController {
  constructor(private readonly activePrinciplesService: ActivePrinciplesService) {}

  @Get()
  @RequirePermissions('active-principles.read', 'nav.principios_activos')
  findAll(@Query() query: MaestroListQueryDto) {
    return this.activePrinciplesService.findAll(query);
  }

  @Post()
  @RequirePermissions('active-principles.write')
  @ApiBody({ type: CreateActivePrincipleDto })
  create(@Body() dto: CreateActivePrincipleDto, @CurrentUser() actor: JwtRequestUser) {
    return this.activePrinciplesService.create(dto, actor.sub);
  }

  @Patch(':id')
  @RequirePermissions('active-principles.write')
  @ApiParam({ name: 'id', format: 'uuid' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateActivePrincipleDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.activePrinciplesService.update(id, dto, actor.sub);
  }

  @Delete(':id')
  @RequirePermissions('active-principles.write')
  @ApiParam({ name: 'id', format: 'uuid' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.activePrinciplesService.remove(id, actor.sub);
  }
}
