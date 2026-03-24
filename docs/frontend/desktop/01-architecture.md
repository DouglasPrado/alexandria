# Arquitetura do Frontend Desktop

Define a arquitetura em camadas do frontend desktop, inspirada em Clean Architecture adaptada para aplicacoes desktop com Electron / Tauri. Estabelece fronteiras claras entre UI, logica de aplicacao, dominio e infraestrutura, alem da separacao fundamental entre main process e renderer process.

> **Implementa:** [docs/blueprint/06-system-architecture.md](../blueprint/06-system-architecture.md) (componentes e deploy) e [docs/blueprint/02-architecture_principles.md](../blueprint/02-architecture_principles.md) (principios).
> **Complementa:** [docs/backend/01-architecture.md](../backend/01-architecture.md) (camadas do backend).

---

## Arquitetura de Processos

> Como a aplicacao desktop separa responsabilidades entre processos?

```
Main Process (Node.js / Rust)
  ├── Window Management
  ├── Application Menu
  ├── System Tray
  ├── Auto-Updater
  ├── File System Access
  ├── Native APIs
  └── IPC Handlers
        ↕ IPC (Inter-Process Communication)
Renderer Process (Chromium / WebView)
  ├── UI Layer (Pages, Layouts, Components)
  ├── Application Layer (Hooks, State)
  ├── Domain Layer (Models, Rules)
  └── Infrastructure Layer (API Client, IPC Client)
```

| Processo | Responsabilidade | Acesso | Tecnologia |
| --- | --- | --- | --- |
| Main Process | Gerenciamento de janelas, menus, tray, auto-update, acesso ao file system | Node.js APIs completas / Rust APIs | Electron main / Tauri Rust backend |
| Renderer Process | Interface do usuario, interacao, renderizacao | APIs do browser (sandboxed) | React / Vue / Svelte no Chromium / WebView |
| Preload Script (Electron) | Ponte segura entre main e renderer | contextBridge APIs expostas | Script isolado com acesso limitado |

---

## Camadas Arquiteturais (Renderer)

> Como o renderer process esta organizado em camadas? Qual a responsabilidade de cada uma?

```
UI Layer (Pages, Layouts, Components)
        ↓
Application Layer (Hooks, Orchestration, State)
        ↓
Domain Layer (Models, Business Rules, Interfaces)
        ↓
Infrastructure Layer (API Client, IPC Client, Storage)
```

| Camada | Responsabilidade | Pode acessar | NAO pode acessar |
| --- | --- | --- | --- |
| UI Layer | Renderizacao, interacao visual, layout | Application, Domain | Infrastructure diretamente |
| Application Layer | Orquestracao, hooks de negocio, estado | Domain, Infrastructure | — |
| Domain Layer | Modelos, regras de negocio, interfaces | Nenhuma outra camada | UI, Application, Infrastructure |
| Infrastructure Layer | API client, IPC client, storage, analytics | Domain (implementa interfaces) | UI, Application |

<details>
<summary>Exemplo — Responsabilidade de cada camada</summary>

- **UI Layer:** `UserProfilePage` renderiza dados do usuario usando componentes visuais. Nao sabe de onde vem os dados.
- **Application Layer:** `useUserProfile(id)` orquestra o fetch via IPC ou API, trata loading/error e retorna dados prontos para a UI.
- **Domain Layer:** `User` define o modelo, `canEditProfile(user)` contem a regra de negocio.
- **Infrastructure Layer:** `userApi.getById(id)` faz o fetch HTTP real ou envia mensagem IPC ao main process.

</details>

---

## Comunicacao IPC

> Como main process e renderer process se comunicam?

| Direcao | Metodo | Uso Tipico |
| --- | --- | --- |
| Renderer → Main | `ipcRenderer.invoke()` / Tauri `invoke()` | Solicitar dados, executar acoes no OS |
| Main → Renderer | `webContents.send()` / Tauri events | Notificar mudancas, push de dados |
| Bidirecional | Event emitters tipados | Sincronizacao de estado em tempo real |

> Todas as mensagens IPC devem ser tipadas e validadas em ambos os lados.

<details>
<summary>Exemplo — IPC tipado (Electron)</summary>

```typescript
// shared/ipc-channels.ts — canais Alexandria
export const IPC_CHANNELS = {
  // Auth / Vault
  VAULT_UNLOCK:       'vault:unlock',       // renderer → main: desbloqueia vault com senha
  VAULT_LOCK:         'vault:lock',          // renderer → main: trava vault

  // Sync Engine
  SYNC_START:         'sync:start',          // renderer → main: inicia sync de pasta
  SYNC_STOP:          'sync:stop',           // renderer → main: para sync
  SYNC_PROGRESS:      'sync:progress',       // main → renderer: push progresso de upload
  SYNC_QUEUE_UPDATE:  'sync:queue-update',   // main → renderer: push fila atualizada

  // Node Agent
  NODE_STATUS:        'node:status',         // main → renderer: push status heartbeat
  NODE_CHUNK_PUT:     'node:chunk-put',      // main: armazena chunk localmente

  // Gallery
  FILE_LIST:          'file:list',           // renderer → main: lista arquivos do cluster
  FILE_DOWNLOAD:      'file:download',       // renderer → main: baixa arquivo do cluster

  // Cluster (admin)
  CLUSTER_HEALTH:     'cluster:health',      // renderer → main: saude do cluster

  // App
  APP_UPDATE_AVAILABLE: 'app:update-available', // main → renderer: nova versao disponivel
} as const;

// main/ipc/sync-handlers.ts
ipcMain.handle(IPC_CHANNELS.SYNC_START, async (_event, folderPath: string) => {
  return await syncEngine.watchFolder(folderPath);
});

// main emite progresso para o renderer
syncEngine.on('progress', (item: SyncProgressItem) => {
  mainWindow.webContents.send(IPC_CHANNELS.SYNC_PROGRESS, item);
});

// renderer/services/ipc-client.ts
export const ipcClient = {
  startSync: (folderPath: string) =>
    window.electronAPI.invoke(IPC_CHANNELS.SYNC_START, folderPath),
  onSyncProgress: (cb: (item: SyncProgressItem) => void) =>
    window.electronAPI.on(IPC_CHANNELS.SYNC_PROGRESS, cb),
};
```

</details>

---

## Regras de Dependencia

> Quais sao as regras de importacao entre camadas?

- UI Layer pode importar de Application e Domain
- Application Layer pode importar de Domain e Infrastructure
- Domain Layer NAO importa de nenhuma outra camada
- Infrastructure Layer implementa interfaces definidas em Domain
- Renderer NUNCA importa diretamente de modulos Node.js — sempre via IPC/preload

> A regra de ouro: dependencias apontam sempre para dentro (em direcao ao Domain). Nenhuma camada interna conhece camadas externas.

---

## Fronteiras de Dominio

> O frontend desktop esta organizado por dominio de negocio (features)?

| Dominio | Responsabilidade | Componentes Proprios | Estado Proprio |
| --- | --- | --- | --- |
| `auth` | Desbloqueio do vault local, login no orquestrador, recovery via seed phrase de 12 palavras | `UnlockScreen`, `SeedPhraseInput`, `AuthGuard` | `authStore` |
| `gallery` | Galeria de fotos/videos, timeline cronologica, navegacao por album/evento, download sob demanda | `GalleryGrid`, `MediaViewer`, `TimelineBar`, `AlbumList` | `galleryStore` |
| `sync` | Progresso do Sync Engine, fila de uploads, configuracao de pastas monitoradas, status de cada arquivo | `SyncQueue`, `FolderPicker`, `UploadProgressItem`, `SyncStatusBadge` | `syncStore` |
| `cluster` | Saude do cluster, nos online/offline, convite de membros, configuracao de provedores cloud (admin) | `ClusterHealthPanel`, `NodeCard`, `InviteForm`, `ProviderSetup` | `clusterStore` |
| `vault` | Credenciais de provedores cloud, tokens OAuth, senhas — desencriptados localmente com senha do membro | `VaultItem`, `ProviderCredentialForm`, `VaultUnlockModal` | `vaultStore` |
| `settings` | Preferencias do app: pasta de sync, comportamento do tray, notificacoes, tema, auto-start | `SettingsPage`, `SyncFolderList`, `NotificationToggle` | `settingsStore` |

<!-- APPEND:dominios -->

> Cada dominio possui: `components/`, `hooks/`, `api/`, `types/`, `services/`

> Detalhes da estrutura de pastas: (ver 02-project-structure.md)

---

## Comunicacao entre Dominios

> Como features diferentes se comunicam sem acoplamento direto?

- Features NAO importam diretamente umas das outras
- Comunicacao via Event Bus leve ou estado global compartilhado
- Componentes compartilhados vivem fora das features, em `components/`

> Detalhes sobre Event Bus: (ver 05-state.md)

---

## Diagrama de Arquitetura

> Diagrama: [desktop-architecture.mmd](../diagrams/frontend/desktop-architecture.mmd)

O diagrama abaixo mostra a separacao entre Main Process e Renderer Process, os modulos internos de cada processo, e como os dominios do renderer se conectam ao main via IPC.

<!-- do blueprint: 06-system-architecture.md — Agente de No e Sync Engine rodam nos dispositivos; 00-context.md — Sync Engine detecta novos arquivos e os envia ao cluster -->

```mermaid
graph TD
    Main["Main Process (Node.js)"] <-->|"IPC (tipado/validado)"| Renderer[Renderer Process]

    subgraph Main Process
        SyncEngine["Sync Engine\n(chokidar)"]
        NodeAgent["Node Agent\n(heartbeat, chunks)"]
        VaultMgr["Vault Manager\n(AES-256-GCM)"]
        IPCHandlers[IPC Handlers]
        AutoUpdater[Auto-Updater]
        TrayMgr[System Tray]
        WindowMgr[Window Manager]
    end

    subgraph Renderer Process
        UI[UI Layer]
        AppLayer[Application Layer]
        DomainLayer[Domain Layer]
        InfraLayer[Infrastructure Layer]
    end

    subgraph Features
        Auth["auth/\n(unlock, seed recovery)"]
        Gallery["gallery/\n(timeline, viewer)"]
        Sync["sync/\n(queue, progress)"]
        Cluster["cluster/\n(health, nos, convites)"]
        Vault["vault/\n(credenciais)"]
        Settings["settings/\n(preferencias)"]
    end

    UI --> Features
    UI --> AppLayer
    AppLayer --> DomainLayer
    AppLayer --> InfraLayer
    InfraLayer -.->|"implementa interfaces"| DomainLayer

    InfraLayer -->|"ipcRenderer.invoke()"| IPCHandlers
    IPCHandlers --> SyncEngine
    IPCHandlers --> NodeAgent
    IPCHandlers --> VaultMgr

    SyncEngine -->|"ipcMain push events"| Renderer
    NodeAgent -->|"status events"| Renderer

    NodeAgent -->|"HTTPS/REST"| Orchestrator[(Orquestrador)]
```

> Mantenha o diagrama atualizado conforme a arquitetura evolui. (ver 00-frontend-vision.md para contexto geral)
