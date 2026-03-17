# Rotas e Navegacao

Define a estrutura de rotas da aplicacao, a estrategia de protecao de rotas e os padroes de layout e navegacao. Este documento serve como mapa central de todas as rotas do frontend, garantindo que cada rota tenha protecao, layout e proposito bem definidos.

---

## Estrutura de Rotas

> Como as rotas estao organizadas?

| Rota | Tipo | Layout | Pagina |
|------|------|--------|--------|
| `/` | Publica | `MainLayout` | {{HomePage}} |
| `/login` | Publica | `AuthLayout` | {{LoginPage}} |
| `/register` | Publica | `AuthLayout` | {{RegisterPage}} |
| `/dashboard` | Protegida | `AppLayout` | {{DashboardPage}} |
| `/settings` | Protegida | `AppLayout` | {{SettingsPage}} |
| `/admin/users` | Admin | `AdminLayout` | {{AdminUsersPage}} |
| {{/rota-adicional}} | {{Tipo}} | {{Layout}} | {{Pagina}} |

<!-- APPEND:rotas -->

<details>
<summary>Exemplo — Estrutura Next.js App Router</summary>

```
app/
  layout.tsx              # Root layout
  page.tsx                # Home (/)
  (public)/
    login/page.tsx        # /login
    register/page.tsx     # /register
  (protected)/
    layout.tsx            # Auth guard layout
    dashboard/page.tsx    # /dashboard
    files/page.tsx        # /files
    settings/page.tsx     # /settings
  (admin)/
    layout.tsx            # Admin guard layout
    users/page.tsx        # /admin/users
```

</details>

---

## Protecao de Rotas

> Como rotas protegidas verificam autenticacao e autorizacao?

| Tipo | Middleware/Guard | Redirect se Falhar |
|------|------------------|--------------------|
| Publicas | Nenhum | N/A |
| Protegidas | Auth middleware | `/login` |
| Admin | Auth + role check | `/dashboard` (sem permissao) ou `/login` (sem auth) |

{{Descreva a estrategia de protecao — middleware server-side e/ou client-side}}

---

## Layouts Compartilhados

> Quais layouts sao reutilizados entre rotas?

| Layout | Rotas que Usam | Componentes Incluidos |
|--------|----------------|-----------------------|
| `MainLayout` | `/` | {{Navbar, Footer}} |
| `AuthLayout` | `/login`, `/register` | {{Logo, Card centralizado}} |
| `AppLayout` | `/dashboard`, `/settings` | {{Sidebar, Navbar, Footer}} |
| `AdminLayout` | `/admin/*` | {{Admin Sidebar, Navbar}} |
| {{LayoutAdicional}} | {{Rotas}} | {{Componentes}} |

<!-- APPEND:layouts -->

---

## Navegacao

> Como o usuario navega entre secoes?

- Navegacao principal: {{Sidebar / Navbar / Tabs}}
- Breadcrumbs: {{Sim/Nao}}
- Deep linking: {{URLs compartilhaveis com estado}}
- Navegacao mobile: {{Bottom tabs / Hamburger menu / Drawer}}

| Elemento | Visivel em | Comportamento |
|----------|-----------|---------------|
| {{Navbar}} | {{Todas as paginas}} | {{Links principais + user menu}} |
| {{Sidebar}} | {{Area logada}} | {{Navegacao secundaria colapsavel}} |
| {{Breadcrumbs}} | {{Paginas internas}} | {{Caminho hierarquico clicavel}} |

> Para detalhes sobre protecao de rotas e autenticacao, (ver 11-seguranca.md).

---

## Historico de Decisoes

| Data | Decisao | Motivo |
|------|---------|--------|
| {{YYYY-MM-DD}} | {{Decisao sobre rotas}} | {{Justificativa}} |
