import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { PaymentMethod, SaleDocumentType, SaleStatus } from '../../../generated/prisma/client';

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

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMetodo?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Buscar por código / N° operación del pago' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  paymentReferencia?: string;
}
