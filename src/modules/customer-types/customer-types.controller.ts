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
import { CreateCustomerTypeDto } from './dto/create-customer-type.dto';
import { UpdateCustomerTypeDto } from './dto/update-customer-type.dto';
import { CustomerTypesService } from './customer-types.service';

@ApiTags('customer-types')
@ApiBearerAuth()
@Controller('customer-types')
export class CustomerTypesController {
  constructor(private readonly customerTypesService: CustomerTypesService) {}

  @Get()
  @RequirePermissions('customer-types.read', 'nav.tipo_clientes')
  @ApiOperation({ summary: 'Listar tipos de cliente (paginado si page está presente)' })
  findAll(@Query() query: MaestroListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.customerTypesService.findAll(query, actor);
  }

  @Post()
  @RequirePermissions('customer-types.write')
  @ApiOperation({ summary: 'Crear tipo de cliente' })
  @ApiBody({ type: CreateCustomerTypeDto })
  create(@Body() dto: CreateCustomerTypeDto, @CurrentUser() actor: JwtRequestUser) {
    return this.customerTypesService.create(dto, actor);
  }

  @Patch(':id')
  @RequirePermissions('customer-types.write')
  @ApiOperation({ summary: 'Actualizar tipo de cliente' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: UpdateCustomerTypeDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerTypeDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.customerTypesService.update(id, dto, actor);
  }

  @Delete(':id')
  @RequirePermissions('customer-types.write')
  @ApiOperation({ summary: 'Eliminar tipo de cliente (soft delete)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.customerTypesService.remove(id, actor);
  }
}
