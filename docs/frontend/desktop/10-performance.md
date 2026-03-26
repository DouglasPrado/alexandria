# Performance

Define a estrategia de performance do frontend desktop, as tecnicas de otimizacao adotadas, as metricas-alvo e o budget de performance. Performance e um requisito nao-funcional critico que impacta diretamente a experiencia do usuario — em aplicacoes desktop, startup time, consumo de memoria e CPU sao os indicadores mais importantes.

---

## Estrategias de Otimizacao

> Quais tecnicas de performance sao aplicadas?

| Tecnica                  | Descricao                                                | Quando Usar                                | Ferramenta/API                         |
| ------------------------ | -------------------------------------------------------- | ------------------------------------------ | -------------------------------------- |
| Lazy Window Creation     | Criar janelas secundarias sob demanda                    | Janelas raramente usadas (About, Settings) | `BrowserWindow` lazy init              |
| Code Splitting           | Carregar apenas o codigo necessario no renderer          | Features grandes, rotas pesadas            | `React.lazy`, dynamic import           |
| Preload Script Otimizado | Minimizar codigo no preload para reduzir startup         | Sempre                                     | Expor apenas APIs necessarias          |
| Native Module Loading    | Carregar modulos nativos de forma assincrona             | Modulos pesados (SQLite, sharp)            | `require()` lazy no main process       |
| Memoizacao               | Evitar re-renders desnecessarios                         | Componentes pesados, listas                | `React.memo`, `useMemo`, `useCallback` |
| Virtualizacao            | Renderizar apenas itens visiveis                         | Listas longas (100+ itens)                 | `@tanstack/virtual`, `react-window`    |
| Process Management       | Gerenciar carga entre main e renderer                    | Operacoes pesadas                          | Worker threads, child processes        |
| Deferred Initialization  | Inicializar servicos nao-criticos apos a janela aparecer | Auto-updater, analytics, tray              | `app.whenReady()` + `setTimeout`       |

<!-- APPEND:estrategias -->

<details>
<summary>Exemplo — Lazy Window Creation</summary>

```typescript
// main/windows/settings-window.ts
let settingsWindow: BrowserWindow | null = null;

export function getSettingsWindow(): BrowserWindow {
  if (!settingsWindow || settingsWindow.isDestroyed()) {
    settingsWindow = new BrowserWindow({
      width: 600,
      height: 500,
      show: false,
      webPreferences: { preload: PRELOAD_PATH, sandbox: true },
    });
    settingsWindow.loadURL(SETTINGS_URL);
    settingsWindow.once('ready-to-show', () => settingsWindow?.show());
    settingsWindow.on('closed', () => {
      settingsWindow = null;
    });
  } else {
    settingsWindow.focus();
  }
  return settingsWindow;
}
```

</details>

---

## Metricas de Performance Desktop

> Quais sao as metas de performance?

| Metrica                 | Meta         | Descricao                                                                             |
| ----------------------- | ------------ | ------------------------------------------------------------------------------------- |
| Cold Startup Time       | < 3s         | Tempo desde clicar no icone ate a janela estar interativa                             |
| Warm Startup Time       | < 1s         | Tempo de startup com cache (app ja foi aberto antes)                                  |
| Memory Usage (Renderer) | < 150MB      | Consumo de memoria do processo renderer                                               |
| Memory Usage (Main)     | < 80MB       | Consumo de memoria do processo main (inclui Sync Engine + Node Agent + Vault Manager) |
| CPU Idle                | < 1%         | Uso de CPU quando a aplicacao esta em idle (sync engine pausado, janela minimizada)   |
| Disk I/O (Startup)      | < 50MB reads | Leitura de disco durante inicializacao                                                |
| IPC Latency             | < 5ms        | Tempo de ida e volta de uma mensagem IPC local                                        |

---

## Budget de Performance

> Qual o tamanho maximo aceitavel?

| Recurso                         | Budget          | Atual                                                    |
| ------------------------------- | --------------- | -------------------------------------------------------- |
| Installer size (Windows NSIS)   | < 80MB          | A medir no primeiro build                                |
| Installer size (macOS DMG)      | < 90MB          | A medir no primeiro build                                |
| Installer size (Linux AppImage) | < 100MB         | A medir no primeiro build                                |
| JavaScript total (renderer)     | < 200KB gzipped | electron-vite + code splitting por rota (React.lazy)     |
| CSS total                       | < 50KB gzipped  | Tailwind CSS v4 com purge; apenas utilitarios usados     |
| Unpacked app size (Electron)    | < 250MB         | Node.js runtime ~70MB + app ~10MB + dependencias nativas |

<!-- APPEND:budget -->

---

## Memory Leak Detection

> Como detectamos e prevenimos vazamentos de memoria?

| Tecnica                       | Descricao                                                    | Ferramenta                               |
| ----------------------------- | ------------------------------------------------------------ | ---------------------------------------- |
| Heap Snapshots                | Comparar snapshots do heap ao longo do tempo                 | Chrome DevTools (renderer)               |
| Process Memory Monitoring     | Monitorar `process.memoryUsage()` periodicamente             | Custom logging no main                   |
| Event Listener Cleanup        | Garantir que listeners IPC sao removidos ao destruir janelas | `removeAllListeners()` no `closed` event |
| BrowserWindow Leak Prevention | Setar referencia para `null` ao fechar janela                | Pattern de referencia fraca              |
| Automated Detection           | Testes de longa duracao que monitoram memoria                | Playwright + memory profiling            |

---

## Process Management

> Como gerenciamos carga entre processos?

| Operacao                        | Processo              | Estrategia                                        |
| ------------------------------- | --------------------- | ------------------------------------------------- |
| Calculo pesado                  | Main (worker thread)  | `worker_threads` para nao bloquear o main process |
| Processamento de arquivo grande | Main (child process)  | `child_process.fork()` para isolamento            |
| Renderizacao de graficos        | Renderer (Web Worker) | `new Worker()` para nao bloquear a UI             |
| Compressao/descompressao        | Main (native module)  | Modulo nativo em C/Rust para performance          |

---

## Monitoramento

> Como medimos performance continuamente?

| Ferramenta                      | Proposito                                                 | Frequencia                                                   |
| ------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------ |
| Electron DevTools               | Profiling de CPU e memoria no renderer                    | Durante desenvolvimento (F12 / Cmd+Opt+I)                    |
| `process.memoryUsage()`         | Metricas de memoria no main process — logadas a cada 60s  | Continuo em producao (arquivo de log local)                  |
| `app.getAppMetrics()`           | CPU/memoria de todos os processos (main + renderer + GPU) | Continuo em producao (log local + IPC para renderer)         |
| electron-vite bundle analyzer   | Analise de tamanho do bundle JS/CSS                       | A cada release (CI: `npm run build:analyze`)                 |
| Sentry SDK (`@sentry/electron`) | Crash reports, performance traces, startup time           | Continuo em producao (opt-in pelo usuario nas configuracoes) |

> Para integracao com CI, (ver 13-cicd-convencoes.md).

---

## Historico de Decisoes

| Data       | Decisao                                            | Motivo                                                                                                                             |
| ---------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 2026-03-24 | TanStack Virtual para galeria de fotos             | Galeria pode ter 50k+ arquivos; renderizacao completa seria inviavel — virtual list renderiza apenas os itens visiveis na viewport |
| 2026-03-24 | Deferred initialization para servicos nao-criticos | Auto-updater, analytics e tray menu inicializam apos `ready-to-show` para reduzir cold startup time abaixo de 3s                   |
| 2026-03-24 | Sentry como APM (opt-in) em vez de Datadog         | Custo proporcional para projeto familiar; opt-in respeita principio Zero-Knowledge — nenhum telemetria sem consentimento           |
