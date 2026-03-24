# Data Layer

Define a camada de dados do frontend: como a aplicacao se comunica com o backend, o padrao de API client, estrategias de cache e os contratos de dados que garantem type-safety entre frontend e backend. Uma data layer bem definida isola o frontend de mudancas na API e centraliza tratamento de erros.

---

## API Client

> Existe um client centralizado para comunicacao com o backend?

<!-- do blueprint: 06-system-architecture.md + 13-security.md (JWT, TLS 1.3) -->

Responsabilidades do API Client:
- Autenticacao (JWT injection via interceptor, refresh automatico em 401)
- Headers padrao (Content-Type, Accept, X-Request-ID para correlacao)
- Tratamento de erros (mapeamento de status HTTP → mensagens user-friendly)
- Retry automatico (com backoff exponencial para 5xx e network errors)
- Base URL configuration (por ambiente via env var)
- Upload multipart com progress tracking

| Configuracao | Valor |
| --- | --- |
| Base URL | `NEXT_PUBLIC_API_URL` (ex.: `https://api.alexandria.local/api/v1`) |
| Timeout | 30 segundos (requests normais), 10 minutos (upload de video) |
| Retry Policy | 3 tentativas, backoff exponencial (1s, 2s, 4s), somente 5xx e network errors |
| Auth Header | `Authorization: Bearer <accessToken>` via authStore |
| Content-Type | `application/json` (default), `multipart/form-data` (upload) |
| TLS | TLS 1.3 obrigatorio |

**Localizacao:** `src/shared/lib/api-client.ts`

<details>
<summary>Exemplo — API Client com fetch wrapper</summary>

```typescript
// shared/lib/api-client.ts
import { useAuthStore } from '@/shared/store/auth-store';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

interface ApiError {
  error: string;
  code: string;
  details?: Record<string, unknown>;
}

async function request<T>(
  path: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<T> {
  const { timeout = 30_000, ...init } = options;
  const token = useAuthStore.getState().accessToken;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Request-ID': crypto.randomUUID(),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...init.headers,
  };

  try {
    const response = await fetchWithRetry(`${API_BASE}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });

    if (response.status === 401) {
      const refreshed = await refreshToken();
      if (refreshed) return request(path, options); // retry com novo token
      useAuthStore.getState().logout();
      throw new Error('SESSION_EXPIRED');
    }

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw error;
    }

    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, formData: FormData, onProgress?: (pct: number) => void) =>
    uploadWithProgress<T>(`${API_BASE}${path}`, formData, onProgress),
};
```

</details>

---

## Data Fetching

> Qual o padrao para buscar e mutar dados?

**Ferramenta:** TanStack Query v5

<!-- do blueprint: 01-architecture.md (endpoints) + 05-state.md (query keys, stale times) -->

Padrao de organizacao:
```
features/
  gallery/
    api/
      files-api.ts           # Funcoes HTTP puras (getFiles, getFileById, uploadFile)
    hooks/
      useFiles.ts            # useQuery wrapper com filtros e paginacao
      useFileDetail.ts       # useQuery para detalhes de um arquivo
      useFileDownload.ts     # useMutation para download com progress
      useUploadFile.ts       # useMutation para upload multipart
    types/
      gallery.types.ts       # DTOs e interfaces locais
```

### Queries (Leitura)

| Hook | Endpoint | Stale Time | Paginacao | Feature |
| --- | --- | --- | --- | --- |
| useFiles | GET /files?cursor=&limit=&media_type= | 5 min | Cursor-based (infinite scroll) | gallery |
| useFileDetail | GET /files/:id | 5 min | — | gallery |
| useNodes | GET /nodes | 1 min | — | nodes |
| useNodeDetail | GET /nodes/:id | 1 min | — | nodes |
| useAlerts | GET /alerts?resolved=false&severity= | 30s | Cursor-based | health |
| useClusterHealth | GET /cluster/health | 30s | — | health |
| useMembers | GET /members | 5 min | — | cluster |
| useMe | GET /members/me | 10 min | — | settings |
| useRecoveryStatus | GET /recovery/status | 5s (polling ativo) | — | recovery |

### Mutations (Escrita)

| Hook | Endpoint | Invalidacoes | Optimistic? | Feature |
| --- | --- | --- | --- | --- |
| useUploadFile | POST /files/upload | files.all, cluster.health | Nao (progresso real via polling) | upload |
| useCreateCluster | POST /clusters | — (redirect para seed display) | Nao | cluster |
| useCreateInvite | POST /clusters/:id/invite | — (retorna token) | Nao | cluster |
| useAcceptInvite | POST /invites/:token/accept | members.all | Nao | cluster |
| useRegisterNode | POST /nodes | nodes.all, cluster.health | Nao | nodes |
| useDrainNode | POST /nodes/:id/drain | nodes.all, cluster.health, alerts.active | Nao | nodes |
| useResolveAlert | PATCH /alerts/:id/resolve | alerts.active, alerts.all | Sim (remove da lista otimisticamente) | health |
| useLogin | POST /auth/login | — (seta authStore) | Nao | auth |
| useUpdateProfile | PUT /members/me | members.me | Sim (atualiza nome otimisticamente) | settings |
| useStartRecovery | POST /recovery/seed | recovery.status | Nao | recovery |

<!-- APPEND:hooks -->

<details>
<summary>Exemplo — useFiles com infinite scroll e filtros</summary>

```typescript
// features/gallery/api/files-api.ts
import { apiClient } from '@/shared/lib/api-client';
import type { FileDTO, PaginatedResponse } from '@alexandria/types';

export const filesApi = {
  list: (params: { cursor?: string; limit?: number; media_type?: string; search?: string }) =>
    apiClient.get<PaginatedResponse<FileDTO>>(
      `/files?${new URLSearchParams(
        Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])
      )}`
    ),
  getById: (id: string) => apiClient.get<FileDTO>(`/files/${id}`),
  getPreview: (id: string) => `/files/${id}/preview`, // URL direta para <img>
  download: (id: string) => apiClient.get<Blob>(`/files/${id}/download`),
};

// features/gallery/hooks/useFiles.ts
import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys';
import { filesApi } from '../api/files-api';

export function useFiles(clusterId: string, filters: FileFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.files.list(clusterId, filters),
    queryFn: ({ pageParam }) =>
      filesApi.list({ ...filters, cursor: pageParam, limit: 30 }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 5 * 60 * 1000,
  });
}
```

</details>

<details>
<summary>Exemplo — useUploadFile com progresso</summary>

```typescript
// features/upload/hooks/useUploadFile.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/api-client';
import { queryKeys } from '@/shared/lib/query-keys';
import { useUploadStore } from '@/shared/store/upload-store';
import { useAuthStore } from '@/shared/store/auth-store';

export function useUploadFile() {
  const queryClient = useQueryClient();
  const clusterId = useAuthStore((s) => s.clusterId);
  const { updateProgress, setStatus } = useUploadStore();

  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      setStatus(id, 'uploading');
      return apiClient.upload('/files/upload', formData, (pct) =>
        updateProgress(id, pct, 0)
      );
    },
    onSuccess: (_, { id }) => {
      setStatus(id, 'processing');
      if (clusterId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.files.all(clusterId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.cluster.health(clusterId) });
      }
    },
    onError: (error, { id }) => {
      setStatus(id, 'error', error instanceof Error ? error.message : 'Upload falhou');
    },
  });
}
```

</details>

---

## Contratos de API (DTOs)

> Como garantimos type-safety entre frontend e backend?

<!-- do blueprint: 04-domain-model.md (entidades) + 05-data-model.md (campos) -->

- Cada endpoint tem um DTO (Data Transfer Object) tipado em `@alexandria/types`
- Validacao em runtime com Zod para respostas da API (catch malformed responses)
- DTOs gerados manualmente a partir do modelo de dados (futuro: OpenAPI codegen)
- DTOs vivem em `packages/types/src/` (compartilhados) e `features/xxx/types/` (locais)

### DTOs de Response

| DTO | Campos Principais | Validacao |
| --- | --- | --- |
| ClusterDTO | id, clusterId, name, status, createdAt | Zod: status enum (active, suspended) |
| MemberDTO | id, name, email, role, joinedAt | Zod: role enum (admin, member, reader), email format |
| FileDTO | id, originalName, mediaType, originalSize, optimizedSize, contentHash, metadata, status, createdAt | Zod: mediaType enum, status enum, size > 0 |
| PreviewDTO | id, fileId, type, size, format, contentHash | Zod: type enum, format enum |
| NodeDTO | id, type, name, totalCapacity, usedCapacity, status, endpoint, lastHeartbeat, tier | Zod: status enum, capacity >= 0 |
| AlertDTO | id, type, message, severity, resolved, createdAt, resolvedAt | Zod: severity enum, type enum |
| ManifestDTO | id, fileId, chunksJson, replicatedTo, version, createdAt | Zod: chunksJson array |
| InviteDTO | id, email, role, token, expiresAt, acceptedAt | Zod: role enum, email format |
| ClusterHealthDTO | nodesOnline, nodesTotal, capacityUsed, capacityTotal, replicationHealthy, filesTotal, alertsActive | Zod: all numbers >= 0 |

### DTOs de Request

| DTO | Endpoint | Campos | Validacao |
| --- | --- | --- | --- |
| CreateClusterDTO | POST /clusters | name | Zod: name 3-100 chars |
| CreateInviteDTO | POST /clusters/:id/invite | email, role | Zod: email format, role enum |
| AcceptInviteDTO | POST /invites/:token/accept | name | Zod: name 2-100 chars |
| RegisterNodeDTO | POST /nodes | type, name, endpoint, credentials | Zod: type enum, endpoint URL |
| LoginDTO | POST /auth/login | email, password | Zod: email format, password min 8 |
| UpdateProfileDTO | PUT /members/me | name, email | Zod: name 2-100, email format |
| StartRecoveryDTO | POST /recovery/seed | seedPhrase | Zod: array de 12 strings (BIP-39) |

### Respostas paginadas

```typescript
// packages/types/src/pagination.ts
interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;  // null = ultima pagina
  totalCount?: number;         // opcional, caro de computar
}
```

<!-- APPEND:dtos -->

<details>
<summary>Exemplo — FileDTO com Zod schema</summary>

```typescript
// packages/types/src/file.ts
import { z } from 'zod';

export const fileStatusSchema = z.enum(['processing', 'ready', 'error', 'corrupted']);
export const mediaTypeSchema = z.enum(['photo', 'video', 'document']);

export const fileDTOSchema = z.object({
  id: z.string().uuid(),
  originalName: z.string(),
  mediaType: mediaTypeSchema,
  originalSize: z.number().positive(),
  optimizedSize: z.number().positive().nullable(),
  contentHash: z.string().length(64).nullable(),
  metadata: z.record(z.unknown()).nullable(),
  status: fileStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type FileDTO = z.infer<typeof fileDTOSchema>;
export type FileStatus = z.infer<typeof fileStatusSchema>;
export type MediaType = z.infer<typeof mediaTypeSchema>;
```

</details>

---

## BFF — Backend For Frontend

> O frontend usa uma camada BFF para agregar dados?

- [x] Sim — Next.js Route Handlers (minimo, apenas onde necessario)

<!-- do blueprint: 02-architecture_principles.md (Simplicidade Operacional) + 13-security.md (JWT) -->

O BFF e minimo — a maioria das chamadas vai direto do browser para o Orquestrador NestJS. Route Handlers sao usados apenas quando:
1. **Seguranca:** operacao que nao deve expor tokens/credenciais ao browser
2. **Agregacao:** pagina precisa de dados de multiplos endpoints em uma unica chamada SSR
3. **Proxy de preview:** servir previews sem expor URL interna do orquestrador

| Rota BFF | APIs Agregadas | Proposito |
| --- | --- | --- |
| GET /api/gallery/[fileId] | GET /files/:id + GET /files/:id/preview | SSR da pagina de detalhe com preview pre-carregado |
| GET /api/health/summary | GET /cluster/health + GET /alerts?resolved=false&limit=5 | SSR do dashboard com metricas + top 5 alertas |
| GET /api/preview/[fileId] | GET /files/:id/preview (proxy) | Proxy de preview para evitar CORS e expor URL interna |
| POST /api/auth/refresh | POST /auth/refresh | Refresh token server-side (httpOnly cookie seguro) |

### Estrategia de rendering por rota

| Rota | Estrategia | Justificativa |
| --- | --- | --- |
| /gallery | SSR + CSR (hydration) | SSR para SEO-free mas fast first paint; CSR para infinite scroll |
| /gallery/[fileId] | SSR (dados do arquivo + preview) | Primeiro paint com preview ja visivel |
| /health | SSR + polling CSR (30s) | Dados iniciais via SSR; atualizacao frequente via polling |
| /nodes | SSR + CSR | Lista inicial via SSR; status atualiza via polling |
| /upload | CSR only | Interatividade pura (drag-and-drop, progress) |
| /login | SSR (static) | Pagina estatica, sem dados dinamicos |
| /recovery | CSR only | Seed phrase nunca deve ser renderizada no servidor |
| /cluster/setup | CSR only | Seed phrase gerada e exibida somente no cliente |

---

## Estrategia de Cache

> Como o cache e gerenciado em cada camada?

<!-- do blueprint: 03-requirements.md (RNF latencia p95 < 500ms) + 14-scalability.md (caching) -->

| Camada | Estrategia | TTL | Invalidacao |
| --- | --- | --- | --- |
| Browser HTTP Cache | Cache-Control headers do Orquestrador | Previews: 1 ano (imutaveis, hash no path); API: no-cache | ETag para previews; no-cache para dados dinamicos |
| TanStack Query Cache | staleTime + gcTime por dominio | 30s (alertas) a 10min (perfil) | invalidateQueries apos mutations (ver 05-state.md) |
| Next.js Server Cache | fetch cache em Server Components | 60s para paginas SSR (revalidate) | revalidatePath em mutations via Route Handlers |
| Static Assets (CDN) | JS/CSS bundles com content hash | 1 ano (cache busting via hash no filename) | Deploy automatico com novos hashes |
| Preview Images | Servidos via proxy BFF com Cache-Control | 1 ano (preview e imutavel — se arquivo muda, novo preview_id) | Imutavel — nao precisa invalidar |

<!-- APPEND:cache -->

### Cache por dominio

| Dominio | Stale Time | GC Time | Refetch on Focus | Polling |
| --- | --- | --- | --- | --- |
| files (galeria) | 5 min | 30 min | Sim | Nao |
| files (detalhe) | 5 min | 30 min | Sim | Nao |
| nodes | 1 min | 10 min | Sim | Nao |
| alerts | 30s | 5 min | Sim | Nao (refetch on focus suficiente) |
| cluster health | 30s | 5 min | Sim | Nao |
| members | 5 min | 30 min | Sim | Nao |
| me (perfil) | 10 min | 60 min | Nao | Nao |
| recovery status | 5s | 1 min | Nao | Sim (polling ativo durante recovery) |

### Regras de cache

- **Previews sao imutaveis:** se um arquivo e reprocessado, ganha novo `preview_id`. URL antiga continua valida. Permite cache agressivo (1 ano).
- **Dados de monitoramento (alertas, health) tem stale time curto** (30s) porque sao criticos para operacao.
- **Dados de conteudo (files, members) tem stale time longo** (5-10min) porque mudam raramente.
- **Recovery usa polling ativo** (5s) porque o usuario esta aguardando progresso em tempo real.
- **Prefetch de proxima pagina** no infinite scroll da galeria: quando usuario chega a 80% do scroll, prefetch da proxima pagina.

> Gerenciamento de estado e cache: (ver 05-state.md)
