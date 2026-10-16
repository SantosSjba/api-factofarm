import { Prisma } from '../../generated/prisma/client';
import { mapPrismaError, translateHttpMessage } from './prisma-error.mapper';

const known = (code: string, meta?: Record<string, unknown>) =>
  new Prisma.PrismaClientKnownRequestError('x', {
    code,
    clientVersion: 'test',
    meta,
  });

describe('mapPrismaError', () => {
  it('duplicado → 409 con campos visibles', () => {
    const r = mapPrismaError(
      known('P2002', { target: ['tenantId', 'codigoBarras'] }),
      'POST',
    );
    expect(r?.status).toBe(409);
    expect(r?.message).toBe(
      'Ya existe un registro con el mismo valor en: codigo barras.',
    );
  });

  it('duplicado con driver adapter', () => {
    const r = mapPrismaError(
      known('P2002', {
        driverAdapterError: { cause: { constraint: { fields: ['"ruc"'] } } },
      }),
      'POST',
    );
    expect(r?.message).toContain('ruc');
  });

  it('FK al eliminar explica que está en uso', () => {
    const r = mapPrismaError(known('P2003'), 'DELETE');
    expect(r?.status).toBe(409);
    expect(r?.message).toMatch(/No se puede eliminar/);
  });

  it('no encontrado → 404', () => {
    expect(mapPrismaError(known('P2025'), 'PATCH')?.status).toBe(404);
  });

  it('ignora errores ajenos a Prisma', () => {
    expect(mapPrismaError(new Error('x'), 'GET')).toBeNull();
  });
});

describe('translateHttpMessage', () => {
  it('traduce mensajes por defecto de Nest', () => {
    expect(translateHttpMessage('Forbidden resource')).toMatch(/permisos/);
    expect(
      translateHttpMessage('ThrottlerException: Too Many Requests'),
    ).toMatch(/Demasiadas/);
    expect(translateHttpMessage('Mensaje propio')).toBe('Mensaje propio');
  });
});
