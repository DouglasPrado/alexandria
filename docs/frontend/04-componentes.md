# Componentes

Define a hierarquia de componentes, padroes de composicao e o template de documentacao que cada componente deve seguir. A organizacao em niveis garante reusabilidade e clareza de responsabilidades, evitando componentes que fazem "tudo" e dificultam manutencao.

---

## Hierarquia de Componentes

> Como os componentes sao classificados por nivel de complexidade?

### Primitive Components (UI)

> Componentes atomicos sem logica de negocio. Vivem em `packages/ui/` (monorepo) e sao consumidos via `@alexandria/ui`.

| Componente | Props Principais | Variantes |
| --- | --- | --- |
| Button | variant, size, disabled, loading, icon | primary, secondary, ghost, destructive, icon-only |
| IconButton | icon, size, tooltip, disabled | default, ghost |
| Input | type, placeholder, error, helper, icon | text, password, search |
| Select | options, placeholder, searchable, error | single, searchable |
| Card | padding, border, shadow, onClick | default, outlined, interactive |
| Modal | open, onClose, title, size | default, confirmation, fullscreen |
| Badge | variant, count, size | default, dot, count |
| Avatar | src, name, size | image, initials, fallback |
| Progress | value, max, label, variant | bar, circular, segmented |
| Toast | title, description, variant, duration | success, error, warning, info |
| Alert | title, description, variant, action | info, warning, error, success |
| Skeleton | variant, rows, cols | text, card, avatar, grid |
| Tag | label, color, removable | default, removable |
| Stat | label, value, trend, icon | default |
| Tooltip | content, position, delay | top, bottom, left, right |
| Toggle | checked, onChange, label | default |
| Divider | label, orientation | horizontal, vertical |

<!-- APPEND:primitivos -->

### Composite Components

> Combinacao de primitivos para padroes recorrentes. Vivem em `components/` do app web.

| Componente | Primitivos Usados | Contexto de Uso |
| --- | --- | --- |
| AppShell | Sidebar, Header, Divider | Layout principal com navegacao lateral e header |
| Sidebar | Button, Avatar, Badge, Tooltip, Divider | Navegacao entre features (galeria, nodes, health, cluster) |
| Header | Button, Avatar, Input, Badge | Header de pagina com titulo, breadcrumbs e acoes |
| EmptyState | Button, icone | Estado vazio da galeria, lista de nos, alertas |
| ConfirmDialog | Modal, Button | Confirmacao de acoes destrutivas (drain no, deletar arquivo) |
| SearchBar | Input, Tag, Button | Busca com filtros por tipo, data, tags na galeria |
| StatusIndicator | Badge, Tooltip | Indicador visual de status (online/offline/suspeito) com tooltip |
| MediaGrid | Card, Skeleton, Tooltip | Grid virtualizado para thumbnails de fotos/videos |
| StepWizard | Button, Progress, Card | Wizard multi-step para recovery e setup do cluster |

<!-- APPEND:compostos -->

### Feature Components

> Componentes ligados a um dominio de negocio especifico. Vivem em `features/xxx/components/`.

| Componente | Feature | Dados que Consome |
| --- | --- | --- |
| ClusterSetup | cluster | Formulario de criacao: nome do cluster, seed phrase gerada |
| InviteFlow | cluster | Token de convite, estado de aceitacao, permissao selecionada |
| MemberList | cluster | Lista de membros do cluster com roles e dispositivos |
| PermissionManager | cluster | Permissoes por membro (admin/membro/leitura), acoes de governanca |
| GalleryGrid | gallery | Lista de fotos/videos com thumbnails, metadata EXIF, status de replicacao |
| PhotoCard | gallery | Thumbnail, nome, data, resolucao, contagem de replicas |
| VideoPlayer | gallery | Stream de video sob demanda, controles de reproducao |
| Timeline | gallery | Fotos agrupadas por data/evento/local, navegacao cronologica |
| UploadDropzone | upload | Area de drag-and-drop, tipos aceitos, tamanho maximo |
| SyncStatus | upload | Estado do sync engine (ativo/pausado), arquivos pendentes |
| ProcessingQueue | upload | Fila de processamento: resize → encrypt → chunk → distribute |
| ProgressBar | upload | Progresso por arquivo: bytes enviados, chunks concluidos, replicas |
| NodeList | nodes | Lista de nos com tipo, tier, capacidade, status |
| NodeCard | nodes | Detalhes do no: espaco usado/livre, heartbeat, chunks armazenados |
| CloudConnector | nodes | Fluxo OAuth para Google Drive/Dropbox/OneDrive, config S3/R2 |
| QuotaBar | nodes | Barra de capacidade por no com threshold de alerta em 80% |
| SeedPhraseDisplay | recovery | Exibicao segura das 12 palavras com opcao de copiar/ocultar |
| RecoveryWizard | recovery | Wizard: inserir seed → validar → reconectar nos → rebuild indice |
| VaultUnlock | vault | Formulario de senha do membro para desbloquear vault |
| TokenStatus | vault | Lista de tokens OAuth com status (ativo/expirando/expirado) |
| HealthDashboard | health | Visao consolidada: capacidade total, replicacao, nos, alertas |
| ReplicationStatus | health | Porcentagem de chunks com 3+ replicas, chunks em risco |
| AlertList | health | Lista de alertas (no offline, replicacao baixa, espaco, token) |
| CapacityChart | health | Grafico de capacidade total vs usada com projecao de esgotamento |

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
<summary>Exemplo — Documentacao do PhotoCard</summary>

### PhotoCard

**Descricao:** Card de thumbnail para a galeria. Exibe preview da foto, metadata basico (data, nome) e indicador de replicacao. Suporta selecao, hover com acoes rapidas e click para visualizacao em tela cheia.

**Props:**
| Prop | Tipo | Default | Obrigatoria | Descricao |
| --- | --- | --- | --- | --- |
| thumbnailUrl | `string` | — | Sim | URL do thumbnail pre-gerado (~50KB) |
| name | `string` | — | Sim | Nome do arquivo original |
| date | `Date` | — | Sim | Data de captura (EXIF ou upload) |
| replicas | `number` | — | Sim | Numero de replicas do chunk no cluster |
| selected | `boolean` | `false` | Nao | Se o card esta selecionado para acao em lote |
| onSelect | `() => void` | — | Nao | Callback de selecao |
| onClick | `() => void` | — | Nao | Callback de click para visualizacao |
| onDownload | `() => void` | — | Nao | Callback de download do arquivo otimizado |

**Exemplo de Uso:**
```tsx
<PhotoCard
  thumbnailUrl="/api/thumbnail/abc123"
  name="IMG_2024_natal.webp"
  date={new Date("2024-12-25")}
  replicas={3}
  onClick={() => openLightbox(photo.id)}
  onDownload={() => downloadFile(photo.manifestId)}
/>
```

**Storybook:** [Link para story](http://localhost:6006/?path=/story/gallery-photocard)

</details>

---

## Padroes de Composicao

> Quais padroes de composicao sao adotados?

- **Compound Components** — componentes que funcionam juntos via contexto compartilhado
  - Ex: `<StepWizard><Step /><StepContent /><StepActions /></StepWizard>` (usado no RecoveryWizard e ClusterSetup)
- **Children pattern** — composicao via `children` para flexibilidade
  - Ex: `<Card><CardHeader /><CardBody /><CardFooter /></Card>` (usado no NodeCard e AlertList)
- **Headless hooks** — logica sem UI, o consumidor fornece a renderizacao
  - Ex: `useVirtualGrid()` para virtualizacao da galeria, `useUploadQueue()` para gerenciar fila de uploads
- **Render Props** — quando o consumidor precisa controlar a renderizacao interna
  - Usar apenas quando children pattern nao resolve (ex: `MediaGrid` com renderItem customizado)

**Padroes especificos do Alexandria:**

| Padrao | Onde | Porque |
| --- | --- | --- |
| Compound Components | RecoveryWizard, ClusterSetup | Wizards multi-step com estado compartilhado entre steps |
| Headless hooks | GalleryGrid (useVirtualGrid), UploadDropzone (useDropzone) | Logica complexa de virtualizacao e drag-and-drop reutilizavel entre web e desktop |
| Children pattern | AppShell, Card, Modal | Composicao flexivel de layout sem acoplamento |
| Worker delegation | UploadDropzone, ProcessingQueue | Operacoes pesadas (encrypt, hash, resize) delegadas para Web Workers via hooks |

---

## Quando Criar vs Reutilizar

> Pergunta-guia para decidir se criar novo componente:

| Situacao | Acao | Onde criar |
| --- | --- | --- |
| Sera usado em 2+ features | Crie como componente compartilhado | `packages/ui/` ou `components/` |
| E especifico de uma feature | Crie dentro da feature | `features/xxx/components/` |
| Ja existe no design system | Reutilize `@alexandria/ui` | — |
| E uma variante de componente existente | Adicione variante ao existente | Componente original |
| Precisa funcionar em web + desktop | Crie no package `@alexandria/ui` | `packages/ui/` |
| Envolve logica de crypto/chunks | Crie hook headless no core-sdk | `packages/core-sdk/` |

> Antes de criar, verifique o Storybook e o catalogo de componentes. (ver 03-design-system.md)
