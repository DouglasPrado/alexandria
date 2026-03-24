# Design System

Define os tokens de design, padroes visuais e componentes base que garantem consistencia visual em toda a aplicacao. O design system funciona como plataforma compartilhada entre designers e desenvolvedores, servindo como fonte unica de verdade para decisoes visuais.

---

## Design Tokens

> Quais sao os tokens fundamentais do sistema visual?

### Cores

Paleta base derivada de Beautiful Blues (Coolors) — transmite confianca, seguranca e durabilidade, alinhada com a identidade do Alexandria como sistema de preservacao familiar.

**Paleta de 5 cores:**

| Cor | Hex | Papel |
| --- | --- | --- |
| Cor 1 (ancora) | `#011F4B` | `--primary` — CTA, botoes principais, links |
| Cor 2 (complementar) | `#03396C` | `--accent` — destaques, hover states |
| Cor 3 (neutra) | `#005B96` | `--secondary` — backgrounds alternativos, badges |
| Cor 4 (atencao) | `#6497B1` | `--info` — informacional, status neutro |
| Cor 5 (suave) | `#B3CDE0` | `--muted` — areas desabilitadas, bordas suaves |

<!-- do blueprint: 01-vision.md — identidade de seguranca, confianca e preservacao familiar -->

**Mapeamento completo para CSS Variables (globals.css):**

```css
@layer base {
  :root {
    --radius: 0.625rem;

    /* Backgrounds */
    --background: oklch(0.985 0.002 250);       /* #F8FAFC — fundo principal */
    --foreground: oklch(0.145 0.030 250);        /* #011F4B derivado — texto principal */

    /* Cards e Popovers */
    --card: oklch(0.995 0.001 250);              /* #FFFFFF — fundo de cards */
    --card-foreground: oklch(0.145 0.030 250);   /* texto em cards */
    --popover: oklch(0.995 0.001 250);           /* fundo de popovers */
    --popover-foreground: oklch(0.145 0.030 250);

    /* Cores semanticas */
    --primary: oklch(0.250 0.060 250);           /* #011F4B — CTA, botoes principais */
    --primary-foreground: oklch(0.985 0.002 250);/* texto sobre primary */
    --secondary: oklch(0.920 0.020 250);         /* #E8F0FE — backgrounds secundarios */
    --secondary-foreground: oklch(0.250 0.060 250);
    --accent: oklch(0.320 0.065 250);            /* #03396C — destaques, hovers */
    --accent-foreground: oklch(0.985 0.002 250);
    --muted: oklch(0.920 0.010 250);             /* areas desabilitadas */
    --muted-foreground: oklch(0.520 0.020 250);  /* texto muted */

    /* Status */
    --destructive: oklch(0.550 0.200 25);        /* #DC2626 — erros, delete */
    --destructive-foreground: oklch(0.985 0.002 250);
    --success: oklch(0.550 0.170 155);           /* #059669 — sucesso */
    --success-foreground: oklch(0.985 0.002 250);
    --warning: oklch(0.700 0.160 75);            /* #D97706 — alertas */
    --warning-foreground: oklch(0.150 0.030 75);
    --info: oklch(0.550 0.080 240);              /* #6497B1 — informacional */
    --info-foreground: oklch(0.985 0.002 250);

    /* Bordas e inputs */
    --border: oklch(0.870 0.015 250);            /* bordas gerais */
    --input: oklch(0.870 0.015 250);             /* bordas de inputs */
    --ring: oklch(0.250 0.060 250);              /* focus ring = primary */

    /* Charts (5 cores da paleta) */
    --chart-1: oklch(0.250 0.060 250);           /* #011F4B */
    --chart-2: oklch(0.320 0.065 250);           /* #03396C */
    --chart-3: oklch(0.430 0.090 240);           /* #005B96 */
    --chart-4: oklch(0.550 0.080 240);           /* #6497B1 */
    --chart-5: oklch(0.780 0.060 240);           /* #B3CDE0 */

    /* Sidebar */
    --sidebar: oklch(0.970 0.005 250);
    --sidebar-foreground: oklch(0.145 0.030 250);
    --sidebar-primary: oklch(0.250 0.060 250);
    --sidebar-primary-foreground: oklch(0.985 0.002 250);
    --sidebar-accent: oklch(0.940 0.015 250);
    --sidebar-accent-foreground: oklch(0.250 0.060 250);
    --sidebar-border: oklch(0.870 0.015 250);
    --sidebar-ring: oklch(0.250 0.060 250);
  }

  .dark {
    /* Backgrounds */
    --background: oklch(0.145 0.030 250);        /* fundo principal dark */
    --foreground: oklch(0.920 0.010 250);        /* texto principal dark */

    /* Cards e Popovers */
    --card: oklch(0.200 0.030 250);
    --card-foreground: oklch(0.920 0.010 250);
    --popover: oklch(0.200 0.030 250);
    --popover-foreground: oklch(0.920 0.010 250);

    /* Cores semanticas */
    --primary: oklch(0.780 0.060 240);           /* #B3CDE0 — primary invertido */
    --primary-foreground: oklch(0.145 0.030 250);
    --secondary: oklch(0.220 0.030 250);
    --secondary-foreground: oklch(0.870 0.015 250);
    --accent: oklch(0.550 0.080 240);            /* #6497B1 */
    --accent-foreground: oklch(0.145 0.030 250);
    --muted: oklch(0.250 0.020 250);
    --muted-foreground: oklch(0.600 0.015 250);

    /* Status */
    --destructive: oklch(0.600 0.200 25);
    --destructive-foreground: oklch(0.985 0.002 250);
    --success: oklch(0.600 0.170 155);
    --success-foreground: oklch(0.145 0.030 250);
    --warning: oklch(0.750 0.160 75);
    --warning-foreground: oklch(0.150 0.030 75);
    --info: oklch(0.600 0.080 240);
    --info-foreground: oklch(0.145 0.030 250);

    /* Bordas e inputs */
    --border: oklch(0.300 0.020 250);
    --input: oklch(0.300 0.020 250);
    --ring: oklch(0.780 0.060 240);

    /* Charts */
    --chart-1: oklch(0.780 0.060 240);
    --chart-2: oklch(0.600 0.080 240);
    --chart-3: oklch(0.500 0.090 240);
    --chart-4: oklch(0.380 0.065 250);
    --chart-5: oklch(0.280 0.060 250);

    /* Sidebar */
    --sidebar: oklch(0.170 0.030 250);
    --sidebar-foreground: oklch(0.920 0.010 250);
    --sidebar-primary: oklch(0.780 0.060 240);
    --sidebar-primary-foreground: oklch(0.145 0.030 250);
    --sidebar-accent: oklch(0.250 0.025 250);
    --sidebar-accent-foreground: oklch(0.870 0.015 250);
    --sidebar-border: oklch(0.300 0.020 250);
    --sidebar-ring: oklch(0.780 0.060 240);
  }
}
```

<!-- APPEND:cores -->

### Tipografia

**Par de fontes:** Merriweather (heading) + Montserrat (body) — caloroso e confiavel, sensacao de album de familia com UI moderna.

<!-- do blueprint: 01-vision.md — produto familiar, preservacao de memorias, acessivel para usuarios nao-tecnicos -->

**Import Google Fonts:**

```css
@import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Montserrat:wght@300;400;500;600;700&display=swap');
```

**Tokens de tipografia:**

| Token | Font Family | Uso |
| --- | --- | --- |
| `--font-heading` | `'Merriweather', serif` | Titulos h1-h3, hero, destaque |
| `--font-body` | `'Montserrat', sans-serif` | Corpo de texto, paragrafos, labels, UI |
| `--font-mono` | `'JetBrains Mono', monospace` | Codigo, hashes, seed phrases, dados tecnicos |

**Escala de tamanhos:**

| Token | Size | Uso |
| --- | --- | --- |
| `font-size-xs` | 12px / 0.75rem | Captions, badges, metadata |
| `font-size-sm` | 14px / 0.875rem | Labels, textos auxiliares, botoes pequenos |
| `font-size-base` | 16px / 1rem | Corpo de texto padrao |
| `font-size-lg` | 18px / 1.125rem | Subtitulos, lead text |
| `font-size-xl` | 20px / 1.25rem | Heading 3 |
| `font-size-2xl` | 24px / 1.5rem | Heading 2 |
| `font-size-3xl` | 30px / 1.875rem | Heading 1 |
| `font-size-4xl` | 36px / 2.25rem | Hero, pagina titulo |

**Escala de pesos:**

| Token | Weight | Uso |
| --- | --- | --- |
| `font-light` | 300 | Texto decorativo, grandes numeros |
| `font-regular` | 400 | Corpo de texto, paragrafos |
| `font-medium` | 500 | Labels, nav items, enfase leve |
| `font-semibold` | 600 | Subtitulos, botoes, table headers |
| `font-bold` | 700 | Headings, CTA, destaque forte |

**Alturas de linha:**

| Token | Valor | Uso |
| --- | --- | --- |
| `leading-tight` | 1.25 | Headings, titulos curtos |
| `leading-normal` | 1.5 | Corpo de texto |
| `leading-relaxed` | 1.75 | Textos longos, paragrafos extensos |

### Espacamento

> Sistema baseado em grid de 4px (Tailwind default)

| Token | Valor | Uso |
| --- | --- | --- |
| `space-0.5` | 2px | Micro ajustes |
| `space-1` | 4px | Gaps minimos, padding de badges |
| `space-2` | 8px | Padding interno de componentes compactos |
| `space-3` | 12px | Gap entre icone e texto |
| `space-4` | 16px | Padding padrao de componentes |
| `space-5` | 20px | Gap entre items de lista |
| `space-6` | 24px | Margem entre secoes pequenas |
| `space-8` | 32px | Padding de cards e containers |
| `space-10` | 40px | Gap entre secoes de pagina |
| `space-12` | 48px | Margem entre blocos maiores |
| `space-16` | 64px | Espacamento de hero/header |

### Breakpoints

| Token | Valor | Dispositivo | Uso |
| --- | --- | --- | --- |
| `sm` | 640px | Mobile landscape | Grid 1 coluna → 2 colunas |
| `md` | 768px | Tablet | Sidebar colapsavel, grid 2-3 colunas |
| `lg` | 1024px | Desktop | Layout completo com sidebar, grid 3-4 colunas |
| `xl` | 1280px | Wide desktop | Galeria com 5+ colunas, containers max-width |
| `2xl` | 1536px | Ultra-wide | Conteudo centralizado, margens generosas |

---

## Temas

> A aplicacao suporta multiplos temas?

- [ ] Light only
- [x] Light + Dark
- [ ] Customizavel pelo usuario

**Estrategia de temas:**

O Alexandria usa **CSS variables com classe `.dark`** no `<html>`, seguindo o padrao shadcn/ui + `next-themes`. A troca de tema e feita via `ThemeProvider` do `next-themes`, que persiste a preferencia no `localStorage` e respeita `prefers-color-scheme` do sistema como default.

<!-- do blueprint: 01-vision.md — OBJ-06: acessivel para usuarios nao-tecnicos, incluindo preferencia automatica de tema -->

**Implementacao:**

```tsx
// app/layout.tsx
import { ThemeProvider } from "next-themes"

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

**Regras de alternancia:**

- Default: `system` (respeita preferencia do OS)
- Toggle manual via botao no header (icone sol/lua)
- Preferencia salva no `localStorage` como `theme`
- Transicoes CSS desabilitadas durante troca para evitar flash

---

## Iconografia

### Lucide Animated — https://lucide-animated.com/

Fonte **primaria** para icones com animacao. Usar para interacoes e feedback visual.

**Casos de uso:**
- Loading states (Loader, RefreshCw animados)
- Upload/download progress (Upload, Download, CloudUpload)
- Estado de saude do cluster (Shield, ShieldCheck, ShieldAlert)
- Transicoes de estado (Check, X, AlertTriangle)
- Onboarding e empty states (FolderOpen, Image, Film)

### shadcn/ui Icons — https://www.shadcn.io/icons

Fonte **complementar** para icones estaticos de UI estrutural.

**Casos de uso:**
- Navegacao (Home, Settings, Users, HardDrive)
- Acoes em botoes (Plus, Trash2, Edit, Copy)
- Menus e dropdowns (ChevronDown, MoreHorizontal, Search)
- Status de nos (Server, Cloud, Smartphone, Monitor)
- Tipos de arquivo (Image, Film, FileText, Archive)

### Tokens de icone

| Token | Valor | Uso |
| --- | --- | --- |
| `icon-size-sm` | 16px | Inline em texto, badges, metadata |
| `icon-size-md` | 20px | Botoes, menus, nav items |
| `icon-size-lg` | 24px | Headers, cards, destaque |
| `icon-size-xl` | 32px | Empty states, hero, onboarding |
| `icon-stroke` | 1.5px | Espessura padrao (2px para sm) |

**Regras:**
- Todos os icones usam `currentColor` para herdar cor do contexto
- Icones animados (lucide-animated) para feedback e transicoes
- Icones estaticos (shadcn/ui icons) para UI estrutural
- Nao misturar icon packs diferentes alem destes dois
- Importar via `lucide-react` (pacote base compartilhado)

---

## Ferramentas

> Quais ferramentas conectam design e codigo?

| Ferramenta | Proposito | Referencia |
| --- | --- | --- |
| shadcn/ui | Biblioteca de componentes base (Radix + Tailwind) | https://ui.shadcn.com |
| Storybook | Documentacao interativa e visual de componentes | Local: `npm run storybook` |
| Tailwind CSS v4 | Framework utilitario para estilizacao | https://tailwindcss.com |
| next-themes | Gerenciamento de temas (light/dark) | https://github.com/pacocoursey/next-themes |
| Coolors | Paleta de cores e validacao de contraste | https://coolors.co |
| Fontpair | Escolha de pares tipograficos | https://www.fontpair.co |

---

## Catalogo de Componentes Base

> Quais sao os componentes primitivos do design system? Todos via shadcn/ui (Radix UI + Tailwind).

| Componente | Variantes | Status | Prioridade |
| --- | --- | --- | --- |
| Button | primary, secondary, ghost, destructive, outline, link | Pronto | P0 |
| Input | text, password, search, number, file | Pronto | P0 |
| Select | single, multi, searchable (via Combobox) | Pronto | P0 |
| Card | default, outlined, elevated | Pronto | P0 |
| Avatar | image, initials, fallback | Pronto | P0 |
| Badge | default, secondary, destructive, outline | Pronto | P0 |
| Dialog | default, confirmation (alert-dialog), fullscreen | Pronto | P0 |
| Toast (Sonner) | success, error, warning, info | Pronto | P0 |
| Tooltip | top, bottom, left, right | Pronto | P1 |
| Skeleton | text, card, avatar, table, gallery | Pronto | P1 |
| Progress | linear, circular (upload/processing) | Pronto | P1 |
| DropdownMenu | default, with icons, with shortcuts | Pronto | P1 |
| Sheet | left (sidebar mobile), right (details panel) | Pronto | P1 |
| Tabs | default, underline (galeria views) | Pronto | P1 |
| Table | sortable, selectable (file listing) | Pronto | P2 |
| Command | palette (busca global de arquivos) | Planejado | P2 |

<!-- APPEND:catalogo -->

> Documentacao completa dos componentes: (ver 04-componentes.md)

---

## Acessibilidade (a11y)

> Quais padroes de acessibilidade o design system segue?

**Meta:** WCAG 2.1 AA

<!-- do blueprint: 01-vision.md — OBJ-06: acessivel para usuarios nao-tecnicos, incluindo membros da familia de diferentes idades -->

### Contraste de Cores

| Par de Cores | Ratio Minimo | Tipo | Status |
| --- | --- | --- | --- |
| `--foreground` sobre `--background` (#011F4B / #F8FAFC) | 14.5:1 (AA+) | Texto corpo | Conforme |
| `--foreground` sobre `--card` (#011F4B / #FFFFFF) | 15.4:1 (AA+) | Texto em cards | Conforme |
| `--destructive` sobre `--background` (#DC2626 / #F8FAFC) | 4.6:1 (AA) | Mensagens de erro | Conforme |
| `--muted-foreground` sobre `--background` | 4.5:1 (AA) | Placeholders, hints | Conforme |
| `--primary` sobre `--primary-foreground` (#011F4B / #F8FAFC) | 14.5:1 (AA+) | Botoes primarios | Conforme |

### Componentes Acessiveis

| Componente | Requisitos a11y | ARIA Patterns |
| --- | --- | --- |
| Button | Focavel via Tab, ativavel via Enter/Space, `aria-label` se icone-only, `aria-disabled` quando desabilitado | `role="button"` |
| Dialog | Focus trap, Esc para fechar, `aria-modal="true"`, `aria-labelledby` no titulo | `role="dialog"` |
| Toast | `aria-live="polite"` para info/success, `"assertive"` para error, auto-dismiss nao bloqueia acao | `role="status"` ou `role="alert"` |
| Input | Label associada via `htmlFor`, `aria-invalid` em erro, `aria-describedby` para hint/error message | — |
| Select | Navegavel via setas, Enter para selecionar, Esc para fechar, `aria-expanded` | `role="listbox"` |
| Progress | `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, label descritivo do upload | `role="progressbar"` |
| Gallery Grid | Navegavel via setas, Enter para abrir preview, `aria-label` com nome do arquivo | `role="grid"` |

<!-- APPEND:a11y -->

### Checklist de Acessibilidade

- [x] Todo texto atende ratio de contraste WCAG AA (4.5:1 normal, 3:1 large)
- [x] Todo componente interativo e focavel via teclado
- [ ] Toda imagem tem alt text descritivo
- [ ] Formularios tem labels associadas e mensagens de erro acessiveis
- [ ] Modais tem focus trap e Esc para fechar
- [ ] Navegacao funciona 100% via teclado
- [ ] Screen reader anuncia mudancas de estado (aria-live)
- [ ] Nenhuma informacao transmitida apenas por cor (usar icone + texto)
