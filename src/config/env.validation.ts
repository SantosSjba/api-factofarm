import * as Joi from 'joi';

/** Validación centralizada de variables de entorno (Joi). */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  HOST: Joi.string().default('0.0.0.0'),
  JWT_SECRET: Joi.string().min(32).required().messages({
    'string.min': 'JWT_SECRET debe tener al menos 32 caracteres',
    'any.required': 'JWT_SECRET es obligatorio para firmar tokens',
  }),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  JWT_REFRESH_EXPIRES_DAYS: Joi.number().integer().min(1).max(90).default(7),
  DATABASE_URL: Joi.string()
    .pattern(/^postgres(ql)?:\/\//)
    .required()
    .messages({
      'string.pattern.base':
        'DATABASE_URL debe ser una URL postgres/postgresql (ej. postgresql://user:pass@host:5432/db)',
    }),
  UPLOADS_DIR: Joi.string().default('uploads'),
  THROTTLE_TTL_MS: Joi.number().integer().min(1000).default(60_000),
  THROTTLE_LIMIT: Joi.number().integer().min(1).default(120),
  THROTTLE_LOGIN_LIMIT: Joi.number().integer().min(1).default(10),
  FRONTEND_URL: Joi.string().uri().default('http://localhost:4200'),
  /** Orígenes CORS adicionales separados por coma (producción). */
  CORS_ORIGINS: Joi.string().optional().allow(''),
  /** Clave AES-256 para secretos de facturación (32+ bytes en base64 o hex). Obligatoria en producción. */
  BILLING_ENCRYPTION_KEY: Joi.string().min(32).optional().allow(''),
  /** Habilitar documentación OpenAPI/Scalar (false en producción recomendado). */
  SWAGGER_ENABLED: Joi.boolean().default(true),
  /** URL Redis opcional para cache distribuido (catálogos, permisos). */
  REDIS_URL: Joi.string().uri({ scheme: ['redis', 'rediss'] }).optional().allow(''),
  CACHE_TTL_MS: Joi.number().integer().min(10_000).default(300_000),
  PASSWORD_RESET_EXPIRES_MINUTES: Joi.number().integer().min(5).max(1440).default(60),
  SMTP_HOST: Joi.string().optional().allow(''),
  SMTP_PORT: Joi.number().port().default(587),
  SMTP_USER: Joi.string().optional().allow(''),
  SMTP_PASS: Joi.string().optional().allow(''),
  SMTP_FROM: Joi.string().optional().allow(''),
  /** Correo que recibe solicitudes de la landing (habilitar cuenta). */
  SALES_CONTACT_EMAIL: Joi.string().email().optional().allow(''),
  /** Correo para libro de reclamaciones (Ley 29571). Si vacío, usa SALES_CONTACT_EMAIL. */
  COMPLAINTS_EMAIL: Joi.string().email().optional().allow(''),
  COMPANY_LEGAL_NAME: Joi.string().optional().allow(''),
  COMPANY_RUC: Joi.string().optional().allow(''),
  COMPANY_ADDRESS: Joi.string().optional().allow(''),
  SENTRY_DSN: Joi.string().uri().optional().allow(''),
  PG_POOL_MAX: Joi.number().integer().min(1).max(100).default(20),
  PG_POOL_IDLE_MS: Joi.number().integer().min(1000).default(30_000),
  PG_POOL_CONNECT_MS: Joi.number().integer().min(1000).default(10_000),
});

export function parseCorsOrigins(
  frontendUrl: string,
  extra?: string,
): string[] {
  const origins = new Set<string>();
  if (frontendUrl?.trim()) origins.add(frontendUrl.trim());
  for (const part of (extra ?? '').split(',')) {
    const trimmed = part.trim();
    if (trimmed) origins.add(trimmed);
  }
  return [...origins];
}
