import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { MaestroListQueryDto } from '../../common/dto/maestro-list-query.dto';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { UnitsService } from './units.service';

@ApiTags('units')
@ApiBearerAuth()
@Controller('units')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get()
  @RequirePermissions('units.read', 'nav.unidades')
  findAll(@Query() query: MaestroListQueryDto) {
    return this.unitsService.findAll(query);
  }

  @Post()
  @RequirePermissions('units.write')
  @ApiBody({ type: CreateUnitDto })
  create(@Body() dto: CreateUnitDto, @CurrentUser() actor: JwtRequestUser) {
    return this.unitsService.create(dto, actor.sub);
  }

  @Patch(':id')
  @RequirePermissions('units.write')
  @ApiParam({ name: 'id', format: 'uuid' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUnitDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.unitsService.update(id, dto, actor.sub);
  }

  @Delete(':id')
  @RequirePermissions('units.write')
  @ApiParam({ name: 'id', format: 'uuid' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.unitsService.remove(id, actor.sub);
  }
}
