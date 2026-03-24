# CI/CD e Convencoes

Define o pipeline de integracao continua, empacotamento, distribuicao, as convencoes de codigo e a estrategia de documentacao do projeto frontend desktop. Convencoes consistentes reduzem friccao no code review e permitem que o time foque no que importa: entregar valor ao usuario.

---

## Pipeline CI/CD

> Qual e o pipeline de build e deploy?

```
PR Aberto
  → lint (ESLint)
  → type-check (TypeScript)
  → test (Vitest + Testing Library)
  → test:ipc (IPC handlers)
  → build (renderer + main)

Merge na Main
  → build
  → E2E tests (Playwright + Electron)
  → package (Windows, macOS, Linux)
  → code signing
  → notarization (macOS)
  → publish (GitHub Releases / S3)
```

| Etapa | Ferramenta | Timeout | Bloqueia Merge? |
|-------|------------|---------|-----------------|
| Lint | ESLint 9 (flat config) | 30s | Sim |
| Type Check | `tsc --noEmit` (strict mode) | 60s | Sim |
| Unit Tests | Vitest 2 + Testing Library | 60s | Sim |
| IPC Tests | Vitest 2 (mock `window.electronAPI`) | 30s | Sim |
| Build | electron-vite 3 (main + renderer + preload) | 120s | Sim |
| E2E | Playwright + `_electron` | 300s | Sim (apenas na main) |
| Package | electron-builder 25 (DMG + NSIS + AppImage) | 600s | N/A (apenas em tags v*) |
| Code Signing | SignTool (Windows) / codesign (macOS) | 120s | N/A |
| Notarization | Apple notarytool (macOS 15+) | 300s | N/A (macOS only) |
| Publish | GitHub Releases (`electron-builder --publish always`) | 180s | N/A |

<details>
<summary>Exemplo — GitHub Actions para Electron</summary>

```yaml
name: CI/CD Desktop (Alexandria)
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
    tags: ['v*']

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
          version: 9
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter desktop lint
      - run: pnpm --filter desktop type-check
      - run: pnpm --filter desktop test:ipc -- --coverage
      - run: pnpm --filter desktop test -- --coverage
      - run: pnpm --filter desktop build

  e2e:
    if: github.ref == 'refs/heads/main'
    needs: ci
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter desktop build
      - run: pnpm --filter desktop test:e2e

  package:
    if: startsWith(github.ref, 'refs/tags/v')
    needs: [ci]
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter desktop build
      - run: pnpm --filter desktop package
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          CSC_LINK: ${{ secrets.CSC_LINK }}
          CSC_KEY_PASSWORD: ${{ secrets.CSC_KEY_PASSWORD }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
          SENTRY_DSN: ${{ secrets.SENTRY_DSN }}
      - uses: actions/upload-artifact@v4
        with:
          name: release-${{ matrix.os }}
          path: apps/desktop/dist/*.{dmg,exe,AppImage,deb}
```

</details>

<details>
<summary>Exemplo — GitHub Actions para Tauri</summary>

```yaml
name: CI/CD Desktop (Tauri)
on:
  push:
    tags: ['v*']

jobs:
  release:
    strategy:
      matrix:
        platform: [macos-latest, ubuntu-latest, windows-latest]
    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - uses: dtolnay/rust-toolchain@stable
      - uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: v__VERSION__
          releaseName: 'App v__VERSION__'
          releaseBody: 'See CHANGELOG.md for details.'
```

</details>

---

## Empacotamento e Instaladores

> Quais formatos de instalador sao gerados?

| Plataforma | Formato | Ferramenta | Observacao |
|------------|---------|-----------|------------|
| Windows | NSIS (.exe) | electron-builder 25 | Instalador com wizard; suporte a instalacao silenciosa (`/S`) |
| macOS | DMG | electron-builder 25 | Drag-and-drop para Applications; requer notarization |
| Linux | AppImage | electron-builder 25 | Executavel universal sem instalacao; compativel com qualquer distro |
| Linux | .deb | electron-builder 25 | Para Debian/Ubuntu; instalacao via `dpkg -i` |

---

## Auto-Update

> Como a aplicacao se atualiza?

| Aspecto | Configuracao |
|---------|-------------|
| Mecanismo | `electron-updater` (parte do `electron-builder`) — `autoUpdater` Electron nativo |
| Canal de distribuicao | GitHub Releases — publico, auditavel, sem custo de infraestrutura |
| Verificacao | Assinatura digital (code sign) + checksum SHA-512 gerado pelo `electron-builder` |
| Estrategia | Download em background (silencioso) + `UpdateBanner` no renderer para prompt de reinicializacao |
| Fallback | Link direto para GitHub Releases no `UpdateBanner` se auto-update falhar |

| Canal | Publico | Frequencia de Check |
|-------|---------|---------------------|
| Stable | Todos os usuarios (default) | A cada 4 horas (`autoUpdater.checkForUpdatesAndNotify()`) |
| Beta | Usuarios opt-in (ativar em Settings → Beta Program) | A cada 1 hora |

---

## Code Signing e Notarization

> Como garantimos que os binarios sao confiaveis?

| Plataforma | Processo | Certificado | CI Secret |
|------------|----------|-------------|-----------|
| Windows | Authenticode signing | EV Code Signing Certificate | `CSC_LINK`, `CSC_KEY_PASSWORD` |
| macOS | codesign + notarization | Apple Developer ID | `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` |
| Linux | GPG signing | GPG key | `GPG_PRIVATE_KEY`, `GPG_PASSPHRASE` |

> macOS: Notarization e obrigatoria desde macOS 10.15 (Catalina). Binarios nao notarizados sao bloqueados pelo Gatekeeper.

---

## Ambientes

> Quais ambientes existem?

| Ambiente | Distribuicao | Branch | Auto-Update? |
|----------|-------------|--------|--------------------|
| Development | `pnpm --filter desktop dev` (electron-vite HMR) | Local | N/A |
| Beta | Instalador assinado distribuido manualmente | `develop` (tag `v*-beta`) | Sim (canal beta, check 1h) |
| Production | GitHub Releases publico | `main` (tag `v*` sem pre-release) | Sim (canal stable, check 4h) |

<!-- APPEND:ambientes -->

---

## Convencoes de Codigo

> Quais sao os padroes de nomenclatura?

### Arquivos e Pastas

| Tipo | Padrao | Exemplo |
|------|--------|---------|
| Componentes | PascalCase | `UserProfile.tsx` |
| Hooks | camelCase com prefixo `use` | `useUser.ts` |
| IPC Handlers | kebab-case | `user-handlers.ts` |
| IPC Channels | namespace:action | `user:get`, `file:save` |
| Utils | camelCase | `formatDate.ts` |
| Types | PascalCase | `User.ts` |
| Constantes | UPPER_SNAKE_CASE | `API_BASE_URL` |
| Testes | mesmo nome + `.test` | `UserProfile.test.tsx` |

### Componentes

- Nomes descritivos (`UserProfileCard`, nao `UPC`)
- Um componente por arquivo
- Props tipadas com `interface` (nao `type` alias)
- Export named (nao default)

### Commits

- Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`
- Scope opcional: `feat(auth): add OAuth login`
- Mensagem em ingles, imperativo: `add`, `fix`, `update` (nao `added`, `fixed`)

---

## Ferramentas de Qualidade

| Ferramenta | Proposito | Configuracao |
|------------|-----------|-------------|
| ESLint 9 | Linting de codigo | `apps/desktop/eslint.config.ts` (flat config, herda de `packages/config/eslint`) |
| Prettier 3 | Formatacao de codigo | `.prettierrc.json` na raiz do monorepo (compartilhado) |
| TypeScript 5 | Tipagem estatica (`strict: true`, `noUncheckedIndexedAccess`) | `apps/desktop/tsconfig.json` (extends `packages/config/tsconfig`) |
| Husky | Git hooks (pre-commit) | `.husky/pre-commit` — roda `lint-staged` |
| lint-staged | Rodar lint apenas em arquivos staged | `.lintstagedrc.json` — `eslint --fix` + `prettier --write` |

---

## Documentacao Viva

> A documentacao e mantida dentro do repositorio?

- [x] Storybook para componentes (`packages/ui` — compartilhado com web client)
- [x] README por feature em `apps/desktop/src/renderer/features/{feature}/README.md`
- [x] ADRs em `docs/blueprint/10-architecture_decisions.md`
- [x] Este blueprint e atualizado a cada milestone antes do merge na main

> Documentacao que nao e mantida atualizada e pior que nenhuma documentacao.

> Para estrategia de testes, (ver 09-testes.md). Para monitoramento, (ver 12-observabilidade.md).

---

## Historico de Decisoes

| Data | Decisao | Motivo |
|------|---------|--------|
| 2026-03-24 | pnpm workspaces para monorepo + `pnpm --filter desktop` no CI | pnpm tem linking mais eficiente que npm workspaces; `--filter` permite rodar comandos apenas no workspace relevante sem alterar outros pacotes |
| 2026-03-24 | GitHub Actions como CI/CD (sem CircleCI/GitLab) | Projeto ja hospedado no GitHub; GitHub Actions incluido no free tier para repos publicos; integracao nativa com GitHub Releases para distribuicao |
| 2026-03-24 | Job `e2e` apenas na main (nao em PRs) | E2E com Playwright+Electron requer build completo (~5-8 min); PRs validam com unit + IPC tests para feedback rapido; E2E na main garante qualidade antes do release |
