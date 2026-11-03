import { textSearchFilter } from './text-search-filter';

describe('textSearchFilter', () => {
  it('une palabras con comodín para tolerar guiones y espacios', () => {
    expect(textSearchFilter('tres gel')).toEqual({ contains: 'tres%gel', mode: 'insensitive' });
    expect(textSearchFilter(' tres-gel ')).toEqual({ contains: 'tres%gel', mode: 'insensitive' });
  });

  it('separa números de letras escritos juntos', () => {
    expect(textSearchFilter('3gel').contains).toBe('3%gel');
    expect(textSearchFilter('Omeprazol20mg').contains).toBe('Omeprazol%20%mg');
  });

  it('escapa los comodines escritos por el usuario', () => {
    expect(textSearchFilter('50%').contains).toBe('50\\%');
  });

  it('conserva el texto si solo hay separadores', () => {
    expect(textSearchFilter('-').contains).toBe('-');
  });
});
