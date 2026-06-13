import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class EstablishmentListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['all', 'hospital', 'no-hospital'] })
  @IsOptional()
  @IsIn(['all', 'hospital', 'no-hospital'])
  hospital?: 'all' | 'hospital' | 'no-hospital';

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  tenantId?: string;
}
