import {
  ArgumentsHost,
  HttpException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
  UnprocessableEntityException,
  HttpStatus,
} from '@nestjs/common';
import { GlobalExceptionFilter } from '../../src/common/filters/global-exception.filter';
import { ClusterNotFoundError, InsufficientNodesError } from '../../src/common/errors';

/**
 * Testes do GlobalExceptionFilter — catch-all para padronizar respostas de erro.
 * Fonte: docs/backend/09-errors.md (formato padrao de erro)
 * Fonte: docs/backend/08-middlewares.md (pipeline step #11)
 *
 * Formato esperado:
 * { error: { code, message, status, details, requestId, timestamp } }
 *
 * Regras:
 * - code: UPPER_SNAKE_CASE
 * - message: segura para exibir ao usuario
 * - details: somente em erros de validacao (400), null para demais
 * - requestId: do header X-Request-Id
 * - Stack trace NUNCA em producao
 */

function createMockHost(requestId?: string) {
  const mockJson = jest.fn();
  const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
  const mockGetRequest = jest.fn().mockReturnValue({
    headers: requestId ? { 'x-request-id': requestId } : {},
  });
  const mockGetResponse = jest.fn().mockReturnValue({ status: mockStatus });
  const mockHttpArgumentsHost = jest.fn().mockReturnValue({
    getRequest: mockGetRequest,
    getResponse: mockGetResponse,
  });

  return {
    switchToHttp: mockHttpArgumentsHost,
    getType: jest.fn().mockReturnValue('http'),
    getArgByIndex: jest.fn(),
    getArgs: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
    json: mockJson,
    status: mockStatus,
  } as unknown as ArgumentsHost & { json: jest.Mock; status: jest.Mock };
}

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('error response format', () => {
    it('should return standardized error format with code, message, status, details, requestId, timestamp', () => {
      const host = createMockHost('req-123');
      const exception = new NotFoundException('Cluster nao encontrado');

      filter.catch(exception, host);

      expect(host.status).toHaveBeenCalledWith(404);
      expect(host.json).toHaveBeenCalledWith({
        error: expect.objectContaining({
          code: expect.any(String),
          message: 'Cluster nao encontrado',
          status: 404,
          details: null,
          requestId: 'req-123',
          timestamp: expect.any(String),
        }),
      });
    });

    it('should use ISO 8601 timestamp', () => {
      const host = createMockHost();
      filter.catch(new NotFoundException('test'), host);

      const { timestamp } = host.json.mock.calls[0][0].error;
      expect(() => new Date(timestamp)).not.toThrow();
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should set requestId to null when X-Request-Id header is absent', () => {
      const host = createMockHost();
      filter.catch(new NotFoundException('test'), host);

      expect(host.json.mock.calls[0][0].error.requestId).toBeNull();
    });
  });

  describe('HTTP exception mapping', () => {
    it('should map NotFoundException to NOT_FOUND code', () => {
      const host = createMockHost();
      filter.catch(new NotFoundException('No nao encontrado'), host);

      expect(host.status).toHaveBeenCalledWith(404);
      expect(host.json.mock.calls[0][0].error.code).toBe('NOT_FOUND');
    });

    it('should map ForbiddenException to INSUFFICIENT_PERMISSIONS code', () => {
      const host = createMockHost();
      filter.catch(new ForbiddenException('Sem permissao'), host);

      expect(host.status).toHaveBeenCalledWith(403);
      expect(host.json.mock.calls[0][0].error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should map UnauthorizedException to INVALID_TOKEN code', () => {
      const host = createMockHost();
      filter.catch(new UnauthorizedException('Token invalido'), host);

      expect(host.status).toHaveBeenCalledWith(401);
      expect(host.json.mock.calls[0][0].error.code).toBe('INVALID_TOKEN');
    });

    it('should map UnprocessableEntityException to INVALID_STATE_TRANSITION code', () => {
      const host = createMockHost();
      filter.catch(new UnprocessableEntityException('Estado invalido'), host);

      expect(host.status).toHaveBeenCalledWith(422);
      expect(host.json.mock.calls[0][0].error.code).toBe('INVALID_STATE_TRANSITION');
    });
  });

  describe('validation errors (400)', () => {
    it('should extract field-level details from ValidationPipe response', () => {
      const host = createMockHost();
      const exception = new BadRequestException({
        statusCode: 400,
        message: ['email must be an email', 'name must be longer than or equal to 2 characters'],
        error: 'Bad Request',
      });

      filter.catch(exception, host);

      expect(host.status).toHaveBeenCalledWith(400);
      const error = host.json.mock.calls[0][0].error;
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Campos invalidos na requisicao');
      expect(error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ message: expect.any(String) }),
        ]),
      );
    });

    it('should handle BadRequestException with string message', () => {
      const host = createMockHost();
      filter.catch(new BadRequestException('Campo invalido'), host);

      expect(host.status).toHaveBeenCalledWith(400);
      const error = host.json.mock.calls[0][0].error;
      expect(error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('unknown errors (500)', () => {
    it('should catch non-HTTP exceptions as INTERNAL_ERROR', () => {
      const host = createMockHost();
      filter.catch(new Error('unexpected crash'), host);

      expect(host.status).toHaveBeenCalledWith(500);
      const error = host.json.mock.calls[0][0].error;
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.message).toBe('Erro interno do servidor');
      expect(error.details).toBeNull();
    });

    it('should catch non-Error objects as INTERNAL_ERROR', () => {
      const host = createMockHost();
      filter.catch('string error', host);

      expect(host.status).toHaveBeenCalledWith(500);
      expect(host.json.mock.calls[0][0].error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('stack trace protection', () => {
    it('should NOT include stack trace in production', () => {
      process.env.NODE_ENV = 'production';
      const host = createMockHost();
      filter.catch(new Error('crash'), host);

      const response = host.json.mock.calls[0][0];
      expect(JSON.stringify(response)).not.toContain('stack');
      expect(JSON.stringify(response)).not.toContain('at ');
    });

    it('should NOT include stack trace in any environment (security by default)', () => {
      process.env.NODE_ENV = 'development';
      const host = createMockHost();
      filter.catch(new Error('crash'), host);

      const response = host.json.mock.calls[0][0];
      expect(response.error.stack).toBeUndefined();
    });
  });

  describe('ConflictException (409)', () => {
    it('should map to DUPLICATE_RESOURCE code', () => {
      const host = createMockHost();
      const { ConflictException } = require('@nestjs/common');
      filter.catch(new ConflictException('Email ja existe'), host);

      expect(host.status).toHaveBeenCalledWith(409);
      expect(host.json.mock.calls[0][0].error.code).toBe('DUPLICATE_RESOURCE');
    });
  });

  describe('AppError integration', () => {
    it('should use code and status from AppError subclass', () => {
      const host = createMockHost('req-456');
      filter.catch(new ClusterNotFoundError(), host);

      expect(host.status).toHaveBeenCalledWith(404);
      const error = host.json.mock.calls[0][0].error;
      expect(error.code).toBe('CLUSTER_NOT_FOUND');
      expect(error.message).toBe('Cluster nao encontrado');
      expect(error.requestId).toBe('req-456');
    });

    it('should use custom message from AppError', () => {
      const host = createMockHost();
      filter.catch(new InsufficientNodesError('Precisa de 3 nos'), host);

      expect(host.status).toHaveBeenCalledWith(422);
      expect(host.json.mock.calls[0][0].error.code).toBe('INSUFFICIENT_NODES');
      expect(host.json.mock.calls[0][0].error.message).toBe('Precisa de 3 nos');
    });
  });

  describe('ServiceUnavailableException (503)', () => {
    it('should map to SERVICE_UNAVAILABLE code', () => {
      const host = createMockHost();
      const { ServiceUnavailableException } = require('@nestjs/common');
      filter.catch(new ServiceUnavailableException('Replicacao insuficiente'), host);

      expect(host.status).toHaveBeenCalledWith(503);
      expect(host.json.mock.calls[0][0].error.code).toBe('SERVICE_UNAVAILABLE');
    });
  });

  describe('Prisma errors', () => {
    it('should map P2002 (unique constraint) to 409 DUPLICATE_RESOURCE', () => {
      const host = createMockHost();
      const error = new Error('Unique constraint failed on the fields: (`email`)');
      (error as any).code = 'P2002';
      (error as any).meta = { target: ['email'] };
      error.name = 'PrismaClientKnownRequestError';

      filter.catch(error, host);

      expect(host.status).toHaveBeenCalledWith(409);
      const body = host.json.mock.calls[0][0].error;
      expect(body.code).toBe('DUPLICATE_RESOURCE');
      expect(body.message).toContain('email');
    });

    it('should map P2025 (record not found) to 404 NOT_FOUND', () => {
      const host = createMockHost();
      const error = new Error('Record to update not found');
      (error as any).code = 'P2025';
      error.name = 'PrismaClientKnownRequestError';

      filter.catch(error, host);

      expect(host.status).toHaveBeenCalledWith(404);
      expect(host.json.mock.calls[0][0].error.code).toBe('NOT_FOUND');
    });

    it('should map P2003 (foreign key constraint) to 400 VALIDATION_ERROR', () => {
      const host = createMockHost();
      const error = new Error('Foreign key constraint failed on the field: `owner_id`');
      (error as any).code = 'P2003';
      (error as any).meta = { field_name: 'owner_id' };
      error.name = 'PrismaClientKnownRequestError';

      filter.catch(error, host);

      expect(host.status).toHaveBeenCalledWith(400);
      expect(host.json.mock.calls[0][0].error.code).toBe('VALIDATION_ERROR');
    });

    it('should map unknown Prisma error codes to 500 INTERNAL_ERROR', () => {
      const host = createMockHost();
      const error = new Error('Some prisma error');
      (error as any).code = 'P9999';
      error.name = 'PrismaClientKnownRequestError';

      filter.catch(error, host);

      expect(host.status).toHaveBeenCalledWith(500);
      expect(host.json.mock.calls[0][0].error.code).toBe('INTERNAL_ERROR');
    });
  });
});
