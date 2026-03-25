# Contributing to Alexandria

Thank you for your interest in contributing! Alexandria is an open-core project — the self-hosted core is MIT-licensed and community-driven. Every contribution, no matter how small, helps families preserve their memories.

## Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing. We are committed to fostering a welcoming and respectful community.

---

## Getting Started

### Prerequisites

- **Node.js** 22+
- **pnpm** 9+
- **Docker** + Docker Compose (for local orchestrator, PostgreSQL, Redis)
- **Git**

### Development Setup

```bash
# 1. Fork the repository on GitHub, then clone your fork
git clone https://github.com/<your-username>/alexandria.git
cd alexandria

# 2. Install dependencies
pnpm install

# 3. Start infrastructure (PostgreSQL, Redis)
docker compose up -d

# 4. Configure environment
cp apps/web/.env.example apps/web/.env.local
cp apps/orchestrator/.env.example apps/orchestrator/.env

# 5. Start the orchestrator (API on :8080)
pnpm --filter @alexandria/orchestrator dev

# 6. Start the web client (on :3000)
pnpm --filter @alexandria/web dev
```

Open [http://localhost:3000](http://localhost:3000) — the setup wizard will guide you through creating your first cluster.

### Verify Everything Works

```bash
# Run all unit tests (no Docker required)
pnpm test

# Run integration tests (requires Docker)
pnpm test:int

# Type check
pnpm typecheck

# Lint
pnpm lint
```

All commands should pass before you start making changes.

---

## How to Contribute

### Reporting Bugs

1. Search [existing issues](https://github.com/douglas-prado/alexandria/issues) to avoid duplicates
2. Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md)
3. Include: reproduction steps, expected vs actual behavior, environment details
4. Attach logs if relevant (`docker compose logs orchestrator`)

### Suggesting Features

1. Check [GitHub Discussions](https://github.com/douglas-prado/alexandria/discussions) for existing proposals
2. Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md)
3. Explain the **problem** first, then your proposed solution
4. For large features (new domain, breaking API change), open a discussion before writing code

### Good First Issues

New to the codebase? Look for issues labeled [`good first issue`](https://github.com/douglas-prado/alexandria/labels/good%20first%20issue) — these are scoped, well-documented, and mentored.

### Submitting Pull Requests

1. **Fork** the repository and create a branch from `main`:

   ```bash
   git checkout -b feat/my-feature
   ```

2. **Make your changes** — keep the scope focused. One PR per feature/fix.

3. **Write tests** for new functionality. PRs must not decrease test coverage.

4. **Run checks locally**:

   ```bash
   pnpm lint        # ESLint
   pnpm typecheck   # TypeScript strict
   pnpm test        # Unit tests
   ```

5. **Commit** using [Conventional Commits](https://www.conventionalcommits.org/):

   ```
   feat(gallery): add timeline view
   fix(upload): handle retry on 503
   docs(contributing): clarify setup steps
   refactor(core-sdk): extract chunk validation
   ```

6. **Push** and open a PR against `main`:

   ```bash
   git push origin feat/my-feature
   ```

7. Fill in the [PR template](.github/PULL_REQUEST_TEMPLATE.md). CI will run automatically.

8. **Address review feedback** — the maintainer aims to respond within 48 hours.

---

## Code Style

### General Rules

- **Language**: TypeScript strict mode (`strict: true`, `noUncheckedIndexedAccess: true`)
- **Formatting**: Prettier (printWidth: 100, singleQuote: true, trailingComma: 'all')
- **Linting**: ESLint flat config — run `pnpm lint` before committing

### Naming Conventions

| Type               | Convention                       | Example           |
| ------------------ | -------------------------------- | ----------------- |
| Components         | PascalCase                       | `GalleryGrid.tsx` |
| Hooks              | camelCase + `use` prefix         | `useFiles.ts`     |
| API modules        | kebab-case + `-api` suffix       | `files-api.ts`    |
| Types              | kebab-case + `.types` suffix     | `file.types.ts`   |
| Services (backend) | PascalCase + `Service` suffix    | `FileService`     |
| Controllers        | PascalCase + `Controller` suffix | `FileController`  |
| DTOs               | PascalCase + `Dto` suffix        | `UploadFileDto`   |

### Commit Format

```
type(scope): description

# Types: feat, fix, refactor, test, docs, chore, perf
# Breaking change: feat!: remove legacy upload endpoint
# Body (optional): add after blank line for context
```

### Branch Naming

| Pattern                  | Use           |
| ------------------------ | ------------- |
| `feat/<description>`     | New feature   |
| `fix/<description>`      | Bug fix       |
| `refactor/<description>` | Refactoring   |
| `docs/<description>`     | Documentation |

---

## Testing

Alexandria uses a layered test strategy. All contributions should include appropriate tests.

```bash
pnpm test              # Unit tests (~30s, no Docker needed)
pnpm test:int          # Integration tests (Docker required)
pnpm test:e2e          # Full E2E with Docker Compose (~10 min)
pnpm test:coverage     # Coverage report
```

### Test Conventions

- Unit tests: `*.spec.ts` alongside source files
- Integration tests: `test/integration/` (use `testcontainers` — never hit real external services)
- E2E tests: `test/e2e/`
- Use factory functions from `test/factories/` — never hardcode UUIDs or timestamps

### Coverage Requirements

- General: ≥ 80%
- Core SDK (crypto, chunking): ≥ 90%
- Domain entities: ≥ 95%
- PRs must **not decrease** existing coverage

---

## Review Process

- Every PR requires **1 approving review** from a maintainer or committer
- All CI checks must pass (lint → typecheck → unit → integration → build)
- Maintainers aim for first review within **48 hours**
- Large PRs (> 500 lines) may take longer — consider breaking them up

---

## Governance — BDFL

Alexandria follows the **Benevolent Dictator for Life (BDFL)** model. [Douglas Prado](https://github.com/douglasprado) has final decision-making authority.

For significant changes (new features, breaking changes, architecture decisions):

1. Open a **GitHub Discussion** with the `RFC` label
2. 14-day discussion period for community input
3. BDFL makes the final call and records the decision

Day-to-day contributions (bug fixes, small features, docs) don't require an RFC — just open a PR.

---

## Contributor Ladder

| Level           | Criteria                        | Responsibilities                           |
| --------------- | ------------------------------- | ------------------------------------------ |
| **Newcomer**    | First PR merged                 | Follow conventions, write tests            |
| **Contributor** | 3+ PRs merged                   | Help triage issues, review newcomer PRs    |
| **Committer**   | Sustained quality contributions | Merge PRs in their area, maintain a module |
| **Maintainer**  | Deep domain knowledge + trust   | Architecture decisions, release management |

Promotion happens organically — contributors who are consistently helpful will be invited to the next level.

---

## Recognition

Contributors are recognized in:

- **README.md** — Contributors section (powered by [All Contributors](https://allcontributors.org/))
- **Release notes** — CHANGELOG.md acknowledges contributors per release
- **GitHub** — contributor badge on your profile

---

## Questions?

- **GitHub Discussions**: [github.com/douglas-prado/alexandria/discussions](https://github.com/douglas-prado/alexandria/discussions) — questions, ideas, RFCs
- **Discord**: [discord.gg/{{invite}}](https://discord.gg/{{invite}}) — real-time community chat
- **Security issues**: see [SECURITY.md](SECURITY.md) — do NOT open public issues for vulnerabilities

---

_Alexandria is built with care for privacy, simplicity, and longevity. We're glad you're here._
