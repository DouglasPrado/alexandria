# Observabilidade

Define como o app mobile e monitorado em producao, incluindo crash reporting, error tracking, analytics, performance monitoring e OTA updates. Observabilidade permite identificar e resolver problemas antes que impactem os usuarios e acompanhar a saude do app em tempo real.

---

## Crash Reporting e Error Tracking

> Como erros e crashes do app sao capturados e reportados?

| Aspecto | Configuracao |
|---------|-------------|
| Ferramenta principal | {{Sentry React Native / Firebase Crashlytics}} |
| Ferramenta secundaria | {{Crashlytics para crash nativo / Sentry para JS}} |
| Ambiente | {{Production + Staging}} |
| Source Maps | {{Sim — upload no build via EAS}} |
| dSYMs (iOS) | {{Upload automatico no build}} |
| ProGuard mapping (Android) | {{Upload automatico no build}} |
| Alertas | {{Slack / Email / PagerDuty}} |
| Sample Rate | {{100% crashes, 10% traces}} |

> Erros capturados: crashes nativos (iOS/Android), exceptions JS nao tratadas, erros de API, promise rejections, erros de navegacao.

<details>
<summary>Exemplo — Configuracao do Sentry React Native</summary>

```typescript
// app/_layout.tsx
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: process.env.EXPO_PUBLIC_ENV,
  tracesSampleRate: 0.1,
  enableAutoSessionTracking: true,
  sessionTrackingIntervalMillis: 30000,
  integrations: [
    Sentry.reactNativeTracingIntegration(),
  ],
  beforeSend(event) {
    // Filtrar dados sensiveis
    return event;
  },
});

export default Sentry.wrap(RootLayout);
```

</details>

---

## App Analytics

> Como o comportamento do usuario e rastreado?

| Ferramenta | Proposito | Eventos Rastreados |
|------------|-----------|-------------------|
| {{Firebase Analytics}} | Analytics principal | Screen views, acoes do usuario, conversoes |
| {{Mixpanel / Amplitude}} | Product analytics | Funis, retencao, cohorts |
| {{Sentry}} | Error analytics | Crashes, erros, performance |

| Evento | Parametros | Quando Dispara |
|--------|-----------|----------------|
| `screen_view` | `screen_name`, `screen_class` | Navegacao entre telas |
| `login` | `method` (email, biometric, oauth) | Login com sucesso |
| `sign_up` | `method` | Cadastro completo |
| `purchase` | `item_id`, `value`, `currency` | Compra/assinatura |
| {{evento_custom}} | {{parametros}} | {{quando}} |

---

## Logging Estruturado

> O app envia logs estruturados?

| Nivel | Quando Usar | Exemplo |
|-------|-------------|---------|
| Fatal | Crash nativo ou JS | App crash, uncaught exception |
| Error | Excecoes, falhas de API | API retornou 500, rendering crash |
| Warn | Comportamento inesperado nao-fatal | Retry de request, fallback ativado |
| Info | Acoes do usuario (analytics) | Tela visitada, feature usada |
| Debug | Desenvolvimento apenas | State changes, re-renders |

> **Regra:** Nunca logar dados sensiveis (tokens, senhas, dados pessoais) mesmo em nivel Debug.

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

## Performance Monitoring

> Como monitoramos performance do app em producao?

| Metrica | Ferramenta | Meta |
|---------|-----------|------|
| App Startup Time | {{Sentry / Firebase Performance}} | {{< 2s cold start}} |
| Slow Frames | {{Firebase Performance}} | {{< 5% do total}} |
| Frozen Frames | {{Firebase Performance}} | {{< 1% do total}} |
| Memory Usage | {{Sentry}} | {{< 200MB medio}} |
| Network Latency | {{Sentry / Firebase}} | {{p95 < 500ms}} |

---

## OTA Updates Monitoring

> Como monitoramos atualizacoes Over-The-Air?

| Aspecto | Configuracao |
|---------|-------------|
| Ferramenta | {{Expo Updates / CodePush}} |
| Rollout | {{Progressivo: 10% -> 50% -> 100%}} |
| Rollback automatico | {{Se crash rate > 2% apos update}} |
| Metricas | {{Taxa de sucesso, tempo de download, crashes pos-update}} |

| Metrica | Meta | Alerta se |
|---------|------|-----------|
| Update success rate | {{> 99%}} | {{< 95%}} |
| Download time | {{< 5s}} | {{> 15s medio}} |
| Post-update crash rate | {{< 0.5%}} | {{> 2%}} |
| Update adoption (24h) | {{> 80%}} | {{< 50%}} |

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

Ferramenta: {{LaunchDarkly / Unleash / Flagsmith / Firebase Remote Config}}

Fluxo: Feature flag -> Avaliacao -> Conditional rendering -> Metricas -> Decisao (manter/remover)

> Para metricas de performance, (ver 10-performance.md).

---

## Historico de Decisoes

| Data | Decisao | Motivo |
|------|---------|--------|
| {{YYYY-MM-DD}} | {{Decisao sobre observabilidade}} | {{Justificativa}} |
