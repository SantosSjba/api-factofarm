import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class UpdateCustomerTagsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  etiquetas!: string[];
}
