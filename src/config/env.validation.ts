import * as Joi from 'joi';

/** Validación centralizada de variables de entorno (Joi). */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  /** Interfaz de escucha (`0.0.0.0` = todas; `127.0.0.1` solo local). */
  HOST: Joi.string().default('0.0.0.0'),
  JWT_SECRET: Joi.string().min(32).required().messages({
    'string.min': 'JWT_SECRET debe tener al menos 32 caracteres',
    'any.required': 'JWT_SECRET es obligatorio para firmar tokens',
  }),
  /** Duración del access token (ej. 15m, 1h). */
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  /** Compatibilidad: si no hay JWT_ACCESS_EXPIRES_IN, cae en JWT_EXPIRES_IN. */
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  /** Días de validez del refresh token. */
  JWT_REFRESH_EXPIRES_DAYS: Joi.number().integer().min(1).max(90).default(7),
  DATABASE_URL: Joi.string()
    .pattern(/^postgres(ql)?:\/\//)
    .required()
    .messages({
      'string.pattern.base':
        'DATABASE_URL debe ser una URL postgres/postgresql (ej. postgresql://user:pass@host:5432/db)',
    }),
  /** Directorio absoluto o relativo al cwd donde se guardan ficheros subidos (tabla `archivos`). */
  UPLOADS_DIR: Joi.string().default('uploads'),
  /** Ventana de rate limiting global (ms). */
  THROTTLE_TTL_MS: Joi.number().integer().min(1000).default(60_000),
  /** Máximo de peticiones por IP en la ventana global. */
  THROTTLE_LIMIT: Joi.number().integer().min(1).default(120),
  /** Máximo de intentos de login por IP en la ventana global. */
  THROTTLE_LOGIN_LIMIT: Joi.number().integer().min(1).default(10),
  FRONTEND_URL: Joi.string().uri().default('http://localhost:4200'),
  PASSWORD_RESET_EXPIRES_MINUTES: Joi.number().integer().min(5).max(1440).default(60),
  SMTP_HOST: Joi.string().optional().allow(''),
  SMTP_PORT: Joi.number().port().default(587),
  SMTP_USER: Joi.string().optional().allow(''),
  SMTP_PASS: Joi.string().optional().allow(''),
  SMTP_FROM: Joi.string().optional().allow(''),
});
