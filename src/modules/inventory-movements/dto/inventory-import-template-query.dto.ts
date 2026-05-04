import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export const inventoryImportTemplateModes = ['LOTES', 'SERIES'] as const;
export type InventoryImportTemplateMode = (typeof inventoryImportTemplateModes)[number];

export class InventoryImportTemplateQueryDto {
  @ApiPropertyOptional({ enum: inventoryImportTemplateModes })
  @IsOptional()
  @IsIn(inventoryImportTemplateModes)
  mode?: InventoryImportTemplateMode;
}
