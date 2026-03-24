# Visao do Frontend Desktop

Define o papel do frontend desktop no sistema, os principios que guiam decisoes tecnicas e o stack tecnologico escolhido. Este documento serve como ponto de partida para qualquer pessoa que precise entender o que o frontend desktop faz, como ele se posiciona na arquitetura geral e quais tecnologias sustentam suas decisoes.

---

## Objetivo do Frontend Desktop

> Qual e a responsabilidade principal do frontend desktop neste sistema?

| Responsabilidade        | Descricao                                                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Interface do usuario    | Galeria de midia, upload manual, navegacao por timeline, gerenciamento de cluster e monitoramento de saude — tudo em app nativo multiplataforma    |
| Renderizacao de dados   | Miniaturas e previews carregados via IPC do main process; metadata dos arquivos exibida em tempo real conforme o Sync Engine processa novos itens  |
| Interacao com APIs      | Main process consume a API REST do orquestrador via HTTPS; renderer se comunica exclusivamente com o main via IPC tipado (nunca diretamente com a API) |
| Gerenciamento de estado | Zustand stores no renderer sincronizadas com eventos IPC do main process (sync progress, node health, upload queue)                                |
| Experiencia do usuario  | App roda em background via system tray; sync e silencioso; galeria e responsiva e rapida mesmo com acervo de dezenas de milhares de fotos           |

<!-- do blueprint: 00-context.md — Sync Engine e Agente de No rodam nos dispositivos dos membros -->

O cliente desktop e o **hub operacional** do Alexandria em computadores. Ele opera em tres camadas simultaneas:

1. **Interface** — galeria, upload, painel do admin, configuracao do cluster
2. **Sync Engine** — monitora pastas configuradas, detecta novos arquivos e enfileira uploads automaticamente
3. **Agente de No** — armazena chunks locais, envia heartbeats ao orquestrador, participa do scrubbing periodico

Por rodar com Node.js nativo no main process, o cliente desktop e o unico cliente capaz de executar o Agente de No e o Sync Engine integrados — sem daemon separado, sem instalacao adicional.

---

## Principios Arquiteturais

> Quais regras fundamentais guiam as decisoes de frontend desktop?

| Principio                         | Descricao                                                                                                       | Implicacao Pratica                                                                                  |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Frontend como aplicacao nativa    | O app roda como cidadao de primeira classe no SO: system tray, menus nativos, notificacoes, file associations   | Usar Electron APIs para tray, `Menu`, `Notification`, `shell.openPath`, `dialog`                   |
| Separacao de processos            | Main process tem responsabilidade de sistema (IPC, file system, HTTP, node agent); renderer cuida apenas da UI  | Toda logica de negocio fica no main; renderer e stateless alem de estado de UI                      |
| Background-first                  | O valor central do app e o sync automatico, que acontece sem janela aberta                                       | App nao fecha ao fechar janela — persiste no tray; sync continua em background indefinidamente       |
| Zero-Knowledge no cliente         | Criptografia AES-256-GCM acontece no main process antes de qualquer upload; renderer nunca ve dados em claro    | File keys sao derivadas em memoria no main process; renderer recebe apenas URLs de preview locais   |
| Orientacao a features             | Codigo organizado por dominio de negocio, nao por tipo de arquivo                                               | Pastas por feature: `features/gallery/`, `features/sync/`, `features/cluster/`, `features/vault/`  |
| Performance by default            | Galeria com dezenas de milhares de itens deve ser fluida; janelas secundarias criadas sob demanda               | Virtualizacao de lista (TanStack Virtual), lazy load de janelas, thumbnails em cache local           |

<!-- do blueprint: 02-architecture_principles.md — Zero-Knowledge por Padrao, Simplicidade Operacional, Embrace Failure -->

<!-- APPEND:principios -->

<details>
<summary>Exemplo — Principios em acao</summary>

- **Separacao de processos:** O main process registra o file watcher (chokidar), enfileira uploads, executa chunks e heartbeats. O renderer exibe apenas o progresso via IPC events — nunca toca o file system diretamente.
- **Background-first:** `mainWindow.on('close', e => { e.preventDefault(); mainWindow.hide() })` — fechar a janela apenas a oculta; o app permanece no tray sincronizando em background.
- **Zero-Knowledge no cliente:** `aes256gcm.encrypt(chunkBuffer, derivedFileKey)` ocorre no main process antes do `storageProvider.put()`. O renderer recebe apenas o thumbnail gerado localmente.

</details>

---

## Plataformas e Dispositivos

> Em quais plataformas o frontend desktop sera executado?

- [x] macOS (12+)
- [x] Windows (10+)
- [x] Linux (Ubuntu 22+, Fedora 38+)
- [ ] Outro: —

**Plataforma primaria:** macOS 12+ (Apple Silicon e Intel)
**Plataforma secundaria:** Windows 10/11

> Linux e suportado principalmente para NAS e mini-PCs que atuam como nos de armazenamento — nesses casos o app pode rodar em modo headless (apenas Agente de No, sem galeria).

<!-- do blueprint: 00-context.md — Dispositivos da familia: computadores, NAS e VPS como nos de armazenamento -->

---

## Stack Tecnologico

> Qual o stack principal do frontend desktop?

| Camada            | Tecnologia          | Justificativa                                                                                                   |
| ----------------- | ------------------- | --------------------------------------------------------------------------------------------------------------- |
| Framework Desktop | Electron 34         | Node.js nativo no main process permite rodar Sync Engine e Agente de No sem daemon separado; ecossistema maduro |
| Runtime           | Chromium + Node.js  | Node.js essencial para acesso a file system, crypto nativo, HTTP e core-sdk compartilhado do monorepo           |
| UI Library        | React 19            | Componentes reativos, hooks, ecossistema rico; consistencia com o cliente web (Next.js)                         |
| State Management  | Zustand v5          | API minimalista sem boilerplate; stores isoladas por feature; facil sincronizar com eventos IPC                 |
| Data Fetching     | TanStack Query v5   | Cache automatico para chamadas ao orquestrador via main process; devtools integrado                             |
| Styling           | Tailwind CSS v4     | Engine CSS-first, zero-JS runtime; tokens do design system Alexandria compartilhados via CSS variables          |
| Build Tool        | electron-vite 3     | HMR para main e renderer, builds rapidos, configuracao pre-otimizada para Electron                              |
| Empacotamento     | electron-builder    | DMG (macOS), NSIS installer (Windows), AppImage + .deb (Linux); auto-update via GitHub Releases                 |
| IPC               | electron (ipcMain / ipcRenderer) | Comunicacao tipada entre processos via channels nomeados; validacao com Zod no main         |
| File Watcher      | chokidar            | Monitoramento eficiente de pastas para o Sync Engine; suporte a macOS FSEvents, Windows ReadDirectoryChanges    |

> Electron foi escolhido sobre Tauri porque o Sync Engine e o Agente de No requerem acesso profundo ao Node.js (crypto, fs, net, child_process para FFmpeg), o que eliminaria a vantagem de peso do Tauri e adicionaria complexidade Rust ao monorepo TypeScript.

<!-- do blueprint: 00-context.md — Monorepo com core-sdk compartilhado; restricao TypeScript/NestJS -->
<!-- do blueprint: 02-architecture_principles.md — Simplicidade Operacional: sem adicionar Rust ao stack -->

---

## Tipos de Usuarios

> Quem sao os usuarios do frontend desktop? Quais perfis de acesso existem?

| Perfil                  | Descricao                                                                                           | Nivel de Acesso | Funcionalidades Principais                                                                                  |
| ----------------------- | --------------------------------------------------------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------- |
| Administrador Familiar  | Membro tecnico que configura e opera o cluster; normalmente o unico com acesso ao painel de admin   | Total           | Criar cluster, convidar membros, adicionar/remover nos, configurar provedores cloud, executar recovery, ver health dashboard |
| Membro Familiar         | Pai/mae, tios, avos — usam o app para salvar e visualizar fotos/videos sem necessidade tecnica      | Padrao          | Galeria compartilhada, upload manual de arquivos, download de midia, ver notificacoes de sync               |
| Fotografo Amador        | Membro que produz alto volume de midia; precisa de sync automatico e liberacao de espaco no disco   | Padrao          | Configurar pasta de sync automatico, ver progresso de upload, aceitar placeholder files (thumbnails locais) |
| Guardiao de Memorias    | Membro mais velho, curador do acervo; navega por timeline e organiza por eventos                    | Padrao (leitura enfatizada) | Timeline cronologica, busca por data/evento, navegacao por album, download de midia sob demanda |

<!-- do blueprint: 00-context.md — personas: Administrador Familiar, Membro Familiar, Fotografo Amador, Guardiao de Memorias -->

<!-- APPEND:usuarios -->

> Detalhes sobre autenticacao e autorizacao: (ver 01-arquitetura.md)
