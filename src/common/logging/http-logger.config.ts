import { randomUUID } from 'node:crypto';
import type { ConfigService } from '@nestjs/config';
import type { Options } from 'pino-http';

export function safeRequestId(incoming: unknown): string {
  return typeof incoming === 'string' &&
    /^[A-Za-z0-9._-]{1,128}$/.test(incoming)
    ? incoming
    : randomUUID();
}

/** Logs de operaciones: no incluir cuerpos, query strings, cabeceras ni valores del error. */
export function safeError(error: unknown) {
  if (!(error instanceof Error)) return { type: 'UnknownError' };
  const record = error as Error & { code?: unknown };
  return {
    type: error.name,
    code: typeof record.code === 'string' ? record.code : undefined,
    stack: error.stack
      ?.split('\n')
      .filter((line) => /^\s+at /.test(line))
      .join('\n'),
  };
}

export function createHttpLoggerOptions(config: ConfigService): Options {
  const environment = config.get<string>('NODE_ENV', 'development');
  const level =
    config.get<string>('LOG_LEVEL') ??
    (environment === 'test' ? 'silent' : 'info');
  return {
    level,
    base: { service: 'factofarm-api', environment },
    redact: {
      paths: [
        'password',
        'passwordHash',
        'currentPassword',
        'newPassword',
        'token',
        'accessToken',
        'refreshToken',
        'apiToken',
        'secret',
        '*.password',
        '*.passwordHash',
        '*.currentPassword',
        '*.newPassword',
        '*.token',
        '*.accessToken',
        '*.refreshToken',
        '*.apiToken',
        '*.secret',
        'req.headers.authorization',
        'req.headers.cookie',
        'res.headers["set-cookie"]',
      ],
      censor: '[REDACTED]',
    },
    transport:
      environment === 'development'
        ? {
            target: 'pino-pretty',
            options: { singleLine: true, colorize: true },
          }
        : undefined,
    genReqId: (req, res) => {
      const id = safeRequestId(req.headers['x-request-id']);
      res.setHeader('X-Request-Id', id);
      return id;
    },
    wrapSerializers: false,
    serializers: {
      req: (req: { id?: unknown; method?: string; url?: string }) => ({
        id: req.id,
        method: req.method,
        path: req.url?.split('?')[0],
      }),
      res: (res: { statusCode?: number }) => ({ statusCode: res.statusCode }),
      err: safeError,
    },
    customProps: (req) => ({ requestId: req.id }),
    customLogLevel: (_req, res, error) =>
      res.statusCode >= 500
        ? 'error'
        : res.statusCode >= 400
          ? 'warn'
          : error
            ? 'error'
            : 'info',
    customSuccessMessage: (_req, res) =>
      res.statusCode >= 400 ? 'Solicitud rechazada' : 'Solicitud completada',
    customErrorMessage: () => 'La solicitud falló',
    autoLogging: {
      ignore: (req) =>
        ['/api/health', '/api/v1/health', '/api/v1/health/ready'].includes(
          req.url?.split('?')[0] ?? '',
        ),
    },
  };
}
