import {
  BadRequestException,
  ValidationPipe,
  type ValidationError,
} from '@nestjs/common';

/** Máximo de campos listados en un mismo mensaje (el resto va en `details`). */
const MAX_FIELDS_IN_MESSAGE = 4;

/**
 * Prioridad al elegir un solo mensaje por campo: primero "obligatorio",
 * luego tipo, luego formato/rango.
 */
const CONSTRAINT_PRIORITY = [
  'whitelistValidation',
  'isDefined',
  'isNotEmpty',
  'arrayNotEmpty',
  'nestedValidation',
  'isString',
  'isNumber',
  'isInt',
  'isBoolean',
  'isArray',
  'isObject',
  'isEnum',
  'isIn',
];

export type ValidationDetail = { field: string; messages: string[] };

/** `precioVenta` / `precio_venta` → `precio venta`. */
export function humanizeField(path: string): string {
  return path
    .split('.')
    .map((part) =>
      /^\d+$/.test(part)
        ? `#${Number(part) + 1}`
        : part
            .replace(/_/g, ' ')
            .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
            .toLowerCase(),
    )
    .join(' › ');
}

/** class-validator usa plantillas en inglés; los mensajes propios del DTO van en español. */
function isEnglishDefault(message: string): boolean {
  return /\b(must|should|has to)\b/.test(message);
}

function numbersIn(message: string): string[] {
  return message.match(/-?\d+(?:\.\d+)?/g) ?? [];
}

function listAfterColon(message: string): string {
  const idx = message.indexOf(':');
  return idx >= 0 ? message.slice(idx + 1).trim() : '';
}

/** Traduce un mensaje por defecto de class-validator a español legible. */
export function translateConstraint(
  constraint: string,
  message: string,
  label: string,
): string {
  if (!isEnglishDefault(message)) return message;
  const each = /^each value in /.test(message);
  const field = each ? `cada elemento de «${label}»` : `«${label}»`;
  const nums = numbersIn(message.replace(/^.*?\b(must|should)\b/, ''));

  switch (constraint) {
    case 'whitelistValidation':
      return `El campo «${label}» no está permitido en esta operación.`;
    case 'isDefined':
    case 'isNotEmpty':
      return `El campo ${field} es obligatorio.`;
    case 'arrayNotEmpty':
      return `Debe agregar al menos un elemento en ${field}.`;
    case 'nestedValidation':
    case 'isObject':
    case 'isNotEmptyObject':
      return `El campo ${field} tiene un formato inválido.`;
    case 'isString':
      return `El campo ${field} debe ser texto.`;
    case 'isNumber':
    case 'isNumberString':
    case 'isDecimal':
      return `El campo ${field} debe ser un número válido.`;
    case 'isInt':
      return `El campo ${field} debe ser un número entero.`;
    case 'isPositive':
      return `El campo ${field} debe ser mayor que 0.`;
    case 'isNegative':
      return `El campo ${field} debe ser menor que 0.`;
    case 'isBoolean':
    case 'isBooleanString':
      return `El campo ${field} debe ser verdadero o falso.`;
    case 'isArray':
      return `El campo ${field} debe ser una lista.`;
    case 'isEmail':
      return `El campo ${field} debe ser un correo electrónico válido.`;
    case 'isUUID':
    case 'isMongoId':
      return `El campo ${field} no es un identificador válido.`;
    case 'isUrl':
      return `El campo ${field} debe ser una URL válida.`;
    case 'isDate':
    case 'isDateString':
    case 'isISO8601':
      return `El campo ${field} debe ser una fecha válida.`;
    case 'minDate':
      return `La fecha de ${field} es anterior a la permitida.`;
    case 'maxDate':
      return `La fecha de ${field} es posterior a la permitida.`;
    case 'isEnum':
    case 'isIn': {
      const values = listAfterColon(message);
      return values
        ? `El campo ${field} debe ser uno de: ${values}.`
        : `El campo ${field} tiene un valor no permitido.`;
    }
    case 'min':
      return `El campo ${field} no puede ser menor que ${nums[0] ?? 'el mínimo'}.`;
    case 'max':
      return `El campo ${field} no puede ser mayor que ${nums[0] ?? 'el máximo'}.`;
    case 'minLength':
      return `El campo ${field} debe tener al menos ${nums[0] ?? 'el mínimo de'} caracteres.`;
    case 'maxLength':
      return `El campo ${field} no puede superar ${nums[0] ?? 'el máximo de'} caracteres.`;
    case 'length':
      return nums.length >= 2
        ? `El campo ${field} debe tener entre ${nums[0]} y ${nums[1]} caracteres.`
        : `El campo ${field} tiene una longitud inválida.`;
    case 'arrayMinSize':
      return `El campo ${field} debe tener al menos ${nums[0] ?? 1} elemento(s).`;
    case 'arrayMaxSize':
      return `El campo ${field} no puede tener más de ${nums[0] ?? 'el máximo de'} elemento(s).`;
    case 'arrayUnique':
      return `El campo ${field} no puede tener elementos repetidos.`;
    case 'matches':
      return `El campo ${field} tiene un formato inválido.`;
    case 'isPhoneNumber':
    case 'isMobilePhone':
      return `El campo ${field} debe ser un teléfono válido.`;
    case 'isHexColor':
      return `El campo ${field} debe ser un color hexadecimal válido.`;
    case 'isLatitude':
    case 'isLongitude':
    case 'isLatLong':
      return `El campo ${field} debe ser una coordenada válida.`;
    case 'isAlphanumeric':
      return `El campo ${field} solo puede contener letras y números.`;
    case 'isNumericString':
      return `El campo ${field} solo puede contener dígitos.`;
    case 'isJSON':
      return `El campo ${field} debe ser un JSON válido.`;
    default:
      return `El campo ${field} tiene un valor inválido.`;
  }
}

/** Aplana errores anidados (`items[0].cantidad`) con un mensaje por campo. */
export function flattenValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): ValidationDetail[] {
  const out: ValidationDetail[] = [];
  for (const error of errors) {
    const path = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;
    const label = humanizeField(path);
    const constraints = error.constraints ?? {};
    const keys = Object.keys(constraints).sort((a, b) => {
      const ia = CONSTRAINT_PRIORITY.indexOf(a);
      const ib = CONSTRAINT_PRIORITY.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
    if (keys.length > 0) {
      out.push({
        field: path,
        messages: keys.map((k) =>
          translateConstraint(k, constraints[k], label),
        ),
      });
    }
    if (error.children?.length) {
      out.push(...flattenValidationErrors(error.children, path));
    }
  }
  return out;
}

export function validationExceptionFactory(
  errors: ValidationError[],
): BadRequestException {
  const details = flattenValidationErrors(errors);
  const first = details
    .slice(0, MAX_FIELDS_IN_MESSAGE)
    .map((d) => d.messages[0]);
  const rest = details.length - first.length;
  const message =
    first.join(' ') +
    (rest > 0 ? ` Además hay ${rest} campo(s) con errores.` : '');
  return new BadRequestException({
    code: 'VALIDATION_ERROR',
    message: message || 'Los datos enviados no son válidos.',
    details,
  });
}

/** Configuración única del ValidationPipe (HTTP, E2E y pruebas de contrato). */
export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: false },
    exceptionFactory: validationExceptionFactory,
  });
}
