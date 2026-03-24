# Estrutura do Projeto

Define a organizacao de pastas, a estrategia de modularizacao e as regras de importacao do projeto mobile. Uma estrutura bem definida facilita a navegacao, reduz conflitos de merge e torna o onboarding de novos desenvolvedores mais rapido.

---

## Estrutura de Pastas

> Como o projeto esta organizado no sistema de arquivos?

```
src/
  app/                    # Screens e navegacao (Expo Router)
    (tabs)/               # Tab Navigator (bottom tabs)
      index.tsx           # Home tab
      profile.tsx         # Profile tab
      settings.tsx        # Settings tab
      _layout.tsx         # Tab layout config
    (auth)/               # Auth screens (sem tabs)
      login.tsx
      register.tsx
      forgot-password.tsx
      _layout.tsx         # Auth stack layout
    (onboarding)/         # Onboarding screens
      _layout.tsx
    _layout.tsx           # Root layout (providers, fonts, splash)
    +not-found.tsx        # 404 screen

  features/               # Modulos por dominio de negocio
    auth/                 # Login, vault unlock, seed phrase recovery
      components/
      hooks/
      api/
      types/
      services/           # secure-storage, vault
    gallery/              # Galeria, timeline, busca, visualizacao
      components/
      hooks/
      api/
      types/
      utils/
    upload/               # Sync Engine, fila offline, liberacao de espaco
      components/
      hooks/
      api/
      types/
      services/           # sync-engine, upload-queue
    cluster/              # Cluster info, membros, convites
      components/
      hooks/
      api/
      types/
    nodes/                # Nos de storage, saude, registro (admin)
      components/
      hooks/
      api/
      types/
    alerts/               # Alertas de saude do cluster
      components/
      hooks/
      api/
      types/
    settings/             # Configuracoes do app, perfil, logout
      components/
      hooks/
      types/

  components/             # Componentes compartilhados
    ui/                   # Primitivos (Button, Input, Card)
    forms/                # Componentes de formulario
    navigation/           # Componentes de navegacao (Header, TabBar)

  hooks/                  # Hooks globais
  services/               # API client e servicos
  store/                  # Estado global
  types/                  # Tipos compartilhados
  utils/                  # Utilitarios
  constants/              # Cores, espacamentos, config
  assets/                 # Imagens, fontes, icones
```

> A pasta `app/` contem apenas screens e configuracao de navegacao (Expo Router). Toda logica de negocio vive em `features/`.

---

## Organizacao por Feature

> O projeto segue organizacao por feature (dominio) ou por tipo?

**Recomendado: por feature.** Organizar por feature (dominio de negocio) agrupa tudo que e relacionado no mesmo lugar — componentes, hooks, API, tipos. Isso reduz a necessidade de navegar entre pastas distantes e facilita a exclusao ou refatoracao de uma feature inteira.

<!-- do blueprint: 00-context.md (atores), 01-vision.md (personas), mobile/01-architecture.md (dominios) -->

| Feature    | Descricao                                                                                     | Componentes Principais                                                                     |
| ---------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `auth`     | Login com JWT, desbloqueio do vault com senha, recovery via seed phrase de 12 palavras        | LoginScreen, VaultUnlockScreen, SeedRecoveryScreen, AuthGuard                             |
| `gallery`  | Galeria compartilhada do cluster, timeline cronologica, busca por data/evento, fullscreen     | GalleryScreen, TimelineScreen, PhotoDetailScreen, VideoDetailScreen, PhotoThumbnail, AlbumGrid |
| `upload`   | Sync Engine automatico (camera roll), upload manual, fila offline persistida, liberacao de espaco | UploadQueueScreen, SyncSettingsScreen, UploadProgressBar, SpaceReleaseModal            |
| `cluster`  | Saude geral do cluster, lista de membros, convite por link/token, gestao de roles (admin)     | ClusterDashboardScreen, MembersScreen, InviteMemberSheet, MemberCard                      |
| `nodes`    | Lista de nos de armazenamento, saude individual, registro de novo no, drain (admin only)      | NodesScreen, NodeDetailScreen, RegisterNodeSheet, NodeHealthBadge                         |
| `alerts`   | Alertas de saude: no offline, replicacao baixa, integridade comprometida, token expirado      | AlertsScreen, AlertBadge, AlertDetailSheet                                                |
| `settings` | Notificacoes, configuracoes de sync, limiar de liberacao de espaco, perfil, logout            | SettingsScreen, ProfileScreen, SyncSettingsScreen, NotificationSettingsScreen             |

<!-- APPEND:features -->

<details>
<summary>Exemplo — Estrutura interna de uma feature</summary>

```
features/
  auth/
    components/
      LoginForm.tsx
      RegisterForm.tsx
      BiometricPrompt.tsx
    hooks/
      useAuth.ts
      useLogin.ts
      useBiometric.ts
    api/
      auth-api.ts
    types/
      auth.types.ts
    utils/
      token.ts
      secure-storage.ts
    index.ts              # Barrel export publico
```

</details>

---

## Monorepo (se aplicavel)

> O projeto utiliza monorepo? Como esta estruturado?

- [ ] Projeto unico
- [ ] Monorepo (Turborepo)
- [ ] Monorepo (Nx)
- [x] Outro: pnpm workspaces

<!-- do blueprint: 00-context.md (Monorepo com core-sdk compartilhado entre orquestrador, agentes de no e clientes), 06-system-architecture.md -->

O Alexandria usa **pnpm workspaces** com monorepo. O app mobile em `apps/mobile/` compartilha o `core-sdk` com o orquestrador e o agente de no. Essa e a decisao arquitetural mais importante: criptografia, chunking e envelope encryption rodam no proprio dispositivo mobile via Core SDK.

```
apps/
  web/                    # Web client (Next.js 16)
  mobile/                 # App React Native / Expo  ← este documento
  node-agent/             # Agente de no (NestJS)

packages/
  core-sdk/               # Criptografia AES-256-GCM, BIP-39, chunking, consistent hashing
  orchestrator/           # Orquestrador NestJS (backend)
  config/                 # Configs compartilhadas: ESLint, TypeScript, Prettier

pnpm-workspace.yaml
turbo.json                # Build pipeline (se Turborepo for adotado)
```

| Package        | Responsabilidade                                                                    | Consumido por                       |
| -------------- | ----------------------------------------------------------------------------------- | ----------------------------------- |
| `core-sdk`     | AES-256-GCM, BIP-39 seed phrase, chunking ~4MB, SHA-256, consistent hashing        | mobile, web, node-agent, orchestrator |
| `config`       | Configs compartilhadas de ESLint, TypeScript (tsconfig base), Prettier              | Todos os packages e apps            |

> O `core-sdk` e o ativo mais critico do monorepo. Qualquer bug aqui afeta todos os clientes. Mudancas no core-sdk exigem testes em todos os consumers antes de merge.

---

## Regras de Importacao

> Quais sao as regras de importacao entre modulos?

<!-- do blueprint: mobile/01-architecture.md (regras de dependencia entre camadas) -->

| De | Para | Permitido? | Observacao |
| --- | --- | --- | --- |
| `features/gallery` | `features/upload` | Nao | Features nao importam de outras features diretamente |
| `features/alerts` | `features/cluster` | Nao | Comunicacao via store compartilhado (alertsStore, clusterStore) |
| `features/upload` | `packages/core-sdk` | Sim | Core SDK e dependencia externa do monorepo, nao uma feature |
| `features/*` | `components/ui` | Sim | Primitivos UI compartilhados sao acessiveis por todas as features |
| `features/*` | `hooks/` | Sim | Hooks globais (useTheme, useNetwork, usePermissions) sao compartilhados |
| `features/*` | `services/api-client` | Sim | API client centralizado e compartilhado |
| `features/*` | `store/` | Sim | Stores globais (authStore, settingsStore) sao acessiveis |
| `components/ui` | `features/*` | Nao | Componentes UI nao conhecem dominios de negocio |
| `app/` | `features/*` | Sim | Screens Expo Router importam features para montar telas |
| `app/` | `components/` | Sim | Screens podem usar componentes compartilhados diretamente |

<!-- APPEND:regras-importacao -->

> Use path aliases para importacoes limpas: `@/features/auth`, `@/components/ui`, `@/hooks`.

> Detalhes sobre camadas e dependencias: (ver 01-architecture.md)
