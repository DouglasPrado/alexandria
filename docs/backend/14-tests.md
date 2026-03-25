# Estrategia de Testes

Define a piramide de testes, ferramentas, cobertura minima e cenarios obrigatorios para o backend.

<!-- do blueprint: 12-testing_strategy.md -->

---

## Piramide de Testes

> Qual proporcao de testes por tipo?

| Tipo | Proporcao | Objetivo | Velocidade |
| --- | --- | --- | --- |
| Unitario | 70% | Regras de negocio isoladas (entities, core SDK, services) | < 1s por teste |
| Integracao | 20% | Contratos com banco, cache, filas, pipelines de midia | < 5s por teste |
| E2E | 10% | Fluxos criticos ponta a ponta (upload, recovery, auto-healing) | < 30s por teste |

---

## Ferramentas

> Quais ferramentas sao usadas para cada tipo de teste?

| Tipo | Ferramenta | Funcao |
| --- | --- | --- |
| Framework | Jest | Runner e assertions |
| Integracao | testcontainers (JS) | PostgreSQL 18, Redis 7, MinIO em Docker |
| HTTP | supertest | Testes de endpoint |
| Carga | k6 | Stress e performance |
| E2E | Playwright (web) + Jest (API) | Fluxos completos |
| Mocking | Jest mocks | Isolar dependencias |
| Cobertura | istanbul/c8 | Metricas de cobertura |
| Property-based | fast-check | Testes de propriedade para crypto |

---

## Cobertura Minima

> Quais sao os thresholds de cobertura?

| Escopo | Cobertura Minima | Justificativa |
| --- | --- | --- |
| Geral | 80% | Baseline de qualidade |
| Core SDK (crypto, chunking, hashing) | 90% | Bugs em crypto = corrupcao de dados |
| Domain entities | 95% | Regras de negocio, zero margem para bug |
| Services | 85% | Logica de orquestracao |
| Controllers | 70% | Delegam para services, menos logica |
| Fluxos criticos | 100% | Upload, recovery, auto-healing sem excecao |

---

## Cenarios Obrigatorios

> Quais cenarios DEVEM ter teste antes de ir para producao?

### E2E — Happy path dos 5 fluxos criticos

- Upload de arquivo (foto e video): upload → processamento → chunk → encrypt → distribute → confirmacao
- Download de arquivo: request → fetch chunks → decrypt → reassemble → stream
- Criacao de cluster: seed generation → master key derivation → cluster + primeiro membro
- Recovery via seed: BIP-39 seed → rebuild master key → restaurar cluster e metadata
- Auto-healing: node lost → detectar chunks afetados → re-replicar para nodes saudaveis

### Unitario — Core SDK

- AES-256-GCM encrypt/decrypt roundtrip (+ property-based com fast-check, 10k iteracoes)
- SHA-256 hashing deterministico (mesmo input = mesmo hash, sempre)
- Chunking ~4MB com edge cases (arquivo menor que 1 chunk, arquivo exatamente N chunks, arquivo com resto)
- Envelope encryption: seed → master key → file key (derivacao completa)
- Consistent hashing: proporcionalidade (distribuicao justa) e estabilidade (minima redistribuicao ao adicionar/remover node)
- BIP-39 seed generation e validacao (mnemonic valido, checksum correto, entropia suficiente)

### Integracao — Repositorios e Pipelines

- Prisma queries contra PostgreSQL real (testcontainers): CRUD de cluster, member, node, file, chunk_replica
- Pipeline foto: JPEG → WebP 1920px (sharp + testcontainers MinIO)
- Pipeline video: MP4 → 1080p H.265 (FFmpeg + testcontainers MinIO)
- Auth: JWT valido, expirado e ausente (guard de autenticacao)
- Auth: role correto e errado (guard de autorizacao)
- Recovery: seed → rebuild completo (integracao com banco real)

---

## Organizacao de Testes

> Como os testes sao organizados no filesystem?

```
test/
├── unit/
│   ├── core-sdk/
│   │   ├── crypto.spec.ts
│   │   ├── chunking.spec.ts
│   │   ├── hashing.spec.ts
│   │   ├── consistent-hash.spec.ts
│   │   ├── manifest.spec.ts
│   │   └── vault.spec.ts
│   └── services/
│       ├── cluster.service.spec.ts
│       ├── member.service.spec.ts
│       ├── node.service.spec.ts
│       ├── file.service.spec.ts
│       ├── storage.service.spec.ts
│       └── health.service.spec.ts
├── integration/
│   ├── repositories/
│   │   ├── cluster.repository.spec.ts
│   │   ├── member.repository.spec.ts
│   │   ├── node.repository.spec.ts
│   │   ├── file.repository.spec.ts
│   │   └── chunk-replica.repository.spec.ts
│   ├── pipeline/
│   │   ├── photo.pipeline.spec.ts
│   │   └── video.pipeline.spec.ts
│   └── auth/
│       ├── jwt.guard.spec.ts
│       └── roles.guard.spec.ts
└── e2e/
    ├── cluster.e2e.spec.ts
    ├── upload.e2e.spec.ts
    ├── download.e2e.spec.ts
    ├── recovery.e2e.spec.ts
    └── auto-healing.e2e.spec.ts
```

---

## Ambientes de Teste

> Quais ambientes sao usados para testes?

| Ambiente | Banco | Cache | Filas | Servicos Externos |
| --- | --- | --- | --- | --- |
| Unit | Mock | Mock | Mock | Mock |
| Integration | testcontainers (PG 18) | testcontainers (Redis 7) | In-memory BullMQ | MinIO (S3), sample media files |
| E2E | Docker Compose (PG 18) | Docker Compose (Redis 7) | Docker Compose (Redis) | MinIO + Playwright |
| Load | Docker Compose | Docker Compose | Docker Compose | k6 scripts |

---

## CI Pipeline de Testes

> Quando cada tipo de teste roda no CI?

| Etapa | Trigger | Testes | Timeout | Bloqueia Merge |
| --- | --- | --- | --- | --- |
| PR | Push/open PR | jest (unit) + eslint + prettier | 3 min | Sim |
| Merge to main | Merge | jest (unit + integration com testcontainers) | 5 min | Sim |
| Pre-deploy | Manual | E2E (Docker Compose) | 15 min | Sim |
| Post-deploy | Apos deploy | Smoke (health check + upload de foto teste) | 2 min | Sim (rollback) |
| Mensal | Cron | Disaster drill (recovery via seed) + chaos tests | 120 min | Nao (relatorio) |
| Semanal | Cron | k6 load tests | 30 min | Nao (alerta) |

**Tempo maximo de CI (PR → merge):** < 10 minutos.

---

<!-- added: opensource -->
## Testing Guide for Contributors

- **Running tests locally**:
  ```bash
  npm run test              # unit tests only (~30s, no Docker needed)
  npm run test:int          # integration tests (requires Docker for testcontainers)
  npm run test:e2e          # full E2E with Docker Compose (~10 min)
  npm run test:coverage     # coverage report
  ```
- **Writing tests**: name test files `*.spec.ts` (unit) or `*.e2e-spec.ts` (e2e); place alongside source files for unit, in `test/integration/` for integration
- **Test fixtures**: use factory functions from `test/factories/` to create test data; never hardcode UUIDs or timestamps in tests
- **Database tests**: use `testcontainers` (`PostgreSqlContainer`, `RedisContainer`) — never hit real external services in CI; each test suite spins up isolated containers
- **CI pipeline**: every PR runs `lint → typecheck → unit → integration`; E2E runs on merge to `main`
- **Coverage requirement**: PRs must not decrease existing coverage; current coverage visible in `npm run test:coverage`
