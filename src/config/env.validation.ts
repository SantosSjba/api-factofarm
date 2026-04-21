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
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  DATABASE_URL: Joi.string()
    .pattern(/^postgres(ql)?:\/\//)
    .required()
    .messages({
      'string.pattern.base':
        'DATABASE_URL debe ser una URL postgres/postgresql (ej. postgresql://user:pass@host:5432/db)',
    }),
  /** Directorio absoluto o relativo al cwd donde se guardan ficheros subidos (tabla `archivos`). */
  UPLOADS_DIR: Joi.string().default('uploads'),
});
