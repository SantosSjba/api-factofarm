import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export const lotCodeSearchModes = ['INBOUND', 'OUTBOUND'] as const;
export type LotCodeSearchMode = (typeof lotCodeSearchModes)[number];

export class LotCodeSearchQueryDto {
  @IsUUID()
  productId!: string;

  @IsUUID()
  warehouseId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(lotCodeSearchModes)
  mode?: LotCodeSearchMode;
}
