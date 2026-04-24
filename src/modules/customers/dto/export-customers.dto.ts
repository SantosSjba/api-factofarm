import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class ExportCustomersDto {
  @ApiPropertyOptional({ description: 'all|month|between-months|seller' })
  @IsOptional()
  @IsIn(['all', 'month', 'between-months', 'seller'])
  period?: 'all' | 'month' | 'between-months' | 'seller';

  @ApiPropertyOptional({ example: '04/2026' })
  @IsOptional()
  @IsString()
  month?: string;

  @ApiPropertyOptional({ example: '01/2026' })
  @IsOptional()
  @IsString()
  fromMonth?: string;

  @ApiPropertyOptional({ example: '04/2026' })
  @IsOptional()
  @IsString()
  toMonth?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sellerId?: string;
}
