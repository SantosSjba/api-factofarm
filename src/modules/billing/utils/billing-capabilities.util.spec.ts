import { BillingProviderType } from '../../../generated/prisma/client';
import {
  assertSpecialDocumentSupported,
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

  it('APIsPERU emite CPE y baja; RC vía panel', () => {
    const caps = getBillingProviderCapabilities(BillingProviderType.APISPERU, 'production');
    expect(caps.supportsVoidDocument).toBe(true);
    expect(caps.supportsDailySummary).toBe(false);
    expect(caps.notes.join(' ')).toMatch(/Prerrequisito/i);
  });

  it('MOCK permitido como modo sin OSE (solo notas de venta)', () => {
    const caps = getBillingProviderCapabilities(BillingProviderType.MOCK, 'production');
    expect(caps.mockAllowed).toBe(true);
    expect(caps.supportedSpecialDocuments).toEqual([]);
    expect(caps.unsupportedSpecialDocuments).toHaveLength(4);
    expect(caps.notes.join(' ')).toMatch(/nota de venta/i);
  });

  it('MOCK en desarrollo permite especiales para QA', () => {
    const caps = getBillingProviderCapabilities(BillingProviderType.MOCK, 'development');
    expect(caps.supportedSpecialDocuments).toHaveLength(4);
    expect(caps.unsupportedSpecialDocuments).toEqual([]);
  });

  it('assertSpecialDocumentSupported lanza en Factiliza', () => {
    expect(() =>
      assertSpecialDocumentSupported(BillingProviderType.FACTILIZA, 'RETENCION'),
    ).toThrow(/Factiliza/);
  });

  it('assertSpecialDocumentSupported permite MOCK GR transportista fuera de producción', () => {
    expect(() =>
      assertSpecialDocumentSupported(
        BillingProviderType.MOCK,
        'GUIA_REMISION_TRANSPORTISTA',
        'development',
      ),
    ).not.toThrow();
  });
});
