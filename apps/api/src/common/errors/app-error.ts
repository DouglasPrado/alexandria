/**
 * AppError — classe base para todos os erros tipados do Alexandria.
 * Fonte: docs/backend/09-errors.md (hierarquia de excecoes)
 *
 * Cada subclasse define code (UPPER_SNAKE_CASE) e status HTTP.
 * O GlobalExceptionFilter usa essas propriedades para formatar a resposta.
 */
export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// --- 400 Validation ---
export class ValidationError extends AppError {
  constructor(message = 'Campos invalidos na requisicao') {
    super('VALIDATION_ERROR', 400, message);
  }
}

// --- 401 Authentication ---
export class AuthenticationError extends AppError {
  constructor(code = 'INVALID_TOKEN', message = 'Token de autenticacao invalido') {
    super(code, 401, message);
  }
}

export class TokenExpiredError extends AuthenticationError {
  constructor(message = 'Sua sessao expirou, faca login novamente') {
    super('TOKEN_EXPIRED', message);
  }
}

export class InvalidTokenError extends AuthenticationError {
  constructor(message = 'Token de autenticacao invalido') {
    super('INVALID_TOKEN', message);
  }
}

// --- 403 Authorization ---
export class AuthorizationError extends AppError {
  constructor(code = 'INSUFFICIENT_PERMISSIONS', message = 'Voce nao tem permissao para esta acao') {
    super(code, 403, message);
  }
}

export class InsufficientPermissionsError extends AuthorizationError {
  constructor(message = 'Voce nao tem permissao para esta acao') {
    super('INSUFFICIENT_PERMISSIONS', message);
  }
}

// --- 404 Not Found ---
export class NotFoundError extends AppError {
  constructor(code = 'NOT_FOUND', message = 'Recurso nao encontrado') {
    super(code, 404, message);
  }
}

export class ClusterNotFoundError extends NotFoundError {
  constructor(message = 'Cluster nao encontrado') {
    super('CLUSTER_NOT_FOUND', message);
  }
}

export class MemberNotFoundError extends NotFoundError {
  constructor(message = 'Membro nao encontrado') {
    super('MEMBER_NOT_FOUND', message);
  }
}

export class NodeNotFoundError extends NotFoundError {
  constructor(message = 'No de armazenamento nao encontrado') {
    super('NODE_NOT_FOUND', message);
  }
}

export class FileNotFoundError extends NotFoundError {
  constructor(message = 'Arquivo nao encontrado') {
    super('FILE_NOT_FOUND', message);
  }
}

// --- 409 Conflict ---
export class ConflictError extends AppError {
  constructor(code = 'DUPLICATE_RESOURCE', message = 'Recurso ja existe') {
    super(code, 409, message);
  }
}

export class MemberAlreadyExistsError extends ConflictError {
  constructor(message = 'Este email ja esta cadastrado no cluster') {
    super('MEMBER_ALREADY_EXISTS', message);
  }
}

export class InviteAlreadyExistsError extends ConflictError {
  constructor(message = 'Convite ja enviado para este email') {
    super('INVITE_ALREADY_EXISTS', message);
  }
}

export class DuplicateFileError extends ConflictError {
  constructor(message = 'Este arquivo ja existe no cluster') {
    super('DUPLICATE_FILE', message);
  }
}

// --- 422 Business Rule ---
export class BusinessRuleError extends AppError {
  constructor(code = 'BUSINESS_RULE_ERROR', message = 'Regra de negocio violada') {
    super(code, 422, message);
  }
}

export class InsufficientNodesError extends BusinessRuleError {
  constructor(message = 'Nos insuficientes para garantir replicacao') {
    super('INSUFFICIENT_NODES', message);
  }
}

export class InvalidStateTransitionError extends BusinessRuleError {
  constructor(message = 'Transicao de estado invalida') {
    super('INVALID_STATE_TRANSITION', message);
  }
}

export class InvalidSeedPhraseError extends BusinessRuleError {
  constructor(message = 'Seed phrase invalida') {
    super('INVALID_SEED_PHRASE', message);
  }
}

export class FileTooLargeError extends BusinessRuleError {
  constructor(message = 'Arquivo excede o tamanho maximo permitido') {
    super('FILE_TOO_LARGE', message);
  }
}

export class ClusterFullError extends BusinessRuleError {
  constructor(message = 'Cluster atingiu o limite maximo') {
    super('CLUSTER_FULL', message);
  }
}

// --- 429 Rate Limit ---
export class RateLimitError extends AppError {
  constructor(message = 'Muitas requisicoes, tente novamente em breve') {
    super('RATE_LIMIT_EXCEEDED', 429, message);
  }
}

// --- 502 External Service ---
export class ExternalServiceError extends AppError {
  constructor(code = 'EXTERNAL_SERVICE_ERROR', message = 'Erro em servico externo') {
    super(code, 502, message);
  }
}

export class StorageProviderError extends ExternalServiceError {
  constructor(message = 'Erro no provedor de armazenamento') {
    super('STORAGE_PROVIDER_ERROR', message);
  }
}

export class EmailServiceError extends ExternalServiceError {
  constructor(message = 'Erro ao enviar email') {
    super('EMAIL_SERVICE_ERROR', message);
  }
}

export class FFmpegError extends ExternalServiceError {
  constructor(message = 'Erro ao processar midia') {
    super('FFMPEG_ERROR', message);
  }
}

// --- 503 Service Unavailable ---
export class ServiceUnavailableError extends AppError {
  constructor(code = 'SERVICE_UNAVAILABLE', message = 'Servico indisponivel') {
    super(code, 503, message);
  }
}

export class InsufficientReplicationError extends ServiceUnavailableError {
  constructor(message = 'Replicacao insuficiente, tente novamente') {
    super('INSUFFICIENT_REPLICATION', message);
  }
}
