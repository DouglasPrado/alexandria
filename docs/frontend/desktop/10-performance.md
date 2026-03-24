# Performance

Define a estrategia de performance do frontend desktop, as tecnicas de otimizacao adotadas, as metricas-alvo e o budget de performance. Performance e um requisito nao-funcional critico que impacta diretamente a experiencia do usuario — em aplicacoes desktop, startup time, consumo de memoria e CPU sao os indicadores mais importantes.

---

## Estrategias de Otimizacao

> Quais tecnicas de performance sao aplicadas?

| Tecnica | Descricao | Quando Usar | Ferramenta/API |
|---------|-----------|-------------|----------------|
| Lazy Window Creation | Criar janelas secundarias sob demanda | Janelas raramente usadas (About, Settings) | `BrowserWindow` lazy init |
| Code Splitting | Carregar apenas o codigo necessario no renderer | Features grandes, rotas pesadas | `React.lazy`, dynamic import |
| Preload Script Otimizado | Minimizar codigo no preload para reduzir startup | Sempre | Expor apenas APIs necessarias |
| Native Module Loading | Carregar modulos nativos de forma assincrona | Modulos pesados (SQLite, sharp) | `require()` lazy no main process |
| Memoizacao | Evitar re-renders desnecessarios | Componentes pesados, listas | `React.memo`, `useMemo`, `useCallback` |
| Virtualizacao | Renderizar apenas itens visiveis | Listas longas (100+ itens) | `@tanstack/virtual`, `react-window` |
| Process Management | Gerenciar carga entre main e renderer | Operacoes pesadas | Worker threads, child processes |
| Deferred Initialization | Inicializar servicos nao-criticos apos a janela aparecer | Auto-updater, analytics, tray | `app.whenReady()` + `setTimeout` |

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
    settingsWindow.on('closed', () => { settingsWindow = null; });
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

| Metrica | Meta | Descricao |
|---------|------|-----------|
| Cold Startup Time | {{< 3s}} | Tempo desde clicar no icone ate a janela estar interativa |
| Warm Startup Time | {{< 1s}} | Tempo de startup com cache (app ja foi aberto antes) |
| Memory Usage (Renderer) | {{< 150MB}} | Consumo de memoria do processo renderer |
| Memory Usage (Main) | {{< 50MB}} | Consumo de memoria do processo main |
| CPU Idle | {{< 1%}} | Uso de CPU quando a aplicacao esta em idle |
| Disk I/O (Startup) | {{< 50MB reads}} | Leitura de disco durante inicializacao |
| IPC Latency | {{< 5ms}} | Tempo de ida e volta de uma mensagem IPC |

---

## Budget de Performance

> Qual o tamanho maximo aceitavel?

| Recurso | Budget | Atual |
|---------|--------|-------|
| Installer size (Windows NSIS) | {{< 80MB}} | {{A medir}} |
| Installer size (macOS DMG) | {{< 90MB}} | {{A medir}} |
| Installer size (Linux AppImage) | {{< 100MB}} | {{A medir}} |
| JavaScript total (renderer) | {{< 200KB gzipped}} | {{A medir}} |
| CSS total | {{< 50KB gzipped}} | {{A medir}} |
| Unpacked app size | {{< 250MB (Electron) / < 20MB (Tauri)}} | {{A medir}} |

<!-- APPEND:budget -->

---

## Memory Leak Detection

> Como detectamos e prevenimos vazamentos de memoria?

| Tecnica | Descricao | Ferramenta |
|---------|-----------|------------|
| Heap Snapshots | Comparar snapshots do heap ao longo do tempo | Chrome DevTools (renderer) |
| Process Memory Monitoring | Monitorar `process.memoryUsage()` periodicamente | Custom logging no main |
| Event Listener Cleanup | Garantir que listeners IPC sao removidos ao destruir janelas | `removeAllListeners()` no `closed` event |
| BrowserWindow Leak Prevention | Setar referencia para `null` ao fechar janela | Pattern de referencia fraca |
| Automated Detection | Testes de longa duracao que monitoram memoria | Playwright + memory profiling |

---

## Process Management

> Como gerenciamos carga entre processos?

| Operacao | Processo | Estrategia |
|----------|----------|------------|
| Calculo pesado | Main (worker thread) | `worker_threads` para nao bloquear o main process |
| Processamento de arquivo grande | Main (child process) | `child_process.fork()` para isolamento |
| Renderizacao de graficos | Renderer (Web Worker) | `new Worker()` para nao bloquear a UI |
| Compressao/descompressao | Main (native module) | Modulo nativo em C/Rust para performance |

---

## Monitoramento

> Como medimos performance continuamente?

| Ferramenta | Proposito | Frequencia |
|------------|-----------|------------|
| Electron DevTools | Profiling de CPU e memoria no renderer | {{Durante desenvolvimento}} |
| `process.memoryUsage()` | Metricas de memoria no main process | {{Continuo em producao}} |
| `app.getAppMetrics()` | Metricas de todos os processos | {{Continuo em producao}} |
| Bundle Analyzer | Analise de tamanho do bundle | {{Cada release}} |
| {{APM tool — Sentry / Datadog}} | Monitoramento de performance em producao | {{Continuo}} |

> Para integracao com CI, (ver 13-cicd-convencoes.md).

---

## Historico de Decisoes

| Data | Decisao | Motivo |
|------|---------|--------|
| {{YYYY-MM-DD}} | {{Decisao sobre performance}} | {{Justificativa}} |
