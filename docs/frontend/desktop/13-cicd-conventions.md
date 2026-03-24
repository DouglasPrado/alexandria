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
| Lint | {{ESLint}} | {{30s}} | {{Sim}} |
| Type Check | {{TypeScript}} | {{60s}} | {{Sim}} |
| Unit Tests | {{Vitest}} | {{60s}} | {{Sim}} |
| IPC Tests | {{Vitest}} | {{30s}} | {{Sim}} |
| Build | {{electron-vite / Vite + Tauri}} | {{120s}} | {{Sim}} |
| E2E | {{Playwright + Electron}} | {{300s}} | {{Sim (na main)}} |
| Package | {{electron-builder / electron-forge / tauri-action}} | {{600s}} | {{N/A}} |
| Code Signing | {{SignTool / codesign}} | {{120s}} | {{N/A}} |
| Notarization | {{Apple notarytool}} | {{300s}} | {{N/A (macOS only)}} |
| Publish | {{GitHub Releases / S3}} | {{180s}} | {{N/A}} |

<details>
<summary>Exemplo — GitHub Actions para Electron</summary>

```yaml
name: CI/CD Desktop
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
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test -- --coverage
      - run: npm run build

  package:
    if: startsWith(github.ref, 'refs/tags/v')
    needs: ci
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - run: npm run package
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          CSC_LINK: ${{ secrets.CSC_LINK }}
          CSC_KEY_PASSWORD: ${{ secrets.CSC_KEY_PASSWORD }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
      - uses: actions/upload-artifact@v4
        with:
          name: release-${{ matrix.os }}
          path: dist/*.{dmg,exe,AppImage,deb}
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
| Windows | NSIS (.exe) | {{electron-builder / electron-forge}} | Instalador com wizard |
| Windows | MSI | {{electron-builder (opcional)}} | Instalacao silenciosa para empresas |
| macOS | DMG | {{electron-builder / create-dmg}} | Drag-and-drop para Applications |
| macOS | PKG | {{electron-builder (opcional)}} | Instalacao automatica |
| Linux | AppImage | {{electron-builder}} | Executavel universal sem instalacao |
| Linux | .deb | {{electron-builder}} | Para Debian/Ubuntu |
| Linux | .rpm | {{electron-builder (opcional)}} | Para Fedora/RHEL |

---

## Auto-Update

> Como a aplicacao se atualiza?

| Aspecto | Configuracao |
|---------|-------------|
| Mecanismo | {{electron-updater / Tauri updater}} |
| Canal de distribuicao | {{GitHub Releases / S3 + CloudFront / servidor proprio}} |
| Verificacao | {{Assinatura digital + checksum SHA-256}} |
| Estrategia | {{Download em background + prompt para reiniciar}} |
| Fallback | {{Download manual via website se auto-update falhar}} |

| Canal | Publico | Frequencia de Check |
|-------|---------|---------------------|
| Stable | Todos os usuarios | {{A cada 4 horas}} |
| Beta | Usuarios beta opt-in | {{A cada 1 hora}} |
| {{Outro canal}} | {{Publico}} | {{Frequencia}} |

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
| Development | Local (`npm run dev`) | Local | {{N/A}} |
| Staging | Instalador interno | {{develop}} | {{Sim (canal beta)}} |
| Production | GitHub Releases / S3 | {{main (tags)}} | {{Sim (canal stable)}} |

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
| ESLint | Linting de codigo | {{eslint.config.js}} |
| Prettier | Formatacao de codigo | {{.prettierrc}} |
| TypeScript | Tipagem estatica (strict mode) | {{tsconfig.json}} |
| Husky | Git hooks (pre-commit) | {{.husky/}} |
| lint-staged | Rodar lint apenas em arquivos staged | {{.lintstagedrc}} |

---

## Documentacao Viva

> A documentacao e mantida dentro do repositorio?

- [ ] Storybook para componentes
- [ ] README por feature
- [ ] ADRs para decisoes tecnicas
- [ ] Este blueprint e atualizado a cada milestone

> Documentacao que nao e mantida atualizada e pior que nenhuma documentacao.

> Para estrategia de testes, (ver 09-testes.md). Para monitoramento, (ver 12-observabilidade.md).

---

## Historico de Decisoes

| Data | Decisao | Motivo |
|------|---------|--------|
| {{YYYY-MM-DD}} | {{Decisao sobre CI/CD ou convencoes}} | {{Justificativa}} |
