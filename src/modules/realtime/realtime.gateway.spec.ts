import { RealtimeGateway } from './realtime.gateway';
import { UserRole } from '../../generated/prisma/client';

describe('Sesiones de tiempo real', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });
  function setup() {
    const payload = { sub: 'u', email: 'qa@example.invalid', role: UserRole.CAJERO, tenantId: 't', establecimientoId: 'e', permissionCodes: [], exp: Math.floor(Date.now() / 1000) + 60 };
    const sessions = { validateSession: jest.fn().mockResolvedValue(payload) };
    const gateway = new RealtimeGateway({ verify: () => payload } as never, { getOrThrow: () => 'key' } as never, {} as never, {} as never, sessions as never);
    const client = { handshake: { auth: { token: 'token' } }, join: jest.fn(), on: jest.fn(), once: jest.fn(), data: {}, disconnect: jest.fn() };
    return { gateway, client, sessions };
  }
  it('no entra a salas si el usuario o cliente fue revocado', async () => {
    const { gateway, client, sessions } = setup(); sessions.validateSession.mockRejectedValue(new Error('revoked'));
    await gateway.handleConnection(client as never);
    expect(client.disconnect).toHaveBeenCalledWith(true);
    expect(client.join).not.toHaveBeenCalled();
  });
  it('desconecta al vencer el token', async () => {
    const { gateway, client } = setup(); await gateway.handleConnection(client as never);
    expect(client.join).toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(60000);
    expect(client.disconnect).toHaveBeenCalledWith(true);
  });
  it('vuelve a comprobar revocaciones durante una conexión abierta', async () => {
    const { gateway, client, sessions } = setup(); await gateway.handleConnection(client as never);
    sessions.validateSession.mockRejectedValue(new Error('suspended'));
    await jest.advanceTimersByTimeAsync(15000);
    expect(client.disconnect).toHaveBeenCalledWith(true);
  });
});
