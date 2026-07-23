import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, ValidateIf } from 'class-validator';

/** Actualización del perfil comercial/fiscal del establecimiento activo. */
export class UpdatePharmacyProfileDto {
  @ApiPropertyOptional({ description: 'Nombre comercial del local' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  codigo?: string;

  @ApiPropertyOptional({ description: 'RUC emisor SUNAT (11 dígitos)' })
  @IsOptional()
  @IsString()
  @MaxLength(11)
  rucEmisor?: string;

  @ApiPropertyOptional({ description: 'Razón social del emisor' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  razonSocialEmisor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  direccionFiscal?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  direccionComercial?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  telefono?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  correoContacto?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  direccionWeb?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  informacionAdicional?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  departmentId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  provinceId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  districtId?: string | null;

  @ApiPropertyOptional({
    description: 'Id de archivo (POST /files/upload). `null` quita el logo.',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUUID()
  logoArchivoId?: string | null;

  @ApiPropertyOptional({ description: 'Número de registro DIGEMID del establecimiento' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  numeroRegistroDigemid?: string | null;
}
