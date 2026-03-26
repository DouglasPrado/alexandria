# Componentes

Define a hierarquia de componentes, padroes de composicao e o template de documentacao que cada componente deve seguir. A organizacao em niveis garante reusabilidade e clareza de responsabilidades, evitando componentes que fazem "tudo" e dificultam manutencao.

---

## Hierarquia de Componentes

> Como os componentes sao classificados por nivel de complexidade?

### Primitive Components (UI)

> Componentes atomicos sem logica de negocio. Vivem em `renderer/components/ui/`.

| Componente | Props Principais                                       | Variantes                                               |
| ---------- | ------------------------------------------------------ | ------------------------------------------------------- |
| Button     | `variant, size, disabled, loading, icon?, asChild?`    | `primary, secondary, ghost, destructive, outline, link` |
| Input      | `type, placeholder, error?, disabled, value, onChange` | `text, password, search`                                |
| Card       | `padding?, className?, asChild?`                       | `default, outlined, elevated`                           |
| Modal      | `open, onOpenChange, title, description?, size?`       | `default, confirmation (AlertDialog), fullscreen`       |
| Badge      | `variant, children`                                    | `default, secondary, destructive, outline`              |
| Avatar     | `src?, name, size?, fallback?`                         | `image, initials, fallback`                             |
| Progress   | `value, max?, label?`                                  | `linear, indeterminate`                                 |
| Skeleton   | `className?, variant?`                                 | `text, card, gallery-item, list-row`                    |

<!-- APPEND:primitivos -->

### Desktop-Specific Components

> Componentes exclusivos da aplicacao desktop. Vivem em `renderer/components/desktop/`.

| Componente         | Props Principais                                                                          | Descricao                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| TitleBar           | `title?: string, showControls?: boolean, draggable?: boolean, children?`                  | Barra de titulo frameless com WindowControls (Windows/Linux); macOS usa decoracao nativa |
| WindowControls     | `onMinimize, onMaximize, onClose, platform: 'win32' \| 'linux'`                           | Botoes min/max/close para janelas sem decoracao nativa; ocultos no macOS                 |
| SystemTray         | `tooltip: string, iconPath: string, menu: TrayMenuItem[]`                                 | Icone e menu de contexto na system tray; persiste mesmo com janela oculta                |
| NativeNotification | `title: string, body: string, icon?: string, onClick?: () => void`                        | Wrapper para `new Notification()` do Electron com permissao OS                           |
| FileDialog         | `type: 'open' \| 'save', filters: FileFilter[], defaultPath?: string, multiple?: boolean` | Invoca `dialog.showOpenDialog` / `showSaveDialog` via IPC — retorna path(s) selecionados |
| UpdateBanner       | `version: string, releaseNotes?: string, onUpdate: () => void, onDismiss: () => void`     | Banner persistente no topo da janela quando nova versao esta disponivel                  |

<!-- APPEND:desktop-components -->

### Composite Components

> Combinacao de primitivos para padroes recorrentes. Vivem em `renderer/components/` ou `renderer/components/forms/`.

| Componente     | Primitivos Usados                     | Contexto de Uso                                                                       |
| -------------- | ------------------------------------- | ------------------------------------------------------------------------------------- |
| AppSidebar     | `Button, Avatar, Badge, Tooltip`      | Navegacao principal entre features (galeria, sync, cluster, vault, settings)          |
| SearchBar      | `Input, Button, DropdownMenu`         | Busca de arquivos por nome, data ou tipo — abre command palette                       |
| NodeStatusRow  | `Badge, Avatar, Progress, Button`     | Linha de tabela representando um no com status, capacidade e acoes                    |
| ProviderForm   | `Input, Select, Button, Badge`        | Formulario de cadastro/edicao de provedor cloud (S3/R2/B2) com teste de conectividade |
| MemberCard     | `Avatar, Badge, Button, DropdownMenu` | Card de membro com avatar, role badge e acoes (alterar role, remover)                 |
| AlertBanner    | `Badge, Button`                       | Alerta de saude do cluster (no offline, replicacao baixa, token expirado)             |
| SeedPhraseGrid | `Input, Button`                       | Grid 3x4 de 12 palavras com mascara/reveal e copia segura para clipboard              |

<!-- APPEND:compostos -->

### Feature Components

> Componentes ligados a um dominio de negocio especifico. Vivem em `renderer/features/xxx/components/`.

| Componente               | Feature/Dominio | Dados que Consome                                                                          |
| ------------------------ | --------------- | ------------------------------------------------------------------------------------------ |
| `UnlockScreen`           | `auth`          | — (formulario de senha; sem dados pre-carregados)                                          |
| `SeedPhraseInput`        | `auth`          | 12 palavras em array para validacao BIP-39                                                 |
| `AuthGuard`              | `auth`          | `authStore.isUnlocked` — redireciona para UnlockScreen se vault travado                    |
| `GalleryGrid`            | `gallery`       | `galleryStore.files[]` — thumbnails com metadata (nome, data, tipo, tamanho)               |
| `MediaViewer`            | `gallery`       | `galleryStore.selectedFile` — URL do preview + metadados EXIF                              |
| `TimelineBar`            | `gallery`       | `galleryStore.timelineIndex` — contagens de fotos por ano/mes                              |
| `AlbumList`              | `gallery`       | `galleryStore.albums[]` — lista de albuns com cover thumbnail                              |
| `SyncDashboard`          | `sync`          | `syncStore.status, syncStore.queue[], syncStore.watchedFolders[]`                          |
| `UploadProgressItem`     | `sync`          | `syncStore.queue[n]` — nome, tamanho, progresso (%), status (pending/uploading/done/error) |
| `FolderPicker`           | `sync`          | `settingsStore.syncFolders[]` — abre FileDialog e dispara `sync:start` via IPC             |
| `ClusterHealthPanel`     | `cluster`       | `clusterStore.health` — nos total/online/suspect/lost, chunks replicados, alertas          |
| `NodeCard`               | `cluster`       | `clusterStore.nodes[n]` — nome, tipo, capacidade, status, heartbeat                        |
| `InviteForm`             | `cluster`       | — (formulario; submete via API para gerar token)                                           |
| `ProviderSetup`          | `cluster`       | `vaultStore.providers[]` — credenciais S3/R2/B2 do vault do membro                         |
| `VaultItem`              | `vault`         | `vaultStore.items[n]` — tipo, nome, valor mascarado, data de criacao                       |
| `ProviderCredentialForm` | `vault`         | `vaultStore.editingItem` — formulario de criacao/edicao de credencial                      |
| `SettingsPage`           | `settings`      | `settingsStore` — tema, pasta sync, notificacoes, auto-start, versao do app                |

<!-- APPEND:feature-components -->

---

## Template de Documentacao

> Todo componente deve seguir este padrao de documentacao:

```
### {{NomeDoComponente}}

**Descricao:** {{O que o componente faz}}

**Props:**
| Prop | Tipo | Default | Obrigatoria | Descricao |
| --- | --- | --- | --- | --- |
| {{prop}} | {{tipo}} | {{default}} | {{sim/nao}} | {{descricao}} |

**Exemplo de Uso:**
\`\`\`tsx
<{{NomeDoComponente}} prop="valor">
  Conteudo
</{{NomeDoComponente}}>
\`\`\`

**Storybook:** [Link para story]({{url}})
```

<details>
<summary>Exemplo — Documentacao do TitleBar</summary>

### TitleBar

**Descricao:** Barra de titulo customizada para janelas frameless, com suporte a drag e botoes nativos de controle (minimizar, maximizar, fechar).

**Props:**
| Prop | Tipo | Default | Obrigatoria | Descricao |
| --- | --- | --- | --- | --- |
| title | `string` | App name | Nao | Texto exibido na barra de titulo |
| showControls | `boolean` | `true` | Nao | Exibe botoes de minimizar, maximizar e fechar |
| draggable | `boolean` | `true` | Nao | Permite arrastar a janela pela barra |
| onMinimize | `() => void` | — | Nao | Callback ao minimizar |
| onMaximize | `() => void` | — | Nao | Callback ao maximizar |
| onClose | `() => void` | — | Nao | Callback ao fechar |

**Exemplo de Uso:**

```tsx
<TitleBar title="Minha Aplicacao" showControls draggable>
  <MenuBar items={menuItems} />
</TitleBar>
```

**Storybook:** [Link para story](http://localhost:6006/?path=/story/desktop-titlebar)

</details>

---

## Padroes de Composicao

> Quais padroes de composicao sao adotados?

- **Compound Components** — componentes que funcionam juntos via contexto compartilhado
  - Ex: `<Tabs><Tab /><TabPanel /></Tabs>`
- **Render Props** — quando o consumidor precisa controlar a renderizacao
  - Usar apenas quando children pattern nao resolve
- **Children pattern** — composicao via `children` para flexibilidade
  - Ex: `<Card><CardHeader /><CardBody /></Card>`
- **Headless components** — logica sem UI, o consumidor fornece a renderizacao
  - Ex: `useCombobox()`, `useDropdown()`
- **IPC-aware components** — componentes que encapsulam comunicacao IPC
  - Ex: `<FileDialog>` que internamente chama `window.electronAPI.showOpenDialog()`

---

## Quando Criar vs Reutilizar

> Pergunta-guia para decidir se criar novo componente:

| Situacao                                       | Acao                               | Onde criar                          |
| ---------------------------------------------- | ---------------------------------- | ----------------------------------- |
| Sera usado em 2+ lugares                       | Crie como componente compartilhado | `renderer/components/ui/`           |
| E especifico de uma feature                    | Crie dentro da feature             | `renderer/features/xxx/components/` |
| E especifico do desktop (tray, menu, titlebar) | Crie como componente desktop       | `renderer/components/desktop/`      |
| Ja existe no design system                     | Reutilize                          | —                                   |
| E uma variante de componente existente         | Adicione variante ao existente     | Componente original                 |

> Antes de criar, verifique o Storybook e o catalogo de componentes. (ver 03-design-system.md)
