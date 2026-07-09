import { BillingProviderType } from '../../../generated/prisma/client';

export type BillingSpecialDocumentType =
  | 'RETENCION'
  | 'PERCEPCION'
  | 'LIQUIDACION_COMPRA'
  | 'GUIA_REMISION_TRANSPORTISTA';

export type BillingProviderCapabilities = {
  mockAllowed: boolean;
  supportsDailySummary: boolean;
  supportsVoidDocument: boolean;
  supportedSpecialDocuments: BillingSpecialDocumentType[];
  unsupportedSpecialDocuments: { documentType: BillingSpecialDocumentType; reason: string }[];
  notes: string[];
};

const FACTILIZA_UNSUPPORTED_SPECIAL: BillingSpecialDocumentType[] = [
  'RETENCION',
  'PERCEPCION',
  'LIQUIDACION_COMPRA',
  'GUIA_REMISION_TRANSPORTISTA',
];

const FACTILIZA_UNSUPPORTED_REASON =
  'No disponible con proveedor Factiliza. Use Nubefact o gestione el comprobante desde su panel OSE.';

export function getBillingProviderCapabilities(
  provider: BillingProviderType,
  nodeEnv: string | undefined,
): BillingProviderCapabilities {
  const isProduction = nodeEnv === 'production';

  if (provider === BillingProviderType.FACTILIZA) {
    return {
      mockAllowed: !isProduction,
      supportsDailySummary: false,
      supportsVoidDocument: false,
      supportedSpecialDocuments: [],
      unsupportedSpecialDocuments: FACTILIZA_UNSUPPORTED_SPECIAL.map((documentType) => ({
        documentType,
        reason: FACTILIZA_UNSUPPORTED_REASON,
      })),
      notes: [
        'Factiliza soporta factura, boleta, nota de crédito y guía remitente.',
        'Resumen diario (RC) y comunicación de baja requieren Nubefact u otro OSE compatible.',
      ],
    };
  }

  if (provider === BillingProviderType.NUBEFACT) {
    return {
      mockAllowed: !isProduction,
      supportsDailySummary: true,
      supportsVoidDocument: true,
      supportedSpecialDocuments: [...FACTILIZA_UNSUPPORTED_SPECIAL],
      unsupportedSpecialDocuments: [],
      notes: ['Nubefact soporta emisión estándar, RC, baja y comprobantes especiales.'],
    };
  }

  return {
    mockAllowed: !isProduction,
    supportsDailySummary: !isProduction,
    supportsVoidDocument: !isProduction,
    supportedSpecialDocuments: isProduction ? [] : [...FACTILIZA_UNSUPPORTED_SPECIAL],
    unsupportedSpecialDocuments: isProduction
      ? FACTILIZA_UNSUPPORTED_SPECIAL.map((documentType) => ({
          documentType,
          reason: 'Configure Factiliza o Nubefact para emitir comprobantes reales en producción.',
        }))
      : [],
    notes: isProduction
      ? ['Configure Factiliza o Nubefact para operación fiscal real.']
      : ['Proveedor MOCK solo para desarrollo y pruebas locales.'],
  };
}

export function assertSpecialDocumentSupported(
  provider: BillingProviderType,
  documentType: BillingSpecialDocumentType,
): void {
  const caps = getBillingProviderCapabilities(provider, 'production');
  const blocked = caps.unsupportedSpecialDocuments.find((row) => row.documentType === documentType);
  if (blocked) {
    throw new Error(blocked.reason);
  }
}
