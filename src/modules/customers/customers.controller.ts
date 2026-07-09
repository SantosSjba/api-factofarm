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
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { CreateCustomerZoneDto } from './dto/create-customer-zone.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomerListQueryDto } from './dto/customer-list-query.dto';
import { ExportCustomersDto } from './dto/export-customers.dto';
import { UpdateCustomerBarcodeDto } from './dto/update-customer-barcode.dto';
import { UpdateCustomerZoneDto } from './dto/update-customer-zone.dto';
import { UpdateCustomerStatusDto } from './dto/update-customer-status.dto';
import { UpdateCustomerTagsDto } from './dto/update-customer-tags.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { OPENAPI_EXAMPLES } from '../../common/openapi/openapi-examples';
import { CustomersService } from './customers.service';

@ApiTags('customers')
@ApiBearerAuth()
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @RequirePermissions('customers.read', 'nav.clientes_list')
  @ApiOperation({ summary: 'Listar clientes con filtros y paginación' })
  list(@Query() query: CustomerListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.customersService.list(query, actor);
  }

  @Post()
  @RequirePermissions('customers.write')
  @ApiOperation({ summary: 'Crear cliente' })
  @ApiBody({ type: CreateCustomerDto, examples: { natural: { value: OPENAPI_EXAMPLES.createCustomer } } })
  create(@Body() dto: CreateCustomerDto, @CurrentUser() actor: JwtRequestUser) {
    return this.customersService.create(dto, actor);
  }

  @Get('catalogs/document-types')
  @RequirePermissions('customers.read')
  listDocumentTypes() {
    return this.customersService.getDocumentTypes();
  }

  @Get('catalogs/nationalities')
  @RequirePermissions('customers.read')
  listNationalities() {
    return this.customersService.getNationalities();
  }

  @Get('catalogs/sellers')
  @RequirePermissions('customers.read')
  listSellers(@CurrentUser() actor: JwtRequestUser) {
    return this.customersService.listSellers(actor);
  }

  @Get('zones')
  @RequirePermissions('customers.read')
  listZones(@CurrentUser() actor: JwtRequestUser) {
    return this.customersService.listZones(actor);
  }

  @Post('zones')
  @RequirePermissions('customers.write')
  createZone(@Body() dto: CreateCustomerZoneDto, @CurrentUser() actor: JwtRequestUser) {
    return this.customersService.createZone(dto, actor);
  }

  @Patch('zones/:id')
  @RequirePermissions('customers.write')
  updateZone(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerZoneDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.customersService.updateZone(id, dto, actor);
  }

  @Delete('zones/:id')
  @RequirePermissions('customers.write')
  removeZone(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.customersService.removeZone(id, actor);
  }

  @Get('import/template')
  @RequirePermissions('customers.write')
  async downloadImportTemplate(@Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    const buffer = this.customersService.buildImportTemplateBuffer();
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent('clientes-formato.xlsx')}`,
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    return new StreamableFile(buffer);
  }

  @Post('import/preview')
  @RequirePermissions('customers.write')
  @ApiOperation({ summary: 'Vista previa de importación de clientes sin persistir' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  previewImportCustomers(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.customersService.previewImportFromExcel(file, actor);
  }

  @Post('import')
  @RequirePermissions('customers.write')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  importCustomers(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.customersService.importFromExcel(file, actor);
  }

  @Post('export')
  @RequirePermissions('customers.read')
  @ApiQuery({ name: 'period', required: false })
  async exportCustomers(
    @Body() dto: ExportCustomersDto,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() actor: JwtRequestUser,
  ): Promise<StreamableFile> {
    const buffer = await this.customersService.buildExportBuffer(dto, actor);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent('clientes-export.xlsx')}`,
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    return new StreamableFile(buffer);
  }

  @Get(':id')
  @RequirePermissions('customers.read')
  @ApiParam({ name: 'id', format: 'uuid' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.customersService.findOne(id, actor);
  }

  @Patch(':id')
  @RequirePermissions('customers.write')
  @ApiParam({ name: 'id', format: 'uuid' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.customersService.update(id, dto, actor);
  }

  @Delete(':id')
  @RequirePermissions('customers.delete')
  @ApiParam({ name: 'id', format: 'uuid' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.customersService.remove(id, actor);
  }

  @Patch(':id/status')
  @RequirePermissions('customers.write')
  @ApiParam({ name: 'id', format: 'uuid' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerStatusDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.customersService.updateStatus(id, dto, actor);
  }

  @Patch(':id/barcode')
  @RequirePermissions('customers.write')
  @ApiParam({ name: 'id', format: 'uuid' })
  updateBarcode(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerBarcodeDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.customersService.updateBarcode(id, dto, actor);
  }

  @Patch(':id/tags')
  @RequirePermissions('customers.write')
  @ApiParam({ name: 'id', format: 'uuid' })
  updateTags(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerTagsDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.customersService.updateTags(id, dto, actor);
  }
}
