# Janelas e Navegacao

Define a estrutura de janelas da aplicacao desktop, a estrategia de navegacao intra-janela e os padroes de menu e tray. Este documento serve como mapa central de todas as janelas e rotas do frontend desktop, garantindo que cada janela tenha proposito, layout e protecao bem definidos.

---

## Estrutura de Janelas

> Como as janelas estao organizadas?

<!-- do blueprint: desktop/00-frontend-vision.md — background-first, system tray, frameless window; desktop/01-architecture.md — Window Manager -->

| Janela            | Tipo      | Tamanho Padrao | Min Size | Resizable | Proposito                                                                  |
| ----------------- | --------- | -------------- | -------- | --------- | -------------------------------------------------------------------------- |
| Main Window       | Principal | 1280×800       | 900×600  | Sim       | Janela principal do app — galeria, sync, cluster, vault, settings como SPA |
| Onboarding Window | Modal     | 640×520        | 640×520  | Nao       | Primeiro uso: criar cluster familiar OU entrar em cluster via convite      |

> **Filosofia de janelas:** Alexandria usa uma unica janela principal (SPA) em vez de multiplas janelas. Isso reduz complexidade de estado e sincronizacao entre janelas. Apenas o onboarding e modal separado pois ocorre antes do app estar configurado.

<!-- APPEND:janelas -->

<details>
<summary>Configuracao de janelas (Electron)</summary>

```typescript
// main/windows/main-window.ts
export function createMainWindow(): BrowserWindow {
  const bounds = store.get('window.bounds') as Rectangle | undefined;

  return new BrowserWindow({
    width: bounds?.width ?? 1280,
    height: bounds?.height ?? 800,
    x: bounds?.x,
    y: bounds?.y,
    minWidth: 900,
    minHeight: 600,
    frame: false, // TitleBar customizada
    titleBarStyle: 'hiddenInset', // macOS: botoes nativos + area arrastavel
    trafficLightPosition: { x: 16, y: 16 }, // macOS: posicao dos botoes
    backgroundColor: '#F8FAFC',
    show: false, // Evita flash branco no startup
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
}

// main/windows/onboarding-window.ts
export function createOnboardingWindow(parent: BrowserWindow): BrowserWindow {
  return new BrowserWindow({
    width: 640,
    height: 520,
    resizable: false,
    parent,
    modal: true,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
}
```

</details>

---

## Navegacao Intra-Janela (SPA)

> Como funciona a navegacao dentro de cada janela?

A janela principal e uma SPA com roteamento client-side via React Router v7. O vault desbloqueado e pre-requisito para todas as rotas protegidas — o `AuthGuard` redireciona para `/unlock` se o vault estiver travado.

<!-- do blueprint: desktop/01-architecture.md — features: auth, gallery, sync, cluster, vault, settings; 08-use_cases.md — UC-001 a UC-008 -->

| Rota (in-window)     | Tipo      | Layout       | Pagina               | Observacao                                              |
| -------------------- | --------- | ------------ | -------------------- | ------------------------------------------------------- |
| `/unlock`            | Publica   | `AuthLayout` | `UnlockScreen`       | Mostrada na inicializacao se vault nao foi desbloqueado |
| `/onboarding`        | Publica   | `AuthLayout` | `OnboardingWizard`   | Primeiro uso: sem cluster configurado                   |
| `/recovery`          | Publica   | `AuthLayout` | `RecoveryPage`       | Recovery via seed phrase de 12 palavras                 |
| `/gallery`           | Protegida | `AppLayout`  | `GalleryGrid`        | Galeria principal em grid — rota padrao apos unlock     |
| `/gallery/timeline`  | Protegida | `AppLayout`  | `TimelineView`       | Fotos organizadas por data                              |
| `/gallery/albums`    | Protegida | `AppLayout`  | `AlbumList`          | Lista de albuns/eventos                                 |
| `/gallery/:fileId`   | Protegida | `AppLayout`  | `MediaViewer`        | Viewer de arquivo individual com metadados              |
| `/sync`              | Protegida | `AppLayout`  | `SyncDashboard`      | Fila de uploads, pastas monitoradas, progresso          |
| `/cluster`           | Protegida | `AppLayout`  | `ClusterHealthPanel` | Saude geral do cluster — todos os membros               |
| `/cluster/nodes`     | Admin     | `AppLayout`  | `NodeList`           | Lista de nos com status e capacidade                    |
| `/cluster/nodes/new` | Admin     | `AppLayout`  | `ProviderSetup`      | Adicionar no local, S3, R2, B2 ou VPS                   |
| `/cluster/members`   | Admin     | `AppLayout`  | `MemberList`         | Lista de membros + formulario de convite                |
| `/cluster/alerts`    | Protegida | `AppLayout`  | `AlertList`          | Alertas ativos: no offline, replicacao baixa            |
| `/vault`             | Protegida | `AppLayout`  | `VaultPage`          | Credenciais de provedores cloud e tokens                |
| `/settings`          | Protegida | `AppLayout`  | `SettingsPage`       | Tema, pastas sync, notificacoes, auto-start             |

<!-- APPEND:rotas -->

---

## Protecao de Rotas

> Como rotas protegidas verificam autenticacao e autorizacao?

| Tipo                       | Guard                                                                   | Redirect se Falhar         |
| -------------------------- | ----------------------------------------------------------------------- | -------------------------- |
| Publica                    | Nenhum                                                                  | —                          |
| Protegida (vault unlocked) | `AuthGuard` verifica `authStore.isVaultUnlocked`                        | `/unlock`                  |
| Admin (role = admin)       | `AuthGuard` + `AdminGuard` verifica `authStore.member.role === 'admin'` | `/gallery` (sem permissao) |

<!-- do blueprint: desktop/01-architecture.md — authStore, vault:unlock IPC; 02-architecture_principles.md — Zero-Knowledge -->

O guard e implementado como wrapper de rota no renderer — sem requisicao ao servidor para verificar autorizacao (o estado ja e local apos unlock):

```typescript
// renderer/features/auth/components/AuthGuard.tsx
export function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const isVaultUnlocked = useAuthStore((s) => s.isVaultUnlocked);
  const role = useAuthStore((s) => s.member?.role);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isVaultUnlocked) {
      navigate('/unlock', { replace: true });
      return;
    }
    if (requireAdmin && role !== 'admin') {
      navigate('/gallery', { replace: true });
    }
  }, [isVaultUnlocked, role, requireAdmin, navigate]);

  if (!isVaultUnlocked) return null;
  if (requireAdmin && role !== 'admin') return null;
  return <>{children}</>;
}
```

---

## Menu Bar (Barra de Menu)

> Quais sao os menus da aplicacao?

<!-- do blueprint: desktop/01-architecture.md — menu nativo; 00-frontend-vision.md — macOS primario, Windows secundario -->

| Menu               | Itens                                                                               | Atalho                      | Acao                                |
| ------------------ | ----------------------------------------------------------------------------------- | --------------------------- | ----------------------------------- |
| Alexandria (macOS) | Sobre Alexandria, Verificar Atualizacoes, Bloquear Vault, Sair                      | — / — / Cmd+L / Cmd+Q       | Acoes do app no macOS App Menu      |
| Arquivo            | Abrir galeria, Fazer upload, Adicionar pasta ao sync                                | Cmd+1 / Cmd+U / Cmd+Shift+F | Navegacao rapida e acoes de arquivo |
| Exibir             | Galeria (Grid), Galeria (Timeline), Sync, Cluster, Vault, Configuracoes, Tela Cheia | Cmd+1 a Cmd+6 / F11         | Navegacao entre secoes da SPA       |
| Cluster            | Saude do cluster, Nos, Membros, Alertas                                             | —                           | Atalhos para secao cluster (admin)  |
| Ajuda              | Documentacao, Verificar Atualizacoes (Windows/Linux), Reportar Problema, Sobre      | —                           | Suporte e informacoes               |

<!-- APPEND:menus -->

<details>
<summary>Menu bar (Electron)</summary>

```typescript
// main/menu/app-menu.ts
export function buildMenu(mainWindow: BrowserWindow): Menu {
  const isMac = process.platform === 'darwin';

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: 'Alexandria',
            submenu: [
              { label: 'Sobre Alexandria', role: 'about' as const },
              { type: 'separator' as const },
              { label: 'Verificar Atualizacoes', click: () => autoUpdater.checkForUpdates() },
              { type: 'separator' as const },
              {
                label: 'Bloquear Vault',
                accelerator: 'Cmd+L',
                click: () => mainWindow.webContents.send('vault:lock-requested'),
              },
              { type: 'separator' as const },
              { label: 'Sair', role: 'quit' as const },
            ],
          },
        ]
      : []),
    {
      label: 'Arquivo',
      submenu: [
        {
          label: 'Galeria',
          accelerator: 'CmdOrCtrl+1',
          click: () => mainWindow.webContents.send('navigate', '/gallery'),
        },
        {
          label: 'Fazer Upload',
          accelerator: 'CmdOrCtrl+U',
          click: () => mainWindow.webContents.send('navigate', '/sync'),
        },
        { type: 'separator' },
        {
          label: 'Adicionar Pasta ao Sync',
          accelerator: 'CmdOrCtrl+Shift+F',
          click: () => mainWindow.webContents.send('sync:open-folder-picker'),
        },
      ],
    },
    {
      label: 'Exibir',
      submenu: [
        {
          label: 'Galeria (Grid)',
          accelerator: 'CmdOrCtrl+1',
          click: () => mainWindow.webContents.send('navigate', '/gallery'),
        },
        {
          label: 'Timeline',
          accelerator: 'CmdOrCtrl+2',
          click: () => mainWindow.webContents.send('navigate', '/gallery/timeline'),
        },
        {
          label: 'Sync',
          accelerator: 'CmdOrCtrl+3',
          click: () => mainWindow.webContents.send('navigate', '/sync'),
        },
        {
          label: 'Cluster',
          accelerator: 'CmdOrCtrl+4',
          click: () => mainWindow.webContents.send('navigate', '/cluster'),
        },
        {
          label: 'Vault',
          accelerator: 'CmdOrCtrl+5',
          click: () => mainWindow.webContents.send('navigate', '/vault'),
        },
        {
          label: 'Configuracoes',
          accelerator: 'CmdOrCtrl+,',
          click: () => mainWindow.webContents.send('navigate', '/settings'),
        },
        { type: 'separator' },
        { label: 'Tela Cheia', role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Ajuda',
      submenu: [
        ...(!isMac
          ? [
              { label: 'Verificar Atualizacoes', click: () => autoUpdater.checkForUpdates() },
              { type: 'separator' as const },
            ]
          : []),
        {
          label: 'Reportar Problema',
          click: () => shell.openExternal('https://github.com/prado-family/alexandria/issues'),
        },
        ...(!isMac ? [{ label: 'Sobre Alexandria', role: 'about' as const }] : []),
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
}
```

</details>

---

## System Tray (Bandeja do Sistema)

> A aplicacao usa system tray?

<!-- do blueprint: desktop/00-frontend-vision.md — background-first, sync roda sem janela aberta; 01-architecture.md — TrayManager -->

| Aspecto        | Configuracao                                                                                                         |
| -------------- | -------------------------------------------------------------------------------------------------------------------- |
| Icone          | `tray-idle.png` (azul), `tray-syncing.png` (animado/girando), `tray-error.png` (vermelho), `tray-paused.png` (cinza) |
| Tooltip        | "Alexandria — Em dia" / "Alexandria — Sincronizando X arquivo(s)" / "Alexandria — Erro de sync"                      |
| Clique simples | Mostrar/ocultar janela principal (toggle)                                                                            |
| Clique duplo   | Abrir janela principal e trazer para frente                                                                          |

**Menu de contexto do tray:**

| Item                                        | Tipo        | Acao                                                              |
| ------------------------------------------- | ----------- | ----------------------------------------------------------------- |
| Abrir Alexandria                            | Acao        | Mostra e foca a janela principal                                  |
| Status: Em dia / Sincronizando X arquivo(s) | Informativo | Desabilitado — apenas exibe status atual                          |
| —                                           | Separador   | —                                                                 |
| Pausar Sync / Retomar Sync                  | Toggle      | Envia `sync:pause` ou `sync:resume` para o Sync Engine            |
| Configuracoes                               | Acao        | Abre janela principal e navega para `/settings`                   |
| —                                           | Separador   | —                                                                 |
| Sair                                        | Acao        | `app.quit()` — encerra completamente (diferente de fechar janela) |

<!-- APPEND:tray -->

<details>
<summary>System Tray (Electron)</summary>

```typescript
// main/tray/tray-manager.ts
export class TrayManager {
  private tray: Tray | null = null;
  private mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  init(): void {
    this.tray = new Tray(this.getIconPath('idle'));
    this.tray.setToolTip('Alexandria — Em dia');
    this.tray.setContextMenu(this.buildContextMenu());

    this.tray.on('click', () => this.toggleWindow());
    this.tray.on('double-click', () => this.showWindow());
  }

  updateStatus(status: 'idle' | 'syncing' | 'error' | 'paused', count?: number): void {
    if (!this.tray) return;
    this.tray.setImage(this.getIconPath(status));
    const tooltip =
      status === 'syncing' && count
        ? `Alexandria — Sincronizando ${count} arquivo(s)`
        : status === 'error'
          ? 'Alexandria — Erro de sync'
          : status === 'paused'
            ? 'Alexandria — Sync pausado'
            : 'Alexandria — Em dia';
    this.tray.setToolTip(tooltip);
    this.tray.setContextMenu(this.buildContextMenu(status));
  }

  private buildContextMenu(status: 'idle' | 'syncing' | 'error' | 'paused' = 'idle'): Menu {
    const isPaused = status === 'paused';
    return Menu.buildFromTemplate([
      { label: 'Abrir Alexandria', click: () => this.showWindow() },
      { label: `Status: ${this.statusLabel(status)}`, enabled: false },
      { type: 'separator' },
      {
        label: isPaused ? 'Retomar Sync' : 'Pausar Sync',
        click: () => this.mainWindow.webContents.send(isPaused ? 'sync:resume' : 'sync:pause'),
      },
      {
        label: 'Configuracoes',
        click: () => {
          this.showWindow();
          this.mainWindow.webContents.send('navigate', '/settings');
        },
      },
      { type: 'separator' },
      { label: 'Sair', click: () => app.quit() },
    ]);
  }

  private toggleWindow(): void {
    if (this.mainWindow.isVisible()) {
      this.mainWindow.hide();
    } else {
      this.showWindow();
    }
  }

  private showWindow(): void {
    this.mainWindow.show();
    this.mainWindow.focus();
  }

  private getIconPath(status: string): string {
    return path.join(__dirname, `../../assets/icons/tray-${status}.png`);
  }

  private statusLabel(status: string): string {
    const map: Record<string, string> = {
      idle: 'Em dia',
      syncing: 'Sincronizando',
      error: 'Erro',
      paused: 'Pausado',
    };
    return map[status] ?? status;
  }
}
```

</details>

---

## Layouts Compartilhados

> Quais layouts sao reutilizados entre rotas?

<!-- do blueprint: desktop/02-project-structure.md — renderer/components/layouts/; desktop/04-components.md — TitleBar, AppSidebar -->

| Layout       | Rotas que Usam                        | Componentes Incluidos                                                                      |
| ------------ | ------------------------------------- | ------------------------------------------------------------------------------------------ |
| `AuthLayout` | `/unlock`, `/onboarding`, `/recovery` | `TitleBar` (sem sidebar, sem menu), card centralizado, logo Alexandria                     |
| `AppLayout`  | Todas as rotas protegidas             | `TitleBar` + `AppSidebar` + area de conteudo principal + `UpdateBanner` (quando aplicavel) |

```
AppLayout
  ├── TitleBar (draggable, WindowControls no Windows/Linux)
  ├── AppSidebar
  │     ├── Logo Alexandria
  │     ├── NavItem: Galeria      (Cmd+1) ← ativo por padrao apos unlock
  │     ├── NavItem: Sync         (Cmd+3) ← badge com contagem da fila
  │     ├── NavItem: Cluster      (Cmd+4) ← badge com alertas ativos
  │     ├── NavItem: Vault        (Cmd+5)
  │     ├── Spacer (flex-grow)
  │     ├── NavItem: Configuracoes (Cmd+,)
  │     └── MemberAvatar + role badge
  └── <Outlet /> (conteudo da rota ativa)
```

<!-- APPEND:layouts -->

---

## Navegacao

> Como o usuario navega entre secoes?

- **Navegacao principal:** Sidebar com icones + labels (5 items: Galeria, Sync, Cluster, Vault, Configuracoes)
- **Breadcrumbs:** Nao — hierarquia rasa nao exige breadcrumbs
- **Deep linking:** Protocol handler `alexandria://` — ex: `alexandria://gallery`, `alexandria://sync`
- **Keyboard shortcuts:** Cmd/Ctrl+1 a +5 para features; Cmd/Ctrl+, para Settings; Cmd/Ctrl+L para bloquear vault

| Elemento     | Visivel em                   | Comportamento                                                                           |
| ------------ | ---------------------------- | --------------------------------------------------------------------------------------- |
| `TitleBar`   | Todas as janelas             | Drag area para mover janela; `WindowControls` no Windows/Linux; botoes nativos no macOS |
| Menu Bar     | Janela principal (OS nativo) | Menus Alexandria/Arquivo/Exibir/Cluster/Ajuda com atalhos globais                       |
| `AppSidebar` | Rotas protegidas (AppLayout) | Navegacao primaria entre features; colapsavel para modo compacto (apenas icones)        |
| System Tray  | Sempre — app em background   | Status do sync; toggle show/hide; acesso rapido a configuracoes e sair                  |

---

## Historico de Decisoes

| Data       | Decisao                                                    | Motivo                                                                                                                   |
| ---------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 2026-03-24 | SPA (React Router v7) em unica janela vs multiplas janelas | Simplicidade operacional — estado sincronizado, sem IPC entre janelas; alinhado com principio "Simplicidade Operacional" |
| 2026-03-24 | Janela frameless com TitleBar customizada                  | Permite exibir status de sync na barra de titulo; design mais moderno; area arrastavel configuravel                      |
| 2026-03-24 | Fechar janela oculta (nao fecha app)                       | App precisa continuar sincronizando em background via tray — fechar = ocultar, sair = `app.quit()`                       |
| 2026-03-24 | Vault lock como rota `/unlock` (nao modal)                 | Modal bloquearia rendering da galeria; rota garante que nenhum dado e exibido antes do unlock                            |
