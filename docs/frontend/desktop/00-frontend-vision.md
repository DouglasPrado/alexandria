# Visao do Frontend Desktop

Define o papel do frontend desktop no sistema, os principios que guiam decisoes tecnicas e o stack tecnologico escolhido. Este documento serve como ponto de partida para qualquer pessoa que precise entender o que o frontend desktop faz, como ele se posiciona na arquitetura geral e quais tecnologias sustentam suas decisoes.

---

## Objetivo do Frontend Desktop

> Qual e a responsabilidade principal do frontend desktop neste sistema?

| Responsabilidade        | Descricao                                                                    |
| ----------------------- | ---------------------------------------------------------------------------- |
| Interface do usuario    | {{Como o frontend desktop apresenta informacoes ao usuario}}                 |
| Renderizacao de dados   | {{Como os dados do backend/main process sao transformados em UI}}            |
| Interacao com APIs      | {{Como o frontend se comunica com o backend via main process ou diretamente}}|
| Gerenciamento de estado | {{Como o estado da aplicacao e mantido e sincronizado entre processos}}      |
| Experiencia do usuario  | {{Como o frontend garante fluidez, acessibilidade e performance nativa}}     |

{{Descreva o papel do frontend desktop no contexto do produto}}

---

## Principios Arquiteturais

> Quais regras fundamentais guiam as decisoes de frontend desktop?

| Principio                         | Descricao                                                                             | Implicacao Pratica                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Frontend como aplicacao nativa    | O frontend roda como aplicacao desktop, com acesso a recursos do sistema operacional  | Aproveitar APIs nativas (file system, notifications, tray, menus)         |
| Separacao de processos            | Main process e renderer process tem responsabilidades distintas                       | Logica de sistema no main, UI no renderer, comunicacao via IPC            |
| Orientacao a features             | O codigo e organizado por dominio de negocio, nao por tipo de arquivo                 | Pastas por feature (`features/auth/`, `features/billing/`)                |
| Performance by default            | Decisoes de performance sao tomadas desde o inicio, nao como otimizacao tardia        | Lazy loading de janelas, preload scripts otimizados                       |
| {{Principio adicional}}           | {{Descricao}}                                                                         | {{Implicacao}}                                                            |

<!-- APPEND:principios -->

<details>
<summary>Exemplo — Principios em acao</summary>

- **Separacao de processos:** O main process gerencia janelas, menus e tray. O renderer process cuida apenas da UI. Comunicacao acontece via IPC tipado.
- **Performance by default:** Janelas secundarias sao criadas sob demanda com `BrowserWindow` lazy, evitando consumo de memoria desnecessario.

</details>

---

## Plataformas e Dispositivos

> Em quais plataformas o frontend desktop sera executado?

- [ ] Windows (10+)
- [ ] macOS (12+)
- [ ] Linux (Ubuntu, Fedora, Arch)
- [ ] Outro: {{especificar}}

**Plataforma primaria:** {{plataforma primaria}}
**Plataforma secundaria:** {{plataforma secundaria}}

---

## Stack Tecnologico

> Qual o stack principal do frontend desktop?

| Camada           | Tecnologia                                                    | Justificativa                |
| ---------------- | ------------------------------------------------------------- | ---------------------------- |
| Framework Desktop| {{Electron / Tauri}}                                          | {{Justificativa da escolha}} |
| Runtime          | {{Chromium + Node.js (Electron) / WebView + Rust (Tauri)}}    | {{Justificativa da escolha}} |
| UI Library       | {{React / Vue / Svelte}}                                      | {{Justificativa da escolha}} |
| State Management | {{Zustand / Jotai / Redux Toolkit}}                           | {{Justificativa da escolha}} |
| Data Fetching    | {{TanStack Query / SWR}}                                      | {{Justificativa da escolha}} |
| Styling          | {{Tailwind CSS / Styled Components / CSS Modules}}            | {{Justificativa da escolha}} |
| Build Tool       | {{Vite / Webpack / electron-vite}}                            | {{Justificativa da escolha}} |

<details>
<summary>Exemplo — Stack com Electron</summary>

| Camada           | Tecnologia                  | Justificativa                                            |
| ---------------- | --------------------------- | -------------------------------------------------------- |
| Framework Desktop| Electron 34                 | Chromium + Node.js, ecossistema maduro, ampla adocao     |
| UI Library       | React 19                    | Componentes reativos, hooks, ecossistema rico            |
| State Management | Zustand v5                  | API simples, sem boilerplate, stores isoladas            |
| Data Fetching    | TanStack Query v5           | Cache automatico, revalidacao, devtools                  |
| Styling          | Tailwind CSS v4             | Engine reescrita, CSS-first config, zero-JS runtime      |
| Build Tool       | electron-vite               | Builds rapidos, HMR para main e renderer                 |
| Empacotamento    | electron-builder            | DMG, NSIS, AppImage, .deb — multi-plataforma             |

</details>

<details>
<summary>Exemplo — Stack com Tauri</summary>

| Camada           | Tecnologia                  | Justificativa                                            |
| ---------------- | --------------------------- | -------------------------------------------------------- |
| Framework Desktop| Tauri 2                     | WebView nativo + Rust backend, binario leve (~10MB)      |
| UI Library       | React 19                    | Componentes reativos, hooks, ecossistema rico            |
| State Management | Zustand v5                  | API simples, sem boilerplate, stores isoladas            |
| Data Fetching    | TanStack Query v5           | Cache automatico, revalidacao, devtools                  |
| Styling          | Tailwind CSS v4             | Engine reescrita, CSS-first config, zero-JS runtime      |
| Build Tool       | Vite                        | Build rapido, HMR nativo, integrado com Tauri            |
| Empacotamento    | tauri-cli                   | DMG, MSI, AppImage, .deb — multi-plataforma              |

</details>

## Tipos de Usuarios

> Quem sao os usuarios do frontend desktop? Quais perfis de acesso existem?

| Perfil            | Descricao               | Nivel de Acesso | Funcionalidades Principais |
| ----------------- | ----------------------- | --------------- | -------------------------- |
| {{Administrador}} | {{Descricao do perfil}} | {{Total}}       | {{Funcionalidades}}        |
| {{Usuario comum}} | {{Descricao do perfil}} | {{Limitado}}    | {{Funcionalidades}}        |
| {{Visitante}}     | {{Descricao do perfil}} | {{Publico}}     | {{Funcionalidades}}        |
| {{Outro perfil}}  | {{Descricao do perfil}} | {{Nivel}}       | {{Funcionalidades}}        |

<!-- APPEND:usuarios -->

> Detalhes sobre autenticacao e autorizacao: (ver 01-arquitetura.md)
