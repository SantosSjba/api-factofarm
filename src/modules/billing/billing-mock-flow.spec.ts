import { MockBillingProvider } from './providers/mock-billing.provider';
import { getBillingProviderCapabilities } from './utils/billing-capabilities.util';
import { BillingProviderType } from '../../generated/prisma/client';

describe('Billing sale flow (mock OSE)', () => {
  const mock = new MockBillingProvider();

  it('emite boleta mock y permite RC/baja en desarrollo', async () => {
    const caps = getBillingProviderCapabilities(BillingProviderType.MOCK, 'development');
    expect(caps.mockAllowed).toBe(true);
    expect(caps.supportsDailySummary).toBe(true);
    expect(caps.supportsVoidDocument).toBe(true);

    const emit = await mock.emit({
      documentId: 'flow-test-boleta',
      documentType: 'BOLETA',
      serie: 'B001',
      numero: '00000099',
      fechaEmision: new Date().toISOString(),
      moneda: 'PEN',
      subtotal: '8.47',
      igvTotal: '1.53',
      total: '10.00',
      esContingencia: false,
      emisor: { ruc: '20100066603', razonSocial: 'BOTICA TEST' },
      receptor: { tipoDoc: '1', numeroDoc: '12345678', nombre: 'CLIENTE TEST' },
      lines: [
        {
          descripcion: 'PRODUCTO TEST',
          cantidad: '1',
          precioUnitario: '10.00',
          subtotalLinea: '8.47',
          igvLinea: '1.53',
          totalLinea: '10.00',
          taxAffectationCodigo: '10',
          unidadMedida: 'NIU',
        },
      ],
      ublXml: '<Invoice/>',
    });
    expect(emit.sunatStatus).toBe('ACEPTADO');

    const summary = await mock.sendDailySummary({
      fecha: '2026-07-09',
      documentIds: ['flow-test-boleta'],
    });
    expect(summary.sunatStatus).toBe('ACEPTADO');

    const voidResult = await mock.voidDocument({
      externalId: emit.externalId,
      documentType: 'BOLETA',
      serie: 'B001',
      numero: '00000099',
      reason: 'Error de emisión',
    });
    expect(voidResult.sunatStatus).toBe('ANULADO');
  });
});
