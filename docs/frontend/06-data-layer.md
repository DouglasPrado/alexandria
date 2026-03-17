# Data Layer

Define a camada de dados do frontend: como a aplicacao se comunica com o orquestrador e nos de armazenamento, o padrao de API client, estrategias de cache e os contratos de dados que garantem type-safety entre frontend e backend. Uma data layer bem definida isola o frontend de mudancas na API e centraliza tratamento de erros.

---

## API Client

> Existe um client centralizado para comunicacao com o backend?

O Alexandria possui dois clientes de API distintos:

1. **Orchestrator API Client** — comunicacao com o orquestrador central (metadata, manifests, cluster management)
2. **Storage Client** — comunicacao direta com nos de armazenamento para upload/download de chunks criptografados

### Orchestrator API Client

Responsabilidades:
- Autenticacao via token do cluster (assinado com Ed25519)
- Headers padrao (Content-Type, X-Cluster-Id, X-Member-Id, X-Request-Id para correlacao)
- Tratamento de erros com mapeamento de status HTTP
- Retry automatico com backoff exponencial (embrace failure)
- Rate limiting client-side para respeitar limites do orquestrador

| Configuracao | Valor |
| --- | --- |
| Base URL | `https://{cluster-domain}/api/v1` (DNS fixo configurado pelo admin) |
| Timeout | 30 segundos (metadata), 120 segundos (uploads) |
| Retry Policy | 3 tentativas, backoff exponencial (1s, 2s, 4s) |
| Auth Header | `Authorization: Bearer <cluster-token>` (assinado Ed25519) |
| TLS | TLS 1.3 obrigatorio (RF-053) |

**Localizacao:** `src/services/orchestrator-client.ts`

### Storage Client

Responsabilidades:
- Upload/download de chunks criptografados direto para nos
- Multipart upload para chunks de ~4MB
- Verificacao de hash SHA-256 apos download
- Adaptadores por tipo de no (local, S3, R2, Google Drive, Dropbox, OneDrive)

| Configuracao | Valor |
| --- | --- |
| Chunk Size | ~4MB por chunk |
| Upload paralelo | Ate 3 chunks simultaneos (configuravel) <!-- inferido do PRD --> |
| Timeout | 120 segundos por chunk |
| Verificacao | SHA-256 hash check apos download |

**Localizacao:** `src/services/storage-client.ts`

---

## Data Fetching

> Qual o padrao para buscar e mutar dados?

**Ferramenta:** TanStack Query v5

Padrao de organizacao:
```
features/
  gallery/
    api/
      gallery-api.ts         # Funcoes de API (getPhotos, getManifest)
    hooks/
      useGallery.ts          # useQuery wrapper para lista de fotos
      useManifest.ts         # useQuery wrapper para manifest de arquivo
      useDownloadFile.ts     # useMutation wrapper para download sob demanda
    types/
      gallery.types.ts       # DTOs e interfaces
```

### Queries (Leitura)

| Hook | Endpoint | Stale Time | Descricao |
| --- | --- | --- | --- |
| useGallery | `GET /api/v1/files?type=photo&sort=date` | 10 min | Lista de fotos/videos com thumbnails e metadata |
| useManifest | `GET /api/v1/files/:id/manifest` | 30 min | Manifest do arquivo (lista de chunks + hashes) |
| useTimeline | `GET /api/v1/files/timeline?group=month` | 10 min | Fotos agrupadas por mes/ano para timeline |
| useSearchFiles | `GET /api/v1/files/search?q=...` | 5 min | Busca por nome, data, tipo, tags, metadados |
| useNodes | `GET /api/v1/nodes` | 30 seg | Lista de nos com status, capacidade, heartbeat |
| useNodeDetail | `GET /api/v1/nodes/:id` | 30 seg | Detalhes do no: espaco, chunks, tier |
| useCluster | `GET /api/v1/cluster` | 5 min | Dados do cluster: membros, permissoes, config |
| useMembers | `GET /api/v1/cluster/members` | 5 min | Lista de membros com roles e dispositivos |
| useClusterHealth | `GET /api/v1/health` | 30 seg | Saude: replicacao, capacidade, alertas |
| useAlerts | `GET /api/v1/health/alerts` | 30 seg | Lista de alertas ativos (no offline, replicacao baixa) |
| useReplicationStatus | `GET /api/v1/health/replication` | 30 seg | Porcentagem de chunks com 3+ replicas |
| useVaultStatus | `GET /api/v1/vault/status` | 5 min | Status dos tokens OAuth (ativo/expirando/expirado) |

### Mutations (Escrita)

| Hook | Endpoint | Invalidates | Descricao |
| --- | --- | --- | --- |
| useUploadFile | `POST /api/v1/files/upload` | `['gallery']` | Upload de arquivo via pipeline completo |
| useConfirmManifest | `POST /api/v1/files/:id/manifest` | `['manifest', id]` | Confirmar manifest apos distribuicao de chunks |
| useDeleteFile | `DELETE /api/v1/files/:id` | `['gallery']` | Deletar arquivo e seus chunks |
| useRegisterNode | `POST /api/v1/nodes` | `['nodes']` | Registrar novo no (local, cloud, S3) |
| useDrainNode | `POST /api/v1/nodes/:id/drain` | `['nodes'], ['health']` | Migrar chunks antes de desconectar no |
| useInviteMember | `POST /api/v1/cluster/invite` | `['members']` | Gerar token de convite para novo membro |
| useUpdatePermission | `PATCH /api/v1/cluster/members/:id` | `['members']` | Atualizar permissao de membro |
| useConnectCloud | `POST /api/v1/nodes/oauth/:provider` | `['nodes']` | Conectar conta cloud via OAuth |
| useRefreshToken | `POST /api/v1/vault/refresh/:provider` | `['vault']` | Renovar token OAuth expirado |
| useInitRecovery | `POST /api/v1/recovery/init` | Tudo | Iniciar recovery via seed phrase |

<!-- APPEND:hooks -->

<details>
<summary>Exemplo — useGallery + useUploadFile</summary>

```typescript
// features/gallery/api/gallery-api.ts
export const galleryApi = {
  getPhotos: (filters: GalleryFilters) =>
    orchestratorClient.get<PaginatedResponse<FileDTO>>('/files', { params: filters })
      .then((res) => res.data),
  getManifest: (fileId: string) =>
    orchestratorClient.get<ManifestDTO>(`/files/${fileId}/manifest`)
      .then((res) => res.data),
};

// features/gallery/hooks/useGallery.ts
export function useGallery(filters: GalleryFilters) {
  return useQuery({
    queryKey: ['gallery', filters],
    queryFn: () => galleryApi.getPhotos(filters),
    staleTime: 10 * 60 * 1000,
  });
}

// features/upload/hooks/useUploadFile.ts
export function useUploadFile() {
  const queryClient = useQueryClient();
  const eventBus = useEventBus();

  return useMutation({
    mutationFn: async (file: File) => {
      // Pipeline: analyze → resize → encrypt → chunk → distribute → confirm
      const optimized = await mediaOptimizer.process(file);
      const encrypted = await cryptoService.encrypt(optimized);
      const chunks = await chunker.split(encrypted);
      const manifest = await uploadApi.distribute(chunks);
      return uploadApi.confirmManifest(manifest);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      eventBus.emit('upload:complete', {
        fileId: result.fileId,
        manifestId: result.manifestId,
        thumbnailUrl: result.thumbnailUrl,
      });
    },
  });
}
```

</details>

---

## Contratos de API (DTOs)

> Como garantimos type-safety entre frontend e backend?

- Cada endpoint tem um DTO (Data Transfer Object) tipado
- Validacao em runtime com Zod para respostas da API
- DTOs vivem em `features/xxx/types/` e modelos compartilhados em `packages/core-sdk/types/`

| DTO | Campos Principais | Validacao |
| --- | --- | --- |
| FileDTO | id, name, size, mimeType, thumbnailUrl, createdAt, replicas, manifestId | Zod: size > 0, mimeType enum, replicas >= 0 |
| ManifestDTO | fileId, chunks[], totalSize, hash, signature, createdAt | Zod: chunks array nao vazio, hash hex 64 chars |
| ChunkDTO | id, hash, size, nodeIds[], index | Zod: hash hex 64 chars, index >= 0 |
| NodeDTO | id, type, tier, capacity, used, status, lastHeartbeat, provider | Zod: type enum, status enum, capacity > 0 |
| MemberDTO | id, name, role, devices[], joinedAt | Zod: role enum (admin/member/readonly) |
| ClusterDTO | id, name, membersCount, nodesCount, totalCapacity, usedCapacity | Zod: membersCount > 0 |
| AlertDTO | id, type, severity, message, nodeId?, createdAt, resolved | Zod: severity enum (critical/warning/info) |
| InviteDTO | token, expiresAt, role, createdBy | Zod: token string, expiresAt futuro |
| HealthDTO | replicationPercent, totalChunks, healthyChunks, nodesOnline, nodesTotal | Zod: percentages 0-100 |
| ExifDTO | date, gps?, camera?, lens?, resolution, orientation | Zod: date ISO, gps optional lat/lng |

<!-- APPEND:dtos -->

> Contratos sao definidos no `packages/core-sdk/types/` e compartilhados entre web, desktop e mobile. Validacao Zod aplicada na Infrastructure Layer ao receber respostas da API.

---

## BFF — Backend For Frontend

> O frontend usa uma camada BFF para agregar dados?

- [ ] Nao necessario (API direta)
- [x] Sim — Next.js Route Handlers (App Router)
- [ ] Sim — Servico BFF separado

O BFF via Next.js Route Handlers serve como proxy seguro entre o browser e o orquestrador, com tres responsabilidades principais:

1. **Proxy de autenticacao** — cluster token nunca exposto ao browser; Route Handler injeta token server-side
2. **Agregacao de dados** — combina multiplas chamadas ao orquestrador em uma unica resposta para o cliente
3. **OAuth redirect handler** — processa callbacks OAuth dos provedores cloud e encaminha tokens para o vault

| Rota BFF | APIs Agregadas | Proposito |
| --- | --- | --- |
| `GET /api/dashboard` | health + nodes + alerts + replication | Agregar dados do dashboard de saude em uma unica chamada |
| `GET /api/gallery/[id]` | file + manifest + exif | Montar detalhes completos do arquivo para visualizacao |
| `POST /api/upload/chunk` | orchestrator upload + storage node | Proxy de upload: recebe chunk do browser, encaminha para no destino |
| `GET /api/oauth/callback/[provider]` | OAuth provider + vault | Processar callback OAuth, armazenar token no vault do membro |
| `GET /api/thumbnail/[id]` | storage node | Proxy de thumbnail com cache headers (Cache-Control: max-age=86400) |

---

## Estrategia de Cache

> Como o cache e gerenciado em cada camada?

| Camada | Estrategia | TTL | Invalidacao |
| --- | --- | --- | --- |
| IndexedDB (thumbnails) | Cache persistente de thumbnails baixados | Indefinido (ate GC) | Quando arquivo e deletado do cluster |
| Query Cache (TanStack Query) | staleTime + gcTime por dominio | 30s (health) a 30min (manifests) | invalidateQueries apos mutations e eventos |
| BFF Cache (Next.js) | Route Handler com revalidate | 60s para dashboard, 0 para uploads | revalidateTag por dominio |
| Browser Cache | Cache-Control headers para thumbnails | 24h para thumbnails, 1 ano para assets | ETag para thumbnails; hash no filename para assets |
| CDN (assets estaticos) | Imutavel com hash no filename | 1 ano | Deploy com novos hashes (Turbopack) |
| Service Worker | Precache de shell do app + runtime cache de API | Shell indefinido; API conforme TanStack Query | Atualizacao no deploy <!-- inferido do PRD --> |

### Cache por dominio

| Dominio | Stale Time | GC Time | Justificativa |
| --- | --- | --- | --- |
| gallery (lista) | 10 min | 30 min | Galeria estavel entre uploads; invalidada por upload:complete |
| manifest | 30 min | 60 min | Manifests sao imutaveis apos criacao |
| nodes | 30 seg | 5 min | Status de nos muda frequentemente (heartbeat) |
| health | 30 seg | 5 min | Dashboard de saude precisa de dados recentes |
| cluster | 5 min | 30 min | Dados de cluster mudam raramente |
| vault | 5 min | 10 min | Status de tokens pode mudar por expiracao |

<!-- APPEND:cache -->

> Estrategia geral: dados frequentemente atualizados (health, nodes) usam staleTime curto (30s). Dados estaveis (gallery, manifests) usam cache longo com invalidacao explicita via eventos.

> Gerenciamento de estado e cache: (ver 05-estado.md)
