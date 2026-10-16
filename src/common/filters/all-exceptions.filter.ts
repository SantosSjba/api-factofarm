import { safeError } from '../logging/http-logger.config';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { captureSentryException } from '../monitoring/sentry.util';
import {
  mapPrismaError,
  mapTransportError,
  translateHttpMessage,
} from './prisma-error.mapper';

type ApiErrorBody = {
  code: string;
  message: string;
  details?: unknown;
  statusCode: number;
  timestamp: string;
  path: string;
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<{
      url: string;
      method?: string;
      id?: unknown;
    }>();
    const path = request.url.split('?')[0];

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ApiErrorBody;
    let mapped: ReturnType<typeof mapPrismaError> = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const raw = exceptionResponse as Record<string, unknown>;
        const rawMessage =
          typeof raw.message === 'string'
            ? raw.message
            : Array.isArray(raw.message)
              ? raw.message.join('; ')
              : exception.message;
        body = {
          statusCode: status,
          code:
            typeof raw.code === 'string'
              ? raw.code
              : this.codeFromStatus(status),
          message: translateHttpMessage(rawMessage),
          details: raw.details,
          timestamp: new Date().toISOString(),
          path,
        };
      } else {
        body = {
          statusCode: status,
          code: this.codeFromStatus(status),
          message: translateHttpMessage(exception.message),
          timestamp: new Date().toISOString(),
          path,
        };
      }
    } else if (
      (mapped =
        mapPrismaError(exception, request.method ?? '') ??
        mapTransportError(exception))
    ) {
      status = mapped.status;
      if (status >= 500) {
        this.logger.error({
          event: 'mapped_exception',
          error: safeError(exception),
          path,
        });
      }
      body = {
        statusCode: status,
        code: mapped.code,
        message: mapped.message,
        details: mapped.details,
        timestamp: new Date().toISOString(),
        path,
      };
    } else {
      const message =
        exception instanceof Error
          ? exception.message
          : 'Error interno del servidor';
      this.logger.error({
        event: 'unhandled_exception',
        error: safeError(exception),
        path,
      });
      const ref =
        typeof request.id === 'string' && request.id
          ? ` (referencia: ${request.id.slice(0, 8)})`
          : '';
      body = {
        statusCode: status,
        code: 'INTERNAL_ERROR',
        message:
          process.env.NODE_ENV === 'production'
            ? `Ocurrió un error inesperado al procesar la solicitud. Intente nuevamente; si persiste, contacte a soporte${ref}.`
            : message,
        timestamp: new Date().toISOString(),
        path,
      };
    }

    if (status >= 500 && process.env.SENTRY_DSN) {
      captureSentryException(exception);
    }

    response.status(status).json(body);
  }

  private codeFromStatus(status: number): string {
    if (status === Number(HttpStatus.UNAUTHORIZED)) return 'UNAUTHORIZED';
    if (status === Number(HttpStatus.FORBIDDEN)) return 'FORBIDDEN';
    if (status === Number(HttpStatus.NOT_FOUND)) return 'NOT_FOUND';
    if (status === Number(HttpStatus.CONFLICT)) return 'CONFLICT';
    if (status === Number(HttpStatus.BAD_REQUEST)) return 'BAD_REQUEST';
    if (status === Number(HttpStatus.TOO_MANY_REQUESTS)) return 'RATE_LIMITED';
    return 'HTTP_ERROR';
  }
}
