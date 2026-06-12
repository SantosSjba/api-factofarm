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
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { SupplierListQueryDto } from './dto/supplier-list-query.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { UpsertSupplierProductDto } from './dto/upsert-supplier-product.dto';
import { SuppliersService } from './suppliers.service';

@ApiTags('suppliers')
@ApiBearerAuth()
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @RequirePermissions('suppliers.read', 'nav.proveedores')
  @ApiOperation({ summary: 'Listar proveedores con paginación' })
  list(@Query() query: SupplierListQueryDto) {
    return this.suppliersService.list(query);
  }

  @Get('options')
  @RequirePermissions('suppliers.read')
  @ApiOperation({ summary: 'Opciones de proveedores habilitados (combos)' })
  options() {
    return this.suppliersService.findAllOptions();
  }

  @Get(':id')
  @RequirePermissions('suppliers.read')
  @ApiOperation({ summary: 'Detalle de proveedor' })
  @ApiParam({ name: 'id', format: 'uuid' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.suppliersService.findOne(id);
  }

  @Post()
  @RequirePermissions('suppliers.write')
  @ApiOperation({ summary: 'Crear proveedor' })
  @ApiBody({ type: CreateSupplierDto })
  create(@Body() dto: CreateSupplierDto, @CurrentUser() actor: JwtRequestUser) {
    return this.suppliersService.create(dto, actor.sub);
  }

  @Patch(':id')
  @RequirePermissions('suppliers.write')
  @ApiOperation({ summary: 'Actualizar proveedor' })
  @ApiParam({ name: 'id', format: 'uuid' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupplierDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.suppliersService.update(id, dto, actor.sub);
  }

  @Delete(':id')
  @RequirePermissions('suppliers.write')
  @ApiOperation({ summary: 'Eliminar proveedor (soft delete)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.suppliersService.remove(id, actor.sub);
  }

  @Get(':id/purchase-history')
  @RequirePermissions('suppliers.read')
  @ApiOperation({ summary: 'Historial de compras del proveedor (placeholder Fase 4)' })
  listPurchaseHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.suppliersService.listPurchaseHistory(id);
  }

  @Get(':id/products')
  @RequirePermissions('suppliers.read')
  @ApiOperation({ summary: 'Productos vinculados al proveedor' })
  listProducts(@Param('id', ParseUUIDPipe) id: string) {
    return this.suppliersService.listProducts(id);
  }

  @Post(':id/products')
  @RequirePermissions('suppliers.write')
  @ApiOperation({ summary: 'Vincular o actualizar producto del proveedor' })
  upsertProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertSupplierProductDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.suppliersService.upsertProduct(id, dto, actor.sub);
  }

  @Delete(':id/products/:productId')
  @RequirePermissions('suppliers.write')
  @ApiOperation({ summary: 'Desvincular producto del proveedor' })
  removeProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.suppliersService.removeProduct(id, productId, actor.sub);
  }
}
