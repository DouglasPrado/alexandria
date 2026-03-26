# Gerenciamento de Estado

Define a estrategia de gerenciamento de estado separando claramente os tipos de estado, as ferramentas responsaveis por cada um e os anti-patterns a evitar. A separacao correta de estado e uma das decisoes arquiteturais mais importantes do app mobile — estado mal gerenciado e a principal causa de bugs e complexidade desnecessaria.

> **Implementa:** [docs/blueprint/09-state-models.md](../blueprint/09-state-models.md) (maquinas de estado).
> **Conectado a:** [docs/shared/event-mapping.md](../shared/event-mapping.md) (eventos backend que atualizam stores).

---

## Tipos de Estado

> Como classificamos e onde armazenamos cada tipo de dado?

| Tipo                | Descricao                            | Ferramenta                     | Exemplo                                    |
| ------------------- | ------------------------------------ | ------------------------------ | ------------------------------------------ |
| UI State            | Estado visual local de um componente | React useState/useReducer      | BottomSheet aberto, input value, tab ativa |
| Server State        | Dados vindos do backend              | TanStack Query                 | Lista de usuarios, detalhes de arquivo     |
| Global State        | Dados compartilhados entre features  | Zustand                        | Usuario autenticado, preferencias, tema    |
| Domain State        | Estado de dominio de negocio         | Zustand (store por dominio)    | authStore, billingStore                    |
| Navigation State    | Estado da navegacao e parametros     | Expo Router / React Navigation | Tela atual, params, deep link state        |
| App Lifecycle State | Estado do ciclo de vida do app       | AppState API + Zustand         | Foreground/background, tempo em background |

> Regra: use o tipo mais simples que resolve o problema. Nao coloque em global state o que pode ser UI state local.

---

## Server State (Data Fetching)

> Como gerenciamos dados vindos do backend?

<!-- do blueprint: mobile/00-frontend-vision.md (TanStack Query v5), shared/06-data-layer.md (hooks e stale times) -->

- **Ferramenta:** TanStack Query v5
- **Beneficios:** cache automatico, revalidacao, sincronizacao, loading/error states, offline support nativo
- **Padrao:** queries em `features/xxx/api/` + hooks em `features/xxx/hooks/`

| Configuracao         | Valor                                                                             |
| -------------------- | --------------------------------------------------------------------------------- |
| Stale Time           | Por dominio — veja tabela abaixo                                                  |
| Cache Time (gcTime)  | 5-10 min conforme dominio                                                         |
| Retry                | 3 tentativas com backoff exponencial (1s, 2s, 4s); apenas GET e erros de rede/5xx |
| Refetch on App Focus | Sim — `refetchOnWindowFocus` ativo (equivalente a foreground no mobile)           |
| Refetch on Reconnect | Sim — `onlineManager` do TanStack Query detecta reconexao via NetInfo             |

**Stale Times por dominio:**

| Dominio             | staleTime | gcTime | Polling               | Justificativa                                               |
| ------------------- | --------- | ------ | --------------------- | ----------------------------------------------------------- |
| `gallery` (lista)   | 30s       | 5min   | —                     | Novos arquivos aparecem apos upload; polling nao necessario |
| `gallery` (detalhe) | 30s       | 5min   | 3s (se `processing`)  | Acompanhar pipeline de otimizacao ate status `ready`        |
| `cluster`           | 60s       | 10min  | —                     | Dados do cluster mudam raramente                            |
| `nodes`             | 30s       | 5min   | —                     | Heartbeat via servidor; status muda com pouca frequencia    |
| `alerts`            | 10s       | 2min   | —                     | Alertas precisam de visibilidade rapida                     |
| `members`           | 60s       | 10min  | —                     | Membros mudam raramente                                     |
| `recovery`          | 0         | 0      | 5s (durante recovery) | Sem cache; sempre fresco durante processo critico           |

> Detalhes completos sobre data fetching: (ver 06-data-layer.md)

---

## Global State

> Quais dados precisam ser globais?

<!-- do blueprint: 09-state-models.md (estados de File, Node, Cluster, Alert), mobile/01-architecture.md (dominios) -->

| Store               | Dados                                                                                           | Persistencia                                   | Quando Inicializa                                                             |
| ------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------- |
| `authStore`         | `member` (id, name, role), `token` JWT, `isAuthenticated`, `vaultUnlocked`, `clusterId`         | Sim — `expo-secure-store` (token + memberId)   | Cold start (restoreSession) / Login                                           |
| `uploadStore`       | `queue: UploadItem[]` (arquivos pendentes, em progresso, concluidos), `syncEnabled`, `wifiOnly` | Sim — SQLite (queue persistida entre restarts) | Montagem do app; Sync Engine carrega queue ao iniciar                         |
| `settingsStore`     | `theme` (light/dark/system), `notificationsEnabled`, `syncFrequency`, `spaceReleaseThreshold`   | Sim — `expo-secure-store`                      | Montagem do app (antes de renderizar RootLayout)                              |
| `galleryStore`      | `cursor` (paginacao), `activeFilter` (data, tipo), `selectedItems` (multi-select)               | Nao                                            | Montagem de GalleryScreen                                                     |
| `clusterStore`      | `cluster: ClusterDTO                                                                            | null`, `members: MemberDTO[]`                  | Nao — server state via TanStack Query; store guarda sele&ccedil;ao de cluster | Ao autenticar e carregar cluster |
| `alertsStore`       | `unreadCount: number`                                                                           | Nao                                            | Poll periodico via `useAlerts` (10s staleTime); badge no TabBar               |
| `appLifecycleStore` | `appState` (foreground/background), `lastBackgroundAt`, `isOnline`                              | Nao                                            | Montagem do app (`AppState.addEventListener`)                                 |

<!-- APPEND:stores -->

<details>
<summary>Exemplo — authStore com Zustand + SecureStore</summary>

```typescript
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginDTO) => Promise<void>;
  logout: () => void;
  restoreSession: () => Promise<void>;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: async (credentials) => {
        const { user, token } = await authApi.login(credentials);
        await SecureStore.setItemAsync('auth-token', token);
        set({ user, token, isAuthenticated: true });
      },
      logout: async () => {
        await SecureStore.deleteItemAsync('auth-token');
        set({ user: null, token: null, isAuthenticated: false });
      },
      restoreSession: async () => {
        const token = await SecureStore.getItemAsync('auth-token');
        if (token) {
          const user = await authApi.me(token);
          set({ user, token, isAuthenticated: true });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => ({
        getItem: SecureStore.getItemAsync,
        setItem: SecureStore.setItemAsync,
        removeItem: SecureStore.deleteItemAsync,
      })),
    },
  ),
);
```

</details>

---

## App Lifecycle e Estado

> Como o app gerencia estado durante transicoes de ciclo de vida?

| Evento                              | Acao                                 | Implementacao                         |
| ----------------------------------- | ------------------------------------ | ------------------------------------- |
| App vai para background             | Salvar estado critico, pausar timers | `AppState.addEventListener('change')` |
| App volta para foreground           | Revalidar dados, verificar sessao    | Refetch queries, check token expiry   |
| App fechado e reaberto (cold start) | Restaurar sessao, hidratar stores    | `restoreSession()` no root layout     |
| Perda de conexao                    | Modo offline, queue de acoes         | NetInfo + TanStack Query offline      |
| Retorno de conexao                  | Sincronizar queue, revalidar         | `onlineManager` do TanStack Query     |

---

## Event Bus (Comunicacao entre Dominios)

> Como dominios diferentes se comunicam sem acoplamento direto?

- **Padrao:** Event Bus leve para comunicacao entre features
- **Eventos tipicos:** `user:login`, `file:uploaded`, `subscription:updated`

<!-- do blueprint: 09-state-models.md (transicoes: File, Node, Alert, Cluster), mobile/01-architecture.md (comunicacao entre dominios) -->

| Evento                    | Emissor             | Ouvinte(s)                    | Payload                                                       |
| ------------------------- | ------------------- | ----------------------------- | ------------------------------------------------------------- |
| `member:authenticated`    | `auth`              | `cluster`, `upload`, `alerts` | `{ memberId, role, clusterId }`                               |
| `member:logout`           | `auth`              | Todos os dominios             | `{}` — limpar stores                                          |
| `file:upload:queued`      | `upload`            | `gallery`                     | `{ fileId, name, mediaType, previewUri }`                     |
| `file:upload:completed`   | `upload`            | `gallery`, `alerts`           | `{ fileId, optimizedSize, replicaCount }`                     |
| `file:upload:failed`      | `upload`            | `alerts`                      | `{ fileId, name, errorCode }`                                 |
| `file:status:changed`     | `gallery`           | `upload`, `alerts`            | `{ fileId, oldStatus, newStatus }` — ex: `processing → ready` |
| `space:release:confirmed` | `upload`            | `gallery`                     | `{ freedBytes, fileIds }` — thumbnails substituem originais   |
| `node:status:changed`     | `nodes`             | `alerts`, `cluster`           | `{ nodeId, oldStatus, newStatus }` — ex: `online → suspect`   |
| `cluster:alert:new`       | `alerts`            | `alertsStore` (unreadCount++) | `{ alertId, type, severity }`                                 |
| `sync:engine:started`     | `upload`            | `appLifecycleStore`           | `{ queueSize }`                                               |
| `network:reconnected`     | `appLifecycleStore` | `upload` (flush queue)        | `{}`                                                          |

<!-- APPEND:eventos -->

> Isso evita dependencia direta entre dominios/features. Cada feature emite eventos sem saber quem escuta.

---

## Anti-patterns

> O que evitar no gerenciamento de estado?

| Anti-pattern                               | Por que evitar                              | Alternativa                         |
| ------------------------------------------ | ------------------------------------------- | ----------------------------------- |
| Colocar server state em global store       | Duplica cache, perde revalidacao automatica | Use TanStack Query                  |
| Estado global para dados locais            | Complexidade desnecessaria, re-renders      | Use useState/useReducer             |
| Prop drilling alem de 2 niveis             | Codigo fragil, dificil de manter            | Use contexto ou store               |
| Sincronizar manualmente server/local state | Bugs de sincronizacao, dados stale          | Deixe TanStack Query gerenciar      |
| Store monolitica gigante                   | Dificil de testar, re-renders excessivos    | Stores pequenas por dominio         |
| Usar AsyncStorage para dados sensiveis     | Dados ficam em texto puro no disco          | Use SecureStore / Keychain          |
| Ignorar transicoes background/foreground   | Dados stale, sessao expirada sem feedback   | Revalidar ao voltar para foreground |

> Arquitetura de estado: (ver 01-architecture.md para contexto das camadas)
