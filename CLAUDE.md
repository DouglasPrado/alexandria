# Alexandria

## Fonte de Verdade

Todo codigo DEVE implementar fielmente o que esta documentado nos blueprints e docs de implementacao.

**Hierarquia de documentacao:**

- `docs/blueprint/` — O QUE construir (fonte primaria)
- `docs/backend/` — COMO construir o backend (spec de implementacao)
- `docs/frontend/` — COMO construir o frontend (spec de implementacao)
  - `shared/` — Design system, data layer, API deps (compartilhado entre clientes)
  - `web/` — Cliente web (Next.js 16)
  - `mobile/` — Cliente mobile (React Native / Expo)
  - `desktop/` — Cliente desktop (Tauri)
- `docs/shared/` — Conectores cross-suite (glossario, mappings)
- `docs/business/` — Modelo de negocio (open-core, MIT)

**Regras inviolaveis:**

- NUNCA gere codigo sem antes ler os docs relevantes para a tarefa
- Use a linguagem ubiqua do dominio (`docs/shared/glossary.md`)
- Sempre leia `src/contracts/` antes de implementar qualquer feature
- Test-first: escreva testes ANTES da implementacao (XP)
- Consulte `docs/shared/MAPPING.md` para rastreabilidade entre docs

---

## Stack Tecnologica

| Camada           | Tecnologia                         | Versao |
| ---------------- | ---------------------------------- | ------ |
| Linguagem        | TypeScript                         | 5.x    |
| Backend          | NestJS                             | 11.x   |
| ORM              | Prisma                             | 6.x    |
| Banco principal  | PostgreSQL                         | 18     |
| Cache / Filas    | Redis + BullMQ                     | 7.x    |
| Scheduler        | @nestjs/schedule                   | latest |
| Media (fotos)    | libvips (sharp)                    | latest |
| Media (videos)   | FFmpeg                             | 7.x    |
| Crypto           | Node.js crypto + @noble/ciphers    | nativo |
| Email            | Resend                             | SDK TS |
| Storage cloud    | aws-sdk-s3 (S3/R2/B2)              | v3     |
| Logs             | pino + nestjs-pino                 | latest |
| Metricas         | Prometheus + Grafana               | latest |
| Frontend web     | Next.js 16 (App Router, Turbopack) | 16.x   |
| UI               | React + Tailwind CSS v4            | latest |
| Data fetching    | TanStack Query v5                  | 5.x    |
| State            | Zustand                            | 5.x    |
| Frontend desktop | Tauri                              | latest |
| Frontend mobile  | React Native (Expo)                | latest |
| Monorepo         | pnpm workspaces                    | latest |

**Workspace packages:** `core-sdk`, `orchestrator`, `node-agent`

---

## Clientes Frontend

| Cliente | Stack                                                   | Docs                     | Fase         |
| ------- | ------------------------------------------------------- | ------------------------ | ------------ |
| Web     | Next.js 16, React, Tailwind v4, TanStack Query, Zustand | `docs/frontend/web/`     | Fase 1 (MVP) |
| Desktop | Tauri, React, Tailwind v4                               | `docs/frontend/desktop/` | Fase 2       |
| Mobile  | React Native, Expo                                      | `docs/frontend/mobile/`  | Fase 3       |
| Shared  | Design system, data layer, API deps                     | `docs/frontend/shared/`  | Todas        |

---

## Mapa de Contexto por Tarefa

Antes de iniciar qualquer tarefa, leia os docs listados abaixo conforme o tipo de trabalho:

### Schema / Migrations

- `docs/blueprint/05-data-model.md` — tabelas, indices, constraints
- `docs/backend/04-data-layer.md` — Prisma repositories, queries criticas
- `docs/blueprint/04-domain-model.md` — entidades, regras de negocio
- `docs/blueprint/09-state-models.md` — maquinas de estado

### API / Backend

- `docs/backend/05-api-contracts.md` — endpoints, status codes, auth
- `docs/backend/06-services.md` — catalogo de services, fluxos detalhados
- `docs/backend/07-controllers.md` — controllers, decorators, serializers
- `docs/backend/09-errors.md` — catalogo de erros, hierarquia de excecoes
- `docs/backend/10-validation.md` — regras de validacao por entidade

### Frontend Components

- `docs/frontend/shared/03-design-system.md` — tokens, temas, icones
- `docs/frontend/shared/06-data-layer.md` — API client, React Query, DTOs
- `docs/frontend/{client}/04-components.md` — hierarquia de componentes
- `docs/frontend/{client}/05-state.md` — state management

### Routing / Navigation

- `docs/frontend/{client}/07-routes.md` — rotas, layouts, guards
- `docs/frontend/{client}/08-flows.md` — fluxos de interface

### Domain / Business Rules

- `docs/blueprint/04-domain-model.md` — entidades, atributos, regras (RN-\*)
- `docs/backend/03-domain.md` — implementacao de entidades e value objects
- `docs/shared/glossary.md` — linguagem ubiqua

### Security

- `docs/blueprint/13-security.md` — STRIDE, auth, RBAC, criptografia
- `docs/backend/08-middlewares.md` — pipeline de request, CORS, rate limiting
- `docs/backend/11-permissions.md` — roles, matriz de permissoes
- `docs/frontend/{client}/11-security.md` — XSS, CSRF, CSP, auth flow

### Events / Integrations

- `docs/backend/12-events.md` — Redis pub/sub, BullMQ, schema de eventos
- `docs/backend/13-integrations.md` — StorageProvider, Resend, FFmpeg, Sharp
- `docs/shared/event-mapping.md` — backend eventos → frontend estado

### Error Handling

- `docs/backend/09-errors.md` — catalogo de codigos, hierarquia
- `docs/shared/error-ux-mapping.md` — erros → resposta visual no frontend

### Testing

- `docs/blueprint/12-testing_strategy.md` — piramide, cobertura, ambientes
- `docs/backend/14-tests.md` — jest, testcontainers, cenarios
- `docs/frontend/{client}/09-tests.md` — testes de frontend

### Observabilidade

- `docs/blueprint/15-observability.md` — logs, metricas, tracing, alertas
- `docs/frontend/{client}/12-observability.md` — error tracking, Web Vitals

### Copies / UI Text

- `docs/frontend/{client}/14-copies.md` — templates de texto por tela
- `docs/blueprint/17-communication.md` — email templates, variaveis

---

## Convencoes de Codigo

### Nomenclatura

| Contexto             | Convencao                                | Exemplo                                            |
| -------------------- | ---------------------------------------- | -------------------------------------------------- |
| Entidades            | PascalCase, singular, ingles             | `Cluster`, `Member`, `ChunkReplica`                |
| Campos               | snake_case, ingles (DB) / camelCase (TS) | `created_at` (DB), `createdAt` (TS)                |
| Endpoints            | kebab-case, plural, ingles               | `/api/v1/clusters`, `/api/v1/chunk-replicas`       |
| Eventos              | PascalCase, passado, ingles              | `ClusterCreated`, `FileProcessed`                  |
| Estados              | lowercase, ingles                        | `active`, `processing`, `ready`, `suspect`, `lost` |
| Erros                | UPPER_SNAKE_CASE                         | `CLUSTER_NOT_FOUND`, `REPLICATION_INSUFFICIENT`    |
| Tabelas              | snake_case, plural                       | `clusters`, `members`, `chunk_replicas`            |
| Arquivos backend     | kebab-case                               | `cluster.service.ts`, `file.controller.ts`         |
| Componentes frontend | PascalCase                               | `GalleryGrid.tsx`, `NodeStatusBadge.tsx`           |

### Principios Arquiteturais

1. **LOCKSS** — todo chunk em 3+ replicas em nos diferentes; auto-healing obrigatorio
2. **Orquestrador Descartavel** — PostgreSQL reconstruivel via manifests; recovery via seed < 2h
3. **Zero-Knowledge** — criptografia AES-256-GCM no cliente antes de upload; master key nunca em disco
4. **Embrace Failure** — heartbeat + scrubbing + retry com backoff; alertas proativos
5. **Eficiencia sobre Fidelidade** — WebP 1920px para fotos; H.265 1080p para videos; originais nao preservados
6. **Simplicidade Operacional** — monolito NestJS; Docker Compose; sem Kubernetes; 1 pessoa opera
7. **Interfaces sobre Implementacoes** — StorageProvider trait; trocar S3/R2/B2 sem afetar logica

### Camadas do Backend

```
Presentation → Application → Domain ← Infrastructure
```

| Camada         | Contem                                       | Regra                               |
| -------------- | -------------------------------------------- | ----------------------------------- |
| Presentation   | Controllers, Guards, Interceptors, Pipes     | So depende de Application           |
| Application    | Services, DTOs, use case orchestrators       | So depende de Domain                |
| Domain         | Entities, value objects, eventos, interfaces | NAO depende de nenhuma outra camada |
| Infrastructure | Prisma repos, Redis, BullMQ, StorageProvider | Implementa interfaces do Domain     |

**Regras de dependencia:**

- Domain NUNCA importa de Infrastructure ou Presentation
- Controllers NUNCA acessam repositories — sempre via Service
- Services NUNCA retornam Prisma models — sempre Domain entities ou DTOs
- Core SDK (`packages/core-sdk`) nao depende de NestJS — pure TypeScript

### Fronteiras de Dominio

| Modulo       | Responsabilidade                                | Entidades                     |
| ------------ | ----------------------------------------------- | ----------------------------- |
| Cluster      | Criacao, seed phrase, identity crypto, recovery | Cluster, Invite               |
| Member       | Convite, ingresso, roles, vault                 | Member, Vault                 |
| Node         | Registro, heartbeat, drain, status lifecycle    | Node                          |
| File         | Upload, pipeline de midia, previews, galeria    | File, Preview                 |
| Storage      | Chunking, criptografia, distribuicao, manifest  | Manifest, Chunk, ChunkReplica |
| Health       | Alertas, scrubbing, auto-healing, GC            | Alert                         |
| Notification | Email transacional (convites, alertas)          | —                             |

---

## Glossario do Dominio (Linguagem Ubiqua)

> Fonte: `docs/shared/glossary.md` — consulte para definicoes completas

| Termo               | Definicao                                                      | Nao Confundir Com   |
| ------------------- | -------------------------------------------------------------- | ------------------- |
| Cluster             | Grupo familiar com identidade criptografica (SHA-256)          | Tenant              |
| Member              | Pessoa no cluster com role (admin/member/reader)               | User                |
| Node                | Dispositivo ou conta cloud que armazena chunks                 | Server              |
| File                | Midia (foto/video) processada pelo pipeline                    | Chunk               |
| Preview             | Representacao leve (thumbnail/480p) para exibicao              | Thumbnail           |
| Manifest            | Mapa de reconstituicao: chunks + file key + assinatura         | Index               |
| Chunk               | Bloco ~4MB criptografado (AES-256-GCM), enderecado por SHA-256 | File                |
| Replica             | Copia de chunk em no especifico; minimo 3x                     | Backup              |
| Vault               | Cofre criptografado individual por membro                      | Wallet              |
| Alert               | Notificacao de condicao anomala no cluster                     | Notification        |
| Invite              | Token assinado para ingresso no cluster (expira 7d)            | Link                |
| Seed Phrase         | 12 palavras BIP-39 para derivar master key                     | Password            |
| Envelope Encryption | seed → master key → file key → chunk encryption                | E2E encryption      |
| Consistent Hashing  | Distribuicao proporcional de chunks entre nos                  | Round-robin         |
| Scrubbing           | Verificacao periodica de integridade via SHA-256               | Backup verification |
| Auto-Healing        | Re-replicacao automatica quando no e perdido                   | Recovery            |
| Drain               | Migracao de chunks antes de remover no                         | Delete              |
| StorageProvider     | Interface unificada (put/get/exists/delete/list/capacity)      | Driver              |

---

## Sempre Ler Antes de Codar

- `src/contracts/` — tipos compartilhados, entidades, enums, API types, events
- `apps/api/prisma/schema.prisma` — schema do banco de dados (PostgreSQL 18)
- `package.json` — dependencias instaladas (monorepo root)
- `docs/shared/glossary.md` — linguagem ubiqua
- `docs/shared/MAPPING.md` — rastreabilidade entre docs

---

## Workflow de Desenvolvimento (XP)

```
1. Leia os docs relevantes (blueprint + backend/frontend)
2. Leia src/contracts/ para tipos existentes
3. RED:      Escreva os testes primeiro
4. GREEN:    Implemente o minimo para os testes passarem
5. REFACTOR: Melhore o codigo mantendo testes verdes
6. Commit small release
```

---

## Skills de Codegen Disponiveis

| Skill                | Uso                                               | Quando                  |
| -------------------- | ------------------------------------------------- | ----------------------- |
| `/codegen`           | Apresenta entregas do build plan e guia execucao  | Inicio de sessao        |
| `/codegen-contracts` | Gera tipos, schema e scaffold do projeto          | Setup inicial (uma vez) |
| `/codegen-feature`   | Implementa feature completa (vertical slice, TDD) | Dia-a-dia               |
| `/codegen-verify`    | Verifica codigo gerado contra blueprint           | A cada 3-5 features     |
| `/codegen-claudemd`  | Gera/atualiza este arquivo                        | Setup inicial           |

---

## Context Excerpting

Para docs grandes (50k+ tokens), NAO carregue o doc inteiro. Em vez disso:

1. Leia o indice/sumario do doc (headers)
2. Use Grep para encontrar secoes relevantes a feature
3. Carregue apenas as secoes necessarias

Isso mantem cada sessao dentro do budget de ~70-100k tokens de contexto.


Sempre que for fazer algum patch ou alteração utilize TDD é importantissimo
