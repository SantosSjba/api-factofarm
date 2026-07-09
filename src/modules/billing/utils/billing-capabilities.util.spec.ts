import { BillingProviderType } from '../../../generated/prisma/client';
import {
  getBillingProviderCapabilities,
  type BillingSpecialDocumentType,
} from './billing-capabilities.util';

describe('billing-capabilities.util', () => {
  it('Factiliza no soporta RC ni baja', () => {
    const caps = getBillingProviderCapabilities(BillingProviderType.FACTILIZA, 'production');
    expect(caps.supportsDailySummary).toBe(false);
    expect(caps.supportsVoidDocument).toBe(false);
    expect(caps.unsupportedSpecialDocuments).toHaveLength(4);
  });

  it('Nubefact soporta RC, baja y especiales', () => {
    const caps = getBillingProviderCapabilities(BillingProviderType.NUBEFACT, 'production');
    expect(caps.supportsDailySummary).toBe(true);
    expect(caps.supportsVoidDocument).toBe(true);
    expect(caps.supportedSpecialDocuments).toEqual([
      'RETENCION',
      'PERCEPCION',
      'LIQUIDACION_COMPRA',
      'GUIA_REMISION_TRANSPORTISTA',
    ] satisfies BillingSpecialDocumentType[]);
  });

  it('MOCK no permitido en producción según nota', () => {
    const caps = getBillingProviderCapabilities(BillingProviderType.MOCK, 'production');
    expect(caps.mockAllowed).toBe(false);
  });
});
