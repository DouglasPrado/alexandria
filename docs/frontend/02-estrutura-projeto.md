# Estrutura do Projeto

Define a organizacao de pastas, a estrategia de modularizacao e as regras de importacao do projeto frontend. Uma estrutura bem definida facilita a navegacao, reduz conflitos de merge e torna o onboarding de novos desenvolvedores mais rapido.

---

## Estrutura de Pastas

> Como o projeto esta organizado no sistema de arquivos?

```
src/
  app/                    # Rotas e paginas (Next.js App Router)
    (public)/             # Rotas publicas (login, convite, recovery)
      login/
      invite/[token]/
      recovery/
    (protected)/          # Rotas autenticadas (requerem membro do cluster)
      gallery/
      nodes/
      cluster/
      health/
      vault/
      settings/
    layout.tsx
    page.tsx

  features/               # Modulos por dominio de negocio
    cluster/
      components/
      hooks/
      api/
      types/
      services/
    gallery/
      components/
      hooks/
      api/
      types/
      services/
    upload/
      components/
      hooks/
      api/
      types/
      services/
      workers/            # Web Workers para encrypt, hash, resize
    nodes/
      components/
      hooks/
      api/
      types/
      services/
    recovery/
      components/
      hooks/
      api/
      types/
      services/
    vault/
      components/
      hooks/
      api/
      types/
      services/
    health/
      components/
      hooks/
      api/
      types/
      services/

  components/             # Componentes compartilhados
    ui/                   # Primitivos (Button, Input, Card, Modal, Toast)
    forms/                # Componentes de formulario (Field, Select, FileInput)
    layouts/              # Layouts reutilizaveis (AppShell, Sidebar, Header)
    feedback/             # Estados visuais (Loading, Empty, Error, Success)

  hooks/                  # Hooks globais (useAuth, useClusterConnection, useOnlineStatus)
  services/               # API client base e servicos compartilhados
  lib/                    # Wrappers de bibliotecas externas (crypto, indexeddb)
  store/                  # Estado global (authStore, eventBus)
  types/                  # Tipos compartilhados e modelos do Domain Layer
  utils/                  # Utilitarios (formatters, validators, constants)
  styles/                 # Estilos globais, tokens CSS e tema Tailwind
```

> A pasta `app/` contem apenas rotas e layouts. Toda logica de negocio vive em `features/`.

---

## Organizacao por Feature

> O projeto segue organizacao por feature (dominio) ou por tipo?

**Recomendado: por feature.** Organizar por feature (dominio de negocio) agrupa tudo que e relacionado no mesmo lugar — componentes, hooks, API, tipos. Isso reduz a necessidade de navegar entre pastas distantes e facilita a exclusao ou refatoracao de uma feature inteira.

| Feature | Descricao | Componentes Principais |
| --- | --- | --- |
| cluster | Criacao do grupo familiar, convite de membros via token assinado, gestao de permissoes (admin/membro/leitura) | ClusterSetup, InviteFlow, MemberList, PermissionManager |
| gallery | Galeria de fotos/videos com timeline cronologica, busca por nome/data/tipo/tags, download sob demanda | GalleryGrid, PhotoCard, VideoPlayer, Timeline, SearchBar |
| upload | Pipeline de upload integrado na galeria e sync automatico (resize → encrypt → chunk → distribute), fila com progresso. Nao possui rota/pagina propria | UploadDropzone, SyncStatus, ProcessingQueue, ProgressBar |
| nodes | Registro de nos (local, NAS, VPS, cloud bucket), integracao OAuth, heartbeat, quotas, tier management | NodeList, NodeCard, CloudConnector, OAuthRedirect, QuotaBar |
| recovery | Exibicao de seed phrase na criacao do cluster, wizard de recuperacao do orquestrador em nova VPS | SeedPhraseDisplay, RecoveryWizard, SeedInput, RecoveryProgress |
| vault | Vault criptografado do membro para tokens OAuth e credenciais, desbloqueio via senha, status de tokens | VaultUnlock, CredentialList, TokenStatus |
| health | Dashboard de saude do cluster: replicacao, capacidade, nos online/offline, alertas, logs de operacoes | HealthDashboard, ReplicationStatus, AlertList, CapacityChart |

<!-- APPEND:features -->

<details>
<summary>Exemplo — Estrutura interna da feature upload</summary>

```
features/
  upload/
    components/
      UploadDropzone.tsx      # Area de drag-and-drop para upload manual
      SyncStatus.tsx          # Indicador de sync engine ativo/pausado
      ProcessingQueue.tsx     # Lista de arquivos em processamento
      ProgressBar.tsx         # Barra de progresso por arquivo
    hooks/
      useUploadPipeline.ts    # Orquestra resize → encrypt → chunk → distribute
      useSyncEngine.ts        # Monitora pastas e envia novos arquivos
      useProcessingQueue.ts   # Gerencia fila de processamento
    api/
      upload-api.ts           # Endpoints: create manifest, upload chunk, confirm
    types/
      upload.types.ts         # UploadJob, ProcessingStatus, ChunkProgress
    services/
      media-optimizer.ts      # Resize para 1920px WebP, gerar thumbnail
      chunker.ts              # Divisao em blocos de ~4MB com SHA-256
    workers/
      encrypt.worker.ts       # Web Worker: AES-256-GCM encryption
      hash.worker.ts          # Web Worker: SHA-256 hashing
      resize.worker.ts        # Web Worker: redimensionamento de imagens
    index.ts                  # Barrel export publico
```

</details>

---

## Monorepo

> O projeto utiliza monorepo? Como esta estruturado?

- [ ] Projeto unico
- [x] Monorepo (Turborepo)
- [ ] Monorepo (Nx)
- [ ] Outro

O Alexandria usa monorepo com Turborepo para compartilhar o core-sdk entre web (Next.js), desktop (Tauri) e mobile (React Native). O core-sdk contem toda a logica de dominio e infraestrutura que nao depende de framework ou runtime especifico.

```
alexandria/
  apps/
    web/                    # Next.js 15 — cliente principal (MVP, fase 1)
    desktop/                # Tauri — cliente desktop (fase 2)
    mobile/                 # React Native — cliente mobile (fase 3)

  packages/
    core-sdk/               # Logica compartilhada (dominio + infra)
      crypto/               # AES-256-GCM, SHA-256, key derivation, envelope encryption
      chunking/             # Divisao em blocos, content-addressable storage
      manifest/             # Criacao e validacao de manifests
      storage-provider/     # Interface unificada StorageProvider (put/get/exists/delete/list/capacity)
      models/               # Modelos de dominio (Cluster, Member, Node, Chunk, Manifest)
      types/                # Tipos TypeScript compartilhados
    ui/                     # Design system compartilhado (componentes base + tokens)
    config/                 # Configuracoes compartilhadas (ESLint, TypeScript, Tailwind)
    utils/                  # Funcoes utilitarias compartilhadas (formatters, validators)
```

| Package | Responsabilidade | Consumido por |
| --- | --- | --- |
| core-sdk | Criptografia, chunking, manifests, modelos de dominio, StorageProvider interface | web, desktop, mobile |
| ui | Design system: primitivos visuais, tokens, temas | web, desktop |
| config | Configs de ESLint, TypeScript strict, Tailwind | Todos |
| utils | Formatadores (bytes, datas), validadores, constantes | Todos |

---

## Regras de Importacao

> Quais sao as regras de importacao entre modulos?

| De | Para | Permitido? | Observacao |
| --- | --- | --- | --- |
| `features/upload` | `features/gallery` | Nao | Features nao importam de outras features |
| `features/upload` | `components/ui` | Sim | Componentes compartilhados sao acessiveis |
| `features/upload` | `hooks/` | Sim | Hooks globais sao acessiveis |
| `features/upload` | `services/` | Sim | API client base e servicos compartilhados |
| `features/upload` | `@alexandria/core-sdk` | Sim | Core-sdk e acessivel por todas as features |
| `components/ui` | `features/*` | Nao | Componentes compartilhados nao conhecem features |
| `app/` | `features/*` | Sim | Rotas importam features para montar paginas |
| `features/*` | `store/` | Sim | Features acessam estado global (authStore, eventBus) |
| `@alexandria/core-sdk` | `features/*` | Nao | Core-sdk nao depende de React ou codigo de app |
| `apps/web` | `packages/*` | Sim | Apps consomem packages do monorepo |
| `packages/ui` | `packages/core-sdk` | Nao | UI nao depende de logica de dominio |

<!-- APPEND:regras-importacao -->

> Use path aliases para importacoes limpas: `@/features/upload`, `@/components/ui`, `@/hooks`, `@alexandria/core-sdk`.

> Detalhes sobre camadas e dependencias: (ver 01-arquitetura.md)
