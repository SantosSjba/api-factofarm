import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TenantPlan } from '../../../generated/prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ example: 'Botica San Martín' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  nombre!: string;

  @ApiPropertyOptional({ example: '20123456789' })
  @IsOptional()
  @IsString()
  @MaxLength(11)
  ruc?: string;

  @ApiPropertyOptional({ enum: TenantPlan, default: TenantPlan.BOTICA })
  @IsOptional()
  @IsEnum(TenantPlan)
  plan?: TenantPlan;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxEstablishments?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsers?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class UpdateTenantDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  nombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(11)
  ruc?: string;

  @ApiPropertyOptional({ enum: TenantPlan })
  @IsOptional()
  @IsEnum(TenantPlan)
  plan?: TenantPlan;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxEstablishments?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsers?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  enabledModules?: string[];

  @ApiPropertyOptional({ description: 'Aplicar límites y módulos del plan seleccionado' })
  @IsOptional()
  @IsBoolean()
  applyPlanDefaults?: boolean;
}

export class TenantListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  plan?: string;

  @ApiPropertyOptional()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  pageSize?: number;
}

export class ProvisionTenantDto {
  @ApiProperty({ example: 'Botica Central' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  establishmentNombre!: string;

  @ApiPropertyOptional({ example: '0001' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  establishmentCodigo?: string;

  @ApiProperty({ example: 'María García' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  adminNombre!: string;

  @ApiProperty({ example: 'admin@botica.com' })
  @IsEmail()
  adminEmail!: string;

  @ApiProperty({ example: 'Admin123!' })
  @IsString()
  @MinLength(8)
  adminPassword!: string;
}

export class UpdateTenantLeadDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: TenantPlan })
  @IsOptional()
  @IsEnum(TenantPlan)
  planInterest?: TenantPlan;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class ConvertTenantLeadDto extends CreateTenantDto {
  @ApiProperty({ example: 'Botica Central' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  establishmentNombre!: string;

  @ApiPropertyOptional({ example: '0001' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  establishmentCodigo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(8)
  adminPassword?: string;
}
