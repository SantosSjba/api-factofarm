import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService (integration-ish)', () => {
  const prisma = {
    user: { findFirst: jest.fn() },
    refreshToken: { findUnique: jest.fn() },
  };
  const jwtService = { sign: jest.fn().mockReturnValue('token') };
  const config = { get: jest.fn(), getOrThrow: jest.fn().mockReturnValue('secret') };
  const loginAttempts = {
    assertNotLocked: jest.fn(),
    recordAttempt: jest.fn(),
  };
  const email = { send: jest.fn() };
  const audit = { log: jest.fn() };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      prisma as never,
      jwtService as never,
      config as never,
      loginAttempts as never,
      email as never,
      audit as never,
    );
  });

  it('login rechaza credenciales inválidas y audita LOGIN_FAILED', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(service.login('admin@test.com', 'wrong')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'LOGIN_FAILED', entity: 'Auth' }),
    );
  });

  it('login exitoso audita LOGIN_SUCCESS', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'u1',
      email: 'admin@test.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuv', // bcrypt mock handled below
      nombre: 'Admin',
      role: 'ADMIN',
      establecimientoId: 'e1',
      permissions: [{ permission: { code: 'users.read' } }],
    });

    jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(true);
    jest.spyOn(service as never, 'issueTokens').mockResolvedValue({
      accessToken: 'a',
      refreshToken: 'r',
      user: {} as never,
    });

    await service.login('admin@test.com', 'Admin123!');

    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'LOGIN_SUCCESS', userId: 'u1' }),
    );
  });
});
