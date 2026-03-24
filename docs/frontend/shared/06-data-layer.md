# Data Layer

Define a camada de dados do frontend: como a aplicacao se comunica com o backend, o padrao de API client, estrategias de cache e os contratos de dados que garantem type-safety entre frontend e backend. Uma data layer bem definida isola o frontend de mudancas na API e centraliza tratamento de erros.

> **Implementa:** [docs/blueprint/05-data-model.md](../../blueprint/05-data-model.md) (modelo de dados), [docs/blueprint/06-system-architecture.md](../../blueprint/06-system-architecture.md) (comunicacao).
> **Complementa:** [docs/frontend/web/05-state.md](../web/05-state.md) (server state via TanStack Query).

<!-- do blueprint: 06-system-architecture.md (REST API, TLS 1.3), 05-data-model.md (tabelas e queries), 03-requirements.md (SLAs performance) -->

---

## API Client

> Existe um client centralizado para comunicacao com o backend?

Responsabilidades do API Client:
- Autenticacao (JWT injection via interceptor — token do membro autenticado)
- Headers padrao (Content-Type: application/json, Accept, X-Correlation-Id para tracing)
- Tratamento de erros (interceptor mapeia HTTP status para erros tipados do dominio)
- Retry automatico (com backoff exponencial para falhas de rede e 5xx)
- Base URL configuration (por ambiente: dev localhost:8080, prod via Caddy reverse proxy)

**Web:**

| Configuracao | Valor |
| --- | --- |
| Base URL | `/api` (proxy via Next.js → Orquestrador :8080) |
| Timeout | 30 segundos (uploads: 5 minutos) |
| Retry Policy | 3 tentativas, backoff exponencial (1s, 2s, 4s), apenas para GET e status 5xx/network error |
| Auth Header | `Authorization: Bearer <jwt>` (injetado via interceptor; token vem de cookie httpOnly) |

**Mobile:**

<!-- do blueprint: mobile/00-frontend-vision.md (expo-secure-store para JWT), 06-system-architecture.md (REST TLS 1.3) -->

| Configuracao | Valor |
| --- | --- |
| Base URL | `https://<orchestrator-domain>:8080` (dominio configurado em `app.config.ts`, nao proxy) |
| Timeout | 30 segundos (uploads: sem limite — streaming progressivo) |
| Retry Policy | 3 tentativas, backoff exponencial (1s, 2s, 4s), apenas GET/5xx/network error |
| Auth Header | `Authorization: Bearer <jwt>` (token obtido de `expo-secure-store` via interceptor) |
| Offline | Requests falham graciosamente; upload enfileirado no SQLite para retry quando online |

<!-- do blueprint: 06-system-architecture.md (HTTPS/REST TLS 1.3, porta 8080) -->

**Desktop:**

<!-- do blueprint: desktop/00-frontend-vision.md — Electron 34, IPC; desktop/01-architecture.md — renderer nunca acessa Node.js diretamente -->

| Configuracao | Valor |
| --- | --- |
| Base URL | `https://<orchestrator-domain>:8080` (salvo em `electron-store`, configurado no onboarding) |
| Timeout | 30 segundos (uploads: sem limite — stream progressivo via IPC) |
| Retry Policy | 3 tentativas, backoff exponencial — executado no main process |
| Auth Header | `Authorization: Bearer <jwt>` (main process le JWT do `safeStorage`, nunca expoe ao renderer) |
| Camada de transporte | IPC: renderer invoca `window.electronAPI.invoke(channel, params)` → main faz HTTP real |

> **Arquitetura critica:** O renderer nunca faz requests HTTP direto. O `apiClient` do renderer e um stub IPC — cada metodo chama `invoke(channel)` no main process, que executa o fetch Node.js real com TLS 1.3. Isso mantem o renderer sandboxed e o JWT fora do contexto web.

```typescript
// apps/desktop/src/main/services/api-client.ts — cliente HTTP real (Node.js)
import fetch from 'node-fetch';
import { safeStorage } from 'electron';
import { store } from '../store';

const BASE_URL = store.get('orchestratorUrl') as string;

export async function apiRequest<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const encryptedToken = store.get('auth.token') as Buffer | undefined;
  const token = encryptedToken ? safeStorage.decryptString(encryptedToken) : null;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<T>;
}
```

**Localizacao Web:** `src/lib/api-client.ts` | **Localizacao Mobile:** `src/services/api-client.ts` | **Localizacao Desktop (main):** `src/main/services/api-client.ts`

### Implementacao Web

O API client web e um wrapper sobre `fetch` nativo (sem axios) para manter o bundle leve e compativel com Server Components (RSC). A configuracao e centralizada e exporta funcoes tipadas.

```typescript
// src/lib/api-client.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

interface ApiClientConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

const config: ApiClientConfig = {
  baseUrl: BASE_URL,
  timeout: 30_000,
  retries: 3,
};

async function request<T>(
  path: string,
  options?: RequestInit & { timeout?: number }
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options?.timeout ?? config.timeout
  );

  try {
    const res = await fetch(`${config.baseUrl}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!res.ok) throw new ApiError(res.status, await res.json());
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
```

### Interceptors

| Interceptor | Tipo | Descricao |
| --- | --- | --- |
| Auth | Request | Injeta `Authorization: Bearer <jwt>` em toda request. Token obtido via `getSession()` (NextAuth ou cookie httpOnly) |
| Correlation ID | Request | Gera UUID v4 e envia como `X-Correlation-Id` para tracing distribuido |
| Error Mapping | Response | Mapeia status HTTP para erros tipados: 401 → `UnauthorizedError`, 403 → `ForbiddenError`, 404 → `NotFoundError`, 422 → `ValidationError`, 5xx → `ServerError` |
| Retry | Response | Retenta automaticamente em falhas de rede e 5xx (apenas metodos idempotentes: GET, PUT, DELETE) |

### Erros Tipados

```typescript
// src/lib/api-errors.ts
export class ApiError extends Error {
  constructor(
    public status: number,
    public body: { code: string; message: string; details?: unknown }
  ) {
    super(body.message);
  }
}

export class UnauthorizedError extends ApiError {} // 401
export class ForbiddenError extends ApiError {}    // 403
export class NotFoundError extends ApiError {}     // 404
export class ValidationError extends ApiError {}   // 422
export class ServerError extends ApiError {}       // 5xx
```

---

## Data Fetching

> Qual o padrao para buscar e mutar dados?

**Ferramenta:** TanStack Query v5

<!-- do blueprint: 06-system-architecture.md (Web Client comunica com Orquestrador via REST API) -->

### Estrategia por Contexto de Renderizacao

| Contexto | Estrategia | Quando Usar |
| --- | --- | --- |
| Server Components (RSC) | `fetch` direto no servidor com `cache: 'force-cache'` ou `revalidate` | Dados que podem ser pre-renderizados: cluster info, lista de membros, dados iniciais da galeria |
| Client Components (CSR) | TanStack Query `useQuery` / `useMutation` | Dados interativos: galeria com scroll infinito, upload progress, alertas em tempo real |
| Server Actions | `'use server'` functions com revalidacao | Mutations server-side: aceitar convite, update de perfil |
| Hybrid (prefetch) | RSC faz prefetch → hydrate no client via TanStack Query `HydrationBoundary` | Dados que precisam de SSR inicial + interatividade client (galeria, dashboard) |

### Padrao de Organizacao

```
features/
  files/
    api/
      files-api.ts           # Funcoes de API (getFiles, uploadFile, downloadFile)
    hooks/
      useFiles.ts            # useQuery wrapper — lista de arquivos
      useFile.ts             # useQuery wrapper — detalhe do arquivo
      useUploadFile.ts       # useMutation wrapper — upload
      useDownloadFile.ts     # useMutation wrapper — download sob demanda
    types/
      file.types.ts          # DTOs e interfaces
  nodes/
    api/
      nodes-api.ts
    hooks/
      useNodes.ts
      useNode.ts
      useRegisterNode.ts
      useDrainNode.ts
    types/
      node.types.ts
```

### Hooks Principais

| Hook | Tipo | Endpoint | Stale Time | Observacao |
| --- | --- | --- | --- | --- |
| useFiles | Query | GET /files?cluster_id=X&status=ready | 30s | Galeria — paginacao por cursor (created_at) |
| useFile | Query | GET /files/:id | 30s | Detalhe — polling 3s se status=processing |
| useUploadFile | Mutation | POST /files/upload (multipart) | — | Progress tracking via XMLHttpRequest |
| useDownloadFile | Mutation | GET /files/:id/download | — | Reassembly sob demanda; retorna signed URL ou stream |
| useNodes | Query | GET /nodes?cluster_id=X | 30s | Lista de nos do cluster |
| useNode | Query | GET /nodes/:id | 10s | Polling 10s se status=draining |
| useRegisterNode | Mutation | POST /nodes | — | Registro de novo no |
| useDrainNode | Mutation | POST /nodes/:id/drain | — | Inicia drain do no |
| useAlerts | Query | GET /alerts?cluster_id=X&resolved=false | 10s | Badge de alertas ativos |
| useCluster | Query | GET /clusters/:id | 60s | Health do cluster, capacidade total |
| useMembers | Query | GET /clusters/:id/members | 60s | Lista de membros |
| useInviteMember | Mutation | POST /invites | — | Gera token de convite assinado |
| useAcceptInvite | Mutation | POST /invites/:token/accept | — | Aceita convite e ingressa no cluster |
| useRecoveryStatus | Query | GET /recovery/status | — | Polling 5s durante recovery via seed |

### Hooks Mobile-Específicos

<!-- do blueprint: mobile/00-frontend-vision.md (expo-background-fetch, expo-media-library), mobile/05-state.md (uploadStore, syncEngine) -->

Os hooks abaixo sao exclusivos do app mobile. Os hooks da tabela acima sao compartilhados (mesmos endpoints, mesmo TanStack Query).

| Hook | Tipo | Descrição | Específico Mobile |
| --- | --- | --- | --- |
| `useSyncEngine` | Service hook | Inicia/para Sync Engine background; detecta novas midias no camera roll via `expo-media-library`; enfileira no `uploadStore` | Sim — `expo-background-fetch` |
| `useUploadQueue` | Store hook | Acessa `uploadStore.queue`; expoe progresso, status e acoes (pause, retry, cancel) por item | Sim — SQLite persistido |
| `useSpaceRelease` | Mutation | Solicita liberacao de espaco: substitui originais por thumbnails localmente apos confirmar 3+ replicas | Sim — `expo-file-system` |
| `useMediaPermission` | Native hook | Solicita permissao de acesso ao camera roll (`expo-media-library.requestPermissionsAsync`) | Sim |
| `useNotificationPermission` | Native hook | Solicita permissao de push notifications (`expo-notifications.requestPermissionsAsync`) | Sim |
| `useAppState` | Lifecycle hook | Detecta foreground/background via `AppState`; revalida queries ao voltar para foreground | Sim |
| `useNetworkStatus` | Native hook | Detecta conectividade via `@react-native-community/netinfo`; pausa sync em modo offline | Sim |

### Hooks Desktop-Específicos

<!-- do blueprint: desktop/01-architecture.md — IPC channels; desktop/05-state.md — syncStore, nodeAgent -->

Os hooks abaixo sao exclusivos do app desktop. Os hooks da tabela principal acima sao compartilhados (mesmos endpoints, mesmo TanStack Query — mas `queryFn` usa `window.electronAPI.invoke` em vez de `fetch` direto).

| Hook | Tipo | Descricao | Canal IPC |
| --- | --- | --- | --- |
| `useSyncEngine` | Service hook | Inicia/para Sync Engine no main process; escuta eventos `sync:progress` e `sync:queue-update` via IPC | `sync:start`, `sync:stop` |
| `useNodeAgent` | Service hook | Acessa status do Node Agent (heartbeat, chunks armazenados, capacidade); escuta `node:status` | `node:status` (push) |
| `useClusterHealth` | Query | Saude do cluster via IPC → main → API; polling 30s automatico | `cluster:health` |
| `useVaultUnlock` | Mutation | Envia senha para main process desbloquear vault; recebe `{ success, memberId }` | `vault:unlock` |
| `useFileDownload` | Mutation | Solicita download ao main process (IPC); main bucha chunks, decripta, salva localmente | `file:download` |
| `useFolderPicker` | Mutation | Abre `dialog.showOpenDialog` no main via IPC; retorna path selecionado | `dialog:open-folder` |
| `useAppUpdate` | Service hook | Escuta `app:update-available` do auto-updater; dispara `update:install` ao confirmar | `app:update-available`, `update:install` |
| `useWindowBounds` | Utility hook | Le/persiste posicao e tamanho da janela via electron-store | `window:get-bounds`, `window:save-bounds` |

<!-- APPEND:hooks -->

<details>
<summary>Exemplo — Query com prefetch SSR + hydration</summary>

```typescript
// app/dashboard/files/page.tsx (Server Component)
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { filesApi } from '@/features/files/api/files-api';
import { FileGallery } from '@/features/files/components/FileGallery';

export default async function FilesPage({ searchParams }: { searchParams: { cursor?: string } }) {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['files', clusterId, { cursor: searchParams.cursor }],
    queryFn: () => filesApi.list(clusterId, { cursor: searchParams.cursor }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FileGallery />
    </HydrationBoundary>
  );
}
```

</details>

<details>
<summary>Exemplo — Upload com progress tracking</summary>

```typescript
// features/files/api/files-api.ts
export const filesApi = {
  upload: (
    clusterId: string,
    file: File,
    onProgress: (percent: number) => void
  ): Promise<FileDTO> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('cluster_id', clusterId);

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) onProgress((e.loaded / e.total) * 100);
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new ApiError(xhr.status, JSON.parse(xhr.responseText)));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Upload failed')));
      xhr.open('POST', `${BASE_URL}/files/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${getToken()}`);
      xhr.send(formData);
    });
  },
};

// features/files/hooks/useUploadFile.ts
export function useUploadFile(clusterId: string) {
  const queryClient = useQueryClient();
  const setProgress = useUploadStore((s) => s.setProgress);

  return useMutation({
    mutationFn: (file: File) =>
      filesApi.upload(clusterId, file, (percent) => setProgress(file.name, percent)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', clusterId] });
    },
  });
}
```

</details>

---

## Contratos de API (DTOs)

> Como garantimos type-safety entre frontend e backend?

- Cada endpoint tem um DTO (Data Transfer Object) tipado com TypeScript
- Validacao em runtime com **Zod** (schemas colocalizados com os tipos)
- DTOs vivem em `features/xxx/types/`
- Transformacao de snake_case (API) para camelCase (frontend) no API client

<!-- do blueprint: 05-data-model.md (tabelas e campos), 04-domain-model.md (entidades e regras) -->

### DTOs Principais

| DTO | Campos Principais | Validacao |
| --- | --- | --- |
| ClusterDTO | id, clusterId, name, status, createdAt | Zod: name max 100 chars, status enum |
| MemberDTO | id, name, email, role, joinedAt | Zod: email validation, role enum (admin, member, reader) |
| FileDTO | id, originalName, mediaType, mimeType, originalSize, optimizedSize, status, metadata, createdAt | Zod: mediaType enum (photo, video, document), size positive int |
| PreviewDTO | id, fileId, type, size, format, storagePath | Zod: type enum (thumbnail, video_preview, pdf_page, generic_icon) |
| NodeDTO | id, name, type, totalCapacity, usedCapacity, status, tier, lastHeartbeat | Zod: type enum (local, s3, r2, b2, vps), capacity positive bigint |
| AlertDTO | id, type, message, severity, resolved, createdAt | Zod: severity enum (info, warning, critical), type enum |
| InviteDTO | id, email, role, expiresAt, acceptedAt | Zod: email validation, expiresAt future date |
| ManifestDTO | id, fileId, chunksCount, replicatedTo, version | Zod: version positive int |

<!-- APPEND:dtos -->

<details>
<summary>Exemplo — Zod schema + tipo derivado</summary>

```typescript
// features/files/types/file.types.ts
import { z } from 'zod';

export const FileStatus = z.enum(['processing', 'ready', 'error', 'corrupted']);
export const MediaType = z.enum(['photo', 'video', 'document']);

export const fileDTOSchema = z.object({
  id: z.string().uuid(),
  originalName: z.string().max(500),
  mediaType: MediaType,
  mimeType: z.string(),
  originalSize: z.number().positive(),
  optimizedSize: z.number().positive().nullable(),
  contentHash: z.string().length(64).nullable(),
  metadata: z.record(z.unknown()).nullable(),
  status: FileStatus,
  errorMessage: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  preview: z.object({
    type: z.enum(['thumbnail', 'video_preview', 'pdf_page', 'generic_icon']),
    url: z.string().url(),
  }).nullable(),
});

export type FileDTO = z.infer<typeof fileDTOSchema>;

// Validacao em runtime no API client
export function parseFileResponse(data: unknown): FileDTO {
  return fileDTOSchema.parse(data);
}
```

</details>

### Transformacao de Dados

| Direcao | Transformacao | Responsavel |
| --- | --- | --- |
| API → Frontend | snake_case → camelCase nos campos | Interceptor do API client (automatico) |
| Frontend → API | camelCase → snake_case no body | Interceptor do API client (automatico) |
| API → Domain | DTO → Domain Model (ex: FileDTO → File) | Mapper em `features/xxx/mappers/` |

> Os DTOs representam o contrato com a API. Domain Models representam o contrato interno do frontend. A separacao permite que o frontend evolua independentemente do backend.

---

## BFF — Backend For Frontend

> O frontend usa uma camada BFF para agregar dados?

**Web:** [x] Sim — Next.js Route Handlers + Server Actions

**Mobile:** [ ] Nao — App mobile chama o Orquestrador diretamente via REST API (HTTPS/TLS 1.3). Nao ha camada BFF intermediaria. O JWT e obtido do `expo-secure-store` e injetado diretamente no header `Authorization` pelo API client mobile.

**Desktop:** [ ] Nao — Nao ha BFF. O main process atua como **IPC bridge**: renderer invoca channels → main executa o fetch HTTP real com Node.js → retorna resultado ao renderer via IPC. O main process e o unico que conhece a URL do orquestrador e o JWT.

<!-- do blueprint: desktop/01-architecture.md — renderer nunca importa Node.js; IPC e o unico canal -->

> **Diferenca arquitetural desktop:** O "BFF" no desktop e o proprio main process. Ele agrega chamadas, gerencia autenticacao e protege o renderer de acesso direto a rede. A diferenca e que nao ha HTTP entre renderer e main — o protocolo e IPC (Chromium IPC, nao HTTP).

<!-- do blueprint: 06-system-architecture.md (Web Client Next.js comunica com Orquestrador via REST) -->

<!-- do blueprint: 06-system-architecture.md (Web Client Next.js comunica com Orquestrador via REST) -->

O Next.js 16 atua como BFF leve via Route Handlers (`app/api/`) e Server Actions. Responsabilidades:

1. **Proxy autenticado:** Route Handlers fazem proxy das requests para o Orquestrador (:8080), injetando JWT server-side (cookie httpOnly → header Authorization). O token nunca e exposto ao browser.
2. **Agregacao de dados:** Endpoints BFF combinam multiplas chamadas ao Orquestrador em uma unica resposta otimizada para a tela.
3. **Transformacao de payload:** Filtra campos sensiveis (hashes, chaves) e formata dados para consumo direto pela UI.
4. **Upload proxy:** Recebe multipart do browser e encaminha ao Orquestrador com streaming (sem buffer completo em memoria).

| Rota BFF | APIs Agregadas no Orquestrador | Proposito |
| --- | --- | --- |
| GET /api/dashboard | GET /clusters/:id + GET /nodes?cluster_id=X + GET /alerts?resolved=false | Dashboard: health do cluster, nos online, alertas ativos em uma chamada |
| GET /api/gallery | GET /files?cluster_id=X&status=ready + previews embutidos | Galeria com thumbnails pre-resolvidos; cursor pagination |
| POST /api/upload | POST /files/upload (stream proxy) | Upload com progress; injeta JWT server-side |
| GET /api/file/:id | GET /files/:id + GET /manifests?file_id=X | Detalhe do arquivo com info de replicacao |
| POST /api/recovery/start | POST /recovery/start | Inicia recovery via seed phrase; seed processada server-side |
| GET /api/nodes/:id/health | GET /nodes/:id + GET /chunk-replicas?node_id=X (count) | Saude do no com contagem de chunks |

### Server Actions

| Action | Endpoint | Uso |
| --- | --- | --- |
| acceptInvite | POST /invites/:token/accept | Aceitar convite — processa token server-side |
| updateMemberRole | PATCH /members/:id | Alterar role de membro (admin only) |
| createInvite | POST /invites | Gerar convite com token assinado |
| drainNode | POST /nodes/:id/drain | Iniciar drain de no — confirmacao server-side |

---

## Estrategia de Cache

> Como o cache e gerenciado em cada camada?

<!-- do blueprint: 03-requirements.md (latencia p95 < 500ms, performance API metadata) -->

| Camada | Estrategia | TTL | Invalidacao |
| --- | --- | --- | --- |
| Browser Cache | Cache-Control headers do Orquestrador | Definido pelo backend (ETag para metadata) | ETag / Last-Modified / 304 Not Modified |
| Query Cache (TanStack Query) | staleTime + gcTime por dominio | 10s–60s conforme frequencia de mudanca | `invalidateQueries` apos mutations; `refetchOnWindowFocus` |
| Server Cache (Next.js) | RSC `fetch` com `revalidate` | 60s para dados do cluster; 30s para galeria | `revalidatePath` apos Server Actions; `revalidateTag` por dominio |
| CDN (assets estaticos) | Caddy serve com hash no filename | 1 ano (imutavel por hash) | Deploy gera novos hashes automaticamente |
| Preview Cache | Thumbnails/previews servidos com `Cache-Control: immutable` | Permanente (content-addressable por hash) | Nunca invalida — hash muda se conteudo muda |

### Camadas de Cache Mobile-Específicas

<!-- do blueprint: mobile/00-frontend-vision.md (expo-image, SQLite), mobile/05-state.md (uploadStore SQLite) -->

| Camada | Estrategia | TTL | Invalidacao |
| --- | --- | --- | --- |
| expo-image Disk Cache | Thumbnails/previews cacheados em disco por `expo-image` | Permanente (content-addressable, mesmo comportamento do web) | Nunca invalida — nova URL = novo cache |
| expo-image Memory Cache | LRU em memoria para thumbnails visiveis na tela atual | Sessao (limpo ao fechar app) | Automatico pelo LRU do expo-image |
| SQLite — Upload Queue | Fila de uploads persistida entre restarts e sessoes | Permanente ate upload confirmado + 3 replicas | Item removido da queue apos `file:upload:completed` |
| SQLite — Metadata Cache | Cache local de metadados de arquivos para gallery offline | 24h; invalidado ao abrir o app e reconectar | `invalidateQueries` ao voltar para foreground |
| TanStack Query Memory | Mesmo padrao do web — staleTime/gcTime por dominio | Ver tabela de dominios (mobile/05-state.md) | `invalidateQueries` apos mutations |

**Configuracao expo-image para thumbnails:**

```tsx
// components/ui/PhotoThumbnail.tsx
import { Image } from 'expo-image';

// blurhash placeholder enquanto thumbnail carrega
const BLUR_HASH = '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

<Image
  source={{ uri: previewUrl }}
  placeholder={{ blurhash: BLUR_HASH }}
  contentFit="cover"
  cachePolicy="disk"          // persiste em disco permanentemente
  transition={200}            // fade in suave
  style={{ width: '100%', aspectRatio: 1 }}
/>
```

### Camadas de Cache Desktop-Específicas

<!-- do blueprint: desktop/00-frontend-vision.md — electron-store, offline-capable; desktop/05-state.md — vaultStore em memoria -->

| Camada | Estrategia | TTL | Invalidacao |
| --- | --- | --- | --- |
| TanStack Query Memory | Mesmo padrao do web — staleTime/gcTime por dominio | Ver tabela de dominios (desktop/05-state.md) | `invalidateQueries` apos mutations; IPC push events disparam invalidacao manual |
| electron-store (Disk) | Settings, JWT criptografado, watchedFolders, window bounds | Permanente ate usuario alterar | Escrita sincrona a cada mudanca via IPC `store:set` |
| Vault (Memory only) | Credenciais decriptadas mantidas em memoria no main process apos unlock | Sessao (limpo ao bloquear vault ou fechar app) | `vault:lock` IPC event → main process limpa objeto em memoria |
| Preview/Thumbnail (Memory) | TanStack Query caches URLs de thumbnail; re-fetch se stale | gcTime 5min | `invalidateQueries(['files'])` apos novos uploads |
| IPC Response Cache | Nenhum — cada `invoke` e sincrono ao main process que consulta cache propria ou faz fetch | — | Gerenciado pelo TanStack Query no renderer |

> **Nao ha disk cache de thumbnails no desktop v1.** O app exibe previews via URL que o main process resolve (download sob demanda + memory cache do TanStack Query). Disk cache de thumbnails pode ser adicionado em v2 se performance exigir.

<!-- APPEND:cache -->

### Configuracao TanStack Query por Dominio

| Dominio | staleTime | gcTime | Polling | Justificativa |
| --- | --- | --- | --- | --- |
| Files (galeria) | 30s | 5min | — | Arquivos novos aparecem apos upload; nao precisa de real-time |
| File (detalhe) | 30s | 5min | 3s (se processing) | Polling curto durante processamento do pipeline |
| Nodes | 30s | 5min | — | Status de nos muda com pouca frequencia |
| Node (detalhe) | 10s | 5min | 10s (se draining) | Acompanhar progresso de drain |
| Alerts | 10s | 2min | — | Alertas precisam de visibilidade rapida |
| Cluster | 60s | 10min | — | Dados do cluster sao quase estaticos |
| Members | 60s | 10min | — | Membros mudam raramente |
| Recovery | — | 0 | 5s (durante recovery) | Sem cache; sempre fresco durante recovery |

### Invalidacao Otimista (Optimistic Updates)

| Mutation | Invalidacao | Otimista? |
| --- | --- | --- |
| Upload file | `['files', clusterId]` | Nao — arquivo entra como `processing`, UI mostra skeleton ate `ready` |
| Delete file | `['files', clusterId]` | Sim — remove do cache imediatamente, rollback em caso de erro |
| Register node | `['nodes', clusterId]` | Nao — no precisa de heartbeat para confirmar status `online` |
| Drain node | `['node', nodeId]` | Sim — atualiza status para `draining` no cache local |
| Accept invite | `['members', clusterId]` | Nao — redireciona para dashboard apos sucesso |
| Resolve alert | `['alerts', clusterId]` | Sim — remove da lista imediatamente |

> **Estrategia geral:** dados frequentemente atualizados usam staleTime curto (10-30s). Dados quase estaticos usam cache longo (60s+). Previews sao imutaveis por design (content-addressable). Mutations que afetam UX imediata usam optimistic updates; mutations com efeitos colaterais complexos (upload, register) aguardam confirmacao do servidor.

> Gerenciamento de estado e cache: (ver [05-state.md](../web/05-state.md))
