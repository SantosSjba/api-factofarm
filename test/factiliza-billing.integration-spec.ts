/**
 * Pruebas de integración contra sandbox Factiliza.
 * Ejecutar solo con credenciales reales:
 *   FACTILIZA_INTEGRATION_TOKEN=... FACTILIZA_INTEGRATION_RUC=... pnpm test -- factiliza-billing.integration
 */
import { ConfigService } from '@nestjs/config';
import { BillingProviderType } from '../src/generated/prisma/client';
import { FactilizaBillingProvider } from '../src/modules/billing/providers/factiliza-billing.provider';
import { MockBillingProvider } from '../src/modules/billing/providers/mock-billing.provider';
import { getBillingProviderCapabilities } from '../src/modules/billing/utils/billing-capabilities.util';

const token = process.env.FACTILIZA_INTEGRATION_TOKEN?.trim();
const ruc = process.env.FACTILIZA_INTEGRATION_RUC?.trim() ?? '20100066603';
const describeIntegration = token ? describe : describe.skip;

describeIntegration('Factiliza billing integration (sandbox)', () => {
  const mock = new MockBillingProvider();
  const config = {
    get: (key: string) => (key === 'NODE_ENV' ? 'test' : undefined),
  } as ConfigService;
  const provider = new FactilizaBillingProvider(mock, config);

  beforeAll(() => {
    provider.setCredentials('https://apife-qa.factiliza.com/api/v1', token!);
  });

  it('emite boleta de prueba', async () => {
    const result = await provider.emit({
      documentId: 'integration-test-boleta',
      documentType: 'BOLETA',
      serie: 'B001',
      numero: String(Date.now()).slice(-8),
      fechaEmision: new Date().toISOString(),
      moneda: 'PEN',
      esContingencia: false,
      emisor: { ruc, razonSocial: 'BOTICA INTEGRACION TEST' },
      receptor: { tipoDoc: '1', numeroDoc: '00000001', nombre: 'CLIENTE PRUEBA' },
      subtotal: '8.47',
      igvTotal: '1.53',
      total: '10.00',
      ublXml: '<Invoice/>',
      lines: [
        {
          descripcion: 'PRODUCTO PRUEBA',
          cantidad: '1',
          precioUnitario: '10.00',
          subtotalLinea: '8.47',
          igvLinea: '1.53',
          totalLinea: '10.00',
          taxAffectationCodigo: '10',
          unidadMedida: 'NIU',
        },
      ],
    });
    expect(['ACEPTADO', 'OBSERVADO']).toContain(result.sunatStatus);
    expect(result.externalId).toBeTruthy();
  }, 60_000);
});

describe('Factiliza capabilities contract', () => {
  it('documenta limitaciones RC/baja/especiales', () => {
    const caps = getBillingProviderCapabilities(BillingProviderType.FACTILIZA, 'production');
    expect(caps.supportsDailySummary).toBe(false);
    expect(caps.unsupportedSpecialDocuments.map((row) => row.documentType)).toEqual([
      'RETENCION',
      'PERCEPCION',
      'LIQUIDACION_COMPRA',
      'GUIA_REMISION_TRANSPORTISTA',
    ]);
  });
});
