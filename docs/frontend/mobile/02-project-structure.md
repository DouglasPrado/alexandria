# Estrutura do Projeto

Define a organizacao de pastas, a estrategia de modularizacao e as regras de importacao do projeto mobile. Uma estrutura bem definida facilita a navegacao, reduz conflitos de merge e torna o onboarding de novos desenvolvedores mais rapido.

---

## Estrutura de Pastas

> Como o projeto esta organizado no sistema de arquivos?

```
src/
  app/                    # Screens e navegacao (Expo Router)
    (tabs)/               # Tab Navigator (bottom tabs)
      index.tsx           # Home tab
      profile.tsx         # Profile tab
      settings.tsx        # Settings tab
      _layout.tsx         # Tab layout config
    (auth)/               # Auth screens (sem tabs)
      login.tsx
      register.tsx
      forgot-password.tsx
      _layout.tsx         # Auth stack layout
    (onboarding)/         # Onboarding screens
      _layout.tsx
    _layout.tsx           # Root layout (providers, fonts, splash)
    +not-found.tsx        # 404 screen

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
    navigation/           # Componentes de navegacao (Header, TabBar)

  hooks/                  # Hooks globais
  services/               # API client e servicos
  store/                  # Estado global
  types/                  # Tipos compartilhados
  utils/                  # Utilitarios
  constants/              # Cores, espacamentos, config
  assets/                 # Imagens, fontes, icones
```

> A pasta `app/` contem apenas screens e configuracao de navegacao (Expo Router). Toda logica de negocio vive em `features/`.

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
features/
  auth/
    components/
      LoginForm.tsx
      RegisterForm.tsx
      BiometricPrompt.tsx
    hooks/
      useAuth.ts
      useLogin.ts
      useBiometric.ts
    api/
      auth-api.ts
    types/
      auth.types.ts
    utils/
      token.ts
      secure-storage.ts
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
  mobile/                 # App React Native / Expo
  admin/                  # Painel administrativo (web)

packages/
  ui/                     # Design system compartilhado
  api-client/             # Cliente de API
  config/                 # Configuracoes compartilhadas (ESLint, TS)
  utils/                  # Utilitarios compartilhados
```

| Package | Responsabilidade | Consumido por |
| --- | --- | --- |
| {{ui}} | {{Design system e componentes base}} | {{mobile, admin}} |
| {{api-client}} | {{Cliente HTTP tipado}} | {{mobile, admin}} |
| {{config}} | {{Configs de ESLint, TypeScript}} | {{Todos}} |
| {{utils}} | {{Funcoes utilitarias compartilhadas}} | {{Todos}} |

---

## Regras de Importacao

> Quais sao as regras de importacao entre modulos?

| De | Para | Permitido? | Observacao |
| --- | --- | --- | --- |
| `features/auth` | `features/billing` | Nao | Features nao importam de outras features |
| `features/auth` | `components/ui` | Sim | Componentes compartilhados sao acessiveis |
| `features/auth` | `hooks/` | Sim | Hooks globais sao acessiveis |
| `features/auth` | `services/` | Sim | API client e servicos sao compartilhados |
| `components/ui` | `features/auth` | Nao | Componentes compartilhados nao conhecem features |
| `app/` | `features/auth` | Sim | Screens importam features para montar telas |

<!-- APPEND:regras-importacao -->

> Use path aliases para importacoes limpas: `@/features/auth`, `@/components/ui`, `@/hooks`.

> Detalhes sobre camadas e dependencias: (ver 01-architecture.md)
