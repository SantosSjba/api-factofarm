import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'FERTILIZANTES', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nombre!: string;
}
