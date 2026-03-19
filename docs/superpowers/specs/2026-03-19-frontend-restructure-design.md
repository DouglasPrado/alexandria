# Frontend Restructure — Alinhar ao Blueprint

**Data:** 2026-03-19
**Escopo:** Reestruturar `apps/web/src/` para seguir os 15 documentos do frontend blueprint (`docs/frontend/`)
**Abordagem:** Reestruturação completa da estrutura + migração das 5 features existentes

---

## Contexto

O frontend atual (`apps/web/`) foi construído como MVP rápido sem seguir o blueprint. O resultado é uma app funcional mas com:

- Estrutura flat (sem feature-based organization)
- Zero componentes reutilizáveis (`components/ui/` vazio)
- Estado via `useState` + `useEffect` + `fetch` manual (sem TanStack Query, sem Zustand)
- Sem validação de DTOs, sem retry, sem interceptors
- Sem testes, sem i18n, sem observabilidade
- Ícones como emojis, sem dark mode, 1 único layout

A aderência geral ao blueprint é ~8%. Este spec define como levar para ~60% com fundação sólida para iterar.

---

## Decisões

### Abordagem: Reestruturação Completa (Opção B)

Criar a nova estrutura de pastas de uma vez, instalar dependências, configurar providers, e migrar as 5 páginas existentes para a nova arquitetura. O app permanece funcional durante todo o processo.

**Descartadas:**
- Refactor incremental (A): mais seguro mas lento demais — a estrutura flat contamina cada iteração
- Rewrite from scratch (C): risco de perder comportamento já validado no MVP

### Escopo: Fundação + 5 Features Existentes (Opção A)

Migrar apenas gallery, upload, nodes, health, recovery — as features com backend funcional. Features sem backend (vault, cluster management, auth, documents, settings) ficam para fases futuras.

**Fora do escopo:**
- Auth/login flow (sem backend de autenticação)
- Route protection middleware (sem auth)
- Dark mode toggle (tokens preparados, UI depois)
- Migração de copies para next-intl (instala mas não migra)
- Virtual scrolling na gallery (instala @tanstack/react-virtual, aplica depois)
- BFF / Next.js Route Handlers (overhead sem auth)
- Testes (Vitest/Playwright/MSW — fase seguinte)
- Observabilidade (Sentry — precisa de DSN)

### Desvios intencionais do blueprint

O blueprint define a arquitetura completa (monorepo com `packages/ui/`, `packages/core-sdk/`, etc.). Nesta fase, aplicamos desvios pragmáticos:

- **`components/ui/` local** em vez de `packages/ui/` (`@alexandria/ui`): monorepo com Turborepo é overhead nesta fase. Migração para `packages/ui/` acontece quando desktop (Tauri) ou mobile (React Native) precisarem compartilhar.
- **Sem `components/forms/`**: o blueprint define Field, Select, FileInput como compostos de forms. Nesta fase, `SeedPhraseInput` vive em `features/recovery/components/` por ser feature-specific. A pasta `forms/` entra quando houver 2+ features usando form components compartilhados.
- **Sem `styles/` separado**: tokens ficam em `app/globals.css` (padrão Tailwind v4 com `@theme`), não em uma pasta `styles/` separada.
- **Sem `features/*/services/`**: o blueprint prevê `services/` dentro de cada feature para lógica complexa (media-optimizer, chunker). Nesta fase, features não têm lógica de serviço suficiente para justificar. A pasta entra por feature quando necessário.
- **Upload como rota standalone**: o blueprint define upload integrado na gallery sem rota própria. O MVP criou `/upload` como rota separada e o backend tem endpoint dedicado. Mantemos a rota standalone nesta fase; integração na gallery fica para fase futura.
- **Recovery fora de `(protected)/`**: o blueprint classifica recovery como rota pública (não requer autenticação — é usada para reconstruir o orchestrator do zero). Recovery fica em `app/recovery/` no nível raiz.

---

## 1. Nova Estrutura de Pastas

Referência: [02-estrutura-projeto.md](../../frontend/02-estrutura-projeto.md)

```
src/
├── app/                              # Next.js App Router (rotas apenas)
│   ├── layout.tsx                    # RootLayout: QueryClientProvider, ThemeProvider
│   ├── page.tsx                      # Redirect → /gallery
│   ├── recovery/page.tsx             # Thin shell → <RecoveryPage /> (rota pública)
│   ├── (protected)/                  # Route group: requer cluster ativo (ver Seção 4)
│   │   ├── layout.tsx                # AppLayout (AppShell + Sidebar + Header)
│   │   ├── gallery/page.tsx          # Thin shell → <GalleryPage />
│   │   ├── upload/page.tsx           # Thin shell → <UploadPage />
│   │   ├── nodes/page.tsx            # Thin shell → <NodesPage />
│   │   └── health/page.tsx           # Thin shell → <HealthPage />
│   └── globals.css                   # Design tokens (@theme)
│
├── features/                         # Domínios de negócio
│   ├── gallery/
│   │   ├── components/
│   │   │   ├── GalleryPage.tsx       # Página completa (orquestra hooks + UI)
│   │   │   ├── GalleryGrid.tsx       # Grid responsivo de fotos
│   │   │   └── PhotoCard.tsx         # Card individual de foto/video
│   │   ├── hooks/
│   │   │   └── useGallery.ts         # TanStack Query: lista de arquivos
│   │   ├── api/
│   │   │   └── gallery-api.ts        # Funções fetch puras
│   │   └── types/
│   │       └── gallery.types.ts      # Zod schemas + tipos inferidos
│   │
│   ├── upload/
│   │   ├── components/
│   │   │   ├── UploadPage.tsx        # Página completa
│   │   │   ├── UploadDropzone.tsx    # Área de drag-and-drop
│   │   │   └── UploadQueue.tsx       # Lista de arquivos na fila
│   │   ├── hooks/
│   │   │   ├── useUploadQueue.ts     # Estado local da fila (UI state, useState)
│   │   │   └── useUploadFile.ts      # TanStack Query mutation: envio ao backend
│   │   ├── api/
│   │   │   └── upload-api.ts         # Funções fetch puras
│   │   └── types/
│   │       └── upload.types.ts       # Zod schemas + tipos inferidos
│   │
│   ├── nodes/
│   │   ├── components/
│   │   │   ├── NodesPage.tsx         # Página completa
│   │   │   ├── NodeList.tsx          # Lista de nós
│   │   │   ├── NodeCard.tsx          # Card individual de nó
│   │   │   └── CapacityBar.tsx       # Barra de capacidade
│   │   ├── hooks/
│   │   │   └── useNodes.ts           # TanStack Query: lista de nós
│   │   ├── api/
│   │   │   └── nodes-api.ts          # Funções fetch puras
│   │   └── types/
│   │       └── nodes.types.ts        # Zod schemas + tipos inferidos
│   │
│   ├── health/
│   │   ├── components/
│   │   │   ├── HealthPage.tsx        # Página completa
│   │   │   ├── HealthSummary.tsx     # Resumo do cluster
│   │   │   └── AlertList.tsx         # Lista de alertas
│   │   ├── hooks/
│   │   │   ├── useAlerts.ts          # TanStack Query: alertas
│   │   │   └── useClusterHealth.ts   # TanStack Query: saúde geral
│   │   ├── api/
│   │   │   └── health-api.ts         # Funções fetch puras
│   │   └── types/
│   │       └── health.types.ts       # Zod schemas + tipos inferidos
│   │
│   └── recovery/
│       ├── components/
│       │   ├── RecoveryPage.tsx       # Página completa
│       │   ├── RecoveryWizard.tsx     # Wizard step-by-step
│       │   ├── SeedPhraseInput.tsx    # Input especializado 12 palavras
│       │   └── RecoveryReport.tsx     # Relatório de recuperação
│       ├── hooks/
│       │   └── useRecovery.ts         # TanStack Query mutation
│       ├── api/
│       │   └── recovery-api.ts        # Funções fetch puras
│       └── types/
│           └── recovery.types.ts      # Zod schemas + tipos inferidos
│
├── components/                       # Compartilhados entre features
│   ├── ui/                           # Primitivos (sem lógica de negócio)
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   ├── Progress.tsx
│   │   ├── Skeleton.tsx
│   │   ├── Alert.tsx
│   │   └── index.ts                  # Barrel export
│   ├── layouts/                      # Layout compostos
│   │   ├── AppShell.tsx              # Grid: sidebar + content
│   │   ├── Sidebar.tsx               # Navegação principal
│   │   └── Header.tsx                # Breadcrumb + título
│   └── feedback/                     # Estados compartilhados
│       └── EmptyState.tsx            # Ícone + título + descrição + CTA
│
├── hooks/                            # Hooks globais
│   └── useCluster.ts                 # Auto-detecção de cluster via TanStack Query
│
├── services/                         # Clients de API
│   └── api-client.ts                 # Fetch wrapper: baseURL, headers, timeout (sem retry — TanStack Query gerencia)
│
├── store/                            # Estado global (Zustand)
│   ├── preferences-store.ts          # Tema, sidebar, layout — localStorage
│   └── event-bus.ts                  # Pub/sub tipado cross-feature
│
├── types/                            # Tipos globais
│   └── api.types.ts                  # Tipos base (ApiError, PaginatedResponse, etc.)
│
├── utils/                            # Utilitários puros
│   ├── cn.ts                         # clsx + tailwind-merge helper
│   └── format.ts                     # formatBytes, timeAgo, formatDate
│
└── lib/                              # Wrappers de libs externas
    └── query-client.ts               # QueryClient config + provider
```

**Regras de import:**
- `app/` → `features/` (thin shell import)
- `features/*` → `components/`, `hooks/`, `services/`, `store/`, `types/`, `utils/`
- `features/*` ↛ `features/*` (proibido cross-feature import)
- `components/ui/` ↛ `features/*` (primitivos não conhecem features)

---

## 2. Componentes Primitivos

Referência: [03-design-system.md](../../frontend/03-design-system.md), [04-componentes.md](../../frontend/04-componentes.md)

### 8 primitivos + 1 feedback component para esta fase

O blueprint define primitivos em `packages/ui/` (`@alexandria/ui`). Nesta fase, ficam em `components/ui/` local (ver "Desvios intencionais"). `EmptyState` é um componente de feedback (não primitivo) e vive em `components/feedback/`.

Cada componente segue o padrão:
- Props via `interface` extending `ComponentPropsWithoutRef<"element">`
- `className` aceito e mergeado via `cn()` (clsx + twMerge)
- Named exports (não default)
- Ícones via `lucide-react`
- Zero lógica de negócio

#### Button

```ts
interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}
```

- Variantes mapeadas para classes Tailwind
- `loading` renderiza spinner inline e desabilita click
- `disabled` visual consistente entre variantes

#### Input

```ts
interface InputProps extends ComponentPropsWithoutRef<"input"> {
  error?: string;
}
```

- Borda vermelha + mensagem quando `error` presente
- Suporte a `type="text" | "password" | "search"`
- Ícone de busca para `type="search"` via Lucide

#### Card

```ts
interface CardProps extends ComponentPropsWithoutRef<"div"> {
  children: React.ReactNode;
}
// Subcomponentes: Card.Header, Card.Body, Card.Footer
```

- Container com `bg-surface-elevated`, `border`, `radius-lg`, `shadow-sm`
- Compound component pattern (Card.Header, Card.Body, Card.Footer)

#### Badge

```ts
interface BadgeProps extends ComponentPropsWithoutRef<"span"> {
  variant?: "success" | "warning" | "error" | "info" | "default";
  size?: "sm" | "md";
}
```

- Pill shape, cores semânticas do design system
- Texto curto (status: "Online", "Offline", "Pendente")

#### Modal

```ts
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}
```

- Overlay escuro + container centralizado
- Fecha com ESC, click fora, e botão X
- Focus trap (acessibilidade básica)
- Portal via `createPortal`

#### Progress

```ts
interface ProgressProps extends ComponentPropsWithoutRef<"div"> {
  value: number;       // 0-100
  max?: number;
  label?: string;
  variant?: "default" | "success" | "warning" | "error";
}
```

- Barra horizontal com preenchimento proporcional
- Label opcional acima (ex: "75% — 150GB / 200GB")
- Cores semânticas para thresholds (>90% = error)

#### Skeleton

```ts
interface SkeletonProps extends ComponentPropsWithoutRef<"div"> {
  // width/height via className ou style
}
```

- `animate-pulse` com `bg-gray-200 rounded`
- Aceita qualquer dimensão via Tailwind classes

#### EmptyState

```ts
interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}
```

- Layout centralizado vertical
- Ícone Lucide em tamanho grande + muted color
- CTA opcional via `Button` primitivo

#### Alert

```ts
interface AlertProps extends ComponentPropsWithoutRef<"div"> {
  variant: "success" | "warning" | "error" | "info";
  title?: string;
  children: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}
```

- Ícone contextual por variante (CheckCircle, AlertTriangle, XCircle, Info)
- Background semântico sutil
- Botão X para dismiss

---

## 3. Data Layer

Referência: [06-data-layer.md](../../frontend/06-data-layer.md), [05-estado.md](../../frontend/05-estado.md)

### API Client (`services/api-client.ts`)

Substitui `lib/api.ts`. Um fetch wrapper com:

```ts
class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number = 30_000;

  async get<T>(path: string, params?: Record<string, string>): Promise<T>;
  async post<T>(path: string, body?: unknown): Promise<T>;
  async put<T>(path: string, body?: unknown): Promise<T>;
  async delete<T>(path: string): Promise<T>;
}
```

**Comportamentos:**
- Base URL: `NEXT_PUBLIC_API_URL` ou `""` (mesmo host, Caddy proxy)
- Headers automáticos: `Content-Type: application/json`, `X-Request-Id: <uuid>`
- **Sem retry no ApiClient** — retry é responsabilidade exclusiva do TanStack Query (evita retry duplo: 3×3=9 tentativas). O ApiClient é um transport layer puro.
- Timeout: 30s via `AbortController`
- Erros: transforma em `ApiError { status: number; message: string; code?: string }`
- Singleton exportado: `export const apiClient = new ApiClient()`

### Zod Schemas (`types/api.types.ts`)

Tipos base compartilhados:

```ts
// Tipos base
const ApiErrorSchema = z.object({
  status: z.number(),
  message: z.string(),
  code: z.string().optional(),
});
```

Schemas por feature ficam em `features/*/types/*.types.ts`. Devem espelhar exatamente os campos retornados pelo backend (conforme `lib/api.ts` atual):

```ts
// features/gallery/types/gallery.types.ts
// Campos espelham a interface FileItem do backend (orchestrator)
export const FileSchema = z.object({
  id: z.string().uuid(),
  cluster_id: z.string().uuid(),
  original_name: z.string(),
  media_type: z.string(),
  mime_type: z.string(),
  file_extension: z.string(),
  original_size: z.number(),
  optimized_size: z.number(),
  status: z.string(),
  created_at: z.string(),
});
export type FileDTO = z.infer<typeof FileSchema>;

export const GalleryResponseSchema = z.object({
  files: z.array(FileSchema),
  next_cursor: z.string().nullable(),
});
export type GalleryResponse = z.infer<typeof GalleryResponseSchema>;
```

```ts
// features/nodes/types/nodes.types.ts
export const NodeSchema = z.object({
  id: z.string().uuid(),
  cluster_id: z.string().uuid(),
  name: z.string(),
  node_type: z.string(),
  status: z.string(),
  total_capacity: z.number(),
  used_capacity: z.number(),
  last_heartbeat: z.string(),
});
export type NodeDTO = z.infer<typeof NodeSchema>;
```

```ts
// features/health/types/health.types.ts
export const AlertSchema = z.object({
  id: z.string().uuid(),
  cluster_id: z.string().uuid(),
  alert_type: z.string(),
  message: z.string(),
  severity: z.string(),
  resource_type: z.string().nullable(),
  resource_id: z.string().nullable(),
  created_at: z.string(),
});
export type AlertDTO = z.infer<typeof AlertSchema>;
```

```ts
// features/recovery/types/recovery.types.ts
export const RecoveryReportSchema = z.object({
  seed_valid: z.boolean(),
  master_key_derived: z.boolean(),
  vaults_recovered: z.number(),
  manifests_found: z.number(),
  files_recovered: z.number(),
  chunks_missing: z.number(),
  nodes_reconnected: z.number(),
  status: z.string(),
});
export type RecoveryReportDTO = z.infer<typeof RecoveryReportSchema>;
```

A validação acontece na camada de API da feature:

```ts
// features/gallery/api/gallery-api.ts
// Endpoint segue o backend real: /api/v1/clusters/{id}/files
// (o blueprint sugere /api/v1/files?type=photo — priorizamos compatibilidade com o backend existente)
export async function getFiles(clusterId: string, cursor?: string) {
  const raw = await apiClient.get(`/api/v1/clusters/${clusterId}/files`, {
    limit: "20",
    ...(cursor ? { cursor } : {}),
  });
  return GalleryResponseSchema.parse(raw);
}
```

### TanStack Query Configuration (`lib/query-client.ts`)

```ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5min default
      gcTime: 30 * 60 * 1000,         // 30min garbage collection
      retry: 3,                        // retry único aqui (ApiClient NÃO retenta)
      refetchOnWindowFocus: true,
    },
  },
});
```

Provider no RootLayout:

```tsx
// app/layout.tsx
<QueryClientProvider client={queryClient}>
  {children}
</QueryClientProvider>
```

### Hooks por Feature (padrão)

Cada feature expõe hooks que wrappam TanStack Query:

| Feature | Hook | Tipo | staleTime | Descrição |
|---|---|---|---|---|
| gallery | `useGallery(clusterId)` | useQuery | 10 min | Lista de arquivos paginada |
| nodes | `useNodes(clusterId)` | useQuery | 30 s | Lista de nós com status |
| health | `useAlerts(clusterId)` | useQuery | 30 s | Lista de alertas |
| health | `useClusterHealth(clusterId)` | useQuery | 30 s | Saúde geral do cluster |
| recovery | `useRecovery()` | useMutation | — | Inicia recuperação via seed |
| upload | `useUploadFile()` | useMutation | — | Envio de arquivo ao backend |
| upload | `useUploadQueue()` | — (useState) | — | Fila local de arquivos (UI state, não server state) |

**Nota sobre upload:** `useUploadFile` é um `useMutation` do TanStack Query (envia ao backend). `useUploadQueue` é estado local (`useState`) que gerencia a fila de arquivos selecionados no navegador antes do envio. São hooks complementares.

### useCluster — migração para TanStack Query (`hooks/useCluster.ts`)

O hook atual (`lib/useCluster.ts`) usa `useState` + `useEffect` + `fetch` para auto-detectar o cluster ativo. Será migrado para TanStack Query:

```ts
export function useCluster() {
  const clusterId = process.env.NEXT_PUBLIC_CLUSTER_ID;

  const { data: clusters, isLoading, error } = useQuery({
    queryKey: ['clusters'],
    queryFn: () => apiClient.get<ClusterDTO[]>('/api/v1/clusters'),
    staleTime: 5 * 60 * 1000, // 5min
    enabled: !clusterId,       // só busca se não houver env var
  });

  const cluster = clusterId
    ? { id: clusterId }        // env var tem prioridade
    : clusters?.[0] ?? null;

  return {
    cluster,
    loading: isLoading,
    error: error?.message ?? null,
    needsSetup: !isLoading && !cluster,
  };
}
```

A interface de retorno permanece compatível (`{ cluster, loading, error, needsSetup }`) para minimizar mudanças nos consumidores.

### Zustand Stores (`store/`)

**`preferences-store.ts`:**

```ts
interface PreferencesState {
  sidebarCollapsed: boolean;
  galleryLayout: "grid" | "list";
  toggleSidebar: () => void;
  setGalleryLayout: (layout: "grid" | "list") => void;
}
```

Persistido em localStorage via `zustand/middleware/persist`.

**`event-bus.ts`:**

```ts
type EventMap = {
  "upload:complete": { fileId: string };
  "node:status-changed": { nodeId: string; status: string };
};

interface EventBusState {
  subscribe: <K extends keyof EventMap>(event: K, handler: (payload: EventMap[K]) => void) => () => void;
  emit: <K extends keyof EventMap>(event: K, payload: EventMap[K]) => void;
}
```

Sem persistência. Usado para comunicação loose-coupled entre features (ex: upload completo → invalidar query da gallery).

**Nota:** O blueprint (`05-estado.md`) usa `on()` como nome do método de escuta. Usamos `subscribe()` por ser idiomático em Zustand e mais explícito sobre o retorno de uma função de cleanup (unsubscribe).

---

## 4. Layout e Navegação

Referência: [03-design-system.md](../../frontend/03-design-system.md), [07-rotas.md](../../frontend/07-rotas.md)

### Route group `(protected)` — semântica

O route group `(protected)` agrupa as rotas que exigem um cluster ativo. Nesta fase (sem auth), o comportamento é:

- O `(protected)/layout.tsx` renderiza `<AppShell>` que inclui `<Sidebar>` e conteúdo
- O layout usa `useCluster()` para detectar cluster ativo
- Se `needsSetup === true` (nenhum cluster existe), renderiza uma tela de "Setup necessário" em vez do conteúdo, com CTA para criar cluster
- Se cluster está carregando, renderiza skeleton do layout
- **Não há redirect para /login** (sem auth nesta fase) — a proteção é apenas "tem cluster?"

Quando auth for implementada (fase futura), este layout adicionará verificação de sessão JWT.

### AppShell (`components/layouts/AppShell.tsx`)

Grid CSS com sidebar fixa + área de conteúdo:

```tsx
interface AppShellProps {
  children: React.ReactNode;
}
// Renderiza: <Sidebar /> + <main>{children}</main>
```

- Sidebar: 240px fixo (colapsado: 64px — via preferences-store)
- Content: `flex-1`, padding 24px
- Responsivo: mobile (<768px) → sidebar hidden, hamburger menu (futuro)

### Sidebar (`components/layouts/Sidebar.tsx`)

Migrada de `AppLayout.tsx` com melhorias:

- Ícones Lucide (Images, Upload, HardDrive, Activity, KeyRound) substituem emojis
- Badge numérico no item Health (count de alertas — via `useAlerts` query)
- Estado collapsed controlado pelo `preferences-store`
- Active route via `usePathname()`
- Specs visuais do blueprint: bg `--color-surface`, border-right 1px `--color-border`, NavItem active bg `#EFF6FF`

### Header (`components/layouts/Header.tsx`)

Mínimo nesta fase:

```tsx
interface HeaderProps {
  title: string;
  description?: string;
}
```

- Título da página (h1)
- Descrição opcional (subtitle muted)
- Futuro: breadcrumbs, SyncStatus, NotificationBell

---

## 5. Migração das Features

### Padrão de migração (igual para todas):

1. Criar `features/xxx/types/*.types.ts` — Zod schemas extraídos do `api.ts` atual
2. Criar `features/xxx/api/*-api.ts` — funções fetch usando `apiClient` + validação Zod
3. Criar `features/xxx/hooks/use*.ts` — TanStack Query hooks
4. Criar `features/xxx/components/*.tsx` — extrair UI da página atual, usar primitivos de `components/ui/`
5. Criar thin shell em `app/(protected)/xxx/page.tsx` (ou `app/recovery/page.tsx` para recovery)
6. Deletar código antigo correspondente

### Gallery

**Componentes extraídos:**
- `GalleryPage` — orquestra `useGallery` + `useCluster`, renderiza grid ou `EmptyState`
- `GalleryGrid` — grid responsivo com 5 breakpoints (conforme [03-design-system.md](../../frontend/03-design-system.md)):
  - `sm` (640px): 2 colunas
  - `md` (768px): 3 colunas
  - `lg` (1024px): 4 colunas
  - `xl` (1280px): 5 colunas
  - `2xl` (1536px): 6 colunas
- `PhotoCard` — thumbnail + `original_name` + `original_size` formatado + `Badge` de status

**Hook:**
- `useGallery(clusterId)` — `useQuery` com staleTime 10min, retorna `GalleryResponse` (files + next_cursor)

### Upload

**Componentes extraídos:**
- `UploadPage` — orquestra dropzone + queue
- `UploadDropzone` — área drag-and-drop com validação de formato/tamanho, usa `Card` primitivo
- `UploadQueue` — lista de arquivos na fila com status + `Progress` bars

**Hooks:**
- `useUploadQueue` — estado local (`useState`, UI state) para gerenciar fila de arquivos selecionados
- `useUploadFile` — `useMutation` do TanStack Query para enviar arquivo ao backend (POST /api/v1/files/upload)

### Nodes

**Componentes extraídos:**
- `NodesPage` — orquestra `useNodes` + `useCluster`
- `NodeList` — lista de `NodeCard`s
- `NodeCard` — `name`, `node_type`, `Badge` de status, `CapacityBar`
- `CapacityBar` — wrapper de `Progress` com cálculo `used_capacity / total_capacity` e cor semântica (>90% = error, >75% = warning)

**Hook:**
- `useNodes(clusterId)` — `useQuery` com staleTime 30s

### Health

**Componentes extraídos:**
- `HealthPage` — orquestra `useAlerts` + `useClusterHealth`
- `HealthSummary` — cards de resumo (nós online, replicação, capacidade)
- `AlertList` — lista de `Alert` componentes com severity badges

**Hooks:**
- `useAlerts(clusterId)` — `useQuery` com staleTime 30s
- `useClusterHealth(clusterId)` — `useQuery` com staleTime 30s

### Recovery

**Componentes extraídos:**
- `RecoveryPage` — orquestra wizard
- `RecoveryWizard` — step-by-step: input → validating → report
- `SeedPhraseInput` — 12 inputs individuais (1 por palavra) com validação inline
- `RecoveryReport` — exibe resultado da recuperação com status por etapa

**Hook:**
- `useRecovery()` — `useMutation` para POST /api/v1/recovery

---

## 6. Dependências

### Produção (8 pacotes novos)

| Pacote | Versão | Propósito |
|---|---|---|
| `@tanstack/react-query` | ^5.x | Server state management |
| `zustand` | ^5.x | Global/domain state (v5 API: `create` sem `set` wrapper) |
| `zod` | ^3.x | DTO validation |
| `lucide-react` | ^0.x | Ícones SVG |
| `next-intl` | ^4.x | i18n (config mínima, migração de copies futura) |
| `@tanstack/react-virtual` | ^3.x | Virtual scrolling (instalado, uso futuro) |
| `clsx` | ^2.x | Class merging |
| `tailwind-merge` | ^3.x | Resolve conflitos Tailwind |

### Dev

Nenhum pacote novo nesta fase. Vitest, Playwright, MSW entram na fase de testes.

---

## 7. Arquivos Removidos Após Migração

| Arquivo | Motivo |
|---|---|
| `src/lib/api.ts` | Substituído por `services/api-client.ts` + feature APIs |
| `src/lib/useCluster.ts` | Movido para `hooks/useCluster.ts` |
| `src/components/layouts/AppLayout.tsx` | Substituído por `AppShell` + `Sidebar` + `Header` |
| `src/app/gallery/page.tsx` (antigo) | Movido para `app/(protected)/gallery/page.tsx` |
| `src/app/upload/page.tsx` (antigo) | Movido para `app/(protected)/upload/page.tsx` |
| `src/app/nodes/page.tsx` (antigo) | Movido para `app/(protected)/nodes/page.tsx` |
| `src/app/health/page.tsx` (antigo) | Movido para `app/(protected)/health/page.tsx` |
| `src/app/recovery/page.tsx` (antigo) | Substituído por novo `app/recovery/page.tsx` (thin shell) |

---

## 8. Critérios de Sucesso

- [ ] `npm run build` passa sem erros
- [ ] `npm run dev` funciona — todas as 5 rotas acessíveis
- [ ] Nenhum `useState` + `useEffect` + `fetch` para dados do servidor (migrado para TanStack Query)
- [ ] Todas as respostas de API validadas com Zod
- [ ] 8 primitivos em `components/ui/` + EmptyState em `components/feedback/` com API consistente
- [ ] Features isoladas (zero imports cross-feature)
- [ ] Emojis substituídos por ícones Lucide
- [ ] Layout composto (AppShell + Sidebar + Header)
- [ ] `useCluster` migrado para TanStack Query (sem `useState` + `useEffect` + `fetch`)
- [ ] Recovery acessível como rota pública (fora de `(protected)/`)
