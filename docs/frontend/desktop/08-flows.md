# Fluxos de Interface

Documenta os fluxos criticos de interacao do usuario com o frontend desktop. Cada fluxo mostra o caminho do usuario, os componentes envolvidos e os pontos de decisao/erro. Inclui interacoes especificas do desktop como drag-and-drop de arquivos do OS, atalhos de teclado, notificacoes nativas e acesso ao file system. Esses fluxos sao a base para testes E2E e validacao de requisitos.

---

## Fluxos Criticos

> Quais sao os 3-5 fluxos mais importantes da aplicacao?

| #   | Fluxo                                  | Atores                                                     | Criticidade                           |
| --- | -------------------------------------- | ---------------------------------------------------------- | ------------------------------------- |
| 1   | Desbloqueio do Vault e Primeiro Acesso | Qualquer membro da familia                                 | Maxima — bloqueio de toda a UI        |
| 2   | Onboarding: Criar ou Entrar no Cluster | Administrador Familiar (criar) / Membro convidado (entrar) | Maxima — pre-requisito para uso       |
| 3   | Sync Automatico de Pasta               | Fotografo Amador / Membro Familiar                         | Maxima — valor central do app desktop |
| 4   | Upload Manual via Drag-and-Drop        | Qualquer membro                                            | Alta — acao frequente                 |
| 5   | Recovery via Seed Phrase (no Desktop)  | Administrador Familiar                                     | Alta — resiliencia do sistema         |

---

### Fluxo 1: Desbloqueio do Vault e Primeiro Acesso

> Usuario abre o app e precisa desbloquear o vault local com sua senha antes de acessar qualquer funcionalidade. O vault contem as chaves de criptografia do membro.

<!-- do blueprint: 02-architecture_principles.md — Zero-Knowledge; desktop/05-state.md — authStore, vault:unlock IPC; desktop/07-routes.md — /unlock rota publica -->

**Passos:**

1. Usuario abre o app (cold start ou retorno do tray)
2. App verifica `authStore.isVaultUnlocked` — se `false`, renderiza `UnlockScreen` (rota `/unlock`)
3. `UnlockScreen` exibe input de senha + logo Alexandria + botao "Desbloquear"
4. Usuario digita senha e pressiona Enter ou clica "Desbloquear"
5. Renderer envia `window.electronAPI.invoke('vault:unlock', { password })` via IPC
6. Main process chama `VaultManager.unlock(password)` — deriva chave via PBKDF2, tenta decriptar vault AES-256-GCM
7. **Se senha correta:** main emite `vault:unlocked` com `{ memberId, role }` via IPC push
8. `authStore` atualiza: `isVaultUnlocked = true`, `member = { id, name, role }`
9. `AuthGuard` detecta mudanca, `navigate('/gallery')` — galeria carrega com as fotos do cluster
10. Sidebar e menu bar ficam habilitados; Sync Engine inicia automaticamente em background

**Componentes envolvidos:**

| Componente            | Responsabilidade                                                              |
| --------------------- | ----------------------------------------------------------------------------- |
| `UnlockScreen`        | Captura senha, exibe feedback de tentativas invalidas                         |
| `AuthGuard`           | Verifica `authStore.isVaultUnlocked`; redireciona para `/gallery` apos unlock |
| `authStore`           | Recebe payload do IPC, armazena estado do membro em memoria                   |
| `VaultManager` (main) | Deriva chave PBKDF2, decripta vault AES-256-GCM, retorna resultado            |

**Tratamento de Erros:**

- **Senha incorreta** → AEAD auth tag falha no main; retorna `{ success: false }`; `UnlockScreen` exibe "Senha incorreta" com contador de tentativas; apos 5 tentativas seguidas, aguarda 30s antes de nova tentativa (rate limiting local)
- **Vault corrompido** → `VaultManager` retorna `{ success: false, error: 'vault_corrupted' }`; exibe dialogo: "Vault danificado. Use a seed phrase para fazer recovery." com botao para `/recovery`
- **App abre sem vault** (primeira vez, sem onboarding) → `authStore.hasCluster = false`; `AuthGuard` redireciona para `/onboarding` em vez de `/unlock`

> Diagrama: [fluxo-unlock.mmd](../diagrams/frontend/desktop/fluxo-unlock.mmd)

---

### Fluxo 2: Onboarding — Criar ou Entrar no Cluster

> Primeiro uso do app: usuario escolhe criar um novo cluster familiar ou entrar em cluster existente via link de convite. Ocorre na `OnboardingWindow` (modal separado da main window).

<!-- do blueprint: 08-use_cases.md — UC-001 (criar cluster), UC-002 (aceitar convite); desktop/07-routes.md — OnboardingWindow modal -->

**Passos (Criar Cluster):**

1. App detecta `authStore.hasCluster = false` → abre `OnboardingWindow` (modal)
2. `OnboardingWizard` exibe 2 opcoes: "Criar cluster familiar" / "Entrar em cluster existente"
3. Admin seleciona "Criar cluster familiar"
4. **Passo 1/3 — Nome do cluster:** Admin digita "Familia Prado", clica "Continuar"
5. **Passo 2/3 — Criar senha do vault:** Admin define senha forte para seu vault local; campo de confirmacao; medidor de forca da senha
6. Main process: `CryptoEngine.generateSeedPhrase()` → gera 12 palavras BIP-39; deriva master key; cria vault criptografado do admin
7. **Passo 3/3 — Salvar seed phrase:** Exibe `SeedPhraseDisplay` com as 12 palavras + instrucoes "Anote em papel. NAO tire screenshot. UNICA vez que aparece."
8. Admin confirma via checkbox obrigatorio: "Anotei a seed phrase em lugar seguro"
9. App chama `POST /clusters` no orquestrador via IPC → cluster criado
10. `OnboardingWindow` fecha; main window ja desbloqueada redireciona para `/gallery` (cluster vazio)
11. Toast: "Cluster 'Familia Prado' criado! Adicione nos para comecar a salvar arquivos."

**Passos (Entrar no Cluster):**

1. Usuario seleciona "Entrar em cluster existente"
2. Exibe campo para colar o link de convite (formato: `https://…/invite/TOKEN`)
3. Usuario cola o link, clica "Validar convite"
4. App chama `GET /invites/TOKEN` via IPC → retorna nome do cluster e role
5. Exibe confirmacao: "Voce foi convidado para 'Familia Prado' como Membro"
6. Usuario define senha do vault local → confirma
7. App chama `POST /invites/TOKEN/accept` + cria vault local via main process
8. `OnboardingWindow` fecha; galeria do cluster carrega

**Componentes envolvidos:**

| Componente            | Responsabilidade                                                   |
| --------------------- | ------------------------------------------------------------------ |
| `OnboardingWizard`    | Multi-step wizard com navegacao entre passos e validacao por passo |
| `SeedPhraseDisplay`   | Grid 3×4 de palavras com mascara e obrigatoriedade de confirmacao  |
| `VaultManager` (main) | Gera seed, deriva master key, cria arquivo vault criptografado     |

**Tratamento de Erros:**

- **Link de convite invalido ou expirado** → Toast de erro "Convite expirado ou invalido. Solicite novo convite ao admin."
- **Orquestrador offline ao criar cluster** → Dialog: "Nao foi possivel criar o cluster. Verifique se o orquestrador esta online."
- **Usuario fecha modal no meio do onboarding** → Se seed ja foi gerada mas cluster nao criado, exibe confirmacao "Voce tem certeza? A seed phrase gerada sera descartada." — vault local e removido

> Diagrama: [fluxo-onboarding.mmd](../diagrams/frontend/desktop/fluxo-onboarding.mmd)

---

### Fluxo 3: Sync Automatico de Pasta (Sync Engine)

> Usuario configura uma pasta para monitoramento e o Sync Engine detecta automaticamente novos arquivos, enfileirando-os para upload em background — sem interacao manual.

<!-- do blueprint: 00-context.md — Sync Engine detecta novos arquivos; desktop/05-state.md — syncStore, IPC sync:progress; 07-critical_flows.md — pipeline completo -->

**Passos:**

1. Usuario acessa `/sync` e clica "Adicionar pasta"
2. `FolderPicker` abre `dialog.showOpenDialog({ properties: ['openDirectory'] })` via IPC
3. Usuario seleciona pasta (ex: `~/Fotos/Família 2025`) e confirma
4. Main process: `SyncEngine.watchFolder(path)` → chokidar inicia watch da pasta
5. `settingsStore.syncFolders` atualizado + salvo no `electron-store`
6. Toast: "Pasta adicionada ao sync. Verificando arquivos existentes..."
7. **Deteccao de arquivos existentes:** Sync Engine escaneia pasta recursivamente; cada arquivo NAO presente no cluster e adicionado a `uploadQueue`
8. **Enquanto sync ativo:** chokidar detecta novos arquivos via `watch('add')` e `watch('change')` → adiciona a `uploadQueue`
9. Main emite `sync:queue-update` para renderer → `syncStore.queue` atualizado → `SyncDashboard` exibe fila
10. Para cada arquivo da fila: main chama `POST /files/upload` via IPC com progress tracking
11. Main emite `sync:progress` com `{ fileId, fileName, progress, status }` para cada chunk enviado
12. `UploadProgressItem` exibe barra de progresso em tempo real
13. Apos upload confirmado (status `ready`): arquivo removido da fila; thumbnail aparece na galeria; notificacao nativa se `settings.notifications = true`
14. Tray icon atualiza para `syncing` durante sync e volta para `idle` quando fila esvazia

**Componentes envolvidos:**

| Componente           | Responsabilidade                                                      |
| -------------------- | --------------------------------------------------------------------- |
| `FolderPicker`       | Invoca `dialog.showOpenDialog` via IPC; adiciona pasta ao `syncStore` |
| `SyncDashboard`      | Exibe status geral: pastas monitoradas, fila, velocidade de upload    |
| `UploadProgressItem` | Progresso individual por arquivo: nome, tamanho, % completado, status |
| `SyncStatusBadge`    | Badge no sidebar item "Sync" com contagem de arquivos na fila         |
| `TrayManager` (main) | Icone animado `tray-syncing.png` + tooltip com contagem               |
| `SyncEngine` (main)  | chokidar watch + `uploadQueue` + orquestracao de uploads              |

**Tratamento de Erros:**

- **Arquivo com formato nao suportado** → entrada na fila com status `skipped`; tooltip: "Formato nao suportado"
- **Upload de arquivo falha (rede)** → status `error` na fila; botao "Retry"; retry automatico apos 60s (3 tentativas)
- **Menos de 1 no ativo** → upload pausado; `AlertBanner` em `/sync`: "Nos insuficientes para replicacao. Sync pausado."
- **Pasta removida do disco** → chokidar emite `unwatch`; entrada em `syncStore` mantida mas marcada como `folder_not_found`; alerta no `SyncDashboard`
- **Arquivo em uso por outro processo** → chokidar re-tenta apos arquivo ser liberado (`awaitWriteFinish` no config)

> Diagrama: [fluxo-sync.mmd](../diagrams/frontend/desktop/fluxo-sync.mmd)

---

### Fluxo 4: Upload Manual via Drag-and-Drop

> Usuario arrasta arquivos diretamente do Finder / Explorer Windows para a janela do Alexandria. Alternativa ao sync automatico para uploads pontuais.

<!-- do blueprint: 08-use_cases.md — UC-004 Upload de Arquivo; desktop/04-components.md — GalleryGrid, SyncDashboard -->

**Passos:**

1. Usuario esta em qualquer rota protegida (galeria, sync ou cluster)
2. Usuario arrasta arquivo(s) do Finder/Explorer para a janela do app
3. `dragover` detectado na janela: overlay de drop zone aparece sobre o conteudo atual — "Solte para fazer upload"
4. Usuario solta os arquivos (`drop` event)
5. Renderer coleta `event.dataTransfer.files[]` e envia via `window.electronAPI.invoke('file:upload-batch', paths[])`
6. Main process valida cada arquivo (MIME type, tamanho, duplicado por hash)
7. Arquivos validos sao adicionados ao `uploadQueue` do Sync Engine
8. Renderer navega automaticamente para `/sync` para mostrar progresso (ou exibe `UploadProgressItem` como overlay flutuante se usuario preferir ficar na galeria)
9. Processo de upload segue mesmo caminho do Fluxo 3 (passos 10-14)

**Componentes envolvidos:**

| Componente                 | Responsabilidade                                               |
| -------------------------- | -------------------------------------------------------------- |
| Drop Zone (overlay global) | Detecta `dragover` na `mainWindow`; exibe area de drop visual  |
| `UploadProgressItem`       | Progresso por arquivo — overlay flutuante ou na pagina `/sync` |
| `GalleryGrid`              | Atualiza grid em tempo real conforme arquivos ficam `ready`    |

**Tratamento de Erros:**

- **Pasta arrastada (nao arquivo)** → Dialog nativo: "Arrastar pastas nao e suportado aqui. Use 'Adicionar pasta ao sync' para monitoramento continuo."
- **Arquivo duplicado (hash identico no cluster)** → Toast: "'foto.jpg' ja existe no cluster. Pulando."
- **Arquivo muito grande (> 10GB)** → Aviso: "Arquivo 'video.mov' (12GB) e muito grande para upload direto. O sync automatico lida melhor com arquivos grandes."

> Diagrama: [fluxo-drag-drop.mmd](../diagrams/frontend/desktop/fluxo-drag-drop.mmd)

---

### Fluxo 5: Recovery via Seed Phrase (UI Desktop)

> Admin perdeu ou precisou trocar o servidor do orquestrador. No cliente desktop, o fluxo de recovery e iniciado pela UI e acompanhado em tempo real via polling.

<!-- do blueprint: 07-critical_flows.md — Fluxo Recovery do Orquestrador; 08-use_cases.md — UC-008; desktop/07-routes.md — /recovery rota publica -->

**Passos:**

1. Admin acessa `/recovery` (disponivel sem vault desbloqueado, via botao na `UnlockScreen` ou Menu > Ajuda)
2. `RecoveryPage` exibe wizard de recovery em 3 etapas
3. **Etapa 1 — URL do novo orquestrador:** Admin insere `https://nova-vps.prado.net:8080`; app valida conectividade via `HEAD /health`
4. **Etapa 2 — Seed phrase:** `SeedPhraseInput` — 12 campos individuais com autocomplete BIP-39; validacao visual por palavra; botao colar (quebra a frase colada automaticamente nos 12 campos)
5. Admin confirma seed → renderer envia `window.electronAPI.invoke('recovery:start', { orchestratorUrl, seedWords })`
6. Main process chama `POST /recovery/start` no novo orquestrador com seed phrase
7. `RecoveryPage` entra em modo de polling (`useRecoveryStatus` — `GET /recovery/status` a cada 5s)
8. **Etapa 3 — Progresso em tempo real:** Timeline de progresso com etapas: Validando seed → Descriptografando vaults → Reconectando nos → Reconstruindo indice → Validando integridade → Concluido
9. Barra de progresso global + log de eventos em scroll (ex: "27.432 manifests reconstruidos", "No 'PC Douglas' reconectado")
10. Ao completar: exibe relatorio final — arquivos recuperados, chunks faltantes (se houver), nos reconectados
11. Admin clica "Continuar para o app" → vault e desbloqueado com a senha do admin → redirect para `/gallery`

**Componentes envolvidos:**

| Componente        | Responsabilidade                                                     |
| ----------------- | -------------------------------------------------------------------- |
| `RecoveryPage`    | Wizard 3-etapas: URL + seed + progresso                              |
| `SeedPhraseInput` | 12 campos com autocomplete BIP-39, validacao visual, suporte a colar |
| Progress Timeline | Etapas de recovery com status (pendente/em-progresso/concluido/erro) |
| Recovery Log      | Feed de eventos em tempo real (scroll automatico para o fim)         |

**Tratamento de Erros:**

- **Palavra invalida na seed** → Campo individual vermelho + tooltip "Palavra nao reconhecida no dicionario BIP-39"
- **Seed valida mas incorreta** → Passo 6 retorna 400; mensagem: "Seed incorreta — vaults nao puderam ser decriptados. Verifique as 12 palavras e tente novamente."
- **Novo orquestrador inacessivel** → Etapa 1 falha; campo de URL com erro: "Nao foi possivel conectar. Verifique se o orquestrador esta online e o firewall liberado."
- **Recovery interrompido (rede cai)** → `useRecoveryStatus` detecta erro; exibe "Conexao perdida. O recovery continua no servidor. Reconectando..." com retry automatico
- **Manifests nao encontrados** → Etapa final com alerta critico: "Nenhum manifest encontrado nos nos disponiveis. Recovery impossivel sem manifests."

> Diagrama: [fluxo-recovery.mmd](../diagrams/frontend/desktop/fluxo-recovery.mmd)

<!-- APPEND:fluxos -->

---

## Interacoes Desktop

> Quais interacoes especificas do desktop sao suportadas?

### Drag-and-Drop de Arquivos do OS

<!-- do blueprint: desktop/04-components.md — Drop Zone global; desktop/08-flows.md — Fluxo 4 -->

| Acao                                                      | Componente                | Comportamento                                                                                             |
| --------------------------------------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------- |
| Arrastar arquivo(s) do Explorer/Finder para a janela      | Drop Zone overlay global  | Overlay azul aparece; `dragover` previne default; `drop` coleta paths e envia via IPC `file:upload-batch` |
| Arrastar foto da galeria para o Explorer/Finder           | `MediaCard` (drag source) | `draggable=true` + `ondragstart` define `text/uri-list` com URL de download; OS inicia download ao soltar |
| Arrastar pasta monitorada do `SyncDashboard` para remover | `SyncFolderList` item     | Reordenacao de pastas (futura funcionalidade); por ora, icone de remover na linha                         |

```typescript
// renderer/components/desktop/DropZone.tsx
// Listener global na mainWindow — intercepta drop em qualquer lugar da UI
useEffect(() => {
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'copy';
    setIsDragOver(true);
  };
  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const paths = Array.from(e.dataTransfer!.files).map((f) => f.path);
    await window.electronAPI.invoke('file:upload-batch', paths);
  };
  const handleDragLeave = () => setIsDragOver(false);

  window.addEventListener('dragover', handleDragOver);
  window.addEventListener('drop', handleDrop);
  window.addEventListener('dragleave', handleDragLeave);
  return () => {
    window.removeEventListener('dragover', handleDragOver);
    window.removeEventListener('drop', handleDrop);
    window.removeEventListener('dragleave', handleDragLeave);
  };
}, []);
```

---

### Keyboard Shortcuts (Atalhos de Teclado)

<!-- do blueprint: desktop/07-routes.md — menu bar com atalhos -->

| Atalho                  | Acao                                     | Contexto             |
| ----------------------- | ---------------------------------------- | -------------------- |
| `Cmd/Ctrl+1`            | Navegar para Galeria (grid)              | Global               |
| `Cmd/Ctrl+2`            | Navegar para Timeline                    | Global               |
| `Cmd/Ctrl+3`            | Navegar para Sync                        | Global               |
| `Cmd/Ctrl+4`            | Navegar para Cluster                     | Global (admin)       |
| `Cmd/Ctrl+5`            | Navegar para Vault                       | Global               |
| `Cmd/Ctrl+,`            | Abrir Configuracoes                      | Global               |
| `Cmd/Ctrl+U`            | Upload manual (abre file dialog)         | Global               |
| `Cmd/Ctrl+L`            | Bloquear vault                           | Global               |
| `Cmd/Ctrl+F`            | Busca de arquivos (abre command palette) | Galeria              |
| `Esc`                   | Fechar media viewer / fechar modal       | Media viewer, modais |
| `Seta esquerda/direita` | Navegar entre fotos no viewer            | Media viewer aberto  |
| `Space`                 | Pausar/retomar sync                      | Pagina `/sync`       |
| `F11`                   | Tela cheia                               | Global               |
| `Cmd/Ctrl+Q`            | Sair completamente do app                | Global               |

<!-- APPEND:shortcuts -->

---

### Notificacoes Nativas do Sistema

<!-- do blueprint: 00-context.md — alertas de saude; desktop/04-components.md — NativeNotification -->

| Evento                       | Titulo                                | Corpo                                             | Acao ao Clicar                                   |
| ---------------------------- | ------------------------------------- | ------------------------------------------------- | ------------------------------------------------ |
| Arquivo sincronizado (batch) | "Alexandria — Sync concluido"         | "12 fotos salvas com sucesso no cluster"          | Abre galeria na rota `/gallery` e foca na janela |
| No offline detectado         | "Alexandria — No offline"             | "PC do Avo ficou offline. Auto-healing iniciado." | Abre `/cluster` e exibe detalhes do no           |
| Atualizacao disponivel       | "Alexandria — Atualizacao disponivel" | "Versao 1.2.0 pronta para instalar"               | Exibe `UpdateBanner` na janela principal         |
| Alerta critico do cluster    | "Alexandria — Atencao"                | "Replicacao abaixo do minimo em 3 arquivos"       | Abre `/cluster/alerts`                           |
| Recovery concluido           | "Alexandria — Recovery completo"      | "27.432 arquivos recuperados com sucesso"         | Foca na janela principal                         |

<!-- APPEND:notifications -->

---

### Acesso ao File System

<!-- do blueprint: desktop/04-components.md — FileDialog IPC; desktop/shared/06-data-layer.md — File System API -->

| Operacao                    | Metodo                                                                   | Dialogo Nativo? | Filtros                                     |
| --------------------------- | ------------------------------------------------------------------------ | --------------- | ------------------------------------------- |
| Selecionar pasta para sync  | `dialog.showOpenDialog({ properties: ['openDirectory'] })`               | Sim             | —                                           |
| Upload manual de arquivo(s) | `dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'] })` | Sim             | JPEG, PNG, HEIC, MP4, MOV, PDF, DOCX e mais |
| Salvar arquivo baixado      | `dialog.showSaveDialog()` + `fs.writeFile()`                             | Sim             | Extensao original preservada                |
| Ler arquivo para upload     | IPC → `fs.readFile()` (stream)                                           | Nao             | —                                           |
| Verificar se pasta existe   | IPC → `fs.access()`                                                      | Nao             | —                                           |

---

## Multi-Window

> O sistema requer multiplas janelas?

- [ ] Nao — janela unica e suficiente
- [x] Sim — janela modal para onboarding

| Janela             | Quando Abre                                               | Comunicacao com Main Window                                   |
| ------------------ | --------------------------------------------------------- | ------------------------------------------------------------- |
| `OnboardingWindow` | App inicia sem cluster configurado (`hasCluster = false`) | IPC: `onboarding:complete` fecha modal e atualiza `authStore` |

> Para detalhes sobre testes de fluxos, (ver 09-tests.md).

---

## Historico de Decisoes

| Data       | Decisao                                                     | Motivo                                                                                            |
| ---------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 2026-03-24 | Drop zone global (em qualquer tela) vs restrita a galeria   | UX: usuario pode arrastar arquivos de qualquer lugar sem precisar navegar para a galeria primeiro |
| 2026-03-24 | Fechar janela occulta app (nao fecha)                       | Sync precisa continuar em background; documentado com dialogo de confirmacao na primeira vez      |
| 2026-03-24 | Recovery como rota publica `/recovery` (sem vault unlocked) | Recovery pode ser necessario sem acesso ao vault; precisa ser acessivel na tela de unlock         |
| 2026-03-24 | SeedPhraseInput com 12 campos individuais (nao textarea)    | Facilita identificacao de palavras incorretas por posicao; autocomplete BIP-39 por campo          |
