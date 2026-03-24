# Gerenciamento de Estado

Define a estrategia de gerenciamento de estado separando claramente os tipos de estado, as ferramentas responsaveis por cada um e os anti-patterns a evitar. Em aplicacoes desktop, o estado inclui tambem persistencia em disco e sincronizacao entre main process e renderer process via IPC.

> **Implementa:** [docs/blueprint/09-state-models.md](../blueprint/09-state-models.md) (maquinas de estado).
> **Conectado a:** [docs/shared/event-mapping.md](../shared/event-mapping.md) (eventos backend que atualizam stores).

---

## Tipos de Estado

> Como classificamos e onde armazenamos cada tipo de dado?

| Tipo | Descricao | Ferramenta | Exemplo |
| --- | --- | --- | --- |
| UI State | Estado visual local de um componente | React useState/useReducer | Modal aberto, sidebar collapsed, input value |
| Server State | Dados vindos do backend | TanStack Query | Lista de usuarios, detalhes de arquivo |
| Global State | Dados compartilhados entre features | Zustand | Usuario autenticado, preferencias, tema |
| Domain State | Estado de dominio de negocio | Zustand (store por dominio) | authStore, billingStore |
| Persisted State | Estado salvo em disco (sobrevive reinicio) | electron-store / Tauri store | Preferencias do usuario, tokens, window bounds |
| IPC State | Estado sincronizado entre main e renderer | IPC events + Zustand | Status de update, estado de conexao, tray state |

> Regra: use o tipo mais simples que resolve o problema. Nao coloque em global state o que pode ser UI state local.

---

## Server State (Data Fetching)

> Como gerenciamos dados vindos do backend?

- **Ferramenta:** {{TanStack Query / SWR / outro}}
- **Beneficios:** cache automatico, revalidacao, sincronizacao, loading/error states
- **Padrao:** queries em `renderer/features/xxx/api/` + hooks em `renderer/features/xxx/hooks/`

| Configuracao | Valor |
| --- | --- |
| Stale Time | {{5 minutos / conforme dominio}} |
| Cache Time | {{30 minutos}} |
| Retry | {{3 tentativas com backoff exponencial}} |
| Refetch on Window Focus | {{Sim / Nao}} |

> Detalhes completos sobre data fetching: (ver 06-data-layer.md)

---

## Persisted State (Disco)

> Como persistimos estado no disco do usuario?

| Ferramenta | Uso | Onde Armazena |
| --- | --- | --- |
| electron-store (Electron) | Preferencias, tokens, configuracoes | `userData/config.json` |
| Tauri store plugin (Tauri) | Preferencias, tokens, configuracoes | App data directory |
| SQLite (opcional) | Dados estruturados, cache offline | `userData/app.db` |

| Dado Persistido | Store | Encriptado? | Quando Sincroniza |
| --- | --- | --- | --- |
| {{Preferencias do usuario}} | {{preferencesStore}} | {{Nao}} | {{Na inicializacao + a cada mudanca}} |
| {{Token de autenticacao}} | {{authStore}} | {{Sim (safeStorage)}} | {{Login / Refresh}} |
| {{Window bounds}} | {{windowStore}} | {{Nao}} | {{Ao fechar janela}} |
| {{Outro dado}} | {{Store}} | {{Sim/Nao}} | {{Quando}} |

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
    }
  )
);
```

</details>

---

## Sincronizacao Main ↔ Renderer

> Como mantemos o estado sincronizado entre processos?

| Direcao | Mecanismo | Exemplo |
| --- | --- | --- |
| Renderer → Main | `ipcRenderer.invoke()` | Salvar preferencias, solicitar acao do OS |
| Main → Renderer | `webContents.send()` | Notificar update disponivel, mudanca de estado de rede |
| Bidirecional | Event subscription + state sync | Sincronizar tray state com UI |

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

| Store | Dados | Persistencia (Sim/Nao) | Quando Inicializa |
| --- | --- | --- | --- |
| {{authStore}} | {{Usuario logado, token, permissoes}} | {{Sim (disco, encriptado)}} | {{Login / Inicializacao do app}} |
| {{preferencesStore}} | {{Tema, idioma, sidebar state}} | {{Sim (disco)}} | {{Inicializacao do app}} |
| {{uiStore}} | {{Notificacoes, loading global}} | {{Nao}} | {{Montagem do app}} |
| {{appStore}} | {{Status de update, versao, estado de conexao}} | {{Nao}} | {{Inicializacao do main process}} |
| {{Outra store}} | {{Dados}} | {{Sim/Nao}} | {{Quando}} |

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
    }
  )
);
```

</details>

---

## Event Bus (Comunicacao entre Dominios)

> Como dominios diferentes se comunicam sem acoplamento direto?

- **Padrao:** Event Bus leve para comunicacao entre features
- **Eventos tipicos:** `user:login`, `file:uploaded`, `subscription:updated`

| Evento | Emissor | Ouvinte(s) | Payload |
| --- | --- | --- | --- |
| {{user:login}} | {{auth}} | {{dashboard, analytics}} | {{userId, role}} |
| {{file:uploaded}} | {{storage}} | {{dashboard, notifications}} | {{fileId, fileName, size}} |
| {{subscription:updated}} | {{billing}} | {{dashboard, storage}} | {{planId, limits}} |
| {{Outro evento}} | {{Emissor}} | {{Ouvinte(s)}} | {{Payload}} |

<!-- APPEND:eventos -->

> Isso evita dependencia direta entre dominios/features. Cada feature emite eventos sem saber quem escuta.

---

## Anti-patterns

> O que evitar no gerenciamento de estado?

| Anti-pattern | Por que evitar | Alternativa |
| --- | --- | --- |
| Colocar server state em global store | Duplica cache, perde revalidacao automatica | Use TanStack Query |
| Estado global para dados locais | Complexidade desnecessaria, re-renders | Use useState/useReducer |
| Prop drilling alem de 2 niveis | Codigo fragil, dificil de manter | Use contexto ou store |
| Sincronizar manualmente server/local state | Bugs de sincronizacao, dados stale | Deixe TanStack Query gerenciar |
| Store monolitica gigante | Dificil de testar, re-renders excessivos | Stores pequenas por dominio |
| Acessar Node.js APIs diretamente no renderer | Falha de seguranca, bypassa sandbox | Use IPC para toda comunicacao com main |
| Persistir estado sensivel sem encriptacao | Dados expostos no disco do usuario | Use safeStorage / encryptionKey |

> Arquitetura de estado: (ver 01-arquitetura.md para contexto das camadas)
