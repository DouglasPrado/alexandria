# Arquitetura do Backend

Define as camadas arquiteturais, regras de dependencia, fronteiras de dominio e estrategia de deploy.

> **Implementa:** [docs/blueprint/06-system-architecture.md](../blueprint/06-system-architecture.md) (componentes e deploy) e [docs/blueprint/10-architecture_decisions.md](../blueprint/10-architecture_decisions.md) (ADRs).
> **Complementa:** [docs/frontend/01-architecture.md](../frontend/01-architecture.md) (camadas do frontend).

---

## Camadas Arquiteturais

> Como o backend e organizado internamente?

<!-- do blueprint: 06-system-architecture.md + ADR-001 -->

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│   (Controllers, Guards, Interceptors)   │
├─────────────────────────────────────────┤
│           Application Layer             │
│     (Services, DTOs, Validators)        │
├─────────────────────────────────────────┤
│             Domain Layer                │
│  (Entities, Value Objects, Events)      │
├─────────────────────────────────────────┤
│         Infrastructure Layer            │
│ (Repositories, Cache, Queue, External)  │
└─────────────────────────────────────────┘
```

| Camada         | Contem                                                                                                                      | Regra de Dependencia                |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Presentation   | Controllers NestJS, Guards (auth, rate limit), Interceptors (logging, serialization), Pipes (validation)                    | So depende de Application           |
| Application    | Services (orquestracao), DTOs (request/response), use case orchestrators                                                    | So depende de Domain                |
| Domain         | Entities (Cluster, Member, Node, File, Chunk...), value objects, domain events, domain errors, interfaces de repository     | Nao depende de nenhuma outra camada |
| Infrastructure | Prisma repositories, Redis cache/pub-sub, BullMQ producers/consumers, StorageProvider (S3/R2/B2/local), Resend email client | Implementa interfaces do Domain     |

<!-- added: opensource -->

### Contributor Architecture Guide

- **Layer boundaries**: Controllers call Services; Services call Repositories and external Clients; Repositories only touch Prisma. Never call a Repository from a Controller directly.
- **Dependency injection**: register new services as `@Injectable()` in the NestJS module `providers` array; use constructor injection — never instantiate directly.
- **Adding a new domain module**: create `src/modules/your-module/` with `.module.ts`, `.service.ts`, `.controller.ts` (optional), `.repository.ts`. Follow the pattern in `src/modules/cluster/`.
- **Architecture Decision Records**: read `docs/blueprint/10-architecture_decisions.md` before proposing architectural changes — understand what was already considered.
- **Core SDK boundary**: `packages/core-sdk` is a separate package. Changes affect all consumers (orchestrator, node agent). Treat its public API as stable; use RFCs for breaking changes.

<!-- APPEND:camadas -->

---

## Regras de Dependencia

> Quais regras garantem o isolamento entre camadas?

- A camada Domain NUNCA importa de Infrastructure ou Presentation
- Controllers NUNCA acessam repositories diretamente — sempre via Service
- Services NUNCA retornam entidades de ORM (Prisma models) — sempre mapeiam para Domain entities ou DTOs
- Toda dependencia externa (banco, cache, API, storage) e acessada via interface definida em Domain
- NestJS `@Inject()` com tokens abstratos para inversao de dependencia
- Core SDK (`packages/core-sdk`) nao depende de NestJS — pure TypeScript

---

## Fronteiras de Dominio

> Como o backend e dividido em modulos/dominios?

<!-- do blueprint: 04-domain-model.md (entidades) + 06-system-architecture.md -->

| Modulo/Dominio | Responsabilidade                                      | Entidades Principais          | Depende de      |
| -------------- | ----------------------------------------------------- | ----------------------------- | --------------- |
| Cluster        | Criacao, seed phrase, identity crypto, recovery       | Cluster, Invite               | —               |
| Member         | Convite, ingresso, roles, vault                       | Member, Vault                 | Cluster         |
| Node           | Registro, heartbeat, drain, status lifecycle          | Node                          | Cluster, Member |
| File           | Upload, pipeline de midia, previews, galeria          | File, Preview                 | Cluster, Member |
| Storage        | Chunking, criptografia, distribuicao, manifest        | Manifest, Chunk, ChunkReplica | Node, File      |
| Health         | Alertas, scrubbing, auto-healing, GC, rebalanceamento | Alert                         | Node, Storage   |
| Notification   | Email transacional (convites, alertas, recovery)      | —                             | Member, Health  |

<!-- APPEND:dominios -->

---

## Comunicacao entre Modulos

> Como os modulos se comunicam?

<!-- do blueprint: 07-critical_flows.md -->

| De      | Para         | Tipo       | Mecanismo            | Exemplo                                                    |
| ------- | ------------ | ---------- | -------------------- | ---------------------------------------------------------- |
| File    | Storage      | Sincrono   | Chamada de Service   | FileService chama StorageService.distributeChunks()        |
| File    | Notification | Assincrono | Evento BullMQ        | FileError → EmailWorker envia erro ao membro               |
| Node    | Health       | Assincrono | Evento Redis pub/sub | NodeLost → HealthService dispara auto-healing              |
| Health  | Storage      | Sincrono   | Chamada de Service   | AutoHealingService chama StorageService.reReplicateChunk() |
| Cluster | Member       | Sincrono   | Chamada de Service   | ClusterService chama MemberService.createAdmin()           |
| Member  | Notification | Assincrono | Evento BullMQ        | MemberJoined → EmailWorker envia boas-vindas               |
| Health  | Notification | Assincrono | Evento BullMQ        | AlertCreated (critical) → EmailWorker envia alerta         |

<!-- APPEND:comunicacao -->

---

## Estrategia de Deploy

> Como o backend e implantado em cada ambiente?

<!-- do blueprint: 11-build_plan.md + backend-answers.md -->

| Ambiente    | Infraestrutura                                                                     | Deploy                 | URL                          |
| ----------- | ---------------------------------------------------------------------------------- | ---------------------- | ---------------------------- |
| Development | Docker Compose local (PG18 + Redis 7)                                              | `pnpm dev`             | localhost:3333               |
| Production  | Docker Compose em VPS Contabo (orquestrador + PG18 + Redis 7 + web client + Caddy) | `docker compose up -d` | https://{dominio-do-usuario} |

**Pipeline CI/CD:**

```
Push → ESLint + Prettier → Jest (unit) → Jest (integration + testcontainers) → Build Docker → Deploy Staging → Smoke Test → Deploy Prod
```

**Nota:** Sem ambiente de staging na v1 (time de 1 pessoa). Deploy direto para producao apos CI verde + smoke test local.

<!-- APPEND:deploy -->

> (ver [02-project-structure.md](02-project-structure.md) para a arvore de diretorios)
