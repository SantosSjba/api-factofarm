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
import { CreateCustomerTypeDto } from './dto/create-customer-type.dto';
import { UpdateCustomerTypeDto } from './dto/update-customer-type.dto';
import { CustomerTypesService } from './customer-types.service';

@ApiTags('customer-types')
@Controller('customer-types')
export class CustomerTypesController {
  constructor(private readonly customerTypesService: CustomerTypesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar tipos de cliente' })
  @ApiQuery({ name: 'search', required: false, description: 'Búsqueda textual' })
  @ApiQuery({
    name: 'field',
    required: false,
    description: 'Campo de búsqueda (all|descripcion)',
  })
  findAll(
    @Query('search') search?: string,
    @Query('field') field?: string,
  ) {
    return this.customerTypesService.findAll({ search, field });
  }

  @Post()
  @ApiOperation({ summary: 'Crear tipo de cliente' })
  @ApiBody({ type: CreateCustomerTypeDto })
  create(@Body() dto: CreateCustomerTypeDto) {
    return this.customerTypesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar tipo de cliente' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: UpdateCustomerTypeDto })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCustomerTypeDto) {
    return this.customerTypesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar tipo de cliente (soft delete)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.customerTypesService.remove(id);
  }
}
