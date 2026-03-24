# Visao do Backend

Define a stack tecnologica, principios de design e objetivos do backend. Este documento e o ponto de partida para qualquer decisao de implementacao.

<!-- do blueprint: 00-context.md, 01-vision.md, 02-architecture_principles.md, 10-architecture_decisions.md -->

---

## Stack Tecnologica

> Quais tecnologias formam a fundacao do backend?

| Camada | Tecnologia | Versao | Justificativa |
| --- | --- | --- | --- |
| Linguagem | TypeScript | 5.x | Tipagem estatica, ecossistema npm maduro, produtividade para time de 1 pessoa (ADR-001) |
| Framework | NestJS | 11.x | Framework opinado com DI, Guards, Interceptors, modulos; deploy via Docker (ADR-001/002) |
| ORM | Prisma | 6.x | Type-safe queries, migrations CLI, studio para debug (ADR-004) |
| Banco principal | PostgreSQL | 18 | ACID, JSONB para metadata EXIF, indices GIN, integridade referencial (ADR-004) |
| Cache | Redis | 7.x | Filas BullMQ, pub/sub para eventos internos, cache de sessoes JWT |
| Cache in-memory | lru-cache | latest | Hot data em memoria (metadata galeria, hash ring, status de nos) |
| Fila | BullMQ (@nestjs/bullmq) | latest | Jobs assincronos para pipeline de midia, retry com backoff, DLQ |
| Scheduler | @nestjs/schedule | latest | Tarefas periodicas: scrubbing, GC, heartbeat check, rebalanceamento |
| Media (fotos) | libvips (sharp) | latest | Redimensionamento e conversao para WebP; mais performante que ImageMagick |
| Media (videos) | FFmpeg | 7.x | Transcodificacao H.265/AV1, extracao de metadata, preview 480p |
| Crypto | Node.js crypto + @noble/ciphers | nativo | AES-256-GCM, SHA-256, PBKDF2, BIP-39; nunca implementar crypto proprio |
| Email | Resend | SDK TS | Email transacional (convites, alertas); free tier 3k/mes |
| Storage | aws-sdk-s3 | v3 | Interface S3-compatible para AWS S3, Cloudflare R2, Backblaze B2 |
| Logs | pino + nestjs-pino | latest | JSON estruturado, redaction de dados sensiveis, correlation ID |
| Metricas | Prometheus + Grafana | latest | Golden Signals + metricas especificas do Alexandria |

<!-- APPEND:stack -->

---

## Padrao Arquitetural

> Qual padrao arquitetural o backend segue?

Monolito modular com monorepo pnpm workspaces (`core-sdk`, `orchestrator`, `node-agent`). Camadas internas seguem Clean Architecture com inversao de dependencia.

<!-- do blueprint: 02-architecture_principles.md (Simplicidade Operacional) + ADR-001 -->

**Camadas:**

| Camada | Responsabilidade | Depende de | Nao depende de |
| --- | --- | --- | --- |
| Presentation | Controllers NestJS, Guards, Interceptors, Pipes de validacao | Application | Infrastructure |
| Application | Services de orquestracao, DTOs, use cases | Domain | Presentation |
| Domain | Entidades, value objects, eventos, erros de dominio, interfaces de repository | Nada | Tudo externo |
| Infrastructure | Prisma repositories, Redis cache, BullMQ producers/consumers, StorageProvider, clients externos | Domain (interfaces) | Presentation |

<!-- APPEND:camadas -->

---

## Principios de Design

> Quais principios guiam as decisoes de implementacao do backend?

<!-- do blueprint: 02-architecture_principles.md -->

| Principio | Descricao | Implicacao Pratica |
| --- | --- | --- |
| Fail-fast | Erros detectados o mais cedo possivel; validacao na borda | Pipes de validacao em todo controller; Guards de auth antes de chegar ao service |
| Zero-Knowledge | Dados criptografados antes de sair do cliente; orquestrador nunca ve dados em claro | AES-256-GCM encrypt-before-upload; tokens/credenciais somente em vaults criptografados |
| Orquestrador Descartavel | Toda informacao no PostgreSQL e reconstruivel a partir dos manifests distribuidos | Recovery via seed phrase < 2h; manifests replicados em 2+ nos |
| Embrace Failure | Sistema assume que nos vao falhar, discos vao corromper, tokens vao expirar | Auto-healing, scrubbing periodico, retry com backoff, alertas proativos |
| Interfaces sobre Implementacoes | Componentes que variam (storage, codec) acessados via interface estavel | StorageProvider trait; trocar S3 por R2 sem afetar logica de replicacao |
| Idempotencia | Operacoes seguras para retry | Content-addressable chunks (SHA-256); dedup por hash; heartbeat idempotente |
| Observabilidade | Todo comportamento rastreavel | pino JSON estruturado, trace_id em cada request, metricas Prometheus |

<!-- APPEND:principios -->

---

## Objetivos e Metricas

> Quais resultados o backend deve atingir?

<!-- do blueprint: 01-vision.md (metricas de sucesso) + 03-requirements.md (RNFs) -->

| Metrica | Meta | Como Medir |
| --- | --- | --- |
| Latencia API metadata (p95) | < 500ms | Prometheus histogram |
| Uptime do orquestrador | > 99.5% | Health checks + monitoramento externo |
| Taxa de erro (5xx) | < 1% em janela de 5min | Prometheus counter |
| Replicacao saudavel | > 99% chunks com 3+ replicas | Dashboard cluster health |
| Pipeline foto completo | < 10s (foto 5MB) | Prometheus histogram |
| Pipeline video completo | < 5min (video 2GB) | Prometheus histogram |
| Recovery via seed | < 2h para 100k arquivos | Disaster drill mensal |
| Throughput upload | 10 uploads concorrentes | k6 load test |

<!-- APPEND:metricas -->

---

## Nao-objetivos

> O que o backend deliberadamente NAO faz nesta versao?

<!-- do blueprint: 01-vision.md (nao-objetivos) -->

- Nao faz renderizacao de frontend (SSR) — Next.js e responsavel
- Nao implementa busca full-text avancada — JSONB GIN e suficiente; ElasticSearch na fase 3
- Nao suporta multi-tenancy — 1 cluster por instancia
- Nao implementa streaming de video em tempo real — download sob demanda
- Nao implementa rede P2P — orquestrador centralizado (ADR-003)
- Nao implementa erasure coding — replicacao 3x simples (fase 3)
- Nao expoe GraphQL — REST puro

---

## Provedores e Infraestrutura

> Quais servicos de cloud e provedores externos o backend utiliza?

| Servico | Provedor | Funcao | Ambiente |
| --- | --- | --- | --- |
| Banco de dados | PostgreSQL 18 (Docker) | Metadados do orquestrador | Dev, Prod |
| Cache e filas | Redis 7 (Docker) | BullMQ jobs, pub/sub, cache JWT | Dev, Prod |
| Object Storage | AWS S3, Cloudflare R2, Backblaze B2 | Chunks criptografados | Prod |
| Email | Resend | Transacional (convites, alertas) | Prod |
| Reverse Proxy | Caddy | TLS 1.3, HSTS, rate limit por IP | Prod |
| Metricas | Prometheus + Grafana | Golden Signals + metricas Alexandria | Dev, Prod |
| DNS | Provedor do usuario | Descoberta do orquestrador pelos nos | Prod |

<!-- APPEND:provedores -->

> (ver [01-architecture.md](01-architecture.md) para detalhes de deploy e infraestrutura)
