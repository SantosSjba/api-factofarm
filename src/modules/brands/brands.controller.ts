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
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@ApiTags('brands')
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar marcas' })
  @ApiQuery({ name: 'search', required: false, description: 'Búsqueda textual' })
  @ApiQuery({
    name: 'field',
    required: false,
    description: 'Campo de búsqueda (all|nombre)',
  })
  findAll(@Query('search') search?: string, @Query('field') field?: string) {
    return this.brandsService.findAll({ search, field });
  }

  @Post()
  @ApiOperation({ summary: 'Crear marca' })
  @ApiBody({ type: CreateBrandDto })
  create(@Body() dto: CreateBrandDto) {
    return this.brandsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar marca' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: UpdateBrandDto })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBrandDto) {
    return this.brandsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar marca (soft delete)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.brandsService.remove(id);
  }
}
