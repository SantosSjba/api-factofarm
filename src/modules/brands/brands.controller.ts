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
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { MaestroListQueryDto } from '../../common/dto/maestro-list-query.dto';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@ApiTags('brands')
@ApiBearerAuth()
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  @RequirePermissions('brands.read', 'nav.marcas')
  @ApiOperation({ summary: 'Listar marcas (paginado si page está presente)' })
  findAll(@Query() query: MaestroListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.brandsService.findAll(query, actor);
  }

  @Post()
  @RequirePermissions('brands.write')
  @ApiOperation({ summary: 'Crear marca' })
  @ApiBody({ type: CreateBrandDto })
  create(@Body() dto: CreateBrandDto, @CurrentUser() actor: JwtRequestUser) {
    return this.brandsService.create(dto, actor);
  }

  @Patch(':id')
  @RequirePermissions('brands.write')
  @ApiOperation({ summary: 'Actualizar marca' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: UpdateBrandDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBrandDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.brandsService.update(id, dto, actor);
  }

  @Delete(':id')
  @RequirePermissions('brands.write')
  @ApiOperation({ summary: 'Eliminar marca (soft delete)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.brandsService.remove(id, actor);
  }
}
