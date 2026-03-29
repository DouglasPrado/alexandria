import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { getRequestId } from '../middleware/request-id.middleware';
import { AppError } from '../errors';

/**
 * GlobalExceptionFilter — catch-all que padroniza todas as respostas de erro.
 * Fonte: docs/backend/09-errors.md (formato padrao de erro)
 * Fonte: docs/backend/08-middlewares.md (pipeline step #11)
 *
 * Formato:
 * { error: { code, message, status, details, requestId, timestamp } }
 */

const STATUS_CODE_MAP: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'VALIDATION_ERROR',
  [HttpStatus.UNAUTHORIZED]: 'INVALID_TOKEN',
  [HttpStatus.FORBIDDEN]: 'INSUFFICIENT_PERMISSIONS',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'DUPLICATE_RESOURCE',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'INVALID_STATE_TRANSITION',
  [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMIT_EXCEEDED',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_ERROR',
  [HttpStatus.BAD_GATEWAY]: 'EXTERNAL_SERVICE_ERROR',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const requestId = getRequestId() ?? request.headers?.['x-request-id'] ?? null;
    const timestamp = new Date().toISOString();

    let status: number;
    let code: string;
    let message: string;
    let details: unknown[] | null = null;

    if (exception instanceof AppError) {
      status = exception.status;
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = STATUS_CODE_MAP[status] || 'INTERNAL_ERROR';

      const exceptionResponse = exception.getResponse();

      if (status === HttpStatus.BAD_REQUEST && typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        message = 'Campos invalidos na requisicao';

        if (Array.isArray(resp.message)) {
          details = (resp.message as string[]).map((msg) => ({ message: msg }));
        } else {
          details = [{ message: typeof resp.message === 'string' ? resp.message : String(exception.message) }];
        }
      } else {
        message = typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as Record<string, unknown>).message as string || exception.message;
      }
    } else if (this.isPrismaError(exception)) {
      const prismaResult = this.mapPrismaError(exception);
      status = prismaResult.status;
      code = prismaResult.code;
      message = prismaResult.message;
      this.logger.warn(
        `Prisma error [${(exception as any).code}]: ${exception instanceof Error ? exception.message : String(exception)}`,
      );
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = 'INTERNAL_ERROR';
      message = 'Erro interno do servidor';
      this.logger.error(
        `Unhandled exception: ${exception instanceof Error ? exception.message : String(exception)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json({
      error: {
        code,
        message,
        status,
        details,
        requestId,
        timestamp,
      },
    });
  }

  private isPrismaError(exception: unknown): boolean {
    if (!(exception instanceof Error)) return false;
    const code = (exception as any).code;
    if (typeof code !== 'string' || !code.startsWith('P')) return false;
    const name = exception.name ?? exception.constructor?.name ?? '';
    return name.startsWith('PrismaClient');
  }

  private mapPrismaError(exception: unknown): { status: number; code: string; message: string } {
    const prismaCode = (exception as any).code as string;
    const meta = (exception as any).meta as Record<string, unknown> | undefined;

    switch (prismaCode) {
      case 'P2002': {
        const fields = Array.isArray(meta?.target) ? (meta.target as string[]).join(', ') : 'campo';
        return { status: HttpStatus.CONFLICT, code: 'DUPLICATE_RESOURCE', message: `Recurso ja existe (${fields})` };
      }
      case 'P2025':
        return { status: HttpStatus.NOT_FOUND, code: 'NOT_FOUND', message: 'Recurso nao encontrado' };
      case 'P2003': {
        const field = meta?.field_name ?? 'referencia';
        return { status: HttpStatus.BAD_REQUEST, code: 'VALIDATION_ERROR', message: `Referencia invalida: ${field}` };
      }
      default:
        return { status: HttpStatus.INTERNAL_SERVER_ERROR, code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' };
    }
  }
}
