# CI/CD e Convencoes

Define o pipeline de integracao continua, as convencoes de codigo e a estrategia de documentacao do projeto frontend. Convencoes consistentes reduzem friccao no code review e permitem que o time foque no que importa: entregar valor ao usuario.

<!-- do blueprint: 06-system-architecture.md (deploy) + 12-testing_strategy.md (CI) + 02-architecture_principles.md (Simplicidade Operacional) -->

---

## Pipeline CI/CD

> Qual e o pipeline de build e deploy?

```
PR Aberto
  → lint (ESLint flat config)
  → type-check (TypeScript strict)
  → test (Vitest + Testing Library + coverage)
  → build (Next.js)
  → Lighthouse CI (budget por rota)

Merge na Main
  → build
  → E2E tests (Playwright + Docker Compose)
  → deploy production (Docker → VPS via SSH)

Post-deploy
  → smoke test (health check + upload de foto de teste)
```

| Etapa | Ferramenta | Timeout | Bloqueia Merge? |
|-------|------------|---------|-----------------|
| Lint | ESLint (flat config) | 30s | Sim |
| Type Check | TypeScript (strict mode) | 60s | Sim |
| Unit + Integration | Vitest + Testing Library | 120s | Sim |
| Coverage | Vitest --coverage (v8) | 90s | Sim (thresholds: 80% lines, 70% branches) |
| Build | Next.js (turbo build) | 180s | Sim |
| Lighthouse CI | treosh/lighthouse-ci-action | 120s | Nao (report no PR) |
| E2E | Playwright (chromium + mobile) | 300s | Sim (na main) |
| Deploy | Docker build + SSH deploy | 180s | N/A |
| Smoke Test | curl health check + upload foto teste | 60s | Sim (rollback se falhar) |

### GitHub Actions — PR Pipeline

```yaml
# .github/workflows/frontend-ci.yml
name: Frontend CI
on:
  pull_request:
    paths: ['apps/web/**', 'packages/**']

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci

      # Qualidade
      - run: turbo lint --filter=web
      - run: turbo typecheck --filter=web

      # Testes
      - run: turbo test:coverage --filter=web
      - uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: apps/web/coverage/

      # Build
      - run: turbo build --filter=web

      # Performance (nao-bloqueante)
      - name: Lighthouse CI
        uses: treosh/lighthouse-ci-action@v12
        with:
          urls: |
            http://localhost:3000/login
            http://localhost:3000/gallery
          budgetPath: ./apps/web/lighthouse-budget.json
          uploadArtifacts: true
        continue-on-error: true
```

### GitHub Actions — Deploy Pipeline

```yaml
# .github/workflows/frontend-deploy.yml
name: Frontend Deploy
on:
  push:
    branches: [main]
    paths: ['apps/web/**', 'packages/**']

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: docker compose -f docker-compose.test.yml up -d
      - run: turbo test:e2e --filter=web
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: apps/web/playwright-report/

  deploy:
    needs: e2e
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker image
        run: docker build -t alexandria-web:${{ github.sha }} -f apps/web/Dockerfile .
      - name: Push to registry
        run: |
          docker tag alexandria-web:${{ github.sha }} registry.alexandria.local/web:latest
          docker push registry.alexandria.local/web:latest
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/alexandria
            docker compose pull web
            docker compose up -d web
      - name: Smoke Test
        run: |
          sleep 10
          curl -f https://app.alexandria.local/api/health || exit 1
```

---

## Ambientes

> Quais ambientes existem?

| Ambiente | URL | Branch | Deploy | Observacoes |
|----------|-----|--------|--------|-------------|
| Development | http://localhost:3000 | Local | Manual (`turbo dev`) | Docker Compose local (pg + redis + minio) |
| Production | https://app.alexandria.local | main | Automatico (merge → deploy) | VPS Contabo; Caddy como proxy reverso |

<!-- APPEND:ambientes -->

> **Sem staging:** Time de 1 pessoa, 5-10 usuarios familiares. E2E no CI substitui staging. Se necessario, Docker Compose local replica producao.

### Variaveis de ambiente

| Variavel | Dev | Production | Descricao |
|----------|-----|-----------|-----------|
| `NEXT_PUBLIC_API_URL` | http://localhost:3001/api/v1 | https://api.alexandria.local/api/v1 | Base URL do orquestrador |
| `NEXT_PUBLIC_FLAGS` | `{}` | `{}` | Feature flags JSON |
| `ALEXANDRIA_COOKIE_DOMAIN` | localhost | .alexandria.local | Dominio do cookie de auth |
| `NODE_ENV` | development | production | Ambiente Node.js |

---

## Convencoes de Codigo

> Quais sao os padroes de nomenclatura?

### Arquivos e Pastas

<!-- do blueprint: 02-project-structure.md (convencoes de nomes) -->

| Tipo | Padrao | Exemplo |
|------|--------|---------|
| Componentes React | PascalCase | `GalleryGrid.tsx`, `FilePreview.tsx` |
| Hooks | camelCase com prefixo `use` | `useFiles.ts`, `useUploadFile.ts` |
| API modules | kebab-case com sufixo `-api` | `files-api.ts`, `nodes-api.ts` |
| Types | kebab-case com sufixo `.types` | `gallery.types.ts`, `auth.types.ts` |
| Utils | kebab-case | `format-bytes.ts`, `cn.ts` |
| Stores Zustand | kebab-case com sufixo `-store` | `auth-store.ts`, `upload-store.ts` |
| Testes | mesmo nome + `.test` em `__tests__/` | `__tests__/GalleryGrid.test.tsx` |
| Testes E2E | kebab-case + `.spec` | `upload.spec.ts`, `recovery.spec.ts` |
| Pastas de features | kebab-case, singular | `auth/`, `gallery/`, `upload/` |
| Barrel exports | `index.ts` na raiz de cada feature | `features/auth/index.ts` |
| Constantes | UPPER_SNAKE_CASE | `MAX_FILE_SIZE`, `API_BASE_URL` |
| Env vars | NEXT_PUBLIC_ para client-side | `NEXT_PUBLIC_API_URL` |

### Componentes

- Nomes descritivos (`GalleryGrid`, nao `GG`; `FileUploader`, nao `Uploader`)
- Um componente por arquivo
- Props tipadas com `interface` (nao `type` alias para props)
- Export named (nao default) — exceto `page.tsx` e `layout.tsx` do Next.js
- Server Component por padrao; adicionar `"use client"` somente quando necessario
- Documentar props com JSDoc apenas para componentes do design system (shared/components/ui)

### Commits

- **Conventional Commits:** `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`, `perf:`
- **Scope opcional:** `feat(gallery): add infinite scroll`, `fix(upload): handle timeout`
- **Mensagem em ingles, imperativo:** `add`, `fix`, `update` (nao `added`, `fixed`, `updated`)
- **Corpo opcional:** explicar "por que" quando nao-obvio
- **Breaking changes:** `feat!: change auth flow` ou `BREAKING CHANGE:` no footer

```
feat(upload): add drag-and-drop file selection

Support multiple files via HTML5 drag-and-drop API.
Validates file type and size before adding to queue (RN-F4).
```

### Branches

| Padrao | Uso | Exemplo |
|--------|-----|---------|
| `main` | Producao (deploy automatico) | — |
| `feat/xxx` | Nova funcionalidade | `feat/gallery-infinite-scroll` |
| `fix/xxx` | Correcao de bug | `fix/upload-timeout-handling` |
| `refactor/xxx` | Refatoracao sem mudanca funcional | `refactor/extract-query-keys` |
| `docs/xxx` | Documentacao | `docs/update-frontend-blueprint` |

---

## Ferramentas de Qualidade

| Ferramenta | Proposito | Configuracao | Comando |
|------------|-----------|-------------|---------|
| ESLint (flat config) | Linting de codigo | `eslint.config.mjs` | `turbo lint` |
| Prettier | Formatacao de codigo | `.prettierrc` | `turbo format` |
| TypeScript | Tipagem estatica (strict mode) | `tsconfig.json` | `turbo typecheck` |
| eslint-plugin-boundaries | Enforcar regras de importacao entre camadas | Dentro do eslint.config.mjs | Automatico no lint |
| Husky | Git hooks (pre-commit) | `.husky/pre-commit` | Automatico |
| lint-staged | Rodar lint/format apenas em arquivos staged | `.lintstagedrc.json` | Automatico via Husky |

### ESLint — Regras customizadas

```javascript
// eslint.config.mjs (excerpt)
export default [
  // Regras de fronteira de importacao
  {
    plugins: { boundaries },
    rules: {
      'boundaries/element-types': ['error', {
        default: 'disallow',
        rules: [
          { from: 'features', allow: ['shared'] },
          { from: 'features', disallow: ['features'] }, // features nao importam entre si
          { from: 'shared/domain', disallow: ['shared/lib', 'features'] },
          { from: 'shared/components/ui', disallow: ['features'] },
          { from: 'app', allow: ['features', 'shared'] },
        ],
      }],
    },
  },
  // Sem console.log em producao
  { rules: { 'no-console': ['warn', { allow: ['warn', 'error'] }] } },
  // Sem any
  { rules: { '@typescript-eslint/no-explicit-any': 'error' } },
];
```

### Prettier

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "tabWidth": 2,
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### lint-staged

```json
// .lintstagedrc.json
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{css,json,md}": ["prettier --write"]
}
```

### Husky pre-commit

```bash
#!/bin/sh
# .husky/pre-commit
npx lint-staged
```

---

## Docker

### Dockerfile (apps/web)

```dockerfile
# apps/web/Dockerfile
FROM node:22-alpine AS base
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package*.json turbo.json ./
COPY apps/web/package.json apps/web/
COPY packages/*/package.json packages/*/
RUN npm ci --production=false

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN turbo build --filter=web
RUN npm prune --production

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
```

### Docker Compose (dev)

```yaml
# docker-compose.yml (excerpt — servico web)
services:
  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://orchestrator:3001/api/v1
      - NODE_ENV=production
    depends_on:
      - orchestrator
```

---

## Documentacao Viva

> A documentacao e mantida dentro do repositorio?

- [x] Storybook para componentes do design system (`turbo storybook`)
- [x] Blueprint tecnico em `docs/blueprint/` (este documento)
- [x] Frontend blueprint em `docs/frontend/` (estes documentos)
- [x] ADRs em `docs/adr/` para decisoes tecnicas
- [x] Glossario compartilhado em `docs/shared/glossary.md`
- [x] README.md na raiz com setup rapido

### Quando atualizar documentacao

| Evento | Documento a atualizar |
|--------|----------------------|
| Novo componente de UI | Storybook story + catalogo em 03-design-system.md |
| Nova feature | Secao em 02-project-structure.md (features) + 04-components.md |
| Nova rota | 07-routes.md (tabela de rotas + App Router structure) |
| Novo endpoint de API | 06-data-layer.md (hooks + DTOs) |
| Decisao tecnica relevante | ADR em docs/adr/ + referencia no blueprint |
| Mudanca de dependencia major | 13-cicd-conventions.md (ferramentas) |

> Documentacao que nao e mantida atualizada e pior que nenhuma documentacao.

> Para estrategia de testes, (ver 09-tests.md). Para monitoramento, (ver 12-observability.md).

---

## Scripts do Projeto

```json
// apps/web/package.json (scripts)
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --max-warnings 0",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "storybook": "storybook dev -p 6006",
    "storybook:build": "storybook build"
  }
}
```

### Turborepo tasks

```json
// turbo.json (excerpt)
{
  "tasks": {
    "dev": { "persistent": true, "cache": false },
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "dist/**"] },
    "lint": { "dependsOn": ["^build"] },
    "typecheck": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"] },
    "test:coverage": { "dependsOn": ["^build"] },
    "test:e2e": { "dependsOn": ["build"] }
  }
}
```

---

## Historico de Decisoes

| Data | Decisao | Motivo |
|------|---------|--------|
| 2026-03-23 | Sem staging (dev → main → prod) | Time de 1 pessoa; E2E no CI substitui staging; Docker Compose local replica producao se necessario |
| 2026-03-23 | Deploy via SSH (nao Vercel/Netlify) | Self-hosted (principio de independencia); VPS Contabo; sem dependencia de provedor de deploy |
| 2026-03-23 | ESLint flat config (nao .eslintrc) | Padrao moderno do ESLint; config como modulo ES; melhor composicao |
| 2026-03-23 | Conventional Commits obrigatorio | Changelog automatico; facilita git log; scope identifica feature afetada |
| 2026-03-23 | lint-staged + Husky | Previne codigo mal formatado antes do commit; rapido (somente staged files) |
| 2026-03-23 | Next.js standalone output para Docker | Bundle minimo (~100MB vs ~500MB full node_modules); startup rapido; imagem Docker leve |
| 2026-03-23 | Turborepo para monorepo tasks | Cache de builds; execucao paralela de lint/test/build entre workspaces |
