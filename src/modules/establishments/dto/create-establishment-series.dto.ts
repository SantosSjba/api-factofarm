import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentSeriesType } from '../../../generated/prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateEstablishmentSeriesDto {
  @ApiProperty({ enum: DocumentSeriesType })
  @IsEnum(DocumentSeriesType)
  documentType!: DocumentSeriesType;

  @ApiProperty({
    example: 'F001',
    description: 'Código de serie para el tipo documentario',
  })
  @IsString()
  @MaxLength(20)
  @Matches(/^[A-Z0-9-]+$/, {
    message: 'El número de serie solo acepta letras mayúsculas, números y guion.',
  })
  numero!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  esContingencia?: boolean;
}
