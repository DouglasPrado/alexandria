# Alexandria

**Distributed family storage with end-to-end encryption, automatic replication, self-healing and seed-phrase recovery.**

Alexandria is a self-hosted storage system designed to preserve a family's digital memories across decades.

Instead of depending on a single device, server or cloud provider, Alexandria distributes encrypted data across **local devices and S3-compatible storage providers**, continuously monitors replica health and automatically repairs lost redundancy.

Your data. Your infrastructure. Your recovery keys.

---

## Why Alexandria?

Family photos and videos often live across phones, computers, NAS devices and cloud accounts.

The problem is not simply storing those files.

The real problem is preserving them over time despite:

* device failures
* provider outages
* lost servers
* corrupted files
* expired subscriptions
* infrastructure changes
* accidental deletion
* abandoned cloud services

Alexandria treats long-term storage as a **distributed systems problem**.

The system is designed around five principles:

### Ownership

Storage can live on your own devices or providers you control.

### Redundancy

Files are split into encrypted chunks and distributed across independent storage nodes.

The default target replication factor is **3×**.

### Recoverability

The orchestrator is disposable.

The system is designed so infrastructure can be reconstructed using a **12-word recovery phrase** and distributed manifests.

### Provider independence

Storage is abstracted behind a common provider interface.

Alexandria can combine local disks with S3-compatible providers without making any single provider the source of truth.

### Operational simplicity

The control plane runs as a modular monolith on a small VPS using Docker Compose instead of requiring a Kubernetes cluster or complex distributed control plane.

---

# Features

### Distributed storage

Files are distributed across multiple storage locations, including:

* family computers
* NAS devices
* remote servers
* AWS S3
* Cloudflare R2
* Backblaze B2
* other S3-compatible providers

---

### Automatic 3× replication

Alexandria tracks the replicas associated with every encrypted chunk.

If replica count drops below the desired level, the scheduler can create new copies on healthy nodes.

---

### Self-healing

Nodes continuously report their health to the orchestrator.

When storage disappears or becomes unavailable, Alexandria can:

1. detect the unhealthy node
2. identify under-replicated chunks
3. locate healthy replicas
4. create replacement replicas
5. restore the target redundancy level

---

### Encrypted storage

Files are encrypted before being distributed to storage providers.

The cryptography layer is implemented inside the shared Core SDK using:

* AES-256-GCM
* SHA-256
* BIP-39
* envelope encryption

Storage providers receive encrypted chunks rather than the original files.

---

### Seed-phrase recovery

Alexandria is designed so the central server is not a permanent dependency.

A new orchestrator can reconstruct the system using the recovery phrase and manifests stored across the distributed storage network.

The recovery architecture is designed around a **12-word seed phrase**.

---

### Integrity scrubbing

Background jobs periodically verify stored chunks.

Corrupted or missing replicas can be detected and replaced using healthy copies from other nodes.

---

### Media optimization

Alexandria includes a media-processing pipeline for long-term photo and video storage.

Photos can be processed using **libvips**.

Videos can be processed using **FFmpeg**.

The pipeline can:

```text
upload
   ↓
analysis
   ↓
media optimization
   ↓
preview generation
   ↓
chunking
   ↓
encryption
   ↓
replication
```

---

### Family gallery

A web application provides a unified interface for:

* photos
* videos
* uploads
* family members
* storage nodes
* alerts
* cluster health
* recovery operations

---

# Architecture

Alexandria uses a deliberately simple control plane combined with distributed storage nodes.

```text
                         Internet
                            │
                            ▼
                      DNS Provider
                            │
                            ▼
                   ┌─────────────────┐
                   │       VPS       │
                   │ Docker Compose  │
                   └────────┬────────┘
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
          Caddy        Web Client     Orchestrator
                          Next.js        NestJS
                                           │
                          ┌────────────────┼────────────────┐
                          │                │                │
                          ▼                ▼                ▼
                       PostgreSQL        Redis          Scheduler
                                           │
                                           ▼
                                      Media Workers
                                   FFmpeg + libvips
                                           │
                  ┌────────────────────────┴────────────────────────┐
                  │                                                 │
                  ▼                                                 ▼
          Cloud Storage                                       Local Nodes
                  │                                                 │
        ┌─────────┼─────────┐                           ┌───────────┼───────────┐
        ▼         ▼         ▼                           ▼           ▼           ▼
      AWS S3     R2         B2                         PC          NAS        VPS
```

The architecture separates the **control plane** from the **storage plane**.

The orchestrator coordinates the system but does not need to permanently store the underlying user data.

---

# Core Components

## Web Client

The web interface used to manage the family cluster.

Built with:

* Next.js
* React
* TypeScript
* Tailwind CSS
* TanStack Query
* Zustand

Responsibilities include:

* file upload
* gallery
* member management
* storage node management
* system health
* alerts
* recovery workflows

---

## Orchestrator

The orchestrator is the control plane of Alexandria.

Built with **NestJS and TypeScript**.

It coordinates:

* clusters
* members
* nodes
* files
* chunks
* replicas
* uploads
* storage providers
* health monitoring
* recovery
* background jobs

The orchestrator is intentionally designed to be **recoverable infrastructure rather than permanent infrastructure**.

---

## Media Workers

Media workers process incoming photos and videos.

Responsibilities include:

* metadata extraction
* image optimization
* video transcoding
* preview generation
* chunk creation
* encryption
* distribution

The processing stack includes:

```text
FFmpeg
libvips
TypeScript
Core SDK
```

---

## Scheduler

The scheduler continuously maintains the storage network.

Scheduled operations include:

* node health detection
* auto-healing
* integrity scrubbing
* replica repair
* garbage collection
* rebalancing
* alert generation

---

## Node Agent

The Node Agent is a lightweight service that runs on family-owned storage devices.

Examples:

```text
Desktop PC
NAS
Home server
Remote VPS
```

Each node can:

* store encrypted chunks
* report available capacity
* send heartbeats
* perform local integrity checks
* receive chunks
* serve chunks during recovery or download

---

## Core SDK

`packages/core-sdk` contains infrastructure-independent primitives shared by Alexandria components.

It includes functionality for:

```text
cryptography
hashing
chunking
BIP-39 recovery
storage primitives
shared contracts
```

Keeping these primitives outside the orchestrator allows them to be reused independently by the Node Agent and future tooling.

---

# Storage Model

Alexandria stores files as encrypted chunks rather than single objects.

Conceptually:

```text
Original File
      │
      ▼
Media Processing
      │
      ▼
Chunking
      │
      ├── Chunk A
      ├── Chunk B
      ├── Chunk C
      └── Chunk D
            │
            ▼
        Encryption
            │
            ▼
      Replica placement
```

Each chunk can have multiple replicas:

```text
Chunk A
 ├── NAS
 ├── Cloudflare R2
 └── Remote VPS

Chunk B
 ├── Home PC
 ├── AWS S3
 └── Backblaze B2
```

This allows the system to survive the loss of individual storage locations.

---

# Self-Healing

Alexandria continuously evaluates replica health.

For example:

```text
Desired replication factor: 3

Chunk A

NAS              ✓
Cloudflare R2    ✓
Home PC          ✗
```

The scheduler detects:

```text
replicas = 2
desired  = 3
```

A repair job is created.

```text
NAS
 │
 │ read encrypted chunk
 ▼
Scheduler / Worker
 │
 │ create replacement
 ▼
Backblaze B2
```

After repair:

```text
NAS              ✓
Cloudflare R2    ✓
Backblaze B2     ✓
```

The target redundancy level is restored automatically.

---

# Recovery Model

A core architectural goal is making the orchestrator replaceable.

The recovery model separates:

```text
Infrastructure
      from
User Data
      from
Recovery Identity
```

If the VPS hosting Alexandria disappears, recovery is designed around:

```text
New VPS
   │
   ▼
Install Alexandria
   │
   ▼
Enter 12-word recovery phrase
   │
   ▼
Discover storage
   │
   ▼
Recover manifests
   │
   ▼
Reconstruct metadata
   │
   ▼
Restore cluster
```

The infrastructure is therefore not intended to become a permanent single point of failure.

---

# Storage Providers

Alexandria uses a common `StorageProvider` abstraction.

Current storage targets include:

| Provider                    | Type          |
| --------------------------- | ------------- |
| AWS S3                      | S3-compatible |
| Cloudflare R2               | S3-compatible |
| Backblaze B2                | S3-compatible |
| Local filesystem            | Native        |
| Other S3-compatible storage | S3-compatible |

A provider implements operations such as:

```text
put
get
exists
delete
list
capacity
```

This makes the storage layer extensible without coupling Alexandria's core domain to individual vendors.

---

# Technology Stack

### Backend

```text
TypeScript
Node.js
NestJS
Prisma
PostgreSQL
Redis
```

### Frontend

```text
Next.js
React
TypeScript
Tailwind CSS
TanStack Query
Zustand
```

### Storage

```text
AWS S3
Cloudflare R2
Backblaze B2
S3-compatible providers
Local filesystem
```

### Media

```text
FFmpeg
libvips
WebP
H.265
AV1
```

### Infrastructure

```text
Docker
Docker Compose
Caddy
GitHub Actions
```

### Tooling

```text
pnpm
Turborepo
ESLint
Prettier
TypeScript
```

---

# Repository Structure

```text
alexandria/
├── apps/
│   ├── api/                  # NestJS orchestrator
│   └── web/                  # Next.js web application
│
├── packages/
│   ├── core-sdk/             # Crypto, chunking and recovery primitives
│   └── node-agent/           # Distributed storage node
│
├── src/
│   └── contracts/            # Shared contracts
│
├── docs/                     # Architecture and technical documentation
│
├── infra/                    # Observability and infrastructure configuration
│
├── .github/                  # CI/CD and repository automation
│
├── docker-compose.yml
├── docker-compose.dev.yml
├── Dockerfile
├── Caddyfile
└── package.json
```

---

# Quick Start

## Requirements

For the Docker-based setup:

```text
Docker
Docker Compose
```

Clone the repository:

```bash
git clone https://github.com/DouglasPrado/alexandria.git
cd alexandria
```

Create your environment configuration:

```bash
cp .env.example .env
```

Start Alexandria:

```bash
docker compose up -d
```

Open the web application:

```text
http://localhost:3000
```

The setup flow will guide you through the initial cluster configuration.

For more detailed installation and infrastructure instructions, see the documentation in [`docs/`](./docs).

---

# Development

Alexandria is a **pnpm + Turborepo monorepo**.

Requirements:

```text
Node.js >= 22
pnpm >= 9
Docker
Docker Compose
```

Install dependencies:

```bash
pnpm install
```

Run the development environment:

```bash
pnpm dev
```

Build all workspaces:

```bash
pnpm build
```

Run tests:

```bash
pnpm test
```

Run unit tests:

```bash
pnpm test:unit
```

Run integration tests:

```bash
pnpm test:integration
```

Run end-to-end tests:

```bash
pnpm test:e2e
```

Type check:

```bash
pnpm typecheck
```

Lint:

```bash
pnpm lint
```

Format:

```bash
pnpm format
```

---

# Database

Generate Prisma artifacts:

```bash
pnpm db:generate
```

Run development migrations:

```bash
pnpm db:migrate:dev
```

Run production migrations:

```bash
pnpm db:migrate
```

Open Prisma Studio:

```bash
pnpm db:studio
```

Seed the database:

```bash
pnpm db:seed
```

---

# Security

Security is a core architectural concern of Alexandria.

The system is designed around:

* encrypted chunks
* authenticated encryption with AES-256-GCM
* integrity verification
* BIP-39 recovery
* provider isolation
* TLS communication
* recoverable infrastructure
* distributed replicas

Storage providers should never need access to the original plaintext files in order to store Alexandria chunks.

For vulnerability reporting, see [`SECURITY.md`](./SECURITY.md).

Please do **not** disclose security vulnerabilities through public GitHub issues.

---

# Observability

Alexandria includes infrastructure for operational visibility.

The architecture currently uses:

```text
structured application logs
health endpoints
Grafana provisioning
Promtail configuration
```

Health and background maintenance information can be used to monitor:

* storage nodes
* replica counts
* failed jobs
* integrity checks
* under-replicated chunks
* scheduler operations
* system alerts

---

# Extensibility

Alexandria intentionally defines extension boundaries around infrastructure-specific components.

Examples include:

### Storage providers

New storage adapters can implement the `StorageProvider` interface.

Potential integrations include:

```text
MinIO
Google Drive
pCloud
other S3-compatible services
custom local storage
```

### Media processors

Alternative media pipelines can be introduced behind media-processing abstractions.

### Core SDK

Cryptography, hashing, chunking and recovery primitives live outside the orchestrator so they can be consumed by other Alexandria components and future tooling.

---

# Design Decisions

Alexandria intentionally favors understandable infrastructure over unnecessary operational complexity.

Some important architectural decisions include:

### Modular monolith for the control plane

The orchestrator uses NestJS modules instead of independent microservices.

This keeps deployment and operations simple while maintaining internal module boundaries.

### Docker Compose instead of Kubernetes

The expected control-plane workload does not require a Kubernetes cluster.

Alexandria prioritizes reproducibility and operational simplicity.

### PostgreSQL for metadata

Metadata benefits from strong consistency, transactions and relational constraints.

### Redis for asynchronous work

Redis handles background jobs and internal asynchronous communication while PostgreSQL remains the durable metadata source.

### S3-compatible storage abstraction

The domain does not depend directly on a single cloud provider.

### Distributed storage, centralized coordination

Storage capacity scales horizontally through nodes while coordination remains simple and recoverable.

---

# Documentation

Detailed technical documentation lives under [`docs/`](./docs).

Important resources include:

* Getting Started
* System Architecture
* Technical Blueprint
* storage architecture
* recovery design
* security model
* deployment
* contribution guides

The README intentionally provides the high-level model.

The documentation contains the implementation details and architectural rationale.

---

# Contributing

Contributions are welcome.

You can contribute through:

* bug reports
* feature proposals
* documentation
* tests
* storage providers
* media processors
* architecture discussions
* pull requests

Before contributing, read [`CONTRIBUTING.md`](./CONTRIBUTING.md).

A typical workflow is:

```bash
git clone https://github.com/DouglasPrado/alexandria.git
cd alexandria

pnpm install

git checkout -b feat/my-feature
```

Before submitting a pull request:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

---

# Project Philosophy

Alexandria is built around a simple idea:

> **Memories should outlive the infrastructure that stores them.**

Servers disappear.

Hard drives fail.

Cloud providers change.

Accounts get lost.

Infrastructure gets replaced.

The storage system should expect those failures rather than assume they will never happen.

Alexandria is an exploration of how **encryption, redundancy, recovery and simple distributed systems** can make personal digital archives more durable.

---

# License

Alexandria is released under the [MIT License](./LICENSE).

Copyright © 2026 Douglas Prado.
