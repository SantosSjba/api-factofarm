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
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { CreateCustomerZoneDto } from './dto/create-customer-zone.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomerListQueryDto } from './dto/customer-list-query.dto';
import { ExportCustomersDto } from './dto/export-customers.dto';
import { UpdateCustomerBarcodeDto } from './dto/update-customer-barcode.dto';
import { UpdateCustomerStatusDto } from './dto/update-customer-status.dto';
import { UpdateCustomerTagsDto } from './dto/update-customer-tags.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomersService } from './customers.service';

@ApiTags('customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar clientes con filtros y paginación' })
  list(@Query() query: CustomerListQueryDto) {
    return this.customersService.list(query);
  }

  @Post()
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Get('catalogs/document-types')
  listDocumentTypes() {
    return this.customersService.getDocumentTypes();
  }

  @Get('catalogs/nationalities')
  listNationalities() {
    return this.customersService.getNationalities();
  }

  @Get('catalogs/sellers')
  listSellers() {
    return this.customersService.listSellers();
  }

  @Get('zones')
  listZones() {
    return this.customersService.listZones();
  }

  @Post('zones')
  createZone(@Body() dto: CreateCustomerZoneDto) {
    return this.customersService.createZone(dto);
  }

  @Get('import/template')
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

  @Post('import')
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
  importCustomers(@UploadedFile() file: Express.Multer.File) {
    return this.customersService.importFromExcel(file);
  }

  @Post('export')
  @ApiQuery({ name: 'period', required: false })
  async exportCustomers(
    @Body() dto: ExportCustomersDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const buffer = await this.customersService.buildExportBuffer(dto);
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
  @ApiParam({ name: 'id', format: 'uuid' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.remove(id);
  }

  @Patch(':id/status')
  @ApiParam({ name: 'id', format: 'uuid' })
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCustomerStatusDto) {
    return this.customersService.updateStatus(id, dto);
  }

  @Patch(':id/barcode')
  @ApiParam({ name: 'id', format: 'uuid' })
  updateBarcode(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCustomerBarcodeDto) {
    return this.customersService.updateBarcode(id, dto);
  }

  @Patch(':id/tags')
  @ApiParam({ name: 'id', format: 'uuid' })
  updateTags(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCustomerTagsDto) {
    return this.customersService.updateTags(id, dto);
  }
}
