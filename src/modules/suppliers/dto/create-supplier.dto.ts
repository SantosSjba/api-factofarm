import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { CustomerDocumentType } from '../../../generated/prisma/client';
import { IsPeruDocument } from '../../../common/validators/is-peru-document.decorator';

export class CreateSupplierDto {
  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MaxLength(300)
  razonSocial!: string;

  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  nombreComercial?: string;

  @ApiProperty({ enum: CustomerDocumentType, default: CustomerDocumentType.RUC })
  @IsEnum(CustomerDocumentType)
  tipoDocumento!: CustomerDocumentType;

  @ApiProperty()
  @IsString()
  @MaxLength(20)
  @IsPeruDocument()
  numeroDocumento!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  provinceId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  districtId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  direccion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  correoElectronico?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  contactoNombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactoTelefono?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  diasCredito?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  condicionesPago?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observaciones?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  habilitado?: boolean;
}
