# Estratégia de Testes

> Defina como o sistema será testado em cada camada para garantir qualidade e confiança nas entregas.

---

## Pirâmide de Testes

Proporção alvo: **70% unitários, 20% integração, 10% E2E/sistema**. O Alexandria é um sistema de storage onde corrupção de dados é catastrófica — a base de testes unitários foca pesadamente em criptografia, hashing e chunking.

```
        /   E2E    \        10% — fluxos críticos end-to-end
       /-------------\
      /  Integração    \    20% — PostgreSQL, Redis, S3, pipeline
     /-------------------\
    /     Unitários        \  70% — Core SDK, crypto, hashing, chunks
   /_________________________\
```

---

## Categorias de Teste

### Unit Tests

| Item | Descrição |
|---|---|
| **Objetivo** | Validar lógica de negócio do Core SDK em isolamento: chunking, hashing, criptografia, envelope encryption, consistent hashing, deduplicação, manifest serialization |
| **Escopo — O que testar** | AES-256-GCM encrypt/decrypt roundtrip; SHA-256 hashing determinístico; chunking ~4MB com edge cases (arquivo menor que 1 chunk, arquivo exatamente N chunks); envelope encryption (seed → master key → file key → chunk key); consistent hashing proporcionalidade e estabilidade; BIP-39 seed generation e validação; manifest serialização/deserialização; vault encrypt/decrypt |
| **Ferramentas** | `jest` (built-in TypeScript); `fast-check` para property-based testing de crypto; `tinybench` para benchmarks |
| **Critérios de sucesso** | Cobertura >80% no Core SDK; todos os testes passam; tempo total <2 min; zero falhas de crypto em property tests (10k iterations) |

> **Módulos com cobertura prioritária:** `core_sdk::crypto`, `core_sdk::chunking`, `core_sdk::hashing`, `core_sdk::consistent_hash`, `core_sdk::manifest`

---

### Integration Tests

| Item | Descrição |
|---|---|
| **Objetivo** | Validar comunicação entre componentes: Orquestrador ↔ PostgreSQL 18 (Prisma), Orquestrador ↔ Redis 7, Orquestrador ↔ StorageProvider (S3/local), Pipeline de mídia (FFmpeg/libvips) |
| **Escopo — O que testar** | Queries Prisma contra PostgreSQL real (CRUD de todas as tabelas); transações atômicas (file + chunks + replicas); fila Redis (enqueue/dequeue jobs); StorageProvider: put/get/exists/delete contra filesystem local e MinIO (S3-compatible); pipeline de mídia: foto JPEG → WebP 1920px; vídeo MP4 → 1080p H.265; heartbeat flow completo; recovery: seed → vaults dos membros → rebuild metadados |
| **Ferramentas** | `jest` com `testcontainers` (JS) (PostgreSQL, Redis, MinIO em Docker); Jest + Prisma test utils para migrações automáticas por teste; fixtures com arquivos de teste (fotos/vídeos sample) |
| **Critérios de sucesso** | Contratos Prisma validados (type-safe); pipeline processa foto e vídeo de teste sem erro; recovery reconstrói banco a partir de manifests; tempo total <5 min |

> **Integrações críticas:** Prisma ↔ PostgreSQL (transações atômicas), StorageProvider ↔ S3 (put/get chunks), FFmpeg (transcodificação), Recovery (seed → vaults dos membros → rebuild)

---

### End-to-End Tests

| Item | Descrição |
|---|---|
| **Objetivo** | Validar fluxos completos do sistema do ponto de vista do usuário: upload → galeria → download; cluster creation → invite → join; recovery via seed |
| **Escopo — O que testar** | UC-001: Criar cluster (seed phrase gerada, vault do admin criado); UC-004: Upload de foto (aparece na galeria com thumbnail); UC-005: Download de arquivo (descriptografa e reassembla); UC-007: Recovery via seed (nova VPS → sistema operacional); Auto-healing: remover nó → chunks re-replicados |
| **Ferramentas** | `jest` com setup Docker Compose completo (orquestrador + pg + redis + minio); Playwright para testes do Web Client (Next.js 16); scripts shell para disaster drill automatizado |
| **Critérios de sucesso** | Todos os 5 fluxos críticos passam; flaky rate <5%; tempo total <15 min; zero perda de dados nos cenários de recovery e auto-healing |

> **Jornadas de maior impacto:** Upload → galeria, Recovery via seed, Auto-healing

---

### Load / Performance Tests

| Item | Descrição |
|---|---|
| **Objetivo** | Verificar que o sistema suporta a carga esperada de uma família (5-10 pessoas, uploads concorrentes) sem degradação |
| **Escopo — O que testar** | Upload concorrente: 10 uploads simultâneos de fotos; API de galeria: listagem com 10k+ arquivos (paginação por cursor); heartbeat: 50 nós enviando heartbeat/minuto; pipeline de mídia: transcodificação de vídeo 2GB sem timeout; queries PostgreSQL sob carga (chunk_replicas com 100k+ registros) |
| **Ferramentas** | `k6` para load testing HTTP; `tinybench` para microbenchmarks TypeScript (crypto, hashing); `pgbench` para queries PostgreSQL |
| **Critérios de sucesso** | API metadata p95 <500ms; 10 uploads concorrentes sem erro; galeria com 10k arquivos carrega em <2s; transcodificação de vídeo 2GB em <5min; heartbeat de 50 nós sem perda |

---

### Chaos / Resilience Tests

| Item | Descrição |
|---|---|
| **Objetivo** | Validar auto-healing, recovery e resiliência do sistema contra falhas reais de infraestrutura |
| **Escopo — O que testar** | Nó offline: parar agente → auto-healing re-replica em <2h; PostgreSQL restart: orquestrador reconecta sem perda; Redis restart: jobs pendentes re-enfileirados ou recuperados; Chunk corruption: alterar byte em chunk → scrubbing detecta e repara; VPS destruída: recovery via seed em nova VPS; DNS change: nós reconectam após atualização |
| **Ferramentas** | Scripts shell/TypeScript para simular falhas; `docker stop/kill` para parar containers; `dd` para corromper chunks; disaster drill manual mensal |
| **Critérios de sucesso** | Auto-healing: chunks re-replicados em <2h; scrubbing: corrupção detectada e reparada em <1 ciclo; recovery: <2h do seed ao sistema operacional; zero perda de dados em todos os cenários |

---

## Cobertura Mínima

| Camada | Cobertura Mínima | Justificativa |
|---|---|---|
| Unit Tests | >80% (Core SDK: >90%) | Crypto e chunking são a fundação — bugs aqui = corrupção de dados |
| Integration Tests | >60% | Cobre contratos críticos: Prisma queries, StorageProvider, pipeline de mídia |
| End-to-End Tests | 100% dos 5 fluxos críticos | Upload, download, cluster creation, recovery e auto-healing devem sempre funcionar |
| Load Tests | Endpoints de alta demanda (galeria, heartbeat, upload) | Previne degradação em uso familiar real (5-10 pessoas) |
| Chaos Tests | Cenários de falha do risk assessment (R-01 a R-10) | Sistema deve sobreviver a falhas reais — é sua razão de existir |

---

## Ambientes de Teste

| Ambiente | Propósito | Dados |
|---|---|---|
| Local (jest) | Desenvolvimento: unit tests rápidos + eslint + prettier | Fixtures embarcadas no código; crypto com chaves de teste |
| CI (GitHub Actions) | Unit + integration automatizados a cada PR/push | testcontainers (JS) (PostgreSQL, Redis, MinIO em Docker); fotos/vídeos sample (~10MB total) |
| Docker Compose local | E2E e load tests antes do deploy | Docker Compose completo (orquestrador + pg + redis + minio + web); dados de teste gerados |
| Produção (VPS) | Disaster drills mensais; monitoramento contínuo; chaos tests agendados | Dados reais da família (criptografados); scrubbing e auto-healing ativos |

---

## Automação e CI

| Etapa do Pipeline | Testes Executados | Gatilho | Bloqueante? |
|---|---|---|---|
| Pull Request | jest (unit) + eslint + prettier --check | Push / abertura de PR | Sim |
| Merge na main | jest (unit + integration com testcontainers) | Merge | Sim |
| Pre-deploy | E2E tests (Docker Compose local) | Manual antes do deploy | Sim |
| Post-deploy | Smoke tests (health check API + upload de foto de teste) | Após deploy em produção | Sim (rollback se falhar) |
| Mensal | Disaster drill (recovery via seed em VPS de teste) + chaos tests | Cron / manual | Não (relatório gerado) |
| Semanal | Load tests (k6 contra staging/produção) | Cron | Não (alerta se degradar) |

> **Tempo máximo do pipeline CI (PR → merge):** <10 min (unit + eslint + prettier: ~3 min; integration: ~5 min)
