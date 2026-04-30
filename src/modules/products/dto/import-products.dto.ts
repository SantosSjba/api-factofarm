import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export const productImportModes = ['PRODUCTOS', 'L_PRECIOS', 'ACTUALIZAR_PRECIOS'] as const;

export type ProductImportMode = (typeof productImportModes)[number];

export class ImportProductsDto {
  @ApiProperty({ enum: productImportModes })
  @IsIn(productImportModes)
  mode!: ProductImportMode;
}
