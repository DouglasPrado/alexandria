# Estrutura do Projeto

Define a arvore de diretorios do backend, o proposito de cada pasta e as convencoes de organizacao de arquivos.

<!-- do blueprint: 00-context.md (restricoes: monorepo pnpm workspaces) + ADR-001 -->

---

## Arvore de Diretorios

> Organizacao por modulo (NestJS modules) dentro de monorepo pnpm workspaces.

```
alexandria/                          # Raiz do monorepo
├── packages/
│   ├── core-sdk/                    # Shared kernel — crypto, chunking, hashing
│   │   ├── src/
│   │   │   ├── crypto/              # AES-256-GCM, envelope encryption, BIP-39 seed
│   │   │   ├── chunking/            # Divisao em blocos ~4MB, reassembly
│   │   │   ├── hashing/             # SHA-256 content-addressable
│   │   │   ├── consistent-hash/     # ConsistentHashRing com virtual nodes
│   │   │   ├── manifest/            # Criacao, serializacao, validacao de manifests
│   │   │   ├── vault/               # Vault encrypt/decrypt por membro
│   │   │   ├── storage-provider/    # Interface StorageProvider + implementacoes (local, s3)
│   │   │   └── index.ts             # Public API do core-sdk
│   │   ├── tests/
│   │   └── package.json
│   ├── orchestrator/                # Backend NestJS — API REST + workers
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── cluster/         # Criacao, seed, recovery
│   │   │   │   │   ├── cluster.module.ts
│   │   │   │   │   ├── cluster.controller.ts
│   │   │   │   │   ├── cluster.service.ts
│   │   │   │   │   ├── cluster.repository.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── member/          # Convite, ingresso, roles, vault
│   │   │   │   │   ├── member.module.ts
│   │   │   │   │   ├── member.controller.ts
│   │   │   │   │   ├── member.service.ts
│   │   │   │   │   ├── member.repository.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── node/            # Registro, heartbeat, drain
│   │   │   │   │   ├── node.module.ts
│   │   │   │   │   ├── node.controller.ts
│   │   │   │   │   ├── node.service.ts
│   │   │   │   │   ├── node.repository.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── file/            # Upload, galeria, download
│   │   │   │   │   ├── file.module.ts
│   │   │   │   │   ├── file.controller.ts
│   │   │   │   │   ├── file.service.ts
│   │   │   │   │   ├── file.repository.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── storage/         # Chunking, distribuicao, manifest, replicas
│   │   │   │   │   ├── storage.module.ts
│   │   │   │   │   ├── storage.service.ts
│   │   │   │   │   ├── chunk.repository.ts
│   │   │   │   │   ├── manifest.repository.ts
│   │   │   │   │   └── chunk-replica.repository.ts
│   │   │   │   ├── health/          # Alertas, scrubbing, auto-healing, GC
│   │   │   │   │   ├── health.module.ts
│   │   │   │   │   ├── health.controller.ts
│   │   │   │   │   ├── health.service.ts
│   │   │   │   │   ├── scheduler.service.ts
│   │   │   │   │   └── alert.repository.ts
│   │   │   │   └── notification/    # Email via Resend
│   │   │   │       ├── notification.module.ts
│   │   │   │       ├── email.service.ts
│   │   │   │       └── templates/
│   │   │   ├── workers/
│   │   │   │   ├── photo.worker.ts  # Pipeline de fotos (libvips/sharp)
│   │   │   │   └── video.worker.ts  # Pipeline de videos (FFmpeg)
│   │   │   ├── common/
│   │   │   │   ├── guards/          # JwtAuthGuard, RolesGuard, ThrottlerGuard
│   │   │   │   ├── interceptors/    # LoggingInterceptor, SerializerInterceptor
│   │   │   │   ├── pipes/           # ValidationPipe (class-validator)
│   │   │   │   ├── filters/         # GlobalExceptionFilter
│   │   │   │   ├── decorators/      # @Roles(), @CurrentMember(), @ClusterId()
│   │   │   │   └── types/           # Tipos compartilhados do orchestrator
│   │   │   ├── config/
│   │   │   │   ├── env.ts           # Validacao de variaveis de ambiente (class-validator)
│   │   │   │   ├── database.ts      # Prisma connection config
│   │   │   │   ├── redis.ts         # Redis/BullMQ connection config
│   │   │   │   └── app.config.ts    # ConfigModule settings
│   │   │   ├── prisma/
│   │   │   │   ├── schema.prisma    # Schema do banco
│   │   │   │   └── migrations/      # Prisma migrations
│   │   │   ├── app.module.ts        # Root module
│   │   │   └── main.ts              # Bootstrap NestJS
│   │   ├── test/
│   │   │   ├── unit/
│   │   │   ├── integration/
│   │   │   └── e2e/
│   │   └── package.json
│   └── node-agent/                  # Agente de no (app NestJS leve)
│       ├── src/
│       │   ├── heartbeat/           # Envio periodico de heartbeat
│       │   ├── storage/             # Armazenamento local de chunks
│       │   ├── scrubbing/           # Verificacao local de integridade
│       │   └── main.ts
│       └── package.json
├── docker-compose.yml               # PG18 + Redis 7 + orchestrator + web + Caddy
├── docker-compose.dev.yml           # PG18 + Redis 7 para dev local
├── Dockerfile                       # Build da imagem de producao
├── pnpm-workspace.yaml              # Workspace config
├── package.json                     # Root scripts (dev, build, test, lint)
├── tsconfig.json                    # TypeScript config base
├── .env.example                     # Template de variaveis de ambiente
├── .eslintrc.js                     # ESLint config
├── .prettierrc                      # Prettier config
├── jest.config.ts                   # Jest config (unit + integration)
└── CLAUDE.md                        # Context router para Claude Code
```

<!-- added: opensource -->
### Contributor Directory Guide

- **Where to add new features**: domain modules go in `src/modules/your-feature/`; shared utilities in `src/shared/`; new storage adapters in `src/infrastructure/storage/adapters/`
- **File naming conventions**: `kebab-case` for files; `PascalCase` for classes; `camelCase` for functions and variables; `SCREAMING_SNAKE_CASE` for constants
- **Generated files**: `prisma/client/` is auto-generated — **never edit manually**; `dist/` is the build output — **never commit**
- **Monorepo navigation**: `packages/core-sdk` is the shared cryptography/chunking library; `apps/orchestrator` is the NestJS backend; `apps/node-agent` is the node daemon; `apps/web` is the Next.js frontend

<!-- APPEND:estrutura -->

---

## Convencoes de Nomenclatura

> Como arquivos e pastas sao nomeados?

| Tipo | Convencao | Exemplo |
| --- | --- | --- |
| Modulo NestJS | kebab-case + .module.ts | cluster.module.ts |
| Controller | kebab-case + .controller.ts | cluster.controller.ts |
| Service | kebab-case + .service.ts | cluster.service.ts |
| Repository | kebab-case + .repository.ts | member.repository.ts |
| DTO | PascalCase + sufixo Dto | CreateClusterDto, ClusterResponseDto |
| Guard | PascalCase + Guard | JwtAuthGuard, RolesGuard |
| Interceptor | PascalCase + Interceptor | LoggingInterceptor |
| Pipe | PascalCase + Pipe | ValidationPipe |
| Filter | PascalCase + Filter | GlobalExceptionFilter |
| Worker | kebab-case + .worker.ts | photo.worker.ts, video.worker.ts |
| Decorator | PascalCase + decorator | @CurrentMember(), @Roles() |
| Evento | PascalCase passado | ClusterCreated, FileProcessed |
| Erro | PascalCase + Error | ClusterNotFoundError, InsufficientNodesError |
| Teste | arquivo.spec.ts | cluster.service.spec.ts |
| Migration | YYYYMMDDHHMMSS_descricao | 20260315120000_create_clusters_table |

<!-- APPEND:nomenclatura -->

---

## Organizacao por Modulo

> NestJS modules com co-locacao: cada modulo contem controller, service, repository e DTOs.

```
src/modules/{modulo}/
├── {modulo}.module.ts        # NestJS module com providers e imports
├── {modulo}.controller.ts    # HTTP endpoints
├── {modulo}.service.ts       # Logica de negocio
├── {modulo}.repository.ts    # Acesso a dados via Prisma
└── dto/
    ├── create-{modulo}.dto.ts
    ├── update-{modulo}.dto.ts
    └── {modulo}-response.dto.ts
```

> Escolha: organizacao **por modulo** (NestJS idiomatico). Cada modulo encapsula um dominio completo.

---

## Arquivos de Configuracao Raiz

> Quais arquivos de configuracao existem na raiz do projeto?

| Arquivo | Proposito |
| --- | --- |
| package.json | Scripts root: `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm lint` |
| pnpm-workspace.yaml | Define packages: core-sdk, orchestrator, node-agent |
| tsconfig.json | TypeScript base config (strict, ESNext, paths) |
| .env.example | Template: DATABASE_URL, REDIS_URL, JWT_SECRET, RESEND_API_KEY |
| docker-compose.yml | Producao: orchestrator + PG18 + Redis 7 + web + Caddy |
| docker-compose.dev.yml | Dev: PG18 + Redis 7 |
| Dockerfile | Multi-stage build (pnpm install → build → prune) |
| .eslintrc.js | ESLint + @typescript-eslint + Prettier |
| .prettierrc | Prettier config (singleQuote, trailingComma, semi) |
| jest.config.ts | Jest com ts-jest, paths, testcontainers setup |
| CLAUDE.md | Context router para Claude Code |

> (ver [03-domain.md](03-domain.md) para detalhes das entidades)
