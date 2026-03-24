# Estrutura do Projeto Desktop

Define a organizacao de pastas, a estrategia de modularizacao e as regras de importacao do projeto frontend desktop. Uma estrutura bem definida facilita a navegacao, reduz conflitos de merge e torna o onboarding de novos desenvolvedores mais rapido.

---

## Estrutura de Pastas

> Como o projeto desktop esta organizado no sistema de arquivos?

```
src/
  main/                     # Main process (Node.js — Electron)
    ipc/                    # IPC handlers (um arquivo por dominio)
      auth-handlers.ts      # vault:unlock, vault:lock
      sync-handlers.ts      # sync:start, sync:stop, sync:progress
      file-handlers.ts      # file:list, file:download
      cluster-handlers.ts   # cluster:health
      settings-handlers.ts  # settings:get, settings:set
    sync-engine/            # Sync Engine: chokidar watcher + fila de upload
      file-watcher.ts       # chokidar.watch() — detecta novos arquivos
      upload-queue.ts       # Fila persistente de uploads pendentes
      sync-engine.ts        # Orquestrador do sync
    node-agent/             # Node Agent: heartbeat + armazenamento de chunks
      heartbeat.ts          # Envia heartbeat ao orquestrador a cada 60s
      chunk-store.ts        # Armazena/recupera chunks no filesystem local
      node-agent.ts         # Bootstrap e lifecycle do agente
    vault/                  # Vault Manager: AES-256-GCM para credenciais do membro
      vault-manager.ts      # Encrypt/decrypt vault com senha do membro
      vault-crypto.ts       # Derivacao de chave (PBKDF2 + AES-256-GCM)
    menu/                   # Application menu nativo
      app-menu.ts
    tray/                   # System tray — sync em background
      tray-manager.ts       # Icone, menu do tray, show/hide janela
    updater/                # Auto-update via GitHub Releases
      auto-updater.ts       # electron-updater: check, download, install
    windows/                # Gerenciamento de janelas BrowserWindow
      main-window.ts        # Janela principal (galeria)
      onboarding-window.ts  # Primeiro uso: configurar cluster / entrar no cluster
    index.ts                # Entry point do main process

  preload/                  # Preload scripts (Electron)
    index.ts                # contextBridge API

  renderer/                 # UI (renderer process)
    features/               # Modulos por dominio de negocio
      auth/                 # Desbloqueio de vault, login, seed phrase recovery
        components/
        hooks/
        api/
        types/
        utils/
      gallery/              # Galeria de fotos/videos, timeline, viewer, download
        components/
        hooks/
        api/
        types/
        utils/
      sync/                 # Sync Engine UI: fila de uploads, pastas monitoradas, progresso
        components/
        hooks/
        api/
        types/
        utils/
      cluster/              # Saude do cluster, nos, convites, provedores cloud (admin)
        components/
        hooks/
        api/
        types/
        utils/
      vault/                # Credenciais de provedores, tokens OAuth, senhas
        components/
        hooks/
        api/
        types/
        utils/
      settings/             # Preferencias: pasta sync, tray, notificacoes, auto-start
        components/
        hooks/
        api/
        types/
        utils/

    components/             # Componentes compartilhados
      ui/                   # Primitivos (Button, Input, Card)
      forms/                # Componentes de formulario
      layouts/              # Layouts reutilizaveis
      desktop/              # Componentes desktop-specific
        TitleBar.tsx
        SystemTray.tsx
        MenuBar.tsx

    hooks/                  # Hooks globais
    services/               # API client, IPC client
    store/                  # Estado global
    types/                  # Tipos compartilhados
    utils/                  # Utilitarios
    styles/                 # Estilos globais e tokens

  shared/                   # Codigo compartilhado entre main e renderer
    ipc-channels.ts         # Canais IPC tipados
    types/                  # Tipos compartilhados entre processos
```

> A pasta `main/` contem toda logica do main process. A pasta `renderer/` contem a UI e segue a mesma organizacao de um frontend web. A pasta `shared/` contem tipos e constantes usados em ambos os processos.

---

## Organizacao por Feature

> O projeto segue organizacao por feature (dominio) ou por tipo?

**Recomendado: por feature.** Organizar por feature (dominio de negocio) agrupa tudo que e relacionado no mesmo lugar — componentes, hooks, API, tipos. Isso reduz a necessidade de navegar entre pastas distantes e facilita a exclusao ou refatoracao de uma feature inteira.

| Feature | Descricao | Componentes Principais |
| --- | --- | --- |
| `auth` | Desbloqueio do vault local com senha, login no orquestrador, recovery via seed phrase de 12 palavras | `UnlockScreen`, `SeedPhraseInput`, `AuthGuard`, `LoginForm` |
| `gallery` | Galeria de fotos/videos em grid, timeline cronologica, viewer de midia, navegacao por album/evento, download sob demanda | `GalleryGrid`, `MediaViewer`, `TimelineBar`, `AlbumList`, `MediaCard` |
| `sync` | Interface do Sync Engine: progresso de uploads, fila de arquivos pendentes, configuracao de pastas monitoradas, placeholder files | `SyncQueue`, `FolderPicker`, `UploadProgressItem`, `SyncStatusBadge`, `SyncDashboard` |
| `cluster` | Saude do cluster, lista de nos online/offline, convite de membros, configuracao de provedores cloud — restrito ao Administrador Familiar | `ClusterHealthPanel`, `NodeCard`, `NodeStatusBadge`, `InviteForm`, `ProviderSetup`, `RecoveryPanel` |
| `vault` | Credenciais de provedores cloud (S3, R2, B2), tokens OAuth, senhas — desencriptados localmente com AES-256-GCM | `VaultItem`, `ProviderCredentialForm`, `VaultUnlockModal`, `VaultList` |
| `settings` | Preferencias do app: pasta de sync, comportamento do tray, notificacoes, tema, auto-start com o SO | `SettingsPage`, `SyncFolderList`, `NotificationToggle`, `ThemeSelector`, `AutoStartToggle` |

<!-- APPEND:features -->

<details>
<summary>Exemplo — Estrutura interna de uma feature</summary>

```
renderer/features/
  auth/
    components/
      LoginForm.tsx
      RegisterForm.tsx
      AuthGuard.tsx
    hooks/
      useAuth.ts
      useLogin.ts
    api/
      auth-api.ts
    types/
      auth.types.ts
    utils/
      token.ts
    index.ts              # Barrel export publico
```

</details>

---

## Monorepo (se aplicavel)

> O projeto utiliza monorepo? Como esta estruturado?

- [ ] Projeto unico
- [ ] Monorepo (Turborepo)
- [ ] Monorepo (Nx)
- [x] Monorepo (pnpm workspaces)

<!-- do blueprint: 00-context.md — "Monorepo com core-sdk compartilhado entre orquestrador, agentes de no e clientes" -->

```
alexandria/                   # Raiz do monorepo
  apps/
    desktop/                  # App desktop (Electron — este projeto)
    web/                      # Web client (Next.js)
    orchestrator/             # Backend NestJS (orquestrador)

  packages/
    core-sdk/                 # Criptografia, BIP-39, hashing, tipos base — compartilhado entre TODOS
    ui/                       # Design system: componentes React compartilhados entre desktop e web
    config/                   # Configs compartilhadas: ESLint, TypeScript, Tailwind, Prettier
    node-agent/               # Agente de No — pode rodar standalone (NAS/VPS) ou embutido no desktop

  pnpm-workspace.yaml
  turbo.json                  # Pipeline de build (opcional — pode usar pnpm scripts simples)
  package.json
```

| Package | Responsabilidade | Consumido por |
| --- | --- | --- |
| `core-sdk` | Criptografia AES-256-GCM, BIP-39, PBKDF2, SHA-256, tipos base (File, Chunk, Member, Node) | `desktop` (main), `orchestrator`, `node-agent` |
| `ui` | Design system Alexandria: Button, Card, Badge, Modal, GalleryGrid, MediaCard — tokens CSS compartilhados | `desktop` (renderer), `web` |
| `config` | Configs compartilhadas de ESLint, TypeScript (tsconfig base), Tailwind (tokens), Prettier | Todos os apps e packages |
| `node-agent` | Agente de No: heartbeat, armazenamento de chunks, scrubbing — importado pelo desktop/main e roda standalone em NAS/VPS | `desktop` (main process), deploy standalone |

---

## Regras de Importacao

> Quais sao as regras de importacao entre modulos?

| De | Para | Permitido? | Observacao |
| --- | --- | --- | --- |
| `renderer/features/auth` | `renderer/features/billing` | Nao | Features nao importam de outras features |
| `renderer/features/auth` | `renderer/components/ui` | Sim | Componentes compartilhados sao acessiveis |
| `renderer/features/auth` | `renderer/hooks/` | Sim | Hooks globais sao acessiveis |
| `renderer/features/auth` | `renderer/services/` | Sim | API client e IPC client sao compartilhados |
| `renderer/components/ui` | `renderer/features/auth` | Nao | Componentes compartilhados nao conhecem features |
| `renderer/*` | `main/*` | Nao | Renderer nunca importa diretamente do main process |
| `renderer/*` | `shared/*` | Sim | Tipos e constantes compartilhados sao acessiveis |
| `main/*` | `shared/*` | Sim | Tipos e constantes compartilhados sao acessiveis |

<!-- APPEND:regras-importacao -->

> Use path aliases para importacoes limpas: `@renderer/features/auth`, `@renderer/components/ui`, `@main/ipc`, `@shared/types`.

> Detalhes sobre camadas e dependencias: (ver 01-arquitetura.md)
