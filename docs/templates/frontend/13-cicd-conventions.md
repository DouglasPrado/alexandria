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
| Lint | {{ESLint}} | {{30s}} | {{Sim}} |
| Type Check | {{TypeScript}} | {{60s}} | {{Sim}} |
| Unit Tests | {{Vitest}} | {{60s}} | {{Sim}} |
| Build | {{Next.js}} | {{120s}} | {{Sim}} |
| E2E | {{Playwright}} | {{300s}} | {{Sim (na main)}} |
| Deploy | {{Vercel / AWS}} | {{180s}} | {{N/A}} |

<details>
<summary>Exemplo — GitHub Actions + Vercel</summary>

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
      - run: npm run build
```

</details>

---

## Ambientes

> Quais ambientes existem?

| Ambiente | URL | Branch | Deploy Automatico? |
|----------|-----|--------|--------------------|
| Development | {{http://localhost:3000}} | Local | {{N/A}} |
| Staging | {{https://staging.app.com}} | {{develop}} | {{Sim}} |
| Production | {{https://app.com}} | {{main}} | {{Sim}} |

<!-- APPEND:ambientes -->

---

## Convencoes de Codigo

> Quais sao os padroes de nomenclatura?

### Arquivos e Pastas

| Tipo | Padrao | Exemplo |
|------|--------|---------|
| Componentes | PascalCase | `UserProfile.tsx` |
| Hooks | camelCase com prefixo `use` | `useUser.ts` |
| Utils | camelCase | `formatDate.ts` |
| Types | PascalCase | `User.ts` |
| Constantes | UPPER_SNAKE_CASE | `API_BASE_URL` |
| Testes | mesmo nome + `.test` | `UserProfile.test.tsx` |

### Componentes

- Nomes descritivos (`UserProfileCard`, nao `UPC`)
- Um componente por arquivo
- Props tipadas com `interface` (nao `type` alias)
- Export named (nao default) — exceto paginas Next.js

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
