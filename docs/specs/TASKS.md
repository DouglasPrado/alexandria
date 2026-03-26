# Specs de Implementacao

> Documento gerado a partir de docs/backend/ (fonte primaria), validado contra docs/frontend/ e docs/blueprint/.
> Gerado em: 2026-03-25

## Resumo

| Grupo              | Tasks  | Must   | Should | Could |
| ------------------ | ------ | ------ | ------ | ----- |
| Setup & Infra      | 8      | 6      | 2      | 0     |
| Domain             | 13     | 13     | 0      | 0     |
| Data Layer         | 13     | 13     | 0      | 0     |
| Services           | 8      | 8      | 0      | 0     |
| API & Controllers  | 7      | 7      | 0      | 0     |
| Auth & Permissions | 5      | 5      | 0      | 0     |
| Error Handling     | 4      | 4      | 0      | 0     |
| Middlewares        | 6      | 5      | 1      | 0     |
| Events & Workers   | 10     | 8      | 2      | 0     |
| Integrations       | 4      | 4      | 0      | 0     |
| Tests              | 6      | 4      | 2      | 0     |
| Frontend Sync      | 3      | 1      | 2      | 0     |
| **Total**          | **87** | **78** | **9**  | **0** |

---

## Grupo 1: Setup & Infra

### TASK-SETUP-001: Scaffold do monorepo pnpm workspaces

**Camada:** Setup
**Entidade:** —
**Prioridade:** Must
**Origem:** 00-backend-vision.md, 02-project-structure.md

**Descricao:**
Criar estrutura do monorepo com pnpm workspaces contendo 3 packages: `core-sdk`, `orchestrator`, `node-agent`. Configurar TypeScript 5.x, ESLint + @typescript-eslint + Prettier, Jest com ts-jest. Criar scripts root: `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm lint`.

**Arquivos a criar/editar:**

- `pnpm-workspace.yaml` — criar — definir packages
- `package.json` — criar — scripts root, devDependencies
- `tsconfig.json` — criar — TypeScript base config (strict, ESNext, paths)
- `.eslintrc.js` — criar — ESLint + Prettier
- `.prettierrc` — criar — singleQuote, trailingComma, semi
- `jest.config.ts` — criar — ts-jest, paths, testcontainers setup
- `.env.example` — criar — template: DATABASE_URL, REDIS_URL, JWT_SECRET, RESEND_API_KEY

**Dependencias:**

- Nenhuma

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] `pnpm install` resolve dependencias dos 3 packages
- [ ] `pnpm lint` executa ESLint em todos os packages
- [ ] `pnpm build` compila TypeScript sem erros
- [ ] `pnpm test` roda Jest (mesmo sem testes reais)
- [ ] Paths aliases resolvem entre packages (core-sdk importavel do orchestrator)

**Testes Necessarios:**

- [ ] Unitario: importar funcao do core-sdk no orchestrator (smoke test de paths)

**Consistencia Frontend:**

- Nenhuma

---

### TASK-SETUP-002: Scaffold do core-sdk (crypto, chunking, hashing)

**Camada:** Setup
**Entidade:** —
**Prioridade:** Must
**Origem:** 02-project-structure.md, 00-backend-vision.md

**Descricao:**
Criar package `packages/core-sdk` com modulos: `crypto/` (AES-256-GCM, envelope encryption, BIP-39 seed), `chunking/` (divisao em blocos ~4MB, reassembly), `hashing/` (SHA-256 content-addressable), `consistent-hash/` (ConsistentHashRing com virtual nodes), `manifest/` (criacao, serializacao, validacao), `vault/` (encrypt/decrypt por membro), `storage-provider/` (interface StorageProvider + implementacao local). Public API via `index.ts`.

**Arquivos a criar/editar:**

- `packages/core-sdk/src/crypto/index.ts` — criar — CryptoEngine: deriveMasterKey, generateKeypair, generateFileKey, encrypt, decrypt
- `packages/core-sdk/src/chunking/index.ts` — criar — ChunkingEngine: split, hash, reassemble
- `packages/core-sdk/src/hashing/index.ts` — criar — SHA-256 hashing
- `packages/core-sdk/src/consistent-hash/index.ts` — criar — ConsistentHashRing: addNode, removeNode, getNodes
- `packages/core-sdk/src/manifest/index.ts` — criar — createManifest, verifyManifest, serializeManifest
- `packages/core-sdk/src/vault/index.ts` — criar — createVault, unlockVault, updateVault
- `packages/core-sdk/src/storage-provider/index.ts` — criar — interface StorageProvider (put/get/exists/delete/list/capacity)
- `packages/core-sdk/src/index.ts` — criar — re-export public API
- `packages/core-sdk/package.json` — criar — dependencias (Node.js crypto, @noble/ciphers)

**Dependencias:**

- TASK-SETUP-001: monorepo deve existir

**Regras de Negocio:**

- RN-C2: Seed phrase de 12 palavras BIP-39 gera master key
- RN-CH2: chunk_id = SHA-256(conteudo criptografado)
- RN-CH3: Todo chunk criptografado com AES-256-GCM

**Criterios de Aceite:**

- [ ] CryptoEngine.deriveMasterKey(seedPhrase) retorna 256 bits deterministicos
- [ ] CryptoEngine.encrypt/decrypt roundtrip funciona com AES-256-GCM
- [ ] ChunkingEngine.split(buffer) retorna chunks de ~4MB
- [ ] SHA-256 hashing e deterministico
- [ ] ConsistentHashRing distribui chunks proporcionalmente a capacidade dos nos
- [ ] StorageProvider interface exporta put, get, exists, delete, list, capacity

**Testes Necessarios:**

- [ ] Unitario: encrypt/decrypt roundtrip (+ property-based com fast-check, 10k iteracoes)
- [ ] Unitario: SHA-256 deterministico
- [ ] Unitario: chunking com edge cases (< 4MB, exatamente N chunks, com resto)
- [ ] Unitario: envelope encryption: seed → master key → file key
- [ ] Unitario: consistent hashing proporcionalidade e estabilidade
- [ ] Unitario: BIP-39 seed generation e validacao

**Consistencia Frontend:**

- Nenhuma — core-sdk e internal

---

### TASK-SETUP-003: Scaffold do orchestrator NestJS

**Camada:** Setup
**Entidade:** —
**Prioridade:** Must
**Origem:** 01-architecture.md, 02-project-structure.md

**Descricao:**
Criar package `packages/orchestrator` com NestJS 11.x. Configurar `app.module.ts` (root module), `main.ts` (bootstrap, porta 3333), `config/` (env.ts com class-validator, database.ts, redis.ts, app.config.ts). Criar estrutura de modulos vazios: cluster, member, node, file, storage, health, notification. Criar `common/` com guards, interceptors, pipes, filters, decorators e types.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/main.ts` — criar — bootstrap NestJS, porta 3333
- `packages/orchestrator/src/app.module.ts` — criar — root module com imports
- `packages/orchestrator/src/config/env.ts` — criar — validacao de env vars
- `packages/orchestrator/src/config/database.ts` — criar — Prisma connection
- `packages/orchestrator/src/config/redis.ts` — criar — Redis/BullMQ connection
- `packages/orchestrator/src/config/app.config.ts` — criar — ConfigModule
- `packages/orchestrator/src/modules/` — criar — 7 modulos vazios com .module.ts
- `packages/orchestrator/package.json` — criar — NestJS 11.x deps

**Dependencias:**

- TASK-SETUP-001: monorepo deve existir

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] `pnpm dev` sobe NestJS na porta 3333
- [ ] Variaveis de ambiente validadas com class-validator no startup
- [ ] Modulos registrados no app.module.ts sem erro
- [ ] ConfigModule expoe DATABASE_URL, REDIS_URL, JWT_SECRET

**Testes Necessarios:**

- [ ] Unitario: validacao de env vars (campo ausente lanca erro)

**Consistencia Frontend:**

- Nenhuma

---

### TASK-SETUP-004: Setup do banco PostgreSQL + Prisma

**Camada:** Setup
**Entidade:** —
**Prioridade:** Must
**Origem:** 00-backend-vision.md, 04-data-layer.md

**Descricao:**
Configurar Prisma 6.x com PostgreSQL 18. Criar `schema.prisma` com todas as 12 tabelas (clusters, members, nodes, files, previews, manifests, chunks, manifest_chunks, chunk_replicas, vaults, alerts, invites) conforme definido em 04-data-layer.md. Gerar migration inicial. Configurar Docker Compose dev com PG18.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/prisma/schema.prisma` — criar — schema completo com 12 modelos
- `docker-compose.dev.yml` — criar — PostgreSQL 18 + Redis 7
- `packages/orchestrator/src/prisma/migrations/` — criar — migration inicial

**Dependencias:**

- TASK-SETUP-003: orchestrator deve existir

**Regras de Negocio:**

- Nenhuma — schema derivado diretamente de 04-data-layer.md

**Criterios de Aceite:**

- [ ] `prisma migrate dev` cria todas as 12 tabelas
- [ ] Todos os indices definidos em 04-data-layer.md estao criados
- [ ] Constraints UNIQUE, NOT NULL, FK funcionam
- [ ] `prisma generate` gera client sem erros
- [ ] Docker Compose dev sobe PG18 e Redis 7

**Testes Necessarios:**

- [ ] Integracao: conectar ao PG via testcontainers e rodar migration

**Consistencia Frontend:**

- Nenhuma

---

### TASK-SETUP-005: Setup do Redis + BullMQ

**Camada:** Setup
**Entidade:** —
**Prioridade:** Must
**Origem:** 00-backend-vision.md, 12-events.md

**Descricao:**
Configurar Redis 7 como backend para BullMQ (@nestjs/bullmq). Criar filas: `media.photos`, `media.videos`, `email.send`, `healing.process`. Configurar DLQs: `media.dlq`, `email.send.dlq`, `healing.dlq`. Configurar conexao Redis via env var REDIS_URL.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/config/redis.ts` — editar — adicionar config BullMQ
- `packages/orchestrator/src/app.module.ts` — editar — registrar BullModule com filas

**Dependencias:**

- TASK-SETUP-003: orchestrator deve existir
- TASK-SETUP-004: docker-compose.dev.yml com Redis

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] 4 filas criadas no Redis (media.photos, media.videos, email.send, healing.process)
- [ ] 3 DLQs configuradas
- [ ] Conexao Redis validada no startup

**Testes Necessarios:**

- [ ] Integracao: enfileirar e consumir job de teste via testcontainers Redis

**Consistencia Frontend:**

- Nenhuma

---

### TASK-SETUP-006: Setup de observabilidade (logger + health checks)

**Camada:** Setup
**Entidade:** —
**Prioridade:** Must
**Origem:** 00-backend-vision.md, 08-middlewares.md

**Descricao:**
Configurar pino + nestjs-pino para JSON estruturado com redaction de dados sensiveis (seed phrase, master key, file keys, tokens OAuth, credenciais S3). Configurar log level por ambiente (debug em dev, info em prod). Implementar HealthController com endpoints `/health/live` e `/health/ready`.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/health/health.controller.ts` — criar — live e ready endpoints
- `packages/orchestrator/src/modules/health/health.service.ts` — criar — check PG, Redis, BullMQ
- `packages/orchestrator/src/modules/health/health.module.ts` — criar — module registration
- `packages/orchestrator/src/app.module.ts` — editar — registrar LoggerModule (pino)

**Dependencias:**

- TASK-SETUP-003: orchestrator deve existir
- TASK-SETUP-004: PostgreSQL configurado
- TASK-SETUP-005: Redis configurado

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] `GET /health/live` retorna `{ status: "ok" }` com 200
- [ ] `GET /health/ready` verifica PG + Redis + BullMQ, retorna 200 ou 503
- [ ] Logs em JSON estruturado com requestId, timestamp
- [ ] Campos sensiveis redacted nos logs (seed, masterKey, fileKey, accessKey, secretKey)

**Testes Necessarios:**

- [ ] Unitario: HealthService.check() com mocks
- [ ] Integracao: health endpoints via supertest

**Consistencia Frontend:**

- DashboardPage (HealthIndicator) consome `GET /health/ready`

---

### TASK-SETUP-007: Docker Compose de producao

**Camada:** Setup
**Entidade:** —
**Prioridade:** Should
**Origem:** 01-architecture.md

**Descricao:**
Criar Dockerfile multi-stage (pnpm install → build → prune) e docker-compose.yml de producao com: orchestrator, PG18, Redis 7, web client, Caddy (TLS 1.3, HSTS, rate limit por IP).

**Arquivos a criar/editar:**

- `Dockerfile` — criar — multi-stage build
- `docker-compose.yml` — criar — producao completa

**Dependencias:**

- TASK-SETUP-003: orchestrator compilavel

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] `docker compose up -d` sobe todos os servicos
- [ ] Caddy faz TLS termination
- [ ] Orchestrator acessivel via reverse proxy

**Testes Necessarios:**

- [ ] E2E: smoke test apos docker compose up

**Consistencia Frontend:**

- Nenhuma

---

### TASK-SETUP-008: Setup de metricas Prometheus

**Camada:** Setup
**Entidade:** —
**Prioridade:** Should
**Origem:** 00-backend-vision.md

**Descricao:**
Configurar Prometheus + Grafana para Golden Signals (latencia, traffic, errors, saturation) + metricas especificas do Alexandria (replication_health, nodes_online, chunks_corrupted, pipeline_queue_depth).

**Arquivos a criar/editar:**

- `packages/orchestrator/src/common/interceptors/metrics.interceptor.ts` — criar — coletar metricas
- `prometheus.yml` — criar — scrape config

**Dependencias:**

- TASK-SETUP-003: orchestrator deve existir

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] Endpoint `/metrics` expoe metricas Prometheus
- [ ] Histograma de latencia por endpoint
- [ ] Counter de erros 5xx

**Testes Necessarios:**

- [ ] Integracao: verificar que `/metrics` retorna formato Prometheus

**Consistencia Frontend:**

- Nenhuma

---

## Grupo 2: Domain

### TASK-DOM-001: Entidade Cluster

**Camada:** Domain
**Entidade:** Cluster
**Prioridade:** Must
**Origem:** 03-domain.md

**Descricao:**
Implementar entidade Cluster com atributos: cluster_id (SHA-256 de public_key, imutavel), name, public_key (Ed25519), encrypted_private_key, status (active/suspended), created_at, updated_at. Metodos: create(), suspend(), activate(), recover(), canAddMember(), canAddNode(). Emitir eventos ClusterCreated e ClusterRecovered.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/cluster/entities/cluster.entity.ts` — criar — classe Cluster
- `packages/orchestrator/src/modules/cluster/events/cluster-created.event.ts` — criar — evento
- `packages/orchestrator/src/modules/cluster/events/cluster-recovered.event.ts` — criar — evento

**Dependencias:**

- TASK-SETUP-002: core-sdk com CryptoEngine

**Regras de Negocio:**

- RN-C1: cluster_id = SHA-256(public_key), imutavel
- RN-C2: Seed phrase BIP-39 gera master key
- RN-C3: Maximo 10 membros por cluster
- RN-C4: Maximo 50 nos por cluster

**Criterios de Aceite:**

- [ ] cluster_id derivado deterministicamente de public_key
- [ ] create() gera par de chaves Ed25519, status = active, emite ClusterCreated
- [ ] suspend() muda status para suspended
- [ ] activate() muda status para active
- [ ] canAddMember() retorna false quando count >= 10
- [ ] canAddNode() retorna false quando count >= 50
- [ ] Transicoes de estado seguem maquina: active <-> suspended

**Testes Necessarios:**

- [ ] Unitario: create() gera cluster_id deterministico
- [ ] Unitario: transicoes de estado validas e invalidas
- [ ] Unitario: canAddMember() com 10 membros
- [ ] Unitario: canAddNode() com 50 nos

**Consistencia Frontend:**

- CreateClusterPage consome resposta de POST /api/clusters
- DashboardPage exibe status do cluster

---

### TASK-DOM-002: Entidade Member

**Camada:** Domain
**Entidade:** Member
**Prioridade:** Must
**Origem:** 03-domain.md

**Descricao:**
Implementar entidade Member com atributos: member_id, name, email, password_hash (Argon2id), role (admin/member/reader), invited_by, joined_at, created_at, updated_at. Metodos: create(), createFromInvite(), changeRole(), remove(), canPerform(). Emitir eventos MemberJoined e MemberRemoved.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/member/entities/member.entity.ts` — criar — classe Member
- `packages/orchestrator/src/modules/member/events/member-joined.event.ts` — criar — evento
- `packages/orchestrator/src/modules/member/events/member-removed.event.ts` — criar — evento

**Dependencias:**

- TASK-DOM-001: Cluster (pertence a um cluster)

**Regras de Negocio:**

- RN-M1: Email unico por cluster (409 se duplicado)
- RN-M2: Pelo menos 1 admin — nao remover/rebaixar ultimo admin
- RN-M3: Permissoes por role: reader visualiza, member upload/download, admin gerencia
- RN-M4: Ingresso via convite com token assinado (exceto criador)

**Criterios de Aceite:**

- [ ] create() faz hash Argon2id da senha, emite MemberJoined
- [ ] createFromInvite() valida token, aceita convite, cria membro
- [ ] changeRole() valida que nao e ultimo admin (RN-M2)
- [ ] remove() valida que nao e ultimo admin (RN-M2), emite MemberRemoved
- [ ] canPerform() verifica permissao por role

**Testes Necessarios:**

- [ ] Unitario: create() com hash de senha
- [ ] Unitario: changeRole() impede rebaixar ultimo admin
- [ ] Unitario: remove() impede remover ultimo admin
- [ ] Unitario: canPerform() por role (admin, member, reader)

**Consistencia Frontend:**

- MembersPage consome GET /api/clusters/:id/members
- AcceptInvitePage consome POST /api/invites/:token/accept

---

### TASK-DOM-003: Entidade Node

**Camada:** Domain
**Entidade:** Node
**Prioridade:** Must
**Origem:** 03-domain.md

**Descricao:**
Implementar entidade Node com atributos: node_id, type (local/s3/r2/b2/vps), name, total_capacity, used_capacity, status (online/suspect/lost/draining/disconnected), endpoint, config_encrypted, last_heartbeat, tier (hot/warm/cold), created_at, updated_at. Metodos: register(), heartbeat(), markSuspect(), markLost(), startDrain(), completeDrain(), recover(), availableCapacity(). Emitir eventos NodeRegistered, NodeSuspect, NodeLost, NodeDrained.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/node/entities/node.entity.ts` — criar — classe Node
- `packages/orchestrator/src/modules/node/events/` — criar — 4 eventos

**Dependencias:**

- TASK-DOM-001: Cluster (no pertence a cluster)
- TASK-DOM-002: Member (no tem owner)

**Regras de Negocio:**

- RN-N1: Sem heartbeat 30min → suspect + alerta warning
- RN-N2: Sem heartbeat 1h → lost + alerta critical + auto-healing
- RN-N3: Remocao exige drain obrigatorio
- RN-N4: Credenciais criptografadas no vault
- RN-N5: Teste de conectividade obrigatorio no registro
- RN-N6: Minimo 1 no ativo para uploads

**Criterios de Aceite:**

- [ ] Maquina de estados: online → suspect → lost, online → draining → disconnected, suspect → online
- [ ] Transicoes proibidas: lost → draining, disconnected → qualquer, draining → online
- [ ] heartbeat() atualiza last_heartbeat e used_capacity
- [ ] availableCapacity() retorna total - used

**Testes Necessarios:**

- [ ] Unitario: todas as transicoes de estado validas
- [ ] Unitario: transicoes proibidas lancam erro
- [ ] Unitario: availableCapacity()

**Consistencia Frontend:**

- NodesPage consome GET /api/nodes
- NodeDetailPage consome POST /api/nodes/:id/drain

---

### TASK-DOM-004: Entidade File

**Camada:** Domain
**Entidade:** File
**Prioridade:** Must
**Origem:** 03-domain.md

**Descricao:**
Implementar entidade File com atributos: file_id, original_name, media_type (photo/video/document), mime_type, original_size, optimized_size, content_hash, metadata (JSONB), status (processing/ready/error/corrupted), error_message, created_at, updated_at. Metodos: upload(), process(), markError(), markCorrupted(), isDuplicate(), validateSize(). Emitir eventos FileUploaded, FileProcessed, FileCorrupted.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/file/entities/file.entity.ts` — criar — classe File
- `packages/orchestrator/src/modules/file/events/` — criar — 3 eventos

**Dependencias:**

- TASK-DOM-001: Cluster
- TASK-DOM-002: Member (uploaded_by)

**Regras de Negocio:**

- RN-F1: Classificacao automatica via MIME type
- RN-F2: Otimizacao obrigatoria para midia
- RN-F3: Documentos bypass de otimizacao
- RN-F4: Limites: fotos 50MB, videos 10GB, documentos 2GB, archives 5GB
- RN-F5: Deduplicacao via content_hash

**Criterios de Aceite:**

- [ ] upload() classifica media_type via MIME, valida limites, status = processing
- [ ] process() atualiza optimized_size, content_hash, status = ready
- [ ] markError() status = error, registra mensagem
- [ ] markCorrupted() status = corrupted, emite FileCorrupted
- [ ] validateSize() aplica limites por media_type
- [ ] Maquina de estados: processing → ready/error, ready → corrupted

**Testes Necessarios:**

- [ ] Unitario: classificacao MIME (image/_ → photo, video/_ → video, rest → document)
- [ ] Unitario: validateSize() para cada tipo
- [ ] Unitario: transicoes de estado validas e proibidas
- [ ] Unitario: isDuplicate() com content_hash

**Consistencia Frontend:**

- GalleryPage consome GET /api/files
- FileDetailPage consome GET /api/files/:id

---

### TASK-DOM-005: Entidade Preview

**Camada:** Domain
**Entidade:** Preview
**Prioridade:** Must
**Origem:** 03-domain.md

**Descricao:**
Implementar entidade Preview com atributos: preview_id, file_id (1:1), type (thumbnail/video_preview), size, format (webp/mp4), content_hash, storage_path, created_at. Metodos: generate(), getForFile(). Emitir evento PreviewGenerated. Preview gerado somente para fotos e videos — documentos nao geram preview.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/file/entities/preview.entity.ts` — criar — classe Preview

**Dependencias:**

- TASK-DOM-004: File (1:1)

**Regras de Negocio:**

- RN-P1: Preview somente para exibicao
- RN-P2: Tamanho alvo: foto ~50KB WebP, video 480p ~5MB MP4, PDF ~100KB PNG

**Criterios de Aceite:**

- [ ] generate() calcula content_hash, emite PreviewGenerated
- [ ] Relacao 1:1 com File

**Testes Necessarios:**

- [ ] Unitario: generate() com diferentes tipos

**Consistencia Frontend:**

- GalleryGrid consome GET /api/files/:id/preview

---

### TASK-DOM-006: Entidade Manifest

**Camada:** Domain
**Entidade:** Manifest
**Prioridade:** Must
**Origem:** 03-domain.md

**Descricao:**
Implementar entidade Manifest com atributos: manifest_id, file_id (1:1), chunks_json, file_key_encrypted, signature (Ed25519), replicated_to, version, created_at, updated_at. Metodos: create(), verify(), replicate(), getChunkIds(). Emitir eventos ManifestCreated, ManifestReplicated.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/storage/entities/manifest.entity.ts` — criar — classe Manifest

**Dependencias:**

- TASK-DOM-004: File (1:1)
- TASK-SETUP-002: core-sdk CryptoEngine (assinatura Ed25519)

**Regras de Negocio:**

- RN-MA1: Todo arquivo ready tem exatamente 1 manifest
- RN-MA2: File key criptografada com master key
- RN-MA3: Manifest assinado com chave privada do cluster
- RN-MA4: Manifest replicado em 2+ nos

**Criterios de Aceite:**

- [ ] create() monta chunks_json, assina com chave privada, emite ManifestCreated
- [ ] verify() valida assinatura com public key
- [ ] replicate() adiciona nodeId ao replicated_to
- [ ] getChunkIds() retorna lista ordenada

**Testes Necessarios:**

- [ ] Unitario: create() + verify() roundtrip de assinatura
- [ ] Unitario: getChunkIds() retorna ordem correta

**Consistencia Frontend:**

- Nenhuma — manifests sao internos

---

### TASK-DOM-007: Entidade Chunk

**Camada:** Domain
**Entidade:** Chunk
**Prioridade:** Must
**Origem:** 03-domain.md

**Descricao:**
Implementar entidade Chunk com atributos: chunk_id (SHA-256, PK), size (~4MB), reference_count, created_at. Metodos: create(), incrementReference(), decrementReference(), isOrphan(). Emitir eventos ChunkCreated, ChunkOrphaned.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/storage/entities/chunk.entity.ts` — criar — classe Chunk

**Dependencias:**

- TASK-SETUP-002: core-sdk ChunkingEngine

**Regras de Negocio:**

- RN-CH1: Tamanho fixo ~4MB (ultimo pode ser menor)
- RN-CH2: chunk_id = SHA-256(conteudo criptografado), imutavel
- RN-CH3: Todo chunk criptografado com AES-256-GCM
- RN-CH4: Deduplicacao cross-file
- RN-CH5: Orfao se reference_count = 0

**Criterios de Aceite:**

- [ ] create() criptografa com AES-256-GCM, calcula SHA-256
- [ ] incrementReference() e decrementReference() atualizam counter
- [ ] isOrphan() retorna true quando reference_count == 0
- [ ] decrementReference() emite ChunkOrphaned quando chega a 0

**Testes Necessarios:**

- [ ] Unitario: create() com SHA-256 deterministico
- [ ] Unitario: reference counting up/down
- [ ] Unitario: isOrphan()

**Consistencia Frontend:**

- Nenhuma — chunks sao internos

---

### TASK-DOM-008: Entidade ChunkReplica

**Camada:** Domain
**Entidade:** ChunkReplica
**Prioridade:** Must
**Origem:** 03-domain.md

**Descricao:**
Implementar entidade ChunkReplica com atributos: chunk_id, node_id, status (pending/healthy/corrupted), verified_at, created_at. Metodos: create(), confirmReplication(), markCorrupted(), repair(), verify(). Emitir eventos ChunkReplicated, ChunkCorrupted, ChunkRepaired.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/storage/entities/chunk-replica.entity.ts` — criar — classe ChunkReplica

**Dependencias:**

- TASK-DOM-007: Chunk
- TASK-DOM-003: Node

**Regras de Negocio:**

- RN-CR1: Minimo 3 replicas por chunk em nos diferentes
- RN-CR2: Diversidade preferencial (1 local + 1 cloud + 1 outro)
- RN-CR3: Scrubbing periodico recalcula SHA-256
- RN-CR4: Replica corrompida substituida automaticamente

**Criterios de Aceite:**

- [ ] Maquina de estados: pending → healthy, healthy → corrupted, corrupted → healthy
- [ ] Transicoes proibidas: pending → corrupted, corrupted → pending
- [ ] verify() compara hash e atualiza verified_at
- [ ] repair() copia de replica saudavel, status = healthy

**Testes Necessarios:**

- [ ] Unitario: transicoes validas e invalidas
- [ ] Unitario: verify() com hash correto e incorreto

**Consistencia Frontend:**

- Nenhuma — replicas sao internas

---

### TASK-DOM-009: Entidade Vault

**Camada:** Domain
**Entidade:** Vault
**Prioridade:** Must
**Origem:** 03-domain.md

**Descricao:**
Implementar entidade Vault com atributos: member_id (1:1), vault_data (bytes criptografados), encryption_algorithm (AES-256-GCM), replicated_to, is_admin_vault, created_at, updated_at. Metodos: create(), unlock(), unlockWithMasterKey(), update(), replicate(). Emitir eventos VaultCreated, VaultUpdated, VaultReplicated.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/member/entities/vault.entity.ts` — criar — classe Vault

**Dependencias:**

- TASK-DOM-002: Member (1:1)
- TASK-SETUP-002: core-sdk CryptoEngine

**Regras de Negocio:**

- RN-V1: Vault admin contem config cluster, nos, credenciais S3/R2, master key
- RN-V2: Vault membro contem credenciais pessoais
- RN-V3: Vault replicado em nos para recovery
- RN-V4: Desbloqueado com senha ou master key (recovery)
- RN-V5: Credenciais nunca em texto puro

**Criterios de Aceite:**

- [ ] create() inicializa vault vazio criptografado, emite VaultCreated
- [ ] unlock(password) descriptografa com senha do membro
- [ ] unlockWithMasterKey(masterKey) descriptografa no recovery
- [ ] update() re-criptografa com nova data
- [ ] replicate() adiciona nodeId ao replicated_to

**Testes Necessarios:**

- [ ] Unitario: create() + unlock() roundtrip
- [ ] Unitario: unlockWithMasterKey() para recovery
- [ ] Unitario: vault_data nunca acessivel sem senha/key

**Consistencia Frontend:**

- Nenhuma — vault e interno

---

### TASK-DOM-010: Entidade Alert

**Camada:** Domain
**Entidade:** Alert
**Prioridade:** Must
**Origem:** 03-domain.md

**Descricao:**
Implementar entidade Alert com atributos: alert_id, type (node_offline/replication_low/token_expired/space_low/corruption_detected/auto_healing_complete), message, severity (info/warning/critical), resolved, related_entity_id, created_at, resolved_at. Metodos: create(), resolve(), isActive(). Emitir eventos AlertCreated, AlertResolved.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/health/entities/alert.entity.ts` — criar — classe Alert

**Dependencias:**

- TASK-DOM-001: Cluster

**Regras de Negocio:**

- RN-A1: Alertas gerados automaticamente — nunca manualmente
- RN-A2: Persistem ate resolucao
- RN-A3: Auto-healing pode resolver automaticamente

**Criterios de Aceite:**

- [ ] create() com type, message, severity, emite AlertCreated
- [ ] resolve() marca resolved = true, resolved_at = now(), emite AlertResolved
- [ ] isActive() retorna !resolved

**Testes Necessarios:**

- [ ] Unitario: create() e resolve()
- [ ] Unitario: isActive()

**Consistencia Frontend:**

- AlertsPage consome GET /api/alerts
- AlertsBadge consome contagem de alertas ativos

---

### TASK-DOM-011: Entidade Invite

**Camada:** Domain
**Entidade:** Invite
**Prioridade:** Must
**Origem:** 03-domain.md

**Descricao:**
Implementar entidade Invite com atributos: invite_id, email, role (admin/member/reader), token (assinado com chave do cluster), expires_at (default +7 dias), created_by, accepted_at, created_at. Metodos: create(), accept(), expire(), isValid(), verifyToken(). Emitir eventos InviteCreated, InviteAccepted, InviteExpired. Maquina de estados: pending → accepted, pending → expired.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/member/entities/invite.entity.ts` — criar — classe Invite

**Dependencias:**

- TASK-DOM-001: Cluster (token assinado com chave do cluster)
- TASK-DOM-002: Member (created_by)

**Regras de Negocio:**

- RN-I1: Token assinado com chave privada; expiracao 7 dias
- RN-I2: Token de uso unico — invalidado apos aceite
- RN-I3: Email ja existente → erro 409
- RN-I4: Somente admin pode criar convites

**Criterios de Aceite:**

- [ ] create() gera token assinado, emite InviteCreated
- [ ] accept() preenche accepted_at, emite InviteAccepted
- [ ] expire() marca como expirado
- [ ] isValid() retorna false se aceito ou expirado
- [ ] verifyToken() valida assinatura Ed25519
- [ ] Transicoes proibidas: accepted → qualquer, expired → qualquer

**Testes Necessarios:**

- [ ] Unitario: create() + verifyToken() roundtrip
- [ ] Unitario: accept() marca accepted_at
- [ ] Unitario: isValid() com token expirado/aceito
- [ ] Unitario: transicoes proibidas

**Consistencia Frontend:**

- AcceptInvitePage consome POST /api/invites/:token/accept
- MembersPage (InviteDialog) consome POST /api/clusters/:id/invites

---

### TASK-DOM-012: Value Objects

**Camada:** Domain
**Entidade:** —
**Prioridade:** Must
**Origem:** 03-domain.md

**Descricao:**
Implementar value objects imutaveis: Email (RFC 5322, max 255, lowercase, trim), ChunkId (SHA-256, 64 chars hex), SeedPhrase (12 palavras BIP-39), MasterKey (256 bits), FileKey (AES-256-GCM, 256 bits), ContentHash (SHA-256, 64 chars hex), NodeEndpoint (URL ou path valido), Capacity (total, used, invariante used <= total).

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/common/value-objects/email.vo.ts` — criar
- `packages/orchestrator/src/modules/common/value-objects/chunk-id.vo.ts` — criar
- `packages/orchestrator/src/modules/common/value-objects/seed-phrase.vo.ts` — criar
- `packages/orchestrator/src/modules/common/value-objects/content-hash.vo.ts` — criar
- `packages/orchestrator/src/modules/common/value-objects/node-endpoint.vo.ts` — criar
- `packages/orchestrator/src/modules/common/value-objects/capacity.vo.ts` — criar

**Dependencias:**

- Nenhuma

**Regras de Negocio:**

- Cada value object encapsula suas regras de validacao

**Criterios de Aceite:**

- [ ] Email rejeita formato invalido, aplica lowercase e trim
- [ ] SeedPhrase rejeita se nao tiver 12 palavras BIP-39
- [ ] ChunkId rejeita se nao for 64 chars hex
- [ ] Capacity lanca erro se used > total
- [ ] Todos os VOs sao imutaveis

**Testes Necessarios:**

- [ ] Unitario: validacao de cada value object com inputs validos e invalidos

**Consistencia Frontend:**

- Nenhuma

---

### TASK-DOM-013: Enums do dominio

**Camada:** Domain
**Entidade:** —
**Prioridade:** Must
**Origem:** 03-domain.md

**Descricao:**
Implementar enums compartilhados: MemberRole (admin/member/reader), NodeType (local/s3/r2/b2/vps), NodeStatus (online/suspect/lost/draining/disconnected), FileStatus (processing/ready/error/corrupted), MediaType (photo/video/document), AlertSeverity (info/warning/critical), AlertType (node_offline/replication_low/etc.), ReplicaStatus (pending/healthy/corrupted), ClusterStatus (active/suspended), PreviewType (thumbnail/video_preview/pdf_page/generic_icon), InviteStatus (pending/accepted/expired).

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/common/enums/index.ts` — criar — todos os enums

**Dependencias:**

- Nenhuma

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] Todos os enums definidos e exportados
- [ ] Enums usados em todas as entidades correspondentes

**Testes Necessarios:**

- [ ] Unitario: verificar que cada enum contem os valores esperados

**Consistencia Frontend:**

- Frontend deve usar mesmos valores de enum para DTOs

---

## Grupo 3: Data Layer

### TASK-DATA-001: ClusterRepository

**Camada:** Data
**Entidade:** Cluster
**Prioridade:** Must
**Origem:** 04-data-layer.md

**Descricao:**
Implementar ClusterRepository com Prisma: create(data), findById(id), findByClusterId(clusterId), updateStatus(id, status).

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/cluster/cluster.repository.ts` — criar — interface + implementacao Prisma

**Dependencias:**

- TASK-SETUP-004: Prisma schema

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] CRUD completo de clusters via Prisma
- [ ] findByClusterId busca por SHA-256 hex string

**Testes Necessarios:**

- [ ] Integracao: CRUD contra PG real (testcontainers)

**Consistencia Frontend:**

- Nenhuma

---

### TASK-DATA-002: MemberRepository

**Camada:** Data
**Entidade:** Member
**Prioridade:** Must
**Origem:** 04-data-layer.md

**Descricao:**
Implementar MemberRepository com Prisma: create(data), findById(id), findByClusterAndEmail(clusterId, email), listByCluster(clusterId), countAdmins(clusterId).

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/member/member.repository.ts` — criar

**Dependencias:**

- TASK-SETUP-004: Prisma schema

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] findByClusterAndEmail para verificacao de duplicidade
- [ ] countAdmins para validar RN-M2

**Testes Necessarios:**

- [ ] Integracao: CRUD contra PG real (testcontainers)

**Consistencia Frontend:**

- Nenhuma

---

### TASK-DATA-003: NodeRepository

**Camada:** Data
**Entidade:** Node
**Prioridade:** Must
**Origem:** 04-data-layer.md

**Descricao:**
Implementar NodeRepository com Prisma: create(data), findById(id), listByCluster(clusterId), listOnline(clusterId), countOnline(clusterId), findSuspect(), findLost(), updateHeartbeat(id), updateStatus(id, status).

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/node/node.repository.ts` — criar

**Dependencias:**

- TASK-SETUP-004: Prisma schema

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] findSuspect() retorna nos com last_heartbeat < NOW() - 30min e status online
- [ ] findLost() retorna nos com last_heartbeat < NOW() - 1h e status suspect
- [ ] countOnline() para validar RN-N6

**Testes Necessarios:**

- [ ] Integracao: queries de heartbeat contra PG real

**Consistencia Frontend:**

- Nenhuma

---

### TASK-DATA-004: FileRepository

**Camada:** Data
**Entidade:** File
**Prioridade:** Must
**Origem:** 04-data-layer.md

**Descricao:**
Implementar FileRepository com Prisma: create(data), findById(id), findByContentHash(clusterId, hash), listReady(clusterId, cursor?, limit?), listByMember(memberId, cursor?, limit?), listByMediaType(clusterId, type, cursor?, limit?), updateStatus(id, status, errorMessage?). Cursor-based pagination com ORDER BY id DESC.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/file/file.repository.ts` — criar

**Dependencias:**

- TASK-SETUP-004: Prisma schema

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] Cursor-based pagination funciona corretamente
- [ ] findByContentHash para deduplicacao (RN-F5)
- [ ] listReady com SLA < 100ms (indice idx_files_cluster_status)

**Testes Necessarios:**

- [ ] Integracao: paginacao por cursor contra PG real
- [ ] Integracao: findByContentHash

**Consistencia Frontend:**

- Nenhuma

---

### TASK-DATA-005: ChunkRepository

**Camada:** Data
**Entidade:** Chunk
**Prioridade:** Must
**Origem:** 04-data-layer.md

**Descricao:**
Implementar ChunkRepository com Prisma: findById(id), create(data), incrementRef(id), decrementRef(id), findOrphans(), deleteOrphans().

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/storage/chunk.repository.ts` — criar

**Dependencias:**

- TASK-SETUP-004: Prisma schema

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] findOrphans() retorna chunks com reference_count = 0
- [ ] deleteOrphans() remove chunks orfaos e retorna count

**Testes Necessarios:**

- [ ] Integracao: reference counting e GC contra PG real

**Consistencia Frontend:**

- Nenhuma

---

### TASK-DATA-006: ChunkReplicaRepository

**Camada:** Data
**Entidade:** ChunkReplica
**Prioridade:** Must
**Origem:** 04-data-layer.md

**Descricao:**
Implementar ChunkReplicaRepository com Prisma: create(data), countByChunk(chunkId), listByNode(nodeId), listByChunk(chunkId), findSubReplicated(minReplicas), findUnverified(limit), updateVerified(id), updateStatus(id, status), deleteByNode(nodeId).

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/storage/chunk-replica.repository.ts` — criar

**Dependencias:**

- TASK-SETUP-004: Prisma schema

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] findSubReplicated(3) retorna chunks com menos de 3 replicas healthy
- [ ] findUnverified() ordena por verified_at ASC NULLS FIRST
- [ ] deleteByNode() remove todas as replicas de um no

**Testes Necessarios:**

- [ ] Integracao: queries de sub-replicacao contra PG real

**Consistencia Frontend:**

- Nenhuma

---

### TASK-DATA-007: ManifestRepository

**Camada:** Data
**Entidade:** Manifest
**Prioridade:** Must
**Origem:** 04-data-layer.md

**Descricao:**
Implementar ManifestRepository com Prisma: create(data), findByFileId(fileId), bulkCreate(data[]).

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/storage/manifest.repository.ts` — criar

**Dependencias:**

- TASK-SETUP-004: Prisma schema

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] findByFileId retorna manifest com chunks_json
- [ ] bulkCreate para recovery via seed

**Testes Necessarios:**

- [ ] Integracao: CRUD contra PG real

**Consistencia Frontend:**

- Nenhuma

---

### TASK-DATA-008: VaultRepository

**Camada:** Data
**Entidade:** Vault
**Prioridade:** Must
**Origem:** 04-data-layer.md

**Descricao:**
Implementar VaultRepository com Prisma: create(data), findByMember(memberId), update(memberId, data).

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/member/vault.repository.ts` — criar

**Dependencias:**

- TASK-SETUP-004: Prisma schema

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] findByMember retorna vault com dados criptografados
- [ ] Relacao 1:1 com Member

**Testes Necessarios:**

- [ ] Integracao: CRUD contra PG real

**Consistencia Frontend:**

- Nenhuma

---

### TASK-DATA-009: AlertRepository

**Camada:** Data
**Entidade:** Alert
**Prioridade:** Must
**Origem:** 04-data-layer.md

**Descricao:**
Implementar AlertRepository com Prisma: create(data), listActive(clusterId), listBySeverity(clusterId, severity), resolve(id).

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/health/alert.repository.ts` — criar

**Dependencias:**

- TASK-SETUP-004: Prisma schema

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] listActive retorna alertas nao resolvidos, ORDER BY created_at DESC
- [ ] resolve marca resolved = true e resolved_at = NOW()

**Testes Necessarios:**

- [ ] Integracao: CRUD contra PG real

**Consistencia Frontend:**

- Nenhuma

---

### TASK-DATA-010: InviteRepository

**Camada:** Data
**Entidade:** Invite
**Prioridade:** Must
**Origem:** 04-data-layer.md

**Descricao:**
Implementar InviteRepository com Prisma: create(data), findByToken(token), findByClusterAndEmail(clusterId, email), accept(id), deleteExpired().

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/member/invite.repository.ts` — criar

**Dependencias:**

- TASK-SETUP-004: Prisma schema

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] findByToken retorna invite valido (nao aceito, nao expirado)
- [ ] deleteExpired remove convites expirados nao aceitos

**Testes Necessarios:**

- [ ] Integracao: CRUD contra PG real

**Consistencia Frontend:**

- Nenhuma

---

### TASK-DATA-011: PreviewRepository

**Camada:** Data
**Entidade:** Preview
**Prioridade:** Must
**Origem:** 04-data-layer.md

**Descricao:**
Implementar PreviewRepository com Prisma: create(data), findByFileId(fileId).

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/file/preview.repository.ts` — criar

**Dependencias:**

- TASK-SETUP-004: Prisma schema

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] findByFileId retorna preview 1:1 com file
- [ ] Relacao UNIQUE file_id

**Testes Necessarios:**

- [ ] Integracao: CRUD contra PG real

**Consistencia Frontend:**

- Nenhuma

---

### TASK-DATA-012: Migration inicial completa

**Camada:** Data
**Entidade:** —
**Prioridade:** Must
**Origem:** 04-data-layer.md

**Descricao:**
Gerar migration Prisma com todas as 12 tabelas, indices e constraints. Convencao de nome: `20260325120000_create_initial_schema`. Incluir todos os indices criticos definidos em 04-data-layer.md.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/prisma/migrations/20260325120000_create_initial_schema/` — criar — migration SQL

**Dependencias:**

- TASK-SETUP-004: schema.prisma completo

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] `prisma migrate deploy` cria todas as tabelas
- [ ] Todos os indices criticos presentes (10 queries de alta performance)
- [ ] Constraints UNIQUE, FK, CHECK funcionam

**Testes Necessarios:**

- [ ] Integracao: migration contra PG testcontainers

**Consistencia Frontend:**

- Nenhuma

---

### TASK-DATA-013: Indices criticos de performance

**Camada:** Data
**Entidade:** —
**Prioridade:** Must
**Origem:** 04-data-layer.md

**Descricao:**
Verificar e garantir que todos os indices criticos estao na migration: idx_files_cluster_status, idx_files_content_hash, idx_chunk_replicas_chunk, idx_chunk_replicas_node, idx_nodes_last_heartbeat, idx_chunk_replicas_verified, idx_alerts_cluster_resolved, idx_manifests_file_id, idx_members_cluster_email, idx_nodes_cluster_status.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/prisma/schema.prisma` — editar — verificar @@index

**Dependencias:**

- TASK-DATA-012: migration inicial

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] Todas as 10 queries criticas executam com SLA < threshold definido
- [ ] EXPLAIN ANALYZE confirma uso dos indices

**Testes Necessarios:**

- [ ] Integracao: queries criticas contra PG com dados de teste

**Consistencia Frontend:**

- Nenhuma

---

## Grupo 4: Services

### TASK-SVC-001: ClusterService

**Camada:** Service
**Entidade:** Cluster
**Prioridade:** Must
**Origem:** 06-services.md

**Descricao:**
Implementar ClusterService com metodos: create(dto), recover(seedPhrase), findById(id). Fluxo create(): valida seed → deriva master key → gera keypair → cluster_id = SHA-256(pubkey) → transacao Prisma (cluster + admin + vault) → emite ClusterCreated. Fluxo recover(): re-deriva master key → reconecta nos → reindexa manifests.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/cluster/cluster.service.ts` — criar

**Dependencias:**

- TASK-DATA-001: ClusterRepository
- TASK-SVC-002: MemberService (createAdmin)
- TASK-SETUP-002: core-sdk CryptoEngine
- TASK-DOM-001: Cluster entity

**Regras de Negocio:**

- RN-C1, RN-C2: cluster_id derivado de seed

**Criterios de Aceite:**

- [ ] create() executa passos 1-13 do fluxo detalhado em 06-services.md
- [ ] Passos 8-10 dentro de prisma.$transaction()
- [ ] recover() re-deriva master key e reconstroi sistema
- [ ] Idempotencia: mesma seed = mesmo cluster_id (UNIQUE constraint)

**Testes Necessarios:**

- [ ] Unitario: create() com mocks (crypto, repo, memberService)
- [ ] Unitario: recover() com mocks
- [ ] Integracao: create() com PG real

**Consistencia Frontend:**

- CreateClusterPage consome POST /api/clusters
- RecoveryPage consome POST /api/clusters/:id/recovery

---

### TASK-SVC-002: MemberService

**Camada:** Service
**Entidade:** Member
**Prioridade:** Must
**Origem:** 06-services.md

**Descricao:**
Implementar MemberService com metodos: createAdmin(clusterId, dto), invite(clusterId, dto), acceptInvite(token, dto), findById(id), listByCluster(clusterId), remove(id). Fluxo acceptInvite(): passos 1-16 do fluxo detalhado — validar token → verificar expiracao → criar membro + vault em transacao → emitir MemberJoined → enviar email boas-vindas.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/member/member.service.ts` — criar

**Dependencias:**

- TASK-DATA-002: MemberRepository
- TASK-DATA-010: InviteRepository
- TASK-DATA-008: VaultRepository
- TASK-SVC-007: EmailService
- TASK-DOM-002: Member entity

**Regras de Negocio:**

- RN-M1: Email unico por cluster
- RN-M2: Pelo menos 1 admin
- RN-M4: Ingresso via convite
- RN-C3: Max 10 membros

**Criterios de Aceite:**

- [ ] acceptInvite() executa passos 1-16 do fluxo detalhado
- [ ] Transacao Prisma para passos 10-12
- [ ] invite() gera token assinado, envia email
- [ ] remove() valida ultimo admin

**Testes Necessarios:**

- [ ] Unitario: acceptInvite() com mocks
- [ ] Unitario: remove() ultimo admin lanca erro
- [ ] Integracao: acceptInvite() com PG real

**Consistencia Frontend:**

- MembersPage, AcceptInvitePage, InviteDialog

---

### TASK-SVC-003: NodeService

**Camada:** Service
**Entidade:** Node
**Prioridade:** Must
**Origem:** 06-services.md

**Descricao:**
Implementar NodeService com metodos: register(clusterId, dto), heartbeat(nodeId), drain(nodeId), findById(id), listByCluster(clusterId). Fluxo drain(): passos 1-11 do fluxo detalhado — status draining → listar chunks → re-replicar sub-replicados → remover do hash ring → status removed.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/node/node.service.ts` — criar

**Dependencias:**

- TASK-DATA-003: NodeRepository
- TASK-DATA-006: ChunkReplicaRepository
- TASK-SVC-005: StorageService
- TASK-SETUP-002: ConsistentHashRing
- TASK-DOM-003: Node entity

**Regras de Negocio:**

- RN-N3: Drain obrigatorio
- RN-N5: Teste de conectividade no registro
- RN-N6: Minimo 1 no ativo

**Criterios de Aceite:**

- [ ] register() testa conectividade (PUT/GET chunk teste)
- [ ] drain() executa passos 1-11 do fluxo detalhado
- [ ] Cada re-replicacao de chunk e transacao individual
- [ ] Idempotencia: drain pode ser retomado

**Testes Necessarios:**

- [ ] Unitario: register() com mock de conectividade
- [ ] Unitario: drain() com mocks
- [ ] Integracao: drain() com PG real

**Consistencia Frontend:**

- NodesPage, RegisterNodeDialog, DrainDialog

---

### TASK-SVC-004: FileService

**Camada:** Service
**Entidade:** File
**Prioridade:** Must
**Origem:** 06-services.md

**Descricao:**
Implementar FileService com metodos: upload(clusterId, memberId, file), findById(id), listGallery(clusterId, cursor?, limit?), listByType(clusterId, type, cursor?, limit?), download(fileId). Upload registra arquivo (status: processing), enfileira job BullMQ, retorna imediatamente. Download reassembla chunks via StorageService.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/file/file.service.ts` — criar

**Dependencias:**

- TASK-DATA-004: FileRepository
- TASK-DATA-011: PreviewRepository
- TASK-SVC-005: StorageService
- TASK-SETUP-005: BullMQ queue
- TASK-DOM-004: File entity

**Regras de Negocio:**

- RN-F1: Classificacao via MIME
- RN-F4: Limites de tamanho
- RN-F5: Deduplicacao
- RN-N6: Minimo 1 no para upload

**Criterios de Aceite:**

- [ ] upload() registra arquivo, enfileira job, retorna com status processing
- [ ] listGallery() com cursor-based pagination
- [ ] download() reassembla chunks e retorna ReadableStream
- [ ] Valida minimo 1 no ativo antes de aceitar upload

**Testes Necessarios:**

- [ ] Unitario: upload() com mocks
- [ ] Unitario: listGallery() com cursor
- [ ] Integracao: upload + download roundtrip

**Consistencia Frontend:**

- GalleryPage (UploadZone), GalleryGrid, FileDetailPage, Lightbox

---

### TASK-SVC-005: StorageService

**Camada:** Service
**Entidade:** Manifest, Chunk, ChunkReplica
**Prioridade:** Must
**Origem:** 06-services.md

**Descricao:**
Implementar StorageService com metodos: distributeChunks(file, optimizedContent), reReplicateChunk(chunkId), reassembleFile(fileId), createManifest(file, chunks). Fluxo distributeChunks(): passos 1-13 do fluxo detalhado — chunk → dedup → encrypt → distribute 3x → transacao (chunks + replicas) → manifest.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/storage/storage.service.ts` — criar

**Dependencias:**

- TASK-DATA-005: ChunkRepository
- TASK-DATA-006: ChunkReplicaRepository
- TASK-DATA-007: ManifestRepository
- TASK-SETUP-002: core-sdk (ChunkingEngine, CryptoEngine, ConsistentHashRing)
- TASK-INT-001: StorageProviderClient

**Regras de Negocio:**

- RN-CH1-CH6: Regras de chunks
- RN-CR1-CR4: Regras de replicas
- RN-MA1-MA5: Regras de manifests

**Criterios de Aceite:**

- [ ] distributeChunks() executa passos 1-13 do fluxo detalhado
- [ ] Deduplicacao: se hash existe, reutiliza chunk
- [ ] Criptografia: AES-256-GCM com file key
- [ ] Distribuicao: 3 nos via ConsistentHashRing
- [ ] Transacao: chunks + replicas atomicos
- [ ] createManifest() assina com chave do cluster

**Testes Necessarios:**

- [ ] Unitario: distributeChunks() com mocks
- [ ] Unitario: deduplicacao (hash existente)
- [ ] Integracao: distribute + reassemble roundtrip

**Consistencia Frontend:**

- Nenhuma — internal

---

### TASK-SVC-006: HealthService

**Camada:** Service
**Entidade:** Alert
**Prioridade:** Must
**Origem:** 06-services.md

**Descricao:**
Implementar HealthService com metodos: checkHeartbeats(), autoHeal(nodeId), scrub(batchSize), garbageCollect(), createAlert(data), resolveAlert(id). Fluxo autoHeal(): passos 1-7 do fluxo detalhado — listar chunks do no perdido → contar replicas → re-replicar sub-replicados → resolver alerta.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/health/health.service.ts` — criar
- `packages/orchestrator/src/modules/health/scheduler.service.ts` — criar — cron jobs

**Dependencias:**

- TASK-DATA-009: AlertRepository
- TASK-DATA-003: NodeRepository
- TASK-DATA-006: ChunkReplicaRepository
- TASK-SVC-005: StorageService
- TASK-SVC-007: EmailService

**Regras de Negocio:**

- RN-N1: 30min → suspect
- RN-N2: 1h → lost + auto-healing
- RN-CR1: Minimo 3 replicas
- RN-CH5: GC de orfaos

**Criterios de Aceite:**

- [ ] checkHeartbeats() detecta nos suspect/lost, atualiza status, cria alertas
- [ ] autoHeal() executa passos 1-7 do fluxo detalhado
- [ ] scrub() verifica integridade de replicas por batch
- [ ] garbageCollect() remove chunks orfaos
- [ ] Idempotencia: re-execucao segura

**Testes Necessarios:**

- [ ] Unitario: checkHeartbeats() com mocks
- [ ] Unitario: autoHeal() com mocks
- [ ] Integracao: scrub + GC contra PG real

**Consistencia Frontend:**

- AlertsPage, DashboardPage (HealthPanel)

---

### TASK-SVC-007: EmailService

**Camada:** Service
**Entidade:** —
**Prioridade:** Must
**Origem:** 06-services.md

**Descricao:**
Implementar EmailService com metodos: sendInvite(data), sendWelcome(data), sendNodeLostAlert(data), sendRecoveryComplete(data), sendFileError(data). Usa Resend SDK.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/notification/email.service.ts` — criar
- `packages/orchestrator/src/modules/notification/templates/` — criar — templates HTML

**Dependencias:**

- TASK-INT-002: ResendClient

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] 5 metodos de envio com templates diferentes
- [ ] Cada metodo chama ResendClient.sendEmail()
- [ ] Sem retry proprio — Resend SDK gerencia

**Testes Necessarios:**

- [ ] Unitario: cada metodo com mock do ResendClient

**Consistencia Frontend:**

- Nenhuma — emails sao server-side

---

### TASK-SVC-008: AuthService

**Camada:** Service
**Entidade:** Member
**Prioridade:** Must
**Origem:** 05-api-contracts.md, 07-controllers.md

**Descricao:**
Implementar AuthService com metodos: login(dto), refresh(token). Login valida email + senha (Argon2id), gera JWT com claims (sub, clusterId, role, iat, exp, iss). JWT assinado com cluster key, expiracao 24h.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/cluster/auth.service.ts` — criar

**Dependencias:**

- TASK-DATA-002: MemberRepository
- TASK-DOM-002: Member entity

**Regras de Negocio:**

- RN-M3: Role no JWT

**Criterios de Aceite:**

- [ ] login() valida senha com Argon2id, retorna JWT + member data
- [ ] JWT contem sub, clusterId, role, iat, exp, iss
- [ ] Token expira em 24h
- [ ] Credenciais invalidas retornam 401

**Testes Necessarios:**

- [ ] Unitario: login() com senha correta e incorreta
- [ ] Unitario: JWT claims corretos

**Consistencia Frontend:**

- LoginPage consome POST /api/auth/login
- AuthProvider gerencia token

---

## Grupo 5: API & Controllers

### TASK-API-001: AuthController

**Camada:** API
**Entidade:** Member
**Prioridade:** Must
**Origem:** 05-api-contracts.md, 07-controllers.md

**Descricao:**
Implementar AuthController com rotas: POST /api/auth/login (publica), POST /api/auth/refresh (cookie). Login seta cookie httpOnly access_token (Secure, SameSite=Strict, 24h). DTOs: LoginDTO (email, password).

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/cluster/auth.controller.ts` — criar
- `packages/orchestrator/src/modules/cluster/dto/login.dto.ts` — criar

**Dependencias:**

- TASK-SVC-008: AuthService

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] POST /api/auth/login retorna 200 + { member, accessToken } + cookie httpOnly
- [ ] POST /api/auth/refresh retorna 200 + { accessToken }
- [ ] Erros: 400 VALIDATION_ERROR, 401 INVALID_CREDENTIALS

**Testes Necessarios:**

- [ ] Integracao: login via supertest
- [ ] Integracao: refresh via supertest

**Consistencia Frontend:**

- LoginPage, AuthProvider

---

### TASK-API-002: ClusterController

**Camada:** API
**Entidade:** Cluster
**Prioridade:** Must
**Origem:** 05-api-contracts.md, 07-controllers.md

**Descricao:**
Implementar ClusterController com rotas: POST /api/clusters (publica), GET /api/clusters/:id (JWT + ClusterMemberGuard), POST /api/clusters/:id/recovery (publica). DTOs: CreateClusterDTO, RecoverClusterDTO, ClusterResponseDTO. Serializers: toClusterCreatedResponse(), toClusterResponse(), toRecoveryResponse().

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/cluster/cluster.controller.ts` — criar
- `packages/orchestrator/src/modules/cluster/dto/` — criar — 3 DTOs

**Dependencias:**

- TASK-SVC-001: ClusterService
- TASK-AUTH-001: JwtAuthGuard

**Regras de Negocio:**

- Nenhuma — validacao delegada ao service

**Criterios de Aceite:**

- [ ] POST /api/clusters retorna 201 + { cluster, member, seedPhrase }
- [ ] GET /api/clusters/:id retorna 200 + ClusterResponseDTO (sem seedPhrase, sem keys)
- [ ] POST /api/clusters/:id/recovery retorna 200 + recovery status
- [ ] Serializers removem encrypted_private_key, public_key bytes

**Testes Necessarios:**

- [ ] Integracao: endpoints via supertest

**Consistencia Frontend:**

- CreateClusterPage, DashboardPage, RecoveryPage

---

### TASK-API-003: MemberController

**Camada:** API
**Entidade:** Member, Invite
**Prioridade:** Must
**Origem:** 05-api-contracts.md, 07-controllers.md

**Descricao:**
Implementar MemberController com rotas: POST /api/clusters/:id/invites (JWT+admin), POST /api/invites/:token/accept (publica), GET /api/clusters/:id/members (JWT), DELETE /api/clusters/:id/members/:memberId (JWT+admin). DTOs: CreateInviteDTO, AcceptInviteDTO, MemberResponseDTO, CursorPaginationDTO.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/member/member.controller.ts` — criar
- `packages/orchestrator/src/modules/member/dto/` — criar — DTOs

**Dependencias:**

- TASK-SVC-002: MemberService
- TASK-AUTH-001: JwtAuthGuard
- TASK-AUTH-002: RolesGuard

**Regras de Negocio:**

- Nenhuma — validacao delegada ao service

**Criterios de Aceite:**

- [ ] POST /api/clusters/:id/invites retorna 201 + { id, token, inviteUrl, expiresAt, role }
- [ ] POST /api/invites/:token/accept retorna 201 + { member, accessToken }
- [ ] GET /api/clusters/:id/members retorna 200 + paginacao cursor
- [ ] DELETE retorna 204
- [ ] Serializers removem passwordHash, vaultKey

**Testes Necessarios:**

- [ ] Integracao: fluxo invite + accept via supertest

**Consistencia Frontend:**

- MembersPage, InviteDialog, AcceptInvitePage

---

### TASK-API-004: NodeController

**Camada:** API
**Entidade:** Node
**Prioridade:** Must
**Origem:** 05-api-contracts.md, 07-controllers.md

**Descricao:**
Implementar NodeController com rotas: POST /api/nodes (JWT+admin), GET /api/nodes (JWT), POST /api/nodes/:id/drain (JWT+admin), DELETE /api/nodes/:id (JWT+admin). DTOs: RegisterNodeDTO, NodeResponseDTO.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/node/node.controller.ts` — criar
- `packages/orchestrator/src/modules/node/dto/` — criar — DTOs

**Dependencias:**

- TASK-SVC-003: NodeService
- TASK-AUTH-001: JwtAuthGuard
- TASK-AUTH-002: RolesGuard

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] POST /api/nodes retorna 201 + NodeResponseDTO
- [ ] POST /api/nodes/:id/drain retorna 202 + { id, status, chunksToMigrate, estimatedTime }
- [ ] DELETE retorna 204 (somente apos drain completo)
- [ ] Serializers removem accessKey, secretKey

**Testes Necessarios:**

- [ ] Integracao: register + drain via supertest

**Consistencia Frontend:**

- NodesPage, RegisterNodeDialog, DrainDialog

---

### TASK-API-005: FileController

**Camada:** API
**Entidade:** File
**Prioridade:** Must
**Origem:** 05-api-contracts.md, 07-controllers.md

**Descricao:**
Implementar FileController com rotas: POST /api/files/upload (JWT, multipart, admin/member), GET /api/files (JWT), GET /api/files/:id (JWT), GET /api/files/:id/download (JWT), GET /api/files/:id/preview (JWT). Upload aceita multipart/form-data com limite 10GB. DTOs: UploadFileDTO, ListFilesQueryDTO, FileResponseDTO, FileDetailResponseDTO.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/file/file.controller.ts` — criar
- `packages/orchestrator/src/modules/file/dto/` — criar — DTOs

**Dependencias:**

- TASK-SVC-004: FileService
- TASK-AUTH-001: JwtAuthGuard

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] POST /api/files/upload retorna 202 + FileResponseDTO (status: processing)
- [ ] GET /api/files com cursor pagination e filtros (mediaType, status, search)
- [ ] GET /api/files/:id/download retorna stream com Content-Disposition: attachment
- [ ] GET /api/files/:id/preview retorna WebP com Cache-Control: 24h
- [ ] Readers nao podem fazer upload (403)

**Testes Necessarios:**

- [ ] Integracao: upload multipart via supertest
- [ ] Integracao: list com cursor via supertest

**Consistencia Frontend:**

- GalleryPage (UploadZone, GalleryGrid), FileDetailPage, Lightbox

---

### TASK-API-006: AlertController

**Camada:** API
**Entidade:** Alert
**Prioridade:** Must
**Origem:** 05-api-contracts.md, 07-controllers.md

**Descricao:**
Implementar AlertController com rotas: GET /api/alerts (JWT+admin), PATCH /api/alerts/:id/resolve (JWT+admin). DTOs: AlertResponseDTO, CursorPaginationDTO.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/health/alert.controller.ts` — criar
- `packages/orchestrator/src/modules/health/dto/` — criar — DTOs

**Dependencias:**

- TASK-SVC-006: HealthService
- TASK-AUTH-001: JwtAuthGuard
- TASK-AUTH-002: RolesGuard

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] GET /api/alerts retorna 200 + paginacao cursor
- [ ] PATCH /api/alerts/:id/resolve retorna 200 + { id, status, resolvedAt }
- [ ] Somente admin acessa (403 para member/reader)

**Testes Necessarios:**

- [ ] Integracao: list + resolve via supertest

**Consistencia Frontend:**

- AlertsBadge, AlertsDropdown, AlertsPage

---

### TASK-API-007: Serializers e DTOs globais

**Camada:** API
**Entidade:** —
**Prioridade:** Must
**Origem:** 07-controllers.md

**Descricao:**
Implementar funcoes serializadoras puras: toClusterResponse, toMemberResponse, toNodeResponse, toFileResponse, toFileDetailResponse, toAlertResponse, toInviteResponse, toPaginatedResponse, toErrorResponse. Implementar DTOs globais: CursorPaginationDTO, CursorPaginatedResponseDTO<T>, ErrorResponseDTO.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/common/serializers/` — criar — funcoes puras
- `packages/orchestrator/src/common/types/pagination.dto.ts` — criar — DTOs

**Dependencias:**

- Nenhuma

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] Serializers nunca retornam encrypted_private_key, passwordHash, accessKey, secretKey, fileKey
- [ ] previewUrl montado como /api/files/:id/preview
- [ ] toErrorResponse omite stack trace em producao
- [ ] CursorPaginatedResponseDTO<T> com { data: T[], meta: { cursor, hasMore } }

**Testes Necessarios:**

- [ ] Unitario: cada serializer remove campos sensiveis

**Consistencia Frontend:**

- Frontend depende do formato padrao de resposta paginada e erro

---

## Grupo 6: Auth & Permissions

### TASK-AUTH-001: JwtAuthGuard

**Camada:** Middleware
**Entidade:** —
**Prioridade:** Must
**Origem:** 08-middlewares.md, 11-permissions.md

**Descricao:**
Implementar JwtAuthGuard que valida JWT assinado com cluster key (Ed25519), extrai member_id, cluster_id e role do payload, verifica expiracao 24h, le token de httpOnly cookie. Whitelist publica: GET /health/\*, POST /api/auth/login, POST /api/clusters, POST /api/clusters/:id/recovery, POST /api/invites/:token/accept.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/common/guards/jwt-auth.guard.ts` — criar
- `packages/orchestrator/src/common/decorators/public.decorator.ts` — criar — @Public()

**Dependencias:**

- TASK-SETUP-003: orchestrator base

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] JWT valido popula request.user com { id, clusterId, role }
- [ ] JWT expirado retorna 401 TOKEN_EXPIRED
- [ ] JWT ausente/invalido retorna 401 INVALID_TOKEN
- [ ] Rotas @Public() bypass guard

**Testes Necessarios:**

- [ ] Integracao: JWT valido, expirado e ausente via supertest

**Consistencia Frontend:**

- AuthProvider envia cookie automaticamente

---

### TASK-AUTH-002: RolesGuard

**Camada:** Middleware
**Entidade:** —
**Prioridade:** Must
**Origem:** 08-middlewares.md, 11-permissions.md

**Descricao:**
Implementar RolesGuard que compara role do JWT contra @Roles() decorator. Implementar decorator @Roles('admin'). Retorna 403 INSUFFICIENT_PERMISSIONS se role insuficiente.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/common/guards/roles.guard.ts` — criar
- `packages/orchestrator/src/common/decorators/roles.decorator.ts` — criar

**Dependencias:**

- TASK-AUTH-001: JwtAuthGuard (role no request.user)

**Regras de Negocio:**

- RN-M3: Permissoes por role

**Criterios de Aceite:**

- [ ] @Roles('admin') em rota bloqueia member/reader
- [ ] 403 FORBIDDEN retornado com mensagem clara

**Testes Necessarios:**

- [ ] Integracao: role correto e errado via supertest

**Consistencia Frontend:**

- Frontend faz check de role para exibir/ocultar botoes admin

---

### TASK-AUTH-003: ClusterMemberGuard

**Camada:** Middleware
**Entidade:** —
**Prioridade:** Must
**Origem:** 07-controllers.md

**Descricao:**
Implementar ClusterMemberGuard que verifica se member.clusterId == params.id (ou params.clusterId). Retorna 403 FORBIDDEN se nao pertence ao cluster.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/common/guards/cluster-member.guard.ts` — criar

**Dependencias:**

- TASK-AUTH-001: JwtAuthGuard

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] Membro do cluster acessa rota normalmente
- [ ] Membro de outro cluster recebe 403

**Testes Necessarios:**

- [ ] Integracao: acesso cross-cluster via supertest

**Consistencia Frontend:**

- Nenhuma — frontend so acessa seu proprio cluster

---

### TASK-AUTH-004: @CurrentMember decorator

**Camada:** Middleware
**Entidade:** —
**Prioridade:** Must
**Origem:** 07-controllers.md

**Descricao:**
Implementar decorator @CurrentMember() que extrai member do request.user apos JwtAuthGuard.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/common/decorators/current-member.decorator.ts` — criar

**Dependencias:**

- TASK-AUTH-001: JwtAuthGuard

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] @CurrentMember() retorna Member com id, clusterId, role

**Testes Necessarios:**

- [ ] Unitario: decorator extrai corretamente do context

**Consistencia Frontend:**

- Nenhuma

---

### TASK-AUTH-005: JWT Claims e token generation

**Camada:** Middleware
**Entidade:** —
**Prioridade:** Must
**Origem:** 11-permissions.md

**Descricao:**
Implementar geracao e validacao de JWT com claims: sub (member_id), clusterId, role, iat, exp (iat + 24h), iss ("alexandria"). Token armazenado em httpOnly cookie (Secure em prod, SameSite=Strict).

**Arquivos a criar/editar:**

- `packages/orchestrator/src/common/guards/jwt.strategy.ts` — criar — estrategia de validacao

**Dependencias:**

- TASK-SETUP-003: orchestrator base

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] JWT contem claims corretos
- [ ] Expiracao 24h
- [ ] Issuer = "alexandria"

**Testes Necessarios:**

- [ ] Unitario: geracao e validacao de JWT

**Consistencia Frontend:**

- AuthProvider le accessToken do cookie

---

## Grupo 7: Error Handling

### TASK-ERR-001: Hierarquia de excecoes AppError

**Camada:** Domain
**Entidade:** —
**Prioridade:** Must
**Origem:** 09-errors.md

**Descricao:**
Implementar hierarquia completa de excecoes: AppError (base) → ValidationError (400), AuthenticationError (401), AuthorizationError (403), NotFoundError (404), ConflictError (409), BusinessRuleError (422), RateLimitError (429), ServiceUnavailableError (503), ExternalServiceError (502). Subclasses especificas: ClusterNotFoundError, MemberNotFoundError, NodeNotFoundError, FileNotFoundError, MemberAlreadyExistsError, InsufficientNodesError, InvalidSeedPhraseError, FileTooLargeError, ClusterFullError, StorageProviderError, EmailServiceError, FFmpegError.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/common/errors/app-error.ts` — criar — classe base
- `packages/orchestrator/src/common/errors/` — criar — subclasses por categoria

**Dependencias:**

- Nenhuma

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] Cada erro tem code (UPPER_SNAKE_CASE), message (portugues), status HTTP
- [ ] Hierarquia permite catch por nivel (ex: catch NotFoundError)
- [ ] Todos os 24 codigos do catalogo implementados

**Testes Necessarios:**

- [ ] Unitario: cada subclasse tem code e status corretos

**Consistencia Frontend:**

- Frontend usa code para decidir UX (error-ux-mapping.md)

---

### TASK-ERR-002: GlobalExceptionFilter

**Camada:** Middleware
**Entidade:** —
**Prioridade:** Must
**Origem:** 08-middlewares.md, 09-errors.md

**Descricao:**
Implementar GlobalExceptionFilter como catch-all NestJS. Converte AppError e excecoes nao tratadas no formato JSON padrao: { error: { code, message, status, details, requestId, timestamp } }. Stack trace omitido em producao.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/common/filters/global-exception.filter.ts` — criar

**Dependencias:**

- TASK-ERR-001: hierarquia AppError
- TASK-MW-001: RequestId middleware

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] AppError formatado com code, message, status, requestId, timestamp
- [ ] ValidationError inclui details (array de { field, message })
- [ ] Erro nao tratado retorna 500 INTERNAL_ERROR
- [ ] Stack trace nunca em producao

**Testes Necessarios:**

- [ ] Unitario: formatacao de cada tipo de erro
- [ ] Unitario: stack trace omitido em prod

**Consistencia Frontend:**

- Frontend parseia formato padrao de erro

---

### TASK-ERR-003: Erros de negocio por entidade

**Camada:** Domain
**Entidade:** —
**Prioridade:** Must
**Origem:** 09-errors.md

**Descricao:**
Implementar erros especificos de negocio: InvalidStateTransitionError (422), InviteExpiredError (410), InviteAlreadyAcceptedError (409), CannotRemoveLastAdminError (422), DrainNotCompleteError (422), InsufficientSpaceError (422), ConnectivityFailedError (422), InvalidCredentialsError (401), SeedMismatchError (422), NodesUnreachableError (503), FileUnavailableError (503), PreviewNotReadyError (404), AlreadyResolvedError (422).

**Arquivos a criar/editar:**

- `packages/orchestrator/src/common/errors/business/` — criar — erros especificos

**Dependencias:**

- TASK-ERR-001: hierarquia AppError

**Regras de Negocio:**

- Cada erro corresponde a uma regra de negocio especifica

**Criterios de Aceite:**

- [ ] Cada erro tem code unico e status HTTP correto
- [ ] Mensagens em portugues, seguras para exibir ao usuario

**Testes Necessarios:**

- [ ] Unitario: cada erro com code e status

**Consistencia Frontend:**

- error-ux-mapping.md mapeia cada codigo para acao de UI

---

### TASK-ERR-004: ValidationPipe global

**Camada:** Middleware
**Entidade:** —
**Prioridade:** Must
**Origem:** 08-middlewares.md, 10-validation.md

**Descricao:**
Configurar ValidationPipe global com class-validator + class-transformer: whitelist: true, forbidNonWhitelisted: true. Implementar validacao por entidade conforme 10-validation.md: Cluster (name), Member (name, email, password, role), Node (name, type, endpoint, totalCapacity), File (file multipart, limites por mediaType), Invite (email, role), SeedPhrase (12 palavras BIP-39). Sanitizacao: email → lowercase + trim, names → trim + normalize whitespace, original_name → sanitizar path chars.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/common/pipes/validation.pipe.ts` — criar — config global
- DTOs de cada modulo — editar — adicionar decorators @IsEmail(), @MinLength(), etc.

**Dependencias:**

- TASK-ERR-001: ValidationError para formato

**Regras de Negocio:**

- Nenhuma — validacao e mecanica

**Criterios de Aceite:**

- [ ] Campos invalidos retornam 400 com details por campo
- [ ] Propriedades desconhecidas rejeitadas (forbidNonWhitelisted)
- [ ] Sanitizacao aplicada: email lowercase, names trim

**Testes Necessarios:**

- [ ] Integracao: validacao de cada DTO via supertest

**Consistencia Frontend:**

- Frontend valida client-side, backend valida server-side

---

## Grupo 8: Middlewares

### TASK-MW-001: RequestId middleware

**Camada:** Middleware
**Entidade:** —
**Prioridade:** Must
**Origem:** 08-middlewares.md

**Descricao:**
Implementar middleware que gera UUID v4, adiciona header X-Request-Id ao request e response, propaga via AsyncLocalStorage para tracing.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/common/interceptors/request-id.interceptor.ts` — criar

**Dependencias:**

- Nenhuma

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] Toda response contem header X-Request-Id
- [ ] RequestId acessivel via AsyncLocalStorage em qualquer camada

**Testes Necessarios:**

- [ ] Integracao: verificar header X-Request-Id via supertest

**Consistencia Frontend:**

- Nenhuma

---

### TASK-MW-002: LoggingInterceptor

**Camada:** Middleware
**Entidade:** —
**Prioridade:** Must
**Origem:** 08-middlewares.md

**Descricao:**
Implementar LoggingInterceptor NestJS que loga: method, path, timestamp no inicio; status HTTP, duracao em ms e response size no fim. Usa nestjs-pino com requestId do contexto.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/common/interceptors/logging.interceptor.ts` — criar

**Dependencias:**

- TASK-MW-001: RequestId
- TASK-SETUP-006: pino configurado

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] Logs JSON com method, path, status, duration, size, requestId

**Testes Necessarios:**

- [ ] Unitario: interceptor loga campos corretos

**Consistencia Frontend:**

- Nenhuma

---

### TASK-MW-003: ThrottlerGuard (Rate Limiting)

**Camada:** Middleware
**Entidade:** —
**Prioridade:** Must
**Origem:** 08-middlewares.md

**Descricao:**
Configurar @nestjs/throttler com Redis como storage. Limites: API geral 100 req/min por membro, upload 10/min, heartbeat 2/min, recovery 3/hora por IP, convites 10/hora por admin. Headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/common/guards/throttler.guard.ts` — criar — config com escopos

**Dependencias:**

- TASK-SETUP-005: Redis configurado

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] Rate limit por escopo configurado
- [ ] 429 com headers X-RateLimit-\*
- [ ] Storage em Redis

**Testes Necessarios:**

- [ ] Integracao: exceder limite e verificar 429

**Consistencia Frontend:**

- RateLimitBanner exibe countdown baseado em X-RateLimit-Reset

---

### TASK-MW-004: CORS middleware

**Camada:** Middleware
**Entidade:** —
**Prioridade:** Must
**Origem:** 08-middlewares.md

**Descricao:**
Configurar CORS: origins = WEB_CLIENT_URL + localhost:3000 (dev), methods = GET/POST/PATCH/DELETE/OPTIONS, headers = Authorization/Content-Type/X-Request-Id, credentials = true, maxAge = 86400.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/main.ts` — editar — adicionar app.enableCors(config)

**Dependencias:**

- TASK-SETUP-003: orchestrator base

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] Preflight OPTIONS responde com headers corretos
- [ ] Credentials habilitados para cookies httpOnly

**Testes Necessarios:**

- [ ] Integracao: preflight request via supertest

**Consistencia Frontend:**

- Web client depende de CORS para enviar cookies

---

### TASK-MW-005: SerializerInterceptor

**Camada:** Middleware
**Entidade:** —
**Prioridade:** Must
**Origem:** 08-middlewares.md

**Descricao:**
Configurar ClassSerializerInterceptor do NestJS para remover campos marcados com @Exclude() (senhas, keys, tokens internos) das respostas.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/app.module.ts` — editar — registrar interceptor global

**Dependencias:**

- TASK-SETUP-003: orchestrator base

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] Campos @Exclude() nao aparecem nas respostas JSON

**Testes Necessarios:**

- [ ] Integracao: verificar que passwordHash nao aparece em response

**Consistencia Frontend:**

- Nenhuma

---

### TASK-MW-006: BodyParser com limites

**Camada:** Middleware
**Entidade:** —
**Prioridade:** Should
**Origem:** 08-middlewares.md

**Descricao:**
Configurar express.json com limite 10MB para JSON. Configurar multer para multipart com limite 10GB (video). Upload via FileInterceptor do NestJS com ParseFilePipe e FileTypeValidator para MIME whitelist.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/main.ts` — editar — configurar body parser limits

**Dependencias:**

- TASK-SETUP-003: orchestrator base

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] JSON > 10MB retorna 413
- [ ] Multipart > 10GB retorna 413
- [ ] MIME types nao permitidos rejeitados

**Testes Necessarios:**

- [ ] Integracao: upload com MIME invalido via supertest

**Consistencia Frontend:**

- Nenhuma

---

## Grupo 9: Events & Workers

### TASK-EVT-001: EventBus (Redis pub/sub)

**Camada:** Event
**Entidade:** —
**Prioridade:** Must
**Origem:** 12-events.md

**Descricao:**
Implementar EventBus baseado em Redis pub/sub para eventos internos (ClusterCreated, NodeRegistered, FileProcessed, AlertResolved). Envelope padrao: { eventId, type, version, timestamp, source, payload }. Idempotencia por eventId.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/common/events/event-bus.ts` — criar — publish/subscribe
- `packages/orchestrator/src/common/events/event-envelope.ts` — criar — tipo base

**Dependencias:**

- TASK-SETUP-005: Redis configurado

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] Eventos publicados com envelope padrao
- [ ] eventId UUID v4 para idempotencia
- [ ] Subscribers recebem eventos tipados

**Testes Necessarios:**

- [ ] Integracao: publish + subscribe roundtrip via testcontainers Redis

**Consistencia Frontend:**

- Frontend pode consumir eventos via polling (nao WebSocket na v1)

---

### TASK-EVT-002: PhotoWorker

**Camada:** Event
**Entidade:** File, Preview
**Prioridade:** Must
**Origem:** 12-events.md

**Descricao:**
Implementar PhotoWorker que consome fila media.photos: libvips resize WebP 1920px + gerar thumbnail ~50KB + extrair EXIF + chamar StorageService.distributeChunks(). Concorrencia: 3, timeout: 60s, retry: 3x backoff exponencial, DLQ: media.dlq.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/workers/photo.worker.ts` — criar

**Dependencias:**

- TASK-SETUP-005: BullMQ queue media.photos
- TASK-SVC-005: StorageService
- TASK-INT-004: SharpClient
- TASK-DOM-004: File entity
- TASK-DOM-005: Preview entity

**Regras de Negocio:**

- RN-F2: Fotos → WebP max 1920px
- RN-P2: Thumbnail ~50KB WebP

**Criterios de Aceite:**

- [ ] Consome job da fila media.photos
- [ ] Resize para max 1920px + WebP
- [ ] Gera thumbnail ~50KB
- [ ] Extrai EXIF (GPS, data, camera)
- [ ] Chama StorageService.distributeChunks()
- [ ] Atualiza file status para ready (ou error)
- [ ] Retry 3x com backoff, DLQ apos falha

**Testes Necessarios:**

- [ ] Integracao: pipeline foto JPEG → WebP com sharp + testcontainers MinIO

**Consistencia Frontend:**

- GalleryGrid exibe thumbnails gerados

---

### TASK-EVT-003: VideoWorker

**Camada:** Event
**Entidade:** File, Preview
**Prioridade:** Must
**Origem:** 12-events.md

**Descricao:**
Implementar VideoWorker que consome fila media.videos: FFmpeg 1080p H.265/AV1 + gerar preview 480p ~5MB + extrair metadata (duracao, resolucao, codec) + chamar StorageService.distributeChunks(). Concorrencia: 1, timeout: 600s, retry: 3x backoff exponencial, DLQ: media.dlq.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/workers/video.worker.ts` — criar

**Dependencias:**

- TASK-SETUP-005: BullMQ queue media.videos
- TASK-SVC-005: StorageService
- TASK-INT-003: FFmpegClient
- TASK-DOM-004: File entity

**Regras de Negocio:**

- RN-F2: Videos → 1080p H.265/AV1
- RN-P2: Preview 480p ~5MB MP4

**Criterios de Aceite:**

- [ ] Consome job da fila media.videos
- [ ] Transcode para 1080p H.265/AV1
- [ ] Gera preview 480p
- [ ] Extrai metadata
- [ ] Concorrencia 1 (CPU-intensive)
- [ ] Timeout 600s

**Testes Necessarios:**

- [ ] Integracao: pipeline video MP4 → H.265 com FFmpeg + testcontainers MinIO

**Consistencia Frontend:**

- GalleryGrid exibe video previews

---

### TASK-EVT-004: EmailWorker

**Camada:** Event
**Entidade:** —
**Prioridade:** Must
**Origem:** 12-events.md

**Descricao:**
Implementar EmailWorker que consome fila email.send: envia email via Resend SDK conforme tipo (invite, welcome, node_lost_alert, recovery_complete, file_error). Concorrencia: 5, timeout: 30s, retry: 3x linear 30s, DLQ: email.send.dlq.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/workers/email.worker.ts` — criar

**Dependencias:**

- TASK-SETUP-005: BullMQ queue email.send
- TASK-SVC-007: EmailService

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] Consome job da fila email.send
- [ ] Chama EmailService com dados do job
- [ ] Retry 3x linear 30s
- [ ] DLQ apos falha

**Testes Necessarios:**

- [ ] Unitario: worker com mock do EmailService

**Consistencia Frontend:**

- Nenhuma

---

### TASK-EVT-005: AutoHealWorker

**Camada:** Event
**Entidade:** Chunk, ChunkReplica
**Prioridade:** Must
**Origem:** 12-events.md

**Descricao:**
Implementar AutoHealWorker que consome fila healing.process: re-replica chunks de node perdido para nodes saudaveis via HealthService.autoHeal(). Concorrencia: 1, timeout: 3600s (1h), retry: 5x backoff exponencial, DLQ: healing.dlq.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/workers/auto-heal.worker.ts` — criar

**Dependencias:**

- TASK-SETUP-005: BullMQ queue healing.process
- TASK-SVC-006: HealthService

**Regras de Negocio:**

- RN-CR1: Restaurar minimo 3 replicas

**Criterios de Aceite:**

- [ ] Consome job da fila healing.process
- [ ] Chama HealthService.autoHeal(nodeId)
- [ ] Concorrencia 1
- [ ] Retry 5x backoff exponencial

**Testes Necessarios:**

- [ ] Unitario: worker com mock do HealthService

**Consistencia Frontend:**

- Nenhuma

---

### TASK-EVT-006: Cron HeartbeatCheck

**Camada:** Event
**Entidade:** Node
**Prioridade:** Must
**Origem:** 12-events.md

**Descricao:**
Implementar cron job HeartbeatCheck via @nestjs/schedule: cada 5 min, encontra nodes suspect/lost, atualiza status, emite NodeSuspect/NodeLost, enfileira auto-healing. Timeout: 60s.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/health/scheduler.service.ts` — editar — adicionar @Cron

**Dependencias:**

- TASK-SVC-006: HealthService.checkHeartbeats()

**Regras de Negocio:**

- RN-N1: 30min → suspect
- RN-N2: 1h → lost

**Criterios de Aceite:**

- [ ] Executa cada 5 minutos
- [ ] Detecta nos suspect (30min sem heartbeat) e lost (1h)
- [ ] Cria alertas e enfileira auto-healing

**Testes Necessarios:**

- [ ] Unitario: checkHeartbeats() com mocks

**Consistencia Frontend:**

- Nenhuma

---

### TASK-EVT-007: Cron Scrubbing

**Camada:** Event
**Entidade:** ChunkReplica
**Prioridade:** Must
**Origem:** 12-events.md

**Descricao:**
Implementar cron job Scrubbing via @nestjs/schedule: diario as 03:00, verifica lote de 1000 replicas (recalculo SHA-256), cria alertas para corrompidos. Timeout: 7200s (2h).

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/health/scheduler.service.ts` — editar — adicionar @Cron

**Dependencias:**

- TASK-SVC-006: HealthService.scrub()

**Regras de Negocio:**

- RN-CR3: Scrubbing periodico

**Criterios de Aceite:**

- [ ] Executa diariamente as 03:00
- [ ] Verifica 1000 replicas por execucao
- [ ] Cria alertas para replicas corrompidas

**Testes Necessarios:**

- [ ] Unitario: scrub() com mocks

**Consistencia Frontend:**

- Nenhuma

---

### TASK-EVT-008: Cron GarbageCollection

**Camada:** Event
**Entidade:** Chunk
**Prioridade:** Should
**Origem:** 12-events.md

**Descricao:**
Implementar cron job GarbageCollection: diario as 04:00, encontra e deleta chunks orfaos (reference_count = 0). Timeout: 3600s.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/health/scheduler.service.ts` — editar — adicionar @Cron

**Dependencias:**

- TASK-SVC-006: HealthService.garbageCollect()

**Regras de Negocio:**

- RN-CH5: Chunks orfaos elegiveis para GC

**Criterios de Aceite:**

- [ ] Executa diariamente as 04:00
- [ ] Remove chunks com reference_count = 0
- [ ] Remove replicas de nos removidos

**Testes Necessarios:**

- [ ] Unitario: garbageCollect() com mocks

**Consistencia Frontend:**

- Nenhuma

---

### TASK-EVT-009: Cron CleanExpiredInvites

**Camada:** Event
**Entidade:** Invite
**Prioridade:** Should
**Origem:** 12-events.md

**Descricao:**
Implementar cron job CleanExpiredInvites: diario as 05:00, deleta convites expirados nao aceitos. Timeout: 60s.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/modules/health/scheduler.service.ts` — editar — adicionar @Cron

**Dependencias:**

- TASK-DATA-010: InviteRepository.deleteExpired()

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] Executa diariamente as 05:00
- [ ] Remove convites com expires_at < NOW() e accepted_at IS NULL

**Testes Necessarios:**

- [ ] Unitario: deleteExpired() com mocks

**Consistencia Frontend:**

- Nenhuma

---

### TASK-EVT-010: Event schemas e envelope padrao

**Camada:** Event
**Entidade:** —
**Prioridade:** Must
**Origem:** 12-events.md

**Descricao:**
Implementar schemas de todos os eventos com envelope padrao: { eventId, type, version, timestamp, source, payload }. Eventos: FileUploaded, ClusterRecovered, NodeLost, MemberJoined, AlertCreated. Cada schema com tipagem TypeScript forte.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/common/events/schemas/` — criar — 1 arquivo por evento

**Dependencias:**

- TASK-EVT-001: EventBus

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] Todos os 5 schemas principais tipados
- [ ] Envelope padrao consistente
- [ ] eventId UUID v4

**Testes Necessarios:**

- [ ] Unitario: validacao de schema

**Consistencia Frontend:**

- Frontend pode usar schemas para tipagem de polling responses

---

## Grupo 10: Integrations

### TASK-INT-001: StorageProviderClient (S3/R2/B2)

**Camada:** Integration
**Entidade:** —
**Prioridade:** Must
**Origem:** 13-integrations.md

**Descricao:**
Implementar StorageProviderClient com aws-sdk-s3 v3: putChunk (30s, 3x backoff), getChunk (30s, 3x), existsChunk (10s, 3x), deleteChunk (10s, 3x), listChunks (10s, 3x), getCapacity (5s, 2x). Circuit breaker: 5 falhas em 60s → aberto 30s → half-open 1 req. Fallback: tentar proxima replica.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/infrastructure/storage/storage-provider.client.ts` — criar
- `packages/orchestrator/src/infrastructure/storage/circuit-breaker.ts` — criar

**Dependencias:**

- TASK-SETUP-002: interface StorageProvider do core-sdk

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] 6 metodos implementados com aws-sdk-s3 v3
- [ ] Timeout e retry por metodo
- [ ] Circuit breaker com threshold 5/60s
- [ ] Credenciais desencriptadas em runtime do vault

**Testes Necessarios:**

- [ ] Integracao: CRUD de chunk contra MinIO testcontainers
- [ ] Unitario: circuit breaker abre e fecha

**Consistencia Frontend:**

- Nenhuma — internal

---

### TASK-INT-002: ResendClient

**Camada:** Integration
**Entidade:** —
**Prioridade:** Must
**Origem:** 13-integrations.md

**Descricao:**
Implementar ResendClient: sendEmail(to, subject, html, text). Timeout: 10s, retry: 3x linear 30s. Circuit breaker: 10 falhas em 5min → aberto 60s. Config: RESEND_API_KEY, RESEND_FROM_EMAIL via env vars.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/infrastructure/email/resend.client.ts` — criar

**Dependencias:**

- Nenhuma

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] sendEmail() envia via Resend SDK
- [ ] Timeout 10s, retry 3x linear
- [ ] Circuit breaker configurado
- [ ] Fallback: enfileira em DLQ

**Testes Necessarios:**

- [ ] Unitario: sendEmail() com mock do SDK

**Consistencia Frontend:**

- Nenhuma

---

### TASK-INT-003: FFmpegClient

**Camada:** Integration
**Entidade:** —
**Prioridade:** Must
**Origem:** 13-integrations.md

**Descricao:**
Implementar FFmpegClient: transcode(inputPath, outputPath, options) — 600s timeout, 3x retry; extractMetadata(inputPath) — 30s, 2x; generatePreview(inputPath, outputPath, options) — 120s, 3x backoff. Config: FFMPEG_PATH via env var.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/infrastructure/media/ffmpeg.client.ts` — criar

**Dependencias:**

- Nenhuma

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] transcode() converte para H.265/AV1 1080p
- [ ] extractMetadata() retorna duracao, resolucao, codec
- [ ] generatePreview() gera 480p

**Testes Necessarios:**

- [ ] Integracao: transcode com sample video

**Consistencia Frontend:**

- Nenhuma

---

### TASK-INT-004: SharpClient (libvips)

**Camada:** Integration
**Entidade:** —
**Prioridade:** Must
**Origem:** 13-integrations.md

**Descricao:**
Implementar SharpClient: resize(inputBuffer, maxWidth, format) — 30s, 2x; generateThumbnail(inputBuffer, size) — 30s, 2x; extractExif(inputBuffer) — 10s, 1x.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/infrastructure/media/sharp.client.ts` — criar

**Dependencias:**

- Nenhuma

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] resize() converte para WebP max 1920px
- [ ] generateThumbnail() gera 200x200
- [ ] extractExif() retorna GPS, data, camera

**Testes Necessarios:**

- [ ] Integracao: resize JPEG → WebP com sample image

**Consistencia Frontend:**

- Nenhuma

---

## Grupo 11: Tests

### TASK-TEST-001: Setup de test runner + config

**Camada:** Test
**Entidade:** —
**Prioridade:** Must
**Origem:** 14-tests.md

**Descricao:**
Configurar Jest com ts-jest, paths aliases, testcontainers setup (PG 18, Redis 7, MinIO). Configurar istanbul/c8 para cobertura. Criar scripts: `test` (unit), `test:int` (integration), `test:e2e` (e2e), `test:coverage`. Criar factories em test/factories/ para dados de teste.

**Arquivos a criar/editar:**

- `jest.config.ts` — editar — paths, testcontainers, coverage thresholds
- `test/factories/` — criar — factory functions por entidade
- `test/setup/testcontainers.ts` — criar — setup PG + Redis + MinIO

**Dependencias:**

- TASK-SETUP-001: monorepo

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] `pnpm test` roda unit tests
- [ ] `pnpm test:int` roda integration com testcontainers
- [ ] Coverage thresholds: geral 80%, core-sdk 90%, entities 95%
- [ ] Factories para cada entidade

**Testes Necessarios:**

- [ ] Unitario: smoke test do setup

**Consistencia Frontend:**

- Nenhuma

---

### TASK-TEST-002: Testes unitarios do core-sdk

**Camada:** Test
**Entidade:** —
**Prioridade:** Must
**Origem:** 14-tests.md

**Descricao:**
Implementar testes unitarios obrigatorios do core-sdk: AES-256-GCM encrypt/decrypt roundtrip (+ property-based 10k iteracoes), SHA-256 deterministico, chunking edge cases, envelope encryption completa, consistent hashing (proporcionalidade + estabilidade), BIP-39 seed generation/validacao.

**Arquivos a criar/editar:**

- `packages/core-sdk/tests/crypto.spec.ts` — criar
- `packages/core-sdk/tests/chunking.spec.ts` — criar
- `packages/core-sdk/tests/hashing.spec.ts` — criar
- `packages/core-sdk/tests/consistent-hash.spec.ts` — criar
- `packages/core-sdk/tests/manifest.spec.ts` — criar
- `packages/core-sdk/tests/vault.spec.ts` — criar

**Dependencias:**

- TASK-SETUP-002: core-sdk implementado

**Regras de Negocio:**

- Cobertura 90% para core-sdk

**Criterios de Aceite:**

- [ ] Todos os cenarios obrigatorios de 14-tests.md cobertos
- [ ] Property-based testing com fast-check para crypto
- [ ] Cobertura >= 90%

**Testes Necessarios:**

- [ ] Os proprios testes sao o entregavel

**Consistencia Frontend:**

- Nenhuma

---

### TASK-TEST-003: Testes de integracao de repositories

**Camada:** Test
**Entidade:** —
**Prioridade:** Must
**Origem:** 14-tests.md

**Descricao:**
Implementar testes de integracao contra PostgreSQL real (testcontainers): CRUD de cluster, member, node, file, chunk_replica. Validar queries criticas com SLA de performance.

**Arquivos a criar/editar:**

- `test/integration/repositories/cluster.repository.spec.ts` — criar
- `test/integration/repositories/member.repository.spec.ts` — criar
- `test/integration/repositories/node.repository.spec.ts` — criar
- `test/integration/repositories/file.repository.spec.ts` — criar
- `test/integration/repositories/chunk-replica.repository.spec.ts` — criar

**Dependencias:**

- TASK-DATA-001 a TASK-DATA-011: repositories implementados
- TASK-TEST-001: testcontainers setup

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] CRUD completo contra PG real para cada repository
- [ ] Queries criticas dentro do SLA

**Testes Necessarios:**

- [ ] Os proprios testes sao o entregavel

**Consistencia Frontend:**

- Nenhuma

---

### TASK-TEST-004: Testes de integracao de auth

**Camada:** Test
**Entidade:** —
**Prioridade:** Must
**Origem:** 14-tests.md

**Descricao:**
Implementar testes de integracao de autenticacao e autorizacao: JWT valido, expirado e ausente (JwtAuthGuard), role correto e errado (RolesGuard).

**Arquivos a criar/editar:**

- `test/integration/auth/jwt.guard.spec.ts` — criar
- `test/integration/auth/roles.guard.spec.ts` — criar

**Dependencias:**

- TASK-AUTH-001: JwtAuthGuard
- TASK-AUTH-002: RolesGuard
- TASK-TEST-001: testcontainers setup

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] JWT valido permite acesso
- [ ] JWT expirado retorna 401
- [ ] JWT ausente retorna 401
- [ ] Role insuficiente retorna 403

**Testes Necessarios:**

- [ ] Os proprios testes sao o entregavel

**Consistencia Frontend:**

- Nenhuma

---

### TASK-TEST-005: Testes E2E dos 5 fluxos criticos

**Camada:** Test
**Entidade:** —
**Prioridade:** Should
**Origem:** 14-tests.md

**Descricao:**
Implementar testes E2E dos 5 fluxos criticos: (1) Upload de arquivo (foto + video), (2) Download de arquivo, (3) Criacao de cluster, (4) Recovery via seed, (5) Auto-healing. Docker Compose completo com PG + Redis + MinIO.

**Arquivos a criar/editar:**

- `test/e2e/cluster.e2e.spec.ts` — criar
- `test/e2e/upload.e2e.spec.ts` — criar
- `test/e2e/download.e2e.spec.ts` — criar
- `test/e2e/recovery.e2e.spec.ts` — criar
- `test/e2e/auto-healing.e2e.spec.ts` — criar

**Dependencias:**

- Todos os grupos anteriores implementados

**Regras de Negocio:**

- Cobertura 100% dos fluxos criticos

**Criterios de Aceite:**

- [ ] Upload: upload → processamento → chunk → encrypt → distribute → ready
- [ ] Download: request → fetch chunks → decrypt → reassemble → stream
- [ ] Cluster: seed → master key → cluster + admin
- [ ] Recovery: seed → rebuild → restaurar
- [ ] Auto-healing: node lost → re-replicar

**Testes Necessarios:**

- [ ] Os proprios testes sao o entregavel

**Consistencia Frontend:**

- Nenhuma

---

### TASK-TEST-006: Setup de CI pipeline

**Camada:** Test
**Entidade:** —
**Prioridade:** Should
**Origem:** 14-tests.md

**Descricao:**
Configurar CI pipeline: PR → eslint + prettier + jest (unit) (3min), merge → unit + integration com testcontainers (5min), pre-deploy → E2E (15min), post-deploy → smoke (2min).

**Arquivos a criar/editar:**

- `.github/workflows/ci.yml` — criar — pipeline completa

**Dependencias:**

- TASK-TEST-001: test runner configurado

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] PR bloqueia merge se lint/unit falhar
- [ ] Merge bloqueia se integration falhar
- [ ] Tempo total PR → merge < 10min

**Testes Necessarios:**

- [ ] O pipeline e o entregavel

**Consistencia Frontend:**

- Nenhuma

---

## Grupo 12: Frontend Sync

### TASK-FE-001: Alinhamento de DTOs (backend ↔ frontend types)

**Camada:** Frontend Sync
**Entidade:** —
**Prioridade:** Must
**Origem:** Cross-reference docs/frontend/shared/15-api-dependencies.md

**Descricao:**
Verificar e alinhar tipos TypeScript do frontend com DTOs do backend para todos os endpoints: ClusterResponseDTO, MemberResponseDTO, NodeResponseDTO, FileResponseDTO, FileDetailResponseDTO, AlertResponseDTO, CursorPaginatedResponseDTO<T>, ErrorResponseDTO. Garantir que campos consumidos pelo frontend existem nos DTOs do backend.

**Arquivos a criar/editar:**

- `packages/orchestrator/src/common/types/shared-types.ts` — criar — tipos exportaveis

**Dependencias:**

- TASK-API-007: DTOs globais definidos

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] Todos os campos listados em 15-api-dependencies.md existem nos DTOs
- [ ] Tipos consistentes (string vs number vs enum)
- [ ] Formato de paginacao alinhado: { data, meta: { cursor, hasMore } }

**Testes Necessarios:**

- [ ] Unitario: type-check dos DTOs compartilhados

**Consistencia Frontend:**

- Todos os clientes (web, mobile, desktop) dependem destes tipos

---

### TASK-FE-002: Gap — event-mapping nao preenchido

**Camada:** Frontend Sync
**Entidade:** —
**Prioridade:** Should
**Origem:** Cross-reference docs/shared/event-mapping.md

**Descricao:**
O arquivo event-mapping.md contem apenas placeholders ({{UserCreated}}, {{OrderPaid}} etc.) em vez dos eventos reais do Alexandria. Preencher com os eventos reais do backend (ClusterCreated, MemberJoined, NodeLost, FileUploaded, FileProcessed, FileError, AlertCreated, AlertResolved) e suas reacoes no frontend (stores impactados, UI updates).

**Arquivos a criar/editar:**

- `docs/shared/event-mapping.md` — editar — substituir placeholders pelos eventos reais

**Dependencias:**

- TASK-EVT-010: schemas de eventos definidos

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] Todos os 14 eventos do backend mapeados para reacoes frontend
- [ ] Canais definidos (REST response, Redis pub/sub polling)
- [ ] Stores impactados documentados

**Testes Necessarios:**

- Nenhum — documentacao

**Consistencia Frontend:**

- Frontend precisa saber como reagir a cada evento

---

### TASK-FE-003: Gap — error-ux-mapping com placeholders genericos

**Camada:** Frontend Sync
**Entidade:** —
**Prioridade:** Should
**Origem:** Cross-reference docs/shared/error-ux-mapping.md

**Descricao:**
O arquivo error-ux-mapping.md usa codigos genericos ({{VALIDATION_ERROR}}, {{NOT_FOUND}}) em vez dos codigos especificos do Alexandria (CLUSTER_NOT_FOUND, INSUFFICIENT_NODES, INVALID_SEED_PHRASE, etc.). Adicionar mapeamento para os 24 codigos de erro do catalogo backend (09-errors.md) com acoes de UI especificas.

**Arquivos a criar/editar:**

- `docs/shared/error-ux-mapping.md` — editar — adicionar codigos especificos

**Dependencias:**

- TASK-ERR-001: hierarquia de erros definida

**Regras de Negocio:**

- Nenhuma

**Criterios de Aceite:**

- [ ] Todos os 24 codigos do catalogo mapeados
- [ ] Acoes de UI especificas por erro (ex: INSUFFICIENT_NODES → "Adicione mais nos")
- [ ] Componente frontend responsavel identificado

**Testes Necessarios:**

- Nenhum — documentacao

**Consistencia Frontend:**

- Frontend precisa saber como exibir cada erro especifico

---

## Validacao contra Blueprint

| Blueprint Doc             | Itens no Blueprint       | Tasks geradas                                               | Cobertura     | Gaps                                         |
| ------------------------- | ------------------------ | ----------------------------------------------------------- | ------------- | -------------------------------------------- |
| 03-requirements (RF)      | 42 Must                  | 78 tasks Must                                               | 100%          | Nenhum — todos os RF Must cobertos           |
| 03-requirements (RNF)     | 17 RNFs                  | Cobertos via SETUP + MW + TEST                              | 100%          | Nenhum                                       |
| 04-domain-model           | 11 entidades             | 11 tasks DOM + 11 tasks DATA + 7 tasks SVC + 7 tasks API    | 100%          | Nenhum                                       |
| 07-critical_flows         | 5 fluxos                 | 5 tasks SVC (fluxos detalhados) + TASK-TEST-005 (E2E)       | 100%          | Nenhum                                       |
| 08-use_cases              | 10 UCs                   | 10 UCs cobertos por API + SVC tasks                         | 100%          | UC-009 (free device space) coberto por drain |
| 09-state-models           | 5 maquinas               | 5 maquinas implementadas em DOM tasks                       | 100%          | Nenhum                                       |
| 13-security (STRIDE)      | 6 ameacas                | Cobertas por AUTH + MW + ERR tasks                          | 100%          | Nenhum                                       |
| 17-communication          | 1 canal (email)          | TASK-SVC-007 + TASK-INT-002 + TASK-EVT-004                  | 100%          | Nenhum                                       |
| 05-data-model             | 12 tabelas               | 12 tabelas no schema + TASK-DATA-012                        | 100%          | Nenhum                                       |
| 06-system-architecture    | 7 componentes            | Cobertos por SETUP + INT tasks                              | 100%          | Nenhum                                       |
| 10-architecture_decisions | 7 ADRs                   | Refletidos em SETUP tasks (NestJS, PG, envelope encryption) | 100%          | Nenhum                                       |
| 11-build_plan             | 4 fases                  | Fase 0+1 cobertas integralmente                             | 100% fase 0+1 | Fases 2-3 fora de escopo                     |
| 12-testing_strategy       | Piramide 70/20/10        | TASK-TEST-001 a 006                                         | 100%          | Nenhum                                       |
| 14-scalability            | Rate limit + cache       | TASK-MW-003 + TASK-SETUP-005                                | 100%          | Nenhum                                       |
| 15-observability          | Logs + metricas + health | TASK-SETUP-006 + TASK-SETUP-008 + TASK-MW-001/002           | 100%          | Nenhum                                       |

### Gaps Identificados

> Itens do blueprint que NAO tem tasks correspondentes:

1. RF-016 (OAuth Google/Dropbox/OneDrive) — fase 2, nao coberto neste backlog
2. RF-024 (sync engine automatica) — fase 2, nao coberto neste backlog
3. RF-041 (erasure coding) — fase 3, Could
4. RF-059/060 (versionamento de arquivos) — Should, fora do MVP
5. event-mapping.md com placeholders genericos — coberto por TASK-FE-002
6. error-ux-mapping.md com codigos genericos — coberto por TASK-FE-003

### Consistencia Frontend

| Aspecto   | Backend | Frontend                               | Status            |
| --------- | ------- | -------------------------------------- | ----------------- |
| Endpoints | 22      | 22 consumidos (15-api-dependencies.md) | OK                |
| Eventos   | 14      | Placeholders (event-mapping.md)        | Gap — TASK-FE-002 |
| Erros     | 24      | Genericos (error-ux-mapping.md)        | Gap — TASK-FE-003 |
| DTOs      | 16      | 16 types alinhados                     | OK — TASK-FE-001  |
