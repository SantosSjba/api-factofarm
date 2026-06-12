import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class SupplierListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['all', 'razonSocial', 'numeroDocumento'] })
  @IsOptional()
  @IsIn(['all', 'razonSocial', 'numeroDocumento'])
  field?: 'all' | 'razonSocial' | 'numeroDocumento';
}
