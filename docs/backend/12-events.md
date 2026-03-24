# Eventos e Mensageria

Define eventos de dominio, filas, workers assincronos, schemas de payload e estrategias de retry.

> **Consumido por:** [docs/shared/event-mapping.md](../shared/event-mapping.md) (como o frontend reage a cada evento).

<!-- do blueprint: 07-critical_flows.md, 06-system-architecture.md -->

---

## Estrategia de Mensageria

> Qual tecnologia e padrao de mensageria o sistema usa?

| Aspecto | Decisao |
| --- | --- |
| Message Broker | BullMQ (@nestjs/bullmq) |
| Padrao | Queue (jobs) + Redis pub/sub (notificacoes real-time) |
| Storage | Redis 7 |
| Formato | JSON |
| Idempotencia | Por eventId (UUID) + dedup no consumer |

---

## Mapa de Eventos

> Quais eventos existem, quem produz e quem consome?

| Evento | Produtor | Consumidor(es) | Fila/Topico | Retry | DLQ |
| --- | --- | --- | --- | --- | --- |
| ClusterCreated | ClusterService | — (log only) | — (Redis pub/sub) | — | — |
| ClusterRecovered | ClusterService | EmailWorker | email.send | 3x, backoff 2^n | email.send.dlq |
| MemberJoined | MemberService | EmailWorker | email.send | 3x, backoff 2^n | email.send.dlq |
| MemberRemoved | MemberService | — (log only) | — | — | — |
| NodeRegistered | NodeService | — (Redis pub/sub) | — | — | — |
| NodeSuspect | SchedulerService | — (log only) | — | — | — |
| NodeLost | SchedulerService | AutoHealWorker, EmailWorker | healing.process, email.send | 5x backoff 2^n, 3x backoff 2^n | healing.dlq, email.send.dlq |
| NodeDrained | NodeService | — (log only) | — | — | — |
| FileUploaded | FileService | PhotoWorker OR VideoWorker | media.photos OR media.videos | 3x, backoff 2^n | media.dlq |
| FileProcessed | PhotoWorker/VideoWorker | — (Redis pub/sub para UI) | — | — | — |
| FileError | PhotoWorker/VideoWorker | EmailWorker | email.send | 3x, backoff 2^n | email.send.dlq |
| FileCorrupted | HealthService | EmailWorker | email.send | 3x, backoff 2^n | email.send.dlq |
| AlertCreated | HealthService | EmailWorker (se severity=critical) | email.send | 3x, backoff 2^n | email.send.dlq |
| AlertResolved | HealthService | — (Redis pub/sub) | — | — | — |

---

## Schema de Eventos

> Para CADA evento, documente payload, versao e regra de idempotencia.

Todos os eventos seguem o envelope padrao abaixo. O campo `payload` varia por tipo de evento.

### FileUploaded

```json
{
  "eventId": "UUID",
  "type": "FileUploaded",
  "version": "1.0",
  "timestamp": "ISO8601",
  "source": "file-service",
  "payload": {
    "fileId": "UUID",
    "clusterId": "UUID",
    "memberId": "UUID",
    "originalName": "string",
    "mediaType": "photo | video | document",
    "mimeType": "string",
    "originalSize": "number (bytes)"
  }
}
```

**Idempotencia:** por eventId (UUID v4) — consumer descarta se eventId ja foi processado.

### ClusterRecovered

```json
{
  "eventId": "UUID",
  "type": "ClusterRecovered",
  "version": "1.0",
  "timestamp": "ISO8601",
  "source": "cluster-service",
  "payload": {
    "clusterId": "UUID",
    "recoveredBy": "UUID (memberId)",
    "nodesRestored": "number",
    "filesRestored": "number"
  }
}
```

**Idempotencia:** por eventId — recovery e operacao unica por tentativa.

### NodeLost

```json
{
  "eventId": "UUID",
  "type": "NodeLost",
  "version": "1.0",
  "timestamp": "ISO8601",
  "source": "scheduler-service",
  "payload": {
    "nodeId": "UUID",
    "clusterId": "UUID",
    "lastHeartbeat": "ISO8601",
    "chunksAffected": "number",
    "severity": "warning | critical"
  }
}
```

**Idempotencia:** por eventId + nodeId — nao dispara healing duplicado para o mesmo node.

### MemberJoined

```json
{
  "eventId": "UUID",
  "type": "MemberJoined",
  "version": "1.0",
  "timestamp": "ISO8601",
  "source": "member-service",
  "payload": {
    "memberId": "UUID",
    "clusterId": "UUID",
    "email": "string",
    "role": "admin | member",
    "invitedBy": "UUID (memberId)"
  }
}
```

**Idempotencia:** por eventId — convite aceito e processado uma unica vez.

### AlertCreated

```json
{
  "eventId": "UUID",
  "type": "AlertCreated",
  "version": "1.0",
  "timestamp": "ISO8601",
  "source": "health-service",
  "payload": {
    "alertId": "UUID",
    "clusterId": "UUID",
    "type": "node_lost | file_corrupted | replication_degraded | storage_full",
    "severity": "info | warning | critical",
    "message": "string",
    "metadata": "object (detalhes especificos do alerta)"
  }
}
```

**Idempotencia:** por eventId — alertas duplicados sao descartados no consumer.

---

## Workers Assincronos

> Quais workers processam filas? Documente concorrencia, timeout e retry.

| Worker | Fila | Funcao | Concorrencia | Timeout | Retry | DLQ |
| --- | --- | --- | --- | --- | --- | --- |
| PhotoWorker | media.photos | libvips resize WebP 1920px + gerar thumbnail + extrair EXIF + chunk + encrypt + distribute | 3 | 60s | 3x, backoff 2^n | media.dlq |
| VideoWorker | media.videos | FFmpeg 1080p H.265/AV1 + gerar preview 480p + extrair metadata + chunk + encrypt + distribute | 1 | 600s (10min) | 3x, backoff 2^n | media.dlq |
| EmailWorker | email.send | Enviar email via Resend SDK | 5 | 30s | 3x, linear 30s | email.send.dlq |
| AutoHealWorker | healing.process | Re-replicar chunks de node perdido para nodes saudaveis | 1 | 3600s (1h) | 5x, backoff 2^n | healing.dlq |

---

## Estrategia de Retry

> Como retries sao configurados?

| Estrategia | Descricao | Quando Usar |
| --- | --- | --- |
| Backoff exponencial | 1s, 2s, 4s, 8s, 16s... | Servicos externos (S3/R2/B2, APIs), workers de media |
| Backoff linear | 30s, 60s, 90s... | Email (Resend) |
| Imediato | Retry sem delay | Erros transientes de banco (deadlock, connection reset) |

**Dead Letter Queue:** Apos esgotar retries, o evento vai para a DLQ correspondente. Um alerta e gerado automaticamente (AlertCreated com severity=warning). A DLQ e revisada manualmente pelo admin via dashboard ou CLI.

---

## Cron Jobs / Scheduled Tasks

> Tarefas agendadas via @nestjs/schedule.

| Job | Frequencia | Funcao | Timeout |
| --- | --- | --- | --- |
| HeartbeatCheck | A cada 5 min | Encontrar nodes suspect/lost, atualizar status, emitir NodeSuspect/NodeLost | 60s |
| Scrubbing | Diario as 03:00 | Verificar lote de 1000 replicas de chunks (recalculo SHA-256) | 7200s (2h) |
| GarbageCollection | Diario as 04:00 | Encontrar e deletar chunks orfaos (reference_count = 0) | 3600s (1h) |
| CleanExpiredInvites | Diario as 05:00 | Deletar convites expirados | 60s |
| AlertCleanup | Semanal domingo 06:00 | Deletar alertas resolvidos com mais de 90 dias | 300s |

> (ver [13-integrations.md](13-integrations.md) para clients de APIs externas)
