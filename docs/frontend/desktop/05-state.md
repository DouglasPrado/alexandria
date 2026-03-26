# Gerenciamento de Estado

Define a estrategia de gerenciamento de estado separando claramente os tipos de estado, as ferramentas responsaveis por cada um e os anti-patterns a evitar. Em aplicacoes desktop, o estado inclui tambem persistencia em disco e sincronizacao entre main process e renderer process via IPC.

> **Implementa:** [docs/blueprint/09-state-models.md](../blueprint/09-state-models.md) (maquinas de estado).
> **Conectado a:** [docs/shared/event-mapping.md](../shared/event-mapping.md) (eventos backend que atualizam stores).

---

## Tipos de Estado

> Como classificamos e onde armazenamos cada tipo de dado?

| Tipo            | Descricao                                  | Ferramenta                   | Exemplo                                         |
| --------------- | ------------------------------------------ | ---------------------------- | ----------------------------------------------- |
| UI State        | Estado visual local de um componente       | React useState/useReducer    | Modal aberto, sidebar collapsed, input value    |
| Server State    | Dados vindos do backend                    | TanStack Query               | Lista de usuarios, detalhes de arquivo          |
| Global State    | Dados compartilhados entre features        | Zustand                      | Usuario autenticado, preferencias, tema         |
| Domain State    | Estado de dominio de negocio               | Zustand (store por dominio)  | authStore, billingStore                         |
| Persisted State | Estado salvo em disco (sobrevive reinicio) | electron-store / Tauri store | Preferencias do usuario, tokens, window bounds  |
| IPC State       | Estado sincronizado entre main e renderer  | IPC events + Zustand         | Status de update, estado de conexao, tray state |

> Regra: use o tipo mais simples que resolve o problema. Nao coloque em global state o que pode ser UI state local.

---

## Server State (Data Fetching)

> Como gerenciamos dados vindos do backend?

- **Ferramenta:** TanStack Query v5
- **Beneficios:** cache automatico, revalidacao, sincronizacao, loading/error states
- **Padrao:** queries em `renderer/features/xxx/api/` + hooks em `renderer/features/xxx/hooks/`

<!-- do blueprint: desktop/00-frontend-vision.md — TanStack Query v5; 02-architecture_principles.md — Embrace Failure, retry com backoff exponencial -->

| Configuracao            | Valor                                | Observacao                                                                           |
| ----------------------- | ------------------------------------ | ------------------------------------------------------------------------------------ |
| Stale Time              | 5 minutos (padrao)                   | 1 minuto para `cluster/health` e `node/status` — dados criticos de saude             |
| Cache Time              | 30 minutos                           | Suficiente para navegacao entre features sem refetch desnecessario                   |
| Retry                   | 3 tentativas com backoff exponencial | Alinhado com principio "Embrace Failure" do blueprint                                |
| Refetch on Window Focus | Sim                                  | Importante: user pode ter estado fora do app e cluster pode ter mudado               |
| Refetch on Reconnect    | Sim                                  | Dispositivos desktop perdem/recuperam rede; queries desatualizadas sao re-executadas |

> **Nota Desktop:** As queries nao chamam o orquestrador diretamente do renderer. Elas passam pelo main process via IPC. O `queryFn` chama `window.electronAPI.invoke(channel, params)`, e o main process executa o fetch HTTP real.

```typescript
// renderer/features/cluster/api/cluster-api.ts
export const clusterQueries = {
  health: () =>
    queryOptions({
      queryKey: ['cluster', 'health'],
      queryFn: () => window.electronAPI.invoke('cluster:health'),
      staleTime: 1 * 60 * 1000, // 1 minuto — dado critico
      refetchInterval: 30 * 1000, // polling a cada 30s quando janela ativa
    }),
  nodes: () =>
    queryOptions({
      queryKey: ['cluster', 'nodes'],
      queryFn: () => window.electronAPI.invoke('cluster:nodes-list'),
      staleTime: 5 * 60 * 1000,
    }),
};
```

> Detalhes completos sobre data fetching: (ver 06-data-layer.md)

---

## Persisted State (Disco)

> Como persistimos estado no disco do usuario?

| Ferramenta                 | Uso                                 | Onde Armazena          |
| -------------------------- | ----------------------------------- | ---------------------- |
| electron-store (Electron)  | Preferencias, tokens, configuracoes | `userData/config.json` |
| Tauri store plugin (Tauri) | Preferencias, tokens, configuracoes | App data directory     |
| SQLite (opcional)          | Dados estruturados, cache offline   | `userData/app.db`      |

<!-- do blueprint: desktop/00-frontend-vision.md — electron-store para persistencia; 02-architecture_principles.md — Zero-Knowledge (dados sensiveis nunca em texto puro no disco) -->

| Dado Persistido                       | Store (electron-store key) | Encriptado?                       | Quando Sincroniza                  |
| ------------------------------------- | -------------------------- | --------------------------------- | ---------------------------------- |
| JWT token de autenticacao             | `auth.token`               | Sim (`safeStorage.encryptString`) | Login bem-sucedido / token refresh |
| Tema selecionado pelo usuario         | `settings.theme`           | Nao                               | Sempre que usuario muda tema       |
| Pastas monitoradas pelo Sync Engine   | `sync.watchedFolders[]`    | Nao                               | Adicionar / remover pasta          |
| Posicao e tamanho da janela principal | `window.bounds`            | Nao                               | Ao fechar / minimizar janela       |
| Preferencia de notificacoes           | `settings.notifications`   | Nao                               | Sempre que usuario altera          |
| Auto-start com o sistema operacional  | `settings.autoStart`       | Nao                               | Sempre que usuario altera          |

> **O vault do membro NAO e persistido aqui.** O vault (credenciais de provedores, tokens OAuth) e um arquivo AES-256-GCM separado, gerenciado pelo `VaultManager` no main process. A senha do vault nunca e salva em nenhum storage.

> **Dados sensiveis seguros:** JWT usa `safeStorage.encryptString()` do Electron (OS keychain no macOS, DPAPI no Windows, libsecret no Linux) — nunca armazenado em texto puro.

<details>
<summary>Exemplo — electron-store com Zustand</summary>

```typescript
import Store from 'electron-store';

const electronStore = new Store({
  encryptionKey: process.env.STORE_ENCRYPTION_KEY,
});

// No main process — IPC handler para ler/escrever
ipcMain.handle('store:get', (_, key: string) => electronStore.get(key));
ipcMain.handle('store:set', (_, key: string, value: unknown) => electronStore.set(key, value));

// No renderer — Zustand com persistencia via IPC
const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: 'system',
      language: 'pt-BR',
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'preferences',
      storage: createIPCStorage(), // Custom storage que usa IPC
    },
  ),
);
```

</details>

---

## Sincronizacao Main ↔ Renderer

> Como mantemos o estado sincronizado entre processos?

| Direcao         | Mecanismo                       | Exemplo                                                |
| --------------- | ------------------------------- | ------------------------------------------------------ |
| Renderer → Main | `ipcRenderer.invoke()`          | Salvar preferencias, solicitar acao do OS              |
| Main → Renderer | `webContents.send()`            | Notificar update disponivel, mudanca de estado de rede |
| Bidirecional    | Event subscription + state sync | Sincronizar tray state com UI                          |

```typescript
// Main process — emite evento de update
autoUpdater.on('update-available', (info) => {
  mainWindow.webContents.send('app:update-available', info);
});

// Renderer — escuta e atualiza store
window.electronAPI.on('app:update-available', (info) => {
  useAppStore.getState().setUpdateAvailable(info);
});
```

---

## Global State

> Quais dados precisam ser globais?

<!-- do blueprint: desktop/01-architecture.md — 6 features: auth, gallery, sync, cluster, vault, settings -->
<!-- do blueprint: 09-state-models.md — estados de File (processing/ready/error/corrupted) e Node (online/suspect/lost/draining/disconnected) -->

| Store           | Dados                                                                                         | Persistencia                                     | Quando Inicializa                         |
| --------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------- |
| `authStore`     | `isVaultUnlocked`, `member` (nome, role, clusterId), `token` (JWT)                            | Sim — token via `safeStorage`                    | App start (token) + vault unlock (member) |
| `galleryStore`  | `files[]`, `selectedFile`, `viewMode` (grid/timeline), `timelinePosition`, `activeAlbum`      | Nao                                              | Gallery feature mount                     |
| `syncStore`     | `engineStatus` (idle/syncing/paused/error), `queue[]` (uploads pendentes), `watchedFolders[]` | Parcial — `watchedFolders` em disco              | App start + IPC events do Sync Engine     |
| `clusterStore`  | `health` (nodes total/online/lost), `nodes[]` (com estado FSM), `alerts[]`                    | Nao                                              | App start + polling 30s                   |
| `vaultStore`    | `items[]` (credenciais em memoria), `isUnlocked`, `editingItem`                               | Nao — vault em memoria apenas; limpo ao bloquear | Vault unlock; limpo no vault:locked       |
| `settingsStore` | `theme`, `notifications`, `autoStart`, `syncFolders[]`                                        | Sim — disco (nao encriptado)                     | App start (lido do electron-store)        |
| `appStore`      | `updateInfo` (versao disponivel), `isOnline`, `mainWindowVisible`                             | Nao                                              | Main process via IPC events               |

<!-- APPEND:stores -->

<details>
<summary>Exemplo — authStore com Zustand e persistencia em disco</summary>

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginDTO) => Promise<void>;
  logout: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: async (credentials) => {
        const { user, token } = await authApi.login(credentials);
        set({ user, token, isAuthenticated: true });
      },
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      storage: createIPCStorage(), // Persiste em disco via IPC (electron-store)
    },
  ),
);
```

</details>

---

## Event Bus (Comunicacao entre Dominios)

> Como dominios diferentes se comunicam sem acoplamento direto?

- **Padrao:** Event Bus leve para comunicacao entre features
- **Eventos tipicos:** `user:login`, `file:uploaded`, `subscription:updated`

<!-- do blueprint: desktop/01-architecture.md — IPC channels; 09-state-models.md — transicoes de File e Node -->
<!-- Origem dos eventos: IPC (main→renderer) ou Zustand subscriptions (renderer interno) -->

| Evento                 | Origem              | Emissor                        | Ouvinte(s)                                                | Payload                                  |
| ---------------------- | ------------------- | ------------------------------ | --------------------------------------------------------- | ---------------------------------------- |
| `vault:unlocked`       | Renderer (Zustand)  | `authStore`                    | `galleryStore`, `syncStore`, `clusterStore`, `vaultStore` | `{ memberId, role }`                     |
| `vault:locked`         | Renderer (Zustand)  | `authStore`                    | `galleryStore`, `vaultStore`                              | — (limpa dados sensiveis em memoria)     |
| `sync:progress`        | IPC (main→renderer) | Sync Engine                    | `syncStore`                                               | `{ fileId, fileName, progress, status }` |
| `sync:queue-update`    | IPC (main→renderer) | Sync Engine                    | `syncStore`                                               | `{ queue: UploadQueueItem[] }`           |
| `node:status-changed`  | IPC (main→renderer) | Node Agent                     | `clusterStore`                                            | `{ nodeId, status: NodeStatus }`         |
| `file:ready`           | IPC (main→renderer) | Node Agent (manifest recebido) | `galleryStore`                                            | `{ fileId, previewUrl, metadata }`       |
| `cluster:alert-fired`  | IPC (main→renderer) | Scheduler (via orquestrador)   | `clusterStore`, `appStore`                                | `{ alertId, severity, message }`         |
| `app:update-available` | IPC (main→renderer) | Auto-Updater                   | `appStore`                                                | `{ version, releaseNotes }`              |
| `app:online-status`    | IPC (main→renderer) | Main (net.isOnline)            | `appStore`                                                | `{ isOnline: boolean }`                  |

<!-- APPEND:eventos -->

> Isso evita dependencia direta entre dominios/features. Cada feature emite eventos sem saber quem escuta.

---

## Anti-patterns

> O que evitar no gerenciamento de estado?

| Anti-pattern                                 | Por que evitar                              | Alternativa                            |
| -------------------------------------------- | ------------------------------------------- | -------------------------------------- |
| Colocar server state em global store         | Duplica cache, perde revalidacao automatica | Use TanStack Query                     |
| Estado global para dados locais              | Complexidade desnecessaria, re-renders      | Use useState/useReducer                |
| Prop drilling alem de 2 niveis               | Codigo fragil, dificil de manter            | Use contexto ou store                  |
| Sincronizar manualmente server/local state   | Bugs de sincronizacao, dados stale          | Deixe TanStack Query gerenciar         |
| Store monolitica gigante                     | Dificil de testar, re-renders excessivos    | Stores pequenas por dominio            |
| Acessar Node.js APIs diretamente no renderer | Falha de seguranca, bypassa sandbox         | Use IPC para toda comunicacao com main |
| Persistir estado sensivel sem encriptacao    | Dados expostos no disco do usuario          | Use safeStorage / encryptionKey        |

> Arquitetura de estado: (ver 01-arquitetura.md para contexto das camadas)
