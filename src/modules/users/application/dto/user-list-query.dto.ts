import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination.dto';

export class UserListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['ADMINISTRADOR', 'VENDEDOR', 'all'] })
  @IsOptional()
  @IsIn(['ADMINISTRADOR', 'VENDEDOR', 'all'])
  role?: 'ADMINISTRADOR' | 'VENDEDOR' | 'all';
}
