import { parseCorsOrigins } from './env.validation';

describe('env.validation', () => {
  it('parseCorsOrigins merges frontend and extra origins', () => {
    const origins = parseCorsOrigins('http://localhost:4200', 'https://a.com, https://b.com');
    expect(origins).toEqual(['http://localhost:4200', 'https://a.com', 'https://b.com']);
  });

  it('parseCorsOrigins deduplicates', () => {
    const origins = parseCorsOrigins('http://localhost:4200', 'http://localhost:4200');
    expect(origins).toEqual(['http://localhost:4200']);
  });
});
