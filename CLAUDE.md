# Alexandria

## Fonte de Verdade

Todo codigo DEVE implementar fielmente o que esta documentado nos blueprints.
Localizacao dos blueprints: `docs/`

**Regras inviolaveis:**
- NUNCA gere codigo sem antes ler os docs de blueprint relevantes para a tarefa
- Use a linguagem ubiqua do dominio (nomes de entidades, campos, acoes)
- Sempre leia `src/contracts/` antes de implementar qualquer feature
- Test-first: escreva testes ANTES da implementacao (XP)

---

## Stack Tecnologica

| Camada | Tecnologia | Versao |
|--------|-----------|--------|
| Backend (API) | Rust + Axum | 0.8.x |
| Runtime Async | Tokio | 1.x |
| Middleware | Tower | 0.5.x |
| Banco de Dados | PostgreSQL | 18 |
| DB Driver | SQLx (compile-time checked, async) | 0.8.x |
| Cache / Fila | Redis | 7+ |
| Storage Cloud | aws-sdk-s3 (S3, R2, B2) | latest |
| Criptografia | ring / aes-gcm (AES-256-GCM) | latest |
| Hashing | sha2 (SHA-256) | latest |
| Seed Phrase | bip39 (12 palavras) | latest |
| Serialização | serde / serde_json | 1.x |
| Observabilidade | tracing + tracing-subscriber | 0.1.x |
| Frontend | Next.js (App Router, Turbopack) | 16.x |
| Frontend UI | React + Tailwind CSS | latest |
| Media (fotos) | libvips (WebP 1920px) | latest |
| Media (video) | FFmpeg (1080p H.265/AV1) | 7+ |
| Deploy | Docker Compose v2 + Caddy (TLS) | 27+ |

### Workspace Rust (Cargo Workspaces)

- `core-sdk` — biblioteca compartilhada: chunking, hashing, criptografia, consistent hashing, StorageProvider trait
- `orchestrator` — API REST (Axum), scheduler, media workers, vault management
- `node-agent` — binario standalone para nos de storage

---

## Mapa de Contexto por Tarefa

Antes de iniciar qualquer tarefa, leia os docs listados abaixo conforme o tipo de trabalho.

### Schema / Migrations
- `docs/blueprint/04-domain_model.md` (entidades, regras de negocio)
- `docs/blueprint/05-data_model.md` (tabelas, indices, constraints)
- `docs/blueprint/09-state_models.md` (maquinas de estado)

### API / Backend
- `docs/blueprint/07-critical_flows.md` (fluxos, tratamento de erros)
- `docs/blueprint/08-use_cases.md` (atores, pre/pos condicoes)
- `docs/blueprint/06-system_architecture.md` (componentes, comunicacao)

### Criptografia / Storage
- `docs/blueprint/02-architecture_principles.md` (Zero-Knowledge, LOCKSS, Envelope Encryption)
- `docs/blueprint/13-security.md` (threat model, autenticacao)

### Frontend Components
- `docs/frontend/04-componentes.md` (hierarquia de componentes)
- `docs/frontend/05-estado.md` (state management)
- `docs/frontend/06-data-layer.md` (data fetching, cache)
- `docs/frontend/03-design-system.md` (tokens, componentes base)

### Routing / Navigation
- `docs/frontend/07-rotas.md` (rotas, guards, middlewares)
- `docs/frontend/08-fluxos.md` (fluxos de interface)

### Security
- `docs/blueprint/13-security.md` (threat model, autenticacao, autorizacao)
- `docs/frontend/11-seguranca.md` (XSS, CSRF, CSP)

### Testing
- `docs/blueprint/12-testing_strategy.md` (piramide de testes, coverage)
- `docs/frontend/09-testes.md` (testes de frontend)

### Observabilidade
- `docs/blueprint/15-observability.md` (logging, metricas, tracing)
- `docs/frontend/12-observabilidade.md` (frontend monitoring)

### Comunicacao (emails, notificacoes)
- `docs/blueprint/17-communication.md` (templates, triggers, rate limits)

---

## Convencoes de Codigo

### Nomenclatura
- Entidades Rust: PascalCase (conforme glossario do dominio)
- Campos/propriedades: snake_case (Rust convention)
- Tabelas banco: snake_case, plural em ingles (ex: `clusters`, `members`, `nodes`, `chunks`)
- Campos banco: snake_case em ingles, comentarios em portugues
- Rotas API: `/api/v1/{resource}` (REST, kebab-case para multi-word)
- Componentes React: PascalCase.tsx
- Arquivos Rust: snake_case.rs

### Principios Arquiteturais

1. **LOCKSS** — todo dado em 3+ copias em nos diferentes; auto-healing obrigatorio
2. **Orquestrador Descartavel** — seed phrase reconstroi tudo; PostgreSQL e reconstruivel a partir dos manifests
3. **Zero-Knowledge** — criptografia AES-256-GCM no cliente antes de upload; master key nunca persistida
4. **Embrace Failure** — heartbeat + scrubbing + retry com backoff; sistema se auto-repara
5. **Eficiencia sobre Fidelidade** — WebP 1920px para fotos, 1080p H.265 para videos; originais nao preservados
6. **Simplicidade Operacional** — monolito, Docker Compose, VPS barata; sem Kubernetes ou microservicos
7. **Interfaces sobre Implementacoes** — StorageProvider trait unificado; trocar provedor nao afeta logica

### Glossario do Dominio (Linguagem Ubiqua)

| Termo | Definicao | Uso no Codigo |
|-------|-----------|---------------|
| Cluster | Grupo familiar com storage distribuido | `Cluster` struct, `clusters` table |
| Membro (Member) | Pessoa autorizada no cluster (admin/membro/leitura) | `Member` struct, `members` table |
| No (Node) | Dispositivo/servico que armazena chunks | `Node` struct, `nodes` table |
| Chunk | Bloco criptografado ~4MB, content-addressable (SHA-256) | `Chunk` struct, `chunks` table |
| Manifest | Documento que descreve arquivo: chunks, hashes, metadata, chave | `Manifest` struct, `manifests` table |
| Arquivo (File) | Foto/video/doc logico = manifest + N chunks | `File` struct, `files` table |
| Seed Phrase | 12 palavras BIP-39 → master key (nunca armazenada digitalmente) | `SeedPhrase` type |
| Master Key | Chave raiz derivada da seed; existe so em memoria | `MasterKey` type |
| File Key | Chave por arquivo via envelope encryption | `FileKey` type |
| Vault | Cofre criptografado individual por membro | `Vault` struct, `vaults` table |
| Replica | Copia de chunk em no especifico (min 3 por chunk) | `Replica` struct, `replicas` table |
| Heartbeat | Sinal periodico de no → orquestrador | `Heartbeat` struct |
| Scrubbing | Verificacao periodica de integridade via hash | `ScrubTask` |
| Auto-healing | Re-replicacao automatica quando no e perdido | `HealingTask` |
| Drain | Migrar todos chunks antes de desconectar no | `DrainTask` |
| Consistent Hashing | Distribuicao proporcional de chunks entre nos | `HashRing` struct |
| Placeholder | Thumbnail local; conteudo baixado sob demanda | `Placeholder` |
| Preview | Versao leve: thumbnail ~50KB (foto), 480p ~5MB (video) | `Preview` struct |
| Pipeline de Midia | upload → analise → resize/transcode → preview → encrypt → chunk → distribute | `MediaPipeline` |
| StorageProvider | Interface put/get/exists/delete/list/capacity | `StorageProvider` trait |
| Replication Factor | Min copias por chunk (3 na v1) | `REPLICATION_FACTOR = 3` |
| Garbage Collection | Remocao de chunks orfaos (sem manifest referenciando) | `GcTask` |
| Rebalanceamento | Redistribuicao de chunks quando capacidades mudam | `RebalanceTask` |

---

## Sempre Ler Antes de Codar

- `crates/core-sdk/src/domain/` — tipos Rust de dominio (entidades, enums, eventos)
- `crates/core-sdk/src/storage/` — StorageProvider trait
- `src/contracts/` — tipos TypeScript compartilhados (API contracts para frontend)
- `migrations/` — schema atual do banco PostgreSQL (9 tabelas)
- `Cargo.toml` (workspace) — dependencias e crates do projeto

---

## Workflow de Desenvolvimento (XP)

```
1. Leia os docs do blueprint relevantes para a feature
2. Leia src/contracts/ para tipos existentes
3. RED:      Escreva os testes primeiro
4. GREEN:    Implemente o minimo para os testes passarem
5. REFACTOR: Melhore o codigo mantendo testes verdes
6. Commit small release
```

---

## Skills de Codegen Disponiveis

| Skill | Uso | Quando |
|-------|-----|--------|
| `/codegen` | Apresenta fases do build plan | Inicio de sessao |
| `/codegen-contracts` | Gera tipos, schema, scaffold | Phase 0 (uma vez) |
| `/codegen-feature` | Implementa feature (TDD) | Dia-a-dia |
| `/codegen-verify` | Verifica codigo vs blueprint | A cada fase |
| `/codegen-claudemd` | Gera/atualiza este arquivo | Setup inicial |

---

## Context Excerpting

Para docs grandes (50k+ tokens), NAO carregue o doc inteiro. Em vez disso:

1. Leia o indice/sumario do doc (headers)
2. Use Grep para encontrar secoes relevantes a feature
3. Carregue apenas as secoes necessarias

Isso mantem cada sessao dentro do budget de ~70-100k tokens de contexto.
