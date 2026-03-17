# Observabilidade

Define como o frontend e monitorado em producao, incluindo error tracking, logging, metricas de performance e feature flags para rollout progressivo. Observabilidade permite identificar e resolver problemas antes que impactem os usuarios.

---

## Error Tracking

> Como erros do frontend sao capturados e reportados?

| Aspecto | Configuracao |
|---------|-------------|
| Ferramenta | {{Sentry / Datadog / Bugsnag}} |
| Ambiente | {{Production + Staging}} |
| Source Maps | {{Sim — upload no build}} |
| Alertas | {{Slack / Email / PagerDuty}} |
| Sample Rate | {{100% em producao}} |

> Erros capturados: exceptions nao tratadas, erros de API, erros de rendering, promise rejections.

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
});
```

</details>

---

## Logging Estruturado

> O frontend envia logs estruturados?

| Nivel | Quando Usar | Exemplo |
|-------|-------------|---------|
| Error | Excecoes, falhas de API | API retornou 500, rendering crash |
| Warn | Comportamento inesperado nao-fatal | Retry de request, fallback ativado |
| Info | Acoes do usuario (analytics) | Pagina visitada, feature usada |
| Debug | Desenvolvimento apenas | State changes, re-renders |

---

## Metricas de API

> Como monitoramos a saude das chamadas de API?

| Metrica | Meta | Alerta se |
|---------|------|-----------|
| Latencia p95 | {{< 500ms}} | {{> 1s por 5 min}} |
| Taxa de erro | {{< 1%}} | {{> 5% por 2 min}} |
| Timeout rate | {{< 0.1%}} | {{> 1% por 5 min}} |
| Disponibilidade | {{99.9%}} | {{< 99% por 10 min}} |

---

## User Flow Monitoring

> Monitoramos os fluxos criticos do usuario?

| Fluxo | Eventos Rastreados | Meta de Conclusao |
|-------|--------------------|--------------------|
| {{Onboarding}} | {{start, step_1, step_2, complete}} | {{80%+ completo}} |
| {{Checkout}} | {{cart_view, payment_start, payment_complete}} | {{90%+ sucesso}} |
| {{Login}} | {{form_view, submit, success/failure}} | {{95%+ sucesso}} |
| {{Feature principal}} | {{open, interact, complete}} | {{70%+ completo}} |

<!-- APPEND:flows -->

---

## Feature Flags

> Como funcionalidades sao liberadas progressivamente?

| Flag | Descricao | Status |
|------|-----------|--------|
| {{new-dashboard}} | {{Novo design do dashboard}} | {{10% rollout}} |
| {{ai-search}} | {{Busca com IA}} | {{Inativo}} |
| {{redesigned-checkout}} | {{Checkout redesenhado}} | {{Ativo para beta users}} |
| {{flag-adicional}} | {{Descricao}} | {{Status}} |

<!-- APPEND:flags -->

Ferramenta: {{LaunchDarkly / Unleash / Flagsmith / Custom}}

Fluxo: Feature flag → Avaliacao → Conditional rendering → Metricas → Decisao (manter/remover)

> Para metricas de performance, (ver 10-performance.md).

---

## Historico de Decisoes

| Data | Decisao | Motivo |
|------|---------|--------|
| {{YYYY-MM-DD}} | {{Decisao sobre observabilidade}} | {{Justificativa}} |
