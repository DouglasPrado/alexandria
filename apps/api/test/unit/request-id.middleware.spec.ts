import { RequestIdMiddleware, getRequestId } from '../../src/common/middleware/request-id.middleware';

/**
 * Testes do RequestIdMiddleware — gera UUID v4, seta header X-Request-Id.
 * Fonte: docs/backend/08-middlewares.md (pipeline step #1)
 *
 * - Gera UUID v4 se nao vier no request
 * - Preserva UUID do request se ja existir
 * - Seta header X-Request-Id na response
 * - Disponibiliza via getRequestId() (AsyncLocalStorage)
 */

function createMockReqRes(existingRequestId?: string) {
  const req = {
    headers: existingRequestId ? { 'x-request-id': existingRequestId } : {},
  };
  const res = {
    setHeader: jest.fn(),
  };
  const next = jest.fn();
  return { req, res, next };
}

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('RequestIdMiddleware', () => {
  let middleware: RequestIdMiddleware;

  beforeEach(() => {
    middleware = new RequestIdMiddleware();
  });

  it('should generate UUID v4 when X-Request-Id header is absent', () => {
    const { req, res, next } = createMockReqRes();

    middleware.use(req as any, res as any, next);

    expect(req.headers['x-request-id']).toMatch(UUID_V4_REGEX);
    expect(next).toHaveBeenCalled();
  });

  it('should preserve existing X-Request-Id from incoming request', () => {
    const { req, res, next } = createMockReqRes('existing-id-123');

    middleware.use(req as any, res as any, next);

    expect(req.headers['x-request-id']).toBe('existing-id-123');
  });

  it('should set X-Request-Id header on response', () => {
    const { req, res, next } = createMockReqRes();

    middleware.use(req as any, res as any, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'X-Request-Id',
      req.headers['x-request-id'],
    );
  });

  it('should set response header with existing request id', () => {
    const { req, res, next } = createMockReqRes('my-trace-id');

    middleware.use(req as any, res as any, next);

    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', 'my-trace-id');
  });

  it('should call next() to continue pipeline', () => {
    const { req, res, next } = createMockReqRes();

    middleware.use(req as any, res as any, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should make requestId available via getRequestId() within the async context', (done) => {
    const { req, res, next: _next } = createMockReqRes();

    // Override next to check async context
    const next = jest.fn(() => {
      const id = getRequestId();
      expect(id).toBe(req.headers['x-request-id']);
      done();
    });

    middleware.use(req as any, res as any, next);
  });
});
