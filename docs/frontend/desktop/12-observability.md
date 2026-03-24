# Observabilidade

Define como o frontend desktop e monitorado em producao, incluindo error tracking, crash reporting, telemetria de auto-update, monitoramento de recursos do sistema e feature flags para rollout progressivo. Observabilidade permite identificar e resolver problemas antes que impactem os usuarios.

---

## Error Tracking

> Como erros do frontend desktop sao capturados e reportados?

| Aspecto | Configuracao |
|---------|-------------|
| Ferramenta | {{Sentry / Datadog / Bugsnag}} |
| Processos monitorados | {{Main process + Renderer process}} |
| Source Maps | {{Sim — upload no build}} |
| Alertas | {{Slack / Email / PagerDuty}} |
| Sample Rate | {{100% em producao}} |

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
| Crash Reporter | {{Electron crashReporter / Sentry crash reporting}} |
| Upload automatico | {{Sim — envia minidump ao servidor}} |
| Informacoes coletadas | {{Stack trace, OS version, app version, memoria}} |
| Servidor de crash reports | {{Sentry / servidor proprio}} |

```typescript
// main/index.ts — Crash reporter (Electron)
import { crashReporter } from 'electron';

crashReporter.start({
  submitURL: '{{crash-report-server-url}}',
  productName: '{{NomeProduto}}',
  companyName: '{{NomeEmpresa}}',
  uploadToServer: true,
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
| {{electron-log / winston}} | Main process | Arquivo em disco + console |
| {{Sentry breadcrumbs}} | Renderer process | Sentry (anexado a erros) |
| {{Rotacao de logs}} | Main process | Manter apenas ultimos {{7 dias}} |

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
| Memory (main process) | `process.memoryUsage()` | {{< 50MB}} | {{> 100MB}} |
| Memory (renderer process) | `app.getAppMetrics()` | {{< 150MB}} | {{> 300MB}} |
| CPU usage | `app.getAppMetrics()` | {{< 1% idle}} | {{> 30% por 5 min}} |
| Open file handles | OS metrics | {{< 100}} | {{> 500}} |
| IPC message rate | Custom counter | {{< 100/s}} | {{> 1000/s}} |

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
| {{Feature principal}} | {{open, interact, complete}} | {{70%+ completo}} |
| {{Login}} | {{form_view, submit, success/failure}} | {{95%+ sucesso}} |
| {{Auto-update}} | {{check, download, install, restart}} | {{99%+ sucesso}} |

<!-- APPEND:flows -->

---

## Feature Flags

> Como funcionalidades sao liberadas progressivamente?

| Flag | Descricao | Status |
|------|-----------|--------|
| {{new-dashboard}} | {{Novo design do dashboard}} | {{10% rollout}} |
| {{ai-search}} | {{Busca com IA}} | {{Inativo}} |
| {{redesigned-settings}} | {{Settings redesenhado}} | {{Ativo para beta users}} |
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
