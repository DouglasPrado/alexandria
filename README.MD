# Alexandria

Sistema de armazenamento familiar distribuído que permite guardar fotos, vídeos e documentos por décadas com alta durabilidade. Funciona como um "Google Drive familiar descentralizado", distribuindo dados criptografados entre dispositivos da família e múltiplos provedores de cloud.

## Problema

Famílias acumulam grandes volumes de dados digitais sem uma solução que garanta preservação de longo prazo. Provedores centralizados têm espaço limitado e custos crescentes. Backups manuais em HDs externos são esquecidos e degradam em 5-10 anos. Não existe redundância real contra perda total.

## Como funciona

- **Orquestrador central** em VPS — gerencia metadados e coordena distribuição de chunks (descartável e recriável)
- **Nós de armazenamento** — computadores, celulares, NAS, VPS, buckets cloud (S3, R2, Google Drive, Dropbox, OneDrive)
- **Pipeline de otimização** — fotos convertidas para Full HD WebP (~300-600KB), vídeos para 1080p H.265/AV1 (~400-600MB)
- **Recuperação total** — seed phrase de 12 palavras permite reconstruir o sistema completo

## Princípios

- **LOCKSS** — "Lots Of Copies Keep Stuff Safe": múltiplas cópias em lugares diferentes
- **Orquestrador descartável** — o orquestrador é o bibliotecário, não a biblioteca
- **Encrypt before upload** — zero-knowledge; nenhum provedor consegue ler os dados
- **Full HD é suficiente** — otimizar para percepção humana, não fidelidade absoluta
- **Embrace failure** — o sistema assume que nós vão falhar e se auto-repara

## Funcionalidades principais

- Cluster familiar com identidade criptográfica e convite de membros
- Upload com pipeline completo: resize → transcode → preview → encrypt → chunk → distribute
- Replicação mínima de 3 cópias por chunk com auto-healing
- Deduplicação via content-addressable storage
- Criptografia AES-256-GCM ponta-a-ponta (envelope encryption)
- Vault criptografado individual por membro (tokens, credenciais, senhas)
- Integração com S3, R2, Google Drive, Dropbox, OneDrive
- Heartbeat monitoring e alertas automáticos
- Recuperação completa do orquestrador via seed phrase de 12 palavras

## Stack técnica

| Componente | Tecnologia |
|---|---|
| Backend | TypeScript (NestJS) |
| ORM | Prisma |
| Frontend Web | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS v4 |
| Estado | Zustand v5, TanStack Query v5 |
| Desktop (fase 2) | Tauri |
| Mobile (fase 3) | React Native |
| Banco de dados | PostgreSQL 18 |
| Filas | Redis 7 |
| Transcodificação | FFmpeg 7, libvips |
| Infraestrutura | Docker Compose, Caddy |

## Fases de entrega

| Fase | Nome | Objetivo |
|---|---|---|
| 1 | MVP | Cluster, upload, pipeline, replicação 3x, seed recovery, web client |
| 2 | Consolidação | Timeline, busca EXIF, monitoring avançado, multi-admin, desktop (Tauri) |
| 3 | Expansão | Mobile (React Native), reconhecimento facial, OCR, erasure coding, P2P |

## Limites do sistema (v1)

- Até 10 usuários por cluster
- Até 50 nós por cluster
- Até 100TB de armazenamento total

## Documentação

- [PRD completo](docs/PRD.MD)
- [Blueprint técnico](docs/blueprint/)
- [Blueprint frontend](docs/frontend/)

## Licença

Projeto privado — Família Prado.
