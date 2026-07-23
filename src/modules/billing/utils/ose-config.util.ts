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
export function hasRealOseConfigured(config: OseConfigLike | null | undefined): boolean {
  if (!config) return false;
  return REAL_OSE_PROVIDERS.has(config.provider) && !!config.apiTokenEncrypted?.trim();
}
