import { SensitiveHealthCryptoService } from './sensitive-health-crypto.service';

describe('SensitiveHealthCryptoService', () => {
  it('queda deshabilitado sin clave LPDP', () => {
    const service = new SensitiveHealthCryptoService({
      get: () => undefined,
    } as never);
    expect(service.isEnabled()).toBe(false);
    expect(service.encrypt('dato')).toBeNull();
    expect(service.decrypt('cipher')).toBeNull();
  });

  it('cifra y descifra con clave configurada', () => {
    const service = new SensitiveHealthCryptoService({
      get: (key: string) =>
        key === 'LPDP_SENSITIVE_ENCRYPTION_KEY' ? 'clave-secreta-test-32chars!!' : undefined,
    } as never);
    expect(service.isEnabled()).toBe(true);
    const encrypted = service.encrypt('receta-123');
    expect(encrypted).toBeTruthy();
    expect(service.decrypt(encrypted)).toBe('receta-123');
  });

  it('genera hash determinístico', () => {
    const service = new SensitiveHealthCryptoService({ get: () => undefined } as never);
    const a = service.hashSignature('payload');
    const b = service.hashSignature('payload');
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });
});
