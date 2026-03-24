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

| Etapa | Ferramenta | Timeout | Bloqueia Merge? |
|-------|------------|---------|-----------------|
| Lint | {{ESLint}} | {{30s}} | {{Sim}} |
| Type Check | {{TypeScript}} | {{60s}} | {{Sim}} |
| Unit Tests | {{Jest}} | {{60s}} | {{Sim}} |
| Build Check | {{Metro Bundler}} | {{120s}} | {{Sim}} |
| E2E (iOS) | {{Detox / Maestro}} | {{600s}} | {{Sim (na main)}} |
| E2E (Android) | {{Detox / Maestro}} | {{600s}} | {{Sim (na main)}} |
| EAS Build | {{EAS Build}} | {{1800s}} | {{N/A}} |
| Submit | {{EAS Submit}} | {{300s}} | {{N/A}} |

<details>
<summary>Exemplo — GitHub Actions + EAS Build</summary>

```yaml
name: CI
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
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test -- --coverage

  build:
    needs: ci
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: npm ci
      - run: eas build --platform all --profile staging --non-interactive
```

</details>

---

## Build e Distribuicao

> Como o app e buildado e distribuido?

### EAS Build Profiles

| Profile | Plataforma | Uso | Distribuicao |
|---------|-----------|-----|-------------|
| development | iOS + Android | Dev client com hot reload | Instalacao local |
| staging | iOS + Android | Testes internos | TestFlight / Internal Testing |
| production | iOS + Android | Release oficial | App Store / Google Play |

### Distribuicao

| Canal | Plataforma | Ferramenta | Aprovacao |
|-------|-----------|------------|-----------|
| TestFlight | iOS | App Store Connect | {{Automatica / Manual}} |
| Internal Testing | Android | Google Play Console | {{Automatica}} |
| App Store | iOS | App Store Connect | {{Review da Apple (1-3 dias)}} |
| Google Play | Android | Google Play Console | {{Review do Google (horas-dias)}} |
| OTA Update | iOS + Android | Expo Updates | {{Sem review — apenas JS}} |

### OTA Updates (Over-The-Air)

| Aspecto | Configuracao |
|---------|-------------|
| Ferramenta | {{Expo Updates / CodePush}} |
| Quando usar | Mudancas apenas em JS/assets (sem mudanca nativa) |
| Rollout | {{Progressivo: 10% -> 50% -> 100%}} |
| Rollback | {{Automatico se crash rate > threshold}} |
| Frequencia | {{A cada fix ou feature pequena}} |

---

## Ambientes

> Quais ambientes existem?

| Ambiente | Identificador | Branch | API |
|----------|--------------|--------|----|
| Development | {{dev client}} | Local | {{http://localhost:3000}} |
| Staging | {{com.app.staging}} | {{develop}} | {{https://staging-api.app.com}} |
| Production | {{com.app}} | {{main}} | {{https://api.app.com}} |

<!-- APPEND:ambientes -->

---

## Convencoes de Codigo

> Quais sao os padroes de nomenclatura?

### Arquivos e Pastas

| Tipo | Padrao | Exemplo |
|------|--------|---------|
| Componentes | PascalCase | `UserProfile.tsx` |
| Screens | PascalCase | `DashboardScreen.tsx` |
| Hooks | camelCase com prefixo `use` | `useUser.ts` |
| Utils | camelCase | `formatDate.ts` |
| Types | PascalCase | `User.ts` |
| Constantes | UPPER_SNAKE_CASE | `API_BASE_URL` |
| Testes | mesmo nome + `.test` | `UserProfile.test.tsx` |
| Navegacao (Expo Router) | kebab-case | `forgot-password.tsx` |

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

| Ferramenta | Proposito | Configuracao |
|------------|-----------|-------------|
| ESLint | Linting de codigo | {{eslint.config.js}} |
| Prettier | Formatacao de codigo | {{.prettierrc}} |
| TypeScript | Tipagem estatica (strict mode) | {{tsconfig.json}} |
| Husky | Git hooks (pre-commit) | {{.husky/}} |
| lint-staged | Rodar lint apenas em arquivos staged | {{.lintstagedrc}} |

---

## Versionamento do App

> Como o app e versionado?

| Campo | Formato | Exemplo | Quando Incrementar |
|-------|---------|---------|-------------------|
| version | semver | `1.2.3` | Cada release |
| buildNumber (iOS) | inteiro | `42` | Cada build |
| versionCode (Android) | inteiro | `42` | Cada build |
| runtimeVersion | string | `1.2.0` | Mudanca nativa (invalida OTA) |

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

| Data | Decisao | Motivo |
|------|---------|--------|
| {{YYYY-MM-DD}} | {{Decisao sobre CI/CD ou convencoes}} | {{Justificativa}} |
