import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination.dto';

export class UserListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Código de rol o "all"' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Filtrar por cliente (solo plataforma)' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}
