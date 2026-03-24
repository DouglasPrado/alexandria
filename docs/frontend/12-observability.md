# Observabilidade

Define como o frontend e monitorado em producao, incluindo error tracking, logging, metricas de performance e monitoramento de fluxos criticos. Observabilidade permite identificar e resolver problemas antes que impactem os usuarios.

<!-- do blueprint: 15-observability.md (logs, metricas, traces, alertas, dashboards) -->

> **Principio:** Sem SaaS externo para observabilidade (privacidade familiar). Metricas e erros sao enviados ao proprio orquestrador via endpoints dedicados. Nenhum dado sensivel (seed, tokens, PII) em logs ou telemetria.

---

## Error Tracking

> Como erros do frontend sao capturados e reportados?

| Aspecto | Configuracao |
|---------|-------------|
| Ferramenta | Error boundary React + endpoint proprio (`POST /api/errors`) |
| Ambiente | Producao apenas (dev usa console nativo) |
| Source Maps | Sim — upload no build; nao publicos (servidos apenas para o endpoint de erros) |
| Alertas | Alerta no painel admin (tabela alerts, severity: warning) |
| Sample Rate | 100% (volume baixo — 5-10 usuarios) |
| Redaction | Seed phrase, tokens JWT, credenciais NUNCA incluidos no payload de erro |

### Error Boundary global

```tsx
// shared/components/ErrorBoundary.tsx
'use client';

import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    reportError({
      type: 'react_error_boundary',
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <DefaultErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### Captura de erros globais

```typescript
// shared/lib/error-reporter.ts
interface FrontendError {
  type: 'unhandled_exception' | 'unhandled_rejection' | 'react_error_boundary' | 'api_error';
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

const ERROR_ENDPOINT = '/api/errors';
const ERROR_QUEUE: FrontendError[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

export function reportError(error: FrontendError) {
  // Redaction: nunca incluir dados sensiveis
  const sanitized = sanitizeError(error);
  ERROR_QUEUE.push(sanitized);

  // Batch: enviar a cada 5s ou quando acumular 10 erros
  if (!flushTimer) {
    flushTimer = setTimeout(flushErrors, 5000);
  }
  if (ERROR_QUEUE.length >= 10) {
    flushErrors();
  }
}

function flushErrors() {
  if (ERROR_QUEUE.length === 0) return;
  const batch = ERROR_QUEUE.splice(0);
  flushTimer = null;

  navigator.sendBeacon(ERROR_ENDPOINT, JSON.stringify(batch));
}

function sanitizeError(error: FrontendError): FrontendError {
  return {
    ...error,
    // Remover seed phrase, tokens, credenciais do stack/message
    message: redact(error.message),
    stack: error.stack ? redact(error.stack) : undefined,
  };
}

// Setup global
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    reportError({
      type: 'unhandled_exception',
      message: event.message,
      stack: event.error?.stack,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    reportError({
      type: 'unhandled_rejection',
      message: String(event.reason),
      stack: event.reason?.stack,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    });
  });
}
```

### Erros de API (interceptor)

```typescript
// Dentro do api-client.ts — reportar erros 5xx
if (response.status >= 500) {
  reportError({
    type: 'api_error',
    message: `API ${response.status}: ${path}`,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    context: { path, status: response.status, method: init.method ?? 'GET' },
  });
}
```

---

## Logging Estruturado

> O frontend envia logs estruturados?

<!-- do blueprint: 15-observability.md (niveis de log, redaction) -->

| Nivel | Quando Usar | Exemplo no Alexandria | Enviado ao backend? |
|-------|-------------|----------------------|---------------------|
| Error | Excecoes, falhas de API 5xx, rendering crash | Pipeline falhou (status error), download corrompido | Sim (via reportError) |
| Warn | Comportamento inesperado nao-fatal | Retry de upload, token proximo de expirar, no suspect | Sim (via reportError) |
| Info | Acoes do usuario (analytics leve) | Upload concluido, download iniciado, filtro alterado | Nao (apenas console em dev) |
| Debug | Desenvolvimento apenas | State changes, query keys, cache hits | Nao (console.log em dev) |

### Regras de logging

- **Producao:** Apenas Error e Warn sao enviados ao backend. Info e Debug sao silenciados.
- **Desenvolvimento:** Todos os niveis no console do browser.
- **Redaction obrigatoria:** Seed phrase, master key, tokens JWT, credenciais S3, senhas NUNCA em logs — mesmo em Debug.

```typescript
// shared/lib/logger.ts
const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  debug: (...args: unknown[]) => { if (isDev) console.debug('[DEBUG]', ...args); },
  info: (...args: unknown[]) => { if (isDev) console.info('[INFO]', ...args); },
  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn('[WARN]', message, context);
    if (!isDev) reportError({ type: 'api_error', message, url: location.href, timestamp: new Date().toISOString(), context });
  },
  error: (message: string, error?: Error, context?: Record<string, unknown>) => {
    console.error('[ERROR]', message, error, context);
    if (!isDev) reportError({ type: 'unhandled_exception', message, stack: error?.stack, url: location.href, timestamp: new Date().toISOString(), context });
  },
};
```

---

## Metricas de API

> Como monitoramos a saude das chamadas de API?

<!-- do blueprint: 15-observability.md (Golden Signals) + 03-requirements.md (latencia p95 < 500ms) -->

| Metrica | Meta | Alerta se | Acao |
|---------|------|-----------|------|
| Latencia p95 | < 500ms | > 1s por 5 min | Investigar queries lentas; verificar cache |
| Taxa de erro (5xx) | < 1% | > 5% por 2 min | Verificar logs do orquestrador; possivel deploy com bug |
| Taxa de erro (4xx) | < 5% | > 10% por 5 min | Possivel problema de auth (tokens expirados em massa) |
| Timeout rate | < 0.5% | > 2% por 5 min | Verificar rede; verificar orquestrador |
| Disponibilidade | > 99.5% | < 99% por 10 min | Verificar VPS; considerar restart |

### Coleta de metricas via api-client

```typescript
// shared/lib/api-client.ts — instrumentacao
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const start = performance.now();
  const requestId = crypto.randomUUID();

  try {
    const response = await fetchWithRetry(/* ... */);
    const duration = performance.now() - start;

    // Enviar metrica de latencia
    reportMetric({
      name: 'api_request',
      path,
      method: options.method ?? 'GET',
      status: response.status,
      duration_ms: Math.round(duration),
      request_id: requestId,
    });

    return response.json();
  } catch (error) {
    const duration = performance.now() - start;
    reportMetric({
      name: 'api_request',
      path,
      method: options.method ?? 'GET',
      status: 0, // network error
      duration_ms: Math.round(duration),
      request_id: requestId,
      error: true,
    });
    throw error;
  }
}
```

### Envio de metricas (batched)

```typescript
// shared/lib/metrics.ts
interface ApiMetric {
  name: string;
  path: string;
  method: string;
  status: number;
  duration_ms: number;
  request_id: string;
  error?: boolean;
}

const METRICS_QUEUE: ApiMetric[] = [];

export function reportMetric(metric: ApiMetric) {
  METRICS_QUEUE.push(metric);
}

// Flush a cada 30s via sendBeacon
setInterval(() => {
  if (METRICS_QUEUE.length === 0) return;
  const batch = METRICS_QUEUE.splice(0);
  navigator.sendBeacon('/api/metrics', JSON.stringify(batch));
}, 30_000);
```

---

## Web Vitals (RUM)

> Como coletamos metricas de performance reais dos usuarios?

<!-- do blueprint: 10-performance.md (web-vitals) -->

| Metrica | Meta | Alerta se |
|---------|------|-----------|
| LCP | < 2.0s | > 3.0s (media movel 7 dias) |
| INP | < 150ms | > 300ms (media movel 7 dias) |
| CLS | < 0.05 | > 0.15 (media movel 7 dias) |
| FCP | < 1.2s | > 2.0s (media movel 7 dias) |
| TTFB | < 500ms | > 1.0s (media movel 7 dias) |

```typescript
// shared/lib/vitals.ts
import { onLCP, onINP, onCLS, onFCP, onTTFB } from 'web-vitals';

function sendVital(metric: { name: string; value: number; id: string; rating: string }) {
  navigator.sendBeacon('/api/vitals', JSON.stringify({
    name: metric.name,
    value: Math.round(metric.value),
    rating: metric.rating, // 'good', 'needs-improvement', 'poor'
    page: window.location.pathname,
    timestamp: new Date().toISOString(),
  }));
}

onLCP(sendVital);
onINP(sendVital);
onCLS(sendVital);
onFCP(sendVital);
onTTFB(sendVital);
```

---

## User Flow Monitoring

> Monitoramos os fluxos criticos do usuario?

<!-- do blueprint: 08-use_cases.md (UC-001 a UC-010) + 07-critical_flows.md -->

| Fluxo | Eventos Rastreados | Meta de Conclusao | Alerta se |
|-------|--------------------|--------------------|-----------|
| Criar Cluster | setup_start → name_entered → seed_displayed → seed_confirmed → cluster_active | 100% (executado uma vez) | seed_confirmed nao ocorre em 10min |
| Upload de Arquivo | upload_start → file_selected → upload_progress → processing → ready | > 95% sucesso | > 5% error em 1h |
| Galeria e Download | gallery_view → file_click → preview_loaded → download_start → download_complete | > 90% preview loaded | preview_loaded < 80% (previews indisponiveis) |
| Recovery | recovery_start → seed_entered → seed_validated → vaults_found → rebuild_progress → recovery_complete | 100% (critico) | recovery_complete nao ocorre em 3h |
| Convidar Membro | invite_start → email_entered → invite_created → link_copied | > 90% link_copied | invite_created com erro > 10% |

<!-- APPEND:flows -->

### Implementacao

```typescript
// shared/lib/flow-tracker.ts
type FlowEvent = {
  flow: string;
  step: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

const FLOW_EVENTS: FlowEvent[] = [];

export function trackFlow(flow: string, step: string, metadata?: Record<string, unknown>) {
  FLOW_EVENTS.push({
    flow,
    step,
    timestamp: new Date().toISOString(),
    metadata,
  });
}

// Flush junto com metricas (a cada 30s)
// Exemplo de uso:
// trackFlow('upload', 'file_selected', { count: 3, totalSize: 15_000_000 });
// trackFlow('upload', 'ready', { fileId: 'uuid-...' });
```

---

## Feature Flags

> Como funcionalidades sao liberadas progressivamente?

<!-- do blueprint: 02-architecture_principles.md (Simplicidade Operacional) -->

- [x] Sem ferramenta externa (simplicidade operacional)
- Flags gerenciadas via variavel de ambiente `NEXT_PUBLIC_FLAGS`

| Flag | Descricao | Status | Fase |
|------|-----------|--------|------|
| `timeline_view` | Navegacao cronologica na galeria | Ativo | Fase 1 |
| `video_preview` | Player de video 480p no preview | Ativo | Fase 1 |
| `exif_search` | Busca por metadata EXIF (data, GPS, camera) | Inativo | Fase 2 |
| `face_recognition` | Agrupamento por reconhecimento facial | Inativo | Fase 3 |
| `p2p_mode` | Rede peer-to-peer sem orquestrador | Inativo | Won't (v1) |

<!-- APPEND:flags -->

### Implementacao

```typescript
// shared/lib/feature-flags.ts
type FeatureFlag = 'timeline_view' | 'video_preview' | 'exif_search' | 'face_recognition' | 'p2p_mode';

const FLAGS: Record<FeatureFlag, boolean> = {
  timeline_view: true,
  video_preview: true,
  exif_search: false,
  face_recognition: false,
  p2p_mode: false,
};

// Override via env var (JSON): NEXT_PUBLIC_FLAGS='{"exif_search":true}'
if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_FLAGS) {
  try {
    Object.assign(FLAGS, JSON.parse(process.env.NEXT_PUBLIC_FLAGS));
  } catch { /* ignore parse errors */ }
}

export function isEnabled(flag: FeatureFlag): boolean {
  return FLAGS[flag] ?? false;
}

// Uso no componente:
// if (isEnabled('timeline_view')) return <TimelineView />;
```

> Para metricas de performance, (ver 10-performance.md).

---

## Endpoints de Observabilidade (BFF)

> Quais Route Handlers recebem dados de observabilidade do frontend?

| Endpoint | Metodo | Payload | Destino |
|----------|--------|---------|---------|
| /api/errors | POST | Batch de FrontendError[] | Log estruturado no orquestrador (pino) |
| /api/metrics | POST | Batch de ApiMetric[] | Metricas do orquestrador (futuro: Prometheus) |
| /api/vitals | POST | Web Vital individual | Log estruturado (futuro: dashboard Grafana) |

- Todos usam `navigator.sendBeacon` (nao bloqueia navegacao)
- Batch de ate 50 itens por request
- Sem autenticacao (fire-and-forget; rate limited por IP)
- Dados nao contem PII (redaction no frontend)

---

## Historico de Decisoes

| Data | Decisao | Motivo |
|------|---------|--------|
| 2026-03-23 | Sem Sentry/Datadog (error tracking proprio) | Privacidade familiar — nenhum dado enviado a terceiros; volume baixo (5-10 usuarios) nao justifica SaaS |
| 2026-03-23 | sendBeacon para metricas e erros | Non-blocking; funciona mesmo se usuario fecha aba; batching reduz requests |
| 2026-03-23 | Feature flags via env var (sem LaunchDarkly) | Simplicidade operacional; 1 dev, sem necessidade de rollout A/B para 10 usuarios |
| 2026-03-23 | Redaction obrigatoria em todos os reporters | Seed phrase e credenciais nunca devem aparecer em logs/telemetria — principio Zero-Knowledge |
| 2026-03-23 | Web Vitals com rating (good/needs-improvement/poor) | Permite filtrar rapidamente metricas problematicas sem dashboard complexo |
