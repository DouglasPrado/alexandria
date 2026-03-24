# Backend — Respostas do Questionário de Implementação

> Decisões coletadas do blueprint técnico + respostas do Douglas Prado em 2026-03-23.

---

## Stack Técnica

| # | Decisão | Origem |
|---|---------|--------|
| 1 | **Padrão arquitetural:** Modular monolith com monorepo (pnpm workspaces: core-sdk, orchestrator, node-agent) | Blueprint ADR-001 + resposta do usuário |
| 2 | **Dev local:** `pnpm dev` com Docker Compose para PostgreSQL 18 e Redis 7 | Resposta do usuário |
| 3 | **Porta da API:** 3333 | Resposta do usuário |
| 4 | **Linguagem/Framework:** TypeScript + NestJS | Blueprint ADR-001 |
| 5 | **ORM:** Prisma (type-safe queries) | Blueprint 05-data-model |
| 6 | **Banco:** PostgreSQL 18 (primário) + Redis 7 (filas, pub/sub, cache) | Blueprint ADR-004 |
| 7 | **Deploy prod:** Docker Compose (orquestrador + PG18 + Redis 7 + web client + Caddy) | Blueprint 11-build_plan |

## Detalhes de API

| # | Decisão | Origem |
|---|---------|--------|
| 8 | **Versionamento:** Sem versionamento de URL/header | Resposta do usuário |
| 9 | **Paginação:** Cursor-based usando campo `id` | Blueprint 05-data + resposta do usuário |
| 10 | **Endpoints:** Derivados dos use cases (UC-001 a UC-010) e requisitos funcionais | Resposta do usuário |

## Workers e Filas

| # | Decisão | Origem |
|---|---------|--------|
| 11 | **Library de filas:** BullMQ (com @nestjs/bullmq) | Resposta do usuário |
| 12 | **Media workers:** 1 worker para fotos (libvips), 1 worker para vídeos (FFmpeg) | Resposta do usuário |
| 13 | **Scheduler:** @nestjs/schedule para tarefas periódicas (scrubbing, GC, heartbeat check) | Blueprint 11-build_plan |

## Email

| # | Decisão | Origem |
|---|---------|--------|
| 14 | **Provedor:** Resend (SDK TypeScript, free tier 3k emails/mês) | Blueprint 17-communication + resposta do usuário |

## Observabilidade e Cache

| # | Decisão | Origem |
|---|---------|--------|
| 15 | **Logs:** pino + nestjs-pino (JSON estruturado) | Blueprint 15-observability |
| 16 | **Métricas:** Prometheus + Grafana (desde o início, sem fases) | Resposta do usuário |
| 17 | **Tracing:** OpenTelemetry (desde o início) | Resposta do usuário (sem fases) |
| 18 | **Cache:** Redis (cache compartilhado) + lru-cache (in-memory hot data) | Resposta do usuário |

## Autenticação e Permissões

| # | Decisão | Origem |
|---|---------|--------|
| 19 | **Auth de membros:** JWT assinado com chave do cluster; expiração 24h; httpOnly cookie | Blueprint 13-security |
| 20 | **Auth de nós:** Token de registro assinado + heartbeat autenticado | Blueprint 13-security |
| 21 | **RBAC:** 3 roles fixos (admin, member, reader) | Blueprint 13-security |
| 22 | **Provedor auth:** Implementação própria (seed → cluster keys → JWT signing) | Blueprint 13-security |
