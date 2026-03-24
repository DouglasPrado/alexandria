# Componentes

Define a hierarquia de componentes, padroes de composicao e o template de documentacao que cada componente deve seguir. A organizacao em niveis garante reusabilidade e clareza de responsabilidades, evitando componentes que fazem "tudo" e dificultam manutencao.

---

## Hierarquia de Componentes

> Como os componentes sao classificados por nivel de complexidade?

### Primitive Components (UI)

> Componentes atomicos sem logica de negocio. Vivem em `shared/components/ui/`. Baseados em shadcn/ui + Radix UI, customizados com tokens do Alexandria.

<!-- do blueprint: 03-design-system.md (catalogo de componentes base) -->

| Componente | Props Principais | Variantes |
| --- | --- | --- |
| Button | variant, size, disabled, loading, leftIcon, rightIcon | primary, secondary, ghost, destructive, outline |
| IconButton | icon, size, aria-label, variant | ghost, outline |
| Input | type, placeholder, error, hint, disabled | text, password, search, number |
| Textarea | rows, maxLength, placeholder, error | default |
| Select | options, value, onChange, placeholder, searchable | single, searchable |
| Checkbox | checked, label, onChange, disabled | default |
| FileInput | accept, maxSize, multiple, onDrop, dragActive | default, dragdrop |
| FormField | label, error, hint, required, children | default |
| Card | padding, onClick, interactive | default, outlined, interactive |
| Badge | variant, size, dot | success, warning, error, info, default |
| Avatar | src, name, size, fallback | image, initials, fallback |
| Tooltip | content, side, delay | top, bottom, left, right |
| Skeleton | width, height, animate, variant | text, card, avatar, grid |
| Dialog | open, onOpenChange, title, description | default, confirmation, destructive |
| Toast | title, description, variant, duration | success, error, warning, info |
| AlertBanner | message, action, dismissable, variant | info, warning, critical |
| Progress | value, max, label, variant | bar, circular, steps |
| DropdownMenu | items, onSelect, trigger | default |
| Toggle | pressed, onPressedChange | default |
| ScrollArea | maxHeight, orientation | default |
| Divider | label, orientation | horizontal, vertical |
| StatusDot | status, pulse, label | online, suspect, lost, draining, processing |
| CopyButton | value, label, successMessage | default |

<!-- APPEND:primitivos -->

### Composite Components

> Combinacao de primitivos para padroes recorrentes. Vivem em `shared/components/`.

| Componente | Primitivos Usados | Contexto de Uso |
| --- | --- | --- |
| Sidebar | Button, Avatar, Badge, StatusDot, Divider | Navegacao lateral principal com contador de alertas ativos |
| Header | Button, Avatar, DropdownMenu, Toggle | Header de pagina com acoes contextuais, tema e avatar do membro |
| PageShell | Header, Divider, ScrollArea | Container padrao de pagina com titulo, descricao e acoes |
| EmptyState | Button, ilustracao | Estado vazio com CTA (galeria vazia, sem nos, sem alertas) |
| DataTable | Input (search), Button (sort), Badge, Skeleton, Pagination | Listagem de dados tabulares (nos, membros, alertas) |
| Pagination | Button, Input | Navegacao cursor-based em listas longas |
| MetricCard | Card, Badge, Tooltip | Card de metrica com valor, tendencia e tooltip de detalhes |
| FormDialog | Dialog, FormField, Input, Button | Dialog com formulario (convidar membro, registrar no) |
| ConfirmDialog | Dialog, Button | Dialog de confirmacao (drain no, remover membro) |
| SearchBar | Input (search), Select (filtros), Button | Barra de busca com filtros por tipo e periodo |

<!-- APPEND:compostos -->

### Feature Components

> Componentes ligados a um dominio de negocio especifico. Vivem em `features/xxx/components/`.

<!-- do blueprint: 04-domain-model.md (entidades) + 08-use_cases.md (casos de uso) -->

**auth/**

| Componente | Dados que Consome | Descricao |
| --- | --- | --- |
| LoginForm | email, password (local) | Formulario de login com validacao |
| AuthGuard | sessao JWT via authStore | HOC/wrapper que redireciona para login se nao autenticado |
| RoleGate | role do membro via authStore | Renderiza children somente se role e permitida (admin, member) |

**cluster/**

| Componente | Dados que Consome | Descricao |
| --- | --- | --- |
| ClusterSetup | formulario local | Wizard de criacao: nome → gerar seed → confirmar → ativar |
| SeedPhraseDisplay | seed phrase (12 palavras) | Exibe seed em grid 3x4, fonte mono grande, opcao copiar |
| SeedPhraseInput | input local (12 campos) | 12 campos de input para inserir seed no recovery |
| InviteForm | email, role (local) | Formulario para gerar convite com selecao de role |
| InviteAccept | token da URL | Tela de aceite de convite com nome do cluster e role |
| MemberList | GET /members via useMembers | Lista de membros com role, avatar, data de ingresso e acoes |
| MemberCard | Member entity | Card de membro com role badge, acoes de admin (remover, alterar role) |

**gallery/**

| Componente | Dados que Consome | Descricao |
| --- | --- | --- |
| GalleryGrid | GET /files via useFiles | Grid responsivo de thumbnails com lazy loading e infinite scroll |
| GalleryItem | File entity + Preview | Item individual: thumbnail, nome, status badge, menu de contexto |
| TimelineView | GET /files agrupados por data | Timeline cronologica com headers de data e grupos de thumbnails |
| FilePreview | GET /files/:id/preview | Preview ampliado: foto fullscreen, video player 480p, PDF viewer |
| FileDetail | GET /files/:id via useFileDetail | Modal com metadata (EXIF, tamanho, hash), status, acoes (download, delete) |
| SearchBar | filtros locais via useGalleryFilters | Busca por nome + filtros por media_type e periodo |
| GalleryEmpty | nenhum | Empty state com ilustracao e CTA para primeiro upload |

**upload/**

| Componente | Dados que Consome | Descricao |
| --- | --- | --- |
| FileUploader | drop events, file input | Zona de drag-and-drop + seletor de arquivo com validacao de tipo/tamanho |
| UploadQueue | uploadStore (fila de uploads) | Lista de arquivos na fila com preview, nome, tamanho e status |
| UploadProgress | uploadStore (arquivo atual) | Barra de progresso com percentual, velocidade e tempo estimado |
| ProcessingStatus | GET /files/:id (polling status) | Indicador de etapa do pipeline: uploading → processing → distributing → ready |

**nodes/**

| Componente | Dados que Consome | Descricao |
| --- | --- | --- |
| NodeList | GET /nodes via useNodes | Lista de nos com status, tipo, capacidade e acoes |
| NodeCard | Node entity | Card com StatusDot, nome, tipo badge, barra de capacidade usado/total |
| AddNodeForm | formulario local | Formulario com selecao de tipo (local/s3/r2/b2/vps), campos dinamicos por tipo |
| NodeDetail | GET /nodes/:id | Detalhes: endpoint, capacidade, chunks armazenados, ultimo heartbeat |
| DrainProgress | GET /nodes/:id (polling) | Progresso do drain: chunks migrados / total, tempo estimado |

**health/**

| Componente | Dados que Consome | Descricao |
| --- | --- | --- |
| HealthDashboard | GET /cluster/health | Dashboard com metricas: nos online, capacidade, replicacao, arquivos |
| AlertList | GET /alerts via useAlerts | Lista de alertas com severity badge, tipo, mensagem, timestamp |
| AlertDetail | Alert entity | Detalhes do alerta com entidade relacionada, sugestao de acao |
| ReplicationStatus | metricas de saude | Indicador visual: % de chunks com 3+ replicas, chunks em risco |

**recovery/**

| Componente | Dados que Consome | Descricao |
| --- | --- | --- |
| RecoveryForm | SeedPhraseInput + formulario | Tela de recovery: inserir seed → validar → iniciar rebuild |
| RecoveryProgress | GET /recovery/status (polling) | Progresso por etapa: seed → vaults → manifests → rebuild → nodes → integrity |
| RecoveryReport | resultado final do recovery | Relatorio: arquivos recuperados, chunks faltantes, nos reconectados |

**settings/**

| Componente | Dados que Consome | Descricao |
| --- | --- | --- |
| ProfileForm | GET /members/me | Formulario de edicao: nome, email, senha |
| VaultManager | vault status | Visualizacao de credenciais armazenadas no vault (sem exibir valores) |
| SettingsPage | perfil + preferencias | Container com tabs: Perfil, Vault, Preferencias |

<!-- APPEND:feature-components -->

---

## Template de Documentacao

> Todo componente deve seguir este padrao de documentacao:

```
### {{NomeDoComponente}}

**Descricao:** {{O que o componente faz}}
**Camada:** {{Primitive | Composite | Feature}}
**Localização:** {{caminho do arquivo}}

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
**Acessibilidade:** {{notas de a11y relevantes}}
```

<details>
<summary>Exemplo — Documentacao do StatusDot</summary>

### StatusDot

**Descricao:** Indicador visual de status de entidades (nos, alertas). Combina cor + label para acessibilidade (nao depende apenas de cor).
**Camada:** Primitive
**Localização:** `shared/components/ui/StatusDot.tsx`

**Props:**
| Prop | Tipo | Default | Obrigatoria | Descricao |
| --- | --- | --- | --- | --- |
| status | `"online" \| "suspect" \| "lost" \| "draining" \| "processing" \| "ready"` | — | Sim | Status da entidade, define cor |
| pulse | `boolean` | `false` | Nao | Animacao pulsante para status ativos (online, processing) |
| label | `boolean` | `false` | Nao | Exibe label textual ao lado do dot |
| size | `"sm" \| "md"` | `"md"` | Nao | Tamanho do indicador |

**Exemplo de Uso:**
```tsx
<StatusDot status="online" pulse label />    {/* ● Online */}
<StatusDot status="suspect" label />          {/* ● Suspect */}
<StatusDot status="lost" label />             {/* ● Lost */}
```

**Storybook:** [Link para story](http://localhost:6006/?path=/story/statusdot)
**Acessibilidade:** Sempre renderiza `aria-label` com o status. Cor nunca e unica forma de comunicacao — usa label textual ou tooltip.

</details>

<details>
<summary>Exemplo — Documentacao do FileUploader</summary>

### FileUploader

**Descricao:** Zona de upload com drag-and-drop e seletor de arquivo. Valida tipo e tamanho conforme regras de negocio (RN-F4). Suporta multiplos arquivos simultaneos.
**Camada:** Feature
**Localização:** `features/upload/components/FileUploader.tsx`

**Props:**
| Prop | Tipo | Default | Obrigatoria | Descricao |
| --- | --- | --- | --- | --- |
| onFilesSelected | `(files: File[]) => void` | — | Sim | Callback quando arquivos sao selecionados |
| maxFileSize | `number` | `10737418240` (10GB) | Nao | Tamanho maximo por arquivo em bytes |
| accept | `Record<string, string[]>` | foto/video/doc types | Nao | MIME types aceitos |
| disabled | `boolean` | `false` | Nao | Desabilita upload (ex: menos de 3 nos ativos) |
| disabledReason | `string` | — | Nao | Mensagem exibida quando disabled |

**Exemplo de Uso:**
```tsx
<FileUploader
  onFilesSelected={handleUpload}
  disabled={activeNodes < 3}
  disabledReason="Mínimo 3 nós ativos para upload"
/>
```

**Storybook:** [Link para story](http://localhost:6006/?path=/story/fileuploader)
**Acessibilidade:** Drop zone com `role="button"` e `aria-label`. Estado disabled comunicado via `aria-disabled` e mensagem visivel. Feedback sonoro ao dropar arquivo.

</details>

---

## Padroes de Composicao

> Quais padroes de composicao sao adotados?

### Compound Components

Componentes que funcionam juntos via contexto compartilhado. Usado quando subcomponentes tem relacao semantica forte.

```tsx
{/* Card com subcomponentes */}
<Card>
  <Card.Header>
    <Card.Title>NAS Sala</Card.Title>
    <StatusDot status="online" />
  </Card.Header>
  <Card.Content>
    <CapacityBar used={used} total={total} />
  </Card.Content>
  <Card.Footer>
    <Button variant="ghost" size="sm">Detalhes</Button>
  </Card.Footer>
</Card>
```

**Usado em:** Card, Dialog, DataTable, Sidebar, FormField

### Children Pattern

Composicao via `children` para flexibilidade maxima. Padrao default — usar sempre que possivel.

```tsx
{/* PageShell aceita qualquer conteudo */}
<PageShell title="Galeria" description="Fotos e vídeos da família">
  <SearchBar />
  <GalleryGrid />
</PageShell>
```

**Usado em:** PageShell, AuthGuard, RoleGate, ScrollArea, EmptyState

### Render Props / Slots

Quando o consumidor precisa controlar a renderizacao de partes especificas. Usar apenas quando children pattern nao resolve.

```tsx
{/* DataTable com renderizacao customizada de celulas */}
<DataTable
  columns={columns}
  data={nodes}
  renderCell={(node, column) => {
    if (column === 'status') return <StatusDot status={node.status} label />;
    if (column === 'capacity') return <CapacityBar used={node.used} total={node.total} />;
    return node[column];
  }}
/>
```

**Usado em:** DataTable (celulas customizadas), GalleryGrid (item customizado)

### Headless Hooks

Logica sem UI — o consumidor fornece a renderizacao. Para logica complexa reutilizavel entre componentes visuais diferentes.

```tsx
{/* useFileUpload encapsula logica de drag-and-drop + validacao */}
const { isDragging, handleDrop, handleSelect, errors } = useFileUpload({
  maxSize: MAX_FILE_SIZE,
  accept: ACCEPTED_TYPES,
  onFiles: handleUpload,
});
```

**Usado em:** useFileUpload, useInfiniteScroll, usePagination, useSearch

---

## Padroes Server vs Client Components

> Quando usar Server Components e quando usar Client Components?

<!-- do blueprint: 02-architecture_principles.md (Performance by default) -->

| Tipo | Quando usar | Exemplos no Alexandria |
| --- | --- | --- |
| Server Component (default) | Dados estaticos, leitura, sem interatividade | GalleryGrid (SSR da lista), PageShell, Header, MemberList |
| Client Component (`"use client"`) | Interatividade, estado local, event handlers, browser APIs | FileUploader (drag-and-drop), SearchBar (input controlado), Dialog (open/close) |
| Hybrid (Server wrapper + Client child) | Dados do servidor + interatividade na apresentacao | GalleryPage (Server: fetch files) → GalleryGrid (Client: infinite scroll) |

**Regra:** Comece como Server Component. Adicione `"use client"` somente quando necessario (evento, useState, useEffect, browser API). Mantenha a fronteira o mais baixo possivel na arvore de componentes.

---

## Quando Criar vs Reutilizar

> Pergunta-guia para decidir se criar novo componente:

| Situacao | Acao | Onde criar |
| --- | --- | --- |
| Sera usado em 2+ features | Crie como componente compartilhado | `shared/components/ui/` ou `shared/components/` |
| E especifico de uma feature | Crie dentro da feature | `features/xxx/components/` |
| Ja existe no design system (shadcn/ui) | Reutilize e customize via props/variantes | Componente original |
| E uma variante de componente existente | Adicione variante ao existente (prop `variant`) | Componente original |
| Tem logica complexa reutilizavel sem UI | Extraia como hook headless | `features/xxx/hooks/` ou `shared/hooks/` |
| E composicao de 2+ primitivos para padrao recorrente | Crie como Composite | `shared/components/` |

### Checklist antes de criar componente

1. Buscar no Storybook se ja existe componente similar
2. Verificar se uma variante do existente resolve
3. Se for feature-specific, criar dentro da feature (pode promover depois)
4. Documentar props seguindo o template
5. Adicionar story no Storybook
6. Verificar a11y (teclado, aria, contraste)

> Antes de criar, verifique o Storybook e o catalogo de componentes. (ver 03-design-system.md)
