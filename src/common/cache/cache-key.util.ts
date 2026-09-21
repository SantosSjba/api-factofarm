const DEFAULT_PREFIX = 'factofarm';

/** Prefijo de claves para Redis compartido entre apps FactoSys. */
export function namespacedCacheKey(prefix: string | undefined, key: string): string {
  const p = (prefix?.trim() || DEFAULT_PREFIX).replace(/:+$/, '');
  return `${p}:${key}`;
}
