# Erros e Excecoes

Define a hierarquia de excecoes, formato padrao de erro, catalogo de codigos e estrategia de tratamento.

> **Consumido por:** [docs/shared/error-ux-mapping.md](../shared/error-ux-mapping.md) (como o frontend trata cada erro).

<!-- do blueprint: 13-security.md, 15-observability.md -->

---

## Formato Padrao de Erro

> Todo erro retornado pela API segue este formato JSON.

```json
{
  "error": {
    "code": "CLUSTER_NOT_FOUND",
    "message": "Cluster nao encontrado",
    "status": 404,
    "details": null,
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-03-24T14:30:00.000Z"
  }
}
```

**Exemplo com validacao (400):**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Campos invalidos na requisicao",
    "status": 400,
    "details": [
      { "field": "email", "message": "Email em formato invalido" },
      { "field": "name", "message": "Nome deve ter entre 2 e 100 caracteres" }
    ],
    "requestId": "550e8400-e29b-41d4-a716-446655440001",
    "timestamp": "2026-03-24T14:30:00.000Z"
  }
}
```

**Regras:**

- `code` e sempre UPPER_SNAKE_CASE
- `message` e sempre em portugues e segura para exibir ao usuario
- `details` so aparece em erros de validacao (400) — para outros status e `null`
- `requestId` vem do middleware RequestId (UUID v4)
- Stack trace NUNCA aparece em producao

---

## Hierarquia de Excecoes

> Toda excecao herda de AppError. Cada tipo mapeia para um status HTTP.

```
AppError (base)
├── ValidationError (400)
│   ├── InvalidFieldError
│   └── MissingFieldError
├── AuthenticationError (401)
│   ├── TokenExpiredError
│   └── InvalidTokenError
├── AuthorizationError (403)
│   ├── InsufficientPermissionsError
│   └── InsufficientRoleError
├── NotFoundError (404)
│   ├── ClusterNotFoundError
│   ├── MemberNotFoundError
│   ├── NodeNotFoundError
│   ├── FileNotFoundError
│   └── ChunkNotFoundError
├── ConflictError (409)
│   ├── MemberAlreadyExistsError
│   ├── InviteAlreadyExistsError
│   └── DuplicateFileError
├── BusinessRuleError (422)
│   ├── InsufficientNodesError (< 1 no para replicacao)
│   ├── InvalidStateTransitionError
│   ├── InvalidSeedPhraseError
│   ├── FileTooLargeError
│   └── ClusterFullError (max 10 membros ou 50 nos)
├── RateLimitError (429)
├── ServiceUnavailableError (503)
│   └── InsufficientReplicationError
└── ExternalServiceError (502)
    ├── StorageProviderError
    ├── EmailServiceError
    └── FFmpegError
```

---

## Catalogo de Codigos de Erro

> Cada codigo e unico e documentado. Frontend usa o `code` para decidir como exibir o erro.

| Codigo                   | Status | Mensagem                                     | Quando                                                           | Retentavel                                        |
| ------------------------ | ------ | -------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------- |
| VALIDATION_ERROR         | 400    | Campos invalidos na requisicao               | ValidationPipe rejeita body/params/query                         | Nao                                               |
| TOKEN_EXPIRED            | 401    | Sua sessao expirou, faca login novamente     | JWT com mais de 24h                                              | Sim (re-login)                                    |
| INVALID_TOKEN            | 401    | Token de autenticacao invalido               | JWT malformado, assinatura invalida ou ausente                   | Nao                                               |
| INSUFFICIENT_PERMISSIONS | 403    | Voce nao tem permissao para esta acao        | Role do membro nao tem acesso a rota                             | Nao                                               |
| CLUSTER_NOT_FOUND        | 404    | Cluster nao encontrado                       | ID de cluster inexistente                                        | Nao                                               |
| MEMBER_NOT_FOUND         | 404    | Membro nao encontrado                        | ID de membro inexistente                                         | Nao                                               |
| NODE_NOT_FOUND           | 404    | No de armazenamento nao encontrado           | ID de no inexistente                                             | Nao                                               |
| FILE_NOT_FOUND           | 404    | Arquivo nao encontrado                       | ID de arquivo inexistente ou chunk perdido                       | Nao                                               |
| MEMBER_ALREADY_EXISTS    | 409    | Este email ja esta cadastrado no cluster     | Email duplicado ao aceitar convite                               | Nao                                               |
| DUPLICATE_FILE           | 409    | Este arquivo ja existe no cluster            | Hash SHA-256 identico a arquivo existente                        | Nao                                               |
| INSUFFICIENT_NODES       | 422    | Nos insuficientes para garantir replicacao   | Menos de 1 no ativo no cluster                                   | Nao (admin deve adicionar nos)                    |
| INVALID_SEED_PHRASE      | 422    | Seed phrase invalida                         | Seed nao tem 12 palavras ou palavras fora do BIP-39              | Nao                                               |
| FILE_TOO_LARGE           | 422    | Arquivo excede o tamanho maximo permitido    | Arquivo ultrapassa limite do mediaType                           | Nao                                               |
| CLUSTER_FULL             | 422    | Cluster atingiu o limite maximo              | Mais de 10 membros ou 50 nos                                     | Nao                                               |
| INVALID_STATE_TRANSITION | 422    | Transicao de estado invalida                 | Ex: drenar no que ja esta offline                                | Nao                                               |
| RATE_LIMIT_EXCEEDED      | 429    | Muitas requisicoes, tente novamente em breve | Rate limit atingido (ver [08-middlewares.md](08-middlewares.md)) | Sim (apos cooldown indicado em X-RateLimit-Reset) |
| INSUFFICIENT_REPLICATION | 503    | Replicacao insuficiente, tente novamente     | Nao foi possivel replicar chunk em 3 nos                         | Sim (retry automatico)                            |
| STORAGE_PROVIDER_ERROR   | 502    | Erro no provedor de armazenamento            | S3/R2/B2 retornou erro ou timeout                                | Sim (retry com backoff)                           |
| EMAIL_SERVICE_ERROR      | 502    | Erro ao enviar email                         | Servico de email falhou                                          | Sim (retry com backoff)                           |
| FFMPEG_ERROR             | 502    | Erro ao processar midia                      | FFmpeg falhou na transcodificacao                                | Sim (retry)                                       |
| INTERNAL_ERROR           | 500    | Erro interno do servidor                     | Erro nao tratado — bug ou falha inesperada                       | Sim (reportar se persistir)                       |

---

## Estrategia de Tratamento

> Como diferentes tipos de erro sao tratados?

| Tipo de Erro           | Onde Tratar                                            | Logar               | Alertar                                                   | Retry                                             |
| ---------------------- | ------------------------------------------------------ | ------------------- | --------------------------------------------------------- | ------------------------------------------------- |
| Validacao (400)        | ValidationPipe — retorna antes de chegar ao controller | Debug               | Nao                                                       | Nao — usuario corrige input                       |
| Autenticacao (401)     | JwtAuthGuard — rejeita no middleware                   | Warn                | Se > 10 tentativas/min por IP (possivel brute force)      | Nao — usuario faz re-login                        |
| Autorizacao (403)      | RolesGuard — rejeita no middleware                     | Warn                | Se admin tenta acessar rota inexistente (possivel ataque) | Nao — role insuficiente                           |
| Nao encontrado (404)   | Service — lanca excecao tipada                         | Info                | Nao                                                       | Nao                                               |
| Conflito (409)         | Service — verifica unicidade antes de persistir        | Info                | Nao                                                       | Nao                                               |
| Regra de negocio (422) | Service — valida invariantes do dominio                | Info                | InsufficientNodes e ClusterFull geram alerta ao admin     | Nao                                               |
| Rate limit (429)       | ThrottlerGuard — rejeita no middleware                 | Warn                | Se > 50 bloqueios/min (possivel abuso)                    | Sim — apos cooldown                               |
| Servico externo (502)  | Infrastructure layer — client HTTP com retry           | Error               | Se taxa de falha > 5% em 5 min                            | Sim — backoff exponencial (3 tentativas, base 1s) |
| Replicacao (503)       | Service — verifica replicas apos distribuicao          | Error               | Sempre — risco de perda de dados                          | Sim — retry automatico                            |
| Interno (500)          | GlobalExceptionFilter — catch-all                      | Error + stack trace | Sempre — Sentry/alertas                                   | Depende — cliente pode retry                      |

> (ver [10-validation.md](10-validation.md) para regras de validacao por campo)

---

<!-- added: opensource -->

## Error Handling for Contributors

- **Adding new error codes**: follow `SCREAMING_SNAKE_CASE` convention (e.g., `VAULT_LOCKED`); register in the error catalog table above; implement as a class extending `AlexandriaError`
- **User-facing messages**: error messages must use i18n keys (e.g., `errors.vault.locked`) — never hardcoded English strings; translations live in `src/i18n/`
- **Error documentation**: new errors must be added to the error catalog in this file and to `docs/errors.md` (public docs)
- **HTTP status mapping**: domain errors map to HTTP status via `GlobalExceptionFilter`; the mapping table is in `src/common/filters/global-exception.filter.ts`; new errors must have an explicit mapping entry
