import { PartialType } from '@nestjs/swagger';
import { CreateActivePrincipleDto } from './create-active-principle.dto';

export class UpdateActivePrincipleDto extends PartialType(
  CreateActivePrincipleDto,
) {}
