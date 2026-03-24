# Gerenciamento de Estado

Define a estrategia de gerenciamento de estado separando claramente os tipos de estado, as ferramentas responsaveis por cada um e os anti-patterns a evitar. A separacao correta de estado e uma das decisoes arquiteturais mais importantes do frontend — estado mal gerenciado e a principal causa de bugs e complexidade desnecessaria.

> **Implementa:** [docs/blueprint/09-state-models.md](../blueprint/09-state-models.md) (maquinas de estado).
> **Conectado a:** [docs/shared/event-mapping.md](../shared/event-mapping.md) (eventos backend que atualizam stores).

---

## Tipos de Estado

> Como classificamos e onde armazenamos cada tipo de dado?

| Tipo | Descricao | Ferramenta | Exemplo no Alexandria |
| --- | --- | --- | --- |
| UI State | Estado visual local de um componente | React useState/useReducer | Modal de preview aberto, sidebar collapsed, drag active no upload |
| Server State | Dados vindos do Orquestrador (NestJS API) | TanStack Query v5 | Lista de arquivos, nos do cluster, alertas ativos, saude do cluster |
| Global State | Dados compartilhados entre features que nao vem do servidor | Zustand v5 | Membro autenticado, sessao JWT, tema, fila de uploads |
| URL State | Estado refletido na URL para compartilhamento e deep linking | Next.js useSearchParams + useRouter | Filtros da galeria, paginacao, media_type selecionado, tab ativa |
| Form State | Estado de formularios com validacao | React Hook Form + Zod | Login, convite de membro, registro de no, seed phrase input |

<!-- do blueprint: 02-architecture_principles.md (Simplicidade Operacional) -->

> **Regra de ouro:** use o tipo mais simples que resolve o problema. A hierarquia de preferencia e: UI State → URL State → Server State → Global State. Nao coloque em global store o que pode ser estado local ou URL.

### Arvore de decisao

```
O dado vem do backend?
  → Sim: TanStack Query (Server State)
O dado precisa sobreviver a navegacao entre rotas?
  → Sim, e deve ser compartilhavel via URL? → URL State (searchParams)
  → Sim, mas nao precisa estar na URL? → Zustand (Global State)
O dado e especifico de um formulario?
  → Sim: React Hook Form (Form State)
Nenhum dos anteriores?
  → useState/useReducer (UI State)
```

---

## Server State (Data Fetching)

> Como gerenciamos dados vindos do backend?

- **Ferramenta:** TanStack Query v5
- **Beneficios:** cache automatico, revalidacao em background, sincronizacao entre abas, loading/error states, devtools
- **Padrao:** queries em `features/xxx/api/` + hooks em `features/xxx/hooks/`

| Configuracao | Valor | Justificativa |
| --- | --- | --- |
| Stale Time (galeria, membros) | 5 minutos | Dados mudam raramente; evita refetch desnecessario |
| Stale Time (alertas, saude) | 30 segundos | Dados de monitoramento precisam ser frescos |
| Stale Time (nodes) | 1 minuto | Heartbeat a cada 5min; 1min e suficiente |
| Cache Time | 30 minutos | Manter dados em cache para navegacao rapida |
| Retry | 3 tentativas com backoff exponencial | Alinhado com principio Embrace Failure |
| Refetch on Window Focus | Sim | Usuario voltou para a aba → dados atualizados |
| Refetch on Reconnect | Sim | Rede instavel (dispositivos moveis) → sync ao reconectar |

### Query Keys centralizadas

```typescript
// shared/lib/query-keys.ts
export const queryKeys = {
  files: {
    all: (clusterId: string) => ['files', clusterId] as const,
    list: (clusterId: string, filters: FileFilters) => ['files', clusterId, 'list', filters] as const,
    detail: (fileId: string) => ['files', 'detail', fileId] as const,
    preview: (fileId: string) => ['files', 'preview', fileId] as const,
  },
  nodes: {
    all: (clusterId: string) => ['nodes', clusterId] as const,
    detail: (nodeId: string) => ['nodes', 'detail', nodeId] as const,
  },
  alerts: {
    active: (clusterId: string) => ['alerts', clusterId, 'active'] as const,
    all: (clusterId: string) => ['alerts', clusterId] as const,
  },
  members: {
    all: (clusterId: string) => ['members', clusterId] as const,
    me: () => ['members', 'me'] as const,
  },
  cluster: {
    health: (clusterId: string) => ['cluster', clusterId, 'health'] as const,
  },
  recovery: {
    status: () => ['recovery', 'status'] as const,
  },
} as const;
```

### Invalidacao cruzada entre features

<!-- do blueprint: 01-architecture.md (comunicacao entre dominios via TanStack Query) -->

| Acao (mutacao) | Queries invalidadas | Motivo |
| --- | --- | --- |
| Upload concluido (file ready) | `files.all`, `cluster.health` | Galeria precisa mostrar novo arquivo; metricas de capacidade mudam |
| No registrado | `nodes.all`, `cluster.health` | Lista de nos e metricas atualizam |
| No drained/removido | `nodes.all`, `cluster.health`, `alerts.active` | No desaparece; metricas e alertas podem mudar |
| Alerta resolvido | `alerts.active`, `alerts.all` | Lista de alertas atualiza |
| Membro convidado/removido | `members.all` | Lista de membros atualiza |
| Recovery concluido | Todas as queries | Sistema inteiro reconstruido |
| Perfil atualizado | `members.me` | Dados do membro logado mudam |

> Detalhes completos sobre data fetching: (ver 06-data-layer.md)

---

## Global State

> Quais dados precisam ser globais?

<!-- do blueprint: 04-domain-model.md (Member, Cluster) + 13-security.md (JWT, roles) -->

| Store | Dados | Persistencia | Quando Inicializa |
| --- | --- | --- | --- |
| authStore | Membro logado (id, name, email, role), JWT access token, refresh token, clusterId ativo | Sim (localStorage via Zustand persist) | Login / Refresh da pagina (rehydrate do localStorage) |
| uploadStore | Fila de uploads (arquivos pendentes), progresso do upload atual (%, velocidade), status por arquivo | Nao (perde ao fechar aba — uploads interrompidos sao retomados pelo backend) | Quando usuario inicia upload |
| uiStore | Tema (light/dark), sidebar collapsed, notificacoes toast pendentes | Sim (localStorage para tema e sidebar) | Montagem do app |

<!-- APPEND:stores -->

<details>
<summary>Exemplo — authStore com Zustand</summary>

```typescript
// shared/store/auth-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Member } from '@/shared/domain/models/member';

interface AuthState {
  member: Member | null;
  accessToken: string | null;
  refreshToken: string | null;
  clusterId: string | null;
  isAuthenticated: boolean;

  setAuth: (member: Member, accessToken: string, refreshToken: string) => void;
  setCluster: (clusterId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      member: null,
      accessToken: null,
      refreshToken: null,
      clusterId: null,
      isAuthenticated: false,

      setAuth: (member, accessToken, refreshToken) =>
        set({
          member,
          accessToken,
          refreshToken,
          clusterId: member.clusterId,
          isAuthenticated: true,
        }),

      setCluster: (clusterId) => set({ clusterId }),

      logout: () =>
        set({
          member: null,
          accessToken: null,
          refreshToken: null,
          clusterId: null,
          isAuthenticated: false,
        }),
    }),
    { name: 'alexandria-auth' }
  )
);
```

</details>

<details>
<summary>Exemplo — uploadStore com Zustand</summary>

```typescript
// shared/store/upload-store.ts
import { create } from 'zustand';

interface UploadItem {
  id: string;
  file: File;
  progress: number;       // 0-100
  speed: number;          // bytes/s
  status: 'queued' | 'uploading' | 'processing' | 'done' | 'error';
  errorMessage?: string;
}

interface UploadState {
  queue: UploadItem[];
  activeUploads: number;
  maxConcurrent: number;

  addFiles: (files: File[]) => void;
  updateProgress: (id: string, progress: number, speed: number) => void;
  setStatus: (id: string, status: UploadItem['status'], error?: string) => void;
  removeFromQueue: (id: string) => void;
  clearCompleted: () => void;
}

export const useUploadStore = create<UploadState>()((set) => ({
  queue: [],
  activeUploads: 0,
  maxConcurrent: 3,

  addFiles: (files) =>
    set((state) => ({
      queue: [
        ...state.queue,
        ...files.map((file) => ({
          id: crypto.randomUUID(),
          file,
          progress: 0,
          speed: 0,
          status: 'queued' as const,
        })),
      ],
    })),

  updateProgress: (id, progress, speed) =>
    set((state) => ({
      queue: state.queue.map((item) =>
        item.id === id ? { ...item, progress, speed } : item
      ),
    })),

  setStatus: (id, status, errorMessage) =>
    set((state) => ({
      queue: state.queue.map((item) =>
        item.id === id ? { ...item, status, errorMessage } : item
      ),
      activeUploads:
        status === 'uploading'
          ? state.activeUploads + 1
          : status === 'done' || status === 'error'
          ? state.activeUploads - 1
          : state.activeUploads,
    })),

  removeFromQueue: (id) =>
    set((state) => ({
      queue: state.queue.filter((item) => item.id !== id),
    })),

  clearCompleted: () =>
    set((state) => ({
      queue: state.queue.filter((item) => item.status !== 'done'),
    })),
}));
```

</details>

---

## Maquinas de Estado no Frontend

> Quais entidades do dominio tem estados que o frontend precisa refletir?

<!-- do blueprint: 04-domain-model.md (status enums) + 07-critical_flows.md (transicoes) -->

### File Status

| Estado | Descricao | UI | Cor |
| --- | --- | --- | --- |
| `processing` | Arquivo em pipeline (otimizacao, chunking, distribuicao) | Spinner + etapa atual (ProcessingStatus) | amber |
| `ready` | Arquivo processado, disponivel para visualizacao e download | Thumbnail normal na galeria | — (default) |
| `error` | Pipeline falhou (codec nao suportado, arquivo corrompido) | Badge "Erro" + mensagem + botao retry | red |
| `corrupted` | Scrubbing detectou chunks irrecuperaveis | Badge "Corrompido" + mensagem de alerta | red |

**Transicoes visíveis no frontend:**

```
processing → ready       (polling /files/:id ate status mudar)
processing → error       (polling detecta erro; exibe toast + badge)
ready → corrupted        (alertas notificam; badge atualiza via query invalidation)
error → processing       (retry re-enfileira no pipeline)
```

### Node Status

| Estado | Descricao | UI | Cor |
| --- | --- | --- | --- |
| `online` | No ativo, heartbeat recente | StatusDot verde + pulse | emerald |
| `suspect` | Sem heartbeat por 30min | StatusDot amarelo | amber |
| `lost` | Sem heartbeat por 1h; auto-healing em andamento | StatusDot vermelho | red |
| `draining` | Chunks sendo migrados antes de remocao | StatusDot azul + Progress bar | blue |
| `disconnected` | Removido do cluster apos drain completo | Nao exibido na lista ativa | gray |

### Alert Severity

| Severidade | Descricao | UI | Comportamento |
| --- | --- | --- | --- |
| `info` | Informacao (auto-healing completo, recovery finalizado) | Badge azul, toast polite | aria-live="polite" |
| `warning` | Atencao (no suspect, espaco < 20%, token expirando) | Badge amber, toast polite | aria-live="polite" |
| `critical` | Acao urgente (no lost, replicacao < 3x, chunk corrompido) | Badge vermelho, toast assertive, banner topo | aria-live="assertive" |

---

## URL State

> Quais dados sao refletidos na URL para deep linking e compartilhamento?

| Rota | Search Params | Exemplo | Feature |
| --- | --- | --- | --- |
| /gallery | `media_type`, `search`, `cursor`, `view` | `/gallery?media_type=photo&view=timeline` | gallery |
| /gallery/[fileId] | — | `/gallery/abc-123` | gallery (file detail) |
| /nodes | `status` | `/nodes?status=online` | nodes |
| /health | `severity`, `resolved` | `/health?severity=critical&resolved=false` | health |
| /invite/[token] | — | `/invite/eyJhbG...` | cluster (aceite de convite) |

**Padrao de sincronizacao:** `useSearchParams` do Next.js como source of truth para filtros → passados como parametro para TanStack Query keys → query refaz fetch automaticamente quando filtros mudam.

```typescript
// Exemplo: useGalleryFilters sincroniza URL ↔ TanStack Query
const searchParams = useSearchParams();
const filters: FileFilters = {
  mediaType: searchParams.get('media_type') ?? undefined,
  search: searchParams.get('search') ?? undefined,
  cursor: searchParams.get('cursor') ?? undefined,
};
const { data } = useQuery({
  queryKey: queryKeys.files.list(clusterId, filters),
  queryFn: () => filesApi.list(filters),
});
```

---

## Event Bus (Comunicacao entre Dominios)

> Como dominios diferentes se comunicam sem acoplamento direto?

<!-- do blueprint: 01-architecture.md (comunicacao entre features) -->

**Estrategia principal:** TanStack Query cache invalidation (descrita acima) para 90% dos casos. Para notificacoes transientes que nao envolvem server state, usar **custom events** via EventTarget API nativa.

| Evento | Emissor | Ouvinte(s) | Payload | Mecanismo |
| --- | --- | --- | --- | --- |
| Upload concluido | upload | gallery, health | `{ fileId, fileName }` | TanStack Query invalidation |
| No perdido | health (via polling) | nodes | `{ nodeId, status }` | TanStack Query invalidation |
| Alerta critico recebido | health | layout (banner topo) | `{ alertId, message, severity }` | Custom Event → AlertBanner |
| Logout | auth | todos | — | authStore.logout() → queryClient.clear() |
| Tema alterado | settings | layout | `{ theme }` | uiStore (reativo via Zustand) |
| Recovery concluido | recovery | todos | — | queryClient.invalidateQueries() global |

<!-- APPEND:eventos -->

### Implementacao de Custom Events

```typescript
// shared/lib/events.ts
type AlexandriaEvents = {
  'alert:critical': { alertId: string; message: string; severity: string };
  'upload:batch-complete': { count: number; totalSize: number };
};

const eventBus = new EventTarget();

export function emit<K extends keyof AlexandriaEvents>(
  event: K,
  detail: AlexandriaEvents[K]
) {
  eventBus.dispatchEvent(new CustomEvent(event, { detail }));
}

export function on<K extends keyof AlexandriaEvents>(
  event: K,
  handler: (detail: AlexandriaEvents[K]) => void
) {
  const listener = (e: Event) => handler((e as CustomEvent).detail);
  eventBus.addEventListener(event, listener);
  return () => eventBus.removeEventListener(event, listener);
}
```

> Custom Events sao usados somente para notificacoes transientes (toasts, banners). Dados persistentes sempre via TanStack Query.

---

## Anti-patterns

> O que evitar no gerenciamento de estado?

| Anti-pattern | Por que evitar | Alternativa |
| --- | --- | --- |
| Colocar server state em Zustand store | Duplica cache, perde revalidacao automatica, dados ficam stale | Use TanStack Query para tudo que vem da API |
| Estado global para dados locais de UI | Re-renders desnecessarios em componentes que nao usam o dado | Use useState/useReducer local |
| Prop drilling alem de 3 niveis | Codigo fragil, dificil de manter, componentes intermediarios "passam" props sem usar | Use Zustand store ou TanStack Query hook direto |
| Sincronizar server state → local state manualmente | Bugs de sincronizacao, dados stale, logica duplicada | Deixe TanStack Query gerenciar; use `select` para derivar |
| Store monolitica com todos os dados | Dificil de testar, re-renders excessivos, subscriptions desnecessarias | Stores pequenas por dominio (authStore, uploadStore, uiStore) |
| Polling infinito sem stale time | Requests desnecessarios, sobrecarga no backend | Configure stale time adequado por dominio (30s alertas, 5min galeria) |
| Armazenar JWT no Zustand sem encrypt | Token acessivel via devtools | Persist com encrypt ou usar httpOnly cookie via BFF |
| `useEffect` para sincronizar estado derivado | Ciclos extras de render, bugs sutis | Use `useMemo` ou TanStack Query `select` |

> Arquitetura de estado: (ver 01-architecture.md para contexto das camadas)
