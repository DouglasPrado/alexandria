# Componentes

Define a hierarquia de componentes, padrões de composição e o template de documentação que cada componente deve seguir. A organização em níveis garante reusabilidade e clareza de responsabilidades, evitando componentes que fazem "tudo" e dificultam manutenção.

<!-- do blueprint: 04-domain-model.md (entidades), 08-use_cases.md (features), shared/03-design-system.md (tokens) -->

---

## Hierarquia de Componentes

> Como os componentes são classificados por nível de complexidade?

### Primitive Components (UI)

> Componentes atômicos sem lógica de negócio. Vivem em `components/ui/`. Baseados em Radix UI primitives + Tailwind CSS. Acessíveis por padrão (WAI-ARIA).

| Componente     | Props Principais                                               | Variantes                                             |
| -------------- | -------------------------------------------------------------- | ----------------------------------------------------- |
| Button         | variant, size, disabled, loading, leftIcon, rightIcon, asChild | primary, secondary, ghost, destructive, outline, link |
| Input          | type, placeholder, error, disabled, leftAddon, rightAddon      | text, password, search, number, email, file           |
| Select         | options, value, onChange, placeholder, searchable              | single, multi, searchable (via Combobox)              |
| Card           | padding, border, shadow, as (element)                          | default, outlined, elevated                           |
| Dialog         | open, onOpenChange, title, description, size                   | default, confirmation (AlertDialog), fullscreen       |
| Badge          | variant, count, dot                                            | default, secondary, destructive, outline              |
| Avatar         | src, name, size, fallback                                      | image, initials, fallback (ícone genérico)            |
| Skeleton       | width, height, borderRadius, animate                           | text, card, avatar, table-row, thumbnail              |
| Toast (Sonner) | variant, title, description, action, duration                  | success, error, warning, info                         |
| Tooltip        | content, side, align, delayDuration                            | top, bottom, left, right                              |
| DropdownMenu   | trigger, items, align, side                                    | default, with icons, with shortcuts                   |
| Checkbox       | checked, onCheckedChange, label, disabled                      | default, indeterminate                                |
| Progress       | value, max, variant, size                                      | linear, circular                                      |
| Tabs           | value, onValueChange, items                                    | default, underline                                    |
| Sheet          | open, onOpenChange, side, title                                | left (sidebar mobile), right (details panel)          |
| Table          | columns, data, sortable, selectable                            | default, sortable, selectable                         |
| Command        | open, onOpenChange, placeholder, items                         | palette (busca global de arquivos)                    |

<!-- APPEND:primitivos -->

### Composite Components

> Combinação de primitivos para padrões recorrentes. Vivem em `components/` ou `components/forms/`.

| Componente    | Primitivos Usados                            | Contexto de Uso                                     |
| ------------- | -------------------------------------------- | --------------------------------------------------- |
| FormField     | Input/Select + Label + FormError             | Campo de formulário com validação (React Hook Form) |
| FormSection   | Card + heading + FormFields                  | Seção agrupada de formulário                        |
| AppShell      | Sidebar + Header + main content              | Layout principal da aplicação autenticada           |
| Sidebar       | Button, Avatar, Badge, nav links             | Navegação lateral persistente                       |
| Header        | Button, Avatar, AlertBell, SearchBar         | Barra superior com ações globais                    |
| EmptyState    | Illustration + Text + Button (CTA)           | Estado vazio de listas e galerias                   |
| ConfirmDialog | AlertDialog + Text + Button (cancel/confirm) | Confirmação de ações destrutivas                    |
| AlertBanner   | Card + Badge (severity) + Text + dismiss     | Alertas inline com severidade visual                |
| Pagination    | Button + Text                                | Navegação entre páginas (cursor-based)              |
| DataTable     | Table + Pagination + Skeleton                | Tabela de dados com loading state                   |
| Stepper       | Steps + Progress + Text                      | Wizard multi-step (setup, recovery)                 |
| CopyButton    | Button + Tooltip + clipboard API             | Botão "Copiar" com feedback visual                  |

<!-- APPEND:compostos -->

### Feature Components

> Componentes ligados a um domínio de negócio específico. Vivem em `features/xxx/components/`.

<!-- do blueprint: 08-use_cases.md (UC-001 a UC-010), 07-critical_flows.md -->

**Feature: gallery**

| Componente           | Dados que Consome              | Descrição                                                        |
| -------------------- | ------------------------------ | ---------------------------------------------------------------- |
| UploadDropzone       | — (evento local)               | Área de drag-and-drop + botão de seleção de arquivos             |
| UploadQueue          | uploadStore (Zustand)          | Lista flutuante (bottom-right) com status de cada upload         |
| UploadQueueItem      | UploadItem (store)             | Progresso individual: barra, percentual, velocidade, retry       |
| GalleryGrid          | useFiles (TanStack Query)      | Grid responsivo de thumbnails com lazy loading e infinite scroll |
| GalleryTimeline      | useFiles (TanStack Query)      | Visualização por data com separadores mês/ano                    |
| FileLightbox         | useFileDetail (TanStack Query) | Modal fullscreen; delega a PDFViewer/VideoPlayer conforme tipo    |
| PDFViewer            | File (download URL + cookies)  | Leitor PDF completo: página a página, zoom, text layer (react-pdf) |
| VideoPlayer          | File (preview URL)             | Player 480p embutido no lightbox                                 |
| FileMetadata         | File (metadata JSONB)          | Painel lateral com EXIF, data, tamanho, localização, páginas (PDF) |
| SearchBar            | — (query params)               | Input com debounce 300ms e filtros rápidos                       |
| FilterChips          | — (query params)               | Chips de filtro ativo: Fotos, Vídeos, Documentos                 |
| DownloadButton       | File (id)                      | Inicia download com indicador de progresso                       |
| ThumbnailPlaceholder | —                              | Skeleton/spinner durante processing                              |

**Feature: nodes**

| Componente              | Dados que Consome         | Descrição                                                                           |
| ----------------------- | ------------------------- | ----------------------------------------------------------------------------------- |
| NodeList                | useNodes (TanStack Query) | Tabela/cards de nós com status, capacidade e heartbeat                              |
| NodeStatusBadge         | Node (status)             | Badge colorido: verde (online), amarelo (suspect), vermelho (lost), azul (draining) |
| AddNodeDialog           | — (formulário)            | Wizard: tipo → configuração → teste de conectividade → confirmação                  |
| NodeConnectivityTest    | — (teste PUT/GET)         | Feedback visual do teste (spinner → check/cross)                                    |
| DrainProgressBar        | Node (drain progress)     | Barra de progresso da migração de chunks                                            |
| DisconnectConfirmDialog | Node (detalhes)           | Dialog com impacto estimado e confirmação                                           |
| ClusterHealthSummary    | useClusterHealth          | Resumo: nós online, replicação, espaço total                                        |

**Feature: cluster**

| Componente          | Dados que Consome | Descrição                                         |
| ------------------- | ----------------- | ------------------------------------------------- |
| SetupClusterForm    | — (formulário)    | Captura nome do cluster e senha do admin          |
| SeedPhraseDisplay   | Cluster (seed)    | Exibe 12 palavras em grid 3×4 com destaque visual |
| SeedConfirmCheckbox | — (estado local)  | Checkbox obrigatório para desbloquear navegação   |
| EmptyStateDashboard | —                 | Estado vazio com CTAs de onboarding               |

**Feature: alerts**

| Componente    | Dados que Consome          | Descrição                                                  |
| ------------- | -------------------------- | ---------------------------------------------------------- |
| AlertBell     | useAlerts (TanStack Query) | Ícone de sino no header com contagem de alertas ativos     |
| AlertDropdown | useAlerts (TanStack Query) | Lista de alertas por severidade com ação                   |
| AlertCard     | Alert (entity)             | Card com severidade, mensagem, timestamp, ação recomendada |

**Feature: recovery**

| Componente       | Dados que Consome       | Descrição                                            |
| ---------------- | ----------------------- | ---------------------------------------------------- |
| SeedPhraseInput  | — (formulário)          | 12 inputs com autocomplete BIP-39 e validação inline |
| RecoveryStepper  | recoveryStore (Zustand) | Stepper vertical com 6 etapas e indicador            |
| RecoveryProgress | recoveryStore (Zustand) | Barra de progresso para etapas longas (rebuild DB)   |
| RecoveryReport   | Recovery result         | Relatório final: arquivos, chunks, nós, alertas      |

**Feature: settings**

| Componente         | Dados que Consome           | Descrição                                    |
| ------------------ | --------------------------- | -------------------------------------------- |
| InviteMemberDialog | — (formulário)              | Formulário de convite: email + role selector |
| InviteLinkCopy     | Invite (link)               | Exibe link com CopyButton                    |
| AcceptInviteForm   | Invite (token)              | Captura nome e senha do convidado            |
| MemberList         | useMembers (TanStack Query) | Lista de membros com role e ações            |
| RoleSelector       | — (select)                  | Dropdown de roles: admin, member, reader     |

**Feature: gallery (componentes adicionais)**

| Componente           | Dados que Consome               | Descrição                                                              |
| -------------------- | ------------------------------- | ---------------------------------------------------------------------- |
| FileIcon             | File (mediaType)                | Mapeia media types para ícones e cores; usado em GalleryGrid e Timeline |
| CodingSchemeBadge    | Manifest (codingScheme, shards) | Badge mostrando "Replication 3x" ou "Erasure RS(10,4)"                 |
| VersionHistoryPanel  | useFileVersions (TanStack Query) | Painel lateral com histórico de versões e upload de nova versão        |

**Feature: nodes (componentes adicionais)**

| Componente    | Dados que Consome                | Descrição                                         |
| ------------- | -------------------------------- | ------------------------------------------------- |
| DedupStatsCard | useDedupStats (TanStack Query)  | Card com estatísticas de deduplicação e economia  |
| TierBadge     | Node (tier)                      | Badge visual para tier: hot (vermelho), warm (amarelo), cold (azul) |

<!-- APPEND:feature-components -->

---

## Template de Documentação

> Todo componente deve seguir este padrão de documentação:

```
### NomeDoComponente

**Descrição:** O que o componente faz

**Props:**
| Prop | Tipo | Default | Obrigatória | Descrição |
| --- | --- | --- | --- | --- |
| prop | tipo | default | sim/não | descrição |

**Exemplo de Uso:**
\`\`\`tsx
<NomeDoComponente prop="valor">
  Conteúdo
</NomeDoComponente>
\`\`\`
```

<details>
<summary>Exemplo — Documentação do Button</summary>

### Button

**Descrição:** Botão reutilizável com variantes visuais, suporte a loading state e ícones. Baseado em Radix Slot para composição com `asChild`.

**Props:**
| Prop | Tipo | Default | Obrigatória | Descrição |
| --- | --- | --- | --- | --- |
| variant | `"primary" \| "secondary" \| "ghost" \| "destructive" \| "outline" \| "link"` | `"primary"` | Não | Estilo visual do botão |
| size | `"sm" \| "md" \| "lg"` | `"md"` | Não | Tamanho do botão |
| loading | `boolean` | `false` | Não | Exibe spinner e desabilita clique |
| disabled | `boolean` | `false` | Não | Desabilita o botão |
| leftIcon | `ReactNode` | — | Não | Ícone à esquerda do label |
| asChild | `boolean` | `false` | Não | Renderiza como filho (Radix Slot) |

**Exemplo de Uso:**

```tsx
<Button variant="primary" size="md" loading={isSubmitting}>
  Salvar alterações
</Button>

<Button variant="destructive" leftIcon={<TrashIcon />}>
  Remover nó
</Button>
```

</details>

---

## Padrões de Composição

> Quais padrões de composição são adotados?

- **Compound Components** — componentes que funcionam juntos via contexto compartilhado
  - Ex: `<Tabs><TabList><Tab /></TabList><TabPanel /></Tabs>`
  - Usado em: Tabs, Stepper, FormSection
- **Children pattern** — composição via `children` para flexibilidade
  - Ex: `<Card><CardHeader /><CardContent /><CardFooter /></Card>`
  - Usado em: Card, Dialog, Sheet, AppShell
- **Headless hooks** — lógica sem UI, o consumidor fornece a renderização
  - Ex: `useUploadQueue()` retorna estado e actions da fila de upload
  - Usado em: upload queue, search com debounce, infinite scroll
- **Render Props** — quando o consumidor precisa controlar a renderização
  - Usar apenas quando children pattern não resolve
  - Ex: `<VirtualizedList renderItem={(file) => <Thumbnail file={file} />} />`
- **Server Components + Client Islands** — Server Component faz fetch; Client Component recebe via props
  - Ex: `page.tsx` (RSC) → `<GalleryGrid files={files} />` (Client Component)
  - Minimiza JavaScript no client; `"use client"` apenas quando necessário

---

## Quando Criar vs Reutilizar

> Pergunta-guia para decidir se criar novo componente:

| Situação                               | Ação                               | Onde criar                        |
| -------------------------------------- | ---------------------------------- | --------------------------------- |
| Será usado em 2+ features              | Crie como componente compartilhado | `components/ui/`                  |
| É específico de uma feature            | Crie dentro da feature             | `features/xxx/components/`        |
| Já existe no design system (shared)    | Reutilize do package `@ui`         | `packages/ui/`                    |
| É uma variante de componente existente | Adicione variante ao existente     | Componente original               |
| Precisa de lógica sem UI               | Crie como hook headless            | `features/xxx/hooks/` ou `hooks/` |
| É primitivo DOM (div, button)          | Use Radix UI primitive + Tailwind  | `components/ui/`                  |

> Antes de criar, verifique o catálogo de componentes do design system. (ver [shared/03-design-system.md](../shared/03-design-system.md))
