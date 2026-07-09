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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('categories')
@ApiBearerAuth()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @RequirePermissions('categories.read', 'nav.categorias')
  @ApiOperation({ summary: 'Listar categorías (paginado si page está presente)' })
  findAll(@Query() query: MaestroListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.categoriesService.findAll(query, actor);
  }

  @Get('tree')
  @RequirePermissions('categories.read', 'nav.categorias')
  @ApiOperation({ summary: 'Árbol jerárquico de categorías' })
  findTree(@CurrentUser() actor: JwtRequestUser) {
    return this.categoriesService.findTree(actor);
  }

  @Post()
  @RequirePermissions('categories.write')
  @ApiOperation({ summary: 'Crear categoría' })
  @ApiBody({ type: CreateCategoryDto })
  create(@Body() dto: CreateCategoryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.categoriesService.create(dto, actor);
  }

  @Patch(':id')
  @RequirePermissions('categories.write')
  @ApiOperation({ summary: 'Actualizar categoría' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: UpdateCategoryDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.categoriesService.update(id, dto, actor);
  }

  @Delete(':id')
  @RequirePermissions('categories.write')
  @ApiOperation({ summary: 'Eliminar categoría (soft delete)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.categoriesService.remove(id, actor);
  }
}
