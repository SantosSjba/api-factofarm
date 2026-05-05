import { PartialType } from '@nestjs/swagger';
import { CreateCustomerZoneDto } from './create-customer-zone.dto';

export class UpdateCustomerZoneDto extends PartialType(CreateCustomerZoneDto) {}
