import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, IsUrl, IsUUID, MaxLength } from 'class-validator';

export class CreateEstablishmentDto {
  @ApiProperty({ example: 'Oficina Principal', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  nombre!: string;

  @ApiPropertyOptional({ example: '0000', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  codigo?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @ApiPropertyOptional({ example: 'PERU', maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  pais?: string;

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

  @ApiPropertyOptional({ maxLength: 250 })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  direccionFiscal?: string;

  @ApiPropertyOptional({ maxLength: 250 })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  direccionComercial?: string;

  @ApiPropertyOptional({ maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsEmail()
  correoContacto?: string;

  @ApiPropertyOptional({ example: 'https://empresa.pe' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(250)
  direccionWeb?: string;

  @ApiPropertyOptional({ maxLength: 250 })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  informacionAdicional?: string;

  @ApiPropertyOptional({ maxLength: 250 })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  urlImpresora?: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  nombreImpresora?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  clienteDefault?: string;

  @ApiPropertyOptional({ description: 'Id del archivo/logo subido (módulo files)' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  logoArchivoId?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  sujetoIgv31556?: boolean;

  @ApiPropertyOptional({ default: false, description: 'Modo hospital/microred' })
  @IsOptional()
  @IsBoolean()
  esHospital?: boolean;
}
