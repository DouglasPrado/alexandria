# CI/CD e Convencoes

Define o pipeline de integracao continua, build e distribuicao do app mobile, as convencoes de codigo e a estrategia de documentacao do projeto. Convencoes consistentes reduzem friccao no code review e permitem que o time foque no que importa: entregar valor ao usuario.

---

## Pipeline CI/CD

> Qual e o pipeline de build e deploy?

```
PR Aberto
  -> lint (ESLint)
  -> type-check (TypeScript)
  -> test (Jest + RNTL)
  -> build check (Metro)

Merge na Main
  -> build (EAS Build)
  -> E2E tests (Detox / Maestro)
  -> deploy staging (TestFlight / Internal Testing)

Release
  -> build production (EAS Build)
  -> submit (App Store Connect / Google Play Console)
  -> OTA update (Expo Updates — se apenas JS)
```

| Etapa                    | Ferramenta                                | Timeout | Bloqueia Merge?           |
| ------------------------ | ----------------------------------------- | ------- | ------------------------- |
| Lint                     | ESLint (flat config)                      | 30s     | Sim                       |
| Type Check               | `pnpm tsc --noEmit` (workspace completo)  | 60s     | Sim                       |
| Unit + Integration Tests | Jest + React Native Testing Library + MSW | 120s    | Sim                       |
| Coverage gate            | Jest coverage (80% geral; 90% Core SDK)   | —       | Sim                       |
| Build Check              | `expo export` (Metro dry run)             | 120s    | Sim (na main)             |
| E2E iOS                  | Maestro (emulador iOS)                    | 600s    | Sim (merge na main)       |
| E2E Android              | Maestro (emulador Android)                | 600s    | Sim (merge na main)       |
| EAS Build (preview)      | EAS Build cloud (iOS + Android)           | 1800s   | N/A — artefato de staging |
| EAS Submit (production)  | EAS Submit → App Store / Google Play      | 300s    | N/A — manual em releases  |

<!-- do blueprint: 09-tests.md (comandos e timeouts do pipeline) -->

<details>
<summary>Exemplo — GitHub Actions + EAS Build</summary>

```yaml
name: CI — Mobile
on:
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @alexandria/mobile lint
      - run: pnpm --filter @alexandria/mobile tsc --noEmit
      - run: pnpm --filter @alexandria/mobile test --coverage
        env:
          SENTRY_DSN: '' # desabilitado em CI

  build-check:
    needs: ci
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - run: pnpm install --frozen-lockfile
      - run: eas build --platform all --profile preview --non-interactive
        working-directory: apps/mobile

  e2e:
    needs: build-check
    runs-on: macos-latest # necessario para emulador iOS
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: mobile-dev-inc/action-maestro-cloud@v1.9.7
        with:
          api-key: ${{ secrets.MAESTRO_CLOUD_API_KEY }}
          app-file: apps/mobile/builds/alexandria.ipa
          flow-file: apps/mobile/maestro/flows/
```

</details>

---

## Build e Distribuicao

> Como o app e buildado e distribuido?

### EAS Build Profiles

| Profile     | Plataforma    | Uso                       | Distribuicao                  |
| ----------- | ------------- | ------------------------- | ----------------------------- |
| development | iOS + Android | Dev client com hot reload | Instalacao local              |
| staging     | iOS + Android | Testes internos           | TestFlight / Internal Testing |
| production  | iOS + Android | Release oficial           | App Store / Google Play       |

### Distribuicao

| Canal            | Plataforma    | Ferramenta                       | Aprovacao                                                            |
| ---------------- | ------------- | -------------------------------- | -------------------------------------------------------------------- |
| TestFlight       | iOS           | EAS Submit → App Store Connect   | Automatica (Internal Testing group); External requer review da Apple |
| Internal Testing | Android       | EAS Submit → Google Play Console | Automatica (Internal Testing track)                                  |
| App Store        | iOS           | EAS Submit → App Store Connect   | Review da Apple (tipicamente 1-3 dias)                               |
| Google Play      | Android       | EAS Submit → Google Play Console | Review do Google (horas a alguns dias)                               |
| OTA Update       | iOS + Android | EAS Update                       | Sem review — apenas mudancas em JS/assets; respeita `runtimeVersion` |

### OTA Updates (Over-The-Air)

| Aspecto                        | Configuracao                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Ferramenta                     | EAS Update (Expo Updates v3)                                                                           |
| Quando usar                    | Mudancas apenas em JS/assets — sem alteracoes em modulos nativos, configs de build ou `runtimeVersion` |
| Channels                       | `preview` para QA; `production` para usuarios — promover manualmente apos validar no preview           |
| Rollback                       | Manual via EAS Dashboard — reverter para update anterior; Sentry alerta crash rate > 2% pos-update     |
| Frequencia                     | Hotfixes e features pequenas sem mudancas nativas; qualquer mudanca nativa requer EAS Build completo   |
| Verificacao de compatibilidade | `runtimeVersion` no `app.config.ts` — OTA rejeitada se versao nativa incompativel                      |

---

## Ambientes

> Quais ambientes existem?

| Ambiente    | Identificador (Bundle ID) | Branch        | API                                                                      | EAS Channel             |
| ----------- | ------------------------- | ------------- | ------------------------------------------------------------------------ | ----------------------- |
| Development | `com.alexandria.dev`      | qualquer      | `http://localhost:8080` (Orquestrador local via Docker Compose)          | — (Expo Go / dev build) |
| Preview     | `com.alexandria.preview`  | develop / PRs | Build EAS preview — API configurada via `EXPO_PUBLIC_API_URL` no channel | `preview`               |
| Production  | `com.alexandria`          | main          | `https://api.alexandria.familia.com` (VPS self-hosted)                   | `production`            |

<!-- do blueprint: 06-system-architecture.md (sem staging — time de 1 pessoa; Docker Compose local replica producao) -->

<!-- APPEND:ambientes -->

---

## Convencoes de Codigo

> Quais sao os padroes de nomenclatura?

### Arquivos e Pastas

| Tipo                    | Padrao                      | Exemplo                |
| ----------------------- | --------------------------- | ---------------------- |
| Componentes             | PascalCase                  | `UserProfile.tsx`      |
| Screens                 | PascalCase                  | `DashboardScreen.tsx`  |
| Hooks                   | camelCase com prefixo `use` | `useUser.ts`           |
| Utils                   | camelCase                   | `formatDate.ts`        |
| Types                   | PascalCase                  | `User.ts`              |
| Constantes              | UPPER_SNAKE_CASE            | `API_BASE_URL`         |
| Testes                  | mesmo nome + `.test`        | `UserProfile.test.tsx` |
| Navegacao (Expo Router) | kebab-case                  | `forgot-password.tsx`  |

### Componentes

- Nomes descritivos (`UserProfileCard`, nao `UPC`)
- Um componente por arquivo
- Props tipadas com `interface` (nao `type` alias)
- Export named (nao default) — exceto screens do Expo Router
- Todo texto dentro de `<Text>` (obrigatorio no React Native)

### Commits

- Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`
- Scope opcional: `feat(auth): add biometric login`
- Mensagem em ingles, imperativo: `add`, `fix`, `update` (nao `added`, `fixed`)

---

## Ferramentas de Qualidade

| Ferramenta  | Proposito                                           | Configuracao                                                                             |
| ----------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| ESLint      | Linting — regras Expo + React Native + TypeScript   | `eslint.config.js` (flat config) na raiz do monorepo                                     |
| Prettier    | Formatacao consistente de codigo                    | `.prettierrc` na raiz do monorepo                                                        |
| TypeScript  | Tipagem estatica com `strict: true`                 | `apps/mobile/tsconfig.json` (extends da raiz)                                            |
| Husky       | Git hooks — pre-commit e commit-msg                 | `.husky/pre-commit` executa lint-staged; `.husky/commit-msg` valida conventional commits |
| lint-staged | Lint apenas em arquivos staged (nao todo o projeto) | Configurado em `package.json` root: `*.{ts,tsx}` → eslint + prettier                     |
| Commitlint  | Valida mensagens de commit (conventional commits)   | `commitlint.config.js` na raiz do monorepo                                               |

---

## Versionamento do App

> Como o app e versionado?

| Campo                 | Formato | Exemplo | Quando Incrementar            |
| --------------------- | ------- | ------- | ----------------------------- |
| version               | semver  | `1.2.3` | Cada release                  |
| buildNumber (iOS)     | inteiro | `42`    | Cada build                    |
| versionCode (Android) | inteiro | `42`    | Cada build                    |
| runtimeVersion        | string  | `1.2.0` | Mudanca nativa (invalida OTA) |

---

## Documentacao Viva

> A documentacao e mantida dentro do repositorio?

- [ ] Storybook para componentes (React Native)
- [ ] README por feature
- [ ] ADRs para decisoes tecnicas
- [ ] Este blueprint e atualizado a cada milestone

> Documentacao que nao e mantida atualizada e pior que nenhuma documentacao.

> Para estrategia de testes, (ver 09-tests.md). Para monitoramento, (ver 12-observability.md).

---

## Historico de Decisoes

| Data       | Decisao                                                       | Motivo                                                                                                                                                                                |
| ---------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-03-24 | EAS Build + EAS Update em vez de builds locais + CodePush     | EAS Build roda em cloud (nao bloqueia maquina local), gera artefatos assinados reproduziveis e integra nativamente com EAS Update para OTA; CodePush foi descontinuado pela Microsoft |
| 2026-03-24 | Maestro para E2E em vez de Detox                              | Maestro tem sintaxe YAML sem necessidade de compilar testes, suporta iOS e Android sem configuracao separada, e integra com Maestro Cloud para rodar em CI sem emulador local         |
| 2026-03-24 | `pnpm --filter @alexandria/mobile` para comandos do monorepo  | Isola comandos ao workspace do mobile sem interferir com web/node-agent; pnpm workspaces garante hoisting correto de dependencias compartilhadas (core-sdk)                           |
| 2026-03-24 | Sem ambiente de staging dedicado                              | Time de 1 pessoa com 5-10 usuarios familiares; Docker Compose local replica producao; EAS channel `preview` substitui staging para validacao de builds                                |
| 2026-03-24 | `runtimeVersion` explicitamente gerenciado em `app.config.ts` | Controla quais OTA updates sao compativeis com qual versao nativa — previne OTA quebrar app apos mudanca de modulo nativo                                                             |
