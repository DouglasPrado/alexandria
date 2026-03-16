# Arquitetura

Esta seção define **como o sistema é construído**: quais tecnologias são usadas, como os componentes se comunicam e onde o sistema roda. Decisões de arquitetura para POC devem priorizar velocidade de desenvolvimento e simplicidade operacional.

---

## Stack

| Camada                 | Tecnologia                          | Motivo da escolha                                                          |
| ---------------------- | ----------------------------------- | -------------------------------------------------------------------------- |
| Core SDK               | Rust (stable)                       | Performance de IO, concorrência nativa, binário único sem runtime          |
| Backend (Orquestrador) | Rust + Axum 0.8 + SQLx              | Async-first (Tokio/Tower); compile-time checked SQL; API REST              |
| Frontend (Web Client)  | Next.js 16 (Turbopack)              | SSR para galeria, deploy simples, responsivo para mobile                   |
| Banco de dados         | PostgreSQL 17                       | Relacional com integridade referencial; JSONB para metadata flexível       |
| Fila                   | Redis 7                             | Fila de processamento do pipeline de mídia; pub/sub para eventos internos  |
| Processamento de mídia | FFmpeg 7+ (CLI)                     | Transcodificação de vídeo H.265/AV1; conversão de imagens via libvips/WebP |
| Criptografia           | AES-256-GCM + BIP-39                | Padrões auditados e amplamente adotados                                    |
| Storage cloud          | aws-sdk-s3 (S3-compatible)          | Interface unificada para AWS S3, Cloudflare R2, Backblaze B2               |
| Infra / Deploy         | VPS (Hetzner/DigitalOcean) + Docker | Custo baixo; Docker Compose v2 para setup reprodutível do orquestrador     |

---

## Componentes

### Core SDK

**Responsabilidade:** Biblioteca compartilhada com toda a lógica de negócio: chunking, hashing (SHA-256), criptografia (AES-256-GCM), envelope encryption, consistent hashing, StorageProvider interface.

**Tecnologia:** Rust (stable), compilado como crate.

**Comunicação:** Importado diretamente pelo orquestrador e pelos agentes de nó.

### Orquestrador (API Server)

**Responsabilidade:** Coordena o cluster: gerencia metadados (PostgreSQL 17), distribui chunks, monitora heartbeats, executa scheduler de tarefas periódicas (scrubbing, GC, rebalancing, auto-healing), serve API para clientes.

**Tecnologia:** Rust + Axum 0.8 + SQLx (PostgreSQL 17) + Redis 7.

**Comunicação:** API REST (TLS 1.3) para clientes e agentes de nó; SQLx async para PostgreSQL; TCP para Redis.

### Agente de Nó

**Responsabilidade:** Roda em cada dispositivo/nó local; armazena e serve chunks; envia heartbeats ao orquestrador; executa scrubbing local.

**Tecnologia:** Rust (binário standalone usando Core SDK + Axum para API local).

**Comunicação:** Conecta ao orquestrador via API REST (TLS); armazena chunks no filesystem local.

### StorageProvider (S3/R2)

**Responsabilidade:** Abstração para armazenar e recuperar chunks em buckets cloud. Interface unificada: put/get/exists/delete/list/capacity.

**Tecnologia:** Rust + aws-sdk-s3 (S3-compatible para S3, R2, B2).

**Comunicação:** Orquestrador chama via aws-sdk-s3; cada provider implementa a mesma StorageProvider trait.

### Pipeline de Mídia

**Responsabilidade:** Processa arquivos após upload: análise → resize (fotos) → transcode (vídeos) → gerar preview → chunking → criptografia → distribuição.

**Tecnologia:** FFmpeg 7+ para vídeo; libvips para imagens; workers Rust consumindo fila Redis 7.

**Comunicação:** Recebe jobs da fila Redis; grava chunks via StorageProvider; atualiza metadados via API do orquestrador.

### Vault

**Responsabilidade:** Armazena credenciais e chaves criptografadas. Desbloqueado em memória com chave derivada da seed.

**Tecnologia:** Arquivo criptografado (AES-256-GCM) no filesystem do orquestrador.

**Comunicação:** Acessado internamente pelo orquestrador; nunca exposto via API.

### Web Client

**Responsabilidade:** Interface do usuário: upload de arquivos, galeria com thumbnails, download sob demanda, visualização de status do cluster.

**Tecnologia:** Next.js 16 (Turbopack) + React + Tailwind CSS.

**Comunicação:** Chama API do orquestrador via REST (TLS).

---

## Diagrama de componentes

```
┌──────────────┐        REST/TLS         ┌───────────────────────────────────────────┐
│  Web Client  │ ───────────────────────▶ │            Orquestrador                   │
│ (Next.js 16) │ ◀─────────────────────── │  ┌─────────┐  ┌──────────┐  ┌─────────┐  │
└──────────────┘        JSON              │  │ API     │  │ Scheduler│  │ Vault   │  │
                                          │  │ Server  │  │ (cron)   │  │ (crypto)│  │
                                          │  └────┬────┘  └────┬─────┘  └─────────┘  │
                                          │       │            │                      │
                                          │  ┌────▼────────────▼─────┐                │
                                          │  │      Core SDK         │                │
                                          │  │ (chunk, hash, crypto, │                │
                                          │  │  consistent hashing)  │                │
                                          │  └───────────┬───────────┘                │
                                          └──────────────┼────────────────────────────┘
                                                         │
                          ┌──────────────────────────────┼──────────────────────────┐
                          │                              │                          │
                          ▼                              ▼                          ▼
                   ┌─────────────┐              ┌──────────────┐           ┌──────────────┐
                   │ PostgreSQL  │              │    Redis     │           │  S3 / R2     │
                   │ (metadados) │              │   (filas)    │           │  (chunks)    │
                   └─────────────┘              └──────────────┘           └──────────────┘

                          ┌──────────────────────────────┐
                          │        Agentes de Nó         │
                          │  ┌────────┐    ┌────────┐    │
                          │  │ PC/NAS │    │  VPS   │    │
                          │  │ (local)│    │(remote)│    │
                          │  └────────┘    └────────┘    │
                          └──────────────────────────────┘
                                    ▲           ▲
                                    │ heartbeat │
                                    │ + chunks  │
                                    └─────┬─────┘
                                          │ REST/TLS
                                          ▼
                                    Orquestrador
```

---

## Decisões técnicas

| Decisão                            | Alternativa descartada        | Justificativa                                                                                                |
| ---------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Rust para backend                  | Node.js / Python / Go         | IO-bound workload com concorrência pesada (chunks, replicação); binário único simplifica deploy em nós       |
| Axum 0.8 como web framework       | Actix-web                     | Async-first, integração natural com Tokio/Tower; middleware composável; comunidade ativa                     |
| SQLx como DB driver                | Diesel / SeaORM               | Compile-time checked queries; async nativo com Tokio; sem ORM overhead                                       |
| Orquestrador centralizado          | P2P puro / DHT                | Complexidade excessiva para POC; orquestrador é descartável (recovery via seed)                              |
| PostgreSQL 17 para metadados       | SQLite / MongoDB              | Integridade referencial necessária; queries complexas (joins chunk-replica-node); JSONB melhorado no 17      |
| Redis 7 para filas                 | RabbitMQ / Kafka              | Pipeline de mídia precisa de fila simples; Redis já resolve pub/sub; sem overhead operacional extra          |
| aws-sdk-s3 como interface cloud    | APIs específicas por provedor | Interface S3-compatible unificada; SDK Rust oficial; R2 e B2 compatíveis nativamente                         |
| FFmpeg 7+ para transcodificação    | HandBrake / cloud transcoding | Grátis, amplamente suportado, controle total de parâmetros (CRF, codec, resolução); AV1 estável             |
| Next.js 16 para web client         | SvelteKit / Remix             | Turbopack (Rust) para builds rápidos; App Router maduro; React Server Components                             |
| Docker Compose v2 para deploy      | Bare metal / Kubernetes       | Reprodutibilidade sem complexidade de orquestração; compose para PostgreSQL + Redis + orquestrador           |
| Vault como arquivo criptografado   | HashiCorp Vault / cloud KMS   | Simples; sem dependência externa; desbloqueado pela master key derivada da seed                              |
| Sem cache/CDN na POC               | Cloudflare / Redis cache      | Volume não justifica; adicionar quando necessário                                                            |
