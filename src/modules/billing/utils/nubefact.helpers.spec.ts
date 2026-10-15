import {
  buildNubefactAuthHeader,
  nubefactEmissionDate,
} from './nubefact.helpers';

describe('nubefact.helpers', () => {
  it('arma el Authorization oficial de Nubefact', () => {
    expect(buildNubefactAuthHeader('  abc123  ')).toBe('Token token="abc123"');
  });

  it('formatea fecha de emisión DD-MM-YYYY en Lima', () => {
    expect(nubefactEmissionDate('2026-09-21T04:30:00.000Z')).toBe('20-09-2026');
  });

  it('respeta zona horaria opcional', () => {
    expect(nubefactEmissionDate('2026-09-21T04:30:00.000Z', 'UTC')).toBe(
      '21-09-2026',
    );
  });
});
