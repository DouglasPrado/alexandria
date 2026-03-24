# Estrutura do Projeto

Define a organizacao de pastas, a estrategia de modularizacao e as regras de importacao do projeto frontend. Uma estrutura bem definida facilita a navegacao, reduz conflitos de merge e torna o onboarding de novos desenvolvedores mais rapido.

---

## Estrutura de Pastas

> Como o projeto esta organizado no sistema de arquivos?

<!-- do blueprint: 02-architecture_principles.md (Simplicidade Operacional) + 00-context.md (monorepo com core-sdk) -->

```
src/
  app/                        # Rotas e paginas (Next.js App Router)
    (public)/                 # Rotas publicas (login, aceite de convite, recovery)
      login/
        page.tsx
      invite/[token]/
        page.tsx
      recovery/
        page.tsx
    (protected)/              # Rotas autenticadas (galeria, upload, dashboard)
      layout.tsx              # AuthGuard + sidebar + header
      page.tsx                # Redirect para /gallery
      gallery/
        page.tsx
        [fileId]/
          page.tsx
      upload/
        page.tsx
      nodes/
        page.tsx
      health/
        page.tsx
      settings/
        page.tsx
      cluster/
        page.tsx
        setup/
          page.tsx
    api/                      # Route handlers (BFF quando necessario)
    layout.tsx                # Root layout (providers, fonts, metadata)
    page.tsx                  # Landing / redirect

  features/                   # Modulos por dominio de negocio
    auth/
      components/
      hooks/
      api/
      types/
      utils/
      index.ts
    cluster/
      components/
      hooks/
      api/
      types/
      index.ts
    gallery/
      components/
      hooks/
      api/
      types/
      index.ts
    upload/
      components/
      hooks/
      api/
      types/
      index.ts
    nodes/
      components/
      hooks/
      api/
      types/
      index.ts
    health/
      components/
      hooks/
      api/
      types/
      index.ts
    recovery/
      components/
      hooks/
      api/
      types/
      index.ts
    settings/
      components/
      hooks/
      api/
      types/
      index.ts

  shared/                     # Codigo compartilhado entre features
    components/               # Componentes compartilhados
      ui/                     # Primitivos (Button, Input, Card, Badge, Dialog)
      forms/                  # Componentes de formulario (FormField, FileInput)
      layouts/                # Layouts reutilizaveis (Sidebar, Header, PageShell)
      feedback/               # Loading, Empty, Error states
    domain/                   # Modelos e regras de negocio (Domain Layer)
      models/                 # Tipos das entidades (Cluster, Member, File, Node, Alert)
      rules/                  # Regras de negocio client-side (canUpload, isReplicationHealthy)
      interfaces/             # Interfaces para Infrastructure Layer
    hooks/                    # Hooks globais (useMediaQuery, useDebounce, useIntersection)
    lib/                      # Infrastructure Layer
      api-client.ts           # Fetch wrapper com interceptors (JWT, retry, error handling)
      auth.ts                 # Logica de JWT (decode, refresh, storage)
      storage.ts              # Local storage tipado
      query-keys.ts           # Centralizacao de TanStack Query keys
    store/                    # Stores globais Zustand
      auth-store.ts
    types/                    # Tipos utilitarios (ApiResponse, PaginatedResult, etc.)
    utils/                    # Utilitarios puros (formatBytes, formatDate, cn)
    styles/                   # Estilos globais e tokens CSS
      globals.css
      tokens.css

  middleware.ts               # Next.js middleware (auth redirect, protected routes)
```

> A pasta `app/` contem apenas rotas e layouts. Toda logica de negocio vive em `features/`.

---

## Organizacao por Feature

> O projeto segue organizacao por feature (dominio) ou por tipo?

**Escolha: por feature.** Organizar por feature (dominio de negocio) agrupa tudo que e relacionado no mesmo lugar — componentes, hooks, API, tipos. Isso reduz a necessidade de navegar entre pastas distantes e facilita a exclusao ou refatoracao de uma feature inteira.

<!-- do blueprint: 04-domain-model.md (entidades) + 08-use_cases.md (casos de uso) -->

| Feature | Descricao | Componentes Principais |
| --- | --- | --- |
| auth | Autenticacao (login/logout), sessao JWT, guards de role | LoginForm, AuthGuard, RoleGate |
| cluster | Criacao de cluster, seed phrase, convite de membros, lista de membros | ClusterSetup, SeedPhraseDisplay, InviteForm, MemberList |
| gallery | Galeria de arquivos (grid, timeline), preview, busca, download | GalleryGrid, TimelineView, FilePreview, SearchBar, FileDetail |
| upload | Upload de arquivos, fila, progresso, status do pipeline | FileUploader, UploadProgress, UploadQueue, ProcessingStatus |
| nodes | Registro de nos, monitoramento, heartbeat, drain | NodeList, NodeCard, AddNodeForm, DrainProgress |
| health | Dashboard de saude, alertas ativos, metricas de replicacao | HealthDashboard, AlertList, AlertDetail, ReplicationStatus |
| recovery | Recovery via seed phrase, progresso do rebuild, relatorio | RecoveryForm, RecoveryProgress, RecoveryReport |
| settings | Perfil do membro, vault, preferencias | ProfileForm, VaultManager, SettingsPage |

<!-- APPEND:features -->

<details>
<summary>Exemplo — Estrutura interna da feature gallery</summary>

```
features/
  gallery/
    components/
      GalleryGrid.tsx         # Grid de thumbnails com lazy loading
      TimelineView.tsx        # Navegacao cronologica
      FilePreview.tsx         # Preview de foto/video/documento
      FileDetail.tsx          # Modal com metadata e opcoes
      SearchBar.tsx           # Busca por nome, tipo, data
      GalleryEmpty.tsx        # Empty state quando sem arquivos
    hooks/
      useFiles.ts             # TanStack Query: listar arquivos paginados
      useFileDetail.ts        # TanStack Query: detalhes de um arquivo
      useFileDownload.ts      # Logica de download com progress
      useGalleryFilters.ts    # Estado local de filtros (media_type, busca)
    api/
      files-api.ts            # Chamadas HTTP: GET /files, GET /files/:id, etc.
    types/
      gallery.types.ts        # Tipos locais da feature (GalleryFilter, ViewMode)
    index.ts                  # Barrel export: { GalleryGrid, useFiles, ... }
```

</details>

---

## Monorepo

> O projeto utiliza monorepo? Como esta estruturado?

<!-- do blueprint: 00-context.md ("Monorepo com core-sdk compartilhado entre orquestrador, agentes de nó e clientes") -->

- [x] Monorepo (Turborepo)

O Alexandria e um monorepo que compartilha o `core-sdk` (TypeScript puro) entre backend e frontend. O frontend e um workspace dedicado dentro do monorepo.

```
alexandria/                   # Raiz do monorepo
  apps/
    web/                      # Frontend Next.js (este documento)
      src/
        app/
        features/
        shared/
      next.config.ts
      tailwind.config.ts
      tsconfig.json

  packages/
    core-sdk/                 # SDK compartilhado (TypeScript puro, mesmo runtime)
                              # Criptografia, hashing, validacao de seed phrase
    ui/                       # Design system compartilhado (componentes base)
    config/                   # Configs compartilhadas (ESLint, TypeScript, Tailwind)
    types/                    # Tipos gerados a partir dos contratos da API

  apps/
    api/                      # Backend NestJS (orquestrador, agente de no)

  turbo.json
  package.json
```

| Package | Responsabilidade | Consumido por |
| --- | --- | --- |
| core-sdk | Criptografia AES-256-GCM, SHA-256 hashing, validacao BIP-39, derivacao de chaves — TypeScript puro (compartilhado via monorepo) | web, api (upload client-side encryption, seed validation) |
| ui | Componentes base do design system (Button, Input, Card, Dialog) | web |
| config | Configs de ESLint, TypeScript e Tailwind compartilhadas | web, ui |
| types | Tipos TypeScript gerados a partir dos contratos da API REST (DTOs) | web |

### Comandos Turborepo

```bash
turbo dev          # Inicia todos os apps em modo dev
turbo build        # Build de producao de todos os workspaces
turbo lint         # Lint de todos os workspaces
turbo test         # Testes de todos os workspaces
turbo dev --filter=web  # Apenas o frontend
```

---

## Regras de Importacao

> Quais sao as regras de importacao entre modulos?

| De | Para | Permitido? | Observacao |
| --- | --- | --- | --- |
| `features/auth` | `features/gallery` | Nao | Features nao importam de outras features |
| `features/auth` | `shared/components/ui` | Sim | Componentes compartilhados sao acessiveis |
| `features/auth` | `shared/hooks` | Sim | Hooks globais sao acessiveis |
| `features/auth` | `shared/lib` | Sim | API client e servicos sao compartilhados |
| `features/auth` | `shared/domain` | Sim | Modelos e regras de negocio sao acessiveis |
| `shared/components/ui` | `features/auth` | Nao | Componentes compartilhados nao conhecem features |
| `shared/domain` | `shared/lib` | Nao | Domain Layer nao depende de Infrastructure |
| `shared/lib` | `shared/domain` | Sim | Infrastructure implementa interfaces do Domain |
| `app/` | `features/*` | Sim | Rotas importam features para montar paginas |
| `app/` | `shared/*` | Sim | Rotas podem usar componentes e hooks compartilhados |
| `features/*` | `@alexandria/core-sdk` | Sim | Features podem usar o SDK TypeScript (via shared/lib preferencialmente) |
| `features/*` | `@alexandria/types` | Sim | Tipos de contrato da API |

<!-- APPEND:regras-importacao -->

### Path Aliases

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/features/*": ["./src/features/*"],
      "@/shared/*": ["./src/shared/*"],
      "@alexandria/core-sdk": ["../../packages/core-sdk"],
      "@alexandria/ui": ["../../packages/ui/src"],
      "@alexandria/types": ["../../packages/types/src"]
    }
  }
}
```

### Lint de fronteiras

Regras de import enforced via ESLint (`eslint-plugin-boundaries` ou `eslint-plugin-import`):

- `features/**` nao pode importar de `features/**` (exceto o proprio)
- `shared/domain/**` nao pode importar de `shared/lib/**` nem de `features/**`
- `shared/components/ui/**` nao pode importar de `features/**`
- Imports circulares sao proibidos

> Detalhes sobre camadas e dependencias: (ver 01-architecture.md)

---

## Convencoes de Nomes

> Quais convencoes de nomenclatura sao usadas no projeto?

<!-- do blueprint: docs/shared/glossary.md (convencoes de nomenclatura) -->

| Tipo | Convencao | Exemplo |
| --- | --- | --- |
| Componentes React | PascalCase | `GalleryGrid.tsx`, `FilePreview.tsx` |
| Hooks | camelCase com prefixo `use` | `useFiles.ts`, `useUploadFile.ts` |
| API modules | kebab-case com sufixo `-api` | `files-api.ts`, `nodes-api.ts` |
| Types | kebab-case com sufixo `.types` | `gallery.types.ts`, `auth.types.ts` |
| Utils | kebab-case | `format-bytes.ts`, `cn.ts` |
| Stores Zustand | kebab-case com sufixo `-store` | `auth-store.ts`, `upload-store.ts` |
| Pastas de features | kebab-case, singular | `auth/`, `gallery/`, `upload/` |
| Barrel exports | `index.ts` na raiz de cada feature | `features/auth/index.ts` |
| Constantes | UPPER_SNAKE_CASE | `MAX_FILE_SIZE`, `API_BASE_URL` |
| Env vars | NEXT_PUBLIC_ para client-side | `NEXT_PUBLIC_API_URL` |
