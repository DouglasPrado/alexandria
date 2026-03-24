# CI/CD e Convenções

Define o pipeline de integração contínua, as convenções de código e a estratégia de documentação do projeto frontend web (Next.js 16). Convenções consistentes reduzem fricção no code review e permitem que o time foque no que importa: entregar valor ao usuário.

<!-- do blueprint: 06-system-architecture.md (deploy), 12-testing_strategy.md (pipeline CI) -->

---

## Pipeline CI/CD

> Qual é o pipeline de build e deploy?

```
PR Aberto
  → lint (ESLint flat config)
  → type-check (TypeScript strict)
  → test (Vitest + Testing Library + coverage)
  → build (Next.js 16 + Turbopack)
  → Lighthouse CI audit

Merge na Main
  → build
  → E2E tests (Playwright + Docker Compose)
  → deploy production (SSH → VPS)
  → smoke test (health check + upload de foto de teste)
```

| Etapa | Ferramenta | Timeout | Bloqueia Merge? |
|-------|------------|---------|-----------------|
| Lint | ESLint (flat config) | 30s | Sim |
| Type Check | TypeScript (strict mode) | 60s | Sim |
| Unit + Integration Tests | Vitest + Testing Library | 120s | Sim |
| Coverage Report | Vitest (v8 provider) | 120s | Sim (threshold) |
| Build | Next.js 16 (Turbopack) | 180s | Sim |
| Lighthouse CI | Lighthouse CI | 60s | Não (report only) |
| E2E | Playwright | 300s | Sim (na main) |
| Deploy | SSH + Docker Compose | 180s | N/A |
| Smoke Test | curl health + upload teste | 30s | Sim (rollback se falhar) |

<details>
<summary>Exemplo — GitHub Actions CI</summary>

```yaml
name: CI
on:
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test --coverage
      - run: pnpm build

  e2e:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    timeout-minutes: 15
    services:
      postgres:
        image: postgres:18
      redis:
        image: redis:7
      minio:
        image: minio/minio
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps
      - run: pnpm test:e2e
```

</details>

---

## Ambientes

> Quais ambientes existem?

<!-- do blueprint: 06-system-architecture.md (ambientes Dev e Prod) -->

| Ambiente | URL | Branch | Deploy Automático? | Observação |
|----------|-----|--------|--------------------|------------|
| Development | http://localhost:3000 (web) / :8080 (API) | Local | N/A | Docker Compose local: PostgreSQL + Redis + MinIO |
| Production | https://app.alexandria.local | main | Sim (após merge + E2E) | VPS Contabo/Hetzner; Caddy reverse proxy; TLS Let's Encrypt |

<!-- APPEND:ambientes -->

> **Sem staging:** Time de 1 pessoa, 5-10 usuários familiares. E2E tests no CI substituem staging. Docker Compose local replica produção.

### Deploy para Produção

```
1. Merge na main → GitHub Actions trigger
2. Build Docker image (multi-stage: builder → runner)
3. Push image para GitHub Container Registry (ghcr.io)
4. SSH para VPS → docker compose pull && docker compose up -d
5. Caddy detecta novo container e atualiza proxy automaticamente
6. Smoke test: curl /health/ready + upload foto de teste
7. Se smoke test falhar → rollback: docker compose up -d (imagem anterior)
```

---

## Convenções de Código

> Quais são os padrões de nomenclatura?

### Arquivos e Pastas

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Componentes | PascalCase | `GalleryGrid.tsx`, `UploadDropzone.tsx` |
| Hooks | camelCase com prefixo `use` | `useFiles.ts`, `useUploadQueue.ts` |
| API modules | kebab-case + `-api` suffix | `files-api.ts`, `nodes-api.ts` |
| Types | kebab-case + `.types` suffix | `file.types.ts`, `node.types.ts` |
| Utils | camelCase | `formatDate.ts`, `formatBytes.ts` |
| Stores | camelCase + `Store` suffix | `authStore.ts`, `uploadStore.ts` |
| Constantes | UPPER_SNAKE_CASE (dentro do arquivo) | `MAX_CONCURRENT_UPLOADS = 3` |
| Testes | mesmo nome + `.test` | `GalleryGrid.test.tsx`, `useFiles.test.ts` |
| Pages (App Router) | `page.tsx` (convenção Next.js) | `app/dashboard/page.tsx` |

### Componentes

- Nomes descritivos (`NodeStatusBadge`, não `NSB`)
- Um componente por arquivo
- Props tipadas com `interface` (não `type` alias)
- Export named (não default) — exceto `page.tsx` e `layout.tsx` (Next.js exige default)
- `"use client"` apenas quando necessário (estado, efeitos, event handlers)
- Componentes puros por padrão — sem side effects no corpo da função

### Commits

- **Conventional Commits:** `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`
- **Scope opcional:** `feat(gallery): add timeline view`, `fix(upload): handle retry on 503`
- **Mensagem em inglês, imperativo:** `add`, `fix`, `update` (não `added`, `fixed`)
- **Body opcional:** para contexto adicional, separado por linha em branco
- **Breaking changes:** `feat!: remove legacy upload endpoint`

### Branches

| Padrão | Uso | Exemplo |
|--------|-----|---------|
| `feat/<descricao>` | Nova funcionalidade | `feat/gallery-timeline` |
| `fix/<descricao>` | Correção de bug | `fix/upload-retry-on-503` |
| `refactor/<descricao>` | Refatoração sem mudança de comportamento | `refactor/extract-upload-store` |
| `docs/<descricao>` | Documentação | `docs/frontend-blueprint` |

---

## Ferramentas de Qualidade

| Ferramenta | Propósito | Configuração |
|------------|-----------|-------------|
| ESLint | Linting de código (flat config) | `eslint.config.js` — extends `@alexandria/config/eslint` |
| Prettier | Formatação de código | `.prettierrc` — printWidth: 100, singleQuote: true, trailingComma: 'all' |
| TypeScript | Tipagem estática (strict mode) | `tsconfig.json` — strict: true, noUncheckedIndexedAccess: true |
| Husky | Git hooks (pre-commit, commit-msg) | `.husky/pre-commit` → lint-staged; `.husky/commit-msg` → commitlint |
| lint-staged | Rodar lint/format apenas em arquivos staged | `.lintstagedrc` → ESLint + Prettier nos staged files |
| commitlint | Validar formato de commits (Conventional Commits) | `commitlint.config.js` — extends `@commitlint/config-conventional` |

### Regras ESLint Customizadas

| Regra | Configuração | Motivo |
|-------|-------------|--------|
| `no-restricted-imports` | Bloquear imports entre features | Features não importam umas das outras |
| `react/no-danger` | Error | Impedir `dangerouslySetInnerHTML` (XSS) |
| `@typescript-eslint/no-explicit-any` | Error | Forçar tipagem explícita |
| `import/no-cycle` | Error | Evitar dependências circulares |

---

## Documentação Viva

> A documentação é mantida dentro do repositório?

- [x] Este blueprint é atualizado a cada milestone
- [x] ADRs para decisões técnicas (via `/blueprint-increment`)
- [ ] Storybook para componentes (Fase 2 — quando design system estabilizar)
- [x] CLAUDE.md como guia de contexto para Claude Code
- [x] JSDoc em funções de API e hooks públicos

> Documentação que não é mantida atualizada é pior que nenhuma documentação.

> Para estratégia de testes, (ver [09-tests.md](09-tests.md)). Para monitoramento, (ver [12-observability.md](12-observability.md)).

---

## Histórico de Decisões

| Data | Decisão | Motivo |
|------|---------|--------|
| 2026-03-24 | pnpm em vez de npm/yarn | Mais rápido, disk-efficient, strict por padrão (phantom deps não permitidos) |
| 2026-03-24 | Deploy via SSH + Docker Compose (não Vercel) | Self-hosted; VPS única; sem dependência de cloud provider; alinhado com princípio de simplicidade operacional |
| 2026-03-24 | Sem staging environment | Time de 1 pessoa; E2E no CI + smoke test pós-deploy substituem staging; Docker Compose local para testes manuais |
| 2026-03-24 | ESLint flat config | Formato novo e recomendado; mais simples que .eslintrc; suporte nativo a TypeScript |
| 2026-03-24 | Conventional Commits + commitlint | Changelog automático; commits legíveis; força disciplina de mensagens |
| 2026-03-24 | Storybook adiado para Fase 2 | Design system ainda em definição; componentes mudam rápido na Fase 1; overhead de manutenção |
