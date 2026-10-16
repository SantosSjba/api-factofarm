import { HttpStatus } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { humanizeField } from '../validation/validation-pipe.factory';

export type MappedError = {
  status: number;
  code: string;
  message: string;
  details?: unknown;
};

type Meta = Record<string, unknown> | undefined;

/** Campos de la restricción violada (Prisma clásico usa `target`, driver adapters `constraint`). */
function constraintFields(meta: Meta): string[] {
  if (!meta) return [];
  const target = meta.target;
  if (Array.isArray(target)) return target.map(String);
  if (typeof target === 'string') return [target];
  const cause = (meta.driverAdapterError as { cause?: Record<string, unknown> })
    ?.cause;
  const constraint = cause?.constraint as
    | { fields?: unknown[]; index?: string }
    | undefined;
  if (Array.isArray(constraint?.fields)) return constraint.fields.map(String);
  if (typeof constraint?.index === 'string') return [constraint.index];
  if (typeof meta.field_name === 'string') return [meta.field_name];
  return [];
}

/** Quita columnas técnicas (tenantId, establecimientoId…) que el usuario no ve. */
function visibleFields(fields: string[]): string[] {
  const visible = fields
    .map((f) => f.replace(/^"|"$/g, ''))
    .filter(
      (f) =>
        !/^(tenant|tenantId|tenant_id|establecimientoId|establishmentId|sucursalId|branchId|id)$/i.test(
          f,
        ),
    );
  return visible.map((f) => humanizeField(f));
}

/**
 * Traduce errores de Prisma a respuestas HTTP con mensaje claro. Evita que
 * duplicados, registros relacionados o inexistentes lleguen como 500 genérico.
 */
export function mapPrismaError(
  exception: unknown,
  method: string,
): MappedError | null {
  if (exception instanceof Prisma.PrismaClientKnownRequestError) {
    const meta = exception.meta;
    switch (exception.code) {
      case 'P2002': {
        const fields = visibleFields(constraintFields(meta));
        return {
          status: HttpStatus.CONFLICT,
          code: 'DUPLICATE',
          message: fields.length
            ? `Ya existe un registro con el mismo valor en: ${fields.join(', ')}.`
            : 'Ya existe un registro con esos datos.',
          details: { fields },
        };
      }
      case 'P2003':
      case 'P2014':
        return {
          status: HttpStatus.CONFLICT,
          code: 'RELATED_RECORDS',
          message:
            method === 'DELETE'
              ? 'No se puede eliminar porque el registro está siendo usado en otras operaciones. Puede desactivarlo en su lugar.'
              : 'Uno de los registros relacionados no existe o ya no está disponible. Actualice la página e intente nuevamente.',
        };
      case 'P2025':
      case 'P2001':
      case 'P2018':
        return {
          status: HttpStatus.NOT_FOUND,
          code: 'NOT_FOUND',
          message:
            'El registro solicitado no existe o fue eliminado. Actualice la página e intente nuevamente.',
        };
      case 'P2000': {
        const fields = visibleFields(constraintFields(meta));
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 'VALUE_TOO_LONG',
          message: fields.length
            ? `El valor de ${fields.join(', ')} supera la longitud permitida.`
            : 'Uno de los valores supera la longitud permitida.',
        };
      }
      case 'P2011':
      case 'P2012': {
        const fields = visibleFields(constraintFields(meta));
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 'REQUIRED_FIELD',
          message: fields.length
            ? `Falta completar un campo obligatorio: ${fields.join(', ')}.`
            : 'Falta completar un campo obligatorio.',
        };
      }
      case 'P2005':
      case 'P2006':
      case 'P2007':
      case 'P2019':
      case 'P2020':
      case 'P2023':
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 'INVALID_VALUE',
          message: 'Uno de los valores enviados no tiene el formato correcto.',
        };
      case 'P2034':
        return {
          status: HttpStatus.CONFLICT,
          code: 'CONCURRENT_UPDATE',
          message:
            'Otra operación modificó estos datos al mismo tiempo. Intente nuevamente.',
        };
      case 'P2024':
      case 'P1001':
      case 'P1002':
      case 'P1008':
      case 'P1017':
        return {
          status: HttpStatus.SERVICE_UNAVAILABLE,
          code: 'DATABASE_UNAVAILABLE',
          message:
            'La base de datos está ocupada o no responde. Intente nuevamente en unos segundos.',
        };
      default:
        return null;
    }
  }
  if (exception instanceof Prisma.PrismaClientValidationError) {
    return {
      status: HttpStatus.BAD_REQUEST,
      code: 'INVALID_VALUE',
      message:
        'Los datos enviados están incompletos o tienen un formato incorrecto.',
    };
  }
  if (exception instanceof Prisma.PrismaClientInitializationError) {
    return {
      status: HttpStatus.SERVICE_UNAVAILABLE,
      code: 'DATABASE_UNAVAILABLE',
      message:
        'No se pudo conectar con la base de datos. Intente nuevamente en unos segundos.',
    };
  }
  return null;
}

/** Errores de body-parser/express (JSON mal formado, payload grande). */
export function mapTransportError(exception: unknown): MappedError | null {
  if (!exception || typeof exception !== 'object') return null;
  const type = (exception as { type?: unknown }).type;
  if (type === 'entity.too.large') {
    return {
      status: HttpStatus.PAYLOAD_TOO_LARGE,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Los datos o el archivo enviado superan el tamaño permitido.',
    };
  }
  if (type === 'entity.parse.failed') {
    return {
      status: HttpStatus.BAD_REQUEST,
      code: 'MALFORMED_BODY',
      message: 'El formato de los datos enviados no es válido.',
    };
  }
  return null;
}

/** Mensajes por defecto de Nest/Multer/Throttler que llegarían en inglés. */
const ENGLISH_MESSAGES: Array<[RegExp, string]> = [
  [/^Internal server error$/i, 'Error interno del servidor.'],
  [
    /^Unauthorized$/i,
    'Su sesión no es válida o expiró. Inicie sesión nuevamente.',
  ],
  [
    /^Forbidden( resource)?$/i,
    'No tiene permisos para realizar esta operación.',
  ],
  [/^Not Found$/i, 'El recurso solicitado no existe.'],
  [/^Cannot (GET|POST|PUT|PATCH|DELETE) /i, 'La ruta solicitada no existe.'],
  [/^Bad Request$/i, 'La solicitud no es válida.'],
  [/^Conflict$/i, 'La operación entra en conflicto con datos existentes.'],
  [
    /Too Many Requests/i,
    'Demasiadas solicitudes. Espere unos segundos e intente nuevamente.',
  ],
  [/^File too large$/i, 'El archivo supera el tamaño máximo permitido.'],
  [
    /^Payload Too Large$/i,
    'Los datos o el archivo enviado superan el tamaño permitido.',
  ],
  [/^Unexpected field/i, 'Se envió un archivo en un campo no esperado.'],
  [/^Too many files$/i, 'Se enviaron demasiados archivos.'],
  [
    /^Validation failed \(.*(numeric|uuid).*\)$/i,
    'El identificador enviado no es válido.',
  ],
  [/^Validation failed/i, 'Los datos enviados no son válidos.'],
  [
    /^Unsupported Media Type$/i,
    'El tipo de archivo o contenido no está permitido.',
  ],
  [
    /^Service Unavailable$/i,
    'El servicio no está disponible. Intente nuevamente.',
  ],
  [/^Method Not Allowed$/i, 'Operación no permitida.'],
];

export function translateHttpMessage(message: string): string {
  for (const [re, es] of ENGLISH_MESSAGES) {
    if (re.test(message)) return es;
  }
  return message;
}
