import { BillingProviderType } from '../../../generated/prisma/client';
import {
  canEmitElectronicDocuments,
  hasRealOseConfigured,
} from './ose-config.util';

describe('ose-config.util', () => {
  it('hasRealOseConfigured exige proveedor real + token', () => {
    expect(hasRealOseConfigured(null)).toBe(false);
    expect(hasRealOseConfigured({ provider: BillingProviderType.MOCK })).toBe(
      false,
    );
    expect(
      hasRealOseConfigured({
        provider: BillingProviderType.FACTILIZA,
        apiTokenEncrypted: 'x',
      }),
    ).toBe(true);
  });

  it('canEmitElectronicDocuments permite MOCK fuera de producción', () => {
    expect(
      canEmitElectronicDocuments(
        { provider: BillingProviderType.MOCK },
        'development',
      ),
    ).toBe(true);
    expect(canEmitElectronicDocuments(null, 'development')).toBe(true);
    expect(
      canEmitElectronicDocuments(
        { provider: BillingProviderType.MOCK },
        'production',
      ),
    ).toBe(false);
  });
});
