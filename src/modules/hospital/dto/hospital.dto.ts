import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  HospitalAreaType,
  HospitalConsumptionStatus,
} from '../../../generated/prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class HospitalAreaListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateHospitalAreaDto {
  @ApiProperty()
  @IsString()
  @MaxLength(40)
  codigo!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  nombre!: string;

  @ApiProperty({ enum: HospitalAreaType })
  @IsEnum(HospitalAreaType)
  tipo!: HospitalAreaType;
}

class HospitalConsumptionItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  productId!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  cantidad!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  notas?: string;
}

export class CreateHospitalConsumptionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  warehouseId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  hospitalAreaId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comentario?: string;

  @ApiProperty({ type: [HospitalConsumptionItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HospitalConsumptionItemDto)
  items!: HospitalConsumptionItemDto[];
}

export class HospitalConsumptionListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: HospitalConsumptionStatus })
  @IsOptional()
  @IsEnum(HospitalConsumptionStatus)
  estado?: HospitalConsumptionStatus;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  hospitalAreaId?: string;
}
