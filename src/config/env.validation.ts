import * as Joi from 'joi';

/** Validación centralizada de variables de entorno (Joi). */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string()
    .pattern(/^postgres(ql)?:\/\//)
    .required()
    .messages({
      'string.pattern.base':
        'DATABASE_URL debe ser una URL postgres/postgresql (ej. postgresql://user:pass@host:5432/db)',
    }),
});
