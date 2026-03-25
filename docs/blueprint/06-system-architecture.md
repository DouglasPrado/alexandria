# Arquitetura do Sistema

## Introdução

Esta seção descreve a arquitetura de alto nível do sistema **Alexandria**, incluindo seus componentes principais, como eles se comunicam e onde são implantados. O objetivo é fornecer uma visão clara da estrutura técnica para que qualquer membro da equipe consiga entender o funcionamento do sistema como um todo.

<!-- do blueprint: 02-architecture_principles.md (Simplicidade Operacional, Orquestrador Descartável, Interfaces sobre Implementações) -->

> **Arquitetura:** Monólito modular (NestJS) com media workers internos, web client Next.js, e agentes de nó distribuídos. Deploy via Docker Compose em VPS única. Escala horizontal nos nós de storage; escala vertical no orquestrador.

---

## Componentes

> Quais são os blocos principais do sistema? Cada componente deve ter uma responsabilidade clara.

### Web Client

| Campo            | Descrição                                      |
| ---------------- | ---------------------------------------------- |
| **Nome**         | Web Client                                     |
| **Responsabilidade** | Interface web para upload de arquivos, galeria de fotos/vídeos, gerenciamento de nós, monitoramento de saúde do cluster, recovery via seed phrase e convite de membros |
| **Tecnologia**   | Next.js 16 (App Router, Turbopack), React, TypeScript, Tailwind CSS v4, TanStack Query v5, Zustand v5 |
| **Interface**    | HTTPS (TLS 1.3) — servido por Caddy na porta 3000; comunica com Orquestrador via REST API |

### Orquestrador

| Campo            | Descrição                                      |
| ---------------- | ---------------------------------------------- |
| **Nome**         | Orquestrador                                   |
| **Responsabilidade** | Cérebro do sistema — coordena todas as operações: API REST para o web client e agentes de nó, gerenciamento de clusters/membros/nós, pipeline de upload (enfileira jobs), distribuição de chunks via consistent hashing, monitoramento de heartbeats, recovery via seed phrase. Contém o Scheduler e Media Workers como módulos internos |
| **Tecnologia**   | NestJS (TypeScript), Prisma ORM, Core SDK (criptografia, hashing, BIP-39), aws-sdk-s3, ioredis, pino (logging) |
| **Interface**    | API REST (HTTPS/TLS 1.3) na porta 8080; consome/produz jobs via Redis 7 |

### Media Workers

| Campo            | Descrição                                      |
| ---------------- | ---------------------------------------------- |
| **Nome**         | Media Workers                                  |
| **Responsabilidade** | Processamento do pipeline de mídia: análise de arquivo → otimização (fotos WebP 1920px via libvips; vídeos 1080p H.265/AV1 via FFmpeg) → geração de preview → chunking ~4MB → criptografia AES-256-GCM → distribuição para nós |
| **Tecnologia**   | TypeScript (módulo NestJS dentro do Orquestrador), FFmpeg 7, libvips, Core SDK |
| **Interface**    | Consome jobs da fila Redis; escreve resultados no PostgreSQL via Prisma |

### Scheduler

| Campo            | Descrição                                      |
| ---------------- | ---------------------------------------------- |
| **Nome**         | Scheduler                                      |
| **Responsabilidade** | Tarefas periódicas: detecção de nós suspect/lost (heartbeat timeout), auto-healing (re-replicação de chunks), scrubbing (verificação de integridade), garbage collection (chunks órfãos), rebalanceamento, geração de alertas |
| **Tecnologia**   | @nestjs/schedule (cron jobs dentro do Orquestrador) |
| **Interface**    | Executa queries no PostgreSQL; enfileira jobs no Redis; gera alertas na tabela alerts |

### Agente de Nó

| Campo            | Descrição                                      |
| ---------------- | ---------------------------------------------- |
| **Nome**         | Agente de Nó                                   |
| **Responsabilidade** | Processo que roda em cada dispositivo local (PC, NAS, VPS) — armazena chunks no filesystem local, envia heartbeats periódicos ao Orquestrador, executa scrubbing local, responde a requests de leitura/escrita de chunks |
| **Tecnologia**   | NestJS (TypeScript), Core SDK, filesystem local |
| **Interface**    | HTTPS/REST (TLS 1.3) — comunica com Orquestrador via API; descobre Orquestrador via DNS |

### PostgreSQL 18

| Campo            | Descrição                                      |
| ---------------- | ---------------------------------------------- |
| **Nome**         | PostgreSQL 18                                  |
| **Responsabilidade** | Banco de metadados do sistema: clusters, membros, nós, arquivos, previews, manifests, chunks, chunk_replicas, vaults, alertas, convites. Toda informação é reconstruível via recovery (manifests distribuídos nos nós) |
| **Tecnologia**   | PostgreSQL 18, acessado via Prisma ORM |
| **Interface**    | TCP porta 5432; driver nativo via Prisma |

### Redis 7

| Campo            | Descrição                                      |
| ---------------- | ---------------------------------------------- |
| **Nome**         | Redis 7                                        |
| **Responsabilidade** | Fila de processamento do pipeline de mídia (jobs), pub/sub para eventos internos (file processed, node lost), cache de sessões. Sem persistência — se reiniciar, jobs pendentes são re-enfileirados a partir do status "processing" no PostgreSQL |
| **Tecnologia**   | Redis 7, acessado via ioredis |
| **Interface**    | TCP porta 6379 |

### StorageProvider (S3/R2/B2)

| Campo            | Descrição                                      |
| ---------------- | ---------------------------------------------- |
| **Nome**         | StorageProvider                                |
| **Responsabilidade** | Interface unificada para armazenamento de chunks criptografados em provedores cloud. Operações: put, get, exists, delete, list, capacity. Cada provedor (S3, R2, B2) é um adapter da mesma interface |
| **Tecnologia**   | aws-sdk-s3 (TypeScript) — funciona com qualquer provedor S3-compatible |
| **Interface**    | HTTPS (S3-compatible API) |

<!-- added: opensource -->
### Contribution Architecture

| Aspect | Details |
| ------ | ------- |
| **Plugin points** | `StorageProvider` interface — community can add new cloud/local storage adapters (e.g., Google Drive, pCloud, MinIO). `MediaProcessor` interface — community can add new codec pipelines. |
| **Extension API** | Public NestJS module interfaces clearly separated from internal implementation. Types exported from `core-sdk` package. |
| **Module boundaries** | `core-sdk` (cryptography, hashing, BIP-39, chunking) is a separate package — community can use it independently. Orchestrator depends on core-sdk but not vice versa. |
| **Public API surface** | `/api/v1/*` — stabilized, semver-guaranteed. Internal module APIs — marked `@internal`, may change between minor versions. |
| **Extension guide** | See `docs/contributing/add-storage-provider.md` and `docs/contributing/add-media-codec.md` |

<!-- APPEND:components -->

---

## Diagrama de Componentes

> 📐 Diagrama: [container-diagram.mmd](../diagrams/containers/container-diagram.mmd)
>
> Para componentes internos do Orquestrador, veja: [api-components.mmd](../diagrams/components/api-components.mmd)

---

## Comunicação

> Como os componentes se comunicam? REST, gRPC, mensageria, eventos?

| De | Para | Protocolo | Tipo (sync/async) | Descrição |
| --- | --- | --- | --- | --- |
| Web Client | Orquestrador | HTTPS/REST (TLS 1.3) | Sync | Todas as operações do frontend: CRUD de arquivos, nós, membros, alertas, health check |
| Web Client | Orquestrador | HTTPS multipart | Sync | Upload de arquivos (multipart/form-data com progress tracking) |
| Orquestrador | PostgreSQL 18 | TCP/SQL (Prisma) | Sync | CRUD de metadados: clusters, membros, nós, arquivos, chunks, réplicas, alertas |
| Orquestrador | Redis 7 | TCP (ioredis) | Async | Enfileirar jobs de processamento de mídia; pub/sub de eventos internos |
| Redis 7 | Media Workers | TCP (consume jobs) | Async | Workers consomem jobs da fila de processamento |
| Media Workers | FFmpeg/libvips | CLI local | Sync | Transcodificação de vídeo (H.265/AV1) e resize de fotos (WebP) |
| Media Workers | PostgreSQL 18 | TCP/SQL (Prisma) | Sync | Atualizar status do arquivo (processing → ready/error) e salvar metadata |
| Orquestrador | S3/R2/B2 | HTTPS (aws-sdk-s3) | Sync | Upload/download de chunks criptografados para provedores cloud |
| Media Workers | S3/R2/B2 | HTTPS (aws-sdk-s3) | Sync | Distribuição de chunks processados para nós cloud |
| Agente de Nó | Orquestrador | HTTPS/REST (TLS 1.3) | Sync | Heartbeat periódico (1/min); registro de nó; operações de chunk (put/get) |
| Orquestrador | Agente de Nó | HTTPS/REST (TLS 1.3) | Sync | Enviar chunks para nós locais; solicitar leitura de chunks para download/scrubbing |
| Agente de Nó | DNS Provider | DNS (UDP/TCP) | Sync | Descoberta do Orquestrador via DNS fixo; reconexão após troca de VPS |
| Scheduler | PostgreSQL 18 | TCP/SQL (Prisma) | Sync | Queries de manutenção: heartbeat timeout, chunks sub-replicados, GC, scrubbing |
| Scheduler | Redis 7 | TCP (ioredis) | Async | Enfileirar jobs de auto-healing e scrubbing para os workers |

<!-- APPEND:communication -->

---

## Infraestrutura e Deploy

> Onde e como o sistema será executado? Cloud, on-premise, containers?

### Ambientes

| Ambiente | Finalidade | URL / Endpoint | Observações |
| --- | --- | --- | --- |
| **Dev** | Desenvolvimento e testes locais | http://localhost:3000 (web) / http://localhost:8080 (API) | Docker Compose local: PostgreSQL + Redis + MinIO (S3-compatible) |
| **Prod** | Ambiente de produção (família) | https://app.alexandria.local | VPS Contabo/Hetzner (~€5-10/mês); Caddy como reverse proxy com TLS Let's Encrypt |

> **Sem staging:** Time de 1 pessoa, 5-10 usuários familiares. E2E tests no CI substituem staging. Docker Compose local replica produção quando necessário.

### Decisões de Infraestrutura

| Aspecto | Escolha |
| --- | --- |
| **Provedor VPS** | Contabo ou Hetzner (~€5-10/mês, 2 vCPU, 2-4GB RAM, 40-80GB SSD) — self-hosted, sem dependência de cloud proprietário |
| **Orquestração** | Docker Compose v2 — simplicidade operacional; 1 pessoa, 1 VPS, sem necessidade de Kubernetes |
| **Reverse Proxy** | Caddy — TLS automático (Let's Encrypt), HTTP/2, config simples, zero manutenção de certificados |
| **CI/CD** | GitHub Actions — lint + test + build + E2E (Docker Compose) + deploy via SSH para VPS |
| **Monitoramento** | pino (logs estruturados JSON) + endpoint próprio /health/ready; fase 2: Grafana + Loki |
| **Banco de Dados** | PostgreSQL 18 (Prisma ORM) — ACID, JSONB para metadata EXIF, índices GIN para busca |
| **Mensageria/Filas** | Redis 7 (ioredis) — fila de processamento de mídia + pub/sub para eventos internos |
| **Storage de Chunks** | AWS S3, Cloudflare R2, Backblaze B2 (via aws-sdk-s3 — interface unificada S3-compatible) |
| **Criptografia** | Core SDK (TypeScript) — AES-256-GCM, SHA-256, BIP-39, envelope encryption |
| **Media Processing** | FFmpeg 7 (vídeo H.265/AV1) + libvips (fotos WebP) — instalados no container do Orquestrador |

### Topologia de Produção

```
Internet
  │
  ▼
DNS Provider (TTL 300s) → IP da VPS
  │
  ▼
VPS (Docker Compose)
  ├── Caddy (443 HTTPS → proxy)
  │     ├── → Orquestrador (:8080)
  │     └── → Web Client (:3000)
  ├── Orquestrador (NestJS)
  │     ├── API REST
  │     ├── Scheduler (@nestjs/schedule)
  │     ├── Media Workers (FFmpeg + libvips)
  │     └── Core SDK (crypto, hashing, BIP-39)
  ├── PostgreSQL 18 (:5432)
  ├── Redis 7 (:6379)
  └── FFmpeg 7 + libvips (no container)
  │
  ▼ (HTTPS/S3 API)
Cloud Storage
  ├── AWS S3
  ├── Cloudflare R2
  └── Backblaze B2
  │
  ▼ (HTTPS/REST)
Nós da Família
  ├── PC doméstico (Agente de Nó)
  ├── NAS (Agente de Nó)
  └── VPS remota (Agente de Nó)
```

---

## Diagrama de Deploy

> 📐 Diagrama: [production.mmd](../diagrams/deployment/production.mmd)

---

## Referências

- [Princípios Arquiteturais](./02-architecture_principles.md) — princípios que guiam todas as decisões
- [Modelo de Dados](./05-data-model.md) — PostgreSQL 18, tabelas, índices
- [Decisões Arquiteturais](./10-architecture_decisions.md) — ADR-001 (NestJS), ADR-003 (orquestrador centralizado), ADR-004 (PostgreSQL)
- [Escalabilidade](./14-scalability.md) — limites, cache, rate limiting
- [Segurança](./13-security.md) — TLS 1.3, JWT, RBAC, zero-knowledge
