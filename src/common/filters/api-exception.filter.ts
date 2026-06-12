import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

type ApiErrorBody = {
  code: string;
  message: string;
  details?: unknown;
  statusCode: number;
  timestamp: string;
  path: string;
};

@Catch(HttpException)
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<{ url: string }>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let body: ApiErrorBody;

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

    response.status(status).json(body);
  }

  private codeFromStatus(status: number): string {
    if (status === HttpStatus.UNAUTHORIZED) return 'UNAUTHORIZED';
    if (status === HttpStatus.FORBIDDEN) return 'FORBIDDEN';
    if (status === HttpStatus.NOT_FOUND) return 'NOT_FOUND';
    if (status === HttpStatus.CONFLICT) return 'CONFLICT';
    if (status === HttpStatus.BAD_REQUEST) return 'BAD_REQUEST';
    return 'HTTP_ERROR';
  }
}
