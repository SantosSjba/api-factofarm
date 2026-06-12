import { decryptBillingSecret, encryptBillingSecret } from './billing-crypto.util';

describe('billing-crypto', () => {
  const secret = 'test-billing-secret-key-with-enough-length';

  it('cifra y descifra un token API', () => {
    const plain = 'sunat-token-12345';
    const encrypted = encryptBillingSecret(plain, secret);
    expect(encrypted).not.toContain(plain);
    expect(decryptBillingSecret(encrypted, secret)).toBe(plain);
  });

  it('falla al descifrar con clave incorrecta', () => {
    const encrypted = encryptBillingSecret('x', secret);
    expect(() => decryptBillingSecret(encrypted, 'wrong-key-wrong-key-wrong-key!!')).toThrow();
  });
});
