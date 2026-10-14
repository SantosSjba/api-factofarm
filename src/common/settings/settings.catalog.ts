import { CronTime } from 'cron';
import Joi from 'joi';

export const settingDefinitions = {
  SMTP_HOST: { label: 'Servidor SMTP', default: '' },
  SMTP_PORT: { label: 'Puerto SMTP', default: '587' },
  SMTP_USER: { label: 'Usuario SMTP', default: '' },
  SMTP_PASS: { label: 'Contraseña SMTP', default: '', secret: true },
  SMTP_FROM: { label: 'Remitente de correo', default: '' },
  PASSWORD_RESET_EXPIRES_MINUTES: {
    label: 'Vigencia de recuperación (minutos)',
    default: '60',
  },
  SALES_CONTACT_EMAIL: { label: 'Correo de ventas', default: '' },
  COMPLAINTS_EMAIL: { label: 'Correo de reclamaciones', default: '' },
  CONTACT_EMAIL: { label: 'Correo público', default: '' },
  CONTACT_WHATSAPP: {
    label: 'WhatsApp (código de país y número)',
    default: '',
  },
  COMPANY_LEGAL_NAME: {
    label: 'Razón social de la plataforma',
    default: 'FACTOSYS PERU S.A.C.',
  },
  COMPANY_RUC: { label: 'RUC de la plataforma', default: '20614608952' },
  COMPANY_ADDRESS: {
    label: 'Domicilio de la plataforma',
    default: 'Trujillo, La Libertad, Perú.',
  },
  SITE_URL: { label: 'URL pública (SEO)', default: 'http://localhost:4200' },
  PASSWORD_RESET_BASE_URL: {
    label: 'URL del panel para recuperación',
    default: 'http://localhost:4200',
  },
  THROTTLE_TTL_MS: {
    label: 'Ventana de límite de peticiones (milisegundos)',
    default: '60000',
  },
  THROTTLE_LIMIT: {
    label: 'Peticiones permitidas por ventana',
    default: '120',
  },
  THROTTLE_LOGIN_LIMIT: {
    label: 'Intentos de autenticación por ventana',
    default: '10',
  },
  DATA_RETENTION_AUDIT_DAYS: {
    label: 'Conservación de auditoría (días)',
    default: '730',
  },
  DATA_RETENTION_ARCHIVE_DAYS: {
    label: 'Antigüedad para archivar (días)',
    default: '1825',
  },
  DATA_RETENTION_BATCH_SIZE: {
    label: 'Registros por lote de retención',
    default: '5000',
  },
  DATA_RETENTION_PURGE_ENABLED: {
    label: 'Habilitar purga de auditoría',
    default: 'false',
  },
  DATA_RETENTION_PURGE_CONFIRM: {
    label: 'Confirmar purga (I_UNDERSTAND; elimina auditoría antigua)',
    default: '',
  },
  DATA_RETENTION_ARCHIVE_ENABLED: {
    label: 'Habilitar archivado',
    default: 'false',
  },
  DATA_RETENTION_CRON: {
    label: 'Horario de retención (cron)',
    default: '0 3 * * *',
  },
  DATA_RETENTION_ARCHIVE_CRON: {
    label: 'Horario de archivado (cron)',
    default: '0 4 * * 0',
  },
  JWT_ACCESS_EXPIRES_IN: {
    label: 'Vigencia de acceso (ej. 15m)',
    default: '15m',
  },
  JWT_REFRESH_EXPIRES_DAYS: {
    label: 'Vigencia de sesión (días)',
    default: '7',
  },
} as const;
export type SettingKey = keyof typeof settingDefinitions;
const cron = Joi.string().custom((value: string, helpers) => {
  try {
    new CronTime(value);
    return value;
  } catch {
    return helpers.error('any.invalid');
  }
});
const text = Joi.string().max(500).allow('');
export const settingsSchema = Joi.object({
  SMTP_HOST: Joi.string().hostname().allow(''),
  SMTP_PORT: Joi.number().integer().min(1).max(65535),
  SMTP_USER: text,
  SMTP_PASS: Joi.string().max(1000).allow(''),
  SMTP_FROM: Joi.string()
    .max(254)
    .pattern(/^(?:[^<>\r\n]+ <)?[^<>\s@]+@[^<>\s@]+\.[^<>\s@]+>?$/)
    .allow(''),
  PASSWORD_RESET_EXPIRES_MINUTES: Joi.number().integer().min(5).max(1440),
  SALES_CONTACT_EMAIL: Joi.string().email().allow(''),
  COMPLAINTS_EMAIL: Joi.string().email().allow(''),
  CONTACT_EMAIL: Joi.string().email().allow(''),
  CONTACT_WHATSAPP: Joi.string()
    .pattern(/^[1-9][0-9]{7,14}$/)
    .allow(''),
  COMPANY_LEGAL_NAME: Joi.string().trim().min(1).max(200),
  COMPANY_RUC: Joi.string().pattern(/^[0-9]{11}$/),
  COMPANY_ADDRESS: Joi.string().trim().min(1).max(500),
  SITE_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .max(500),
  PASSWORD_RESET_BASE_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .max(500),
  THROTTLE_TTL_MS: Joi.number().integer().min(1000).max(3600000),
  THROTTLE_LIMIT: Joi.number().integer().min(1).max(10000),
  THROTTLE_LOGIN_LIMIT: Joi.number().integer().min(1).max(1000),
  DATA_RETENTION_AUDIT_DAYS: Joi.number().integer().min(30).max(3650),
  DATA_RETENTION_ARCHIVE_DAYS: Joi.number().integer().min(365).max(3650),
  DATA_RETENTION_BATCH_SIZE: Joi.number().integer().min(100).max(50000),
  DATA_RETENTION_PURGE_ENABLED: Joi.boolean(),
  DATA_RETENTION_PURGE_CONFIRM: Joi.string().valid('I_UNDERSTAND', ''),
  DATA_RETENTION_ARCHIVE_ENABLED: Joi.boolean(),
  DATA_RETENTION_CRON: cron,
  DATA_RETENTION_ARCHIVE_CRON: cron,
  JWT_ACCESS_EXPIRES_IN: Joi.string().pattern(/^[1-9][0-9]{0,3}[smhd]$/),
  JWT_REFRESH_EXPIRES_DAYS: Joi.number().integer().min(1).max(90),
})
  .unknown(false)
  .min(1)
  .messages({
    'number.base': 'El valor debe ser un número',
    'number.integer': 'El valor debe ser entero',
    'number.min': 'El valor debe ser mayor o igual a {{#limit}}',
    'number.max': 'El valor debe ser menor o igual a {{#limit}}',
    'string.email': 'Ingresa un correo válido',
    'string.uri': 'Ingresa una URL http o https válida',
    'string.pattern.base': 'El formato ingresado no es válido',
    'string.hostname': 'Ingresa un servidor válido',
    'string.empty': 'Este campo no puede estar vacío',
    'string.min': 'Ingresa al menos {{#limit}} caracteres',
    'string.max': 'No puede superar {{#limit}} caracteres',
    'any.invalid': 'El valor ingresado no es válido',
    'any.only': 'El valor no está entre las opciones permitidas',
    'object.unknown': 'La configuración no está permitida',
  });
