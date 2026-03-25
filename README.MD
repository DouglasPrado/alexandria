# Alexandria

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/{{org}}/alexandria/actions/workflows/ci.yml/badge.svg)](https://github.com/DouglasPrado/alexandria/actions)
[![Docker Pulls](https://img.shields.io/docker/pulls/DouglasPrado/alexandria.svg)](https://hub.docker.com/r/DouglasPrado/alexandria)
[![GitHub Stars](https://img.shields.io/github/stars/DouglasPrado/alexandria.svg)](https://github.com/DouglasPrado/alexandria/stargazers)

> **Distributed family storage with end-to-end encryption and 12-word recovery.**

Alexandria lets families preserve their digital memories for decades — distributing encrypted data across their own devices and cloud providers, with automatic 3× replication, self-healing, and full system recovery via a 12-word seed phrase. No vendor lock-in. No monthly fees. Your data, your devices, your rules.

---

## Features

- **3× replication** across family devices and cloud providers (AWS S3, Cloudflare R2, Backblaze B2, local nodes)
- **Zero-knowledge encryption** — AES-256-GCM before upload; no provider or orchestrator can read your data
- **12-word seed phrase recovery** — rebuild the entire system from scratch on a new VPS in <2 hours
- **Media optimization** — photos 10–20× smaller (5MB → 400KB WebP Full HD); videos 3–5× smaller (4K H.264 → 1080p H.265/AV1)
- **Auto-healing** — when a node goes offline, chunks are automatically re-replicated to maintain 3× coverage
- **Zero cost** — combine ~100GB free tier per person across cloud providers; a family of 5 gets ~500GB free
- **Self-hosted** — runs on a €5/month VPS; no external subscription required
- **Family gallery** — unified timeline of all family photos across all devices and members

---

## Quick Start

```bash
# Prerequisites: Docker, Docker Compose

git clone https://github.com/{{org}}/alexandria.git
cd alexandria

cp .env.example .env
# Edit .env with your cloud provider credentials (optional — local storage works out of the box)

docker compose up -d

# Open the web client
open http://localhost:3000
```

Follow the setup wizard to create your family cluster, invite members, and add storage nodes.

Full setup guide (VPS, DNS, cloud providers): [docs/getting-started.md](docs/getting-started.md)

---

## Documentation

| Document                                                 | Description                                  |
| -------------------------------------------------------- | -------------------------------------------- |
| [Getting Started](docs/getting-started.md)               | Installation, setup, first cluster           |
| [Architecture](docs/blueprint/06-system-architecture.md) | System components and deployment topology    |
| [Technical Blueprint](docs/blueprint/)                   | Full technical specification                 |
| [Contributing](CONTRIBUTING.md)                          | How to contribute code, docs, or bug reports |
| [Security](SECURITY.md)                                  | Vulnerability disclosure policy              |
| [Changelog](CHANGELOG.md)                                | Release history                              |

---

## Architecture Overview

```
                        Internet
                            │
                       DNS Provider
                            │
                    VPS (Docker Compose)
                    ├── Caddy (TLS proxy)
                    ├── Orchestrator (NestJS)
                    │     ├── API REST
                    │     ├── Media Workers (FFmpeg + libvips)
                    │     └── Scheduler (auto-healing, scrubbing)
                    ├── Web Client (Next.js)
                    ├── PostgreSQL (metadata)
                    └── Redis (job queue)
                            │
              ┌─────────────┼─────────────┐
              ↓             ↓             ↓
          AWS S3      Cloudflare R2   Backblaze B2
                            │
              ┌─────────────┼─────────────┐
              ↓             ↓             ↓
          PC (Node)    NAS (Node)    VPS (Node)
```

- **Orchestrator** — coordinates everything; stateless; fully recoverable from 12-word seed phrase
- **Node Agent** — lightweight daemon on family devices; stores encrypted chunks; sends heartbeats
- **Core SDK** — shared cryptography, chunking, BIP-39; used by orchestrator, node agent, and CLI

---

## Why Alexandria?

|                           | Google Photos       | iCloud           | Nextcloud   | Alexandria                  |
| ------------------------- | ------------------- | ---------------- | ----------- | --------------------------- |
| Storage cost              | $3–30/mo            | $1–10/mo         | $0 + VPS    | **$0** (free tiers)         |
| Privacy                   | Google reads photos | Apple can access | Self-hosted | **Zero-knowledge**          |
| Vendor lock-in            | Google account      | Apple account    | Your server | **None — 12-word recovery** |
| Multi-provider redundancy | ❌                  | ❌               | ❌          | **✅ (3+ providers)**       |
| Media optimization        | ✅                  | ✅               | ❌          | **✅ (10–20× compression)** |
| Self-hosted               | ❌                  | ❌               | ✅          | **✅**                      |
| License                   | Proprietary         | Proprietary      | AGPL-3.0    | **MIT**                     |

---

## Supported Storage Providers

| Provider                   | Protocol      | Free Tier                       |
| -------------------------- | ------------- | ------------------------------- |
| Cloudflare R2              | S3-compatible | 10GB storage + zero egress fees |
| AWS S3                     | S3-compatible | 5GB (Free Tier)                 |
| Backblaze B2               | S3-compatible | 10GB                            |
| Local filesystem           | Native        | Unlimited (your disk)           |
| Any S3-compatible provider | S3-compatible | Varies                          |

Adding support for new providers: see [docs/contributing/add-storage-provider.md](docs/contributing/add-storage-provider.md).

---

## Contributing

We welcome all contributions — code, documentation, bug reports, and ideas.

1. Read [CONTRIBUTING.md](CONTRIBUTING.md)
2. Check [good first issues](https://github.com/{{org}}/alexandria/labels/good%20first%20issue)
3. Join the [Discord](https://discord.gg/{{invite}}) or [GitHub Discussions](https://github.com/{{org}}/alexandria/discussions)

---

## Community

- **GitHub Discussions**: questions, ideas, and showcase — [github.com/{{org}}/alexandria/discussions](https://github.com/{{org}}/alexandria/discussions)
- **Discord**: real-time community chat — [discord.gg/{{invite}}](https://discord.gg/{{invite}})
- **Reddit**: [r/selfhosted](https://reddit.com/r/selfhosted) (tag posts with `alexandria`)
- **Report a bug**: [.github/ISSUE_TEMPLATE/bug_report.md](.github/ISSUE_TEMPLATE/bug_report.md)

---

## Sponsors

Alexandria is free and open-source. If it preserves your family's memories, consider supporting development:

- [GitHub Sponsors](https://github.com/sponsors/{{org}})
- [OpenCollective](https://opencollective.com/alexandria)

Corporate sponsors: logo on README, website, and release notes. See [docs/business/05-modelo-receita.md](docs/business/05-modelo-receita.md) for tiers.

---

## License

This project is licensed under the [MIT License](LICENSE).

Copyright (c) 2026 Douglas Prado

---

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

_Want your name here? Check [CONTRIBUTING.md](CONTRIBUTING.md) to get started._
