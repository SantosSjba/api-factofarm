import {
  assertEmitDocumentTypeSupportedOrThrow,
  assertOseCredentialsOrThrow,
  assertOseOperationSupportedOrThrow,
  BillingProviderConfigurationError,
} from './billing-provider-guard.util';

describe('billing-provider-guard.util', () => {
  it('permite mock en desarrollo sin credenciales', () => {
    expect(() => assertOseCredentialsOrThrow('development', false, 'Factiliza')).not.toThrow();
  });

  it('rechaza emisión en producción sin credenciales', () => {
    expect(() => assertOseCredentialsOrThrow('production', false, 'Factiliza')).toThrow(
      BillingProviderConfigurationError,
    );
  });

  it('bloquea RC/baja Factiliza en producción', () => {
    expect(() =>
      assertOseOperationSupportedOrThrow(
        'production',
        'Factiliza',
        'Resumen diario de boletas (RC)',
        'Use Nubefact.',
      ),
    ).toThrow(/Resumen diario/);
  });

  it('bloquea tipos CPE no soportados en producción', () => {
    expect(() =>
      assertEmitDocumentTypeSupportedOrThrow('production', 'Factiliza', 'RETENCION'),
    ).toThrow(/RETENCION/);
  });
});
