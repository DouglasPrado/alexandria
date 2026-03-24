---
name: frontend-design-system
description: Preenche a secao de Design System (03-design-system.md) do frontend blueprint a partir do blueprint tecnico.
---

# Frontend Blueprint — Design System

Preenche `docs/frontend/03-design-system.md` com base no blueprint tecnico e no contexto do projeto.

## Leitura de Contexto

1. Leia `docs/blueprint/04-domain-model.md` — entidades e termos do dominio
2. Leia `docs/blueprint/01-vision.md` — visao e identidade do produto
3. Leia `docs/frontend/03-design-system.md` — template a preencher
4. Leia `docs/prd.md` — complemento se necessario

## Analise de Lacunas

A partir do blueprint tecnico, identifique o que esta disponivel para cada subsecao:

- **Design Tokens (Cores, Tipografia, Espacamento, Breakpoints)**: Quais tokens de design estao definidos e como sao estruturados?
- **Temas**: O sistema suporta temas (light/dark/custom)? Como sao implementados e alternados?
- **Ferramentas**: Quais ferramentas de design e documentacao sao utilizadas (Figma, Storybook, etc.)?
- **Catalogo de Componentes Base**: Quais componentes primitivos compõem a base do design system (Button, Input, Typography, etc.)?

Se houver lacunas criticas que NAO podem ser inferidas do blueprint tecnico, faca ate 3 perguntas pontuais ao usuario antes de gerar.

> **Versões atualizadas:** Ao referenciar tecnologias específicas com versões, use o MCP context7 para consultar documentação atualizada. Primeiro chame `mcp__context7__resolve-library-id` para obter o ID da biblioteca, depois `mcp__context7__query-docs` para consultar versões e exemplos.

---

## Tipografia — Google Fonts via Fontpair

As fontes devem ser escolhidas em par (heading + body) a partir do https://www.fontpair.co/all usando Google Fonts.

### Como escolher o par de fontes

1. Analise a **visao e identidade do produto** (docs/blueprint/01-vision.md)
2. Escolha a **categoria** que melhor representa a personalidade do produto:

| Categoria | Quando usar | Exemplos de pares (Heading / Body) |
|---|---|---|
| **Serif + Sans** | Editorial, premium, confianca | Playfair Display / Source Sans 3, Lora / Open Sans, Merriweather / Montserrat, Libre Baskerville / Roboto, Cinzel / Raleway |
| **Sans + Sans** | Moderno, limpo, tech | Montserrat / Lato, Raleway / Open Sans, Josefin Sans / Roboto, Chivo / Lato, Inter / Inter |
| **Display + Sans** | Bold, criativo, impactante | Abril Fatface / Raleway, Alfa Slab One / Montserrat, Anton / Roboto, Concert One / Open Sans |
| **Slab Serif + Sans** | Solido, editorial moderno | Arvo / Lato, Bitter / Source Sans Pro, Crete Round / Open Sans, Bree Serif / Raleway |
| **Monospace + Sans** | Tecnico, developer tools | JetBrains Mono / Inter, Fira Code / Open Sans, Space Mono / Work Sans |

3. Pergunte ao usuario qual par melhor representa o produto (apresente 2-3 opcoes da categoria escolhida)
4. Documente no design system com os imports do Google Fonts:

```css
/* Exemplo de import */
@import url('https://fonts.googleapis.com/css2?family={HeadingFont}:wght@400;500;600;700&family={BodyFont}:wght@300;400;500;600&display=swap');
```

### Especificacao de tipografia no documento

Ao preencher a secao de tipografia, defina:

| Token | Uso | Exemplo |
|---|---|---|
| `--font-heading` | Titulos h1-h3, hero, destaque | `'{HeadingFont}', serif` |
| `--font-body` | Corpo de texto, paragrafos, labels | `'{BodyFont}', sans-serif` |
| `--font-mono` | Codigo, dados tecnicos | `'JetBrains Mono', monospace` |
| `font-size` scale | Sistema de tamanhos | `xs(12) sm(14) base(16) lg(18) xl(20) 2xl(24) 3xl(30) 4xl(36)` |
| `font-weight` scale | Pesos disponiveis | `light(300) regular(400) medium(500) semibold(600) bold(700)` |
| `line-height` scale | Alturas de linha | `tight(1.25) normal(1.5) relaxed(1.75)` |

---

## Paleta de Cores — Coolors

As cores devem ser escolhidas a partir de paletas trending do https://coolors.co/palettes/trending e mapeadas para CSS variables seguindo a estrutura do globals.css (padrao shadcn/ui + extensoes).

### Como escolher a paleta

1. Analise a **identidade visual** desejada no blueprint
2. Escolha uma paleta de 5 cores do Coolors que represente o produto. Paletas populares de referencia:

| Paleta | Cores | Vibe |
|---|---|---|
| Earth Tones | `#264653` `#2A9D8F` `#E9C46A` `#F4A261` `#E76F51` | Natural, organico |
| Bold Primary | `#003049` `#D62828` `#F77F00` `#FCBF49` `#EAE2B7` | Energetico, direto |
| Beautiful Blues | `#011F4B` `#03396C` `#005B96` `#6497B1` `#B3CDE0` | Corporativo, confiavel |
| Blueberry Basket | `#FFFFFF` `#D0E1F9` `#4D648D` `#283655` `#1E1F26` | Elegante, tech |
| Pastel Rainbow | `#A8E6CF` `#DCEDC1` `#FFD3B6` `#FFAAA5` `#FF8B94` | Leve, amigavel |
| Metro UI | `#D11141` `#00B159` `#00AEDB` `#F37735` `#FFC425` | Vibrante, app |
| Beach Towels | `#FE4A49` `#2AB7CA` `#FED766` `#E6E6EA` `#F4F4F8` | Fresco, divertido |

3. O usuario pode tambem colar o link direto do Coolors (ex: `coolors.co/palette/264653-2a9d8f-e9c46a-f4a261-e76f51`)
4. A partir das 5 cores, derive toda a paleta semantica

### Mapeamento das 5 cores do Coolors para CSS variables

A paleta de 5 cores deve ser distribuida nas seguintes CSS variables (formato oklch, converter de hex):

```
Cor 1 (mais escura/ancora)     → --primary          (botoes, links, CTA principal)
Cor 2 (complementar)           → --accent           (destaque secundario, hover states)
Cor 3 (neutra/suave)           → --secondary        (backgrounds alternativos, badges)
Cor 4 (quente/atencao)         → --warning          (alertas, atencao)
Cor 5 (vibrante/contraste)     → --destructive      (erros, acoes destrutivas)
```

### Estrutura completa do globals.css

Ao gerar o design system, documente TODAS as CSS variables seguindo esta estrutura (light + dark):

```css
:root {
  --radius: 0.625rem;

  /* Backgrounds */
  --background: oklch(...);        /* Fundo principal da pagina */
  --foreground: oklch(...);        /* Texto principal */

  /* Cards e Popovers */
  --card: oklch(...);              /* Fundo de cards */
  --card-foreground: oklch(...);   /* Texto em cards */
  --popover: oklch(...);           /* Fundo de popovers/dropdowns */
  --popover-foreground: oklch(...);

  /* Cores semanticas */
  --primary: oklch(...);           /* CTA, botoes principais, links — Cor 1 da paleta */
  --primary-foreground: oklch(...);/* Texto sobre primary */
  --secondary: oklch(...);         /* Backgrounds secundarios — Cor 3 da paleta */
  --secondary-foreground: oklch(...);
  --accent: oklch(...);            /* Destaques, hovers — Cor 2 da paleta */
  --accent-foreground: oklch(...);
  --muted: oklch(...);             /* Textos e areas desabilitadas */
  --muted-foreground: oklch(...);

  /* Status */
  --destructive: oklch(...);       /* Erros, delete — Cor 5 ou vermelho derivado */
  --destructive-foreground: oklch(...);
  --success: oklch(...);           /* Sucesso, confirmacao */
  --success-foreground: oklch(...);
  --warning: oklch(...);           /* Alertas — Cor 4 da paleta */
  --warning-foreground: oklch(...);
  --info: oklch(...);              /* Informacional */
  --info-foreground: oklch(...);

  /* Bordas e inputs */
  --border: oklch(...);            /* Bordas gerais */
  --input: oklch(...);             /* Bordas de inputs */
  --ring: oklch(...);              /* Focus ring */

  /* Charts (derivar da paleta de 5 cores) */
  --chart-1 a --chart-5: oklch(...);

  /* Sidebar (se aplicavel) */
  --sidebar: oklch(...);
  --sidebar-foreground: oklch(...);
  --sidebar-primary: oklch(...);
  --sidebar-primary-foreground: oklch(...);
  --sidebar-accent: oklch(...);
  --sidebar-accent-foreground: oklch(...);
  --sidebar-border: oklch(...);
  --sidebar-ring: oklch(...);
}

.dark {
  /* Mesmas variables com valores invertidos para dark mode */
}
```

### Regras de derivacao

- **background/foreground**: Derivar tons neutros da cor mais escura da paleta (dessaturar)
- **card/popover**: Levemente mais claro que background
- **muted**: Tom neutro dessaturado
- **border/input**: Tom intermediario entre background e foreground
- **ring**: Mesmo valor que primary
- **chart-1 a chart-5**: Usar as 5 cores da paleta diretamente
- **Dark mode**: Inverter lightness (L) no oklch, manter chroma (C) e hue (H)

---

## Iconografia

Os icones devem ser escolhidos a partir de duas fontes complementares:

### Lucide Animated — https://lucide-animated.com/

- Fonte **primaria** para icones com animacao
- Usar para: loading states, transicoes, feedback visual, onboarding, empty states
- Importar via pacote `lucide-react` com wrapper de animacao
- Priorizar icones animados em interacoes (hover, click, state change)

### shadcn/ui Icons — https://www.shadcn.io/icons

- Fonte **complementar** para icones estaticos
- Usar para: navegacao, botoes, menus, labels, badges, tabelas
- Consistencia com o ecossistema shadcn/ui
- Importar via `lucide-react` (mesmo pacote base)

### Especificacao no documento

Ao preencher a secao de iconografia, defina:

| Token | Valor | Uso |
|---|---|---|
| `icon-size-sm` | 16px | Inline em texto, badges |
| `icon-size-md` | 20px | Botoes, menus, nav |
| `icon-size-lg` | 24px | Headers, destaque |
| `icon-size-xl` | 32px | Empty states, hero |
| `icon-stroke` | 1.5-2px | Espessura padrao |

Regras:
- Todos os icones devem usar `currentColor` para herdar cor do contexto
- Icones animados (lucide-animated) para feedback e transicoes
- Icones estaticos (shadcn/ui icons) para UI estrutural
- Manter consistencia: nao misturar icon packs diferentes alem destes dois

---

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/frontend-increment`.

Preencha `docs/frontend/03-design-system.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:
- Informacoes explicitas do blueprint tecnico
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- do blueprint: XX-arquivo.md -->`)

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Design System preenchido. Rode `/frontend-components` para preencher Componentes."
