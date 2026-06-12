import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContextData = {
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
};

@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<RequestContextData>();

  run<T>(context: RequestContextData, fn: () => T): T {
    return this.storage.run(context, fn);
  }

  get(): RequestContextData {
    return this.storage.getStore() ?? {};
  }
}
