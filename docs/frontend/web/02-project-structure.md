# Estrutura do Projeto

Define a organização de pastas, a estratégia de modularização e as regras de importação do projeto frontend web (Next.js 16 App Router). Uma estrutura bem definida facilita a navegação, reduz conflitos de merge e torna o onboarding de novos desenvolvedores mais rápido.

<!-- do blueprint: 06-system-architecture.md (componentes), 01-architecture.md (camadas e domínios) -->

---

## Estrutura de Pastas

> Como o projeto está organizado no sistema de arquivos?

```
apps/web/
  app/                          # Rotas e páginas (Next.js App Router)
    (auth)/                     # Grupo: rotas públicas de autenticação
      login/page.tsx
      invite/[token]/page.tsx
    (app)/                      # Grupo: rotas protegidas (membro autenticado)
      dashboard/page.tsx        # Galeria principal
      dashboard/nodes/page.tsx  # Painel de nós
      dashboard/alerts/page.tsx # Painel de alertas
      dashboard/settings/page.tsx
      file/[id]/page.tsx        # Detalhe de arquivo (lightbox)
    (admin)/                    # Grupo: rotas admin-only
      admin/members/page.tsx
      admin/cluster/page.tsx
    (setup)/                    # Grupo: onboarding (sem cluster)
      setup/page.tsx            # Criação de cluster
      setup/seed/page.tsx       # Exibição da seed phrase
    (recovery)/                 # Grupo: disaster recovery
      recovery/page.tsx         # Input da seed phrase
      recovery/progress/page.tsx
    layout.tsx                  # Root layout (providers, fonts, theme)
    not-found.tsx               # 404
    error.tsx                   # Error boundary global
    loading.tsx                 # Loading skeleton global
    api/                        # API routes (proxy para orquestrador)
      upload/route.ts           # Proxy de upload com progress tracking
    middleware.ts               # Auth guard, redirects

  features/                     # Módulos por domínio de negócio
    auth/
    gallery/
    nodes/
    cluster/
    alerts/
    recovery/
    settings/

  components/                   # Componentes compartilhados (cross-feature)
    ui/                         # Primitivos (Button, Input, Card, Badge, Skeleton)
    forms/                      # Form helpers (FormField, FormError, FormSection)
    layouts/                    # Layout shells (AppShell, Sidebar, Header)
    feedback/                   # Toast, AlertDialog, ConfirmModal

  hooks/                        # Hooks globais (useDebounce, useMediaQuery, useClipboard)
  lib/                          # API client, fetch wrapper, auth helpers
  store/                        # Stores Zustand globais (authStore, uploadStore)
  types/                        # Tipos compartilhados (Member, File, Node, Cluster)
  utils/                        # Utilitários puros (formatDate, formatBytes, cn)
  styles/                       # Estilos globais e tokens Tailwind
    globals.css
```

> A pasta `app/` contém apenas rotas, layouts e loading/error states. Toda lógica de negócio vive em `features/`.

---

## Organização por Feature

> O projeto segue organização por feature (domínio de negócio).

<!-- do blueprint: 04-domain-model.md (entidades), 08-use_cases.md (casos de uso) -->

| Feature  | Descrição                                                   | Componentes Principais                                                                                       |
| -------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| auth     | Autenticação JWT, login, proteção de rotas                  | LoginForm, AuthGuard, SessionProvider                                                                        |
| gallery  | Upload, galeria de fotos/vídeos/documentos, busca, download | UploadDropzone, UploadQueue, GalleryGrid, GalleryTimeline, FileLightbox, SearchBar, FilterChips, VideoPlayer |
| nodes    | Gerenciamento de nós, monitoramento de saúde, drain         | NodeList, NodeStatusBadge, AddNodeModal, NodeConnectivityTest, DrainProgressBar, DisconnectConfirmModal      |
| cluster  | Criação de cluster, onboarding, seed phrase                 | SetupClusterForm, SeedPhraseDisplay, SeedConfirmCheckbox, EmptyStateDashboard                                |
| alerts   | Alertas de saúde do cluster, notificações admin             | AlertBell, AlertDropdown, AlertCard, ClusterHealthSummary                                                    |
| recovery | Recovery via seed phrase, rebuild                           | SeedPhraseInput, RecoveryStepper, RecoveryProgress, RecoveryReport                                           |
| settings | Configurações do cluster, membros, convites                 | InviteMemberModal, InviteLinkCopy, AcceptInviteForm, MemberList, RoleSelector                                |

<!-- APPEND:features -->

<details>
<summary>Exemplo — Estrutura interna de uma feature</summary>

```
features/
  gallery/
    components/
      UploadDropzone.tsx
      UploadQueue.tsx
      UploadQueueItem.tsx
      GalleryGrid.tsx
      GalleryTimeline.tsx
      FileLightbox.tsx
      SearchBar.tsx
      FilterChips.tsx
      VideoPlayer.tsx
      FileMetadata.tsx
      DownloadButton.tsx
      ThumbnailPlaceholder.tsx
    hooks/
      useFiles.ts              # TanStack Query: GET /files
      useFileDetail.ts         # TanStack Query: GET /files/:id
      useUpload.ts             # Mutação: POST /files/upload
      useUploadQueue.ts        # Lógica da fila (max 3 concorrentes)
    api/
      files-api.ts             # Fetch wrapper para endpoints de files
    types/
      file.types.ts            # File, FileStatus, UploadItem, FileFilter
    utils/
      file-validators.ts       # Validação client-side (tipo, tamanho)
    index.ts                   # Barrel export público
```

</details>

---

## Monorepo

> O projeto utiliza monorepo com Turborepo para compartilhar código entre clientes (web, mobile, desktop) e orquestrador.

- [x] Monorepo (Turborepo)

<!-- do blueprint: 06-system-architecture.md (monorepo com core-sdk), 00-context.md (restrição: monorepo) -->

```
alexandria/
  apps/
    api/                        # Orquestrador NestJS
    web/                        # Cliente web Next.js (este documento)
    mobile/                     # Cliente mobile Expo (Fase 3)
    desktop/                    # Cliente desktop Tauri (Fase 2)

  packages/
    ui/                         # Design system compartilhado (primitivos React)
    api-client/                 # Cliente HTTP tipado (fetch wrapper + tipos)
    types/                      # Tipos TypeScript compartilhados (entidades, DTOs)
    config/                     # Configs compartilhadas (ESLint, TypeScript, Tailwind, Prettier)
    utils/                      # Funções utilitárias puras (formatDate, formatBytes)
    core-sdk/                   # SDK core: criptografia, hashing, BIP-39 (usado pelo api e agentes)
```

| Package    | Responsabilidade                                                   | Consumido por        |
| ---------- | ------------------------------------------------------------------ | -------------------- |
| ui         | Design system: Button, Input, Card, Badge, Skeleton, Toast         | web, mobile, desktop |
| api-client | Fetch wrapper tipado com interceptors (JWT, retry, error handling) | web, mobile, desktop |
| types      | Tipos compartilhados: File, Node, Cluster, Member, Alert, DTOs     | todos                |
| config     | ESLint, tsconfig, Tailwind, Prettier presets                       | todos                |
| utils      | Funções puras: formatDate, formatBytes, cn (class merge)           | todos                |
| core-sdk   | Criptografia (AES-256-GCM), SHA-256, BIP-39, consistent hashing    | api, agentes de nó   |

---

## Regras de Importação

> Quais são as regras de importação entre módulos?

| De                 | Para                 | Permitido? | Observação                                       |
| ------------------ | -------------------- | ---------- | ------------------------------------------------ |
| `features/gallery` | `features/nodes`     | **Não**    | Features não importam de outras features         |
| `features/gallery` | `components/ui`      | **Sim**    | Componentes compartilhados são acessíveis        |
| `features/gallery` | `hooks/`             | **Sim**    | Hooks globais são acessíveis                     |
| `features/gallery` | `lib/`               | **Sim**    | API client e helpers são compartilhados          |
| `features/gallery` | `store/`             | **Sim**    | Stores globais (authStore, uploadStore)          |
| `features/gallery` | `types/`             | **Sim**    | Tipos compartilhados                             |
| `components/ui`    | `features/*`         | **Não**    | Componentes compartilhados não conhecem features |
| `app/`             | `features/*`         | **Sim**    | Rotas importam features para montar páginas      |
| `app/`             | `components/layouts` | **Sim**    | Layouts usados nos route groups                  |
| `store/`           | `features/*`         | **Não**    | Stores globais não conhecem features             |

<!-- APPEND:regras-importacao -->

### Path Aliases

```json
{
  "paths": {
    "@/*": ["./src/*"],
    "@ui/*": ["../../packages/ui/src/*"],
    "@api-client/*": ["../../packages/api-client/src/*"],
    "@alexandria/types": ["../../packages/types/src"]
  }
}
```

> Use path aliases para importações limpas: `@/features/gallery`, `@/components/ui`, `@/hooks`.

> Detalhes sobre camadas e dependências: (ver [01-architecture.md](01-architecture.md))
