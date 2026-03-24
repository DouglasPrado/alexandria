# Rotas e Navegação

Define a estrutura de rotas da aplicação web (Next.js 16 App Router), a estratégia de proteção de rotas e os padrões de layout e navegação. Este documento serve como mapa central de todas as rotas do frontend, garantindo que cada rota tenha proteção, layout e propósito bem definidos.

<!-- do blueprint: 08-use_cases.md (UC-001 a UC-010), 07-critical_flows.md, 13-security.md (RBAC) -->

---

## Estrutura de Rotas

> Como as rotas estão organizadas?

### Rotas Públicas (auth)

| Rota | Layout | Página | Descrição |
|------|--------|--------|-----------|
| `/login` | AuthLayout | LoginPage | Login com email + senha |
| `/invite/:token` | AuthLayout | AcceptInvitePage | Aceite de convite ao cluster |

### Rotas de Setup (sem cluster)

| Rota | Layout | Página | Descrição |
|------|--------|--------|-----------|
| `/setup` | SetupLayout | SetupClusterPage | Criação do cluster (nome + senha admin) |
| `/setup/seed` | SetupLayout | SeedPhrasePage | Exibição da seed phrase de 12 palavras |

### Rotas de Recovery (banco vazio)

| Rota | Layout | Página | Descrição |
|------|--------|--------|-----------|
| `/recovery` | RecoveryLayout | RecoverySeedPage | Input da seed phrase de 12 palavras |
| `/recovery/progress` | RecoveryLayout | RecoveryProgressPage | Stepper de progresso do recovery |

### Rotas Protegidas (membro autenticado)

| Rota | Layout | Página | Descrição |
|------|--------|--------|-----------|
| `/dashboard` | AppLayout | GalleryPage | Galeria principal (grid/timeline de thumbnails) |
| `/dashboard/file/:id` | AppLayout | FileDetailPage | Lightbox com preview, metadados e download |
| `/dashboard/search` | AppLayout | SearchPage | Busca avançada com filtros |
| `/dashboard/settings` | AppLayout | SettingsPage | Configurações do membro (perfil, senha) |

### Rotas Admin (role: admin)

| Rota | Layout | Página | Descrição |
|------|--------|--------|-----------|
| `/dashboard/nodes` | AppLayout | NodesPage | Lista e gerenciamento de nós |
| `/dashboard/nodes/:id` | AppLayout | NodeDetailPage | Detalhe do nó (status, capacidade, drain) |
| `/dashboard/alerts` | AppLayout | AlertsPage | Lista completa de alertas |
| `/dashboard/members` | AppLayout | MembersPage | Gerenciamento de membros e convites |
| `/dashboard/cluster` | AppLayout | ClusterSettingsPage | Configurações do cluster |

<!-- APPEND:rotas -->

### Estrutura App Router (filesystem)

```
app/
  layout.tsx                    # Root layout (providers, fonts, theme)
  not-found.tsx                 # 404
  error.tsx                     # Error boundary global
  loading.tsx                   # Loading skeleton global
  middleware.ts                 # Auth guard, redirects

  (auth)/
    layout.tsx                  # AuthLayout (logo, card centralizado)
    login/page.tsx
    invite/[token]/page.tsx

  (setup)/
    layout.tsx                  # SetupLayout (wizard steps)
    setup/page.tsx
    setup/seed/page.tsx

  (recovery)/
    layout.tsx                  # RecoveryLayout (stepper)
    recovery/page.tsx
    recovery/progress/page.tsx

  (app)/
    layout.tsx                  # AppLayout (sidebar, header, main)
    dashboard/
      page.tsx                  # Galeria
      file/[id]/page.tsx        # Detalhe do arquivo
      search/page.tsx           # Busca avançada
      settings/page.tsx         # Config do membro
      nodes/
        page.tsx                # Lista de nós
        [id]/page.tsx           # Detalhe do nó
      alerts/page.tsx           # Alertas
      members/page.tsx          # Membros
      cluster/page.tsx          # Config do cluster

  api/
    upload/route.ts             # Proxy de upload com progress
```

---

## Proteção de Rotas

> Como rotas protegidas verificam autenticação e autorização?

| Tipo | Guard | Redirect se Falhar |
|------|-------|--------------------|
| Públicas (`(auth)`) | Nenhum; se já autenticado, redireciona para `/dashboard` | N/A |
| Setup (`(setup)`) | Verificação: banco existe mas sem cluster | `/dashboard` (se cluster existe) |
| Recovery (`(recovery)`) | Verificação: banco vazio (fresh install ou reset) | `/dashboard` (se banco populado) |
| Protegidas (`(app)`) | JWT válido via middleware | `/login` |
| Admin | JWT válido + role = `admin` | `/dashboard` (sem permissão) ou `/login` (sem auth) |

### Middleware de Autenticação

<!-- do blueprint: 13-security.md (JWT, RBAC) -->

A proteção é feita 100% server-side via `middleware.ts` do Next.js:

```
Request → middleware.ts
  ├─ Rota pública (/login, /invite/:token)
  │   └─ JWT válido? → redirect /dashboard
  │   └─ Sem JWT? → continua
  │
  ├─ Rota setup (/setup, /setup/seed)
  │   └─ Cluster existe? → redirect /dashboard
  │   └─ Sem cluster? → continua
  │
  ├─ Rota recovery (/recovery, /recovery/progress)
  │   └─ Banco populado? → redirect /dashboard
  │   └─ Banco vazio? → continua
  │
  ├─ Rota protegida (/dashboard/*)
  │   └─ JWT inválido? → redirect /login
  │   └─ JWT válido? → continua
  │
  └─ Rota admin (/dashboard/nodes, /dashboard/members, /dashboard/cluster, /dashboard/alerts)
      └─ Role != admin? → redirect /dashboard
      └─ Role = admin? → continua
```

---

## Layouts Compartilhados

> Quais layouts são reutilizados entre rotas?

| Layout | Rotas que Usam | Componentes Incluídos |
|--------|----------------|-----------------------|
| RootLayout | Todas | Providers (QueryClient, Zustand), fonts, `<html>`, `<body>` |
| AuthLayout | `/login`, `/invite/:token` | Logo Alexandria, card centralizado, fundo minimalista |
| SetupLayout | `/setup`, `/setup/seed` | Logo, stepper de 2 passos (Criar → Seed), card centralizado |
| RecoveryLayout | `/recovery`, `/recovery/progress` | Logo, stepper de 6 etapas, card centralizado |
| AppLayout | `/dashboard/**` | Sidebar, Header (com AlertBell, Avatar), main content area |

<!-- APPEND:layouts -->

### Composição de Layouts

```
RootLayout (providers, fonts, theme)
  ├── AuthLayout (logo, card)
  │     ├── LoginPage
  │     └── AcceptInvitePage
  ├── SetupLayout (logo, stepper)
  │     ├── SetupClusterPage
  │     └── SeedPhrasePage
  ├── RecoveryLayout (logo, stepper)
  │     ├── RecoverySeedPage
  │     └── RecoveryProgressPage
  └── AppLayout (sidebar, header, main)
        ├── GalleryPage
        ├── FileDetailPage
        ├── NodesPage / NodeDetailPage
        ├── AlertsPage
        ├── MembersPage
        ├── SettingsPage
        └── ClusterSettingsPage
```

---

## Navegação

> Como o usuário navega entre seções?

- **Navegação principal:** Sidebar persistente (desktop) / hamburger menu (mobile responsivo)
- **Breadcrumbs:** Não — estrutura flat suficiente para escala familiar
- **Deep linking:** URLs compartilháveis com filtros via query params (`?type=photos&view=timeline`)
- **Navegação responsiva:** Sidebar colapsa em ícones no tablet; hamburger menu no mobile

| Elemento | Visível em | Comportamento |
|----------|-----------|---------------|
| Sidebar | Área logada (AppLayout) | Navegação entre seções: Galeria, Nós, Alertas, Membros, Config |
| Header | Área logada (AppLayout) | SearchBar, AlertBell (badge), Avatar (menu: perfil, logout) |
| UploadQueue | Área logada (flutuante) | Mini-bar fixa no canto inferior-direito durante uploads |

### Itens da Sidebar

| Item | Ícone | Rota | Visível para |
|------|-------|------|-------------|
| Galeria | Photos | `/dashboard` | Todos |
| Busca | Search | `/dashboard/search` | Todos |
| Nós | HardDrive | `/dashboard/nodes` | Admin |
| Alertas | Bell | `/dashboard/alerts` | Admin |
| Membros | Users | `/dashboard/members` | Admin |
| Cluster | Settings | `/dashboard/cluster` | Admin |
| Minha Conta | User | `/dashboard/settings` | Todos |

> Para detalhes sobre proteção de rotas e autenticação, (ver [11-security.md](11-security.md)).

---

## Histórico de Decisões

| Data | Decisão | Motivo |
|------|---------|--------|
| 2026-03-24 | Route groups separados por estado do sistema (auth/setup/recovery/app) | Middleware pode redirecionar com base no estado: sem cluster → setup, banco vazio → recovery, sem JWT → login |
| 2026-03-24 | Rotas admin dentro de `/dashboard/*` (não `/admin/*`) | Admin e membro compartilham AppLayout; separação por role guard no middleware, não por URL prefix |
| 2026-03-24 | Sem breadcrumbs | Estrutura de navegação flat (max 2 níveis); sidebar + header suficientes para 7 seções |
| 2026-03-24 | URL state para filtros da galeria | Permite compartilhar links filtrados e preservar estado no back/forward do browser |
