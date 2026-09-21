import { namespacedCacheKey } from './cache-key.util';

describe('namespacedCacheKey', () => {
  it('usa factofarm por defecto', () => {
    expect(namespacedCacheKey(undefined, 'ubigeo:departments')).toBe(
      'factofarm:ubigeo:departments',
    );
  });

  it('respeta un prefijo custom sin duplicar dos puntos', () => {
    expect(namespacedCacheKey('store:', 'menu')).toBe('store:menu');
  });
});
