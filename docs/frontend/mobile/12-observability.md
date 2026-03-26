# Observabilidade

Define como o app mobile e monitorado em producao, incluindo crash reporting, error tracking, analytics, performance monitoring e OTA updates. Observabilidade permite identificar e resolver problemas antes que impactem os usuarios e acompanhar a saude do app em tempo real.

---

## Crash Reporting e Error Tracking

> Como erros e crashes do app sao capturados e reportados?

| Aspecto                    | Configuracao                                                                     |
| -------------------------- | -------------------------------------------------------------------------------- |
| Ferramenta principal       | Sentry React Native — crash reporting JS + erros de API + performance monitoring |
| Crashes nativos            | Sentry captura crashes nativos iOS/Android via SDK nativo integrado ao Expo      |
| Ambiente                   | Production + Preview (builds EAS); desabilitado em desenvolvimento               |
| Source Maps                | Upload automatico no EAS Build via `@sentry/react-native/metro`                  |
| dSYMs (iOS)                | Upload automatico via `sentry-cli` durante EAS build                             |
| ProGuard mapping (Android) | Upload automatico via `sentry-cli` durante EAS build                             |
| Alertas                    | Push notification (via Expo Notifications) para o admin + email configuravel     |
| Sample Rate                | 100% crashes e erros; 10% de traces de performance                               |
| Redaction                  | `beforeSend` filtra `token`, `vault-key`, `password`, `seed` de todos os eventos |

<!-- do blueprint: 15-observability.md (politica de redaction de dados sensiveis, never log seeds/tokens) -->

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
  integrations: [Sentry.reactNativeTracingIntegration()],
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

| Ferramenta            | Proposito                     | Eventos Rastreados                                         |
| --------------------- | ----------------------------- | ---------------------------------------------------------- |
| Sentry React Native   | Error analytics + performance | Crashes, erros de API, slow renders, vault unlock failures |
| `expo-insights` (EAS) | Build e update analytics      | Taxa de adocao de OTA updates, crash rate por versao       |

<!-- do blueprint: sistema self-hosted familiar; Firebase Analytics nao se aplica (nao e SaaS); analytics e via Sentry + EAS Insights -->

| Evento                    | Parametros                                                 | Quando Dispara                                |
| ------------------------- | ---------------------------------------------------------- | --------------------------------------------- |
| `screen_view`             | `screen_name`, `screen_class`                              | Navegacao entre telas (automatico via Sentry) |
| `vault_unlock_success`    | `duration_ms`                                              | Vault desbloqueado com sucesso                |
| `vault_unlock_failed`     | `attempt_number`                                           | Senha incorreta no vault unlock               |
| `upload_queued`           | `file_type`, `file_size_kb`, `source` (manual/auto)        | Arquivo adicionado a fila de upload           |
| `upload_completed`        | `file_type`, `duration_ms`, `chunk_count`, `replica_count` | Upload concluido e replicado                  |
| `upload_failed`           | `file_type`, `error_code`                                  | Falha no upload apos retries                  |
| `space_release_confirmed` | `files_count`, `freed_mb`                                  | Usuario confirmou liberacao de espaco         |
| `sync_engine_started`     | `queue_size`                                               | Background sync iniciado                      |
| `sync_engine_stopped`     | `reason` (success/error/network)                           | Background sync concluido                     |
| `onboarding_completed`    | `role`, `duration_ms`                                      | Novo membro completou onboarding              |
| `node_alert_received`     | `alert_type`, `severity`                                   | Alerta de no recebido via push                |
| `gallery_photo_viewed`    | `file_type`, `status` (ready/processing)                   | Foto aberta no detalhe                        |

<!-- do blueprint: 15-observability.md (eventos criticos: upload concluido, alerta gerado, membro adicionado) -->

---

## Logging Estruturado

> O app envia logs estruturados?

| Nivel | Quando Usar                        | Exemplo                            |
| ----- | ---------------------------------- | ---------------------------------- |
| Fatal | Crash nativo ou JS                 | App crash, uncaught exception      |
| Error | Excecoes, falhas de API            | API retornou 500, rendering crash  |
| Warn  | Comportamento inesperado nao-fatal | Retry de request, fallback ativado |
| Info  | Acoes do usuario (analytics)       | Tela visitada, feature usada       |
| Debug | Desenvolvimento apenas             | State changes, re-renders          |

> **Regra:** Nunca logar dados sensiveis (tokens, senhas, dados pessoais) mesmo em nivel Debug.

---

## Metricas de API

> Como monitoramos a saude das chamadas de API?

| Metrica                         | Meta                 | Alerta se                                    |
| ------------------------------- | -------------------- | -------------------------------------------- |
| Latencia p95 (API metadata)     | < 500ms              | > 1s por 5 min — Orquestrador sobrecarregado |
| Taxa de erro 5xx                | < 1%                 | > 5% por 2 min — problema no Orquestrador    |
| Timeout rate                    | < 0.1%               | > 1% por 5 min — rede ou Orquestrador lento  |
| Disponibilidade do Orquestrador | > 99.5% (SLA)        | < 99% por 10 min — verificar VPS             |
| Upload chunk latencia p95       | < 2s por chunk (4MB) | > 5s — saturacao de banda ou no lento        |
| Heartbeat latencia              | < 5s                 | > 10s — conectividade do no comprometida     |

<!-- do blueprint: 15-observability.md (Golden Signals: latencia p95 > 500ms → warn; erros >1% → warn) -->

---

## Performance Monitoring

> Como monitoramos performance do app em producao?

| Metrica                            | Ferramenta                                 | Meta                      |
| ---------------------------------- | ------------------------------------------ | ------------------------- |
| App Startup Time (cold start)      | Sentry Performance (App Start transaction) | < 2s                      |
| App Startup Time (warm start)      | Sentry Performance                         | < 1s                      |
| Slow Frames (< 60fps)              | Sentry Performance                         | < 5% do total             |
| Frozen Frames (> 700ms sem render) | Sentry Performance                         | < 1% do total             |
| Memory Usage                       | Sentry (memory breadcrumbs)                | < 200MB medio             |
| Network Latency p95                | Sentry Performance (HTTP spans)            | < 500ms para API metadata |
| Vault Unlock Duration              | Sentry (custom span `vault_unlock`)        | < 500ms                   |
| Encryption Throughput              | Custom metric via Sentry                   | > 10MB/s (AES-256-GCM)    |

<!-- do blueprint: 10-performance.md (metas de cold start, memory, frame rate) -->

---

## OTA Updates Monitoring

> Como monitoramos atualizacoes Over-The-Air?

| Aspecto             | Configuracao                                                                                        |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| Ferramenta          | Expo Updates (EAS Update) — OTA para JS bundle; EAS Build para atualizacoes nativas                 |
| Rollout             | Progressivo via EAS channels: `preview` (alpha testers) → `production` (100%)                       |
| Rollback automatico | Sentry + EAS Insights: se crash rate > 2% apos update, reverter para versao anterior via EAS Update |
| Metricas            | EAS Insights: taxa de adocao por versao, crash rate por build, tempo de download                    |

<!-- do blueprint: 00-frontend-vision.md (EAS Build para distribuicao) -->

| Metrica                | Meta   | Alerta se                                           |
| ---------------------- | ------ | --------------------------------------------------- |
| Update success rate    | > 99%  | < 95% — verificar EAS Update logs                   |
| Download time          | < 5s   | > 15s medio — bundle muito grande ou rede ruim      |
| Post-update crash rate | < 0.5% | > 2% — rollback imediato via EAS                    |
| Update adoption (24h)  | > 80%  | < 50% — verificar se app esta rodando em background |

---

## User Flow Monitoring

> Monitoramos os fluxos criticos do usuario?

| Fluxo                     | Eventos Rastreados                                                                               | Meta de Conclusao                               |
| ------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| Onboarding (convite)      | `invite_link_opened` → `vault_setup` → `seed_backup_confirmed` → `onboarding_completed`          | 95%+ (fluxo critico de adesao)                  |
| Vault Unlock (cold start) | `vault_unlock_screen_view` → `password_entered` → `vault_unlock_success` / `vault_unlock_failed` | 99%+ sucesso (falha = usuario nao acessa o app) |
| Upload manual             | `upload_started` → `upload_queued` → `upload_completed`                                          | 98%+ conclusao                                  |
| Background sync           | `sync_engine_started` → `files_detected` → `upload_queued`                                       | 99%+ sem erro critico                           |
| Liberacao de espaco       | `space_release_opened` → `files_selected` → `space_release_confirmed`                            | 85%+ conclusao (fluxo opcional mas importante)  |
| Recuperacao (seed)        | `recovery_started` → `seed_entered` → `vault_rebuilt` → `recovery_completed`                     | 100% (P1 — falha e catastrofica)                |

<!-- do blueprint: 08-use_cases.md (UC-001 a UC-007), 15-observability.md (eventos criticos: recovery, upload, alertas) -->

<!-- APPEND:flows -->

---

## Feature Flags

> Como funcionalidades sao liberadas progressivamente?

| Flag                      | Descricao                                                  | Status              |
| ------------------------- | ---------------------------------------------------------- | ------------------- |
| `enable-background-sync`  | Ativa o Sync Engine automatico em background               | Ativo (producao)    |
| `enable-space-liberation` | Habilita fluxo de liberacao de espaco apos 3 replicas      | Ativo (producao)    |
| `enable-biometric-vault`  | Vault unlock via Face ID / Touch ID (fase 2)               | Inativo (planejado) |
| `enable-video-streaming`  | Streaming de video sob demanda em vez de download (RF-065) | Inativo (fase 3)    |
| `enable-erasure-coding`   | Erasure coding em vez de replicacao 3x (RF-041)            | Inativo (fase 3)    |

<!-- APPEND:flags -->

Ferramenta: `expo-constants` + variaveis de ambiente EAS (`EXPO_PUBLIC_*`) — nao ha servico externo de feature flags; flags sao configuradas por channel EAS (`preview`, `production`) via `.env`.

Fluxo: Variavel `EXPO_PUBLIC_FLAG_X=true` no EAS channel → `const enabled = process.env.EXPO_PUBLIC_FLAG_X === 'true'` → Conditional rendering → Metricas via Sentry (event com flag como parametro) → Decisao (manter/remover)

> Para metricas de performance, (ver 10-performance.md).

---

## Historico de Decisoes

| Data       | Decisao                                                                | Motivo                                                                                                                                                                                   |
| ---------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-03-24 | Sentry React Native como ferramenta unica (sem Firebase Analytics)     | Alexandria e self-hosted e nao e SaaS — Firebase Analytics nao se aplica a um app familiar sem monetizacao; Sentry cobre crash reporting, performance e error tracking em uma ferramenta |
| 2026-03-24 | `beforeSend` obrigatorio para redaction de dados sensiveis no Sentry   | Tokens JWT, vault-key, seed phrase e credentials nunca podem aparecer em relatorios de crash — redaction no cliente antes de enviar e a unica garantia                                   |
| 2026-03-24 | Feature flags via variaveis de ambiente EAS (sem LaunchDarkly/Unleash) | App familiar self-hosted com 1-10 usuarios nao justifica um servico de feature flags; EAS channels (preview/production) com EXPO*PUBLIC*\* e suficiente para controlar rollout           |
| 2026-03-24 | `recovery` flow monitorado com meta de 100% (P1)                       | Falha no recovery e perda permanente de acesso ao cluster — mesmo um fracasso e inaceitavel; monitorar em Sentry com alerta imediato se qualquer etapa do fluxo falhar                   |
