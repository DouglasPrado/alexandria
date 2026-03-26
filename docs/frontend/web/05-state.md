# Gerenciamento de Estado

Define a estratégia de gerenciamento de estado separando claramente os tipos de estado, as ferramentas responsáveis por cada um e os anti-patterns a evitar. A separação correta de estado é uma das decisões arquiteturais mais importantes do frontend — estado mal gerenciado é a principal causa de bugs e complexidade desnecessária.

> **Implementa:** [docs/blueprint/09-state-models.md](../../blueprint/09-state-models.md) (máquinas de estado).

<!-- do blueprint: 09-state-models.md (estados File, Node, Cluster, Alert, Upload FE), 04-domain-model.md (entidades) -->

---

## Tipos de Estado

> Como classificamos e onde armazenamos cada tipo de dado?

| Tipo         | Descrição                                | Ferramenta                  | Exemplo                                               |
| ------------ | ---------------------------------------- | --------------------------- | ----------------------------------------------------- |
| UI State     | Estado visual local de um componente     | React useState/useReducer   | Modal aberto, sidebar collapsed, lightbox index       |
| Server State | Dados vindos do orquestrador             | TanStack Query v5           | Lista de files, nós, alertas, cluster health          |
| Global State | Dados compartilhados entre features      | Zustand v5                  | Membro autenticado, fila de upload, recovery progress |
| Domain State | Estado de domínio por feature            | Zustand (store por domínio) | uploadStore, recoveryStore                            |
| URL State    | Estado refletido na URL (compartilhável) | Next.js searchParams        | Filtros da galeria, modo de visualização, paginação   |

> Regra: use o tipo mais simples que resolve o problema. Não coloque em global state o que pode ser UI state local.

---

## Server State (Data Fetching)

> Como gerenciamos dados vindos do orquestrador?

- **Ferramenta:** TanStack Query v5
- **Benefícios:** cache automático, revalidação, sincronização, loading/error states, polling
- **Padrão:** queries em `features/xxx/api/` + hooks em `features/xxx/hooks/`

| Configuração            | Valor                                | Justificativa                                     |
| ----------------------- | ------------------------------------ | ------------------------------------------------- |
| Stale Time (padrão)     | 30 segundos                          | Dados de galeria e nós mudam com pouca frequência |
| Stale Time (alertas)    | 10 segundos                          | Alertas precisam de atualização mais rápida       |
| Cache Time (gcTime)     | 5 minutos                            | Manter cache navegável após trocar de tela        |
| Retry                   | 3 tentativas com backoff exponencial | Resiliência a falhas de rede temporárias          |
| Refetch on Window Focus | Sim                                  | Dados atualizados ao voltar para a aba            |
| Refetch on Reconnect    | Sim                                  | Recarregar após perda de conexão                  |

### Queries por Domínio

<!-- do blueprint: 08-use_cases.md (endpoints consumidos) -->

| Query Key                       | Endpoint                  | Stale Time | Polling               | Uso                             |
| ------------------------------- | ------------------------- | ---------- | --------------------- | ------------------------------- |
| `['files', clusterId, filters]` | GET /files                | 30s        | —                     | Galeria (grid, timeline, busca) |
| `['file', fileId]`              | GET /files/:id            | 30s        | 3s (se processing)    | Detalhe do arquivo, lightbox    |
| `['nodes', clusterId]`          | GET /nodes                | 30s        | —                     | Lista de nós                    |
| `['node', nodeId]`              | GET /nodes/:id            | 10s        | 10s (se draining)     | Detalhe do nó, drain progress   |
| `['alerts', clusterId]`         | GET /alerts?status=active | 10s        | —                     | Badge de alertas, dropdown      |
| `['cluster', clusterId]`        | GET /clusters/:id         | 60s        | —                     | Dados do cluster, health        |
| `['members', clusterId]`        | GET /clusters/:id/members | 60s        | —                     | Lista de membros                |
| `['recovery-status']`           | GET /recovery/status      | —          | 5s (durante recovery) | Stepper de recovery             |

> Detalhes completos sobre data fetching: (ver [shared/06-data-layer.md](../shared/06-data-layer.md))

---

## Global State

> Quais dados precisam ser globais?

| Store         | Dados                                                     | Persistência                         | Quando Inicializa           |
| ------------- | --------------------------------------------------------- | ------------------------------------ | --------------------------- |
| authStore     | Membro logado (id, name, role), JWT token, clusterId      | Sim (localStorage, exceto token)     | Login / Refresh da página   |
| uploadStore   | Fila de uploads (items, status, progresso), maxConcurrent | Não (perde ao fechar aba)            | Montagem do app             |
| recoveryStore | Etapa atual, progresso por etapa, erros                   | Não                                  | Início do fluxo de recovery |
| uiStore       | Sidebar collapsed, tema (light/dark), toast queue         | Sim (localStorage para tema/sidebar) | Montagem do app             |

<!-- APPEND:stores -->

<details>
<summary>Exemplo — authStore com Zustand</summary>

```typescript
interface AuthState {
  member: Member | null;
  token: string | null;
  clusterId: string | null;
  isAuthenticated: boolean;
  role: 'admin' | 'member' | 'reader' | null;
  login: (credentials: LoginDTO) => Promise<void>;
  logout: () => void;
  setMember: (member: Member) => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      member: null,
      token: null,
      clusterId: null,
      isAuthenticated: false,
      role: null,
      login: async (credentials) => {
        const { member, token } = await authApi.login(credentials);
        set({
          member,
          token,
          clusterId: member.clusterId,
          isAuthenticated: true,
          role: member.role,
        });
      },
      logout: () =>
        set({ member: null, token: null, clusterId: null, isAuthenticated: false, role: null }),
      setMember: (member) => set({ member, role: member.role }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        member: state.member,
        clusterId: state.clusterId,
        role: state.role,
      }),
      // Token NÃO é persistido em localStorage (segurança)
    },
  ),
);
```

</details>

<details>
<summary>Exemplo — uploadStore com Zustand</summary>

```typescript
// do blueprint: 09-state-models.md (Upload FE state machine)
type UploadStatus = 'queued' | 'uploading' | 'processing' | 'done' | 'error';

interface UploadItem {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number; // 0-100
  speed: number; // bytes/s
  fileId?: string; // ID retornado pelo backend após upload
  error?: string;
}

interface UploadState {
  items: UploadItem[];
  maxConcurrent: 3;
  addFiles: (files: File[]) => void;
  startNext: () => void;
  updateProgress: (id: string, progress: number, speed: number) => void;
  setStatus: (id: string, status: UploadStatus, fileId?: string) => void;
  retry: (id: string) => void;
  removeCompleted: () => void;
}
```

**Transições:**

```
queued → uploading → processing → done
              ↓            ↓
            error ←──── error
              ↓
          uploading (retry)
```

</details>

---

## URL State

> Quais dados são refletidos na URL para compartilhamento e navegação?

| Parâmetro | Tipo   | Exemplo          | Tela                           |
| --------- | ------ | ---------------- | ------------------------------ |
| `q`       | string | `?q=praia`       | Galeria (busca)                |
| `type`    | enum   | `?type=photos`   | Galeria (filtro por tipo)      |
| `view`    | enum   | `?view=timeline` | Galeria (modo de visualização) |
| `cursor`  | string | `?cursor=abc123` | Galeria (paginação)            |
| `tab`     | string | `?tab=members`   | Settings (tab ativa)           |

> URL state é gerenciado via `useSearchParams()` do Next.js. Alterações nos filtros atualizam a URL sem navegação completa (shallow routing).

---

## Event Bus (Comunicação entre Domínios)

> Como domínios diferentes se comunicam sem acoplamento direto?

- **Padrão:** Event Bus leve (pub/sub em memória) via `mitt` ou implementação customizada
- **Regra:** features emitem eventos sem saber quem escuta; ouvintes reagem sem importar de onde veio

<!-- do blueprint: 04-domain-model.md (eventos de domínio) -->

| Evento                     | Emissor           | Ouvinte(s)                                              | Payload                            |
| -------------------------- | ----------------- | ------------------------------------------------------- | ---------------------------------- |
| `file:uploaded`            | gallery           | alerts (verifica replicação), gallery (atualiza grid)   | `{ fileId, fileName, status }`     |
| `file:processing-complete` | gallery (polling) | gallery (substitui placeholder por thumbnail)           | `{ fileId, status: 'ready' }`      |
| `node:status-changed`      | nodes             | alerts (gera/resolve alerta), gallery (disponibilidade) | `{ nodeId, oldStatus, newStatus }` |
| `node:lost`                | nodes             | alerts (notificação crítica)                            | `{ nodeId, name, lastHeartbeat }`  |
| `cluster:created`          | cluster           | auth (atualiza role), gallery (empty state)             | `{ clusterId, name }`              |
| `member:invited`           | settings          | — (email enviado pelo backend)                          | `{ email, role }`                  |
| `member:joined`            | settings          | settings (atualiza lista)                               | `{ memberId, name, role }`         |
| `alert:resolved`           | alerts            | alerts (remove do dropdown)                             | `{ alertId }`                      |
| `recovery:step-completed`  | recovery          | recovery (avança stepper)                               | `{ step, progress }`               |

<!-- APPEND:eventos -->

> Isso evita dependência direta entre domínios/features. Cada feature emite eventos sem saber quem escuta.

---

## SSR Hydration

> Como o estado é sincronizado entre servidor e cliente no Next.js?

| Cenário                    | Estratégia                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------------- |
| Server Component com dados | RSC faz fetch no servidor → passa como props para Client Component → TanStack Query `initialData` |
| Zustand store no client    | Store inicializa vazia; `useEffect` no root layout hidrata a partir de localStorage               |
| URL state                  | `searchParams` disponível tanto no servidor (page props) quanto no cliente (`useSearchParams`)    |
| Auth token                 | Middleware lê cookie httpOnly no servidor; client recebe `member` via Server Component props      |

```tsx
// Padrão: RSC passa dados iniciais para Client Component com TanStack Query
// app/dashboard/page.tsx (Server Component)
export default async function DashboardPage() {
  const files = await filesApi.list({ cursor: null, limit: 50 });
  return <GalleryGrid initialFiles={files} />;
}

// features/gallery/components/GalleryGrid.tsx (Client Component)
('use client');
export function GalleryGrid({ initialFiles }: { initialFiles: FilesResponse }) {
  const { data } = useFiles({ initialData: initialFiles });
  // TanStack Query gerencia revalidação a partir daqui
}
```

---

## Anti-patterns

> O que evitar no gerenciamento de estado?

| Anti-pattern                               | Por que evitar                                                         | Alternativa                                                             |
| ------------------------------------------ | ---------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Colocar server state em Zustand            | Duplica cache, perde revalidação automática, dados stale               | Use TanStack Query para tudo que vem do orquestrador                    |
| Estado global para dados locais            | Complexidade desnecessária, re-renders em componentes não relacionados | Use useState/useReducer                                                 |
| Prop drilling além de 2 níveis             | Código frágil, difícil de manter                                       | Use Zustand store ou Context                                            |
| Sincronizar manualmente server/local state | Bugs de sincronização, race conditions                                 | Deixe TanStack Query gerenciar com `initialData` + revalidação          |
| Store monolítica gigante                   | Difícil de testar, re-renders excessivos                               | Stores pequenas por domínio (authStore, uploadStore, recoveryStore)     |
| Persistir token JWT em localStorage        | Vulnerável a XSS; pode ser lido por scripts maliciosos                 | Cookie httpOnly (set pelo backend) ou memória (Zustand sem persist)     |
| Polling sem cleanup                        | Memory leak, requisições após navegação                                | `useQuery` com `refetchInterval` + cleanup automático do TanStack Query |
| Event bus com efeitos colaterais complexos | Difícil de debugar, cascata de eventos                                 | Eventos devem ser simples; lógica complexa fica nos hooks/stores        |

> Arquitetura de estado: (ver [01-architecture.md](01-architecture.md) para contexto das camadas)
