# Rotas e Navegacao

Define a estrutura de rotas da aplicacao, a estrategia de protecao de rotas e os padroes de layout e navegacao. Este documento serve como mapa central de todas as rotas do frontend, garantindo que cada rota tenha protecao, layout e proposito bem definidos.

---

## Estrutura de Rotas

> Como as rotas estao organizadas?

<!-- do blueprint: 08-use_cases.md (10 use cases mapeados para telas) + 07-critical_flows.md (fluxos) -->

### Rotas Publicas (sem autenticacao)

| Rota | Layout | Pagina | Feature | Caso de Uso |
|------|--------|--------|---------|-------------|
| `/` | RootLayout | Redirect → /login ou /gallery | — | — |
| `/login` | AuthLayout | LoginPage | auth | Login do membro |
| `/invite/:token` | AuthLayout | InviteAcceptPage | cluster | UC-002: Aceitar convite |
| `/recovery` | AuthLayout | RecoveryPage | recovery | UC-007: Recovery via seed |

### Rotas Protegidas (requer autenticacao — qualquer role)

| Rota | Layout | Pagina | Feature | Caso de Uso |
|------|--------|--------|---------|-------------|
| `/gallery` | AppLayout | GalleryPage | gallery | UC-005: Visualizar acervo |
| `/gallery/:fileId` | AppLayout | FileDetailPage | gallery | UC-005: Detalhes e download |
| `/settings` | AppLayout | SettingsPage | settings | Perfil e preferencias |

### Rotas Protegidas (requer role admin)

| Rota | Layout | Pagina | Feature | Caso de Uso |
|------|--------|--------|---------|-------------|
| `/nodes` | AppLayout | NodesPage | nodes | UC-003: Gerenciar nos |
| `/nodes/:nodeId` | AppLayout | NodeDetailPage | nodes | UC-006: Detalhes e drain |
| `/health` | AppLayout | HealthPage | health | UC-008: Monitorar saude |
| `/cluster` | AppLayout | ClusterPage | cluster | Membros e convites |
| `/cluster/setup` | SetupLayout | ClusterSetupPage | cluster | UC-001: Criar cluster |

<!-- APPEND:rotas -->

### Estrutura Next.js App Router

```
app/
  layout.tsx                    # RootLayout: providers (QueryClient, Zustand, ThemeProvider), fonts, metadata
  page.tsx                      # Redirect: autenticado → /gallery, nao → /login

  (public)/                     # Grupo sem autenticacao
    layout.tsx                  # AuthLayout: logo, card centralizado, fundo limpo
    login/
      page.tsx                  # LoginPage
    invite/[token]/
      page.tsx                  # InviteAcceptPage
    recovery/
      page.tsx                  # RecoveryPage (CSR only — seed nunca no servidor)

  (protected)/                  # Grupo autenticado
    layout.tsx                  # AppLayout: AuthGuard + Sidebar + Header
    page.tsx                    # Redirect → /gallery
    gallery/
      page.tsx                  # GalleryPage (grid + timeline + busca + upload via modal/drawer)
      [fileId]/
        page.tsx                # FileDetailPage (preview + metadata + download)
    settings/
      page.tsx                  # SettingsPage (perfil + vault + preferencias)

    (admin)/                    # Sub-grupo admin (RoleGate role="admin")
      layout.tsx                # AdminGuard: RoleGate que redireciona se nao admin
      nodes/
        page.tsx                # NodesPage (lista + registro)
        [nodeId]/
          page.tsx              # NodeDetailPage (detalhes + drain)
      health/
        page.tsx                # HealthPage (dashboard + alertas)
      cluster/
        page.tsx                # ClusterPage (membros + convites)

  cluster/
    setup/
      layout.tsx                # SetupLayout: limpo, sem sidebar (wizard)
      page.tsx                  # ClusterSetupPage (wizard de criacao)

  api/                          # Route Handlers (BFF)
    gallery/[fileId]/
      route.ts                  # SSR: file detail + preview
    health/summary/
      route.ts                  # SSR: health + top alertas
    preview/[fileId]/
      route.ts                  # Proxy: preview image/video
    auth/refresh/
      route.ts                  # Refresh token server-side
```

---

## Protecao de Rotas

> Como rotas protegidas verificam autenticacao e autorizacao?

<!-- do blueprint: 13-security.md (JWT, RBAC) + 04-domain-model.md (RN-M3 roles) -->

### Estrategia em duas camadas

1. **Middleware server-side** (`middleware.ts`): verifica presenca do JWT antes de servir a pagina. Rapido, previne flash de conteudo protegido.
2. **Guards client-side** (React components): verificam role e estado da sessao apos hydration. Tratam edge cases (token expirado entre request e render).

| Tipo | Middleware/Guard | Redirect se Falhar | Roles Permitidas |
|------|------------------|--------------------|------------------|
| Publicas | Nenhum | N/A | Qualquer (inclusive nao autenticado) |
| Publicas (com redirect) | Middleware: se autenticado → /gallery | /gallery | — |
| Protegidas | Middleware: verifica JWT + AuthGuard | /login | admin, member, reader |
| Admin | Middleware: verifica JWT + AdminGuard (RoleGate role="admin") | /gallery (sem permissao) | admin |
| Setup | Middleware: verifica que nao existe cluster ativo | /gallery (cluster ja existe) | — |

### Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/invite', '/recovery', '/cluster/setup'];
const ADMIN_PATHS = ['/nodes', '/health', '/cluster'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('alexandria-token')?.value;

  // Rotas publicas: se autenticado, redireciona para galeria
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    if (token && pathname === '/login') {
      return NextResponse.redirect(new URL('/gallery', request.url));
    }
    return NextResponse.next();
  }

  // Rotas protegidas: sem token → login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### Redirect apos login

O parametro `?redirect=` na URL de login preserva a rota original. Apos login bem-sucedido, o usuario e redirecionado para a rota que tentou acessar.

---

## Layouts Compartilhados

> Quais layouts sao reutilizados entre rotas?

| Layout | Rotas que Usam | Componentes Incluidos | Descricao |
|--------|----------------|-----------------------|-----------|
| RootLayout | Todas | QueryClientProvider, ThemeProvider, Zustand hydration, Toaster | Layout raiz com providers globais |
| AuthLayout | /login, /invite/:token, /recovery | Logo Alexandria, Card centralizado, fundo neutro | Telas de autenticacao e onboarding |
| AppLayout | Todas as rotas protegidas | Sidebar, Header, PageShell, AlertBanner (se alerta critico) | Layout principal da aplicacao |
| SetupLayout | /cluster/setup | Logo, wizard steps, fundo limpo | Wizard de criacao de cluster (sem sidebar) |

<!-- APPEND:layouts -->

### Composicao de layouts

```
RootLayout (providers globais)
  ├── AuthLayout (publicas)
  │     ├── LoginPage
  │     ├── InviteAcceptPage
  │     └── RecoveryPage
  ├── AppLayout (protegidas)
  │     ├── Sidebar (navegacao principal)
  │     ├── Header (titulo + acoes contextuais + avatar)
  │     ├── AlertBanner (se alerta critico ativo)
  │     └── PageShell (conteudo da pagina)
  │           ├── GalleryPage (inclui upload via modal/drawer para admin/member)
  │           ├── SettingsPage
  │           └── (admin)
  │                 ├── NodesPage
  │                 ├── HealthPage
  │                 └── ClusterPage
  └── SetupLayout (setup)
        └── ClusterSetupPage
```

---

## Navegacao

> Como o usuario navega entre secoes?

- **Navegacao principal:** Sidebar colapsavel (desktop) / Drawer (mobile)
- **Breadcrumbs:** Sim, em paginas de detalhe (/gallery/:fileId, /nodes/:nodeId)
- **Deep linking:** URLs compartilhaveis com filtros na query string
- **Navegacao mobile:** Sidebar como Drawer (swipe ou hamburger menu)

### Sidebar — Itens de navegacao

| Item | Icone | Rota | Badge | Visivel para |
|------|-------|------|-------|-------------|
| Galeria | Image | /gallery | Contador de uploads pendentes (admin/member) | Todos |
| Nos | HardDrive | /nodes | Contador de nos com problema | admin |
| Saude | Activity | /health | Contador de alertas criticos | admin |
| Membros | Users | /cluster | — | admin |
| Configuracoes | Settings | /settings | — | Todos |

**Separador visual** entre itens de uso diario (Galeria) e itens administrativos (Nos, Saude, Membros).

### Breadcrumbs

| Rota | Breadcrumb |
|------|-----------|
| /gallery | Galeria |
| /gallery/:fileId | Galeria > {originalName} |
| /nodes | Nos |
| /nodes/:nodeId | Nos > {nodeName} |
| /health | Saude do Cluster |
| /cluster | Membros |
| /settings | Configuracoes |

### Header contextual

| Rota | Titulo | Acoes no Header |
|------|--------|----------------|
| /gallery | Galeria | SearchBar, ViewToggle (grid/timeline), filtros media_type, Button "Upload" (admin/member) |
| /nodes | Nos de Armazenamento | Button "Adicionar No" |
| /health | Saude do Cluster | — |
| /cluster | Membros | Button "Convidar" |
| /settings | Configuracoes | — |
| /gallery/:fileId | {originalName} | Button "Download", Button "Excluir" |
| /nodes/:nodeId | {nodeName} | Button "Drain", StatusDot |

---

## Navegacao Mobile

> Como a navegacao se adapta para telas menores?

| Breakpoint | Comportamento |
|-----------|---------------|
| < 768px (mobile) | Sidebar oculta; hamburger menu no header abre Drawer overlay |
| 768px - 1024px (tablet) | Sidebar colapsada (somente icones); expande on hover |
| > 1024px (desktop) | Sidebar expandida com labels |

- **Galeria mobile:** grid 2 colunas; swipe horizontal entre fotos no preview
- **Upload mobile:** botao flutuante (FAB) no canto inferior direito da galeria (admin/member)
- **Navegacao de detalhe:** swipe left/right para navegar entre arquivos na galeria

---

## Historico de Decisoes

| Data | Decisao | Motivo |
|------|---------|--------|
| 2026-03-23 | Seed phrase e recovery como CSR-only | Seed phrase nunca deve ser renderizada no servidor — principio Zero-Knowledge |
| 2026-03-23 | Middleware + Guards (duas camadas) | Middleware previne flash de conteudo; Guards tratam edge cases de token expirado |
| 2026-03-23 | Sidebar (nao bottom tabs) | Mais espaco para itens admin; bottom tabs sao limitados a 5 itens |
| 2026-03-23 | Grupo (admin) dentro de (protected) | Reutiliza AppLayout; RoleGate no layout do grupo admin |

> Para detalhes sobre protecao de rotas e autenticacao, (ver 11-security.md).
