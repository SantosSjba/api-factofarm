import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { RequestContextService } from '../services/request-context.service';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly context: RequestContextService) {}

  use(req: Request, _res: Response, next: NextFunction): void {
    const forwarded = req.headers['x-forwarded-for'];
    const ip =
      (typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : undefined) ??
      req.ip ??
      req.socket.remoteAddress;
    const userAgent =
      typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;
    const rawRequestId =
      typeof req.headers['x-request-id'] === 'string' ? req.headers['x-request-id'] : req.id;
    const requestId = rawRequestId != null ? String(rawRequestId) : undefined;

    this.context.run({ ipAddress: ip, userAgent, requestId }, () => next());
  }
}
