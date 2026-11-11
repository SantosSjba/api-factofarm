import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PurchaseOrderStatus } from '../../../generated/prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class PurchaseOrderListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiPropertyOptional({ enum: PurchaseOrderStatus })
  @IsOptional()
  @IsEnum(PurchaseOrderStatus)
  estado?: PurchaseOrderStatus;

  @ApiPropertyOptional({ description: 'Número de orden, razón social o RUC del proveedor' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

export class AccountPayableListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiPropertyOptional({ description: 'PENDIENTE, PARCIAL, VENCIDA, PAGADA, ANULADA o ABIERTA (por pagar)' })
  @IsOptional()
  @IsString()
  estado?: string;

  @ApiPropertyOptional({ description: 'Proveedor (razón social o RUC) o número de documento' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}

export class ReplenishmentReportQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  warehouseId?: string;
}

export class PriceComparisonQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  productId?: string;
}
