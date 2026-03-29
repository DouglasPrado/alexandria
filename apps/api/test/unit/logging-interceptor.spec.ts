import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { LoggingInterceptor } from '../../src/common/interceptors/logging.interceptor';

/**
 * Testes do LoggingInterceptor — loga status, duracao e response size.
 * Fonte: docs/backend/08-middlewares.md (pipeline step #12)
 */

function createMockContext(method = 'GET', url = '/api/test'): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ method, url }),
      getResponse: () => ({ statusCode: 200 }),
    }),
    getHandler: () => ({}),
    getClass: () => ({ name: 'TestController' }),
  } as unknown as ExecutionContext;
}

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
    logSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('should call next.handle() and return the response', (done) => {
    const ctx = createMockContext();
    const next: CallHandler = { handle: () => of({ data: 'ok' }) };

    interceptor.intercept(ctx, next).subscribe((result) => {
      expect(result).toEqual({ data: 'ok' });
      done();
    });
  });

  it('should log request method, url, status and duration', (done) => {
    const ctx = createMockContext('POST', '/api/files/upload');
    const next: CallHandler = { handle: () => of({ id: '123' }) };

    interceptor.intercept(ctx, next).subscribe(() => {
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('POST'),
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/files/upload'),
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('ms'),
      );
      done();
    });
  });
});
