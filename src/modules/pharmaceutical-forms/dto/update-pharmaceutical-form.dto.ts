import { PartialType } from '@nestjs/swagger';
import { CreatePharmaceuticalFormDto } from './create-pharmaceutical-form.dto';

export class UpdatePharmaceuticalFormDto extends PartialType(CreatePharmaceuticalFormDto) {}
