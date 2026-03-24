---
name: opensource
description: Transforms a proprietary blueprint into an opensource project. Adapts all 4 blueprints (technical, backend, frontend, business) in-place and generates root files (README, CONTRIBUTING, LICENSE, etc.) based on the user's chosen OSS model.
---

# Opensource — Transform Blueprint into an Opensource Project

You transform a project documented with proprietary blueprints into a complete opensource project. You adapt all 4 blueprints (technical, backend, frontend, business) in-place and generate the root files typical of OSS projects. All generated content MUST be in English.

## Step 1: Read All 3 Blueprints

Read ALL documents from the 3 blueprints to understand the project:

### Technical Blueprint (`docs/blueprint/`)

Read all available files, focusing on:
- `00-context.md` — actors, external systems, constraints
- `01-vision.md` — vision, problem statement, success metrics
- `06-system-architecture.md` — stack, components, deployment
- `11-build_plan.md` — deliverables, milestones, priorities
- `12-testing_strategy.md` — test pyramid, coverage
- `13-security.md` — authentication, STRIDE, OWASP
- `14-scalability.md` — caching, rate limiting
- `15-observability.md` — logs, metrics, traces
- `17-communication.md` — communication templates

### Backend Blueprint (`docs/backend/`)

Read all available files, focusing on:
- `00-backend-vision.md` — stack, patterns, principles, metrics
- `01-architecture.md` — layers, boundaries, deployment
- `02-project-structure.md` — directory tree, naming conventions
- `03-domain.md` — entities with methods and events
- `04-data-layer.md` — repositories, ORM, queries
- `05-api-contracts.md` — endpoints, DTOs, status codes
- `06-services.md` — services with detailed flows
- `07-controllers.md` — controllers and routes
- `08-middlewares.md` — request pipeline
- `09-errors.md` — exception hierarchy, error catalog
- `10-validation.md` — field rules, sanitization
- `11-permissions.md` — RBAC, ownership, JWT
- `12-events.md` — events, workers, queues, DLQ
- `13-integrations.md` — external clients, circuit breaker
- `14-tests.md` — test pyramid, scenarios, CI

### Frontend Blueprint (`docs/frontend/`)

Read all available files, focusing on:
- `01-architecture.md` — frontend architecture
- `03-design-system.md` — design system, tokens, components
- `13-cicd-conventions.md` — CI/CD, conventions

### Business Blueprint (`docs/business/`)

Read ALL 10 files:
- `00-business-context.md` — market, competition, SWOT
- `01-value-proposition.md` — value proposition
- `02-segments-personas.md` — segments, personas
- `03-channels-distribution.md` — channels, funnel, partnerships
- `04-relationships.md` — retention, support, community
- `05-revenue-model.md` — revenue, pricing, unit economics
- `06-cost-structure.md` — costs, burn rate, break-even
- `07-metrics-kpis.md` — North Star, AARRR, OKRs
- `08-marketing-strategy.md` — GTM, growth loops
- `09-operational-plan.md` — processes, team, risks

If any blueprint is missing, warn the user:

> "To transform the project into opensource, I need the filled blueprints. Missing:
> - `docs/blueprint/` — run `/blueprint` to generate
> - `docs/backend/` — run `/backend` to generate
> - `docs/frontend/` — run `/frontend` to generate
> - `docs/business/` — run `/business` to generate
>
> I can continue with the available blueprints, but the transformation will be partial."

Present status table:

| Blueprint | Docs found | Status |
|-----------|-----------|--------|
| Technical | {{N}}/18 | Complete/Partial/Missing |
| Backend | {{N}}/15 | Complete/Partial/Missing |
| Frontend | {{N}}/15 | Complete/Partial/Missing |
| Business | {{N}}/10 | Complete/Partial/Missing |

## Step 2: User Questions

Ask these 5 questions. If the blueprint already provides context for an answer, pre-fill with `(from blueprint: value)`.

> "To adapt the blueprint for opensource, I need a few definitions:"

### 2.1 OSS Model

> "**Which opensource model?**
>
> 1. **Open-core** — free core, paid premium features (e.g., GitLab, Supabase, Sentry)
> 2. **Community-driven** — 100% open, community-maintained (e.g., Linux, curl, SQLite)
> 3. **Dev tool / Framework** — developer tool, plugin ecosystem (e.g., VS Code, Next.js, ESLint)
> 4. **Foundation-backed** — governed by a foundation (e.g., Kubernetes, Node.js, Apache projects)"

### 2.2 License

> "**Which license?**
>
> 1. **MIT** — permissive, no restrictions (most adoption, least protection)
> 2. **Apache 2.0** — permissive with patent protection (corporate standard)
> 3. **GPL v3** — strong copyleft (derivatives must be GPL)
> 4. **AGPL v3** — copyleft for SaaS (network use counts as distribution)
> 5. **Dual** — commercial + OSS license (e.g., BSL, SSPL + MIT)"

### 2.3 Governance

> "**Which governance model?**
>
> 1. **BDFL** — Benevolent Dictator for Life, centralized decision (e.g., Python/Guido, Linux/Linus)
> 2. **Committee** — maintainer committee with voting (e.g., Rust, Go)
> 3. **Foundation** — foundation with formal charter (e.g., Apache, CNCF, Linux Foundation)
> 4. **Meritocracy** — based on contributions, organic escalation (e.g., many npm projects)"

### 2.4 Project Name

> "**What is the project name?** (will be used in README, badges, and docs)
>
> If already defined in blueprint: (from blueprint 01-vision.md: {{name}})"

### 2.5 Community Channels

> "**Which community channels? (can choose multiple)**
>
> 1. GitHub Discussions
> 2. Discord
> 3. Slack
> 4. Own forum
> 5. Other: ___"

Wait for ALL answers before proceeding. Store as variables:
- `{{OSS_MODEL}}` — open-core | community-driven | dev-tool | foundation-backed
- `{{LICENSE}}` — MIT | Apache-2.0 | GPL-3.0 | AGPL-3.0 | Dual
- `{{GOVERNANCE}}` — BDFL | Committee | Foundation | Meritocracy
- `{{PROJECT_NAME}}` — project name
- `{{CHANNELS}}` — list of chosen channels

## Step 3: Transform Business Blueprint (Edit)

Adapt EACH of the 10 business documents in-place using **Edit tool** (NEVER Write). Preserve all existing content. Insert before `<!-- APPEND:... -->` markers when available. Mark all changes with `<!-- updated: opensource — {{OSS_MODEL}} -->`.

**IMPORTANT**: All content must be rewritten in English. Replace Portuguese content with equivalent English content.

### 3.1 `docs/business/00-business-context.md` — Business Context → Ecosystem Context

Transformations:
- **Title**: "Contexto de Negocio" → "Opensource Ecosystem Context"
- **Stage**: adapt to OSS stages (pre-release, alpha, beta, stable, mature, LTS)
- **Market**: "Mercado" → "Ecosystem". Replace TAM/SAM/SOM with: Total Addressable Developers, Active Ecosystem Users, Target Contributors
- **Competition**: "Concorrencia" → "Ecosystem Alternatives". In table, replace "Pricing" with "License" and "Market Share" with "GitHub Stars / Downloads"
- **Trends**: adapt to OSS trends (AI-assisted contributions, corporate OSS adoption, supply chain security, SBOM)
- **SWOT**: adapt for OSS:
  - Strengths: active community, permissive license, transparency
  - Weaknesses: maintainer burnout, lack of funding
  - Opportunities: corporate adoption, plugin ecosystem
  - Threats: hostile fork, competing project, sponsor abandonment
- **Assumptions**: adapt for OSS (developers will contribute, companies will sponsor, adoption curve)

### 3.2 `docs/business/01-value-proposition.md` — Value Proposition → Why Use / Why Contribute

Transformations:
- Split value proposition into 2 perspectives: **Users** and **Contributors**
- **For Users**: freedom, no vendor lock-in, full customization, community support, code auditability
- **For Contributors**: learning, portfolio, networking, impact, recognition
- **Jobs-to-be-done**: adapt for developer use cases
- **Differentials**: compare with proprietary alternatives AND other OSS projects

### 3.3 `docs/business/02-segments-personas.md` — Segments → OSS Personas

Transformations:
- Replace customer segments with:
  - **Individual Developers** — users who use the project
  - **Companies (users)** — companies that adopt in production
  - **Companies (sponsors)** — companies that sponsor/fund
  - **Maintainers** — core team that maintains the project
  - **Occasional Contributors** — sporadic contributors
- Replace ICP with "Ideal Contributor Profile" + "Ideal Adopter Profile"
- Replace personas with OSS-specific ones:
  - Hobbyist contributor
  - Corporate developer (uses at work)
  - DevRel / Developer Advocate
  - First-time contributor
  - Power user (issues, feedback, docs)
- TAM/SAM/SOM → Total Developer Market, Reachable Community, Active Contributors Target

### 3.4 `docs/business/03-channels-distribution.md` — Channels → Community Channels

Transformations:
- Replace acquisition channels with:
  - GitHub (primary — stars, forks, issues)
  - Package registries (npm, pip, crates.io, Maven)
  - Documentation site (SEO, getting started)
  - Blog / Content (technical posts, tutorials)
  - Conferences / Meetups (talks, workshops)
  - {{CHANNELS}} (Discord, Slack, etc. per user choice)
  - Social media (Twitter/X, Reddit, Hacker News, Dev.to)
- "Estimated CAC" → "Acquisition Cost" (mostly $0 for organic)
- Sales funnel → Contribution funnel:
  - Discovery → First Use → First Issue → First PR → Regular Contributor
- Customer journey → Contributor journey:
  - Discover → Install → Use → File Issue → Submit PR → Review → Merge → Become Maintainer
- Partnerships → Ecosystem integrations and partnerships

### 3.5 `docs/business/04-relationships.md` — Relationships → Community Engagement

Transformations:
- **Activation**: adapt to "first accepted contribution" or "first production deploy"
- **Lifecycle**: Newcomer → Contributor → Committer → Maintainer → TSC Member
- **Retention**: good-first-issues, mentoring programs, recognition (README credits, swag), Hacktoberfest
- **Churn signals**: inactivity, frustration with code review, ignored PRs, burnout
- **Expansion**: promote contributors to maintainers, convert users to sponsors
- **Support**: Issues (bug), Discussions (Q&A), Docs (self-service), {{CHANNELS}} (community)
- **Referral**: "tell a dev", contributor badges, adoption case studies

### 3.6 `docs/business/05-revenue-model.md` — Revenue → Sustainability Model

**This section is the most dependent on `{{OSS_MODEL}}`:**

#### If Open-core:
- Free opensource core + paid enterprise features
- Free self-hosted + paid hosted/managed
- Free community support + paid SLA
- Feature table: Community vs Pro vs Enterprise
- Unit economics: enterprise CAC, sponsor LTV, free→paid conversion rate

#### If Community-driven:
- GitHub Sponsors (individual + corporate)
- OpenCollective
- Grants (foundations, Google Summer of Code, NLnet, Sovereign Tech Fund)
- Donations (one-time + recurring)
- Bounties (IssueHunt, Polar)
- Merchandising (optional)

#### If Dev tool / Framework:
- Plugin/extension marketplace (commission)
- Premium extensions / templates
- Enterprise license (production use with SLA)
- Training / Certification
- Hosted playground / sandbox

#### If Foundation-backed:
- Membership fees (corporate tiers: Silver, Gold, Platinum)
- Corporate sponsors (logo on README, website, events)
- Government and academic grants
- Events / Conferences (sponsorship + tickets)

Common transformations for all models:
- MRR → "Monthly Funding" or "Monthly Revenue" (if open-core)
- Unit economics → Sustainability metrics: cost per maintainer, funding runway, sponsor retention
- Pricing table → Sponsorship tiers OR Feature comparison (open-core)
- Revenue projections → Funding targets (12 months)
- **NEVER invent numbers** — use `{{placeholder}}` for all financial values

### 3.7 `docs/business/06-cost-structure.md` — Costs → Project Costs

Transformations:
- **Fixed costs**:
  - CI/CD (GitHub Actions minutes, runners)
  - Hosting (docs site, registry, demo/playground)
  - Domain and CDN
  - Maintainer stipend (if funded)
  - Tools (monitoring, error tracking)
- **Variable costs**:
  - Cloud infra for hosted version (if open-core)
  - Build minutes per contributor
  - Download bandwidth
- "COGS vs OpEx" → "Infrastructure Costs vs Community Costs"
- "Commercial burn rate" → "Sustainability runway" based on current funding
- "Break-even" → "Self-sustainability point" (funding covers infra + maintainers)
- **NEVER invent numbers** — use `{{placeholder}}`

### 3.8 `docs/business/07-metrics-kpis.md` — Metrics → OSS Metrics

Transformations:
- **North Star**: adapt per model:
  - Open-core: "Monthly Active Enterprise Users"
  - Community-driven: "Active Contributors per Month"
  - Dev tool: "Weekly Active Users" or "Weekly Downloads"
  - Foundation-backed: "Production Deployments"
- **AARRR** → adapt funnel for OSS:
  - **Awareness**: GitHub stars, website visits, mentions
  - **Adoption**: installs, clones, first-time users
  - **Activation**: first successful use / first contribution
  - **Retention**: weekly active users, returning contributors
  - **Referral**: forks, mentions, "used by" count
- **Operational dashboard**:
  - GitHub stars (trend)
  - Open issues / PR merge time
  - Active contributors (30d)
  - Downloads (weekly/monthly)
  - Time to first response
  - Bus factor
  - Documentation pageviews
- **SaaS glossary** → "OSS Glossary":
  - Bus Factor, Time to First Response, PR Merge Time, Issue Close Rate, Contributor Retention Rate, MTTR (releases), Adoption Rate

### 3.9 `docs/business/08-marketing-strategy.md` — Marketing → Positioning & Awareness

Transformations:
- **Positioning**: "The open-source alternative to {{proprietary}}" or "The first {{category}} built for {{audience}}"
- **GTM**: OSS launch strategy:
  - Pre-launch: private beta with early adopters, public RFC
  - Launch: Product Hunt, Hacker News, Reddit, Twitter/X thread, blog post
  - Post-launch: conference talks, YouTube tutorials, newsletter
- **Content channels**:
  - Technical blog (how-to, architecture decisions, release notes)
  - Documentation as marketing (SEO)
  - Video tutorials / live coding
  - Comparison pages (vs alternatives)
  - Adoption case studies
- **Growth loops** (OSS):
  - Primary: Use → Issue/Feedback → Improvement → More Users
  - Secondary: Use → Blog Post/Talk → Discovery → More Users
  - Tertiary: Contribute → Learn → Tell Others → More Contributors
- Remove paid media budget → replace with "community investment" (maintainer time, swag, events)

### 3.10 `docs/business/09-operational-plan.md` — Operations → Community Operations

Transformations:
- **Core processes**:
  - Release process (semver, changelog, migration guides, release candidates)
  - RFC / Proposal process (for features affecting the API)
  - Code review SLA (target: first review within 48h)
  - Security response process (SECURITY.md, CVE, patches)
  - Issue triage (labels, priorities, stale bot)
- **Team**: replace hiring roadmap with contributor ladder:
  - Contributor → Committer → Maintainer → TSC Member
  - Promotion criteria for each level
  - Responsibilities per level
- **Governance**: apply `{{GOVERNANCE}}`:
  - **BDFL**: leader has final say, RFC for consultation
  - **Committee**: majority voting, minimum quorum
  - **Foundation**: charter, bylaws, elections
  - **Meritocracy**: sustained contributions → more responsibility
- **Infrastructure**: GitHub, CI/CD (GitHub Actions), docs hosting (Vercel/Netlify), community platform ({{CHANNELS}})
- **Timeline**: replace launch timeline with release milestones (alpha → beta → RC → v1.0 → LTS)
- **Risks**: adapt risk register for OSS:
  - Maintainer burnout (high impact, prevention: funding + team growth)
  - Hostile fork (medium impact, prevention: good governance + license)
  - License compliance (high impact, prevention: CLA/DCO + SBOM)
  - Supply chain attack (high impact, prevention: signing, provenance, SLSA)
  - Sponsor abandonment (medium impact, prevention: diversify funding)
- **Legal**: CLA vs DCO (Developer Certificate of Origin), trademark policy, contribution license

## Step 4: Adapt Technical Blueprint (Edit)

Add OSS-specific sections to technical blueprint documents using **Edit tool**. Insert before existing `<!-- APPEND:... -->` markers. Mark with `<!-- added: opensource -->`.

**IMPORTANT**: All new content must be in English.

### 4.1 `docs/blueprint/13-security.md`

Add section:

```markdown
<!-- added: opensource -->
### Vulnerability Disclosure Policy

- **Channel**: security@{{domain}} (or GitHub Security Advisories)
- **PGP**: public key available in `SECURITY.md`
- **Timeline**: response within 48h, patch within 7-30 days depending on severity
- **Coordinated Disclosure**: 90 days before public disclosure
- **CVE**: request CVE for confirmed vulnerabilities
- **Supply Chain**: dependency verification (Dependabot, Snyk), SBOM, release signing
```

### 4.2 `docs/blueprint/06-system-architecture.md`

Add section:

```markdown
<!-- added: opensource -->
### Contribution Architecture

- **Plugin points**: where third parties can extend the system
- **Extension API**: public interfaces for extensions
- **Module boundaries**: clear boundaries between internal and public modules
- **Public API surface**: which APIs are public and stabilized vs experimental
```

### 4.3 `docs/blueprint/11-build_plan.md`

Add section:

```markdown
<!-- added: opensource -->
### Public Roadmap

- **GitHub Projects**: public board with milestones
- **RFC Process**: proposal → discussion → approval → implementation
- **Community input**: feature voting via issues/discussions
- **Release cadence**: {{cadence}} (e.g., minor every 4 weeks, major biannually)
```

### 4.4 `docs/blueprint/12-testing_strategy.md`

Add section:

```markdown
<!-- added: opensource -->
### Contributor Testing Guide

- **Running tests locally**: `{{test_command}}`
- **Adding tests**: naming conventions, file placement, fixtures
- **CI checks on PRs**: lint, types, unit, integration — all must pass
- **Minimum coverage**: PRs must not decrease existing coverage
```

### 4.5 `docs/blueprint/15-observability.md`

Add section:

```markdown
<!-- added: opensource -->
### Operational Transparency

- **Status page**: {{status_url}} (if hosted service)
- **Incident communication**: public post-mortem for critical incidents
- **Open metrics**: public project health dashboard (optional)
```

### 4.6 `docs/blueprint/17-communication.md`

Add section:

```markdown
<!-- added: opensource -->
### Community Communication Templates

- **Release announcement**: title, highlights, breaking changes, migration guide, acknowledgments
- **Breaking change notice**: what changed, why, how to migrate, deprecation timeline
- **Deprecation notice**: what, when it will be removed, alternative
- **Security advisory**: severity, affected versions, mitigation, available patch
```

## Step 5: Adapt Backend Blueprint (Edit)

Add OSS-specific sections to backend blueprint documents using **Edit tool**. Insert before existing `<!-- APPEND:... -->` markers. Mark with `<!-- added: opensource -->`.

**IMPORTANT**: All new content must be in English.

### 5.1 `docs/backend/00-backend-vision.md`

Add section:

```markdown
<!-- added: opensource -->
### Opensource Backend Principles

- **Extensibility**: plugin architecture, hooks, and extension points for community contributions
- **Configuration over code**: environment-based configuration for easy deployment across environments
- **Database agnosticism**: abstraction layer allowing community to add support for different databases
- **API stability**: public API follows semver, internal APIs clearly marked as unstable
```

### 5.2 `docs/backend/01-architecture.md`

Add section:

```markdown
<!-- added: opensource -->
### Contributor Architecture Guide

- **Layer boundaries**: what belongs in each layer, how to add new modules
- **Dependency injection**: how to register new services and providers
- **Module creation**: step-by-step guide to create a new domain module
- **Architecture Decision Records**: link to ADRs for understanding past decisions
```

### 5.3 `docs/backend/02-project-structure.md`

Add section:

```markdown
<!-- added: opensource -->
### Contributor Directory Guide

- **Where to add new features**: directory conventions for new modules
- **File naming**: conventions for files, classes, and exports
- **Generated files**: which files are auto-generated and should NOT be edited manually
- **Monorepo navigation**: how packages/modules relate to each other (if applicable)
```

### 5.4 `docs/backend/05-api-contracts.md`

Add section:

```markdown
<!-- added: opensource -->
### API Contribution Guidelines

- **Endpoint conventions**: naming, versioning (`/api/v1/`), HTTP methods
- **Breaking changes**: process for proposing breaking API changes (RFC required)
- **API documentation**: OpenAPI/Swagger spec must be updated with every endpoint change
- **Backwards compatibility**: deprecation policy — minimum 2 minor versions before removal
- **Rate limiting**: default rate limits for public API, how to configure for self-hosted
```

### 5.5 `docs/backend/09-errors.md`

Add section:

```markdown
<!-- added: opensource -->
### Error Handling for Contributors

- **Adding new error codes**: naming convention, error catalog registration
- **User-facing messages**: must be translatable (i18n keys, not hardcoded strings)
- **Error documentation**: new errors must be documented in the error catalog
- **HTTP status mapping**: how domain errors map to HTTP status codes
```

### 5.6 `docs/backend/14-tests.md`

Add section:

```markdown
<!-- added: opensource -->
### Testing Guide for Contributors

- **Running tests locally**: `{{test_cmd}}` — full suite, `{{test_unit_cmd}}` — unit only
- **Writing tests**: naming conventions (`*.test.ts` / `*.spec.ts`), directory placement
- **Test fixtures**: how to create and use shared fixtures and factories
- **Database tests**: use test containers or in-memory DB, never hit external services
- **CI pipeline**: all PRs run lint → typecheck → unit → integration → e2e
- **Coverage requirement**: PRs must not decrease existing coverage percentage
```

### 5.7 `docs/backend/11-permissions.md`

Add section:

```markdown
<!-- added: opensource -->
### Authentication & Authorization for Self-Hosted

- **Auth providers**: how to configure different auth providers (OAuth, SAML, LDAP)
- **API keys**: how to generate and manage API keys for programmatic access
- **Role customization**: how to define custom roles and permissions for self-hosted deployments
- **Security defaults**: principle of least privilege, secure by default configuration
```

### 5.8 `docs/backend/12-events.md`

Add section:

```markdown
<!-- added: opensource -->
### Event System for Contributors

- **Adding new events**: naming convention, schema definition, registration
- **Event handlers**: how to subscribe to events and add custom handlers
- **Queue adapters**: supported queue backends (Redis, RabbitMQ, etc.), how to add new ones
- **Webhook support**: how external systems can subscribe to events via webhooks
```

### 5.9 `docs/backend/13-integrations.md`

Add section:

```markdown
<!-- added: opensource -->
### Integration Development Guide

- **Adding new integrations**: adapter pattern, interface contracts, configuration
- **Plugin system**: how to create community plugins/integrations as separate packages
- **Testing integrations**: mock adapters, contract tests, sandbox environments
- **Registry**: how to publish and discover community integrations
```

## Step 6: Adapt Frontend Blueprint (Edit)

Add OSS-specific sections to frontend blueprint documents using **Edit tool**. Mark with `<!-- added: opensource -->`.

**IMPORTANT**: All new content must be in English.

### 6.1 `docs/frontend/01-architecture.md`

Add section:

```markdown
<!-- added: opensource -->
### Contributor Setup Guide

- **Prerequisites**: Node.js {{version}}, {{package_manager}}
- **Clone + Install**: `git clone ... && {{install_cmd}}`
- **Dev server**: `{{dev_cmd}}`
- **Environment variables**: copy `.env.example` → `.env.local`
- **Troubleshooting**: common issues and solutions
```

### 6.2 `docs/frontend/13-cicd-conventions.md` (if exists)

Add section:

```markdown
<!-- added: opensource -->
### CI for Contributors

- **Automated PR checks**: lint, typecheck, unit tests, build
- **Preview deploys**: each PR generates an automatic preview (Vercel/Netlify)
- **Auto labels**: PR size (S/M/L/XL), affected area
- **Stale bot**: issues/PRs without activity for 30 days are marked stale
- **Auto-merge**: Dependabot PRs with passing tests
```

### 6.3 `docs/frontend/03-design-system.md`

Add section:

```markdown
<!-- added: opensource -->
### Design System for Contributors

- **Adding components**: create in `{{components_path}}`, add story, add tests
- **Storybook**: `{{storybook_cmd}}` to view isolated components
- **Design tokens**: how to use and when to create new tokens
- **Visual regression**: comparative screenshots on PRs (if configured)
```

## Step 7: Generate Root Files (Write)

Create the following files at the project root using **Write tool**. These are NEW files — they don't exist in the project yet.

### 7.1 `README.md`

If a README.md already exists, ask the user:

> "A README.md already exists. Would you like to:
> 1. **Replace** with the opensource README
> 2. **Merge** — add OSS sections to the existing README
> 3. **Skip** — keep the current README"

Opensource README structure:

```markdown
# {{PROJECT_NAME}}

<!-- Badges -->
[![License](https://img.shields.io/badge/license-{{LICENSE}}-blue.svg)](LICENSE)
[![CI](https://github.com/{{org}}/{{repo}}/actions/workflows/ci.yml/badge.svg)](https://github.com/{{org}}/{{repo}}/actions)
[![npm version](https://img.shields.io/npm/v/{{package}}.svg)](https://www.npmjs.com/package/{{package}})

> {{short_description — from blueprint 01-vision.md}}

## Features

{{feature list — from blueprint 01-vision.md and 03-requirements.md}}

## Quick Start

\`\`\`bash
{{installation and basic usage commands}}
\`\`\`

## Documentation

{{link to docs — from blueprint or docs site}}

## Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting a PR.

## Community

{{links to {{CHANNELS}} — Discord, Discussions, etc.}}

## License

This project is licensed under the [{{LICENSE}}](LICENSE) license.

## Sponsors

{{sponsors section — adapt per {{OSS_MODEL}}}}
```

### 7.2 `CONTRIBUTING.md`

```markdown
# Contributing to {{PROJECT_NAME}}

Thank you for your interest in contributing! This guide will help you get started.

## Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## Getting Started

### Prerequisites
{{prerequisites — from blueprint 06-system-architecture.md}}

### Development Setup
\`\`\`bash
git clone https://github.com/{{org}}/{{repo}}.git
cd {{repo}}
{{install_cmd}}
{{dev_cmd}}
\`\`\`

## How to Contribute

### Reporting Bugs
- Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md)
- Include reproduction steps, expected vs actual behavior

### Suggesting Features
- Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md)
- Explain the problem you're trying to solve

### Submitting Pull Requests
1. Fork the repository
2. Create a branch: `git checkout -b feature/my-feature`
3. Make your changes with tests
4. Run `{{test_cmd}}` to ensure tests pass
5. Run `{{lint_cmd}}` to check code style
6. Commit with [Conventional Commits](https://www.conventionalcommits.org/): `git commit -m "feat: add new feature"`
7. Push and open a PR against `main`

## Code Style
{{conventions — from technical and frontend blueprints}}

## Testing
- Write tests for new features
- Run `{{test_cmd}}` before submitting
- PRs must not decrease test coverage

## Review Process
- PRs require {{N}} approving review(s)
- CI checks must pass
- Target: first review within 48 hours

## {{GOVERNANCE}} — Decision Making
{{adapt per chosen governance model}}

## Recognition
Contributors are recognized in:
- README.md (Contributors section)
- Release notes (changelog)
- {{additional recognition per model}}
```

### 7.3 `CODE_OF_CONDUCT.md`

Generate the full [Contributor Covenant v2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/) in English, filling in:
- `[INSERT CONTACT METHOD]` with the project's email/channel

### 7.4 `LICENSE`

If a LICENSE file already exists, ask the user:

> "A LICENSE file already exists. Would you like to:
> 1. **Replace** with {{LICENSE}}
> 2. **Skip** — keep the current license"

Generate the full license text for `{{LICENSE}}` with:
- Current year
- `{{PROJECT_NAME}}` or `{{org}}` as copyright holder
- If Dual: generate 2 files (LICENSE-OSS and LICENSE-COMMERCIAL) with explanatory note

### 7.5 `SECURITY.md`

```markdown
# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| {{current_version}} | Yes |
| < {{previous_version}} | No |

## Reporting a Vulnerability

**Please do NOT open public issues for security vulnerabilities.**

Instead, report via:
- Email: security@{{domain}}
- GitHub Security Advisories: https://github.com/{{org}}/{{repo}}/security/advisories/new

### What to Include
- Description of the vulnerability
- Steps to reproduce
- Impact assessment
- Suggested fix (if any)

### Response Timeline
- **Acknowledgment**: within 48 hours
- **Assessment**: within 7 days
- **Fix for critical**: within 14 days
- **Fix for high**: within 30 days
- **Disclosure**: 90 days after report (coordinated)

## Disclosure Policy

We follow [coordinated vulnerability disclosure](https://en.wikipedia.org/wiki/Coordinated_vulnerability_disclosure).
```

### 7.6 `.github/ISSUE_TEMPLATE/bug_report.md`

```markdown
---
name: Bug Report
about: Report a bug to help us improve
title: "[Bug]: "
labels: bug, triage
assignees: ""
---

## Description
A clear description of what the bug is.

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Environment
- OS: [e.g., macOS 15, Ubuntu 24.04]
- {{PROJECT_NAME}} version: [e.g., 1.2.3]
- Node.js version: [e.g., 22.x]
- Browser (if applicable): [e.g., Chrome 120]

## Screenshots
If applicable, add screenshots.

## Additional Context
Add any other context about the problem here.
```

### 7.7 `.github/ISSUE_TEMPLATE/feature_request.md`

```markdown
---
name: Feature Request
about: Suggest a new feature or improvement
title: "[Feature]: "
labels: enhancement
assignees: ""
---

## Problem
A clear description of the problem you're trying to solve.

## Proposed Solution
A clear description of what you'd like to happen.

## Alternatives Considered
Any alternative solutions or features you've considered.

## Additional Context
Add any other context, mockups, or examples.
```

### 7.8 `.github/ISSUE_TEMPLATE/config.yml`

```yaml
blank_issues_enabled: false
contact_links:
  - name: Questions & Discussions
    url: https://github.com/{{org}}/{{repo}}/discussions
    about: Ask questions and discuss ideas
  - name: Documentation
    url: {{docs_url}}
    about: Check the documentation before opening an issue
```

### 7.9 `.github/PULL_REQUEST_TEMPLATE.md`

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)

## Checklist
- [ ] I have read the [Contributing Guide](CONTRIBUTING.md)
- [ ] My code follows the project's code style
- [ ] I have added tests that prove my fix/feature works
- [ ] All new and existing tests pass
- [ ] I have updated the documentation (if applicable)
- [ ] My changes generate no new warnings

## Related Issues
Closes #

## Screenshots (if applicable)
```

## Step 8: Review and Adjustments

Present a complete summary of all changes:

> "**Opensource transformation complete!** Summary:
>
> | Type | File | Action | Description |
> |------|------|--------|-------------|
> | Edit | docs/business/00-business-context.md | Adapted | Context → Ecosystem |
> | Edit | docs/business/01-value-proposition.md | Adapted | Value → Use/Contribute |
> | Edit | docs/business/02-segments-personas.md | Adapted | Segments → OSS Personas |
> | Edit | docs/business/03-channels-distribution.md | Adapted | Channels → Community |
> | Edit | docs/business/04-relationships.md | Adapted | Relationships → Engagement |
> | Edit | docs/business/05-revenue-model.md | Adapted | Revenue → Sustainability |
> | Edit | docs/business/06-cost-structure.md | Adapted | Costs → Project Costs |
> | Edit | docs/business/07-metrics-kpis.md | Adapted | Metrics → OSS Metrics |
> | Edit | docs/business/08-marketing-strategy.md | Adapted | Marketing → Awareness |
> | Edit | docs/business/09-operational-plan.md | Adapted | Operations → Community Ops |
> | Edit | docs/backend/00-backend-vision.md | Section added | OSS Backend Principles |
> | Edit | docs/backend/01-architecture.md | Section added | Contributor Architecture Guide |
> | Edit | docs/backend/02-project-structure.md | Section added | Contributor Directory Guide |
> | Edit | docs/backend/05-api-contracts.md | Section added | API Contribution Guidelines |
> | Edit | docs/backend/09-errors.md | Section added | Error Handling for Contributors |
> | Edit | docs/backend/11-permissions.md | Section added | Auth for Self-Hosted |
> | Edit | docs/backend/12-events.md | Section added | Event System for Contributors |
> | Edit | docs/backend/13-integrations.md | Section added | Integration Development Guide |
> | Edit | docs/backend/14-tests.md | Section added | Testing Guide for Contributors |
> | Edit | docs/blueprint/06-system-architecture.md | Section added | Contribution Architecture |
> | Edit | docs/blueprint/11-build_plan.md | Section added | Public Roadmap |
> | Edit | docs/blueprint/12-testing_strategy.md | Section added | Contributor Testing |
> | Edit | docs/blueprint/13-security.md | Section added | Vulnerability Disclosure |
> | Edit | docs/blueprint/15-observability.md | Section added | Transparency |
> | Edit | docs/blueprint/17-communication.md | Section added | Community Templates |
> | Edit | docs/frontend/01-architecture.md | Section added | Contributor Setup |
> | Edit | docs/frontend/03-design-system.md | Section added | Design System Contrib |
> | Edit | docs/frontend/13-cicd-conventions.md | Section added | CI for Contributors |
> | Write | README.md | Created/Updated | Opensource README |
> | Write | CONTRIBUTING.md | Created | Contributing guide |
> | Write | CODE_OF_CONDUCT.md | Created | Code of conduct |
> | Write | LICENSE | Created | {{LICENSE}} |
> | Write | SECURITY.md | Created | Security policy |
> | Write | .github/ISSUE_TEMPLATE/bug_report.md | Created | Bug template |
> | Write | .github/ISSUE_TEMPLATE/feature_request.md | Created | Feature template |
> | Write | .github/ISSUE_TEMPLATE/config.yml | Created | Issue config |
> | Write | .github/PULL_REQUEST_TEMPLATE.md | Created | PR template |
>
> **Model:** {{OSS_MODEL}}
> **License:** {{LICENSE}}
> **Governance:** {{GOVERNANCE}}
>
> Would you like to adjust any document?"

Wait for feedback and apply adjustments with Edit.

## Step 9: Next Steps

> "Blueprint transformed for opensource! Recommended next steps:
>
> 1. Review the adapted documents (start with `docs/business/05-revenue-model.md` — it's the most critical)
> 2. Fill in `{{placeholders}}` with real data (repo name, org, domain, etc.)
> 3. Customize README.md with real repository badges
> 4. Configure issue templates on GitHub
> 5. Publish the repository and make the first release
>
> For spot adjustments in blueprints, run `/patch`.
> To increment a specific blueprint, run `/blueprint-increment`, `/frontend-increment`, or `/business-increment`."

---

## Critical Rules — NEVER Violate

1. **Edit for existing docs, Write ONLY for new root files**
2. **NEVER invent numbers** — financial, metrics, projections, TAM/SAM/SOM → use `{{placeholder}}` or ask the user
3. **Mark ALL changes** with `<!-- updated: opensource — {{OSS_MODEL}} -->` or `<!-- added: opensource -->`
4. **Insert before `<!-- APPEND:... -->`** markers — NEVER remove or move APPEND markers
5. **Preserve ALL existing content** — only add/adapt, never delete user sections
6. **DO NOT modify** generic example blocks inside `<details>` (unless the example is project-specific)
7. **DO NOT modify** `{{...}}` placeholders that are already templates — add new placeholders with clear context
8. **Language**: ALL generated content must be in **English**, including blueprint edits and root files

## OSS Model Adaptation Reference

| Aspect | Open-core | Community-driven | Dev tool | Foundation-backed |
|---------|-----------|-----------------|----------|-------------------|
| Revenue | Enterprise features + hosted | Sponsors + grants + donations | Marketplace + premium + training | Membership + sponsors + events |
| Personas | Users + Enterprise buyers | Contributors + power users | Plugin devs + end users | Corporate adopters + members |
| Metrics | Conversion free→paid | Active contributors | Downloads + installs | Production deployments |
| Governance | Company-led + community input | Community-led | Company-led + ecosystem | Foundation charter |
| Marketing | Comparison pages + enterprise sales | Community evangelism | DX + docs + tutorials | Case studies + conferences |
| Risks | Community trust erosion | Maintainer burnout | Ecosystem fragmentation | Bureaucracy overhead |
