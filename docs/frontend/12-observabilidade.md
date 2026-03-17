# Observabilidade

Define como o frontend e monitorado em producao, incluindo error tracking, logging, metricas de performance e feature flags para rollout progressivo. Observabilidade permite identificar e resolver problemas antes que impactem os usuarios.

---

## Error Tracking

> Como erros do frontend sao capturados e reportados?

| Aspecto | Configuracao |
|---------|-------------|
| Ferramenta | Sentry (self-hosted ou cloud) |
| Ambiente | Production + Staging |
| Source Maps | Sim — upload automatico no build via `@sentry/nextjs` |
| Alertas | Slack (canal `#alexandria-alerts`) + Email para admin familiar |
| Sample Rate | 100% errors em producao, 10% traces para performance |

> Erros capturados: exceptions nao tratadas, erros de API do orquestrador, erros de rendering, promise rejections, falhas de Web Crypto API, falhas de Web Workers (encrypt/hash/resize).

<details>
<summary>Exemplo — Configuracao do Sentry com Next.js</summary>

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration(),
    Sentry.browserTracingIntegration(),
  ],
  beforeSend(event) {
    // Nunca enviar dados sensiveis (tokens, seed phrase, chaves)
    if (event.extra) {
      delete event.extra['seedPhrase'];
      delete event.extra['encryptionKey'];
      delete event.extra['oauthToken'];
    }
    return event;
  },
});
```

</details>

**Contexto adicional por erro:**

| Contexto | Como capturado | Exemplo |
|----------|----------------|---------|
| Usuario | `Sentry.setUser({ id: memberId, role })` | `{ id: 'member_abc', role: 'admin' }` |
| Feature | `Sentry.setTag('feature', featureName)` | `gallery`, `upload`, `recovery` |
| Cluster | `Sentry.setContext('cluster', { id, nodeCount })` | Estado do cluster no momento do erro |
| Upload pipeline | `Sentry.addBreadcrumb()` em cada etapa | resize → encrypt → chunk → distribute |

<!-- inferido do PRD -->

---

## Logging Estruturado

> O frontend envia logs estruturados?

| Nivel | Quando Usar | Exemplo |
|-------|-------------|---------|
| Error | Excecoes, falhas de API do orquestrador, falhas de criptografia | API retornou 500, Web Crypto falhou, chunk corrompido detectado |
| Warn | Comportamento inesperado nao-fatal | Retry de request ao orquestrador, fallback de thumbnail, no reportou heartbeat atrasado |
| Info | Acoes do usuario e eventos de sistema | Upload concluido, no conectado, recovery iniciado, membro convidado |
| Debug | Desenvolvimento apenas (desabilitado em producao) | State changes do Zustand, re-renders, cache hits/misses do TanStack Query |

**Estrategia de envio:**

| Aspecto | Configuracao |
|---------|-------------|
| Transporte | Logs Error/Warn enviados ao Sentry como breadcrumbs; logs Info enviados ao orquestrador via endpoint `/api/telemetry` | <!-- inferido do PRD -->
| Batching | Logs acumulados em buffer local e enviados a cada 30s ou quando buffer atinge 50 entradas |
| Offline | Logs persistidos em IndexedDB quando offline; enviados ao reconectar |
| Privacidade | Logs NUNCA incluem conteudo de arquivos, chaves de criptografia, tokens OAuth ou seed phrases |
| Formato | JSON estruturado com campos: `timestamp`, `level`, `feature`, `action`, `memberId`, `metadata` |

<details>
<summary>Exemplo — Logger estruturado</summary>

```typescript
// lib/logger.ts
type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  feature: string;
  action: string;
  memberId?: string;
  metadata?: Record<string, unknown>;
}

export function createLogger(feature: string) {
  return {
    info: (action: string, metadata?: Record<string, unknown>) =>
      log({ level: 'info', feature, action, metadata }),
    warn: (action: string, metadata?: Record<string, unknown>) =>
      log({ level: 'warn', feature, action, metadata }),
    error: (action: string, metadata?: Record<string, unknown>) =>
      log({ level: 'error', feature, action, metadata }),
  };
}

// Uso:
// const logger = createLogger('upload');
// logger.info('pipeline:complete', { fileId, chunks: 5, duration: 1200 });
```

</details>

---

## Metricas de API

> Como monitoramos a saude das chamadas de API?

| Metrica | Meta | Alerta se |
|---------|------|-----------|
| Latencia p95 | < 500ms | > 1s por 5 min | <!-- alinhado com RNF do PRD: p95 < 500ms -->
| Taxa de erro | < 1% | > 5% por 2 min |
| Timeout rate | < 0.1% | > 1% por 5 min |
| Disponibilidade | 99.5% | < 99% por 10 min | <!-- alinhado com RNF-002 do PRD -->

**Endpoints criticos monitorados:**

| Endpoint | Dominio | SLA esperado | Observacao |
|----------|---------|--------------|------------|
| `GET /api/gallery` | gallery | p95 < 300ms | Paginado, cache agressivo via TanStack Query |
| `POST /api/upload/init` | upload | p95 < 500ms | Inicia pipeline de upload |
| `GET /api/nodes/health` | health | p95 < 200ms | Polling a cada 30s (staleTime do TanStack Query) |
| `GET /api/cluster/status` | cluster | p95 < 300ms | Estado geral do cluster |
| `POST /api/recovery/validate` | recovery | p95 < 1s | Validacao de seed phrase (operacao rara) |

<!-- inferido do PRD -->

**Implementacao:** Interceptor no API client (Infrastructure Layer) que mede `performance.now()` em cada request e reporta via `Sentry.metrics` ou endpoint de telemetria.

---

## User Flow Monitoring

> Monitoramos os fluxos criticos do usuario?

| Fluxo | Eventos Rastreados | Meta de Conclusao |
|-------|--------------------|--------------------|
| Upload de foto/video | `upload:start`, `upload:resize`, `upload:encrypt`, `upload:chunk`, `upload:distribute`, `upload:complete` | 95%+ completo sem erro | <!-- RF-023 a RF-028 -->
| Recovery via seed phrase | `recovery:start`, `recovery:seed_input`, `recovery:validate`, `recovery:reconstruct`, `recovery:complete` | 100% sucesso (fluxo critico) | <!-- RF-047 a RF-050 -->
| Onboarding (criar cluster) | `cluster:create`, `cluster:seed_generated`, `cluster:first_node`, `cluster:first_upload` | 90%+ completo |
| Navegacao na galeria | `gallery:open`, `gallery:scroll`, `gallery:search`, `gallery:download` | 80%+ interacao apos abertura |
| Conexao de no cloud | `node:oauth_start`, `node:oauth_callback`, `node:register`, `node:first_sync` | 85%+ completo | <!-- RF-016 a RF-019 -->

<!-- APPEND:flows -->

**Alertas por fluxo:**

| Condicao | Alerta | Destinatario |
|----------|--------|--------------|
| Upload falha em > 10% das tentativas por 15 min | Critico | Admin familiar via Slack |
| Recovery nao completa em < 2h | Critico | Admin familiar via Slack + Email | <!-- alinhado com OBJ-02 -->
| Galeria com latencia > 3s para carregar thumbnails | Warning | Log interno |
| OAuth callback falha > 3x consecutivas | Critico | Admin familiar via Slack | <!-- RF-020 -->

---

## Feature Flags

> Como funcionalidades sao liberadas progressivamente?

| Flag | Descricao | Status |
|------|-----------|--------|
| `dedup-global` | Deduplicacao global de chunks entre membros | Inativo (fase 2) | <!-- PRD fase 2 -->
| `tiered-storage` | Classificacao de nos em hot/warm/cold | Inativo (fase 2) |
| `smart-search` | Busca por metadados EXIF, rostos, OCR | Inativo (fase 3) |
| `erasure-coding` | Erasure coding em vez de replicacao pura | Inativo (fase 3) |
| `desktop-tauri` | Cliente desktop via Tauri | Inativo (fase 2) |
| `video-av1` | Transcodificacao de video para AV1 | 10% rollout (beta) |

<!-- APPEND:flags -->

Ferramenta: Unleash (self-hosted) — alinhado com a filosofia de auto-hospedagem do Alexandria <!-- inferido do PRD -->

Fluxo: Feature flag → Avaliacao → Conditional rendering → Metricas → Decisao (manter/remover)

**Integracao com observabilidade:**

| Aspecto | Como funciona |
|---------|---------------|
| Metricas por flag | Cada flag ativa registra metricas separadas (erro, latencia, uso) para comparacao A/B |
| Rollback automatico | Se taxa de erro aumenta > 2x com flag ativa, rollback automatico para versao anterior |
| Contexto no Sentry | Flags ativas incluidas como tags em eventos do Sentry para correlacao |
| Logging | Ativacao/desativacao de flags registrada como evento Info no logger |

> Para metricas de performance, (ver [10-performance.md](10-performance.md)).

---

## Historico de Decisoes

| Data | Decisao | Motivo |
|------|---------|--------|
| 2026-03-17 | Sentry como ferramenta de error tracking | Self-hostable, integracao nativa com Next.js, Session Replay para debugging de UX |
| 2026-03-17 | Unleash para feature flags | Self-hosted alinhado com filosofia do projeto; API simples; SDK para React |
| 2026-03-17 | Logs nunca incluem dados sensiveis | Zero-knowledge e privacidade sao principios fundamentais do Alexandria (PRD 3.3) |
| 2026-03-17 | Telemetria via endpoint do orquestrador | Evita dependencia de servico externo adicional; dados ficam no controle da familia |
