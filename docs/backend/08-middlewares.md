# Middlewares

Define o pipeline de request — ordem de execucao, funcao de cada middleware, configuracao e comportamento em caso de falha.

<!-- do blueprint: 13-security.md, 14-scalability.md -->

---

## Pipeline de Request

> Em qual ordem os middlewares executam? Cada request passa por esta cadeia.

```
Request
  → 1. RequestId           (gera UUID v4 para tracing)
  → 2. Logger              (loga method, path, inicio)
  → 3. CORS                (configura headers de cross-origin)
  → 4. ThrottlerGuard      (verifica limites por membro/IP via Redis)
  → 5. BodyParser          (parse JSON/multipart, limite de tamanho)
  → 6. JwtAuthGuard        (valida JWT assinado com cluster key, extrai member)
  → 7. RolesGuard          (verifica role do JWT contra @Roles() decorator)
  → 8. ValidationPipe      (valida body/params/query via class-validator)
  → 9. Controller          (executa logica via service)
  → 10. SerializerInterceptor (remove campos @Exclude())
  → 11. GlobalExceptionFilter (catch-all, formata erro padrao JSON)
  → 12. LoggingInterceptor   (loga status, duracao, response size)
Response
```

---

## Detalhamento de Middlewares

> Para cada middleware, documente funcao, configuracao e erro.

| Middleware | Funcao | Configuracao | Erro se Falhar |
| --- | --- | --- | --- |
| RequestId | Gera UUID v4, adiciona header `X-Request-Id` ao request e response, propaga via `AsyncLocalStorage` para tracing | -- | -- |
| Logger | `nestjs-pino` — loga method, path e timestamp no inicio; no fim loga status, duracao e response size. **Redaction:** seed phrase, master key, file keys, tokens OAuth e credenciais S3 NUNCA aparecem em logs | Log level por ambiente (debug em dev, info em prod); campos redacted via pino redact paths | -- |
| CORS | Configura headers `Access-Control-Allow-*` para permitir requests do web client | Origins, methods, headers, credentials (ver secao abaixo) | Bloqueio de preflight — browser rejeita request |
| ThrottlerGuard | `@nestjs/throttler` — limita requests por membro/IP/endpoint usando algoritmo token bucket | Redis como storage; limites configurados por escopo (ver secao abaixo) | 429 Rate Limit Exceeded com headers `X-RateLimit-*` |
| BodyParser | Parse JSON com limite de 10MB (uploads sao multipart separado); multipart com limite de 10GB (video) | `express.json({ limit: '10mb' })`; multer para multipart com `limits.fileSize: 10GB` | 413 Payload Too Large |
| JwtAuthGuard | Valida JWT assinado com cluster key (Ed25519); extrai `member_id`, `cluster_id` e `role` do payload; verifica expiracao de 24h; le token de httpOnly cookie | Cluster key derivada da seed; expiracao 24h; issuer `alexandria` | 401 Unauthorized (token invalido, expirado ou ausente) |
| RolesGuard | Compara `role` extraido do JWT contra roles permitidos no decorator `@Roles()` da rota | Decorator `@Roles('admin')` nos controllers | 403 Forbidden (role insuficiente) |
| ValidationPipe | `class-validator` + `class-transformer`; valida DTOs de body, params e query | `whitelist: true`, `forbidNonWhitelisted: true` — propriedades desconhecidas sao rejeitadas | 400 Validation Error com array de `details` por campo |
| SerializerInterceptor | `ClassSerializerInterceptor` do NestJS — remove campos marcados com `@Exclude()` (senhas, keys, tokens internos) | Decorators `@Exclude()` e `@Expose()` nas entities/DTOs | -- |
| GlobalExceptionFilter | Catch-all para excecoes nao tratadas; transforma qualquer erro no formato JSON padrao (ver [09-errors.md](09-errors.md)) | Formato de erro padrao; stack trace omitido em producao | 500 Internal Error |
| LoggingInterceptor | Interceptor NestJS que loga no final: status HTTP, duracao em ms e tamanho do response | Usa `nestjs-pino` logger com requestId do contexto | -- |

---

## Middlewares Condicionais

> Quais middlewares sao aplicados apenas em rotas especificas?

| Middleware | Rotas Excluidas / Incluidas | Condicao |
| --- | --- | --- |
| JwtAuthGuard | Excluido de: `GET /health/live`, `GET /health/ready`, `POST /invites/accept` | Rota esta na whitelist publica (decorator `@Public()`) |
| RolesGuard | Apenas em rotas admin: `POST /clusters/:id/invite`, `DELETE /members/:id`, `POST /nodes/:id/drain` | Rota possui decorator `@Roles('admin')` |
| FileUpload (multer) | Apenas em: `POST /clusters/:clusterId/files/upload` | Rota aceita `multipart/form-data` |

---

## Configuracao de CORS

> Quais origens, metodos e headers sao permitidos?

| Aspecto | Valor |
| --- | --- |
| Origins | URL do web client (variavel de ambiente `WEB_CLIENT_URL`) + `http://localhost:3000` em desenvolvimento |
| Methods | `GET, POST, PATCH, DELETE, OPTIONS` |
| Headers | `Authorization, Content-Type, X-Request-Id` |
| Credentials | `true` (httpOnly cookies para JWT) |
| Max Age | `86400` (24h — browsers cacheiam preflight) |

---

## Configuracao de Rate Limiting

> Quais limites se aplicam por tipo de request?
> **Fonte:** [docs/blueprint/14-scalability.md](../blueprint/14-scalability.md) define a estrategia geral. Esta secao detalha os valores especificos.

| Escopo | Limite | Janela | Algoritmo | Storage |
| --- | --- | --- | --- | --- |
| API geral por membro | 100 req | 1 min | Token bucket | Redis |
| Upload por membro | 10 uploads | 1 min | Token bucket | Redis |
| Heartbeat por no | 2 req | 1 min | Token bucket | Redis |
| Recovery por IP | 3 tentativas | 1 hora | Token bucket | Redis |
| Convites por admin | 10 convites | 1 hora | Token bucket | Redis |

**Headers de resposta:**
- `X-RateLimit-Limit: <limite configurado para o escopo>`
- `X-RateLimit-Remaining: <requests restantes na janela>`
- `X-RateLimit-Reset: <timestamp Unix do reset da janela>`

> (ver [09-errors.md](09-errors.md) para formato do erro 429)
