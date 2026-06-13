import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { DeliveryChannel, DeliveryOrderStatus } from '../../../generated/prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class DeliveryOrderListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: DeliveryOrderStatus })
  @IsOptional()
  @IsEnum(DeliveryOrderStatus)
  estado?: DeliveryOrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateDeliveryOrderItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  productId!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  quantity!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  unitPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  notas?: string;
}

export class CreateDeliveryOrderDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  warehouseId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ enum: DeliveryChannel, default: DeliveryChannel.TELEFONO })
  @IsOptional()
  @IsEnum(DeliveryChannel)
  canal?: DeliveryChannel;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  clienteNombre!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  clienteTelefono!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  clienteEmail?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  direccionEntrega!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  referenciaDireccion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  distritoEntrega?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  costoDelivery?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notasCliente?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notasInternas?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  programadoPara?: string;

  @ApiProperty({ type: [CreateDeliveryOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateDeliveryOrderItemDto)
  items!: CreateDeliveryOrderItemDto[];
}

export class UpdateDeliveryOrderStatusDto {
  @ApiProperty({ enum: DeliveryOrderStatus })
  @IsEnum(DeliveryOrderStatus)
  estado!: DeliveryOrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancelReason?: string;
}

export class AssignDeliveryOrderDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Repartidor / responsable' })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}

export class PublicCreateDeliveryOrderDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  clienteNombre!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  clienteTelefono!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  clienteEmail?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  direccionEntrega!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  referenciaDireccion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  distritoEntrega?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notasCliente?: string;

  @ApiProperty({ type: [CreateDeliveryOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateDeliveryOrderItemDto)
  items!: CreateDeliveryOrderItemDto[];
}
