import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { CompoundProductsService } from './compound-products.service';
import { CompoundProductListQueryDto } from './dto/compound-product-list-query.dto';
import { CreateCompoundProductDto } from './dto/create-compound-product.dto';
import { ImportCompoundProductsDto } from './dto/import-compound-products.dto';

@ApiTags('CompoundProducts')
@Controller('compound-products')
export class CompoundProductsController {
  constructor(private readonly service: CompoundProductsService) {}

  @Get('catalogs/units')
  @ApiOperation({ summary: 'Listar unidades para productos compuestos' })
  listUnits() {
    return this.service.listUnits();
  }

  @Get('catalogs/currencies')
  @ApiOperation({ summary: 'Listar monedas para productos compuestos' })
  listCurrencies() {
    return this.service.listCurrencies();
  }

  @Get('catalogs/tax-affectation-types')
  @ApiOperation({ summary: 'Listar tipos de afectación para productos compuestos' })
  listTaxAffectationTypes() {
    return this.service.listTaxAffectationTypes();
  }

  @Get('catalogs/platforms')
  @ApiOperation({ summary: 'Listar plataformas para productos compuestos' })
  listPlatforms() {
    return this.service.listPlatforms();
  }

  @Get()
  @ApiOperation({ summary: 'Listar productos compuestos con paginación' })
  list(@Query() query: CompoundProductListQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle del producto compuesto' })
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear producto compuesto' })
  create(@Body() dto: CreateCompoundProductDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar producto compuesto' })
  update(@Param('id') id: string, @Body() dto: CreateCompoundProductDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar producto compuesto (soft delete)' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post('import')
  @ApiOperation({ summary: 'Importar productos compuestos y detalle de productos compuestos' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        mode: { type: 'string', enum: ['PRODUCTOS_COMPUESTOS', 'DETALLE_PRODUCTOS_COMPUESTOS'] },
        file: { type: 'string', format: 'binary' },
      },
      required: ['mode', 'file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  importCompoundProducts(@Body() dto: ImportCompoundProductsDto, @UploadedFile() file: Express.Multer.File) {
    return this.service.importFromExcel(dto.mode, file);
  }

  @Get('import/template')
  @ApiOperation({ summary: 'Descargar plantilla de importación de conjuntos' })
  async downloadImportTemplate(
    @Query('mode') mode: ImportCompoundProductsDto['mode'],
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const selectedMode = mode ?? 'PRODUCTOS_COMPUESTOS';
    const buffer = this.service.buildImportTemplateBuffer(selectedMode);
    const filename =
      selectedMode === 'DETALLE_PRODUCTOS_COMPUESTOS' ? 'item_sets_individual.xlsx' : 'item_sets.xlsx';
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return new StreamableFile(buffer);
  }
}
