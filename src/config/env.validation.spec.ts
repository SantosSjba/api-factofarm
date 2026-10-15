import { envValidationSchema, parseCorsOrigins } from './env.validation';

describe('env.validation', () => {
  it('parseCorsOrigins merges frontend and extra origins', () => {
    const origins = parseCorsOrigins(
      'http://localhost:4200',
      'https://a.com, https://b.com',
    );
    expect(origins).toEqual([
      'http://localhost:4200',
      'https://a.com',
      'https://b.com',
    ]);
  });

  it('parseCorsOrigins deduplicates', () => {
    const origins = parseCorsOrigins(
      'http://localhost:4200',
      'http://localhost:4200',
    );
    expect(origins).toEqual(['http://localhost:4200']);
  });

  it('exige LPDP_SENSITIVE_ENCRYPTION_KEY en producción', () => {
    const { error } = envValidationSchema.validate({
      NODE_ENV: 'production',
      BILLING_ENCRYPTION_KEY: 'b'.repeat(32),
      JWT_SECRET: 'x'.repeat(32),
      DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
    });
    expect(error?.message).toMatch(/LPDP_SENSITIVE_ENCRYPTION_KEY/);
  });

  it('deshabilita Swagger por defecto en producción', () => {
    const result = envValidationSchema.validate({
      NODE_ENV: 'production',
      BILLING_ENCRYPTION_KEY: 'b'.repeat(32),
      JWT_SECRET: 'x'.repeat(32),
      DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
      LPDP_SENSITIVE_ENCRYPTION_KEY: 'y'.repeat(32),
    });
    const value = result.value as Record<string, unknown>;
    expect(result.error).toBeUndefined();
    expect(value.SWAGGER_ENABLED).toBe(false);
  });

  it('habilita Swagger por defecto en desarrollo', () => {
    const result = envValidationSchema.validate({
      NODE_ENV: 'development',
      JWT_SECRET: 'x'.repeat(32),
      DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
    });
    const value = result.value as Record<string, unknown>;
    expect(value.SWAGGER_ENABLED).toBe(true);
  });
});
