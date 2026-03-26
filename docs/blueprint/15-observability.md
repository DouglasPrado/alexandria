# Observabilidade

> Se você não consegue observar, você não consegue operar. Defina como o sistema será monitorado.

---

## Logs

### Formato

Logs estruturados em JSON via `pino` + `nestjs-pino` com formatador JSON.

```json
{
  "timestamp": "2026-03-16T14:30:00.123Z",
  "level": "INFO",
  "service": "alexandria-orchestrator",
  "span": "upload_file",
  "trace_id": "abc123def456",
  "message": "File processed successfully",
  "context": {
    "membro_id": "uuid-...",
    "file_id": "uuid-...",
    "tipo_midia": "foto",
    "tamanho_otimizado": 450000,
    "chunks_count": 1,
    "duration_ms": 2340
  }
}
```

### Níveis de Log

| Nível | Quando usar                                                                                                                                    |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| DEBUG | Detalhes de chunking, hashing, consistent hashing ring — apenas em dev                                                                         |
| INFO  | Upload concluído, nó registrado, heartbeat recebido, recovery iniciado, scrubbing ciclo completo                                               |
| WARN  | Nó suspect (heartbeat atrasado), réplica não verificada há >7 dias, espaço >80%, token próximo de expirar                                      |
| ERROR | Pipeline falhou (FFmpeg erro), chunk corrompido detectado, transação PostgreSQL falhou, nó lost                                                |
| FATAL | Vault do membro não descriptografa (senha incorreta ou master key errada em recovery), PostgreSQL inacessível no startup, seed phrase inválida |

### Retenção

| Ambiente        | Tempo de retenção                                          |
| --------------- | ---------------------------------------------------------- |
| Produção        | 90 dias (Docker log rotation: max-size 100MB, max-file 10) |
| Desenvolvimento | 7 dias (stdout local)                                      |

> **Redaction obrigatória:** Seed phrase, master key, file keys, tokens OAuth e credenciais S3 NUNCA aparecem em logs, mesmo em DEBUG. Usar redaction paths do `pino` para omitir campos sensíveis.

### Eventos Críticos (sempre logados)

- Criação de cluster (seed gerada)
- Recovery iniciado/concluído
- Nó marcado como lost + auto-healing disparado
- Chunk corrompido detectado + reparado/irrecuperável
- Upload concluído (com métricas de tamanho e duração)
- Alerta gerado/resolvido
- Membro adicionado/removido
- Drain iniciado/concluído

---

## Métricas

### Golden Signals

| Métrica   | Descrição                                     | Threshold de Alerta                                      |
| --------- | --------------------------------------------- | -------------------------------------------------------- |
| Latência  | Tempo de resposta da API REST (p50, p95, p99) | p95 > 500ms → warn; p99 > 2s → error                     |
| Tráfego   | Requests por segundo ao orquestrador          | >100 req/s sustentado → warn (incomum para uso familiar) |
| Erros     | Taxa de respostas 5xx / total                 | >1% em janela de 5min → warn; >5% → error                |
| Saturação | CPU, memória, disco, conexões PostgreSQL      | CPU >85% → warn; >95% → error; disco >80% → warn         |

### Métricas Específicas do Alexandria

| Métrica                   | Descrição                                         | Threshold de Alerta                           |
| ------------------------- | ------------------------------------------------- | --------------------------------------------- |
| replication_health        | % de chunks com 3+ réplicas                       | <99% → warn; <95% → error                     |
| nodes_online              | Nós com status "online"                           | <3 → error (replicação mínima impossível)     |
| nodes_suspect             | Nós com status "suspect"                          | >0 → warn                                     |
| chunks_sub_replicated     | Chunks com <3 réplicas                            | >0 por >1h → error (auto-healing falhou)      |
| chunks_corrupted          | Chunks detectados como corrompidos pelo scrubbing | >0 → warn (reparado) ou error (irrecuperável) |
| pipeline_queue_depth      | Jobs pendentes na fila Redis                      | >100 → warn; >1000 → error                    |
| pipeline_duration_seconds | Tempo do pipeline por tipo de mídia               | foto >30s → warn; vídeo >10min → warn         |
| storage_usage_percent     | Uso de espaço por nó (%)                          | >80% → warn; >95% → error                     |
| scrubbing_last_run        | Tempo desde último scrubbing completo             | >7 dias → warn                                |
| heartbeat_latency_ms      | Latência dos heartbeats recebidos                 | >5s → warn (rede lenta)                       |

### Indicadores de Saúde

- replication_health >99% e nodes_online ≥3 → cluster saudável
- pipeline_queue_depth <10 e erros 5xx <0.1% → operação normal
- scrubbing_last_run <7 dias e chunks_corrupted = 0 → integridade OK

---

## Tracing Distribuído

> Fase 1: spans locais via `pino`. Fase 2: OpenTelemetry para tracing distribuído completo.

- **Ferramenta:** `pino` + `nestjs-pino` (Fase 1); OpenTelemetry + Jaeger/Tempo (Fase 2)
- **Protocolo de propagação:** W3C Trace Context (header `traceparent`) — preparado para Fase 2
- **Taxa de amostragem:** 100% na Fase 1 (volume baixo); 10% na Fase 2 se volume crescer

### Convenções de Spans

| Campo                  | Valor                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| service.name           | `alexandria-orchestrator`, `alexandria-node-agent`, `alexandria-web`                      |
| Atributos obrigatórios | `membro_id`, `cluster_id`, `file_id` (quando aplicável), `node_id` (para operações de nó) |
| Formato de Trace ID    | UUID v4 (gerado por pino)                                                                 |

### Spans Principais

| Span              | Componente   | O que rastreia                                             |
| ----------------- | ------------ | ---------------------------------------------------------- |
| `upload_file`     | Orquestrador | Request de upload até enfileirar job                       |
| `process_media`   | Media Worker | Pipeline completo: optimize → chunk → encrypt → distribute |
| `replicate_chunk` | Orquestrador | Envio de chunk para nó destino                             |
| `scrub_chunk`     | Scheduler    | Verificação de integridade de uma réplica                  |
| `auto_heal`       | Scheduler    | Re-replicação de chunks de nó lost                         |
| `recovery`        | Orquestrador | seed → vaults dos membros → rebuild completo               |
| `heartbeat`       | Agente de Nó | Envio e processamento de heartbeat                         |

---

## Alertas

| Alerta                                           | Severidade | Condição                                                     | Ação / Runbook                                                                          |
| ------------------------------------------------ | ---------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Chunk irrecuperável (todas réplicas corrompidas) | P1         | chunks_corrupted > 0 AND sem réplica saudável                | Investigar nós afetados; verificar logs de scrubbing; arquivo marcado como corrupted    |
| Recovery falhou                                  | P1         | recovery retorna erro                                        | Verificar seed phrase; verificar vaults dos membros nos nós; logs do orquestrador       |
| Replicação abaixo do mínimo por >2h              | P1         | replication_health <95% por >2h                              | Verificar auto-healing; verificar nós disponíveis; adicionar nós se necessário          |
| Nó lost (>1h sem heartbeat)                      | P2         | node.status = 'lost'                                         | Auto-healing automático; verificar se nó voltará online; considerar drain se permanente |
| Pipeline de mídia parado                         | P2         | pipeline_queue_depth crescendo + 0 jobs processados em 10min | Verificar Redis; verificar media workers; restart se necessário                         |
| Espaço do cluster >90%                           | P2         | storage_usage_percent >90% em qualquer nó                    | Adicionar nó/bucket; limpar chunks órfãos manualmente                                   |
| Nó suspect (>30min sem heartbeat)                | P3         | node.status = 'suspect'                                      | Monitorar; geralmente volta online sozinho                                              |
| Token OAuth próximo de expirar                   | P3         | token.expires_at < NOW() + 7 dias                            | Re-autenticar provedor cloud; atualizar vault do membro                                 |
| Scrubbing não executou em >7 dias                | P3         | scrubbing_last_run > 7 dias                                  | Verificar scheduler; executar manualmente se necessário                                 |
| Espaço do cluster >80%                           | P4         | storage_usage_percent >80%                                   | Planejar adição de nós; informativo                                                     |

### Severidades

| Severidade | Significado                                               | Tempo de resposta                    |
| ---------- | --------------------------------------------------------- | ------------------------------------ |
| P1         | Perda de dados real ou iminente; recovery falhou          | <1h (verificar imediatamente)        |
| P2         | Funcionalidade crítica degradada (upload parado, nó lost) | <4h (verificar no mesmo dia)         |
| P3         | Problema que requer atenção mas não impacta uso atual     | <24h (verificar no próximo dia útil) |
| P4         | Informativo; tendência que pode virar problema            | <1 semana (próxima manutenção)       |

### Política de Escalação

| Etapa | Tempo após disparo    | Responsável   | Canal de notificação                   |
| ----- | --------------------- | ------------- | -------------------------------------- |
| 1     | Imediato              | Douglas Prado | Alerta no Web Client (painel de admin) |
| 2     | 30 min (P1) / 4h (P2) | Douglas Prado | Push notification / e-mail             |
| 3     | 2h (P1) / 24h (P2)    | Douglas Prado | SMS (se configurado)                   |

> **Time de 1 pessoa:** sem escalação para outros. Em fase 2+ com mais famílias, considerar alertas via Telegram/WhatsApp bot.

---

## Dashboards

| Nome do Dashboard              | Público-alvo       | Métricas incluídas                                                                                              |
| ------------------------------ | ------------------ | --------------------------------------------------------------------------------------------------------------- |
| Saúde do Cluster               | Admin (Web Client) | nodes_online, replication_health, storage_usage_percent, alertas ativos, últimos uploads                        |
| Operacional (Grafana — Fase 2) | Tech Lead          | Golden Signals (latência, tráfego, erros, saturação), pipeline_queue_depth, heartbeat_latency, scrubbing status |
| Storage                        | Admin (Web Client) | Espaço total/usado por nó, distribuição de chunks, nós por tipo (local/s3/r2), trend de crescimento             |

---

## Health Checks

### Liveness

Verifica se o processo está rodando e respondendo. Caddy usa para decidir se deve reiniciar container.

- **Endpoint:** `GET /health/live`
- **Intervalo de verificação:** 30s
- **O que verifica:** Processo NestJS respondendo; sem deadlock

### Readiness

Verifica se o orquestrador está pronto para receber tráfego (dependências conectadas).

- **Endpoint:** `GET /health/ready`
- **Intervalo de verificação:** 30s
- **Dependências verificadas:** PostgreSQL 18 (ping), Redis 7 (ping), Vaults dos membros (desbloqueados)

### Resposta esperada

```json
{
  "status": "healthy",
  "checks": {
    "postgresql": "connected",
    "redis": "connected",
    "vaults": "unlocked",
    "scheduler": "running"
  },
  "version": "0.1.0",
  "uptime_seconds": 86400,
  "cluster": {
    "nodes_online": 5,
    "replication_health": 99.8,
    "files_total": 10523
  }
}
```

---

<!-- added: opensource -->

## Operational Transparency

- **Status page**: `{{status_url}}` — public uptime monitoring for demo/hosted instance
- **Incident communication**: public post-mortem published within 72h for any incident causing data access issues or >4h downtime; posted to GitHub Discussions and blog
- **Open metrics dashboard**: public Grafana Cloud dashboard showing aggregate opt-in telemetry — active clusters trend, replication health, upload volume (no PII)
- **Release notes**: every release includes full CHANGELOG with: what changed, breaking changes, migration guide, contributor credits
- **Security advisories**: published via GitHub Security Advisories with CVE when applicable; linked from SECURITY.md
