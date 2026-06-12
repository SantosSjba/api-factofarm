import { Injectable } from '@nestjs/common';
import type { JwtRequestUser } from '../../modules/auth/domain/auth.types';
import {
  assertEstablishmentAccess,
  establishmentWhere,
  resolveEstablishmentScope,
  type ScopeActor,
} from './establishment-scope.util';

@Injectable()
export class EstablishmentScopeService {
  toActor(user: JwtRequestUser): ScopeActor {
    return { establecimientoId: user.establecimientoId, role: user.role };
  }

  resolve(user: JwtRequestUser, requestedEstablishmentId?: string | null): string {
    return resolveEstablishmentScope(this.toActor(user), requestedEstablishmentId);
  }

  where(user: JwtRequestUser, field = 'establishmentId') {
    return establishmentWhere(this.toActor(user), field);
  }

  assertAccess(user: JwtRequestUser, resourceEstablishmentId: string): void {
    assertEstablishmentAccess(this.toActor(user), resourceEstablishmentId);
  }
}
