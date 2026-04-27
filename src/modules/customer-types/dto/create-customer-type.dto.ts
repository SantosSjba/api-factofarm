import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCustomerTypeDto {
  @ApiProperty({ example: 'INTERNO', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  descripcion!: string;
}
