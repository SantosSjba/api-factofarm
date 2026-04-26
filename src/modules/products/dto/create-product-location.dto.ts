import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateProductLocationDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  establishmentId!: string;

  @ApiProperty({ maxLength: 120 })
  @IsString()
  @MaxLength(120)
  nombre!: string;
}
