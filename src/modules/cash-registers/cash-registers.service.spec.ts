import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  CashSessionStatus,
  Prisma,
  UserRole,
} from '../../generated/prisma/client';
import { expandUserPermissionCodes } from '../../common/permissions/nav-permission-expansion';
import { getDefaultNavCodesForRole } from '../../common/permissions/role-permission-templates';
import {
  canForceCloseCashSessions,
  canReadAllCashSessions,
  type CashActor,
} from './cash-access.util';
import { CashRegistersService } from './cash-registers.service';
import { CashSessionsHistoryService } from './cash-sessions-history.service';

const EST = 'est-1';
const TENANT = 'tenant-1';

function actor(overrides: Partial<CashActor> = {}): CashActor {
  return {
    userId: 'cajero-1',
    role: UserRole.CAJERO,
    permissionCodes: ['nav.punto_venta', 'nav.caja_chica_pos', 'cash.open'],
    tenantId: TENANT,
    establishmentId: EST,
    ...overrides,
  };
}

function openSessionRow(userId = 'cajero-1') {
  return {
    id: 'sess-1',
    estado: CashSessionStatus.ABIERTA,
    userId,
    openedAt: new Date('2026-10-15T12:36:35Z'),
    user: { nombre: 'Esmeralda' },
    cashRegister: {
      nombre: 'Caja principal · 0000',
      establishment: { id: EST, tenantId: TENANT },
    },
  };
}

function setup(session: unknown = openSessionRow(), expectedCash = 100) {
  const tx = {
    cashSession: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    cashMovement: { create: jest.fn().mockResolvedValue({}) },
  };
  const prisma = {
    cashSession: { findFirst: jest.fn().mockResolvedValue(session) },
    cashMovement: {
      aggregate: jest.fn().mockResolvedValue({
        _sum: { monto: new Prisma.Decimal(expectedCash) },
      }),
    },
    $transaction: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)),
  };
  const audit = { log: jest.fn().mockResolvedValue(undefined) };
  const service = new CashRegistersService(prisma as never, audit as never);
  return { service, prisma, tx, audit };
}

describe('Gestión de cajas · cierre', () => {
  it('el cajero cierra su propia caja con arqueo cuadrado', async () => {
    const { service, tx, audit } = setup();
    const res = await service.closeSession('sess-1', actor(), {
      montoCierreFisico: 100,
    });
    expect(res.cierreForzado).toBe(false);
    expect(res.diferenciaArqueo).toBe('0');
    expect(tx.cashSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estado: CashSessionStatus.CERRADA,
          closedById: 'cajero-1',
          cierreForzado: false,
          motivoCierreForzado: null,
        }) as unknown,
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CLOSE', entityId: 'sess-1' }),
    );
  });

  it('exige observaciones cuando el arqueo tiene diferencia', async () => {
    const { service, tx } = setup();
    await expect(
      service.closeSession('sess-1', actor(), { montoCierreFisico: 90 }),
    ).rejects.toThrow(/diferencia de S\/ -10.00/);
    expect(tx.cashSession.updateMany).not.toHaveBeenCalled();
  });

  it('un cajero no puede cerrar la caja que abrió otro usuario', async () => {
    const { service, tx } = setup(openSessionRow('otro-usuario'));
    await expect(
      service.closeSession('sess-1', actor(), { montoCierreFisico: 100 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(tx.cashSession.updateMany).not.toHaveBeenCalled();
  });

  it('el cierre forzado exige motivo', async () => {
    const { service } = setup(openSessionRow('otro-usuario'));
    await expect(
      service.closeSession(
        'sess-1',
        actor({ userId: 'gerente', role: UserRole.GERENTE_SUCURSAL }),
        { montoCierreFisico: 100 },
      ),
    ).rejects.toThrow(/motivo del cierre forzado/);
  });

  it('el gerente cierra (forzado) la caja de otro usuario y queda registrado', async () => {
    const { service, tx, audit } = setup(openSessionRow('otro-usuario'));
    const res = await service.closeSession(
      'sess-1',
      actor({ userId: 'gerente', role: UserRole.GERENTE_SUCURSAL }),
      {
        montoCierreFisico: 95,
        notasCierre: 'Faltan 5 soles',
        motivoCierreForzado: 'Cajera no cerró el turno del 15/10',
      },
    );
    expect(res.cierreForzado).toBe(true);
    expect(res.diferenciaArqueo).toBe('-5');
    expect(tx.cashSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          closedById: 'gerente',
          cierreForzado: true,
          motivoCierreForzado: 'Cajera no cerró el turno del 15/10',
        }) as unknown,
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'FORCE_CLOSE',
        userId: 'gerente',
        diff: expect.objectContaining({ cajeroId: 'otro-usuario' }) as unknown,
      }),
    );
  });

  it('un usuario con cash.close.force (vía nav.historial_cajas) puede forzar el cierre', async () => {
    const codes = expandUserPermissionCodes(
      ['nav.historial_cajas'],
      UserRole.FARMACEUTICO_TITULAR,
    );
    const { service } = setup(openSessionRow('otro-usuario'));
    await expect(
      service.closeSession(
        'sess-1',
        actor({
          userId: 'titular',
          role: UserRole.FARMACEUTICO_TITULAR,
          permissionCodes: codes,
        }),
        { montoCierreFisico: 100, motivoCierreForzado: 'Fin de turno' },
      ),
    ).resolves.toMatchObject({ cierreForzado: true });
  });

  it('no cierra sesiones de otra sucursal sin alcance de cadena', async () => {
    const { service } = setup({
      ...openSessionRow('otro-usuario'),
      cashRegister: {
        nombre: 'Caja B',
        establishment: { id: 'est-2', tenantId: TENANT },
      },
    });
    await expect(
      service.closeSession(
        'sess-1',
        actor({ userId: 'gerente', role: UserRole.GERENTE_SUCURSAL }),
        { montoCierreFisico: 100, motivoCierreForzado: 'x' },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rechaza cerrar una sesión ya cerrada', async () => {
    const { service } = setup({
      ...openSessionRow(),
      estado: CashSessionStatus.CERRADA,
    });
    await expect(
      service.closeSession('sess-1', actor(), { montoCierreFisico: 100 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('Gestión de cajas · apertura', () => {
  it('explica quién tiene abierta la caja cuando está ocupada', async () => {
    const prisma = {
      cashRegister: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ id: 'reg-1', nombre: 'Caja principal · 0000' }),
      },
      establishment: {
        findUnique: jest.fn().mockResolvedValue({ timeZone: 'America/Lima' }),
      },
      cashSession: {
        findFirst: jest
          .fn()
          // sesión propia: ninguna
          .mockResolvedValueOnce(null)
          // sesión en la caja: de otro usuario
          .mockResolvedValueOnce({
            openedAt: new Date('2026-10-15T12:36:35Z'),
            user: { nombre: 'Esmeralda' },
          }),
        create: jest.fn(),
      },
    };
    const service = new CashRegistersService(
      prisma as never,
      {
        log: jest.fn(),
      } as never,
    );
    await expect(
      service.openSession(EST, 'admin', { cashRegisterId: 'reg-1' }),
    ).rejects.toThrow(/abierta por Esmeralda.*cierre forzado/);
    expect(prisma.cashSession.create).not.toHaveBeenCalled();
  });
});

describe('Gestión de cajas · permisos', () => {
  it('solo cadena, gerente o permiso específico pueden forzar cierres', () => {
    expect(canForceCloseCashSessions(actor())).toBe(false);
    expect(
      canForceCloseCashSessions(actor({ role: UserRole.FARMACEUTICO })),
    ).toBe(false);
    expect(
      canForceCloseCashSessions(actor({ role: UserRole.GERENTE_SUCURSAL })),
    ).toBe(true);
    expect(
      canForceCloseCashSessions(actor({ role: UserRole.ADMINISTRADOR })),
    ).toBe(true);
    expect(
      canForceCloseCashSessions(
        actor({ permissionCodes: ['cash.close.force'] }),
      ),
    ).toBe(true);
    expect(canReadAllCashSessions(actor())).toBe(false);
  });

  it('nav.historial_cajas está en la plantilla del gerente y no en la del cajero', () => {
    expect(getDefaultNavCodesForRole(UserRole.GERENTE_SUCURSAL)).toContain(
      'nav.historial_cajas',
    );
    expect(getDefaultNavCodesForRole(UserRole.CAJERO)).not.toContain(
      'nav.historial_cajas',
    );
  });
});

type WhereArg = { where: { AND: unknown[] } };
function whereOf(mock: jest.Mock): { AND: unknown[] } {
  const calls = mock.mock.calls as WhereArg[][];
  return calls[0][0].where;
}

describe('Gestión de cajas · historial', () => {
  function historySetup() {
    const prisma = {
      establishment: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ nombre: 'Principal', tenantId: TENANT }),
        findUnique: jest.fn().mockResolvedValue({ timeZone: 'America/Lima' }),
      },
      cashSession: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
        aggregate: jest
          .fn()
          .mockResolvedValue({ _sum: { diferenciaArqueo: null } }),
      },
      sale: { groupBy: jest.fn().mockResolvedValue([]) },
      cashMovement: { groupBy: jest.fn().mockResolvedValue([]) },
    };
    const service = new CashSessionsHistoryService(
      prisma as never,
      {} as never,
      {} as never,
    );
    return { service, prisma };
  }

  it('un cajero solo ve sus propias sesiones aunque filtre por otro usuario', async () => {
    const { service, prisma } = historySetup();
    await service.list(actor(), { userId: 'otro-usuario' });
    const where = whereOf(prisma.cashSession.count);
    expect(where.AND).toEqual(expect.arrayContaining([{ userId: 'cajero-1' }]));
    expect(where.AND).not.toEqual(
      expect.arrayContaining([{ userId: 'otro-usuario' }]),
    );
  });

  it('un supervisor filtra por cajero, estado, diferencia y rango de fechas', async () => {
    const { service, prisma } = historySetup();
    await service.list(actor({ role: UserRole.GERENTE_SUCURSAL }), {
      userId: 'otro-usuario',
      estado: CashSessionStatus.CERRADA,
      diferencia: 'FALTANTE',
      from: '2026-10-01',
      to: '2026-10-17',
    } as never);
    const where = whereOf(prisma.cashSession.count);
    expect(where.AND).toEqual(
      expect.arrayContaining([
        { userId: 'otro-usuario' },
        { estado: CashSessionStatus.CERRADA },
        { diferenciaArqueo: { lt: 0 } },
        {
          openedAt: {
            gte: new Date('2026-10-01T05:00:00.000Z'),
            lt: new Date('2026-10-18T05:00:00.000Z'),
          },
        },
      ]),
    );
  });

  it('solo roles de cadena consultan todas las sucursales', async () => {
    const { service } = historySetup();
    await expect(
      service.list(actor({ role: UserRole.GERENTE_SUCURSAL }), {
        establishmentId: 'ALL',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.list(actor({ role: UserRole.ADMIN_CADENA }), {
        establishmentId: 'ALL',
      }),
    ).resolves.toMatchObject({ total: 0 });
  });
});
