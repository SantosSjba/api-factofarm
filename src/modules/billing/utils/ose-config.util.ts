import { BillingProviderType } from '../../../generated/prisma/client';

/** Proveedores OSE/PSE reales (no MOCK). */
export const REAL_OSE_PROVIDERS: ReadonlySet<BillingProviderType> = new Set([
  BillingProviderType.FACTILIZA,
  BillingProviderType.NUBEFACT,
  BillingProviderType.APISPERU,
]);

export type OseConfigLike = {
  provider: BillingProviderType;
  apiTokenEncrypted?: string | null;
};

/** True si el local tiene proveedor OSE + token para emitir CPE. */
export function hasRealOseConfigured(
  config: OseConfigLike | null | undefined,
): boolean {
  if (!config) return false;
  return (
    REAL_OSE_PROVIDERS.has(config.provider) &&
    !!config.apiTokenEncrypted?.trim()
  );
}

/** En no-producción MOCK puede emitir CPE local (ACEPTADO mock) para QA. */
export function canEmitElectronicDocuments(
  config: OseConfigLike | null | undefined,
  nodeEnv: string | undefined,
): boolean {
  if (hasRealOseConfigured(config)) return true;
  if (nodeEnv === 'production') return false;
  const provider = config?.provider ?? BillingProviderType.MOCK;
  return provider === BillingProviderType.MOCK;
}
