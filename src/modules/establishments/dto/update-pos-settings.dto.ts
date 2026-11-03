import { PickType } from '@nestjs/swagger';
import { UpdateEstablishmentDto } from './update-establishment.dto';

/** Validaciones del POS que el local puede activar o desactivar. */
export class UpdatePosSettingsDto extends PickType(UpdateEstablishmentDto, [
  'posRequirePrescription',
  'posRequireControlledApproval',
  'posPaymentReferenceMethods',
] as const) {}
