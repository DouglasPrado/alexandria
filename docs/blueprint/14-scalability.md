# 14. Escalabilidade

> Como o sistema crescerá para atender mais usuários, mais dados e mais carga?

O Alexandria é projetado para escala familiar (1-10 usuários, 50 nós, 100TB). A estratégia de escala prioriza simplicidade operacional (princípio arquitetural) — escalar verticalmente primeiro, horizontalmente quando necessário.

---

## 14.1 Estratégias de Escala

### Escala Horizontal

| Aspecto                        | Detalhes                                                                                                                                                          |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Componentes elegíveis**      | Nós de armazenamento (naturalmente horizontal — adicionar dispositivos/buckets); Media Workers (processar vídeos em paralelo); Agentes de nó (um por dispositivo) |
| **Mecanismo de balanceamento** | Consistent hashing (chunks distribuídos proporcionalmente à capacidade dos nós); Redis fila (workers consomem jobs independentemente)                             |
| **Estado da sessão**           | Orquestrador é stateless para requests (estado em PostgreSQL/Redis); JWT em cada request                                                                          |
| **Auto-scaling**               | Não na v1 — VPS única; nós de storage escalam manualmente (admin adiciona dispositivos/buckets)                                                                   |
| **Mínimo de instâncias**       | 1 orquestrador + 1 nó de storage (replicação mínima)                                                                                                              |
| **Máximo de instâncias**       | 1 orquestrador + 50 nós (limite v1)                                                                                                                               |

### Escala Vertical

| Aspecto                   | Detalhes                                                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Componentes elegíveis** | Orquestrador (CPU para criptografia, RAM para operações em memória); PostgreSQL (RAM para cache de queries); VPS (disco para dados locais temporários) |
| **Configuração atual**    | VPS ~€5-10/mês: 2 vCPU, 2-4GB RAM, 40-80GB SSD                                                                                                         |
| **Limite prático**        | VPS ~€40/mês: 8 vCPU, 16GB RAM, 320GB SSD — suficiente para 100k+ arquivos e 50 nós                                                                    |
| **Janela de manutenção**  | Qualquer momento — recovery via seed recria orquestrador em nova VPS; downtime <2h                                                                     |

### Caching

| Aspecto                       | Detalhes                                                                                                                                                                                           |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tecnologia**                | In-memory (Node.js Map/lru-cache) para hot data; Redis para dados compartilhados entre workers                                                                                                     |
| **Camadas de cache**          | Caddy (assets estáticos do web client) → Orquestrador (metadata em memória) → PostgreSQL (shared_buffers)                                                                                          |
| **O que cachear**             | Thumbnails/previews (servidos diretamente do filesystem); metadata de galeria (últimos N arquivos); ConsistentHashRing (recalculado apenas quando nós mudam); nó status (atualizado por heartbeat) |
| **Estratégia de invalidação** | Event-driven: invalidar quando nó muda, arquivo criado/deletado, heartbeat recebido                                                                                                                |
| **Tamanho estimado**          | <100MB em memória (metadata de 100k arquivos ~50MB; hash ring ~1MB)                                                                                                                                |

### Particionamento / Sharding

| Aspecto                        | Detalhes                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Estratégia**                 | Não necessário na v1 — volume familiar (100k arquivos, 100TB em chunks) cabe em uma instância PostgreSQL                             |
| **Futuro (se necessário)**     | Particionamento de `chunk_replicas` por `node_id` (tabela mais volumosa); particionamento de `files` por `created_at` (range mensal) |
| **Chunks já são distribuídos** | Consistent hashing já distribui chunks entre nós — é um sharding natural do storage, não do metadata                                 |

---

## 14.2 Limites Atuais

| Componente                | Limite Atual                                     | Gargalo                                     | Ação quando atingir                                                          |
| ------------------------- | ------------------------------------------------ | ------------------------------------------- | ---------------------------------------------------------------------------- |
| Orquestrador (API)        | ~1000 req/s (NestJS em 2 vCPU)                   | CPU (criptografia em requests)              | Escala vertical: VPS maior; ou separar media workers em processo próprio     |
| PostgreSQL 18             | ~500 conexões; ~1M registros em chunk_replicas   | Conexões (Prisma pool); disco para índices  | Connection pooling (Prisma max 20); VACUUM periódico; escala vertical        |
| Redis 7                   | ~50k msg/s; 1GB RAM                              | Memória (se acumular jobs)                  | Jobs são pequenos (~1KB); limitar fila a 10k jobs; alertar se crescer        |
| Storage por nó (S3/R2)    | Free tier: ~10-20GB por conta                    | Espaço                                      | Adicionar mais contas/provedores; alertar em 80%                             |
| Storage total cluster     | 100TB (limite v1)                                | Nós × capacidade                            | Adicionar nós; erasure coding na Fase 3 (economia ~40%)                      |
| Nós no cluster            | 50 (limite v1)                                   | Heartbeat overhead + ConsistentHashRing     | Otimizar heartbeat interval; batch updates                                   |
| Transcodificação de vídeo | 1 vídeo por vez (FFmpeg single-threaded por job) | CPU (FFmpeg consome 100% durante transcode) | Fila com prioridade; processar em horários de baixa demanda; escala vertical |
| Upload concorrente        | ~10 uploads simultâneos                          | Banda + CPU (criptografia)                  | Rate limiting; fila de uploads; escala vertical                              |

---

## 14.3 Plano de Capacidade

| Métrica                         | Atual (Alpha)   | 6 meses (Beta)                            | 12 meses (GA)                 | Ação necessária                                        |
| ------------------------------- | --------------- | ----------------------------------------- | ----------------------------- | ------------------------------------------------------ |
| Usuários ativos                 | 3-5 (1 família) | 15-30 (2-3 famílias)                      | 50+ (5+ famílias self-hosted) | Nenhuma — limite de 10/cluster é suficiente            |
| Arquivos no cluster             | 0               | ~10k (fotos + vídeos)                     | ~50k                          | Monitorar performance de galeria; paginação por cursor |
| Volume de metadata (PostgreSQL) | <1MB            | ~50MB                                     | ~200MB                        | VACUUM periódico; monitorar query performance          |
| Volume de chunks (storage)      | 0               | ~50GB (10k fotos + 100 vídeos otimizados) | ~500GB                        | Adicionar nós/provedores conforme necessário           |
| Nós no cluster                  | 3-5             | 10-15                                     | 20-30                         | Monitorar heartbeat overhead                           |
| Requisições/segundo (API)       | <1              | ~5-10 (galeria + heartbeats)              | ~20-50                        | Suficiente para VPS 2 vCPU                             |
| Tempo médio de resposta (API)   | <100ms          | <200ms                                    | <500ms (p95)                  | Monitorar; otimizar queries se degradar                |

---

## 14.4 Diagrama de Deploy Escalado

> 📐 Diagrama: [production-scaled.mmd](../diagrams/deployment/production-scaled.mmd)

> Na v1, o diagrama escalado é igual ao básico — VPS única. A escala acontece nos nós de storage (horizontal, adicionando dispositivos e buckets).

---

## 14.5 Estratégia de Cache

| O que cachear                            | TTL                  | Invalidação                                           |
| ---------------------------------------- | -------------------- | ----------------------------------------------------- |
| Thumbnails/previews (filesystem)         | Indefinido           | Invalidar quando arquivo deletado                     |
| Metadata de galeria (últimos N arquivos) | 30s                  | Ao criar/deletar arquivo (Redis pub/sub)              |
| ConsistentHashRing                       | Indefinido           | Recalcular quando nó entra/sai/muda capacidade        |
| Status de nós (online/suspect/lost)      | 1 min                | Atualizar a cada heartbeat recebido                   |
| Contagem de réplicas por chunk           | 5 min                | Invalidar em auto-healing e scrubbing                 |
| Assets estáticos do web client (JS, CSS) | 30 dias (Caddy)      | Cache busting via hash no filename (Next.js 16 build) |
| JWT decoded (claims)                     | Duração do JWT (24h) | Invalidar ao revogar sessão                           |

---

## 14.6 Rate Limiting e Throttling

### Configuração de Limites

| Endpoint / Recurso                   | Limite                        | Janela   | Ação ao exceder                                      |
| ------------------------------------ | ----------------------------- | -------- | ---------------------------------------------------- |
| API geral (por membro)               | 100 req/min                   | 1 minuto | HTTP 429 + header Retry-After                        |
| Upload de arquivos (por membro)      | 10 uploads/min                | 1 minuto | HTTP 429 + mensagem "Aguarde para enviar mais"       |
| Heartbeat (por nó)                   | 2 req/min                     | 1 minuto | Ignorar heartbeat extra (idempotente)                |
| StorageProvider (por provedor cloud) | Respeitar limites do provedor | Variável | Backoff exponencial; não exceder rate limit do S3/R2 |
| Recovery (por IP)                    | 3 tentativas/hora             | 1 hora   | HTTP 429 + "Tente novamente em X minutos"            |
| Convites (por admin)                 | 10 convites/hora              | 1 hora   | HTTP 429 + mensagem informativa                      |

### Estratégia de Implementação

| Aspecto                         | Detalhes                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------- |
| **Algoritmo**                   | Token bucket (via NestJS Guard `@nestjs/throttler`)                                         |
| **Onde aplicar**                | Middleware NestJS (NestJS Guard); Caddy para rate limit por IP em nível de proxy            |
| **Armazenamento de contadores** | In-memory (Map / cache in-memory) para API; Redis para limites compartilhados entre workers |
| **Identificação do cliente**    | JWT membro_id para API autenticada; IP para endpoints públicos (recovery, convite)          |
| **Headers de resposta**         | `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`                           |
| **Tratamento de burst**         | Permitir burst de 2x o limite por 5s (token bucket com burst capacity)                      |

### Degradação Graciosa

1. **Nível 1 — Alerta** (CPU >70%, fila Redis >1k jobs): Monitoramento ativado; alerta ao admin; sistema continua normal
2. **Nível 2 — Throttle** (CPU >85%, fila >5k jobs): Pausar transcodificação de vídeo; reduzir frequência de scrubbing; priorizar heartbeats e uploads de fotos
3. **Nível 3 — Shedding** (CPU >95%, PostgreSQL lento): Rejeitar novos uploads com 503; manter galeria (leitura) e heartbeats; alertar admin urgente
4. **Nível 4 — Circuit Breaker** (componente em falha): Isolar media workers se FFmpeg crashar; isolar StorageProvider se S3 rate-limited; orquestrador continua servindo galeria e heartbeats

---

## Referências

- PRD seção 8: Requisitos Não Funcionais (RNF-007 a RNF-009: limites de escala)
- ADR-006: Consistent hashing para distribuição de chunks
- Princípio: Simplicidade Operacional
