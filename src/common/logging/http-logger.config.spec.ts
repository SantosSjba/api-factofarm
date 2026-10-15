import { ConfigService } from '@nestjs/config';
import { createServer } from 'node:http';
import { Writable } from 'node:stream';
import pinoHttp from 'pino-http';
import request from 'supertest';
import {
  createHttpLoggerOptions,
  safeError,
  safeRequestId,
} from './http-logger.config';

describe('Logs HTTP con Pino', () => {
  function setup() {
    const lines: string[] = [];
    const stream = new Writable({
      write(chunk: Buffer, _encoding, done) {
        lines.push(chunk.toString());
        done();
      },
    });
    const options = createHttpLoggerOptions(
      new ConfigService({ NODE_ENV: 'production', LOG_LEVEL: 'info' }),
    );
    const logger = pinoHttp(options, stream);
    const server = createServer((req, res) => {
      logger(req, res);
      if (req.url?.startsWith('/failure')) {
        res.statusCode = 500;
        res.err = new Error('SQL password=private-token');
      }
      if (req.url?.startsWith('/rejected')) {
        res.statusCode = 400;
        res.err = new Error('invalid input');
      }
      if (req.url?.startsWith('/secrets'))
        req.log.info(
          { password: 'top-secret', user: { refreshToken: 'refresh-secret' } },
          'Evento de prueba',
        );
      res.setHeader('Set-Cookie', 'session=cookie-secret');
      res.end('ok');
    });
    return { server, lines };
  }
  it('correlaciona solicitudes sin registrar tokens, cuerpos, cabeceras ni query strings', async () => {
    const { server, lines } = setup();
    const response = await request(server)
      .post('/secrets?token=query-secret')
      .set('X-Request-Id', 'audit-123')
      .set('Authorization', 'Bearer auth-secret')
      .send({ password: 'body-secret' })
      .expect(200);
    expect(response.headers['x-request-id']).toBe('audit-123');
    const output = lines.join('');
    for (const secret of [
      'query-secret',
      'auth-secret',
      'body-secret',
      'top-secret',
      'refresh-secret',
      'cookie-secret',
    ])
      expect(output).not.toContain(secret);
    const record = JSON.parse(lines[lines.length - 1]) as {
      requestId: string;
      req: { path: string };
      level: number;
    };
    expect(record.requestId).toBe('audit-123');
    expect(record.req.path).toBe('/secrets');
    expect(record.level).toBe(30);
  });
  it.each([
    ['/rejected', 400, 40],
    ['/failure', 500, 50],
  ])(
    'usa severidad adecuada para %s y elimina contenido del error',
    async (path, status, level) => {
      const { server, lines } = setup();
      await request(server).get(path).expect(status);
      const record = JSON.parse(lines[lines.length - 1]) as { level: number };
      expect(record.level).toBe(level);
      expect(lines.join('')).not.toContain('private-token');
    },
  );
  it('omite ruido de comprobaciones de salud', async () => {
    const { server, lines } = setup();
    await request(server).get('/api/v1/health/ready').expect(200);
    expect(lines).toHaveLength(0);
  });
  it('reemplaza identificadores inválidos y conserva únicamente los frames del error', () => {
    expect(safeRequestId('valid_123')).toBe('valid_123');
    for (const value of [
      undefined,
      {},
      ['one', 'two'],
      'a'.repeat(129),
      'bad\nheader',
    ])
      expect(safeRequestId(value)).toMatch(/^[a-f0-9-]{36}$/);
    const error = new Error('secret payload');
    error.stack =
      'Error: secret payload\nquery: secret SQL\n    at handler (/app/example.ts:1:2)';
    expect(safeError(error)).toEqual({
      type: 'Error',
      code: undefined,
      stack: '    at handler (/app/example.ts:1:2)',
    });
  });
});
