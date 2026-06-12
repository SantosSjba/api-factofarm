import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { MaestroListQueryDto } from '../../common/dto/maestro-list-query.dto';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { CreateAdministrationRouteDto } from './dto/create-administration-route.dto';
import { UpdateAdministrationRouteDto } from './dto/update-administration-route.dto';
import { AdministrationRoutesService } from './administration-routes.service';

@ApiTags('administration-routes')
@ApiBearerAuth()
@Controller('administration-routes')
export class AdministrationRoutesController {
  constructor(private readonly administrationRoutesService: AdministrationRoutesService) {}

  @Get()
  @RequirePermissions('admin-routes.read', 'nav.vias_administracion')
  findAll(@Query() query: MaestroListQueryDto) {
    return this.administrationRoutesService.findAll(query);
  }

  @Post()
  @RequirePermissions('admin-routes.write')
  @ApiBody({ type: CreateAdministrationRouteDto })
  create(@Body() dto: CreateAdministrationRouteDto, @CurrentUser() actor: JwtRequestUser) {
    return this.administrationRoutesService.create(dto, actor.sub);
  }

  @Patch(':id')
  @RequirePermissions('admin-routes.write')
  @ApiParam({ name: 'id', format: 'uuid' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdministrationRouteDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.administrationRoutesService.update(id, dto, actor.sub);
  }

  @Delete(':id')
  @RequirePermissions('admin-routes.write')
  @ApiParam({ name: 'id', format: 'uuid' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.administrationRoutesService.remove(id, actor.sub);
  }
}
