import {
  AppError,
  NotFoundError,
  ClusterNotFoundError,
  MemberNotFoundError,
  NodeNotFoundError,
  FileNotFoundError,
  ConflictError,
  MemberAlreadyExistsError,
  DuplicateFileError,
  BusinessRuleError,
  InsufficientNodesError,
  InvalidStateTransitionError,
  InvalidSeedPhraseError,
  FileTooLargeError,
  ClusterFullError,
  ValidationError as AppValidationError,
  AuthenticationError,
  TokenExpiredError,
  InvalidTokenError,
  AuthorizationError,
  InsufficientPermissionsError,
  RateLimitError,
  ServiceUnavailableError,
  InsufficientReplicationError,
  ExternalServiceError,
  StorageProviderError,
  EmailServiceError,
  FFmpegError,
} from '../../src/common/errors';

/**
 * Testes da hierarquia de erros tipados.
 * Fonte: docs/backend/09-errors.md (AppError hierarchy + catalogo de codigos)
 *
 * - Cada erro tem code UPPER_SNAKE_CASE e status HTTP correto
 * - Todos herdam de AppError
 * - message segura para exibir ao usuario
 */

describe('AppError Hierarchy', () => {
  describe('base class', () => {
    it('AppError should have code, status, and message', () => {
      const err = new AppError('INTERNAL_ERROR', 500, 'Erro interno');
      expect(err.code).toBe('INTERNAL_ERROR');
      expect(err.status).toBe(500);
      expect(err.message).toBe('Erro interno');
      expect(err).toBeInstanceOf(Error);
    });
  });

  describe('NotFound errors (404)', () => {
    it.each([
      [ClusterNotFoundError, 'CLUSTER_NOT_FOUND', 'Cluster nao encontrado'],
      [MemberNotFoundError, 'MEMBER_NOT_FOUND', 'Membro nao encontrado'],
      [NodeNotFoundError, 'NODE_NOT_FOUND', 'No de armazenamento nao encontrado'],
      [FileNotFoundError, 'FILE_NOT_FOUND', 'Arquivo nao encontrado'],
    ])('%p should have code %s and status 404', (ErrorClass, expectedCode, expectedMessage) => {
      const err = new ErrorClass();
      expect(err.code).toBe(expectedCode);
      expect(err.status).toBe(404);
      expect(err.message).toBe(expectedMessage);
      expect(err).toBeInstanceOf(NotFoundError);
      expect(err).toBeInstanceOf(AppError);
    });
  });

  describe('Conflict errors (409)', () => {
    it.each([
      [MemberAlreadyExistsError, 'MEMBER_ALREADY_EXISTS', 'Este email ja esta cadastrado no cluster'],
      [DuplicateFileError, 'DUPLICATE_FILE', 'Este arquivo ja existe no cluster'],
    ])('%p should have code %s and status 409', (ErrorClass, expectedCode, expectedMessage) => {
      const err = new ErrorClass();
      expect(err.code).toBe(expectedCode);
      expect(err.status).toBe(409);
      expect(err).toBeInstanceOf(ConflictError);
      expect(err).toBeInstanceOf(AppError);
    });
  });

  describe('Business rule errors (422)', () => {
    it.each([
      [InsufficientNodesError, 'INSUFFICIENT_NODES', 'Nos insuficientes para garantir replicacao'],
      [InvalidStateTransitionError, 'INVALID_STATE_TRANSITION', 'Transicao de estado invalida'],
      [InvalidSeedPhraseError, 'INVALID_SEED_PHRASE', 'Seed phrase invalida'],
      [FileTooLargeError, 'FILE_TOO_LARGE', 'Arquivo excede o tamanho maximo permitido'],
      [ClusterFullError, 'CLUSTER_FULL', 'Cluster atingiu o limite maximo'],
    ])('%p should have code %s and status 422', (ErrorClass, expectedCode, expectedMessage) => {
      const err = new ErrorClass();
      expect(err.code).toBe(expectedCode);
      expect(err.status).toBe(422);
      expect(err).toBeInstanceOf(BusinessRuleError);
      expect(err).toBeInstanceOf(AppError);
    });
  });

  describe('Auth errors (401)', () => {
    it.each([
      [TokenExpiredError, 'TOKEN_EXPIRED', 'Sua sessao expirou, faca login novamente'],
      [InvalidTokenError, 'INVALID_TOKEN', 'Token de autenticacao invalido'],
    ])('%p should have code %s and status 401', (ErrorClass, expectedCode, expectedMessage) => {
      const err = new ErrorClass();
      expect(err.code).toBe(expectedCode);
      expect(err.status).toBe(401);
      expect(err).toBeInstanceOf(AuthenticationError);
      expect(err).toBeInstanceOf(AppError);
    });
  });

  describe('Authorization errors (403)', () => {
    it('InsufficientPermissionsError should have code and status 403', () => {
      const err = new InsufficientPermissionsError();
      expect(err.code).toBe('INSUFFICIENT_PERMISSIONS');
      expect(err.status).toBe(403);
      expect(err).toBeInstanceOf(AuthorizationError);
    });
  });

  describe('Rate limit (429)', () => {
    it('RateLimitError should have code and status 429', () => {
      const err = new RateLimitError();
      expect(err.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(err.status).toBe(429);
    });
  });

  describe('External service errors (502)', () => {
    it.each([
      [StorageProviderError, 'STORAGE_PROVIDER_ERROR', 'Erro no provedor de armazenamento'],
      [EmailServiceError, 'EMAIL_SERVICE_ERROR', 'Erro ao enviar email'],
      [FFmpegError, 'FFMPEG_ERROR', 'Erro ao processar midia'],
    ])('%p should have code %s and status 502', (ErrorClass, expectedCode) => {
      const err = new ErrorClass();
      expect(err.code).toBe(expectedCode);
      expect(err.status).toBe(502);
      expect(err).toBeInstanceOf(ExternalServiceError);
    });
  });

  describe('Service unavailable (503)', () => {
    it('InsufficientReplicationError should have code and status 503', () => {
      const err = new InsufficientReplicationError();
      expect(err.code).toBe('INSUFFICIENT_REPLICATION');
      expect(err.status).toBe(503);
      expect(err).toBeInstanceOf(ServiceUnavailableError);
    });
  });

  describe('custom message override', () => {
    it('should allow custom message on any error', () => {
      const err = new ClusterNotFoundError('Cluster XYZ nao existe');
      expect(err.message).toBe('Cluster XYZ nao existe');
      expect(err.code).toBe('CLUSTER_NOT_FOUND');
    });
  });
});
