import { Logger } from '@nestjs/common';

const logger = new Logger('Sentry');

let initialized = false;

export function initSentryIfConfigured(): void {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn || initialized) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require('@sentry/node') as {
      init: (options: { dsn: string; environment?: string; tracesSampleRate?: number }) => void;
    };
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV ?? 'development',
      tracesSampleRate: 0.1,
    });
    initialized = true;
    logger.log('Sentry inicializado');
  } catch {
    logger.warn('SENTRY_DSN configurado pero @sentry/node no está instalado');
  }
}

export function captureSentryException(error: unknown): void {
  if (!process.env.SENTRY_DSN?.trim()) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require('@sentry/node') as { captureException: (err: unknown) => void };
    Sentry.captureException(error);
  } catch {
    // noop
  }
}
