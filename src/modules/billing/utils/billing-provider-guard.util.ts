import { BadRequestException } from '@nestjs/common';

/** Error explícito cuando la emisión fiscal no puede completarse en producción. */
export class BillingProviderConfigurationError extends BadRequestException {
  constructor(message: string) {
    super(message);
  }
}

export function isProductionNodeEnv(nodeEnv: string | undefined): boolean {
  return nodeEnv === 'production';
}

export function assertOseCredentialsOrThrow(
  nodeEnv: string | undefined,
  hasCredentials: boolean,
  providerName: string,
): void {
  if (isProductionNodeEnv(nodeEnv) && !hasCredentials) {
    throw new BillingProviderConfigurationError(
      `${providerName}: credenciales OSE no configuradas. Configure el token API en Facturación electrónica antes de emitir comprobantes.`,
    );
  }
}

export function assertOseOperationSupportedOrThrow(
  nodeEnv: string | undefined,
  providerName: string,
  operationLabel: string,
  alternativeHint: string,
): void {
  if (isProductionNodeEnv(nodeEnv)) {
    throw new BillingProviderConfigurationError(
      `${providerName}: ${operationLabel} no está disponible con este proveedor OSE. ${alternativeHint}`,
    );
  }
}

export function assertEmitDocumentTypeSupportedOrThrow(
  nodeEnv: string | undefined,
  providerName: string,
  documentType: string,
): void {
  if (isProductionNodeEnv(nodeEnv)) {
    throw new BillingProviderConfigurationError(
      `${providerName}: el tipo de comprobante ${documentType} no puede emitirse con este proveedor OSE en producción.`,
    );
  }
}
