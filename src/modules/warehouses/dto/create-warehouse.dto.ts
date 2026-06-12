import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateWarehouseDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  establishmentId!: string;

  @ApiProperty()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @MaxLength(120)
  nombre!: string;
}
