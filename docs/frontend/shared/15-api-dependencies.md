# Dependencias de API

Define quais endpoints do backend o frontend consome, quais campos utiliza e o impacto de mudancas na API. Este documento e compartilhado entre todos os clientes (web, mobile, desktop).

> **Fonte:** [docs/backend/05-api-contracts.md](../../backend/05-api-contracts.md) (contratos detalhados).
> **Implementacao:** [docs/frontend/shared/06-data-layer.md](06-data-layer.md) (API client, hooks, DTOs).

<!-- do blueprint: 08-use_cases.md, 07-critical_flows.md, 05-api-contracts.md -->

---

## Mapa de Dependencias

> Lista TODOS os endpoints que o frontend consome, agrupados por feature.

### Autenticacao

| Endpoint Backend | Metodo | Usado em (Pagina/Component) | Campos Consumidos | Frequencia |
| --- | --- | --- | --- | --- |
| `/api/auth/login` | POST | LoginPage, AuthProvider | `member.{id, name, email, role, clusterId}`, `accessToken` | Por login |
| `/api/auth/refresh` | POST | AuthProvider (automatico via cookie) | `accessToken` | Automatico proximo da expiracao (24h) |

### Cluster

| Endpoint Backend | Metodo | Usado em (Pagina/Component) | Campos Consumidos | Frequencia |
| --- | --- | --- | --- | --- |
| `/api/clusters` | POST | CreateClusterPage (wizard) | `cluster.{id, name, status}`, `member.{id, name, role}`, `seedPhrase` | Uma vez (setup) |
| `/api/clusters/:id` | GET | DashboardPage, Sidebar, HealthPanel | `id, name, status, totalNodes, totalFiles, totalStorage, usedStorage, replicationFactor` | Mount + cache 60s |
| `/api/clusters/:id/recovery` | POST | RecoveryPage (wizard) | `status, recoveredVaults, recoveredManifests, nodesReconnected, nodesOffline, integrityCheck.*` | Durante recovery (polling 5s) |

### Membros e Convites

| Endpoint Backend | Metodo | Usado em (Pagina/Component) | Campos Consumidos | Frequencia |
| --- | --- | --- | --- | --- |
| `/api/clusters/:id/invites` | POST | MembersPage (InviteDialog) | `id, token, inviteUrl, expiresAt, role` | Por convite |
| `/api/invites/:token/accept` | POST | AcceptInvitePage | `member.{id, name, email, role, clusterId}`, `accessToken` | Uma vez por convite |
| `/api/clusters/:id/members` | GET | MembersPage, MemberList, Sidebar | `data[].{id, name, email, role, joinedAt}`, `meta.{cursor, hasMore}` | Mount + cache 60s |
| `/api/clusters/:id/members/:memberId` | DELETE | MembersPage (RemoveDialog) | — (204) | Por remocao |

### Nos de Armazenamento

| Endpoint Backend | Metodo | Usado em (Pagina/Component) | Campos Consumidos | Frequencia |
| --- | --- | --- | --- | --- |
| `/api/nodes` | POST | NodesPage (RegisterNodeDialog) | `id, name, type, status, totalCapacity, usedCapacity` | Por registro |
| `/api/nodes` | GET | NodesPage, NodeList, DashboardPanel | `data[].{id, name, type, status, totalCapacity, usedCapacity, chunksStored, lastHeartbeat}`, `meta.*` | Mount + cache 30s |
| `/api/nodes/:id/drain` | POST | NodeDetailPage (DrainDialog) | `id, status, chunksToMigrate, estimatedTime` | Por drain |
| `/api/nodes/:id` | DELETE | NodeDetailPage (RemoveButton) | — (204) | Apos drain completo |

### Arquivos

| Endpoint Backend | Metodo | Usado em (Pagina/Component) | Campos Consumidos | Frequencia |
| --- | --- | --- | --- | --- |
| `/api/files/upload` | POST | GalleryPage (UploadZone), UploadDialog | `id, name, mimeType, originalSize, status` | Por upload |
| `/api/files` | GET | GalleryPage (GalleryGrid, Timeline), SearchResults | `data[].{id, name, mimeType, mediaType, originalSize, optimizedSize, status, previewUrl, metadata, createdAt}`, `meta.*` | Mount + cache 30s, scroll infinito |
| `/api/files/:id` | GET | FileDetailPage, Lightbox | `id, name, mimeType, mediaType, originalSize, optimizedSize, status, hash, chunksCount, replicationFactor, previewUrl, metadata.*, uploadedBy.*` | Por clique + polling 3s se processing |
| `/api/files/:id/download` | GET | FileDetailPage (DownloadButton), Lightbox | Stream binario (Content-Type, Content-Disposition, Content-Length) | Por download |
| `/api/files/:id/preview` | GET | GalleryGrid (thumbnail), Lightbox, Timeline | Stream binario (image/webp) | Alta — toda renderizacao de thumbnail |

### Alertas

| Endpoint Backend | Metodo | Usado em (Pagina/Component) | Campos Consumidos | Frequencia |
| --- | --- | --- | --- | --- |
| `/api/alerts` | GET | AlertsBadge (Header), AlertsDropdown, AlertsPage | `data[].{id, type, severity, message, nodeId, status, createdAt, resolvedAt}`, `meta.*` | Mount + cache 10s |
| `/api/alerts/:id/resolve` | PATCH | AlertsPage (ResolveButton), AlertsDropdown | `id, status, resolvedAt` | Por resolucao |

### Health

| Endpoint Backend | Metodo | Usado em (Pagina/Component) | Campos Consumidos | Frequencia |
| --- | --- | --- | --- | --- |
| `/health/ready` | GET | DashboardPage (HealthIndicator) | `status, checks.{database, redis, bullmq}` | Mount + cache 60s |

<!-- APPEND:dependencias -->

---

## Campos Criticos por Endpoint

> Para cada endpoint, quais campos o frontend DEPENDE e o que quebra se forem removidos.

### Autenticacao e Sessao

| Endpoint | Campo | Componentes que Usam | Impacto se Removido |
| --- | --- | --- | --- |
| `POST /auth/login` | `accessToken` | AuthProvider, cookie setter | Login impossivel — sem token para requests autenticadas |
| `POST /auth/login` | `member.role` | AuthProvider, RouteGuard, RBAC UI | Rotas protegidas por role param de funcionar; botoes admin visiveis para todos |
| `POST /auth/login` | `member.clusterId` | Todas as queries que filtram por cluster | Nenhuma query funciona — clusterId e parametro obrigatorio |

### Cluster e Dashboard

| Endpoint | Campo | Componentes que Usam | Impacto se Removido |
| --- | --- | --- | --- |
| `GET /clusters/:id` | `totalStorage, usedStorage` | DashboardPage, HealthPanel, StorageBar | Barra de capacidade nao renderiza |
| `GET /clusters/:id` | `totalNodes` | DashboardPage, HealthPanel | Contagem de nos ausente no dashboard |
| `GET /clusters/:id` | `replicationFactor` | HealthPanel | Indicador de fator de replicacao ausente |
| `POST /clusters` | `seedPhrase` | CreateClusterWizard (SeedPhraseStep) | Seed nunca exibida — usuario nao pode anotar; recovery impossivel |

### Galeria e Arquivos

| Endpoint | Campo | Componentes que Usam | Impacto se Removido |
| --- | --- | --- | --- |
| `GET /files` | `previewUrl` | GalleryGrid, Timeline, Lightbox | Thumbnails nao carregam — galeria fica vazia visualmente |
| `GET /files` | `status` | GalleryGrid (skeleton), FileCard (badge) | Nao diferencia processing/ready/error; UX confusa |
| `GET /files` | `mediaType` | Filtros da galeria, icones por tipo | Filtro por tipo quebra; icones errados |
| `GET /files` | `meta.cursor, meta.hasMore` | GalleryGrid (scroll infinito) | Paginacao para de funcionar |
| `GET /files/:id` | `metadata.takenAt` | Timeline, FileDetail | Ordenacao por data real impossivel |
| `GET /files/:id` | `chunksCount, replicationFactor` | FileDetail (ReplicationBadge) | Info de saude do arquivo ausente |
| `GET /files/:id` | `uploadedBy.name` | FileDetail | Nao mostra quem fez upload |
| `GET /files/:id/download` | `Content-Disposition` | Browser download | Arquivo salvo sem nome correto |

### Nos de Armazenamento

| Endpoint | Campo | Componentes que Usam | Impacto se Removido |
| --- | --- | --- | --- |
| `GET /nodes` | `status` | NodeList (StatusBadge), DashboardPanel | Status do no invisivel; admin nao sabe se online/suspect/lost |
| `GET /nodes` | `totalCapacity, usedCapacity` | NodeCard (CapacityBar), DashboardPanel | Barra de capacidade nao renderiza |
| `GET /nodes` | `lastHeartbeat` | NodeDetail (LastSeenLabel) | Admin nao sabe quando no comunicou pela ultima vez |
| `POST /nodes/:id/drain` | `chunksToMigrate, estimatedTime` | DrainProgressBar | Progresso de drain nao exibido |

### Alertas

| Endpoint | Campo | Componentes que Usam | Impacto se Removido |
| --- | --- | --- | --- |
| `GET /alerts` | `severity` | AlertsBadge (cor), AlertsDropdown (icone) | Alertas sem diferenciacao visual de criticidade |
| `GET /alerts` | `type` | AlertsDropdown (icone por tipo), AlertsPage (filtro) | Sem icone contextual; filtro por tipo quebra |
| `GET /alerts` | `nodeId` | AlertCard (link para no) | Link para no relacionado ausente |

<!-- APPEND:campos-criticos -->

---

## Contratos de Paginacao

> Qual formato de paginacao o frontend espera?

**Tipo:** Cursor-based (sem OFFSET — performance constante independente da pagina).

<!-- do blueprint: 05-data-model.md (paginacao por cursor, nunca OFFSET) -->

```json
{
  "data": [],
  "meta": {
    "cursor": "uuid-do-ultimo-item",
    "hasMore": true
  }
}
```

**Parametros de query:**
- `?cursor=<uuid>&limit=20` — paginacao (default limit: 20, max: 100)
- `?mediaType=photo` — filtro por tipo (files)
- `?status=ready` — filtro por status (files, alerts)
- `?search=natal` — busca textual (files)

**Ordenacao:** Implicita por `id` descendente (cursor semantico). Sem parametros `sort` ou `order` — simplifica API e garante estabilidade do cursor.

**Uso no frontend:**
- GalleryGrid: scroll infinito com `useInfiniteQuery` (TanStack Query)
- NodeList, MemberList, AlertsList: load more button
- Cursor armazenado no TanStack Query cache; invalidado apos mutations

---

## Cache Strategy por Endpoint

> Quais endpoints sao cacheados no frontend?

| Endpoint | Estrategia | TTL (staleTime) | Invalidacao |
| --- | --- | --- | --- |
| `GET /clusters/:id` | stale-while-revalidate | 60s | Apos recovery, apos registrar/remover no |
| `GET /clusters/:id/members` | stale-while-revalidate | 60s | Apos `POST /invites`, `DELETE /members/:id` |
| `GET /nodes` | stale-while-revalidate | 30s | Apos `POST /nodes`, `POST /nodes/:id/drain`, `DELETE /nodes/:id` |
| `GET /files` | stale-while-revalidate | 30s | Apos `POST /files/upload` |
| `GET /files/:id` | stale-while-revalidate | 30s | Polling 3s se status=processing |
| `GET /files/:id/preview` | cache-first (immutable) | Permanente | Nunca — content-addressable por hash |
| `GET /alerts` | stale-while-revalidate | 10s | Apos `PATCH /alerts/:id/resolve` |
| `POST /auth/login` | no-cache | — | — |
| `POST /auth/refresh` | no-cache | — | — |
| `GET /health/ready` | stale-while-revalidate | 60s | refetchOnWindowFocus |
| `GET /clusters/:id/recovery` | no-cache | — | Polling 5s durante recovery ativo |
| Todas as mutations (POST/PATCH/DELETE) | no-cache | — | — |

<!-- APPEND:cache -->

---

## Mapa de Erros por Endpoint

> Como erros da API sao tratados no frontend por endpoint.

### Erros Globais (todos os endpoints)

| Status | Codigo | Acao no Frontend |
| --- | --- | --- |
| 401 | UNAUTHORIZED | Redirecionar para `/login`; limpar sessao |
| 403 | FORBIDDEN | Toast "Sem permissao"; nao redirecionar |
| 500 | INTERNAL_ERROR | Toast generico "Erro interno. Tente novamente." |
| 503 | SERVICE_UNAVAILABLE | Banner "Servidor indisponivel" no topo da pagina |
| Network Error | — | Banner "Sem conexao" com retry automatico (TanStack Query refetchOnReconnect) |

### Erros Especificos por Feature

| Endpoint | Status | Codigo | Acao no Frontend |
| --- | --- | --- | --- |
| `POST /auth/login` | 401 | INVALID_CREDENTIALS | Inline error no formulario: "Email ou senha incorretos" |
| `POST /clusters` | 409 | CLUSTER_ALREADY_EXISTS | Inline error: "Voce ja possui um cluster" |
| `POST /clusters` | 500 | ENTROPY_FAILURE | Dialog de erro critico: "Falha na geracao de chaves. Tente novamente." |
| `POST /clusters/:id/recovery` | 400 | INVALID_SEED | Inline error: "Palavra X nao faz parte do dicionario BIP-39" |
| `POST /clusters/:id/recovery` | 422 | SEED_MISMATCH | Dialog: "Seed nao corresponde a nenhum cluster" |
| `POST /clusters/:id/recovery` | 503 | NODES_UNREACHABLE | Dialog: "Nenhum no acessivel para recovery" |
| `POST /clusters/:id/invites` | 409 | MEMBER_ALREADY_EXISTS | Inline error: "Membro ja existe neste cluster" |
| `POST /invites/:token/accept` | 410 | INVITE_EXPIRED | Pagina de erro: "Convite expirado. Solicite novo convite." |
| `POST /invites/:token/accept` | 403 | INVALID_INVITE | Pagina de erro: "Convite invalido" |
| `POST /nodes` | 422 | CONNECTIVITY_FAILED | Inline error: "Falha na conectividade. Verifique credenciais." |
| `POST /nodes` | 422 | INVALID_CREDENTIALS | Inline error: "Credenciais S3 invalidas" |
| `POST /nodes/:id/drain` | 422 | MIN_NODES_VIOLATION | Dialog: "Minimo de 3 nos necessario" |
| `POST /nodes/:id/drain` | 422 | INSUFFICIENT_SPACE | Dialog: "Espaco insuficiente nos nos restantes" |
| `DELETE /nodes/:id` | 422 | DRAIN_NOT_COMPLETE | Toast: "Drain ainda em andamento" |
| `POST /files/upload` | 413 | FILE_TOO_LARGE | Toast: "Arquivo excede limite de 10GB" |
| `POST /files/upload` | 503 | INSUFFICIENT_NODES | Dialog: "Nos insuficientes para replicacao" |
| `GET /files/:id/download` | 503 | FILE_UNAVAILABLE | Toast: "Arquivo temporariamente indisponivel" |
| `DELETE /members/:memberId` | 422 | CANNOT_REMOVE_ADMIN | Dialog: "Nao e possivel remover o unico admin" |

---

## Autenticacao e Headers

> Como o frontend se autentica em cada request.

| Aspecto | Valor |
| --- | --- |
| Tipo de Token | JWT (RS256, assinado com chave do cluster) |
| Armazenamento | Cookie httpOnly `access_token` (Secure, SameSite=Strict) |
| Expiracao | 24h |
| Refresh | Cookie `refresh_token`; renovacao automatica via `POST /auth/refresh` |
| Envio | Automatico via cookie (browser envia em toda request same-origin) |
| CSRF | SameSite=Strict + verificacao de Origin header no backend |

### Headers Enviados em Toda Request

| Header | Valor | Responsavel |
| --- | --- | --- |
| `Content-Type` | `application/json` (ou `multipart/form-data` para upload) | API client |
| `Accept` | `application/json` | API client |
| `X-Correlation-Id` | UUID v4 (gerado por request) | Interceptor |
| `Cookie` | `access_token=<jwt>` | Browser (automatico) |

### Rate Limit Headers (response)

| Header | Descricao | Uso no Frontend |
| --- | --- | --- |
| `X-RateLimit-Limit` | Limite total de requests por janela | Exibir warning se proximo do limite |
| `X-RateLimit-Remaining` | Requests restantes | Desabilitar botoes se 0 |
| `X-RateLimit-Reset` | Timestamp de reset da janela | Calcular countdown para retry |

---

## Checklist de Validacao

> Antes de lancar uma feature, verificar:

- [ ] Todos os endpoints listados estao implementados no backend
- [ ] Todos os campos consumidos existem no response (validar com Zod em runtime)
- [ ] Formato de paginacao cursor-based esta consistente em todos os endpoints GET com lista
- [ ] Erros de cada endpoint estao mapeados (status → acao no frontend)
- [ ] Cache strategy esta definida para cada endpoint GET
- [ ] Rate limit do endpoint esta dentro do aceitavel para a UX
- [ ] Previews servidos com `Cache-Control: immutable` (content-addressable)
- [ ] Upload multipart usa progress tracking (XMLHttpRequest)
- [ ] Cookie httpOnly configurado corretamente (Secure, SameSite=Strict)
- [ ] CORS configurado para permitir apenas origin do Web Client

> Referenciado por:
> - [docs/backend/05-api-contracts.md](../../backend/05-api-contracts.md) (fonte dos contratos)
> - [docs/frontend/shared/06-data-layer.md](06-data-layer.md) (implementacao do client)
