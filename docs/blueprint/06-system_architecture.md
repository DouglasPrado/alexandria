# Arquitetura do Sistema

## Introdução

Esta seção descreve a arquitetura de alto nível do **Alexandria**, incluindo seus componentes principais, como eles se comunicam e onde são implantados. O objetivo é fornecer uma visão clara da estrutura técnica para que qualquer membro da equipe consiga entender o funcionamento do sistema como um todo.

### Versões de Tecnologia Confirmadas

> Pesquisa realizada em context7.com (2026-03-16). Versões validadas contra documentação upstream.

| Tecnologia | Versão | Fonte | Notas |
|---|---|---|---|
| Rust | Stable (latest) | context7.com/rust-lang/rust | Trust 9/10; zero-cost abstractions, memory safety sem GC |
| Axum | 0.8.4 | context7.com/tokio-rs/axum | Framework web async-first; Tokio + Tower + Hyper |
| Next.js | 16.1.6 | context7.com/vercel/next.js | Turbopack nativo (Rust), App Router, React Server Components |
| PostgreSQL | 17.6 | context7.com/postgres/postgres | Melhorias em JSONB performance, particionamento, ACID |
| Redis | 7+ | redis.io | Sem dados atualizados no context7; manter 7+ |
| FFmpeg | 7+ | ffmpeg.org | Sem dados atualizados no context7; suporte AV1/H.265 estável |
| Docker | 27+ | docker.com | Sem dados atualizados no context7; compose v2 estável |

---

## Componentes

### Core SDK

| Campo            | Descrição                                      |
| ---------------- | ---------------------------------------------- |
| **Nome**         | Core SDK                                       |
| **Responsabilidade** | Biblioteca compartilhada com toda a lógica de negócio: chunking (~4MB), hashing (SHA-256), criptografia (AES-256-GCM), envelope encryption (seed → master key → file keys → chunk keys), consistent hashing, deduplicação e StorageProvider interface |
| **Tecnologia**   | Rust (compilada como crate)                    |
| **Interface**    | API interna (importada como crate pelo orquestrador e agentes) |

### Orquestrador (API Server)

| Campo            | Descrição                                      |
| ---------------- | ---------------------------------------------- |
| **Nome**         | Orquestrador                                   |
| **Responsabilidade** | Coordena o cluster: serve API REST para clientes, gerencia metadados (PostgreSQL 17), distribui chunks, monitora heartbeats, executa scheduler de tarefas periódicas (scrubbing, GC, rebalancing, auto-healing), gerencia vault |
| **Tecnologia**   | Rust + Axum 0.8 + SQLx (PostgreSQL) + Redis   |
| **Interface**    | API REST (HTTPS/TLS 1.3) para clientes e agentes de nó |

### Pipeline de Mídia (Media Workers)

| Campo            | Descrição                                      |
| ---------------- | ---------------------------------------------- |
| **Nome**         | Media Workers                                  |
| **Responsabilidade** | Processa arquivos após upload: análise → resize (fotos → WebP 1920px) → transcode (vídeos → 1080p H.265/AV1) → preview → chunking → criptografia → distribuição |
| **Tecnologia**   | Rust + FFmpeg 7+ (CLI) + libvips              |
| **Interface**    | Consome jobs da fila Redis; grava chunks via StorageProvider; atualiza metadados via API interna |

### Scheduler

| Campo            | Descrição                                      |
| ---------------- | ---------------------------------------------- |
| **Nome**         | Scheduler                                      |
| **Responsabilidade** | Executa tarefas periódicas: scrubbing (verificação de integridade), garbage collection, rebalanceamento de chunks, detecção de nós offline, auto-healing |
| **Tecnologia**   | Rust (módulo interno do orquestrador, usando tokio::time) |
| **Interface**    | Acesso direto ao PostgreSQL e Redis; dispara jobs para media workers quando necessário |

### Agente de Nó

| Campo            | Descrição                                      |
| ---------------- | ---------------------------------------------- |
| **Nome**         | Node Agent                                     |
| **Responsabilidade** | Roda em cada dispositivo/nó local; armazena e serve chunks no filesystem; envia heartbeats ao orquestrador; executa scrubbing local; reporta capacidade |
| **Tecnologia**   | Rust (binário standalone usando Core SDK + Axum para API local) |
| **Interface**    | API REST (TLS) para comunicação com orquestrador; filesystem local para armazenamento |

### StorageProvider (S3/R2)

| Campo            | Descrição                                      |
| ---------------- | ---------------------------------------------- |
| **Nome**         | StorageProvider                                |
| **Responsabilidade** | Abstração que permite armazenar e recuperar chunks em qualquer backend de storage. Interface unificada: put/get/exists/delete/list/capacity |
| **Tecnologia**   | Rust + aws-sdk-s3 (para S3, R2, B2 — todos S3-compatible) |
| **Interface**    | S3 API (HTTPS) para buckets cloud; filesystem API para storage local |

### Vault

| Campo            | Descrição                                      |
| ---------------- | ---------------------------------------------- |
| **Nome**         | Vault                                          |
| **Responsabilidade** | Armazena tokens OAuth, credenciais de provedores cloud, chaves criptografadas e senhas do usuário. Desbloqueado em memória via senha do usuário; master key usada apenas em recovery do orquestrador |
| **Tecnologia**   | Arquivo criptografado (AES-256-GCM) no filesystem do orquestrador |
| **Interface**    | API interna (módulo do orquestrador); nunca exposto externamente |

### Web Client

| Campo            | Descrição                                      |
| ---------------- | ---------------------------------------------- |
| **Nome**         | Web Client                                     |
| **Responsabilidade** | Interface do usuário: upload de arquivos, galeria com thumbnails, navegação por timeline, download sob demanda, visualização de status do cluster, administração |
| **Tecnologia**   | Next.js 16 (App Router, Turbopack) + React + Tailwind CSS |
| **Interface**    | HTTPS para usuários; consome API REST do orquestrador |

---

## Diagrama de Componentes

> 📐 Diagrama: [container-diagram.mmd](../diagrams/containers/container-diagram.mmd)
>
> Para componentes internos do orquestrador: [api-components.mmd](../diagrams/components/api-components.mmd)

---

## Comunicação

| De | Para | Protocolo | Tipo (sync/async) | Descrição |
| -- | ---- | --------- | ----------------- | --------- |
| Web Client | Orquestrador | HTTPS/REST (TLS 1.3) | Sync | Upload de arquivos, listagem de galeria, download, administração |
| Orquestrador | PostgreSQL 17 | TCP (SQLx driver nativo, async) | Sync | CRUD de metadados: clusters, membros, nós, arquivos, chunks, réplicas |
| Orquestrador | Redis 7 | TCP (driver nativo) | Async | Enfileirar jobs de processamento de mídia; pub/sub de eventos internos |
| Media Workers | Redis 7 | TCP (driver nativo) | Async | Consumir jobs da fila de processamento |
| Media Workers | StorageProvider | HTTPS (S3 API) | Sync | Gravar chunks criptografados nos nós cloud |
| Media Workers | Orquestrador | API interna (Axum) | Sync | Atualizar metadados (file status, chunks, réplicas) após processamento |
| Agente de Nó | Orquestrador | HTTPS/REST (TLS 1.3) | Sync | Heartbeat, reportar capacidade, receber comandos (drain, scrub) |
| Orquestrador | Agente de Nó | HTTPS/REST (TLS 1.3) | Sync | Enviar/recuperar chunks, comandar drain e scrubbing |
| Orquestrador | StorageProvider (S3/R2) | HTTPS (S3 API via aws-sdk-s3) | Sync | Put/get/delete chunks em buckets cloud |
| Scheduler | PostgreSQL 17 | TCP (SQLx) | Sync | Queries de manutenção: chunks sub-replicados, heartbeats atrasados, réplicas não verificadas |
| Scheduler | Redis 7 | TCP (driver nativo) | Async | Enfileirar jobs de auto-healing, rebalanceamento e scrubbing |
| Nós (via DNS) | Orquestrador | DNS + HTTPS | Sync | Descoberta do orquestrador após troca de VPS; reconexão automática |

---

## Infraestrutura e Deploy

### Ambientes

| Ambiente | Finalidade | URL / Endpoint | Observações |
| -------- | ---------- | -------------- | ----------- |
| **Dev** | Desenvolvimento e testes locais | http://localhost:8080 (API), http://localhost:3000 (Web) | Docker Compose com PostgreSQL 17, Redis 7 e orquestrador; storage local |
| **Prod** | Ambiente de produção (alpha familiar) | https://alexandria.{domínio} | VPS única (Contabo); Docker Compose; DNS fixo para discovery |

> Staging não é necessário na POC — time de 1 pessoa com deploy direto em produção após testes locais.

### Decisões de Infraestrutura

| Aspecto | Escolha |
| ------- | ------- |
| **Provedor Cloud (VPS)** | Contabo — VPS barata (~€5-10/mês), SLA 99.9%, datacenters na Europa |
| **Orquestração** | Docker Compose v2 — um arquivo para orquestrador + PostgreSQL 17 + Redis 7; sem Kubernetes (overkill para POC) |
| **CI/CD** | GitHub Actions — build, test (cargo test), push Docker image; deploy manual via SSH para VPS |
| **Monitoramento** | Logs estruturados (stdout/JSON via tracing crate) + alertas internos do orquestrador; Grafana/Prometheus em fase 2 |
| **Banco de Dados** | PostgreSQL 17 — container Docker com volume persistente; backup diário via pg_dump para bucket S3 |
| **Cache/Fila** | Redis 7 — container Docker; usado como fila de processamento e pub/sub; sem persistência (jobs são recuperáveis) |
| **Storage Cloud** | AWS S3 + Cloudflare R2 — via aws-sdk-s3 (S3-compatible); Backblaze B2 como alternativa futura |
| **DNS** | Domínio fixo apontando para IP da VPS; TTL baixo (~300s) para facilitar troca durante recovery |
| **TLS** | Let's Encrypt — certificado gratuito auto-renovável via Caddy |
| **Backup do orquestrador** | pg_dump diário → S3 bucket; vault criptografado replicado nos nós de storage |
| **Web Framework (Rust)** | Axum 0.8 — async-first, built on Tokio/Tower/Hyper; middleware composável via Tower; preferido sobre Actix-web por integração natural com ecossistema Tokio |
| **DB Driver (Rust)** | SQLx — compile-time checked queries; async nativo com Tokio; suporte a PostgreSQL 17 |
| **Observabilidade (Rust)** | tracing + tracing-subscriber — logs estruturados; integração futura com OpenTelemetry |

### Ecossistema Rust — Crates Principais

| Crate | Versão | Função |
|-------|--------|--------|
| axum | 0.8.x | Web framework (API REST) |
| tokio | 1.x | Runtime async |
| tower | 0.5.x | Middleware composável (timeout, retry, rate limit) |
| sqlx | 0.8.x | PostgreSQL driver (compile-time checked, async) |
| aws-sdk-s3 | latest | S3-compatible storage (S3, R2, B2) |
| ring / aes-gcm | latest | Criptografia AES-256-GCM |
| sha2 | latest | Hashing SHA-256 |
| bip39 | latest | Geração de seed phrase 12 palavras |
| serde / serde_json | 1.x | Serialização JSON |
| tracing | 0.1.x | Logs estruturados e spans |
| redis | latest | Client Redis para fila e pub/sub |
| uuid | 1.x | Geração de UUIDs v4 |

### Docker Compose — Topologia de Produção

```
┌─────────────────────────────────────────────────────┐
│  VPS (Contabo)                                       │
│                                                     │
│  ┌─────────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ Orquestrador│  │PostgreSQL│  │    Redis      │   │
│  │ Rust + Axum │  │   17     │  │    7          │   │
│  │ :8080       │  │ :5432    │  │  :6379        │   │
│  │             │  │          │  │               │   │
│  │ ┌─────────┐ │  │  Volume  │  │               │   │
│  │ │Scheduler│ │  │  /data   │  │               │   │
│  │ └─────────┘ │  └──────────┘  └──────────────┘   │
│  │ ┌─────────┐ │                                    │
│  │ │ Media   │ │                                    │
│  │ │ Workers │ │                                    │
│  │ └─────────┘ │                                    │
│  │ ┌─────────┐ │                                    │
│  │ │  Vault  │ │                                    │
│  │ └─────────┘ │                                    │
│  └─────────────┘                                    │
│                                                     │
│  ┌─────────────┐                                    │
│  │ Web Client  │                                    │
│  │ Next.js 16  │                                    │
│  │ :3000       │                                    │
│  └─────────────┘                                    │
│                                                     │
│  ┌─────────────┐                                    │
│  │ Caddy       │  ← TLS termination (Let's Encrypt) │
│  │ :443        │                                    │
│  └─────────────┘                                    │
└─────────────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
  ┌──────────────┐    ┌──────────────┐
  │   AWS S3     │    │ Cloudflare R2│
  │  (chunks)    │    │  (chunks)    │
  └──────────────┘    └──────────────┘
         │
         ▼
  ┌──────────────────────────────┐
  │     Agentes de Nó            │
  │  ┌────────┐    ┌────────┐    │
  │  │ PC/NAS │    │  VPS   │    │
  │  │ (local)│    │(remote)│    │
  │  └────────┘    └────────┘    │
  └──────────────────────────────┘
```

---

## Diagrama de Deploy

> 📐 Diagrama: [production.mmd](../diagrams/deployment/production.mmd)
