import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

/**
 * LoggingInterceptor — loga method, path, status e duracao de cada request.
 * Fonte: docs/backend/08-middlewares.md (pipeline step #12)
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const { method, url } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse();
        const duration = Date.now() - start;
        console.log(`${method} ${url} ${res.statusCode} ${duration}ms`);
      }),
    );
  }
}
