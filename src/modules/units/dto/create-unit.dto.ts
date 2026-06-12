import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateUnitDto {
  @ApiProperty({ example: 'NIU', maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  codigo!: string;

  @ApiProperty({ example: 'UNIDAD', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nombre!: string;
}
