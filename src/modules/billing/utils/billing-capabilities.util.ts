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
        'Prerrequisito: cuenta y token ya creados en el panel Factiliza (app.factiliza.com).',
        'Aquí solo pega URL + Bearer; FactoFarm emite factura/boleta/NC/ND y guía remitente.',
        'RC diario y comunicación de baja: gestione en Nubefact/APIsPERU o en el panel Factiliza.',
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
      notes: [
        'Prerrequisito: en Nubefact, Configuración → API (Integración) ya debe mostrar RUTA y TOKEN del local.',
        'Aquí pega esa RUTA y TOKEN; FactoFarm emite CPE, RC, baja y comprobantes especiales.',
      ],
    };
  }

  if (provider === BillingProviderType.APISPERU) {
    return {
      mockAllowed: !isProduction,
      supportsDailySummary: false,
      supportsVoidDocument: true,
      supportedSpecialDocuments: [],
      unsupportedSpecialDocuments: FACTILIZA_UNSUPPORTED_SPECIAL.map((documentType) => ({
        documentType,
        reason: 'No cableado aún con APIsPERU. Use Nubefact o el panel APIsPERU.',
      })),
      notes: [
        'Prerrequisito: empresa creada en el panel APIsPERU (certificado PEM + usuario SOL) con su token permanente.',
        'Aquí pega URL (https://facturacion.apisperu.com/api/v1) y ese token; FactoFarm emite factura/boleta/NC/ND y baja.',
        'RC diario: aún desde el panel APIsPERU.',
      ],
    };
  }

  // MOCK / sin OSE: ventas con nota de venta; sin boleta/factura SUNAT.
  return {
    mockAllowed: true,
    supportsDailySummary: !isProduction,
    supportsVoidDocument: !isProduction,
    supportedSpecialDocuments: isProduction ? [] : [...FACTILIZA_UNSUPPORTED_SPECIAL],
    unsupportedSpecialDocuments: FACTILIZA_UNSUPPORTED_SPECIAL.map((documentType) => ({
      documentType,
      reason:
        'Configure Factiliza, Nubefact o APIsPERU en Mi farmacia (con credenciales de su panel) para CPE.',
    })),
    notes: [
      'Sin OSE: puede vender con nota de venta (no va a SUNAT).',
      'Para CPE: primero configure el panel del proveedor, luego pegue URL/token aquí.',
    ],
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
