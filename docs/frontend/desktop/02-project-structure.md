# Estrutura do Projeto Desktop

Define a organizacao de pastas, a estrategia de modularizacao e as regras de importacao do projeto frontend desktop. Uma estrutura bem definida facilita a navegacao, reduz conflitos de merge e torna o onboarding de novos desenvolvedores mais rapido.

---

## Estrutura de Pastas

> Como o projeto desktop esta organizado no sistema de arquivos?

```
src/
  main/                     # Main process (Electron) / Rust backend (Tauri)
    ipc/                    # IPC handlers
      user-handlers.ts
      file-handlers.ts
    menu/                   # Application menu
      app-menu.ts
    tray/                   # System tray
      tray-manager.ts
    updater/                # Auto-update logic
      auto-updater.ts
    windows/                # Gerenciamento de janelas
      main-window.ts
      settings-window.ts
    index.ts                # Entry point do main process

  preload/                  # Preload scripts (Electron)
    index.ts                # contextBridge API

  renderer/                 # UI (renderer process)
    features/               # Modulos por dominio de negocio
      {{feature-1}}/
        components/
        hooks/
        api/
        types/
        utils/
      {{feature-2}}/

    components/             # Componentes compartilhados
      ui/                   # Primitivos (Button, Input, Card)
      forms/                # Componentes de formulario
      layouts/              # Layouts reutilizaveis
      desktop/              # Componentes desktop-specific
        TitleBar.tsx
        SystemTray.tsx
        MenuBar.tsx

    hooks/                  # Hooks globais
    services/               # API client, IPC client
    store/                  # Estado global
    types/                  # Tipos compartilhados
    utils/                  # Utilitarios
    styles/                 # Estilos globais e tokens

  shared/                   # Codigo compartilhado entre main e renderer
    ipc-channels.ts         # Canais IPC tipados
    types/                  # Tipos compartilhados entre processos
```

> A pasta `main/` contem toda logica do main process. A pasta `renderer/` contem a UI e segue a mesma organizacao de um frontend web. A pasta `shared/` contem tipos e constantes usados em ambos os processos.

---

## Organizacao por Feature

> O projeto segue organizacao por feature (dominio) ou por tipo?

**Recomendado: por feature.** Organizar por feature (dominio de negocio) agrupa tudo que e relacionado no mesmo lugar — componentes, hooks, API, tipos. Isso reduz a necessidade de navegar entre pastas distantes e facilita a exclusao ou refatoracao de uma feature inteira.

| Feature | Descricao | Componentes Principais |
| --- | --- | --- |
| {{auth}} | {{Autenticacao e gestao de sessao}} | {{LoginForm, RegisterForm, AuthGuard}} |
| {{dashboard}} | {{Painel principal e metricas}} | {{DashboardGrid, MetricCard, RecentActivity}} |
| {{billing}} | {{Planos, pagamentos e faturas}} | {{PlanSelector, InvoiceList, PaymentForm}} |
| {{storage}} | {{Upload e gerenciamento de arquivos}} | {{FileUploader, FileList, FilePreview}} |
| {{Outra feature}} | {{Descricao}} | {{Componentes}} |

<!-- APPEND:features -->

<details>
<summary>Exemplo — Estrutura interna de uma feature</summary>

```
renderer/features/
  auth/
    components/
      LoginForm.tsx
      RegisterForm.tsx
      AuthGuard.tsx
    hooks/
      useAuth.ts
      useLogin.ts
    api/
      auth-api.ts
    types/
      auth.types.ts
    utils/
      token.ts
    index.ts              # Barrel export publico
```

</details>

---

## Monorepo (se aplicavel)

> O projeto utiliza monorepo? Como esta estruturado?

- [ ] Projeto unico
- [ ] Monorepo (Turborepo)
- [ ] Monorepo (Nx)
- [ ] Outro: {{especificar}}

Se monorepo:

```
apps/
  desktop/                  # App desktop (Electron / Tauri)
  web/                      # App web (se existir)
  admin/                    # Painel administrativo

packages/
  ui/                       # Design system compartilhado
  api-client/               # Cliente de API
  config/                   # Configuracoes compartilhadas (ESLint, TS, Tailwind)
  utils/                    # Utilitarios compartilhados
  shared-types/             # Tipos compartilhados entre apps
```

| Package | Responsabilidade | Consumido por |
| --- | --- | --- |
| {{ui}} | {{Design system e componentes base}} | {{desktop, web, admin}} |
| {{api-client}} | {{Cliente HTTP tipado}} | {{desktop, web, admin}} |
| {{config}} | {{Configs de ESLint, TypeScript, Tailwind}} | {{Todos}} |
| {{utils}} | {{Funcoes utilitarias compartilhadas}} | {{Todos}} |
| {{shared-types}} | {{Tipos IPC e modelos compartilhados}} | {{desktop}} |

---

## Regras de Importacao

> Quais sao as regras de importacao entre modulos?

| De | Para | Permitido? | Observacao |
| --- | --- | --- | --- |
| `renderer/features/auth` | `renderer/features/billing` | Nao | Features nao importam de outras features |
| `renderer/features/auth` | `renderer/components/ui` | Sim | Componentes compartilhados sao acessiveis |
| `renderer/features/auth` | `renderer/hooks/` | Sim | Hooks globais sao acessiveis |
| `renderer/features/auth` | `renderer/services/` | Sim | API client e IPC client sao compartilhados |
| `renderer/components/ui` | `renderer/features/auth` | Nao | Componentes compartilhados nao conhecem features |
| `renderer/*` | `main/*` | Nao | Renderer nunca importa diretamente do main process |
| `renderer/*` | `shared/*` | Sim | Tipos e constantes compartilhados sao acessiveis |
| `main/*` | `shared/*` | Sim | Tipos e constantes compartilhados sao acessiveis |

<!-- APPEND:regras-importacao -->

> Use path aliases para importacoes limpas: `@renderer/features/auth`, `@renderer/components/ui`, `@main/ipc`, `@shared/types`.

> Detalhes sobre camadas e dependencias: (ver 01-arquitetura.md)
