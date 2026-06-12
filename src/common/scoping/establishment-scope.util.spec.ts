import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '../../generated/prisma/client';
import {
  assertEstablishmentAccess,
  establishmentWhere,
  resolveEstablishmentScope,
} from './establishment-scope.util';

describe('establishment-scope', () => {
  const actor = {
    establecimientoId: 'est-1',
    role: UserRole.VENDEDOR,
  };

  it('usa establecimiento del actor por defecto', () => {
    expect(resolveEstablishmentScope(actor)).toBe('est-1');
  });

  it('bloquea acceso cross-sucursal para no admin', () => {
    expect(() => resolveEstablishmentScope(actor, 'est-2')).toThrow(ForbiddenException);
  });

  it('permite admin consultar otra sucursal', () => {
    expect(
      resolveEstablishmentScope({ ...actor, role: UserRole.ADMINISTRADOR }, 'est-2'),
    ).toBe('est-2');
  });

  it('establishmentWhere genera filtro prisma', () => {
    expect(establishmentWhere(actor)).toEqual({ establishmentId: 'est-1' });
  });

  it('assertEstablishmentAccess bloquea recurso de otra sucursal', () => {
    expect(() => assertEstablishmentAccess(actor, 'est-2')).toThrow(ForbiddenException);
  });

  it('assertEstablishmentAccess permite admin en cualquier sucursal', () => {
    expect(() =>
      assertEstablishmentAccess({ ...actor, role: UserRole.ADMINISTRADOR }, 'est-2'),
    ).not.toThrow();
  });
});
