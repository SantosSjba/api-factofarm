import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class SetProductEquivalentsDto {
  @ApiProperty({ type: [String], description: 'IDs de productos bioequivalentes / genéricos relacionados' })
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  equivalentProductIds!: string[];
}
