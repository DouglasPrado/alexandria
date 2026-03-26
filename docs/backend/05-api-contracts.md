# Contratos de API

<!-- do blueprint: 08-use_cases.md -->

Define todos os endpoints, DTOs de request/response, status codes e erros por rota. Este documento e o contrato entre frontend e backend.

> **Consumido por:** [docs/frontend/15-api-dependencies.md](../frontend/15-api-dependencies.md) (endpoints que o frontend consome).
> **Erros detalhados em:** [docs/shared/error-ux-mapping.md](../shared/error-ux-mapping.md) (como erros sao exibidos no frontend).

---

## Convencoes Gerais

> Quais padroes se aplicam a todos os endpoints?

| Aspecto            | Convencao                                                                         |
| ------------------ | --------------------------------------------------------------------------------- |
| Base URL           | `/api` (sem versionamento)                                                        |
| Formato            | JSON (`application/json`), exceto upload (`multipart/form-data`)                  |
| Autenticacao       | Bearer Token (JWT) no header `Authorization`                                      |
| Paginacao          | Cursor-based: `?cursor=<id>&limit=20` → `{ data: [], meta: { cursor, hasMore } }` |
| Ordenacao          | Implicita por `id` descendente (cursor semantico)                                 |
| Filtros            | Query params por recurso (ex: `?mediaType=photo&status=ready`)                    |
| Versionamento      | Nenhum — endpoint unico sem prefixo de versao                                     |
| Rate Limit Headers | `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`                 |
| Cookie de Auth     | `access_token` — httpOnly, Secure, SameSite=Strict, 24h expiracao                 |

---

## Mapa de Endpoints

> Lista completa de todos os endpoints agrupados por recurso.

### Auth (`/api/auth`)

| Metodo | Rota                | Controller.metodo        | Service.metodo        | Auth                   | Descricao                           |
| ------ | ------------------- | ------------------------ | --------------------- | ---------------------- | ----------------------------------- |
| POST   | `/api/auth/login`   | `AuthController.login`   | `AuthService.login`   | Publica                | Autenticar membro com email + senha |
| POST   | `/api/auth/refresh` | `AuthController.refresh` | `AuthService.refresh` | Cookie (refresh_token) | Renovar JWT expirado                |

### Clusters (`/api/clusters`)

| Metodo | Rota                         | Controller.metodo            | Service.metodo            | Auth    | Descricao                         |
| ------ | ---------------------------- | ---------------------------- | ------------------------- | ------- | --------------------------------- |
| POST   | `/api/clusters`              | `ClusterController.create`   | `ClusterService.create`   | Publica | Criar cluster familiar (UC-001)   |
| GET    | `/api/clusters/:id`          | `ClusterController.findById` | `ClusterService.findById` | JWT     | Obter detalhes do cluster         |
| POST   | `/api/clusters/:id/recovery` | `ClusterController.recover`  | `ClusterService.recover`  | Publica | Recovery via seed phrase (UC-007) |

### Invites & Members (`/api/clusters/:id/invites`, `/api/clusters/:id/members`)

| Metodo | Rota                                  | Controller.metodo               | Service.metodo               | Auth      | Descricao                                 |
| ------ | ------------------------------------- | ------------------------------- | ---------------------------- | --------- | ----------------------------------------- |
| POST   | `/api/clusters/:id/invites`           | `MemberController.createInvite` | `MemberService.createInvite` | JWT+admin | Gerar convite com token assinado (UC-002) |
| POST   | `/api/invites/:token/accept`          | `MemberController.acceptInvite` | `MemberService.acceptInvite` | Publica   | Aceitar convite e criar membro (UC-002)   |
| GET    | `/api/clusters/:id/members`           | `MemberController.list`         | `MemberService.list`         | JWT       | Listar membros do cluster                 |
| DELETE | `/api/clusters/:id/members/:memberId` | `MemberController.remove`       | `MemberService.remove`       | JWT+admin | Remover membro do cluster                 |

### Nodes (`/api/nodes`)

| Metodo | Rota                   | Controller.metodo         | Service.metodo         | Auth      | Descricao                              |
| ------ | ---------------------- | ------------------------- | ---------------------- | --------- | -------------------------------------- |
| POST   | `/api/nodes`              | `NodeController.register` | `NodeService.register` | JWT+admin | Registrar no de armazenamento (UC-003) |
| GET    | `/api/nodes`              | `NodeController.list`     | `NodeService.list`     | JWT       | Listar nos do cluster                  |
| GET    | `/api/nodes/:id`          | `NodeController.findById` | `NodeService.findById` | JWT       | Obter detalhe de um no especifico      |
| POST   | `/api/nodes/:id/heartbeat`| `NodeController.heartbeat`| `NodeService.heartbeat`| Publica   | Heartbeat do agente (sem auth)         |
| POST   | `/api/nodes/:id/drain`    | `NodeController.drain`    | `NodeService.drain`    | JWT+admin | Iniciar drain de no (UC-006)           |
| DELETE | `/api/nodes/:id`          | `NodeController.remove`   | `NodeService.remove`   | JWT+admin | Remover no apos drain completo         |

### Files (`/api/files`)

| Metodo | Rota                      | Controller.metodo         | Service.metodo           | Auth               | Descricao                                      |
| ------ | ------------------------- | ------------------------- | ------------------------ | ------------------ | ---------------------------------------------- |
| POST   | `/api/files/upload`       | `FileController.upload`   | `FileService.upload`     | JWT (admin/member) | Upload de arquivo multipart (UC-004)           |
| GET    | `/api/files`              | `FileController.list`     | `FileService.list`       | JWT                | Listar arquivos com cursor pagination (UC-010) |
| GET    | `/api/files/:id`          | `FileController.findById` | `FileService.findById`   | JWT                | Obter detalhes do arquivo (UC-005)             |
| GET    | `/api/files/:id/download` | `FileController.download` | `FileService.download`   | JWT                | Baixar arquivo original otimizado (UC-005)     |
| GET    | `/api/files/:id/preview`  | `FileController.preview`  | `FileService.getPreview` | JWT                | Obter preview/thumbnail do arquivo             |

### Alerts (`/api/alerts`)

| Metodo | Rota                      | Controller.metodo         | Service.metodo         | Auth      | Descricao                          |
| ------ | ------------------------- | ------------------------- | ---------------------- | --------- | ---------------------------------- |
| GET    | `/api/alerts`             | `AlertController.list`    | `AlertService.list`    | JWT+admin | Listar alertas do cluster (UC-008) |
| PATCH  | `/api/alerts/:id/resolve` | `AlertController.resolve` | `AlertService.resolve` | JWT+admin | Marcar alerta como resolvido       |

### Health (`/health`)

| Metodo | Rota            | Controller.metodo        | Service.metodo        | Auth    | Descricao                                     |
| ------ | --------------- | ------------------------ | --------------------- | ------- | --------------------------------------------- |
| GET    | `/health/live`  | `HealthController.live`  | —                     | Publica | Liveness probe (processo ativo)               |
| GET    | `/health/ready` | `HealthController.ready` | `HealthService.check` | Publica | Readiness probe (PostgreSQL + Redis + BullMQ) |

<!-- added: opensource -->

### API Contribution Guidelines

- **Endpoint naming**: `kebab-case` paths (`/cluster-nodes`), plural resource names (`/files` not `/file`), versioned under `/api/v1/`
- **HTTP methods**: GET for reads, POST for creates, PATCH for partial updates, DELETE for removes — no custom verbs
- **Breaking changes**: any change that removes/renames a field or changes response shape requires an RFC and a major version bump (`/api/v2/`). Never silently break existing clients.
- **OpenAPI spec**: `src/openapi.yaml` must be updated with every endpoint change; CI validates the spec compiles; Swagger UI served at `GET /api/docs`
- **Backwards compatibility policy**: deprecated fields marked with `@deprecated` in OpenAPI spec and kept for minimum 2 minor versions before removal
- **Rate limiting defaults**: 100 req/min per IP for public endpoints; 1000 req/min for authenticated. Self-hosted operators can override via `RATE_LIMIT_*` env vars.

<!-- APPEND:endpoints -->

---

## Detalhamento por Endpoint

> Para CADA endpoint, documente request, response e erros.

### `POST /api/auth/login` — Autenticar Membro

**Request:**

| Campo    | Tipo   | Obrigatorio | Validacao             | Exemplo               |
| -------- | ------ | ----------- | --------------------- | --------------------- |
| email    | string | sim         | email valido, max 255 | `"maria@familia.com"` |
| password | string | sim         | min 8                 | `"SenhaSegura123"`    |

**Response 200:**

```json
{
  "member": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Maria Prado",
    "email": "maria@familia.com",
    "role": "admin",
    "clusterId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

> JWT tambem setado como cookie httpOnly `access_token` com 24h de expiracao.

**Erros:**

| Status | Codigo              | Mensagem                    | Quando                               |
| ------ | ------------------- | --------------------------- | ------------------------------------ |
| 400    | VALIDATION_ERROR    | "Campos invalidos"          | Email mal formatado ou senha ausente |
| 401    | INVALID_CREDENTIALS | "Email ou senha incorretos" | Credenciais nao batem                |

---

### `POST /api/auth/refresh` — Renovar JWT

**Request:** Cookie `refresh_token` (httpOnly) enviado automaticamente.

**Response 200:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Erros:**

| Status | Codigo        | Mensagem                 | Quando              |
| ------ | ------------- | ------------------------ | ------------------- |
| 401    | TOKEN_EXPIRED | "Refresh token expirado" | Token vencido       |
| 401    | INVALID_TOKEN | "Token invalido"         | Assinatura invalida |

---

### `POST /api/clusters` — Criar Cluster Familiar (UC-001)

**Request:**

| Campo          | Tipo   | Obrigatorio | Validacao                    | Exemplo                 |
| -------------- | ------ | ----------- | ---------------------------- | ----------------------- |
| name           | string | sim         | min 2, max 100               | `"Familia Prado"`       |
| admin.name     | string | sim         | min 2, max 100               | `"Douglas Prado"`       |
| admin.email    | string | sim         | email valido                 | `"douglas@familia.com"` |
| admin.password | string | sim         | min 8, 1 maiuscula, 1 numero | `"Senha123"`            |

**Response 201:**

```json
{
  "cluster": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Familia Prado",
    "status": "active",
    "createdAt": "2026-03-23T10:00:00Z"
  },
  "member": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Douglas Prado",
    "email": "douglas@familia.com",
    "role": "admin"
  },
  "seedPhrase": "abandon ability able about above absent absorb abstract absurd abuse access accident"
}
```

> **ATENCAO:** `seedPhrase` e exibida UMA UNICA VEZ. Nao e armazenada no banco. O frontend deve exigir confirmacao do usuario antes de prosseguir.

**Erros:**

| Status | Codigo                 | Mensagem                       | Quando                            |
| ------ | ---------------------- | ------------------------------ | --------------------------------- |
| 400    | VALIDATION_ERROR       | "Campos invalidos"             | Campos ausentes ou mal formatados |
| 409    | CLUSTER_ALREADY_EXISTS | "Admin ja possui cluster"      | Email ja associado a cluster      |
| 500    | ENTROPY_FAILURE        | "Falha na geracao de entropia" | CSPRNG indisponivel               |

---

### `GET /api/clusters/:id` — Obter Detalhes do Cluster

**Request:** Nenhum body. Parametro `id` na URL.

**Response 200:**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Familia Prado",
  "status": "active",
  "totalNodes": 4,
  "totalFiles": 1283,
  "totalStorage": 52428800000,
  "usedStorage": 31457280000,
  "replicationFactor": 3,
  "createdAt": "2026-03-23T10:00:00Z"
}
```

**Erros:**

| Status | Codigo            | Mensagem                          | Quando                         |
| ------ | ----------------- | --------------------------------- | ------------------------------ |
| 401    | UNAUTHORIZED      | "Nao autenticado"                 | Token ausente ou invalido      |
| 403    | FORBIDDEN         | "Sem permissao para este cluster" | Membro nao pertence ao cluster |
| 404    | CLUSTER_NOT_FOUND | "Cluster nao encontrado"          | ID inexistente                 |

---

### `POST /api/clusters/:id/recovery` — Recovery via Seed Phrase (UC-007)

**Request:**

| Campo      | Tipo   | Obrigatorio | Validacao                               | Exemplo                      |
| ---------- | ------ | ----------- | --------------------------------------- | ---------------------------- |
| seedPhrase | string | sim         | 12 palavras BIP-39 separadas por espaco | `"abandon ability able ..."` |

**Response 200:**

```json
{
  "status": "recovering",
  "recoveredVaults": 3,
  "recoveredManifests": 1283,
  "nodesReconnected": 2,
  "nodesOffline": 1,
  "integrityCheck": {
    "totalChunks": 12830,
    "healthyChunks": 12800,
    "pendingHealing": 30
  }
}
```

**Erros:**

| Status | Codigo            | Mensagem                                | Quando                           |
| ------ | ----------------- | --------------------------------------- | -------------------------------- |
| 400    | INVALID_SEED      | "Seed phrase invalida"                  | Palavras fora da wordlist BIP-39 |
| 422    | SEED_MISMATCH     | "Seed nao corresponde a nenhum cluster" | Vaults nao descriptografam       |
| 503    | NODES_UNREACHABLE | "Nenhum no acessivel"                   | Nenhum manifest encontrado       |

---

### `POST /api/clusters/:id/invites` — Gerar Convite (UC-002)

**Request:**

| Campo | Tipo   | Obrigatorio | Validacao                | Exemplo            |
| ----- | ------ | ----------- | ------------------------ | ------------------ |
| email | string | sim         | email valido, max 255    | `"joao@email.com"` |
| role  | string | sim         | `"member"` ou `"reader"` | `"member"`         |

**Response 201:**

```json
{
  "id": "inv-9876-5432",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "inviteUrl": "https://app.alexandria.io/invites/eyJhbGci...",
  "expiresAt": "2026-03-30T10:00:00Z",
  "role": "member"
}
```

**Erros:**

| Status | Codigo                | Mensagem                         | Quando                         |
| ------ | --------------------- | -------------------------------- | ------------------------------ |
| 400    | VALIDATION_ERROR      | "Campos invalidos"               | Email ou role invalido         |
| 401    | UNAUTHORIZED          | "Nao autenticado"                | Token ausente                  |
| 403    | FORBIDDEN             | "Apenas admins podem convidar"   | Role insuficiente              |
| 409    | MEMBER_ALREADY_EXISTS | "Membro ja existe neste cluster" | Email ja registrado no cluster |

---

### `POST /api/invites/:token/accept` — Aceitar Convite (UC-002)

**Request:**

| Campo    | Tipo   | Obrigatorio | Validacao                    | Exemplo        |
| -------- | ------ | ----------- | ---------------------------- | -------------- |
| name     | string | sim         | min 2, max 100               | `"Joao Silva"` |
| password | string | sim         | min 8, 1 maiuscula, 1 numero | `"Senha456"`   |

**Response 201:**

```json
{
  "member": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Joao Silva",
    "email": "joao@email.com",
    "role": "member",
    "clusterId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Erros:**

| Status | Codigo                | Mensagem           | Quando                        |
| ------ | --------------------- | ------------------ | ----------------------------- |
| 400    | VALIDATION_ERROR      | "Campos invalidos" | Nome ou senha invalidos       |
| 403    | INVALID_INVITE        | "Convite invalido" | Token com assinatura invalida |
| 410    | INVITE_EXPIRED        | "Convite expirado" | Token vencido (> 7 dias)      |
| 409    | MEMBER_ALREADY_EXISTS | "Membro ja existe" | Email ja no cluster           |

---

### `GET /api/clusters/:id/members` — Listar Membros

**Request:** Query params opcionais: `?cursor=<id>&limit=20`

**Response 200:**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Douglas Prado",
      "email": "douglas@familia.com",
      "role": "admin",
      "joinedAt": "2026-03-23T10:00:00Z"
    }
  ],
  "meta": {
    "cursor": "550e8400-e29b-41d4-a716-446655440000",
    "hasMore": false
  }
}
```

**Erros:**

| Status | Codigo       | Mensagem          | Quando                         |
| ------ | ------------ | ----------------- | ------------------------------ |
| 401    | UNAUTHORIZED | "Nao autenticado" | Token ausente                  |
| 403    | FORBIDDEN    | "Sem permissao"   | Membro nao pertence ao cluster |

---

### `DELETE /api/clusters/:id/members/:memberId` — Remover Membro

**Request:** Nenhum body. Parametros `id` e `memberId` na URL.

**Response 204:** Sem body.

**Erros:**

| Status | Codigo              | Mensagem                               | Quando                  |
| ------ | ------------------- | -------------------------------------- | ----------------------- |
| 401    | UNAUTHORIZED        | "Nao autenticado"                      | Token ausente           |
| 403    | FORBIDDEN           | "Apenas admins podem remover membros"  | Role insuficiente       |
| 404    | MEMBER_NOT_FOUND    | "Membro nao encontrado"                | ID inexistente          |
| 422    | CANNOT_REMOVE_ADMIN | "Nao e possivel remover o unico admin" | Ultimo admin do cluster |

---

### `POST /api/nodes` — Registrar No (UC-003)

**Request:**

| Campo     | Tipo   | Obrigatorio | Validacao                          | Exemplo                             |
| --------- | ------ | ----------- | ---------------------------------- | ----------------------------------- |
| name      | string | sim         | min 2, max 100                     | `"NAS Escritorio"`                  |
| type      | string | sim         | `"s3"`, `"r2"`, `"local"`, `"vps"` | `"s3"`                              |
| endpoint  | string | sim (cloud) | URL valida                         | `"https://s3.amazonaws.com"`        |
| bucket    | string | sim (cloud) | min 3, max 63                      | `"alexandria-familia-prado"`        |
| accessKey | string | sim (cloud) | non-empty                          | `"AKIAIOSFODNN7EXAMPLE"`            |
| secretKey | string | sim (cloud) | non-empty                          | `"wJalrXUtnFEMI/K7MDENG/bPxRfi..."` |
| region    | string | nao         | AWS region                         | `"us-east-1"`                       |

**Response 201:**

```json
{
  "id": "node-1234-5678",
  "name": "NAS Escritorio",
  "type": "s3",
  "status": "online",
  "totalCapacity": 107374182400,
  "usedCapacity": 0,
  "createdAt": "2026-03-23T10:05:00Z"
}
```

**Erros:**

| Status | Codigo              | Mensagem                            | Quando                       |
| ------ | ------------------- | ----------------------------------- | ---------------------------- |
| 400    | VALIDATION_ERROR    | "Campos invalidos"                  | Tipo ou credenciais ausentes |
| 401    | UNAUTHORIZED        | "Nao autenticado"                   | Token ausente                |
| 403    | FORBIDDEN           | "Apenas admins podem registrar nos" | Role insuficiente            |
| 422    | CONNECTIVITY_FAILED | "Falha na conectividade com o no"   | Teste PUT/GET falhou         |
| 422    | INVALID_CREDENTIALS | "Credenciais S3 invalidas"          | Auth AWS falhou              |

---

### `GET /api/nodes` — Listar Nos

**Request:** Query params opcionais: `?cursor=<id>&limit=20&status=online`

**Response 200:**

```json
{
  "data": [
    {
      "id": "node-1234-5678",
      "name": "NAS Escritorio",
      "type": "s3",
      "status": "online",
      "totalCapacity": 107374182400,
      "usedCapacity": 31457280000,
      "chunksStored": 4200,
      "lastHeartbeat": "2026-03-23T12:00:00Z"
    }
  ],
  "meta": {
    "cursor": "node-1234-5678",
    "hasMore": true
  }
}
```

**Erros:**

| Status | Codigo       | Mensagem          | Quando        |
| ------ | ------------ | ----------------- | ------------- |
| 401    | UNAUTHORIZED | "Nao autenticado" | Token ausente |

---

### `GET /api/nodes/:id` — Detalhe do No

**Request:** Parametro `id` na URL.

**Response 200:**

```json
{
  "id": "node-1234-5678",
  "name": "NAS Escritorio",
  "type": "s3",
  "status": "online",
  "totalCapacity": 107374182400,
  "usedCapacity": 31457280000,
  "chunksStored": 4200,
  "lastHeartbeat": "2026-03-23T12:00:00Z",
  "createdAt": "2026-01-10T10:00:00Z"
}
```

**Erros:**

| Status | Codigo         | Mensagem               | Quando         |
| ------ | -------------- | ---------------------- | -------------- |
| 401    | UNAUTHORIZED   | "Nao autenticado"      | Token ausente  |
| 403    | FORBIDDEN      | "No nao pertence ao cluster" | No de outro cluster |
| 404    | NODE_NOT_FOUND | "No nao encontrado"    | ID inexistente |

---

### `POST /api/nodes/:id/heartbeat` — Heartbeat do Agente

**Autenticacao:** Publica — node-agent nao possui JWT; usa apenas o `nodeId` como identificador.

**Request:** Nenhum body. Parametro `id` na URL.

**Response 204:** Sem body.

**Comportamento:** Atualiza `lastHeartbeat = now()` e muda `status` de `suspect` para `online` se o no estava suspeito.

**Erros:**

| Status | Codigo         | Mensagem            | Quando         |
| ------ | -------------- | ------------------- | -------------- |
| 404    | NODE_NOT_FOUND | "No nao encontrado" | ID inexistente |

---

### `POST /api/nodes/:id/drain` — Iniciar Drain (UC-006)

**Request:** Nenhum body. Parametro `id` na URL.

**Response 202:**

```json
{
  "id": "node-1234-5678",
  "status": "draining",
  "chunksToMigrate": 4200,
  "estimatedTime": "15min"
}
```

**Erros:**

| Status | Codigo              | Mensagem                                              | Quando                      |
| ------ | ------------------- | ----------------------------------------------------- | --------------------------- |
| 401    | UNAUTHORIZED        | "Nao autenticado"                                     | Token ausente               |
| 403    | FORBIDDEN           | "Apenas admins podem drenar nos"                      | Role insuficiente           |
| 404    | NODE_NOT_FOUND      | "No nao encontrado"                                   | ID inexistente              |
| 422    | MIN_NODES_VIOLATION | "Nao e possivel remover — minimo de 1 no necessario" | Cluster ficaria com < 1 no |
| 422    | INSUFFICIENT_SPACE  | "Espaco insuficiente nos nos restantes"               | Nao cabe nos demais nos     |

---

### `DELETE /api/nodes/:id` — Remover No apos Drain

**Request:** Nenhum body. Parametro `id` na URL.

**Response 204:** Sem body.

**Erros:**

| Status | Codigo             | Mensagem                   | Quando                    |
| ------ | ------------------ | -------------------------- | ------------------------- |
| 401    | UNAUTHORIZED       | "Nao autenticado"          | Token ausente             |
| 403    | FORBIDDEN          | "Apenas admins"            | Role insuficiente         |
| 404    | NODE_NOT_FOUND     | "No nao encontrado"        | ID inexistente            |
| 422    | DRAIN_NOT_COMPLETE | "Drain ainda em andamento" | No nao terminou de drenar |

---

### `POST /api/files/upload` — Upload de Arquivo (UC-004)

**Request:** `Content-Type: multipart/form-data`

| Campo    | Tipo        | Obrigatorio | Validacao                | Exemplo                          |
| -------- | ----------- | ----------- | ------------------------ | -------------------------------- |
| file     | binary      | sim         | max 10GB; MIME whitelist | Arquivo binario                  |
| metadata | JSON string | nao         | JSON valido              | `'{"description":"Natal 2025"}'` |

**Response 202:**

```json
{
  "id": "file-abcd-1234",
  "name": "IMG_2025_natal.jpg",
  "mimeType": "image/jpeg",
  "originalSize": 5242880,
  "status": "processing",
  "createdAt": "2026-03-23T12:00:00Z"
}
```

> Status 202 porque o processamento (otimizacao, chunking, distribuicao) e assincrono via BullMQ.

**Erros:**

| Status | Codigo             | Mensagem                                   | Quando                     |
| ------ | ------------------ | ------------------------------------------ | -------------------------- |
| 400    | VALIDATION_ERROR   | "Arquivo ausente ou tipo invalido"         | MIME nao permitido         |
| 401    | UNAUTHORIZED       | "Nao autenticado"                          | Token ausente              |
| 403    | FORBIDDEN          | "Readers nao podem fazer upload"           | Role = reader              |
| 413    | FILE_TOO_LARGE     | "Arquivo excede limite de 10GB"            | Tamanho acima do permitido |
| 503    | INSUFFICIENT_NODES | "Nos insuficientes para replicacao minima" | Menos de 1 no ativo        |

---

### `GET /api/files` — Listar Arquivos (UC-010)

**Request:** Query params:

| Param     | Tipo          | Obrigatorio               | Exemplo                              |
| --------- | ------------- | ------------------------- | ------------------------------------ |
| cursor    | string (UUID) | nao                       | `"file-abcd-1234"`                   |
| limit     | number        | nao (default 20, max 100) | `20`                                 |
| mediaType | string        | nao                       | `"photo"`, `"video"`, `"document"`   |
| status    | string        | nao                       | `"ready"`, `"processing"`, `"error"` |
| search    | string        | nao                       | `"natal 2025"`                       |

**Response 200:**

```json
{
  "data": [
    {
      "id": "file-abcd-1234",
      "name": "IMG_2025_natal.jpg",
      "mimeType": "image/jpeg",
      "mediaType": "photo",
      "originalSize": 5242880,
      "optimizedSize": 1048576,
      "status": "ready",
      "previewUrl": "/api/files/file-abcd-1234/preview",
      "metadata": {
        "width": 1920,
        "height": 1080,
        "takenAt": "2025-12-25T18:30:00Z"
      },
      "createdAt": "2026-03-23T12:00:00Z"
    }
  ],
  "meta": {
    "cursor": "file-abcd-1234",
    "hasMore": true
  }
}
```

**Erros:**

| Status | Codigo       | Mensagem          | Quando        |
| ------ | ------------ | ----------------- | ------------- |
| 401    | UNAUTHORIZED | "Nao autenticado" | Token ausente |

---

### `GET /api/files/:id` — Detalhes do Arquivo (UC-005)

**Request:** Nenhum body. Parametro `id` na URL.

**Response 200:**

```json
{
  "id": "file-abcd-1234",
  "name": "IMG_2025_natal.jpg",
  "mimeType": "image/jpeg",
  "mediaType": "photo",
  "originalSize": 5242880,
  "optimizedSize": 1048576,
  "status": "ready",
  "hash": "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "chunksCount": 2,
  "replicationFactor": 3,
  "previewUrl": "/api/files/file-abcd-1234/preview",
  "metadata": {
    "width": 1920,
    "height": 1080,
    "takenAt": "2025-12-25T18:30:00Z",
    "camera": "iPhone 16 Pro",
    "gps": { "lat": -23.5505, "lng": -46.6333 }
  },
  "uploadedBy": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Douglas Prado"
  },
  "createdAt": "2026-03-23T12:00:00Z"
}
```

**Erros:**

| Status | Codigo         | Mensagem                 | Quando         |
| ------ | -------------- | ------------------------ | -------------- |
| 401    | UNAUTHORIZED   | "Nao autenticado"        | Token ausente  |
| 404    | FILE_NOT_FOUND | "Arquivo nao encontrado" | ID inexistente |

---

### `GET /api/files/:id/download` — Baixar Arquivo (UC-005)

**Request:** Nenhum body. Parametro `id` na URL.

**Response 200:** Stream binario com headers:

```
Content-Type: image/webp
Content-Disposition: attachment; filename="IMG_2025_natal.webp"
Content-Length: 1048576
```

> O sistema localiza chunks via manifest, baixa dos nos, descriptografa e reassembla em stream.

**Erros:**

| Status | Codigo           | Mensagem                               | Quando                            |
| ------ | ---------------- | -------------------------------------- | --------------------------------- |
| 401    | UNAUTHORIZED     | "Nao autenticado"                      | Token ausente                     |
| 404    | FILE_NOT_FOUND   | "Arquivo nao encontrado"               | ID inexistente                    |
| 503    | FILE_UNAVAILABLE | "Arquivo temporariamente indisponivel" | Todos os nos com replicas offline |

---

### `GET /api/files/:id/preview` — Obter Preview

**Request:** Nenhum body. Parametro `id` na URL.

**Response 200:** Stream binario (thumbnail ~50KB para fotos, 480p para video). Documentos nao possuem preview (retorna 404).

```
Content-Type: image/webp
Content-Length: 51200
Cache-Control: public, max-age=86400
```

**Erros:**

| Status | Codigo            | Mensagem                         | Quando                   |
| ------ | ----------------- | -------------------------------- | ------------------------ |
| 401    | UNAUTHORIZED      | "Nao autenticado"                | Token ausente            |
| 404    | FILE_NOT_FOUND    | "Arquivo nao encontrado"         | ID inexistente           |
| 404    | PREVIEW_NOT_READY | "Preview ainda em processamento" | File status = processing |

---

### `GET /api/alerts` — Listar Alertas (UC-008)

**Request:** Query params: `?cursor=<id>&limit=20&status=active`

**Response 200:**

```json
{
  "data": [
    {
      "id": "alert-9999-0001",
      "type": "node_offline",
      "severity": "high",
      "message": "No 'NAS Escritorio' esta offline ha 15 minutos",
      "nodeId": "node-1234-5678",
      "status": "active",
      "createdAt": "2026-03-23T12:15:00Z",
      "resolvedAt": null
    }
  ],
  "meta": {
    "cursor": "alert-9999-0001",
    "hasMore": false
  }
}
```

**Erros:**

| Status | Codigo       | Mensagem                          | Quando            |
| ------ | ------------ | --------------------------------- | ----------------- |
| 401    | UNAUTHORIZED | "Nao autenticado"                 | Token ausente     |
| 403    | FORBIDDEN    | "Apenas admins podem ver alertas" | Role insuficiente |

---

### `PATCH /api/alerts/:id/resolve` — Resolver Alerta

**Request:** Nenhum body. Parametro `id` na URL.

**Response 200:**

```json
{
  "id": "alert-9999-0001",
  "status": "resolved",
  "resolvedAt": "2026-03-23T12:30:00Z"
}
```

**Erros:**

| Status | Codigo           | Mensagem                | Quando               |
| ------ | ---------------- | ----------------------- | -------------------- |
| 401    | UNAUTHORIZED     | "Nao autenticado"       | Token ausente        |
| 403    | FORBIDDEN        | "Apenas admins"         | Role insuficiente    |
| 404    | ALERT_NOT_FOUND  | "Alerta nao encontrado" | ID inexistente       |
| 422    | ALREADY_RESOLVED | "Alerta ja resolvido"   | Status ja e resolved |

---

### `GET /health/live` — Liveness Probe

**Request:** Nenhum.

**Response 200:**

```json
{ "status": "ok" }
```

---

### `GET /health/ready` — Readiness Probe

**Request:** Nenhum.

**Response 200:**

```json
{
  "status": "ok",
  "checks": {
    "database": "up",
    "redis": "up",
    "bullmq": "up"
  }
}
```

**Response 503:**

```json
{
  "status": "degraded",
  "checks": {
    "database": "up",
    "redis": "down",
    "bullmq": "down"
  }
}
```

<!-- APPEND:detalhamento -->

---

## DTOs (Data Transfer Objects)

> Quais DTOs existem e quais campos possuem?

### Request DTOs

| DTO                   | Campos                                                            | Usado em                          |
| --------------------- | ----------------------------------------------------------------- | --------------------------------- |
| `LoginDTO`            | `email, password`                                                 | `POST /api/auth/login`            |
| `CreateClusterDTO`    | `name, admin: { name, email, password }`                          | `POST /api/clusters`              |
| `RecoverClusterDTO`   | `seedPhrase`                                                      | `POST /api/clusters/:id/recovery` |
| `CreateInviteDTO`     | `email, role`                                                     | `POST /api/clusters/:id/invites`  |
| `AcceptInviteDTO`     | `name, password`                                                  | `POST /api/invites/:token/accept` |
| `RegisterNodeDTO`     | `name, type, endpoint?, bucket?, accessKey?, secretKey?, region?` | `POST /api/nodes`                 |
| `UploadFileDTO`       | `file (binary), metadata? (JSON)`                                 | `POST /api/files/upload`          |
| `ListFilesQueryDTO`   | `cursor?, limit?, mediaType?, status?, search?`                   | `GET /api/files`                  |
| `CursorPaginationDTO` | `cursor?, limit?`                                                 | Todas as listagens                |

### Response DTOs

| DTO                             | Campos                                                                                                | Exclui                      | Usado em             |
| ------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------- | -------------------- |
| `ClusterResponseDTO`            | `id, name, status, totalNodes, totalFiles, totalStorage, usedStorage, replicationFactor, createdAt`   | `seedPhrase (apos criacao)` | Endpoints de Cluster |
| `MemberResponseDTO`             | `id, name, email, role, clusterId, joinedAt`                                                          | `passwordHash, vaultKey`    | Endpoints de Member  |
| `NodeResponseDTO`               | `id, name, type, status, totalCapacity, usedCapacity, chunksStored, lastHeartbeat`                    | `accessKey, secretKey`      | Endpoints de Node    |
| `FileResponseDTO`               | `id, name, mimeType, mediaType, originalSize, optimizedSize, status, previewUrl, metadata, createdAt` | `fileKey, chunkHashes`      | Endpoints de File    |
| `FileDetailResponseDTO`         | `FileResponseDTO + hash, chunksCount, replicationFactor, uploadedBy`                                  | `fileKey`                   | `GET /api/files/:id` |
| `AlertResponseDTO`              | `id, type, severity, message, nodeId?, status, createdAt, resolvedAt?`                                | —                           | Endpoints de Alert   |
| `CursorPaginatedResponseDTO<T>` | `data: T[], meta: { cursor, hasMore }`                                                                | —                           | Todas as listagens   |

<!-- APPEND:dtos -->

> (ver [06-services.md](06-services.md) para a logica que cada endpoint executa)
