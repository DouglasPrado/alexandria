# Observabilidade

Define como o frontend desktop e monitorado em producao, incluindo error tracking, crash reporting, telemetria de auto-update, monitoramento de recursos do sistema e feature flags para rollout progressivo. Observabilidade permite identificar e resolver problemas antes que impactem os usuarios.

---

## Error Tracking

> Como erros do frontend desktop sao capturados e reportados?

| Aspecto | Configuracao |
|---------|-------------|
| Ferramenta | `@sentry/electron` (cobre main process + renderer process com um SDK unico) |
| Processos monitorados | Main process (IPC handlers, SyncEngine, NodeAgent, VaultManager) + Renderer process (React, Zustand, TanStack Query) |
| Source Maps | Sim — upload automatico no build via `@sentry/cli`; erros mapeados para TypeScript original |
| Alertas | Alerta no painel admin do Web Client (imediato) + email para Douglas Prado (30 min apos P1) |
| Sample Rate | Erros: 100%; Performance traces: 10% (`tracesSampleRate: 0.1`); Replay on error: 100% |

> Erros capturados: exceptions nao tratadas, erros de API, erros de rendering, promise rejections, erros de IPC, erros no main process.

<details>
<summary>Exemplo — Configuracao do Sentry para Electron</summary>

```typescript
// main/index.ts — Sentry no main process
import * as Sentry from '@sentry/electron/main';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

// renderer/index.ts — Sentry no renderer process
import * as Sentry from '@sentry/electron/renderer';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
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

## Crash Reporting

> Como crashes da aplicacao sao reportados?

| Aspecto | Configuracao |
|---------|-------------|
| Crash Reporter | `@sentry/electron` — inicializa `crashReporter` do Electron automaticamente ao chamar `Sentry.init()` no main |
| Upload automatico | Sim — minidumps (Windows) e crash reports (macOS) enviados ao Sentry na proxima inicializacao do app |
| Informacoes coletadas | Stack trace, OS version, app version, memoria, estado dos processos, breadcrumbs de IPC recentes |
| Servidor de crash reports | Sentry (free tier — 5k eventos/mes e suficiente para projeto familiar) |

```typescript
// main/index.ts — Sentry cobre crash reporting automaticamente
import * as Sentry from '@sentry/electron/main';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: app.isPackaged ? 'production' : 'development',
  release: `alexandria@${app.getVersion()}`,
  // Opt-in: so inicializa se usuario consentiu em Settings
  enabled: settingsStore.get('telemetry.enabled', false),
});

// renderer/index.tsx
import * as Sentry from '@sentry/electron/renderer';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration(),
    Sentry.browserTracingIntegration(),
  ],
  enabled: window.electronAPI.telemetryEnabled,
});
```

---

## Logging Estruturado

> O frontend desktop envia logs estruturados?

| Nivel | Quando Usar | Exemplo |
|-------|-------------|---------|
| Error | Excecoes, falhas de API, crashes | API retornou 500, IPC handler crash, rendering error |
| Warn | Comportamento inesperado nao-fatal | Retry de request, fallback ativado, update check falhou |
| Info | Acoes do usuario, eventos do sistema | App iniciado, janela criada, update instalado |
| Debug | Desenvolvimento apenas | State changes, IPC messages, re-renders |

| Ferramenta | Processo | Destino |
|------------|----------|---------|
| `electron-log` | Main process | Arquivo em disco (`userData/logs/main.log`) + console em dev; rotacao automatica |
| Sentry breadcrumbs | Renderer process | Breadcrumbs de IPC calls, navegacao e acoes do usuario — anexados a erros Sentry |
| Rotacao de logs | Main process | `electron-log` mantém ultimos 7 dias; maxSize 10MB por arquivo; arquivos anteriores deletados |

---

## Telemetria de Auto-Update

> Como monitoramos o processo de atualizacao?

| Evento | Dados Coletados | Alerta se |
|--------|----------------|-----------|
| Update check | Versao atual, versao disponivel, timestamp | Check falhou 3x consecutivas |
| Download started | Versao, tamanho do download | — |
| Download progress | Percentual, velocidade, bytes transferidos | Download travado > 5 min |
| Download completed | Versao, tempo total de download | — |
| Update installed | Versao anterior, versao nova, timestamp | Rollback detectado |
| Update failed | Versao, erro, stack trace | Qualquer falha |

---

## Monitoramento de Recursos do Sistema

> Como monitoramos o consumo de recursos da aplicacao?

| Metrica | Fonte | Meta | Alerta se |
|---------|-------|------|-----------|
| Memory (main process) | `process.memoryUsage()` | < 80MB | > 150MB (log ERROR + Sentry alert) |
| Memory (renderer process) | `app.getAppMetrics()` | < 150MB | > 300MB (log WARN + Sentry alert) |
| CPU usage | `app.getAppMetrics()` | < 1% idle | > 30% sustentado por 5 min (log WARN) |
| Open file handles | `app.getAppMetrics()` | < 100 | > 500 (possivel leak de handles de arquivo) |
| IPC message rate | Counter no preload | < 100/s | > 1000/s (possivel loop de mensagens) |

---

## Metricas de API

> Como monitoramos a saude das chamadas de API?

| Metrica | Meta | Alerta se |
|---------|------|-----------|
| Latencia p95 | < 500ms (RNF blueprint) | > 1s por 5 min — log WARN + Sentry performance alert |
| Taxa de erro | < 1% | > 5% por 2 min — log ERROR + alerta imediato |
| Timeout rate | < 0.1% | > 1% por 5 min — possivel orquestrador sobrecarregado |
| Disponibilidade orquestrador | > 99.5% (SLA blueprint) | < 99% por 10 min — P2 alert |

---

## User Flow Monitoring

> Monitoramos os fluxos criticos do usuario?

| Fluxo | Eventos Rastreados | Meta de Conclusao |
|-------|--------------------|--------------------|
| Onboarding (primeiro setup) | `onboarding:start`, `cluster_name_set`, `vault_created`, `seed_displayed`, `folder_added`, `complete` | 90%+ completo (abandono sugere UX problem) |
| Vault unlock (uso diario) | `unlock_screen_shown`, `password_submitted`, `unlock_success`, `unlock_failure` | 98%+ sucesso (falhas consecutivas podem indicar password incorreta ou vault corrompido) |
| Upload de arquivo (sync) | `folder_added`, `file_detected`, `upload_queued`, `upload_complete`, `upload_failed` | 99%+ sucesso (falhas indicam problema no pipeline) |
| Recovery (emergencia) | `recovery:start`, `seed_entered`, `validation_success`, `rebuild_progress`, `recovery_complete` | 100% completavel (falha e P1) |
| Auto-update | `update:check`, `update:download_started`, `update:download_complete`, `update:installed`, `app:restarted` | 99%+ sucesso (falhas monitoradas via Sentry) |

<!-- APPEND:flows -->

---

## Feature Flags

> Como funcionalidades sao liberadas progressivamente?

| Flag | Descricao | Status |
|------|-----------|--------|
| `features.timeline-view` | View em timeline da galeria (navegacao cronologica com scrubber) | Ativo |
| `features.sync-engine-v2` | Motor de sync com algoritmo de deduplicacao incremental melhorado | Inativo — fase 2 |
| `features.vault-cloud-backup` | Backup criptografado do vault no provedor cloud do usuario | Inativo — fase 2 |
| `features.multi-window-gallery` | Abertura de multiplas janelas de galeria simultaneamente | Inativo — fase 2 |
| `features.video-streaming` | Streaming de video sob demanda (sem download completo) | Inativo — fase 3 |

<!-- APPEND:flags -->

Ferramenta: Custom via `electron-store` (chave `features.*`) — sem servico externo para projeto self-hosted familiar

Fluxo: Flag em `electron-store` → lida no startup do renderer via IPC `settings:get` → conditional rendering → metricas via Sentry → decisao (manter/remover na proxima release)

<!-- do blueprint: 14-scalability.md — sem auto-scaling na v1; rollouts manuais por release -->

> Para metricas de performance, (ver 10-performance.md).

---

## Historico de Decisoes

| Data | Decisao | Motivo |
|------|---------|--------|
| 2026-03-24 | `electron-log` para main process em vez de `winston` ou `pino` | `electron-log` e projetado especificamente para Electron: escreve em `userData/logs/` por padrao, rotacao automatica, funciona em main + preload sem configuracao extra |
| 2026-03-24 | Sentry opt-in (usuario consente em Settings) | Principio Zero-Knowledge: nenhuma telemetria sem consentimento explicito; Sentry desabilitado por padrao |
| 2026-03-24 | Feature flags via `electron-store` (sem LaunchDarkly/Unleash) | Projeto familiar self-hosted nao justifica servico externo de feature flags; flags simples em config local sao suficientes |
