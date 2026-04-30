import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export const compoundProductImportModes = [
  'PRODUCTOS_COMPUESTOS',
  'DETALLE_PRODUCTOS_COMPUESTOS',
] as const;

export type CompoundProductImportMode = (typeof compoundProductImportModes)[number];

export class ImportCompoundProductsDto {
  @ApiProperty({ enum: compoundProductImportModes })
  @IsIn(compoundProductImportModes)
  mode!: CompoundProductImportMode;
}
