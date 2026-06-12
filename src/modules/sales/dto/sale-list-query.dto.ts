import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { SaleDocumentType, SaleStatus } from '../../../generated/prisma/client';

export class SaleListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sellerId?: string;

  @ApiPropertyOptional({ enum: SaleStatus })
  @IsOptional()
  @IsEnum(SaleStatus)
  estado?: SaleStatus;

  @ApiPropertyOptional({ enum: SaleDocumentType })
  @IsOptional()
  @IsEnum(SaleDocumentType)
  documentType?: SaleDocumentType;

  @ApiPropertyOptional()
  @IsOptional()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  to?: string;
}
