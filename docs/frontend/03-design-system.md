# Design System

Define os tokens de design, padroes visuais e componentes base que garantem consistencia visual em toda a aplicacao. O design system funciona como plataforma compartilhada entre designers e desenvolvedores, servindo como fonte unica de verdade para decisoes visuais. No Alexandria, o design system e distribuido via package `@alexandria/ui` no monorepo, consumido pelo web client (Next.js) e desktop client (Tauri).

---

## Design Tokens

> Quais sao os tokens fundamentais do sistema visual?

### Cores

A paleta reflete a identidade do Alexandria: tons de azul profundo (confianca, durabilidade) com acentos de ambar (alertas de saude do cluster) e verde (integridade confirmada).

| Token | Light | Dark | Uso |
| --- | --- | --- | --- |
| `--color-primary` | #2563EB | #3B82F6 | Acoes principais, links, botoes primarios, indicadores de sync |
| `--color-primary-foreground` | #FFFFFF | #FFFFFF | Texto sobre fundo primario |
| `--color-secondary` | #4F46E5 | #6366F1 | Acoes secundarias, badges de membros, destaques de busca |
| `--color-background` | #FFFFFF | #0F172A | Fundo principal da aplicacao |
| `--color-surface` | #F8FAFC | #1E293B | Fundo de cards, sidebar, modais |
| `--color-surface-elevated` | #FFFFFF | #334155 | Cards com hover, popovers |
| `--color-border` | #E2E8F0 | #334155 | Bordas de cards, separadores, inputs |
| `--color-text` | #0F172A | #F8FAFC | Texto principal |
| `--color-text-muted` | #64748B | #94A3B8 | Texto auxiliar, labels, captions |
| `--color-error` | #DC2626 | #EF4444 | Erros de upload, chunks corrompidos, nos perdidos |
| `--color-warning` | #D97706 | #F59E0B | Alertas: replicacao baixa, espaco em 80%, token expirando |
| `--color-success` | #059669 | #10B981 | Replicacao saudavel, upload concluido, integridade OK |
| `--color-info` | #0284C7 | #0EA5E9 | Notificacoes informativas, status de processamento |

<!-- APPEND:cores -->

### Tipografia

| Token | Font Family | Size | Weight | Line Height | Uso |
| --- | --- | --- | --- | --- | --- |
| `heading-1` | Inter | 2rem | 700 | 1.2 | Titulos de pagina (Galeria, Dashboard, Recovery) |
| `heading-2` | Inter | 1.5rem | 600 | 1.3 | Titulos de secao (Nos Online, Fila de Upload) |
| `heading-3` | Inter | 1.25rem | 600 | 1.4 | Subtitulos (detalhes de no, metadata de foto) |
| `body` | Inter | 1rem | 400 | 1.5 | Texto corrido, descricoes |
| `body-sm` | Inter | 0.875rem | 400 | 1.5 | Texto auxiliar, metadados de arquivos |
| `caption` | Inter | 0.75rem | 500 | 1.4 | Labels, badges, timestamps |
| `mono` | JetBrains Mono | 0.875rem | 400 | 1.5 | Hashes SHA-256, seed phrase, cluster_id |

### Espacamento

> Sistema baseado em grid de 4px

| Token | Valor | Uso tipico |
| --- | --- | --- |
| `space-1` | 4px | Gaps minimos, padding de badges |
| `space-2` | 8px | Padding interno de inputs, gap entre icone e texto |
| `space-3` | 12px | Gap entre itens de lista |
| `space-4` | 16px | Padding de cards, margem entre secoes pequenas |
| `space-6` | 24px | Gap da galeria grid, margem entre secoes |
| `space-8` | 32px | Padding de pagina, margem entre blocos |
| `space-12` | 48px | Espacamento vertical entre secoes maiores |
| `space-16` | 64px | Padding vertical de hero/header |

### Breakpoints

| Token | Valor | Dispositivo | Colunas da galeria |
| --- | --- | --- | --- |
| `sm` | 640px | Mobile | 2 colunas |
| `md` | 768px | Tablet | 3 colunas |
| `lg` | 1024px | Desktop | 4 colunas |
| `xl` | 1280px | Wide Desktop | 5 colunas |
| `2xl` | 1536px | Ultra Wide | 6 colunas |

### Sombras e Elevacao

| Token | Valor | Uso |
| --- | --- | --- |
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Cards em repouso |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.07)` | Cards com hover, dropdowns |
| `shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modais, popovers |

### Bordas

| Token | Valor | Uso |
| --- | --- | --- |
| `radius-sm` | 6px | Badges, tags |
| `radius-md` | 8px | Inputs, botoes, cards |
| `radius-lg` | 12px | Modais, cards maiores |
| `radius-full` | 9999px | Avatares, indicadores de status |

---

## Temas

> A aplicacao suporta multiplos temas?

- [ ] Light only
- [x] Light + Dark
- [ ] Customizavel pelo usuario

O tema segue a preferencia do sistema operacional (`prefers-color-scheme`) com opcao de override manual. Implementado via CSS custom properties no Tailwind CSS v4, alternados pelo atributo `data-theme` no `<html>`. <!-- inferido do PRD -->

**Estrategia de implementacao:**

- Tokens definidos como CSS custom properties em `:root` (light) e `[data-theme="dark"]`
- Tailwind consome os tokens via `theme.extend.colors` referenciando as variaveis CSS
- Preferencia persistida em `localStorage` com fallback para `prefers-color-scheme`
- Transicao suave entre temas com `transition: background-color 0.2s, color 0.2s`

```css
:root {
  --color-background: #FFFFFF;
  --color-surface: #F8FAFC;
  --color-text: #0F172A;
  --color-border: #E2E8F0;
  --color-primary: #2563EB;
}

[data-theme="dark"] {
  --color-background: #0F172A;
  --color-surface: #1E293B;
  --color-text: #F8FAFC;
  --color-border: #334155;
  --color-primary: #3B82F6;
}
```

**Consideracoes para a galeria:** No dark mode, thumbnails recebem borda sutil (`--color-border`) para separacao visual do fundo. O fundo da galeria usa `--color-background` para que as fotos sejam o foco visual.

---

## Ferramentas

> Quais ferramentas conectam design e codigo?

| Ferramenta | Proposito | Observacao |
| --- | --- | --- |
| Figma | Design de interfaces, prototipos de fluxos e wireframes | A definir apos aprovacao do PRD (ref: secao 11.2 do PRD) |
| Storybook | Documentacao interativa de componentes do `@alexandria/ui` | Hospedado localmente via `pnpm storybook` <!-- inferido do PRD --> |
| Tailwind CSS v4 | Tokens como CSS custom properties, utility classes | Engine CSS-first, config via CSS |

---

## Catalogo de Componentes Base

> Quais sao os componentes primitivos do design system?

### Interacao

| Componente | Variantes | Props Chave | Uso no Alexandria |
| --- | --- | --- | --- |
| Button | primary, secondary, ghost, destructive, icon-only | `size`, `loading`, `disabled`, `icon` | Upload, confirmar convite, iniciar recovery |
| IconButton | default, ghost | `icon`, `size`, `tooltip` | Acoes em cards (download, delete, info) |
| Toggle | default | `checked`, `onChange` | Ativar/desativar sync engine, dark mode |

### Entrada de Dados

| Componente | Variantes | Props Chave | Uso no Alexandria |
| --- | --- | --- | --- |
| Input | text, password, search | `error`, `helper`, `icon` | Busca de fotos, nome do cluster, senha do vault |
| Select | single, searchable | `options`, `placeholder` | Selecao de provedor cloud, tier do no |
| FileInput | dropzone, button | `accept`, `multiple`, `maxSize` | Upload manual de fotos/videos |
| SeedPhraseInput | 12-word grid | `words`, `onComplete` | Entrada da seed phrase no fluxo de recovery |

### Exibicao de Dados

| Componente | Variantes | Props Chave | Uso no Alexandria |
| --- | --- | --- | --- |
| Card | default, outlined, interactive | `header`, `footer`, `onClick` | Card de no, card de membro, card de alerta |
| Badge | default, dot, count | `color`, `size` | Status de no (online/offline), contagem de replicas |
| Avatar | image, initials, fallback | `src`, `name`, `size` | Avatar de membro do cluster |
| Progress | bar, circular, segmented | `value`, `max`, `label` | Progresso de upload, replicacao de chunk |
| Stat | default | `label`, `value`, `trend`, `icon` | Metricas do dashboard (capacidade, nos, chunks) |
| Tag | default, removable | `label`, `color` | Tags de fotos, tipo de arquivo, tier do no |

### Feedback

| Componente | Variantes | Props Chave | Uso no Alexandria |
| --- | --- | --- | --- |
| Toast | success, error, warning, info | `title`, `description`, `duration` | Upload concluido, no offline, token expirado |
| Modal | default, confirmation, fullscreen | `title`, `onConfirm`, `onCancel` | Confirmar drain de no, exibir seed phrase |
| EmptyState | default | `icon`, `title`, `description`, `action` | Galeria vazia, nenhum no registrado |
| Skeleton | text, card, avatar, grid | `rows`, `cols` | Loading da galeria, loading do dashboard |
| Alert | info, warning, error, success | `title`, `description`, `action` | Replicacao baixa, espaco em 80%, integridade OK |

### Layout

| Componente | Variantes | Props Chave | Uso no Alexandria |
| --- | --- | --- | --- |
| AppShell | sidebar, minimal | `nav`, `header`, `footer` | Layout principal da aplicacao |
| Sidebar | expanded, collapsed | `items`, `activeItem` | Navegacao entre features (galeria, nodes, health) |
| Header | default | `title`, `breadcrumbs`, `actions` | Header de pagina com titulo e acoes |
| Tooltip | top, bottom, left, right | `content`, `delay` | Info sobre status de nos, significado de metricas |
| Divider | horizontal, vertical | `label` | Separacao de secoes |

<!-- APPEND:catalogo -->

---

## Catalogo de Componentes Compostos

> Padroes compostos derivados da pagina /gallery, construidos a partir dos primitivos acima.

### Navegacao

| Componente | Variantes | Props Chave | Uso no Alexandria |
| --- | --- | --- | --- |
| Sidebar | expanded, collapsed | `items`, `activeItem`, `footer` | Navegacao principal: Galeria, Nos, Saude, Vault, Cluster |
| NavItem | default, active, with-badge | `icon`, `label`, `badge`, `active` | Item individual da sidebar com icone 18px e label 14px/500 |
| Breadcrumb | 2-level, 3-level | `segments` | Navegacao hierarquica no header (Home / Galeria / Arquivo) |

**Sidebar — Especificacoes visuais:**
- Largura fixa: 240px
- Fundo: `--color-surface` (#F8FAFC)
- Borda direita: 1px solid `--color-border` (#E2E8F0)
- Padding: 24px 16px
- Logo: Inter 700 / 18px / #0F172A
- NavItem default: padding 8px 12px, radius 8px, gap 10px, texto 14px/400 `--color-text-muted`
- NavItem active: background #EFF6FF, texto 14px/500 `--color-primary`
- NavItem badge: pill com background #FEF2F2, texto 11px/600 `--color-error`
- Footer: gap 4px entre itens (Configuracoes, Sair)

**Breadcrumb — Especificacoes visuais:**
- Segmentos inativos: Inter 400 / 14px / #94A3B8
- Segmento ativo (ultimo): Inter 500 / 14px / #0F172A
- Separador: "/" em #94A3B8, gap 8px entre segmentos

### Status e Indicadores

| Componente | Variantes | Props Chave | Uso no Alexandria |
| --- | --- | --- | --- |
| SyncStatus | synced, syncing, offline, error | `status`, `message` | Indicador de sincronizacao no header da aplicacao |
| PageHeader | default, with-actions | `title`, `subtitle`, `actions` | Titulo da pagina com contagem ou acoes contextuais |

**SyncStatus — Especificacoes visuais:**
- Dot: 6px, border-radius full
- Texto: Inter 400 / 13px, cor correspondente ao status
- Cores: synced=#059669, syncing=#2563EB, offline=#D97706, error=#DC2626
- Gap: 6px entre dot e texto

**PageHeader — Especificacoes visuais:**
- Titulo: heading-2 (Inter 700 / 24px / #0F172A)
- Subtitulo/contagem: Inter 400 / 13px / `--color-text-muted`
- Layout: justify-content space-between

### Busca e Filtros

| Componente | Variantes | Props Chave | Uso no Alexandria |
| --- | --- | --- | --- |
| SearchInput | default, focused | `placeholder`, `value`, `onSearch` | Busca de fotos por nome, data ou tags |
| FilterTabs | default | `tabs`, `activeTab`, `onChange` | Filtro por tipo de arquivo: Fotos, Videos, Todos, RAW |

**SearchInput — Especificacoes visuais:**
- Icone: lupa 16px, stroke #94A3B8 (default) ou #2563EB (focused)
- Padding: 9px 14px, border-radius 8px, gap 8px
- Borda: 1px solid `--color-border` (default) ou `--color-primary` (focused)
- Placeholder: Inter 400 / 14px / #94A3B8

**FilterTabs — Especificacoes visuais:**
- Tab active: background #EFF6FF, texto Inter 500 / 13px / `--color-primary`
- Tab default: border 1px solid `--color-border`, texto Inter 400 / 13px / `--color-text-muted`
- Padding: 8px 14px, border-radius 8px, gap 8px entre tabs

### Galeria

| Componente | Variantes | Props Chave | Uso no Alexandria |
| --- | --- | --- | --- |
| PhotoThumbnail | default, video, selected | `src`, `filename`, `type`, `selected` | Thumbnail 172x172 na grade de fotos |
| MonthGroup | default | `month`, `year`, `children` | Agrupamento temporal de fotos na galeria |

**PhotoThumbnail — Especificacoes visuais:**
- Dimensao: 172x172px (responsivo conforme breakpoint)
- Border-radius: `radius-sm` (6px)
- Padding: 8px
- Filename overlay: Inter 400 / 11px, posicionado no bottom
- Variante selected: border 2px solid `--color-primary`
- Grid gap: `space-2` (8px) entre thumbnails

**MonthGroup — Especificacoes visuais:**
- Label do mes: Inter 600 / 14px / `--color-text`
- Gap: `space-3` (12px) entre label e grid
- Gap entre grupos: `space-6` (24px)

> Documentacao completa dos componentes: (ver 04-componentes.md)
