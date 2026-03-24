# Gerenciamento de Estado

Define a estrategia de gerenciamento de estado separando claramente os tipos de estado, as ferramentas responsaveis por cada um e os anti-patterns a evitar. A separacao correta de estado e uma das decisoes arquiteturais mais importantes do frontend — estado mal gerenciado e a principal causa de bugs e complexidade desnecessaria.

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
| URL State | Estado refletido na URL | Router/SearchParams | Filtros, paginacao, tab ativa |

> Regra: use o tipo mais simples que resolve o problema. Nao coloque em global state o que pode ser UI state local.

---

## Server State (Data Fetching)

> Como gerenciamos dados vindos do backend?

- **Ferramenta:** {{TanStack Query / SWR / outro}}
- **Beneficios:** cache automatico, revalidacao, sincronizacao, loading/error states
- **Padrao:** queries em `features/xxx/api/` + hooks em `features/xxx/hooks/`

| Configuracao | Valor |
| --- | --- |
| Stale Time | {{5 minutos / conforme dominio}} |
| Cache Time | {{30 minutos}} |
| Retry | {{3 tentativas com backoff exponencial}} |
| Refetch on Window Focus | {{Sim / Nao}} |

> Detalhes completos sobre data fetching: (ver 06-data-layer.md)

---

## Global State

> Quais dados precisam ser globais?

| Store | Dados | Persistencia (Sim/Nao) | Quando Inicializa |
| --- | --- | --- | --- |
| {{authStore}} | {{Usuario logado, token, permissoes}} | {{Sim (localStorage)}} | {{Login / Refresh da pagina}} |
| {{preferencesStore}} | {{Tema, idioma, sidebar state}} | {{Sim (localStorage)}} | {{Montagem do app}} |
| {{uiStore}} | {{Notificacoes, loading global}} | {{Nao}} | {{Montagem do app}} |
| {{Outra store}} | {{Dados}} | {{Sim/Nao}} | {{Quando}} |

<!-- APPEND:stores -->

<details>
<summary>Exemplo — authStore com Zustand</summary>

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
    { name: 'auth-storage' }
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

> Arquitetura de estado: (ver 01-arquitetura.md para contexto das camadas)
