# Observabilidade

Define como o frontend web (Next.js 16) é monitorado em produção, incluindo error tracking, logging, métricas de performance e feature flags para rollout progressivo. Observabilidade permite identificar e resolver problemas antes que impactem os usuários.

<!-- do blueprint: 15-observability.md (logs, métricas, traces, alertas) -->

---

## Error Tracking

> Como erros do frontend são capturados e reportados?

| Aspecto              | Configuração                                    |
| -------------------- | ----------------------------------------------- |
| Ferramenta           | Sentry (`@sentry/nextjs`)                       |
| Ambiente             | Production                                      |
| Source Maps          | Sim — upload automático no build via Sentry CLI |
| Alertas              | Email para admin (Douglas Prado)                |
| Sample Rate (errors) | 100% — volume baixo (5-10 usuários familiares)  |
| Sample Rate (traces) | 10%                                             |
| Session Replay       | 1% normal, 100% em sessões com erro             |

### Erros Capturados

| Categoria                 | Exemplo                                       | Severidade |
| ------------------------- | --------------------------------------------- | ---------- |
| Unhandled exceptions      | Erro de rendering, TypeError, ReferenceError  | Error      |
| Promise rejections        | Fetch falhou, timeout de API                  | Error      |
| API errors (5xx)          | Orquestrador retornou 500                     | Error      |
| API errors (4xx críticos) | 401 (sessão expirada), 403 (permissão negada) | Warning    |
| Upload failures           | Pipeline falhou, nós insuficientes (503)      | Error      |
| Recovery failures         | Seed inválida, vaults não encontrados         | Critical   |

### Contexto Enviado ao Sentry

```typescript
Sentry.setUser({ id: member.id, role: member.role });
Sentry.setTag('cluster_id', clusterId);
Sentry.setContext('page', { route: pathname, searchParams });
// NUNCA enviar: token JWT, seed phrase, nomes de arquivos, conteúdo de fotos
```

<details>
<summary>Exemplo — Configuração do Sentry com Next.js</summary>

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
    Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
    Sentry.browserTracingIntegration(),
  ],
  beforeSend(event) {
    // Redact dados sensíveis
    if (event.request?.cookies) delete event.request.cookies;
    return event;
  },
});
```

</details>

---

## Logging Estruturado

> O frontend envia logs estruturados via console (capturados pelo Sentry breadcrumbs).

| Nível | Quando Usar                            | Exemplo                                                           | Capturado pelo Sentry  |
| ----- | -------------------------------------- | ----------------------------------------------------------------- | ---------------------- |
| Error | Exceções, falhas de API irrecuperáveis | Upload falhou após 3 retries, recovery seed inválida              | Sim (como evento)      |
| Warn  | Comportamento inesperado não-fatal     | Retry de request, fallback ativado, JWT próximo de expirar        | Sim (como breadcrumb)  |
| Info  | Ações do usuário para auditoria        | Upload iniciado, arquivo baixado, nó adicionado, alerta resolvido | Sim (como breadcrumb)  |
| Debug | Desenvolvimento apenas                 | State changes, re-renders, cache hits/misses                      | Não (stripped em prod) |

### Eventos de Auditoria (Frontend → Backend)

O frontend não envia logs diretamente — ações do usuário são auditadas pelo orquestrador ao processar requests:

| Ação            | Endpoint                  | Log no Backend                                       |
| --------------- | ------------------------- | ---------------------------------------------------- |
| Login           | POST /auth/login          | `member_login { member_id, ip }`                     |
| Upload          | POST /files/upload        | `file_upload_started { member_id, file_name, size }` |
| Download        | GET /files/:id/download   | `file_download { member_id, file_id }`               |
| Convite         | POST /clusters/:id/invite | `member_invited { admin_id, email, role }`           |
| Resolver alerta | PATCH /alerts/:id         | `alert_resolved { admin_id, alert_id }`              |

---

## Métricas de API (Client-Side)

> Como chamadas de API são monitoradas no frontend?

| Métrica                      | Meta    | Alerta se      |
| ---------------------------- | ------- | -------------- |
| Latência p95 (galeria)       | < 500ms | > 1s por 5 min |
| Latência p95 (upload aceite) | < 500ms | > 2s           |
| Taxa de erro (5xx)           | < 1%    | > 5% por 2 min |
| Taxa de timeout              | < 0.1%  | > 1% por 5 min |

### Implementação

Métricas coletadas via interceptor no fetch wrapper (`lib/api-client.ts`):

```typescript
// lib/api-client.ts
async function fetchWithMetrics(url: string, options: RequestInit) {
  const start = performance.now();
  try {
    const response = await fetch(url, options);
    const duration = performance.now() - start;

    // Sentry performance span
    Sentry.metrics.distribution('api.duration', duration, {
      unit: 'millisecond',
      tags: { endpoint: url, status: String(response.status) },
    });

    if (!response.ok && response.status >= 500) {
      Sentry.metrics.increment('api.error', 1, {
        tags: { endpoint: url, status: String(response.status) },
      });
    }

    return response;
  } catch (error) {
    Sentry.metrics.increment('api.error', 1, { tags: { endpoint: url, type: 'network' } });
    throw error;
  }
}
```

---

## Web Vitals (RUM)

> Métricas reais de usuários coletadas continuamente em produção.

| Métrica | Meta    | Ferramenta            |
| ------- | ------- | --------------------- |
| LCP     | < 2.5s  | `web-vitals` → Sentry |
| INP     | < 200ms | `web-vitals` → Sentry |
| CLS     | < 0.1   | `web-vitals` → Sentry |
| TTFB    | < 800ms | `web-vitals` → Sentry |
| FCP     | < 1.8s  | `web-vitals` → Sentry |

```typescript
// app/layout.tsx (reportWebVitals)
export function reportWebVitals(metric: NextWebVitalsMetric) {
  Sentry.metrics.distribution(metric.name, metric.value, {
    unit: metric.name === 'CLS' ? '' : 'millisecond',
    tags: { route: window.location.pathname },
  });
}
```

---

## User Flow Monitoring

> Monitoramos os fluxos críticos do usuário via Sentry breadcrumbs e custom spans.

<!-- do blueprint: 07-critical_flows.md (5 fluxos) -->

| Fluxo              | Eventos Rastreados                                                                                                               | Meta de Conclusão              |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Criação de Cluster | `setup:start` → `setup:name_submitted` → `setup:seed_displayed` → `setup:seed_confirmed` → `setup:complete`                      | 95%+ completo (admin motivado) |
| Upload de Arquivo  | `upload:files_selected` → `upload:started` → `upload:progress` → `upload:processing` → `upload:done` / `upload:error`            | 90%+ sucesso                   |
| Visualizar Galeria | `gallery:loaded` → `gallery:thumbnail_clicked` → `lightbox:opened` → `lightbox:download` / `lightbox:closed`                     | 100% da galeria carrega        |
| Convite de Membro  | `invite:modal_opened` → `invite:submitted` → `invite:link_copied` → (membro aceita) → `invite:accepted`                          | 80%+ aceite                    |
| Recovery           | `recovery:start` → `recovery:seed_entered` → `recovery:validating` → `recovery:step_X` → `recovery:complete` / `recovery:failed` | 100% sucesso (se seed correta) |

<!-- APPEND:flows -->

### Detecção de Abandono

| Fluxo    | Ponto de Abandono Esperado                | Ação se Alto Abandono                          |
| -------- | ----------------------------------------- | ---------------------------------------------- |
| Setup    | `seed_displayed` (admin hesita em anotar) | Melhorar UX da tela de seed; adicionar dicas   |
| Upload   | `upload:error` (retries esgotados)        | Investigar causa (nós insuficientes, rede)     |
| Recovery | `recovery:seed_entered` (seed incorreta)  | Melhorar validação inline; autocomplete BIP-39 |

---

## Feature Flags

> Como funcionalidades são liberadas progressivamente?

- **Ferramenta:** Implementação customizada via config JSON no orquestrador (sem serviço externo na v1)
- **Avaliação:** Server-side (RSC lê config do orquestrador) + client-side (Zustand `featureFlagsStore`)

| Flag                    | Descrição                                        | Status           |
| ----------------------- | ------------------------------------------------ | ---------------- |
| `gallery_timeline_view` | Visualização por timeline (mês/ano) na galeria   | Ativo            |
| `upload_auto_retry`     | Retry automático de uploads falhos com backoff   | Ativo            |
| `search_exif`           | Busca por metadados EXIF (GPS, câmera)           | Inativo (Fase 2) |
| `dedup_notification`    | Notificar membro quando upload detecta duplicata | Inativo (Fase 2) |
| `video_player_native`   | Player de vídeo nativo em vez de preview 480p    | Inativo (Fase 2) |

<!-- APPEND:flags -->

### Fluxo de Feature Flags

```
1. Admin configura flag no orquestrador (API ou config file)
2. Frontend consulta GET /config/flags (cache 60s via TanStack Query)
3. Server Component lê flags e renderiza condicionalmente
4. Client Component lê flags via featureFlagsStore (Zustand)
5. Métricas coletadas por flag (uso, erros, performance)
6. Decisão: manter (remover flag) ou reverter (desativar)
```

> Para métricas de performance, (ver [10-performance.md](10-performance.md)).

---

## Histórico de Decisões

| Data       | Decisão                                           | Motivo                                                                                              |
| ---------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 2026-03-24 | Sentry para error tracking + RUM                  | Solução integrada (errors + performance + replay); free tier suficiente para 5-10 usuários          |
| 2026-03-24 | Session Replay com mask/block                     | Fotos familiares são sensíveis; mask all text + block all media impede exposição                    |
| 2026-03-24 | Feature flags customizadas em vez de LaunchDarkly | Simplicidade; 5-10 usuários não justifica serviço externo; config JSON no orquestrador suficiente   |
| 2026-03-24 | Logs de auditoria no backend, não no frontend     | Frontend não é confiável para auditoria (pode ser manipulado); orquestrador registra todas as ações |
| 2026-03-24 | web-vitals → Sentry (não analytics separado)      | Centralizar observabilidade em um único serviço; Sentry suporta métricas customizadas               |
