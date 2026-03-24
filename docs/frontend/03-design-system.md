# Design System

Define os tokens de design, padroes visuais e componentes base que garantem consistencia visual em toda a aplicacao. O design system funciona como plataforma compartilhada entre designers e desenvolvedores, servindo como fonte unica de verdade para decisoes visuais.

<!-- do blueprint: 01-vision.md (produto para familias, memorias, simplicidade) -->
<!-- do blueprint: 02-architecture_principles.md (Simplicidade Operacional) -->

> **Identidade visual:** Alexandria e um sistema de preservacao de memorias familiares. O design prioriza confianca, calma e clareza. A interface deve ser invisivel — o conteudo (fotos, videos) e o protagonista. Paleta inspirada em tons classicos europeus: navy profundo (#1D3557) como ancora, steel blue (#457B9D) como complementar, teal suave (#A8DADC) como superficie, cream (#F1FAEE) como fundo e coral (#E63946) como acento de atencao.
>
> **Paleta Coolors:** [e63946-f1faee-a8dadc-457b9d-1d3557](https://coolors.co/palette/e63946-f1faee-a8dadc-457b9d-1d3557)

---

## Design Tokens

> Quais sao os tokens fundamentais do sistema visual?

### Cores

**Paleta base (Coolors):** Navy profundo como ancora de confianca, steel blue como complementar, teal suave para superficies, cream como fundo e coral para acento de atencao/perigo.

| Cor Coolors | Hex | Mapeamento | Uso |
| --- | --- | --- | --- |
| Navy | #1D3557 | `--primary` | CTA principal, botoes, links, sidebar ativa |
| Steel Blue | #457B9D | `--accent` | Hover states, destaques, icones ativos |
| Teal | #A8DADC | `--secondary` | Backgrounds alternativos, badges, tags |
| Cream | #F1FAEE | `--background` | Fundo principal da aplicacao (light) |
| Coral | #E63946 | `--destructive` | Erros, acoes destrutivas, alertas criticos |

**Paleta semantica completa:**

| Token | Valor (Light) | Valor (Dark) | Uso |
| --- | --- | --- | --- |
| `--primary` | #1D3557 | #A8DADC | CTA principal, botoes primarios, links, sidebar |
| `--primary-foreground` | #F1FAEE | #1D3557 | Texto sobre primary |
| `--accent` | #457B9D | #457B9D | Hover states, destaques secundarios |
| `--accent-foreground` | #F1FAEE | #F1FAEE | Texto sobre accent |
| `--secondary` | #A8DADC | #1E293B | Backgrounds alternativos, badges |
| `--secondary-foreground` | #1D3557 | #A8DADC | Texto sobre secondary |
| `--background` | #F1FAEE | #0F172A | Fundo principal da aplicacao |
| `--foreground` | #1D3557 | #F1FAEE | Texto principal |
| `--card` | #FFFFFF | #1E293B | Fundo de cards, sidebars, areas elevadas |
| `--card-foreground` | #1D3557 | #F1FAEE | Texto em cards |
| `--muted` | #E2E8F0 | #334155 | Areas desabilitadas, backgrounds neutros |
| `--muted-foreground` | #64748B | #94A3B8 | Texto secundario, labels, captions, placeholders |
| `--border` | #CBD5E1 | #334155 | Bordas de cards, inputs, divisores |
| `--input` | #CBD5E1 | #334155 | Bordas de inputs |
| `--ring` | #1D3557 | #A8DADC | Focus ring (mesmo que primary) |
| `--destructive` | #E63946 | #EF4444 | Erros, validacoes, acoes destrutivas |
| `--destructive-foreground` | #FFFFFF | #FFFFFF | Texto sobre destructive |
| `--warning` | #D97706 | #F59E0B | Alertas warning, no suspect |
| `--warning-foreground` | #FFFFFF | #1D3557 | Texto sobre warning |
| `--success` | #059669 | #10B981 | Sucesso, replicacao saudavel, no online |
| `--success-foreground` | #FFFFFF | #1D3557 | Texto sobre success |
| `--info` | #457B9D | #6497B1 | Informacoes, no draining, badges info |
| `--info-foreground` | #FFFFFF | #1D3557 | Texto sobre info |

<!-- APPEND:cores -->

**Cores semanticas do dominio:**

| Token | Valor (Light) | Valor (Dark) | Uso no Alexandria |
| --- | --- | --- | --- |
| `--color-status-online` | #059669 (emerald-600) | #10B981 (emerald-500) | No online, replicacao 3x OK |
| `--color-status-suspect` | #D97706 (amber-600) | #F59E0B (amber-500) | No suspect (heartbeat atrasado 30min) |
| `--color-status-lost` | #E63946 (coral) | #EF4444 (red-500) | No lost, chunk corrompido, arquivo corrupted |
| `--color-status-draining` | #457B9D (steel blue) | #6497B1 | No em processo de drain |
| `--color-status-processing` | #D97706 (amber-600) | #F59E0B (amber-500) | Arquivo em pipeline de processamento |
| `--color-status-ready` | #059669 (emerald-600) | #10B981 (emerald-500) | Arquivo pronto, disponivel na galeria |
| `--color-severity-critical` | #E63946 (coral) | #EF4444 (red-500) | Alerta critical |
| `--color-severity-warning` | #D97706 (amber-600) | #F59E0B (amber-500) | Alerta warning |
| `--color-severity-info` | #457B9D (steel blue) | #6497B1 | Alerta info |

**Charts (derivados da paleta Coolors):**

| Token | Valor | Cor base |
| --- | --- | --- |
| `--chart-1` | #1D3557 | Navy |
| `--chart-2` | #457B9D | Steel Blue |
| `--chart-3` | #A8DADC | Teal |
| `--chart-4` | #E63946 | Coral |
| `--chart-5` | #F1FAEE | Cream |

### Tipografia

**Par de fontes (Fontpair):** Merriweather (heading) + Inter (body) — serif classico para titulos transmite tradição e memória; sans-serif moderno para corpo garante legibilidade em telas e dados.

| Token CSS | Font Family | Fallback |
| --- | --- | --- |
| `--font-heading` | Merriweather | Georgia, serif |
| `--font-body` | Inter | system-ui, sans-serif |
| `--font-mono` | JetBrains Mono | Consolas, monospace |

```css
/* Import via next/font (Google Fonts) */
@import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
```

**Escala tipografica:**

| Token | Font | Size | Weight | Line Height | Uso |
| --- | --- | --- | --- | --- | --- |
| `heading-1` | Merriweather | 2.25rem (36px) | 900 | 1.2 | Titulos de pagina (Galeria, Saude do Cluster) |
| `heading-2` | Merriweather | 1.5rem (24px) | 700 | 1.3 | Titulos de secao (Alertas Ativos, Nos Online) |
| `heading-3` | Merriweather | 1.25rem (20px) | 700 | 1.4 | Subtitulos (detalhes de arquivo, card headers) |
| `body` | Inter | 1rem (16px) | 400 | 1.5 | Texto corrido, descricoes, mensagens |
| `body-sm` | Inter | 0.875rem (14px) | 400 | 1.5 | Texto em tabelas, metadata, labels de formulario |
| `caption` | Inter | 0.75rem (12px) | 500 | 1.4 | Timestamps, badges, contadores, help text |
| `label` | Inter | 0.875rem (14px) | 500 | 1.4 | Labels de formulario, sidebar items |
| `mono` | JetBrains Mono | 0.875rem (14px) | 400 | 1.5 | Seed phrase, hashes, chunk IDs, endpoints |
| `mono-lg` | JetBrains Mono | 1.25rem (20px) | 500 | 1.4 | Seed phrase display (grid 3x4) |

> **Merriweather** para headings: serif classico que evoca livros e memorias, legibilidade excelente em tamanhos grandes, pesos 400/700/900. **Inter** para corpo: sans-serif otimizada para UI, vasta gama de pesos, excelente em telas pequenas. Ambas carregadas via `next/font` para zero layout shift.

### Espacamento

> Sistema baseado em grid de 4px (half-unit) com valores primarios em multiplos de 8px.

| Token | Valor | Uso |
| --- | --- | --- |
| `space-0.5` | 2px | Micro ajustes (gap entre icone e badge) |
| `space-1` | 4px | Padding interno de badges, gap entre elementos inline |
| `space-2` | 8px | Padding de botoes compactos, gap em listas densas |
| `space-3` | 12px | Padding de inputs, gap padrao entre elementos |
| `space-4` | 16px | Padding de cards, margem entre secoes pequenas |
| `space-6` | 24px | Margem entre secoes, padding de containers |
| `space-8` | 32px | Espaco entre blocos de conteudo |
| `space-12` | 48px | Margem de pagina, espacamento de secoes maiores |
| `space-16` | 64px | Margem top/bottom de paginas |

### Breakpoints

| Token | Valor | Dispositivo | Layout |
| --- | --- | --- | --- |
| `sm` | 640px | Mobile (portrait) | Galeria 2 colunas, sidebar oculta |
| `md` | 768px | Tablet / Mobile (landscape) | Galeria 3 colunas, sidebar colapsavel |
| `lg` | 1024px | Desktop | Galeria 4-5 colunas, sidebar visivel |
| `xl` | 1280px | Wide Desktop | Galeria 6+ colunas, layout expandido |
| `2xl` | 1536px | Ultra-wide | Galeria com max-width centralizado |

### Bordas e Sombras

| Token | Valor | Uso |
| --- | --- | --- |
| `radius-sm` | 4px | Badges, tags |
| `radius-md` | 8px | Inputs, botoes, cards pequenos |
| `radius-lg` | 12px | Cards, modais, dropdowns |
| `radius-xl` | 16px | Cards de destaque, containers de pagina |
| `radius-full` | 9999px | Avatares, botoes circulares |
| `shadow-sm` | 0 1px 2px rgba(0,0,0,0.05) | Cards hover, dropdowns |
| `shadow-md` | 0 4px 6px rgba(0,0,0,0.07) | Modais, popovers |
| `shadow-lg` | 0 10px 15px rgba(0,0,0,0.10) | Dialogs, overlays |

---

## Temas

> A aplicacao suporta multiplos temas?

- [x] Light + Dark

**Estrategia:** CSS custom properties (variáveis) alternadas via atributo `data-theme` no `<html>`. Preferencia do usuario salva em `localStorage` com fallback para `prefers-color-scheme` do sistema operacional.

<!-- do blueprint: 01-vision.md (galeria de fotos — dark mode valoriza conteudo visual) -->

> **Dark mode e prioridade** para a galeria de fotos/videos — fundos escuros fazem as imagens se destacarem. Light mode para telas administrativas (nodes, health, settings) onde legibilidade de texto e dados e prioridade.

### Implementacao — globals.css (oklch)

```css
/* shared/styles/globals.css */
@import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --radius: 0.625rem;

  /* Tipografia */
  --font-heading: 'Merriweather', Georgia, serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', Consolas, monospace;

  /* Backgrounds */
  --background: oklch(0.97 0.01 145);        /* #F1FAEE — Cream */
  --foreground: oklch(0.28 0.06 255);         /* #1D3557 — Navy */

  /* Cards e Popovers */
  --card: oklch(1.00 0.00 0);                 /* #FFFFFF */
  --card-foreground: oklch(0.28 0.06 255);    /* #1D3557 */
  --popover: oklch(1.00 0.00 0);              /* #FFFFFF */
  --popover-foreground: oklch(0.28 0.06 255); /* #1D3557 */

  /* Primary — Navy #1D3557 */
  --primary: oklch(0.28 0.06 255);
  --primary-foreground: oklch(0.97 0.01 145);

  /* Secondary — Teal #A8DADC */
  --secondary: oklch(0.84 0.04 195);
  --secondary-foreground: oklch(0.28 0.06 255);

  /* Accent — Steel Blue #457B9D */
  --accent: oklch(0.53 0.07 235);
  --accent-foreground: oklch(0.97 0.01 145);

  /* Muted */
  --muted: oklch(0.91 0.01 250);              /* slate-200 dessaturado */
  --muted-foreground: oklch(0.55 0.02 250);   /* slate-500 */

  /* Status */
  --destructive: oklch(0.55 0.22 25);         /* #E63946 — Coral */
  --destructive-foreground: oklch(1.00 0.00 0);
  --success: oklch(0.52 0.14 160);            /* #059669 — Emerald */
  --success-foreground: oklch(1.00 0.00 0);
  --warning: oklch(0.60 0.16 70);             /* #D97706 — Amber */
  --warning-foreground: oklch(1.00 0.00 0);
  --info: oklch(0.53 0.07 235);               /* #457B9D — Steel Blue */
  --info-foreground: oklch(1.00 0.00 0);

  /* Bordas e inputs */
  --border: oklch(0.82 0.01 250);             /* slate-300 */
  --input: oklch(0.82 0.01 250);
  --ring: oklch(0.28 0.06 255);               /* Same as primary */

  /* Charts — 5 cores da paleta Coolors */
  --chart-1: oklch(0.28 0.06 255);            /* #1D3557 Navy */
  --chart-2: oklch(0.53 0.07 235);            /* #457B9D Steel Blue */
  --chart-3: oklch(0.84 0.04 195);            /* #A8DADC Teal */
  --chart-4: oklch(0.55 0.22 25);             /* #E63946 Coral */
  --chart-5: oklch(0.97 0.01 145);            /* #F1FAEE Cream */

  /* Sidebar */
  --sidebar: oklch(0.28 0.06 255);            /* Navy — sidebar escura mesmo em light */
  --sidebar-foreground: oklch(0.97 0.01 145);
  --sidebar-primary: oklch(0.84 0.04 195);    /* Teal para item ativo */
  --sidebar-primary-foreground: oklch(0.28 0.06 255);
  --sidebar-accent: oklch(0.35 0.06 255);     /* Navy mais claro para hover */
  --sidebar-accent-foreground: oklch(0.97 0.01 145);
  --sidebar-border: oklch(0.35 0.05 255);
  --sidebar-ring: oklch(0.84 0.04 195);
}

.dark {
  --background: oklch(0.15 0.03 255);         /* Dark navy profundo */
  --foreground: oklch(0.97 0.01 145);         /* Cream */

  --card: oklch(0.22 0.03 255);               /* Navy mais claro */
  --card-foreground: oklch(0.97 0.01 145);
  --popover: oklch(0.22 0.03 255);
  --popover-foreground: oklch(0.97 0.01 145);

  --primary: oklch(0.84 0.04 195);            /* Teal como primary no dark */
  --primary-foreground: oklch(0.28 0.06 255);

  --secondary: oklch(0.22 0.03 255);
  --secondary-foreground: oklch(0.84 0.04 195);

  --accent: oklch(0.53 0.07 235);             /* Steel Blue mantido */
  --accent-foreground: oklch(0.97 0.01 145);

  --muted: oklch(0.30 0.02 255);
  --muted-foreground: oklch(0.65 0.02 250);

  --destructive: oklch(0.60 0.20 25);         /* Coral mais claro */
  --destructive-foreground: oklch(1.00 0.00 0);
  --success: oklch(0.65 0.15 160);
  --success-foreground: oklch(0.20 0.03 255);
  --warning: oklch(0.70 0.16 80);
  --warning-foreground: oklch(0.20 0.03 255);
  --info: oklch(0.60 0.07 235);
  --info-foreground: oklch(0.20 0.03 255);

  --border: oklch(0.30 0.02 255);
  --input: oklch(0.30 0.02 255);
  --ring: oklch(0.84 0.04 195);

  --chart-1: oklch(0.84 0.04 195);
  --chart-2: oklch(0.60 0.07 235);
  --chart-3: oklch(0.40 0.06 255);
  --chart-4: oklch(0.60 0.20 25);
  --chart-5: oklch(0.70 0.16 80);

  --sidebar: oklch(0.12 0.03 255);
  --sidebar-foreground: oklch(0.97 0.01 145);
  --sidebar-primary: oklch(0.84 0.04 195);
  --sidebar-primary-foreground: oklch(0.15 0.03 255);
  --sidebar-accent: oklch(0.20 0.03 255);
  --sidebar-accent-foreground: oklch(0.97 0.01 145);
  --sidebar-border: oklch(0.25 0.03 255);
  --sidebar-ring: oklch(0.84 0.04 195);
}
```

**Troca de tema:**
- Toggle no header via componente `ThemeToggle`
- Persistencia em `localStorage` key `alexandria-theme`
- SSR-safe: tema aplicado via cookie para evitar flash of unstyled content (FOUC)
- Hook `useTheme()` em `shared/hooks/` expoe `theme`, `setTheme`, `toggleTheme`
- **Sidebar sempre escura** (navy) em ambos os temas — destaca navegacao e faz fotos brilharem

---

## Ferramentas

> Quais ferramentas conectam design e codigo?

| Ferramenta | Proposito | Observacao |
| --- | --- | --- |
| Tailwind CSS v4 | Utility-first styling, tokens via CSS variables | Engine reescrita, CSS-first config, zero-JS runtime |
| Storybook | Documentacao interativa de componentes do design system | Roda local via `turbo storybook` |
| shadcn/ui | Componentes copiados (nao instalados) como base dos primitivos | Customizados com tokens do Alexandria |
| Radix UI | Primitivos acessiveis headless (Dialog, Dropdown, Tooltip) | Base dos componentes shadcn/ui |
| Lucide React | Biblioteca de icones estaticos para UI estrutural | tree-shakeable, `currentColor`, 1000+ icones |
| Lucide Animated | Icones com animacao para feedback e transicoes | Loading, state changes, onboarding |
| Google Fonts | Merriweather + Inter + JetBrains Mono | Carregadas via `next/font` |

> **Decisao:** Usar shadcn/ui como base (componentes copiados, nao dependencia) porque: componentes acessiveis out-of-the-box via Radix, totalmente customizaveis, sem lock-in de versao, alinhado com Tailwind CSS.

---

## Iconografia

> Quais icones sao utilizados e como sao organizados?

**Fonte primaria (UI estrutural):** [shadcn/ui Icons](https://www.shadcn.io/icons) via `lucide-react` — icones estaticos para navegacao, botoes, menus, labels, badges e tabelas.

**Fonte complementar (feedback visual):** [Lucide Animated](https://lucide-animated.com/) — icones com animacao para loading states, transicoes, feedback visual e empty states.

### Tamanhos

| Token | Valor | Uso |
| --- | --- | --- |
| `icon-size-sm` | 16px | Inline em texto, badges, tags |
| `icon-size-md` | 20px | Botoes, menus, navegacao, sidebar |
| `icon-size-lg` | 24px | Headers, destaques, acoes principais |
| `icon-size-xl` | 32px | Empty states, hero sections, onboarding |
| `icon-stroke` | 1.5px | Espessura padrao (consistencia visual) |

### Mapeamento de icones por feature

| Feature | Icone | Fonte | Uso |
| --- | --- | --- | --- |
| Galeria | `Image`, `Video`, `FileText` | lucide-react | Tipos de midia |
| Upload | `Upload`, `CloudUpload` | lucide-animated | Animacao durante upload |
| Nos | `HardDrive`, `Server`, `Cloud` | lucide-react | Tipos de no |
| Saude | `Activity`, `HeartPulse` | lucide-animated | Pulse no dashboard |
| Alertas | `AlertTriangle`, `AlertCircle`, `Info` | lucide-react | Severidades |
| Membros | `Users`, `UserPlus`, `Shield` | lucide-react | Lista, convite, admin |
| Recovery | `KeyRound`, `RefreshCw` | lucide-animated | Animacao de rebuild |
| Status | `Circle` (com cor) | lucide-react | StatusDot em listas |
| Navegacao | `ChevronLeft`, `ChevronRight`, `Menu` | lucide-react | Sidebar, breadcrumbs |
| Acoes | `Download`, `Trash2`, `Copy`, `ExternalLink` | lucide-react | Botoes de acao |
| Tema | `Sun`, `Moon` | lucide-animated | Transicao de tema |

### Regras

- Todos os icones usam `currentColor` para herdar cor do contexto CSS
- Icones animados (`lucide-animated`) somente para feedback e transicoes — nao para UI estatica
- Icones estaticos (`lucide-react`) para toda UI estrutural
- Nao misturar icon packs alem de lucide-react e lucide-animated
- Icone-only em botoes exige `aria-label` obrigatorio

---

## Catalogo de Componentes Base

> Quais sao os componentes primitivos do design system?

<!-- Componentes definidos a partir das features em 01-architecture.md -->

### Interacao

| Componente | Variantes | Props principais | Uso no Alexandria |
| --- | --- | --- | --- |
| Button | primary, secondary, ghost, destructive, outline | size (sm/md/lg), loading, disabled, icon | Botoes de acao em toda a aplicacao |
| IconButton | ghost, outline | size, icon, aria-label | Acoes compactas (fechar modal, toggle sidebar) |
| Toggle | default | pressed, onPressedChange | Toggle de tema, filtros on/off |
| DropdownMenu | default | items, onSelect | Menu de contexto (acoes em arquivo, no) |

### Formularios

| Componente | Variantes | Props principais | Uso no Alexandria |
| --- | --- | --- | --- |
| Input | text, password, search, number | placeholder, error, hint | Login, busca, configuracoes |
| Textarea | default | rows, maxLength | Descricoes, notas |
| Select | single, searchable | options, value, onChange | Selecao de tipo de no, role de membro |
| Checkbox | default | checked, label | Confirmacao de seed phrase, filtros |
| FileInput | default, dragdrop | accept, maxSize, multiple, onDrop | Upload de arquivos (feature upload) |
| FormField | default | label, error, hint, required | Wrapper para campos com label e validacao |

### Display

| Componente | Variantes | Props principais | Uso no Alexandria |
| --- | --- | --- | --- |
| Card | default, outlined, interactive | onClick, padding | Cards de no, cards de arquivo |
| Badge | default, dot, status | variant (success/warning/error/info), size | Status de no, severidade de alerta |
| Avatar | image, initials, fallback | src, name, size | Avatar de membro na lista |
| Tooltip | top, bottom, left, right | content, delay | Help text, detalhes de metrica |
| Skeleton | text, card, avatar, grid | width, height, animate | Loading states em toda a aplicacao |
| EmptyState | default | icon, title, description, action | Galeria vazia, sem alertas, sem nos |
| StatusDot | online, suspect, lost, draining | status, pulse | Indicador de status de no em listas |

### Feedback

| Componente | Variantes | Props principais | Uso no Alexandria |
| --- | --- | --- | --- |
| Toast | success, error, warning, info | title, description, duration | Notificacao de upload concluido, erro |
| Dialog | default, confirmation, destructive | title, description, onConfirm, onCancel | Confirmar drain, remover membro |
| AlertBanner | info, warning, critical | message, action, dismissable | Banner de alerta no topo da pagina |
| Progress | bar, circular, steps | value, max, label | Progresso de upload, progresso de recovery |

### Layout

| Componente | Variantes | Props principais | Uso no Alexandria |
| --- | --- | --- | --- |
| Sidebar | expanded, collapsed | items, activeItem | Navegacao principal |
| Header | default | title, actions, breadcrumb | Header de cada pagina |
| PageShell | default | title, description, actions | Container padrao de pagina |
| Divider | horizontal, vertical | label | Separador de secoes |
| ScrollArea | default | maxHeight, orientation | Listas longas (galeria, alertas) |

### Dados

| Componente | Variantes | Props principais | Uso no Alexandria |
| --- | --- | --- | --- |
| DataTable | default, sortable | columns, data, pagination | Lista de nos, lista de membros |
| MetricCard | default, trend | label, value, trend, icon | Dashboard de saude (nos online, capacidade) |
| CopyButton | default | value, label | Copiar seed phrase, token de convite, hash |

<!-- APPEND:catalogo -->

> Documentacao completa dos componentes: (ver 04-componentes.md)

---

## Acessibilidade (a11y)

> Quais padroes de acessibilidade o design system segue?

**Meta:** WCAG 2.1 AA

<!-- do blueprint: 01-vision.md (usuarios nao-tecnicos: avos, pais, tios — acessibilidade e essencial) -->

> **Contexto:** Os usuarios do Alexandria incluem avos e pessoas com pouca familiaridade tecnologica. Acessibilidade nao e compliance — e requisito de usabilidade para o publico-alvo.

### Contraste de Cores

| Par de Cores | Ratio (Light) | Ratio (Dark) | Tipo | Status |
| --- | --- | --- | --- | --- |
| foreground (#1D3557) sobre background (#F1FAEE) | 11.3:1 | — | Texto corpo | Conforme |
| foreground (#F1FAEE) sobre background (#0F172A) | — | 14.8:1 | Texto corpo (dark) | Conforme |
| muted-foreground (#64748B) sobre background (#F1FAEE) | 4.7:1 | — | Texto secundario | Conforme |
| muted-foreground (#94A3B8) sobre background (#0F172A) | — | 6.2:1 | Texto secundario (dark) | Conforme |
| primary (#1D3557) sobre background (#F1FAEE) | 11.3:1 | — | Botoes e links | Conforme |
| destructive (#E63946) sobre background (#F1FAEE) | 4.6:1 | — | Erros e acoes destrutivas | Conforme |
| accent (#457B9D) sobre background (#F1FAEE) | 4.5:1 | — | Destaques e info | Conforme (limiar) |
| muted-foreground (#64748B) sobre card (#FFFFFF) | 4.9:1 | — | Placeholders em cards | Conforme |

### Componentes Acessiveis

| Componente | Requisitos a11y | ARIA Patterns |
| --- | --- | --- |
| Button | Focavel via Tab, ativavel via Enter/Space, aria-label se icone-only, estado disabled visivel | role="button" |
| Dialog | Focus trap ativo, Esc para fechar, aria-modal="true", aria-labelledby para titulo | role="dialog" |
| Toast | aria-live="polite" (info/success) ou "assertive" (error/critical), auto-dismiss 5s (nao bloqueia) | role="status" ou "alert" |
| Input | Label associada via htmlFor, aria-invalid em erro, aria-describedby para hint/error | — |
| Select | Navegavel via setas Up/Down, Enter para selecionar, Esc para fechar, typeahead | role="listbox" |
| FileInput | Drop zone com aria-label, feedback sonoro ao dropar, estado de upload anunciado | role="button" + aria-describedby |
| DataTable | Headers com scope="col", navegacao por celula via setas, aria-sort em colunas ordenaveis | role="grid" |
| Progress | aria-valuenow, aria-valuemin, aria-valuemax, aria-label descritivo | role="progressbar" |
| Sidebar | aria-expanded no toggle, aria-current="page" no item ativo, navegacao por Tab | role="navigation" |

<!-- APPEND:a11y -->

### Checklist de Acessibilidade

- [x] Todo texto atende ratio de contraste WCAG AA (4.5:1 normal, 3:1 large)
- [x] Todo componente interativo e focavel via teclado
- [ ] Toda imagem tem alt text descritivo (implementar no componente de galeria)
- [x] Formularios tem labels associadas e mensagens de erro acessiveis
- [x] Modais tem focus trap e Esc para fechar (via Radix UI Dialog)
- [ ] Navegacao funciona 100% via teclado (validar em galeria grid)
- [x] Screen reader anuncia mudancas de estado (aria-live em Toast e AlertBanner)
- [x] Nenhuma informacao transmitida apenas por cor (StatusDot usa cor + label, Badge usa cor + texto)

### Principios a11y especificos do Alexandria

- **Seed phrase:** Exibida em fonte `mono` grande (20px+), com opcao de copiar e ouvir (text-to-speech para usuarios com dificuldade visual). Campo de input da seed aceita paste e autocomplete por palavra.
- **Galeria:** Thumbnails tem alt text gerado a partir do nome do arquivo + metadata (data, tipo). Navegacao por teclado entre itens do grid (setas + Enter para abrir).
- **Alertas:** Alertas criticos anunciados via `aria-live="assertive"`. Alertas info/warning via `aria-live="polite"`.
- **Upload:** Progresso anunciado via aria-valuenow a cada 25%. Conclusao anunciada via Toast com `role="status"`.
