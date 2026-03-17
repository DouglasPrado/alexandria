# CI/CD e Convencoes

Define o pipeline de integracao continua, as convencoes de codigo e a estrategia de documentacao do projeto frontend. Convencoes consistentes reduzem friccao no code review e permitem que o time foque no que importa: entregar valor ao usuario.

---

## Pipeline CI/CD

> Qual e o pipeline de build e deploy?

```
PR Aberto
  → lint (ESLint)
  → type-check (TypeScript)
  → test (Vitest + Testing Library)
  → build
  → preview deploy

Merge na Main
  → build
  → E2E tests (Playwright)
  → deploy production
```

| Etapa | Ferramenta | Timeout | Bloqueia Merge? |
|-------|------------|---------|-----------------|
| Lint | ESLint (flat config) | 30s | Sim |
| Type Check | TypeScript 5.x (strict mode) | 60s | Sim |
| Unit Tests | Vitest + Testing Library | 120s | Sim |
| Build | Turborepo (`turbo run build`) | 180s | Sim |
| E2E | Playwright | 300s | Sim (na main) |
| Deploy Preview | Vercel Preview Deployments | 120s | Nao |
| Deploy Production | Vercel (auto-deploy na main) | 180s | N/A |

<!-- inferido do PRD -->
> O monorepo usa Turborepo, entao o CI executa `turbo run lint type-check test build` com cache remoto para otimizar tempo de build.

<details>
<summary>Exemplo — GitHub Actions para monorepo Turborepo</summary>

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
        with:
          fetch-depth: 2  # turbo precisa do diff para --filter

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'

      - run: npm ci

      - name: Turborepo cache
        uses: actions/cache@v4
        with:
          path: .turbo
          key: turbo-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}-${{ github.sha }}
          restore-keys: |
            turbo-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}-
            turbo-${{ runner.os }}-

      - run: npx turbo run lint type-check test build --filter=...[HEAD~1]

  e2e:
    runs-on: ubuntu-latest
    needs: ci
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx turbo run build --filter=web
      - run: npx playwright test
```

</details>

---

## Ambientes

> Quais ambientes existem?

| Ambiente | URL | Branch | Deploy Automatico? |
|----------|-----|--------|--------------------|
| Development | http://localhost:3000 | Local | N/A |
| Preview | https://alexandria-pr-{N}.vercel.app | PR branches | Sim (Vercel Preview) |
| Staging | https://staging.alexandria.app | develop | Sim (merge em develop) |
| Production | https://alexandria.app | main | Sim (merge na main) |

<!-- inferido do PRD -->
> Staging aponta para uma instancia separada do orquestrador (VPS de staging) para evitar contaminacao de dados do cluster de producao. O orquestrador de staging roda em Docker com dados de teste.

**Variaveis de ambiente por ambiente:**

| Variavel | Dev | Staging | Production |
|----------|-----|---------|------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | `https://api-staging.alexandria.app` | `https://api.alexandria.app` |
| `NEXT_PUBLIC_ENVIRONMENT` | `development` | `staging` | `production` |
| `NEXT_PUBLIC_SENTRY_DSN` | — | DSN staging | DSN production |

<!-- APPEND:ambientes -->

---

## Convencoes de Codigo

> Quais sao os padroes de nomenclatura?

### Arquivos e Pastas

| Tipo | Padrao | Exemplo |
|------|--------|---------|
| Componentes | PascalCase | `UserProfile.tsx` |
| Hooks | camelCase com prefixo `use` | `useUploadPipeline.ts` |
| Utils | camelCase | `formatBytes.ts` |
| Types | camelCase com sufixo `.types` | `upload.types.ts` |
| Services | kebab-case | `media-optimizer.ts` |
| API modules | kebab-case com sufixo `-api` | `upload-api.ts` |
| Workers | kebab-case com sufixo `.worker` | `encrypt.worker.ts` |
| Constantes | UPPER_SNAKE_CASE (no conteudo) | `API_BASE_URL` |
| Testes | mesmo nome + `.test` | `useUploadPipeline.test.ts` |
| Stores | camelCase com sufixo `Store` | `clusterStore.ts` |
| Pastas | kebab-case | `core-sdk/`, `storage-provider/` |

### Componentes

- Nomes descritivos (`HealthDashboard`, nao `HD`)
- Um componente por arquivo
- Props tipadas com `interface` (nao `type` alias)
- Export named (nao default) — exceto paginas Next.js (`page.tsx`, `layout.tsx`)
- Prefixo do dominio quando necessario para desambiguar (`NodeCard` vs `PhotoCard`)

### Commits

- Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`
- Scope obrigatorio para monorepo: `feat(web): add gallery grid`, `fix(core-sdk): chunk hash collision`
- Scopes validos: `web`, `desktop`, `mobile`, `core-sdk`, `ui`, `config`, `utils`, `ci`, `docs`
- Mensagem em ingles, imperativo: `add`, `fix`, `update` (nao `added`, `fixed`)
- Corpo do commit para contexto adicional quando necessario

### Branches

- `feat/<scope>-<descricao>` — nova funcionalidade (`feat/web-gallery-timeline`)
- `fix/<scope>-<descricao>` — correcao de bug (`fix/core-sdk-chunk-hash`)
- `refactor/<scope>-<descricao>` — refatoracao (`refactor/web-upload-pipeline`)
- `chore/<descricao>` — tarefas de infra/config (`chore/update-turborepo`)

---

## Ferramentas de Qualidade

| Ferramenta | Proposito | Configuracao |
|------------|-----------|-------------|
| ESLint | Linting de codigo (flat config) | `packages/config/eslint.config.js` |
| Prettier | Formatacao de codigo | `packages/config/.prettierrc` |
| TypeScript | Tipagem estatica (strict mode) | `packages/config/tsconfig.base.json` |
| Husky | Git hooks (pre-commit, commit-msg) | `.husky/` |
| lint-staged | Rodar lint/format apenas em arquivos staged | `.lintstagedrc` |
| commitlint | Validar formato Conventional Commits | `commitlint.config.js` |

<!-- inferido do PRD -->
> Configuracoes compartilhadas vivem em `packages/config/` e sao estendidas por cada app/package, conforme definido na estrutura do monorepo.

<details>
<summary>Exemplo — lint-staged + Husky</summary>

```json
// .lintstagedrc
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,css}": ["prettier --write"]
}
```

```bash
# .husky/pre-commit
npx lint-staged

# .husky/commit-msg
npx commitlint --edit $1
```

</details>

---

## Documentacao Viva

> A documentacao e mantida dentro do repositorio?

- [x] Storybook para componentes do design system (`packages/ui`)
- [x] README por feature em `features/*/README.md` com descricao, dependencias e exemplos de uso
- [x] ADRs para decisoes tecnicas em `docs/adrs/`
- [x] Este blueprint e atualizado a cada milestone
- [x] JSDoc para funcoes publicas do `core-sdk`
- [x] Diagramas Mermaid versionados em `docs/diagrams/`

> Documentacao que nao e mantida atualizada e pior que nenhuma documentacao.

**Gatilhos de atualizacao:**

| Evento | Documentacao a atualizar |
|--------|--------------------------|
| Nova feature adicionada | README da feature, Storybook (se novos componentes), blueprint |
| Decisao arquitetural | ADR em `docs/adrs/` |
| Mudanca de API do core-sdk | JSDoc no core-sdk, README do package |
| Nova rota adicionada | `docs/frontend/07-rotas.md` |
| Mudanca de componente do design system | Storybook |

> Para estrategia de testes, (ver 09-testes.md). Para monitoramento, (ver 12-observabilidade.md).

---

## Historico de Decisoes

| Data | Decisao | Motivo |
|------|---------|--------|
| 2026-03-17 | Monorepo com Turborepo e cache remoto no CI | Compartilhar core-sdk entre web, desktop e mobile; otimizar tempo de build no CI |
| 2026-03-17 | Conventional Commits com scope obrigatorio | Facilitar changelog automatico e rastreabilidade de mudancas por package |
| 2026-03-17 | Configuracoes compartilhadas em `packages/config/` | Consistencia de lint/format/types entre todos os apps e packages |
| 2026-03-17 | Vercel para deploy do web client | Preview deployments automaticos por PR; CDN global; integracao nativa com Next.js |
| 2026-03-17 | Husky + commitlint + lint-staged | Garantir qualidade minima antes do push; evitar PRs com lint errors ou commits fora do padrao |
