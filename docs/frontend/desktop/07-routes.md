# Janelas e Navegacao

Define a estrutura de janelas da aplicacao desktop, a estrategia de navegacao intra-janela e os padroes de menu e tray. Este documento serve como mapa central de todas as janelas e rotas do frontend desktop, garantindo que cada janela tenha proposito, layout e protecao bem definidos.

---

## Estrutura de Janelas

> Como as janelas estao organizadas?

| Janela | Tipo | Tamanho Padrao | Resizable | Proposito |
|--------|------|----------------|-----------|-----------|
| Main Window | Principal | {{1200x800}} | Sim | {{Janela principal da aplicacao}} |
| Settings Window | Secundaria | {{600x500}} | Nao | {{Configuracoes e preferencias}} |
| About Window | Secundaria | {{400x300}} | Nao | {{Informacoes sobre a aplicacao}} |
| {{Outra janela}} | {{Tipo}} | {{Tamanho}} | {{Sim/Nao}} | {{Proposito}} |

<!-- APPEND:janelas -->

<details>
<summary>Exemplo — Configuracao de janelas (Electron)</summary>

```typescript
// main/windows/main-window.ts
const mainWindow = new BrowserWindow({
  width: 1200,
  height: 800,
  minWidth: 800,
  minHeight: 600,
  frame: false, // Custom title bar
  webPreferences: {
    preload: path.join(__dirname, '../preload/index.js'),
    sandbox: true,
    contextIsolation: true,
  },
});

// main/windows/settings-window.ts
const settingsWindow = new BrowserWindow({
  width: 600,
  height: 500,
  resizable: false,
  parent: mainWindow,
  modal: true,
});
```

</details>

---

## Navegacao Intra-Janela (SPA)

> Como funciona a navegacao dentro de cada janela?

A janela principal funciona como uma SPA (Single Page Application), com roteamento client-side identico ao de uma aplicacao web.

| Rota (in-window) | Tipo | Layout | Pagina |
|------|------|--------|--------|
| `/` | Publica | `MainLayout` | {{HomePage}} |
| `/login` | Publica | `AuthLayout` | {{LoginPage}} |
| `/dashboard` | Protegida | `AppLayout` | {{DashboardPage}} |
| `/settings` | Protegida | `AppLayout` | {{SettingsPage}} |
| `/admin/users` | Admin | `AdminLayout` | {{AdminUsersPage}} |
| {{/rota-adicional}} | {{Tipo}} | {{Layout}} | {{Pagina}} |

<!-- APPEND:rotas -->

---

## Protecao de Rotas

> Como rotas protegidas verificam autenticacao e autorizacao?

| Tipo | Guard | Redirect se Falhar |
|------|-------|--------------------|
| Publicas | Nenhum | N/A |
| Protegidas | Auth guard | `/login` |
| Admin | Auth + role check | `/dashboard` (sem permissao) ou `/login` (sem auth) |

{{Descreva a estrategia de protecao — guard client-side no renderer}}

---

## Menu Bar (Barra de Menu)

> Quais sao os menus da aplicacao?

| Menu | Itens | Atalho | Acao |
|------|-------|--------|------|
| File | New, Open, Save, Save As, Exit | Ctrl+N, Ctrl+O, Ctrl+S, Ctrl+Shift+S, Ctrl+Q | {{Acoes de arquivo}} |
| Edit | Undo, Redo, Cut, Copy, Paste | Ctrl+Z, Ctrl+Y, Ctrl+X, Ctrl+C, Ctrl+V | {{Acoes de edicao}} |
| View | Zoom In, Zoom Out, Toggle Sidebar, Fullscreen | Ctrl++, Ctrl+-, Ctrl+B, F11 | {{Acoes de visualizacao}} |
| Help | Documentation, Check for Updates, About | — | {{Acoes de ajuda}} |
| {{Menu adicional}} | {{Itens}} | {{Atalhos}} | {{Acoes}} |

<!-- APPEND:menus -->

<details>
<summary>Exemplo — Menu bar (Electron)</summary>

```typescript
const menuTemplate: MenuItemConstructorOptions[] = [
  {
    label: 'File',
    submenu: [
      { label: 'New', accelerator: 'CmdOrCtrl+N', click: () => handleNew() },
      { label: 'Open', accelerator: 'CmdOrCtrl+O', click: () => handleOpen() },
      { type: 'separator' },
      { label: 'Exit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
    ],
  },
  {
    label: 'Help',
    submenu: [
      { label: 'Check for Updates', click: () => autoUpdater.checkForUpdates() },
      { label: 'About', click: () => showAboutWindow() },
    ],
  },
];
```

</details>

---

## System Tray (Bandeja do Sistema)

> A aplicacao usa system tray?

| Aspecto | Configuracao |
|---------|-------------|
| Icone | {{Icone do app no tray}} |
| Tooltip | {{Nome da aplicacao + status}} |
| Clique simples | {{Mostrar/ocultar janela principal}} |
| Clique duplo | {{Abrir janela principal}} |

**Menu de contexto do tray:**

| Item | Acao |
|------|------|
| {{Abrir aplicacao}} | {{Mostrar janela principal}} |
| {{Status: conectado}} | {{Informativo (desabilitado)}} |
| {{Configuracoes}} | {{Abrir janela de configuracoes}} |
| {{Sair}} | {{Fechar aplicacao completamente}} |

<!-- APPEND:tray -->

---

## Layouts Compartilhados

> Quais layouts sao reutilizados entre rotas?

| Layout | Rotas que Usam | Componentes Incluidos |
|--------|----------------|-----------------------|
| `MainLayout` | `/` | {{TitleBar, Navbar, Footer}} |
| `AuthLayout` | `/login`, `/register` | {{TitleBar, Logo, Card centralizado}} |
| `AppLayout` | `/dashboard`, `/settings` | {{TitleBar, Sidebar, Navbar, Footer}} |
| `AdminLayout` | `/admin/*` | {{TitleBar, Admin Sidebar, Navbar}} |
| {{LayoutAdicional}} | {{Rotas}} | {{Componentes}} |

<!-- APPEND:layouts -->

---

## Navegacao

> Como o usuario navega entre secoes?

- Navegacao principal: {{Sidebar / Menu Bar / Tabs}}
- Breadcrumbs: {{Sim/Nao}}
- Deep linking: {{Suporte a protocol handler (ex: myapp://path)}}
- Keyboard shortcuts: {{Atalhos para navegacao rapida}}

| Elemento | Visivel em | Comportamento |
|----------|-----------|---------------|
| {{TitleBar}} | {{Todas as janelas}} | {{Drag area + controles de janela}} |
| {{Menu Bar}} | {{Janela principal}} | {{Menus de aplicacao (File, Edit, View, Help)}} |
| {{Sidebar}} | {{Area logada}} | {{Navegacao secundaria colapsavel}} |
| {{System Tray}} | {{Sempre (background)}} | {{Acesso rapido + status}} |

> Para detalhes sobre protecao de rotas e autenticacao, (ver 11-seguranca.md).

---

## Historico de Decisoes

| Data | Decisao | Motivo |
|------|---------|--------|
| {{YYYY-MM-DD}} | {{Decisao sobre janelas/navegacao}} | {{Justificativa}} |
