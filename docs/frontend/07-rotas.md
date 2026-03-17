# Rotas e Navegacao

Define a estrutura de rotas da aplicacao, a estrategia de protecao de rotas e os padroes de layout e navegacao. Este documento serve como mapa central de todas as rotas do frontend, garantindo que cada rota tenha protecao, layout e proposito bem definidos.

---

## Estrutura de Rotas

> Como as rotas estao organizadas?

| Rota | Tipo | Layout | Pagina |
|------|------|--------|--------|
| `/` | Publica | `MainLayout` | LandingPage — apresentacao do sistema, CTA para login/registro |
| `/login` | Publica | `AuthLayout` | LoginPage — autenticacao do membro no cluster |
| `/invite/[token]` | Publica | `AuthLayout` | InvitePage — aceite de convite com token assinado e registro do membro |
| `/recovery` | Publica | `AuthLayout` | RecoveryPage — entrada da seed phrase para recuperacao do orquestrador |
| `/gallery` | Protegida | `AppLayout` | GalleryPage — galeria de fotos/videos com timeline cronologica e busca |
| `/gallery/[fileId]` | Protegida | `AppLayout` | FileDetailPage — visualizacao de foto/video com metadados EXIF, download sob demanda |
| `/upload` | Protegida | `AppLayout` | UploadPage — upload manual de arquivos, status do sync engine e fila de processamento |
| `/nodes` | Protegida | `AppLayout` | NodesPage — lista de nos do cluster, heartbeat status, quotas e capacidade |
| `/nodes/add` | Protegida | `AppLayout` | AddNodePage — registro de novo no (local, S3, R2, Google Drive, Dropbox, OneDrive) |
| `/nodes/[nodeId]` | Protegida | `AppLayout` | NodeDetailPage — detalhes do no, chunks armazenados, drain, configuracao de quota |
| `/nodes/[nodeId]/oauth/callback` | Protegida | `MinimalLayout` | OAuthCallbackPage — callback do fluxo OAuth para provedores cloud |
| `/cluster` | Admin | `AppLayout` | ClusterPage — gerenciamento do cluster familiar, membros, permissoes |
| `/cluster/members` | Admin | `AppLayout` | MembersPage — lista de membros, convite, alteracao de roles |
| `/cluster/members/[memberId]` | Admin | `AppLayout` | MemberDetailPage — detalhes do membro, dispositivos, quota, auditoria |
| `/cluster/invite` | Admin | `AppLayout` | InviteCreatePage — geracao de token de convite com expiracao |
| `/health` | Protegida | `AppLayout` | HealthDashboardPage — dashboard de saude: replicacao, capacidade, alertas |
| `/health/alerts` | Protegida | `AppLayout` | AlertsPage — historico de alertas (no offline, replicacao baixa, token expirado) |
| `/vault` | Protegida | `AppLayout` | VaultPage — vault criptografado do membro, tokens OAuth, credenciais |
| `/settings` | Protegida | `AppLayout` | SettingsPage — preferencias do membro, tema, notificacoes |
| `/recovery/seed` | Admin | `AppLayout` | SeedPhrasePage — exibicao da seed phrase (acesso restrito ao admin) |

<!-- APPEND:rotas -->

<details>
<summary>Exemplo — Estrutura Next.js App Router</summary>

```
app/
  layout.tsx                          # Root layout (providers, theme, fonts)
  page.tsx                            # Landing (/)
  (public)/
    layout.tsx                        # AuthLayout wrapper
    login/page.tsx                    # /login
    invite/[token]/page.tsx           # /invite/[token]
    recovery/page.tsx                 # /recovery
  (protected)/
    layout.tsx                        # Auth guard + AppLayout wrapper
    gallery/
      page.tsx                        # /gallery
      [fileId]/page.tsx               # /gallery/[fileId]
    upload/page.tsx                   # /upload
    nodes/
      page.tsx                        # /nodes
      add/page.tsx                    # /nodes/add
      [nodeId]/
        page.tsx                      # /nodes/[nodeId]
        oauth/callback/page.tsx       # /nodes/[nodeId]/oauth/callback
    health/
      page.tsx                        # /health
      alerts/page.tsx                 # /health/alerts
    vault/page.tsx                    # /vault
    settings/page.tsx                 # /settings
    recovery/seed/page.tsx            # /recovery/seed (admin only)
  (admin)/
    layout.tsx                        # Admin guard layout (role check)
    cluster/
      page.tsx                        # /cluster
      members/
        page.tsx                      # /cluster/members
        [memberId]/page.tsx           # /cluster/members/[memberId]
      invite/page.tsx                 # /cluster/invite
```

</details>

---

## Protecao de Rotas

> Como rotas protegidas verificam autenticacao e autorizacao?

| Tipo | Middleware/Guard | Redirect se Falhar |
|------|------------------|--------------------|
| Publicas | Nenhum | N/A |
| Publicas com redirect | Auth check (se ja logado) | `/gallery` (se ja autenticado) |
| Protegidas | Auth middleware (server-side) + client guard | `/login?redirect={currentPath}` |
| Admin | Auth middleware + role check (`admin`) | `/gallery` (sem permissao) ou `/login` (sem auth) |

**Estrategia de protecao em duas camadas:**

1. **Server-side (Next.js Middleware):** O middleware `middleware.ts` roda no edge e intercepta todas as requisicoes antes de renderizar a pagina. Verifica o token de sessao do membro e redireciona para `/login` se invalido. Rotas admin verificam tambem o role do membro no cluster.

2. **Client-side (Layout Guard):** O layout `(protected)/layout.tsx` executa um guard React que valida a sessao via TanStack Query. Se a sessao expirar durante a navegacao client-side (SPA transitions), redireciona para `/login` preservando a URL de retorno via query param `redirect`.

**Regras especificas:**

- Rotas publicas (`/login`, `/invite/[token]`, `/recovery`) redirecionam para `/gallery` se o membro ja esta autenticado
- O fluxo de OAuth callback (`/nodes/[nodeId]/oauth/callback`) valida o `state` parameter para prevenir CSRF
- A rota `/recovery/seed` exige re-autenticacao do admin (confirmacao de senha) antes de exibir a seed phrase <!-- inferido do PRD — RF-047/RF-049 -->
- Tokens de sessao sao armazenados como HttpOnly cookies com flag Secure e SameSite=Strict

---

## Layouts Compartilhados

> Quais layouts sao reutilizados entre rotas?

| Layout | Rotas que Usam | Componentes Incluidos |
|--------|----------------|-----------------------|
| `RootLayout` | Todas | ThemeProvider, QueryClientProvider, FontLoader, Toaster |
| `MainLayout` | `/` | Navbar (publico), Hero, Footer |
| `AuthLayout` | `/login`, `/invite/[token]`, `/recovery` | Logo centralizado, Card de formulario, fundo minimalista |
| `AppLayout` | `/gallery`, `/upload`, `/nodes/*`, `/health/*`, `/vault`, `/settings`, `/cluster/*` | Sidebar, Header (com user menu, notificacoes, status de sync), MainContent area |
| `MinimalLayout` | `/nodes/[nodeId]/oauth/callback` | Spinner de loading, sem navegacao (pagina transitoria de callback OAuth) |

<!-- APPEND:layouts -->

**Composicao de layouts no App Router:**

```
RootLayout (app/layout.tsx)
  ├── MainLayout      → Landing page publica
  ├── AuthLayout      → Fluxos de autenticacao e recovery
  ├── AppLayout       → Toda a area logada
  │   ├── Sidebar     → Navegacao principal (Gallery, Upload, Nodes, Health, Vault)
  │   ├── Header      → Breadcrumbs, SyncStatus, NotificationBell, UserMenu
  │   └── MainContent → Conteudo da pagina
  └── MinimalLayout   → Paginas transitorias (OAuth callbacks)
```

**Comportamento responsivo dos layouts:**

| Breakpoint | Sidebar | Header | Navegacao |
|------------|---------|--------|-----------|
| Desktop (≥1024px) | Sidebar fixa lateral colapsavel | Header com breadcrumbs e acoes | Sidebar + breadcrumbs |
| Tablet (768-1023px) | Sidebar colapsada por padrao (icones) | Header compacto | Sidebar colapsada + breadcrumbs |
| Mobile (<768px) | Drawer (hamburger menu) | Header com hamburger + notificacoes | Drawer + bottom action bar |

---

## Navegacao

> Como o usuario navega entre secoes?

- Navegacao principal: Sidebar lateral (area logada) / Navbar horizontal (area publica)
- Breadcrumbs: Sim — em todas as paginas internas da area logada
- Deep linking: URLs compartilhaveis com estado (ex: `/gallery?date=2026-01&type=photo&search=praia`)
- Navegacao mobile: Drawer (hamburger menu) com bottom action bar para acoes frequentes (upload, galeria)

| Elemento | Visivel em | Comportamento |
|----------|-----------|---------------|
| Navbar (publica) | Landing page (`/`) | Links: Login, Sobre, logo Alexandria |
| Sidebar | Area logada (desktop/tablet) | Itens: Gallery, Upload, Nodes, Health, Vault, Settings. Colapsavel. Badge de alertas em Health. Indicador de sync em Upload |
| Header | Area logada | Breadcrumbs (caminho clicavel), SyncStatusIndicator, NotificationBell (alertas do cluster), UserMenu (perfil, settings, logout) |
| Breadcrumbs | Paginas internas | Caminho hierarquico clicavel (ex: `Nodes > meu-nas > Detalhes`) |
| Drawer | Mobile (<768px) | Menu hamburger com mesmos itens da Sidebar, fecha ao navegar |
| Bottom Action Bar | Mobile (<768px) | Acoes rapidas: camera/upload, galeria — sempre visivel na area logada <!-- inferido do PRD — UX mobile-first para upload automatico --> |

**Estrutura da Sidebar:**

```
┌─────────────────────┐
│  ◆ Alexandria       │  ← Logo/nome, clicavel → /gallery
├─────────────────────┤
│  📷 Galeria         │  → /gallery
│  ⬆️ Upload          │  → /upload (badge: N pendentes)
│  🖥️ Nos            │  → /nodes
│  💚 Saude           │  → /health (badge: N alertas)
│  🔐 Vault           │  → /vault
├─────────────────────┤
│  👥 Cluster         │  → /cluster (admin only)
├─────────────────────┤
│  ⚙️ Configuracoes   │  → /settings
│  🚪 Sair            │  → logout
└─────────────────────┘
```

**Padroes de navegacao:**

- **Apos login:** Redireciona para `/gallery` (ou URL armazenada em `redirect` query param)
- **Apos aceitar convite:** Redireciona para `/gallery` com toast de boas-vindas
- **Apos adicionar no:** Redireciona para `/nodes/[nodeId]` com status do novo no
- **Apos upload:** Permanece em `/upload` mostrando progresso; link para `/gallery` quando completo
- **Navegacao por teclado:** Suporte a atalhos — `G` para galeria, `U` para upload, `N` para nos, `H` para saude

> Para detalhes sobre protecao de rotas e autenticacao, (ver 11-seguranca.md).

---

## Historico de Decisoes

| Data | Decisao | Motivo |
|------|---------|--------|
| 2026-03-17 | Usar route groups do App Router `(public)`, `(protected)`, `(admin)` para separar niveis de acesso | Permite layouts e guards diferentes por grupo sem afetar a URL; alinhado com Next.js App Router conventions |
| 2026-03-17 | OAuth callback em layout minimal separado | Pagina transitoria nao precisa de sidebar/header; evita flash de layout durante redirect |
| 2026-03-17 | Protecao em duas camadas (middleware server-side + client guard) | Middleware previne acesso no edge (rapido, seguro); client guard cobre transicoes SPA sem full reload |
| 2026-03-17 | Sidebar como navegacao principal em vez de navbar horizontal | Sistema tem muitas secoes (7+ itens); sidebar acomoda melhor e permite badges/indicadores de status |
| 2026-03-17 | Deep linking com query params para estado da galeria | Permite compartilhar URLs filtradas entre membros da familia; estado preservado no browser history |
