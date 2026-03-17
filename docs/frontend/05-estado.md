# Gerenciamento de Estado

Define a estrategia de gerenciamento de estado separando claramente os tipos de estado, as ferramentas responsaveis por cada um e os anti-patterns a evitar. A separacao correta de estado e uma das decisoes arquiteturais mais importantes do frontend — estado mal gerenciado e a principal causa de bugs e complexidade desnecessaria.

---

## Tipos de Estado

> Como classificamos e onde armazenamos cada tipo de dado?

| Tipo | Descricao | Ferramenta | Exemplo no Alexandria |
| --- | --- | --- | --- |
| UI State | Estado visual local de um componente | React useState/useReducer | Modal de seed phrase aberto, sidebar collapsed, drag hover no dropzone |
| Server State | Dados vindos do orquestrador | TanStack Query v5 | Lista de fotos, manifests, status de nos, saude do cluster |
| Global State | Dados compartilhados entre features | Zustand v5 | Membro autenticado, preferencias, tema |
| Domain State | Estado de dominio de negocio | Zustand (store por dominio) | uploadStore (fila de processamento), nodesStore (nos conectados) |
| URL State | Estado refletido na URL | Next.js Router/SearchParams | Filtros da galeria, data selecionada na timeline, tab ativa |
| Persistent State | Dados que sobrevivem ao refresh | IndexedDB (via idb-keyval) | Cache de thumbnails, fila de uploads pendentes, manifests locais |

> Regra: use o tipo mais simples que resolve o problema. Nao coloque em global state o que pode ser UI state local.

---

## Server State (Data Fetching)

> Como gerenciamos dados vindos do orquestrador?

- **Ferramenta:** TanStack Query v5
- **Beneficios:** cache automatico, revalidacao, sincronizacao, loading/error states, retry com backoff
- **Padrao:** queries em `features/xxx/api/` + hooks em `features/xxx/hooks/`

| Configuracao | Valor | Justificativa |
| --- | --- | --- |
| Stale Time (metadata) | 5 minutos | Metadados de fotos mudam pouco; evita refetch excessivo |
| Stale Time (health) | 30 segundos | Status de nos e replicacao precisa ser mais recente |
| Stale Time (gallery) | 10 minutos | Galeria e relativamente estavel entre uploads |
| Cache Time | 30 minutos | Manter dados em cache para navegacao rapida |
| Retry | 3 tentativas com backoff exponencial | Resiliencia contra instabilidade de rede (embrace failure) |
| Refetch on Window Focus | Sim (exceto upload em progresso) | Sincronizar estado quando usuario retorna a aba |
| Refetch on Reconnect | Sim | Essencial para offline-first: revalidar ao reconectar |

**Query keys por dominio:**

| Dominio | Query Key Pattern | Exemplo |
| --- | --- | --- |
| gallery | `['gallery', filters]` | `['gallery', { date: '2024-12', type: 'photo' }]` |
| nodes | `['nodes', clusterId]` | `['nodes', 'abc123']` |
| health | `['health', clusterId]` | `['health', 'abc123']` |
| cluster | `['cluster', clusterId]` | `['cluster', 'abc123']` |
| manifest | `['manifest', fileId]` | `['manifest', 'file_xyz']` |

> Detalhes completos sobre data fetching: (ver 06-data-layer.md)

---

## Global State

> Quais dados precisam ser globais?

| Store | Dados | Persistencia | Storage | Quando Inicializa |
| --- | --- | --- | --- | --- |
| authStore | Membro autenticado, cluster_id, permissao (admin/membro/leitura), sessao | Sim | localStorage (criptografado) | Login / Refresh da pagina |
| preferencesStore | Tema (light/dark), idioma, sidebar state, layout da galeria (grid/list) | Sim | localStorage | Montagem do app |
| uploadStore | Fila de uploads, progresso por arquivo, status do sync engine (ativo/pausado) | Sim | IndexedDB | Montagem do app (restaura fila pendente) |
| nodesStore | Lista de nos conectados, status de heartbeat, capacidade por no | Nao (server state) | — | Fetch inicial via TanStack Query |
| vaultStore | Estado do vault (locked/unlocked), nao armazena tokens em si | Nao | — | Desbloqueio via senha do membro |
| eventBusStore | Nenhum dado persistente; apenas canal de eventos | Nao | — | Montagem do app |

<!-- APPEND:stores -->

<details>
<summary>Exemplo — uploadStore com Zustand + IndexedDB</summary>

```typescript
interface UploadJob {
  id: string;
  fileName: string;
  fileSize: number;
  status: 'queued' | 'analyzing' | 'resizing' | 'encrypting' | 'chunking' | 'distributing' | 'done' | 'error';
  progress: number; // 0-100
  chunksTotal: number;
  chunksUploaded: number;
  error?: string;
}

interface UploadState {
  jobs: UploadJob[];
  syncEnabled: boolean;
  addJob: (file: File) => void;
  updateProgress: (id: string, update: Partial<UploadJob>) => void;
  removeJob: (id: string) => void;
  toggleSync: () => void;
}

const useUploadStore = create<UploadState>()(
  persist(
    (set) => ({
      jobs: [],
      syncEnabled: true,
      addJob: (file) =>
        set((state) => ({
          jobs: [...state.jobs, {
            id: crypto.randomUUID(),
            fileName: file.name,
            fileSize: file.size,
            status: 'queued',
            progress: 0,
            chunksTotal: 0,
            chunksUploaded: 0,
          }],
        })),
      updateProgress: (id, update) =>
        set((state) => ({
          jobs: state.jobs.map((j) => (j.id === id ? { ...j, ...update } : j)),
        })),
      removeJob: (id) =>
        set((state) => ({ jobs: state.jobs.filter((j) => j.id !== id) })),
      toggleSync: () =>
        set((state) => ({ syncEnabled: !state.syncEnabled })),
    }),
    {
      name: 'alexandria-upload-queue',
      storage: createJSONStorage(() => indexedDBStorage), // IndexedDB para suportar filas grandes
    }
  )
);
```

</details>

---

## Event Bus (Comunicacao entre Dominios)

> Como dominios diferentes se comunicam sem acoplamento direto?

- **Padrao:** Event Bus leve via Zustand store dedicada com pub/sub tipado
- **Implementacao:** Store `eventBusStore` com `emit(event, payload)` e `on(event, handler)` tipados via TypeScript

| Evento | Emissor | Ouvinte(s) | Payload | Acao no Ouvinte |
| --- | --- | --- | --- | --- |
| `upload:complete` | upload | gallery | `{ fileId, manifestId, thumbnailUrl }` | Invalidar query da galeria, adicionar thumbnail ao cache |
| `upload:error` | upload | health | `{ fileId, error, retryCount }` | Adicionar alerta na lista de alertas |
| `node:status-changed` | nodes | health | `{ nodeId, oldStatus, newStatus }` | Atualizar dashboard, disparar toast se no ficou offline |
| `node:capacity-warning` | nodes | health, upload | `{ nodeId, usagePercent }` | Alerta no dashboard; pausar sync se cluster >90% |
| `cluster:member-joined` | cluster | nodes | `{ memberId, memberName, devices }` | Listar novos dispositivos disponiveis |
| `cluster:member-removed` | cluster | gallery, vault | `{ memberId }` | Filtrar fotos do membro removido, revogar tokens |
| `vault:unlocked` | vault | nodes, upload | `{ memberId }` | Disponibilizar tokens OAuth para sync |
| `vault:locked` | vault | nodes, upload | `{ memberId }` | Pausar sync de provedores que requerem tokens |
| `recovery:started` | recovery | cluster, nodes, upload | `{ timestamp }` | Bloquear operacoes de escrita durante reconstrucao |
| `recovery:complete` | recovery | cluster, nodes, gallery | `{ nodesReconnected, filesRecovered }` | Revalidar todas as queries, restaurar operacao normal |

<!-- APPEND:eventos -->

> Isso evita dependencia direta entre dominios/features. Cada feature emite eventos sem saber quem escuta.

<details>
<summary>Exemplo — Event Bus tipado com Zustand</summary>

```typescript
type EventMap = {
  'upload:complete': { fileId: string; manifestId: string; thumbnailUrl: string };
  'node:status-changed': { nodeId: string; oldStatus: NodeStatus; newStatus: NodeStatus };
  'vault:unlocked': { memberId: string };
  'recovery:started': { timestamp: number };
  // ... demais eventos
};

type EventHandler<T> = (payload: T) => void;

interface EventBusState {
  listeners: Map<string, Set<EventHandler<unknown>>>;
  emit: <K extends keyof EventMap>(event: K, payload: EventMap[K]) => void;
  on: <K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>) => () => void;
}

const useEventBus = create<EventBusState>((set, get) => ({
  listeners: new Map(),
  emit: (event, payload) => {
    const handlers = get().listeners.get(event as string);
    handlers?.forEach((handler) => handler(payload));
  },
  on: (event, handler) => {
    const { listeners } = get();
    const key = event as string;
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key)!.add(handler as EventHandler<unknown>);
    return () => listeners.get(key)?.delete(handler as EventHandler<unknown>);
  },
}));
```

</details>

---

## Anti-patterns

> O que evitar no gerenciamento de estado?

| Anti-pattern | Por que evitar | Alternativa |
| --- | --- | --- |
| Colocar server state em global store | Duplica cache, perde revalidacao automatica do TanStack Query | Use TanStack Query para dados do orquestrador |
| Estado global para dados locais | Complexidade desnecessaria, re-renders em todo o app | Use useState/useReducer (ex: modal aberto, input temporario) |
| Prop drilling alem de 2 niveis | Codigo fragil, dificil de manter | Use store do dominio ou Context para subtrees |
| Sincronizar manualmente server/local state | Bugs de sincronizacao, dados stale | Deixe TanStack Query gerenciar; use optimistic updates |
| Store monolitica gigante | Dificil de testar, re-renders excessivos, acoplamento total | Stores pequenas por dominio (uploadStore, nodesStore) |
| Persistir tokens/chaves em localStorage | Vulneravel a XSS; viola principio zero-knowledge | Vault criptografado; tokens apenas em memoria durante sessao |
| Usar Event Bus para tudo | Fluxo implicito, dificil de debugar e testar | Event Bus apenas para comunicacao cross-domain; prefira props e hooks |
| Cache de thumbnails apenas em memoria | Perda de cache a cada refresh; re-download desnecessario | Usar IndexedDB para cache persistente de thumbnails |

> Arquitetura de estado: (ver 01-arquitetura.md para contexto das camadas)
