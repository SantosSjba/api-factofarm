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
    const request = ctx.getRequest<{ url: string }>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ApiErrorBody;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const raw = exceptionResponse as Record<string, unknown>;
        body = {
          statusCode: status,
          code: typeof raw.code === 'string' ? raw.code : this.codeFromStatus(status),
          message:
            typeof raw.message === 'string'
              ? raw.message
              : Array.isArray(raw.message)
                ? raw.message.join('; ')
                : exception.message,
          details: raw.details,
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      } else {
        body = {
          statusCode: status,
          code: this.codeFromStatus(status),
          message: exception.message,
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      }
    } else {
      const message =
        exception instanceof Error ? exception.message : 'Error interno del servidor';
      this.logger.error(message, exception instanceof Error ? exception.stack : undefined);
      body = {
        statusCode: status,
        code: 'INTERNAL_ERROR',
        message:
          process.env.NODE_ENV === 'production'
            ? 'Error interno del servidor'
            : message,
        timestamp: new Date().toISOString(),
        path: request.url,
      };
    }

    if (status >= 500 && process.env.SENTRY_DSN) {
      captureSentryException(exception);
      this.logger.error(
        JSON.stringify({
          sentry: true,
          dsnConfigured: true,
          code: body.code,
          path: body.path,
          message: body.message,
        }),
      );
    }

    response.status(status).json(body);
  }

  private codeFromStatus(status: number): string {
    if (status === HttpStatus.UNAUTHORIZED) return 'UNAUTHORIZED';
    if (status === HttpStatus.FORBIDDEN) return 'FORBIDDEN';
    if (status === HttpStatus.NOT_FOUND) return 'NOT_FOUND';
    if (status === HttpStatus.CONFLICT) return 'CONFLICT';
    if (status === HttpStatus.BAD_REQUEST) return 'BAD_REQUEST';
    if (status === HttpStatus.TOO_MANY_REQUESTS) return 'RATE_LIMITED';
    return 'HTTP_ERROR';
  }
}
