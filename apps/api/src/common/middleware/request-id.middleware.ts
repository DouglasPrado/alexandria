import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * RequestIdMiddleware — gera UUID v4 para tracing, propaga via AsyncLocalStorage.
 * Fonte: docs/backend/08-middlewares.md (pipeline step #1)
 *
 * - Gera UUID v4 se X-Request-Id nao vier no request
 * - Preserva UUID existente se vier
 * - Seta header X-Request-Id na response
 * - Propaga via AsyncLocalStorage para uso em filters e loggers
 */

const requestIdStorage = new AsyncLocalStorage<string>();

export function getRequestId(): string | undefined {
  return requestIdStorage.getStore();
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-Id', requestId);

    requestIdStorage.run(requestId, () => {
      next();
    });
  }
}
