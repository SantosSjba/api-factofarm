import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'FERTILIZANTES', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nombre!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Categoría padre (subcategoría)' })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
