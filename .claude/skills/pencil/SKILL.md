---
name: pencil
description: Cria paginas visuais no Pencil (pencil.dev) a partir do frontend blueprint — design system com variables nativas, componentes reutilizaveis com slots, e composicao de paginas com instancias.
---

# Pencil — Design Visual a partir do Blueprint

Cria designs visuais no Pencil (pencil.dev) usando as ferramentas MCP nativas. O fluxo segue 5 fases:

1. **Variables & Temas** — registra tokens via `set_variables` com temas light/dark + representacao visual no DS
2. **Planejamento de Telas** — mapa completo de todas as paginas, componentes, acoes e ordem de construcao
3. **Componentes Nativos** — cria componentes reutilizaveis (`reusable: true`) com variantes e slots, isolados no DS
4. **Composicao de Paginas** — monta cada pagina usando instancias (`ref`) dos componentes do DS
5. **Fluxos de Interacao** — duplica frames com estados alterados para simular a experiencia do usuario

**Escopo:** Apenas visual no Pencil. NAO gera codigo para o projeto.

**Terminologia:** No Pencil, o equivalente ao "artboard" do Paper e o **frame**. Toda a skill usa "frame" consistentemente.

---

## Regras Pencil MCP (OBRIGATORIAS)

> Siga estas regras em TODAS as interacoes com o Pencil MCP:

### Nomes das ferramentas

| Tool curto | Tool MCP completo | Uso |
|------------|-------------------|-----|
| `batch_design` | `mcp__pencil__batch_design` | Criar/modificar/mover/deletar elementos via linguagem natural |
| `batch_get` | `mcp__pencil__batch_get` | Inspecionar hierarquia, listar componentes, buscar elementos |
| `get_screenshot` | `mcp__pencil__get_screenshot` | Verificacao visual em milestones (fim de fase/pagina) |
| `snapshot_layout` | `mcp__pencil__snapshot_layout` | Verificacao automatica por grupo — detecta problemas de posicionamento |
| `get_editor_state` | `mcp__pencil__get_editor_state` | Confirmar contexto (arquivo ativo, selecao) e conexao MCP |
| `get_variables` | `mcp__pencil__get_variables` | Ler variables existentes |
| `set_variables` | `mcp__pencil__set_variables` | Registrar tokens (cores, tipografia, spacing, radius) com temas |

### Regras de uso

- Linguagem natural nos prompts do `batch_design` — descrever aparencia referenciando shadcn/ui + Tailwind
- `snapshot_layout` apos cada grupo logico de operacoes (nao a cada chamada individual) — ex: apos criar todos os primitivos, apos montar o layout de uma pagina
- `get_screenshot` apenas em milestones: fim de cada fase, fim de cada pagina
- **Review checklist nos milestones (screenshots):** Spacing, Typography, Contrast, Alignment, Clipping, Repetition
- `get_editor_state` no inicio do trabalho para confirmar contexto e conexao MCP ativa
- `batch_get` para inspecionar hierarquia antes de modificar elementos existentes
- Componentes sempre como `reusable: true` com nomes semanticos
- Instancias via `ref` — nunca duplicar manualmente o conteudo de um componente
- **Slots:** areas substituiveis em componentes compostos. No Pencil, um slot e um frame vazio dentro de um componente marcado como slot via properties panel. Na `batch_design`, descrever: "cria um frame vazio marcado como slot para conteudo"
- Consultar shadcn/ui e Tailwind v4 via Context7 MCP para referencia visual (ver Passo 2.1)
- Um unico arquivo `.pen` por projeto — Design System + paginas no mesmo arquivo
- **Fontes:** o Pencil usa fontes instaladas no sistema. Nao ha verificacao de disponibilidade via MCP. Se a fonte do blueprint nao estiver instalada, instruir o usuario a instala-la ou usar fallback (`system-ui` para sans, `monospace` para code)
- **Sempre referenciar variables** (`$color-primary`, `$space-md`, etc.) nos prompts — nunca usar valores hardcoded apos registra-las

### Tratamento de erros

- **`batch_design` falha**: ler a mensagem de erro, simplificar o prompt (dividir em operacoes menores) e tentar novamente. Se persistir, reportar ao usuario.
- **`snapshot_layout` detecta problemas severos**: listar os problemas, corrigir via `batch_design` com prompts direcionados, executar `snapshot_layout` novamente.
- **Conexao MCP cai**: instruir o usuario a verificar se o Pencil esta aberto e o `.pen` ativo. Chamar `get_editor_state` para confirmar reconexao.
- **`set_variables` falha parcialmente**: chamar `get_variables` para verificar estado atual, re-enviar apenas as variables nao criadas.

---

## Passo 1: Verificar Ambiente Pencil

1. Chame `mcp__pencil__get_editor_state` para confirmar conexao e ver o arquivo `.pen` ativo.
2. Se nao houver `.pen` aberto, instrua o usuario:
   > "Abra o Pencil no IDE, crie um novo arquivo (Pencil > New File), salve como `design.pen` na raiz do projeto e tente novamente."
3. Chame `mcp__pencil__get_variables` para verificar se ja existem variables definidas.
4. Se ja existirem variables ou componentes, pergunte:
   > "Encontrei variables/componentes existentes: {{lista}}. Deseja continuar adicionando ou comecar do zero?"

---

## Passo 2: Ler Frontend Blueprint

Leia os seguintes documentos para extrair os dados necessarios:

| Documento | O que extrair |
|-----------|---------------|
| `docs/frontend/03-design-system.md` | Tokens: cores, tipografia, espacamento, breakpoints |
| `docs/frontend/04-components.md` | Hierarquia de componentes, variantes e props dos primitivos |
| `docs/frontend/07-routes.md` | Tabela de rotas, layouts, tipos (publica/protegida/admin) |
| `docs/frontend/08-flows.md` | Fluxos de UI e interacoes por pagina |
| `docs/frontend/05-state.md` | Estado gerenciado por pagina |
| `docs/frontend/14-copies.md` | Textos/copies por pagina (se disponiveis) |

### 2.1: Consultar shadcn/ui e Tailwind v4 via Context7

Antes de montar a referencia de componentes, consulte as documentacoes:

**shadcn/ui:**
1. Chame `mcp__context7__resolve-library-id` com query "shadcn/ui" para obter o ID da biblioteca
2. Para cada componente listado no blueprint (`docs/frontend/04-components.md`), chame `mcp__context7__query-docs` para obter:
   - Variantes disponiveis (variant, size, etc.)
   - Props e estados (disabled, loading, error, etc.)
   - Aparencia visual padrao (cores, border-radius, shadows)
   - Composicao (ex: Dialog = DialogTrigger + DialogContent + DialogHeader + DialogFooter)

**Tailwind CSS v4:**
1. Chame `mcp__context7__resolve-library-id` com query "tailwindcss" para obter o ID
2. Chame `mcp__context7__query-docs` para consultar:
   - Escala de cores padrao e como mapear para os tokens do blueprint
   - Escala de espacamento (0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, etc.)
   - Utilidades de tipografia (text-xs, text-sm, text-base, text-lg, text-xl, etc.)
   - Border radius (rounded-sm=2px, rounded-md=6px, rounded-lg=8px, rounded-xl=12px)
   - Shadows (shadow-sm, shadow-md, shadow-lg)

### 2.2: Montar Conjuntos de Referencia

Monte conjuntos internos de referencia:
- **TOKENS**: mapa de cores (com valores light e dark), escala tipografica (em px), escala de espacamento, breakpoints
- **COMPONENTES**: lista de primitivos e compostos com variantes do shadcn/ui (nomes, props, estados)
- **ROTAS**: lista de rotas com layout, tipo e nome da pagina
- **FLUXOS**: fluxos de UI associados a cada rota
- **COPIES**: textos disponiveis por pagina

---

## Passo 3: Variables & Temas

### 3.1: Registrar Variables Nativas

Via `mcp__pencil__set_variables`, criar tokens organizados por categoria:

| Categoria | Exemplos | Temas |
|-----------|----------|-------|
| Cores | `$color-primary`, `$color-secondary`, `$color-background`, `$color-foreground`, `$color-muted`, `$color-error`, `$color-warning`, `$color-success` | light + dark |
| Tipografia | `$font-family-sans`, `$font-family-mono`, `$font-size-xs` (12), `$font-size-sm` (14), `$font-size-base` (16), `$font-size-lg` (18), `$font-size-xl` (20), `$font-size-2xl` (24), `$font-size-3xl` (30), `$font-size-4xl` (36) | — |
| Spacing | `$space-xs` (4), `$space-sm` (8), `$space-md` (16), `$space-lg` (24), `$space-xl` (32), `$space-2xl` (48) | — |
| Radius | `$radius-sm` (2), `$radius-md` (6), `$radius-lg` (8), `$radius-xl` (12) | — |

**Temas light/dark:** As variables de cores suportam valores diferentes por tema. Paginas sao compostas usando o tema light por padrao. O tema dark e verificavel alternando o tema no Pencil (properties panel). NAO e necessario criar frames duplicados para dark mode — as variables fazem a troca automaticamente.

### 3.2: Design Brief

> "**Design Brief — Design System (Tokens)**
>
> - **Cores**: {{N}} tokens (listar com hex light/dark)
> - **Tipografia**: {{font-family}} (headings {{weight}}, body {{weight}}) + {{code font}}
> - **Espacamento**: grid de 8px ({{listar tokens}})
> - **Breakpoints**: {{listar com dispositivos}}
> - **Frame**: 1440px largura, altura dinamica
> - **Fundo**: $color-background
> - **Direcao visual**: clean, minimalista, foco em documentacao
>
> Confirma?"

Aguarde confirmacao.

### 3.3: Criar Frame "Design System"

Via `mcp__pencil__batch_design`, criar o frame raiz do DS:

> "Cria um frame chamado 'Design System' com 1440px de largura, layout vertical, padding 48px, gap 48px, fundo $color-background. Dentro dele, cria um titulo 'Design System' com fonte $font-family-sans 700 $font-size-4xl cor $color-foreground, e um subtitulo com o nome do projeto em fonte $font-family-sans 400 $font-size-base cor $color-muted."

### 3.4: Construir Secoes de Tokens

Construa cada secao com chamadas separadas ao `batch_design`:

**A) Paleta de Cores**

> "Dentro do frame 'Design System', cria uma secao 'Cores' com titulo em fonte $font-family-sans 600 $font-size-2xl. Abaixo, cria uma row horizontal com gap 16px contendo 4 swatches: cada swatch e um retangulo de 80x80px com a cor do token + abaixo o hex value e o nome da variable em fonte $font-family-sans 400 12px cor $color-muted. Primeira row: $color-primary, $color-secondary, $color-background, $color-foreground."

> "Adiciona uma segunda row de swatches abaixo: $color-muted, $color-error, $color-warning, $color-success."

- `mcp__pencil__snapshot_layout`

**B) Escala Tipografica**

> "Dentro do frame 'Design System', cria uma secao 'Tipografia' com titulo. Abaixo, cria samples empilhados verticalmente com gap 12px: 'Heading 1 — $font-family-sans 700 / 36px' renderizado no tamanho real, 'Heading 2 — $font-family-sans 600 / 24px' no tamanho real, 'Body — $font-family-sans 400 / 16px' no tamanho real, 'Caption — $font-family-sans 400 / 14px' no tamanho real, 'Code — $font-family-mono 400 / 14px' no tamanho real."

**C) Sistema de Espacamento**

> "Dentro do frame 'Design System', cria uma secao 'Espacamento' com titulo. Para cada token de spacing ($space-xs=4px, $space-sm=8px, $space-md=16px, $space-lg=24px, $space-xl=32px, $space-2xl=48px), cria uma barra horizontal com cor $color-primary, altura 12px, largura proporcional ao valor, e um label ao lado com o nome e valor em fonte $font-family-sans 400 12px."

- `mcp__pencil__snapshot_layout`

**D) Breakpoints**

> "Dentro do frame 'Design System', cria uma secao 'Breakpoints' com titulo. Cria 4 indicadores visuais lado a lado: sm (640px/Mobile), md (768px/Tablet), lg (1024px/Desktop), xl (1280px/Wide). Cada indicador e um retangulo outline com a largura representativa (escala reduzida) e label com nome + valor."

### 3.5: Milestone — Tokens

1. `mcp__pencil__get_screenshot` do frame Design System
2. Review checklist: Spacing, Typography, Contrast, Alignment
3. Apresente resumo:

> "Design System criado (tokens):
>
> - {{N}} cores (com temas light/dark)
> - {{N}} niveis tipograficos
> - {{N}} tokens de espacamento
> - {{N}} breakpoints
> - {{N}} tokens de radius
>
> Seguindo para o planejamento de telas..."

---

## Passo 4: Planejamento de Telas

Antes de criar componentes ou paginas, planeje TODAS as telas com seus componentes.

### 4.1: Mapear Componentes por Tela

Cruzando ROTAS + FLUXOS + COMPONENTES do blueprint, monte o mapa completo.

Para cada rota, identifique:
- **Layout**: qual layout usa e quais componentes o layout contem (Sidebar, Navbar, Footer, etc.)
- **Componentes de pagina**: quais componentes primitivos e compostos a pagina precisa
- **Componentes de feature**: quais componentes especificos do dominio a pagina usa
- **Estados**: quais estados da pagina afetam os componentes (loading, empty, error, success)
- **Acoes por componente**: o que cada componente FAZ nesta tela (ex: Button "Salvar" -> submete formulario, Link "Esqueci senha" -> navega para /forgot-password, Input "Email" -> valida formato email on blur)

### 4.2: Apresentar Plano ao Usuario

Apresente o mapa completo:

> "**Planejamento de Telas**
>
> | # | Rota | Layout | Componentes de Layout | Componentes de Pagina | Estados |
> |---|------|--------|----------------------|----------------------|---------|
> | 1 | `/` | MainLayout | Navbar, Footer | Hero, FeatureCards, CTA | default |
> | 2 | `/login` | AuthLayout | Logo, Card | Input (email, password), Button (primary), Link | default, loading, error |
> | 3 | `/register` | AuthLayout | Logo, Card | Input (name, email, password), Button, Link | default, loading, error |
> | 4 | `/dashboard` | AppLayout | Sidebar, Navbar | StatsCards, DataTable, Charts | loading, empty, populated |
> | 5 | `/settings` | AppLayout | Sidebar, Navbar | Tabs, Input, Select, Button, Avatar | default, saving |
> | 6 | `/admin/users` | AdminLayout | AdminSidebar, Navbar | DataTable, Badge, Avatar, Button, Modal | loading, empty, populated |
>
> ---
>
> **Mapa de Acoes por Tela:**
>
> **`/login`**
> | Componente | Acao | Destino/Efeito |
> |------------|------|----------------|
> | Input (email) | on blur: valida formato | exibe erro inline se invalido |
> | Input (password) | on change: atualiza state | — |
> | Button "Entrar" | on click: submit form | POST /api/auth/login -> redireciona /dashboard |
> | Link "Esqueci senha" | on click: navega | /forgot-password |
> | Link "Criar conta" | on click: navega | /register |
>
> _(... repete para cada tela)_
>
> ---
>
> **Componentes unicos identificados:** {{N}} primitivos, {{N}} compostos, {{N}} de feature
>
> **Lista completa de componentes a criar no Design System:**
>
> | Componente | Tipo | Variantes | Usado em |
> |------------|------|-----------|----------|
> | Button | Primitivo | primary, secondary, ghost, destructive x sm, md, lg | /login, /register, /settings, /admin/users |
> | Input | Primitivo | text, password, search, number + error state | /login, /register, /settings |
> | Card | Primitivo | default, outlined, elevated | /, /login, /register |
> | ... | ... | ... | ... |
>
> **Ordem sugerida de construcao de paginas** (maximiza reuso):
> 1. {{rota}} — introduz: {{componentes novos}}
> 2. {{rota}} — introduz: {{componentes novos}}
> ...
>
> Confirma o plano? Quer ajustar componentes ou ordem?"

Aguarde aprovacao. O usuario pode:
- Ajustar componentes de uma tela
- Mudar a ordem de construcao
- Adicionar/remover telas ou componentes
- Aprovar como esta

### 4.3: Milestone

- Usuario aprova o plano antes de prosseguir
- Se houver ajustes, iterar ate aprovacao

---

## Passo 5: Criar Componentes no Design System

Com o planejamento aprovado, crie TODOS os componentes identificados no frame Design System, ANTES de montar qualquer pagina.

### 5.1: Expandir Frame do DS

Via `mcp__pencil__batch_design`:

> "Dentro do frame 'Design System', apos a secao de Tokens, cria sub-frames para organizar os componentes: 'Primitivos', 'Compostos', 'Layout', 'Feature'. Cada sub-frame com titulo em fonte $font-family-sans 700 $font-size-2xl e layout vertical com gap 24px."

Estrutura resultante:
```
Design System (frame raiz)
+-- Tokens (Passo 3)
+-- Primitivos (Button, Input, Badge...)
+-- Compostos (Card, Modal, DataTable...)
+-- Layout (Sidebar, Navbar, AppLayout, AuthLayout...)
+-- Feature (StatsCard, UserRow...)
```

### 5.2: Titulo da Secao de Componentes

> "No frame 'Design System', entre Tokens e Primitivos, adiciona um titulo 'Componentes' em fonte $font-family-sans 700 $font-size-4xl cor $color-foreground, e subtitulo '{{N}} componentes . {{N}} variantes' em fonte $font-family-sans 400 $font-size-sm cor $color-muted."

### 5.3: Renderizar Componentes por Grupo

**A) Primitivos** (componentes atomicos)

Para cada componente primitivo do plano, use `mcp__pencil__batch_design` com prompt descritivo referenciando shadcn/ui.

Exemplos de prompts:

**Button:**
> "Dentro do frame 'Design System > Primitivos', cria um componente reutilizavel chamado 'Button/Primary/md' com estilo shadcn/ui: frame com layout horizontal, align center, justify center, padding $space-sm $space-md, fundo $color-primary, border-radius $radius-md, texto 'Button' em fonte $font-family-sans 500 $font-size-sm cor branca. Marca como componente reutilizavel."

> "Cria variantes adicionais lado a lado: 'Button/Secondary/md' (fundo transparente, borda 1px $color-muted, texto $color-foreground), 'Button/Ghost/md' (fundo transparente, sem borda, texto $color-foreground), 'Button/Destructive/md' (fundo $color-error, texto branca). Todas reutilizaveis."

**Input:**
> "Dentro do frame 'Design System > Primitivos', cria um componente reutilizavel chamado 'Input/Default' com estilo shadcn/ui: frame com borda 1px cor $color-muted, border-radius $radius-md, padding $space-sm 12px, altura 36px, largura 280px, texto placeholder 'Type here...' em fonte $font-family-sans 400 $font-size-sm cor $color-muted. Marca como componente reutilizavel."

> "Cria variante 'Input/Error': mesma base do Input/Default mas com borda $color-error e um texto 'Error message' em fonte $font-family-sans 400 12px cor $color-error abaixo do input. Marca como componente reutilizavel."

**Badge:**
> "Dentro do frame 'Design System > Primitivos', cria um componente reutilizavel chamado 'Badge/Default' com estilo shadcn/ui: frame inline com padding 2px $space-sm, border-radius 9999px, fundo $color-primary com 10% opacidade, texto 'Badge' em fonte $font-family-sans 500 12px cor $color-primary. Marca como reutilizavel."

Para cada primitivo:
- **Nome do componente** + **"Usado em:"** {{lista de rotas}} (fonte $font-family-sans 400 12px cor $color-muted)
- **Variantes lado a lado** — cada variante em tamanho real com label abaixo

- `mcp__pencil__snapshot_layout` apos criar todos os primitivos -> corrigir problemas detectados

**B) Compostos** (combinacoes de primitivos)

Compostos usam **instancias** dos primitivos ja criados e **slots** para areas substituiveis.

**Card:**
> "Dentro do frame 'Design System > Compostos', cria um componente reutilizavel chamado 'Card' com estilo shadcn/ui: frame com layout vertical, padding $space-lg, gap $space-md, borda 1px cor $color-muted, border-radius $radius-lg, fundo $color-background. Adiciona um texto 'Card Title' como header em fonte $font-family-sans 600 $font-size-lg. Abaixo, cria um frame vazio de 100% largura e altura minima 80px marcado como slot para conteudo. Marca o Card inteiro como componente reutilizavel."

**Modal/Dialog:**
> "Dentro do frame 'Design System > Compostos', cria um componente reutilizavel chamado 'Modal' com estilo shadcn/ui: frame overlay de 480px largura, fundo $color-background, border-radius $radius-xl, shadow-lg, padding $space-lg, layout vertical, gap $space-md. Header com titulo 'Modal Title' em $font-family-sans 600 $font-size-lg e um botao X no canto superior direito. Area central como slot para conteudo. Footer com layout horizontal, justify end, gap $space-sm, contendo instancias de Button/Secondary e Button/Primary. Marca como reutilizavel."

Para cada composto:
- **Nome + descricao** + **"Usado em:"** {{rotas}}
- **Renderizacao completa** com primitivos reais

- `mcp__pencil__snapshot_layout` apos criar todos os compostos

**C) Layout** (componentes estruturais)

Componentes de layout com slots para conteudo principal.

**AppLayout:**
> "Dentro do frame 'Design System > Layout', cria um componente reutilizavel chamado 'AppLayout' de 1440x900: frame com layout horizontal. Filho esquerdo: frame vertical de 240px de largura, fundo $color-background com borda direita 1px $color-muted, padding $space-md (area da Sidebar). Filho direito: frame vertical flex-grow com layout vertical. Dentro do filho direito: frame horizontal de 64px de altura com borda inferior 1px $color-muted, padding horizontal $space-lg (Navbar). Abaixo, frame marcado como slot para conteudo da pagina com padding $space-lg. Marca como componente reutilizavel."

**AuthLayout:**
> "Dentro do frame 'Design System > Layout', cria um componente reutilizavel chamado 'AuthLayout' de 1440x900: frame com layout horizontal. Metade esquerda: fundo $color-primary com 5% opacidade, centralizado, contendo logo placeholder. Metade direita: layout vertical, centralizado, com slot para conteudo do formulario. Marca como componente reutilizavel."

Para cada layout:
- **Nome** + **"Usado em:"** {{rotas que usam este layout}}
- **Renderizacao em escala real**

- `mcp__pencil__snapshot_layout` apos criar todos os layouts

**D) Feature** (componentes de dominio)

Componentes de feature combinam primitivos e compostos usando instancias.

> "Dentro do frame 'Design System > Feature', cria um componente reutilizavel chamado 'StatsCard': instancia do Card, dentro do slot insere um label em $font-family-sans 400 $font-size-sm cor $color-muted, um valor numerico 'R$ 12.450' em $font-family-sans 700 $font-size-2xl cor $color-foreground, e um indicador de variacao '+12.5%' em $font-family-sans 500 $font-size-sm cor $color-success. Marca como reutilizavel."

- `mcp__pencil__snapshot_layout` apos criar todas as features

### 5.4: Milestone — Componentes

1. `mcp__pencil__get_screenshot` do frame Design System completo
2. Review checklist: Spacing, Typography, Contrast, Alignment, Clipping, Repetition
3. `mcp__pencil__batch_get` para listar todos os componentes criados (confirmacao)
4. Apresente resumo:

> "Design System completo:
>
> **Tokens:** {{N}} cores, {{N}} tipografia, {{N}} espacamento, {{N}} breakpoints, {{N}} radius
> **Componentes:** {{N}} primitivos, {{N}} compostos, {{N}} layout, {{N}} feature
>
> | Componente | Variantes | Usado em |
> |------------|-----------|----------|
> | Button | primary, secondary, ghost, destructive x md | {{N}} paginas |
> | Input | default, error | {{N}} paginas |
> | Card | default | {{N}} paginas |
> | ... | ... | ... |
>
> Pronto para comecar a compor as paginas. Primeira na fila: **{{rota}}**
>
> Confirma?"

---

## Passo 6: Composicao de Paginas

Agora monte cada pagina USANDO instancias (`ref`) dos componentes ja criados no Design System. Quando o componente-origem e atualizado, todas as instancias refletem a mudanca.

### 6.1: Anunciar Pagina

> "Compondo pagina {{N}}/{{total}}: **{{PageName}}** ({{rota}})
>
> **Componentes do DS que serao usados:**
> - Layout: {{componentes do layout}}
> - Pagina: {{componentes da pagina}}
> - Feature: {{componentes de feature}}"

### 6.2: Design Brief da Pagina

> "**Design Brief — {{PageName}} ({{rota}})**
>
> - **Layout**: {{LayoutName}} ({{componentes do layout}})
> - **Frame**: 1440 x 900px
> - **Componentes**: {{lista completa — todos ja existem no DS}}
> - **Estados a representar**: {{lista de estados}}
> - **Conteudo**: {{descricao baseada nos flows e copies}}
> - **Tokens**: consistente com Design System (via variables)
>
> **Acoes mapeadas nesta tela:**
> | Componente | Acao | Destino/Efeito |
> |------------|------|----------------|
> | {{componente}} | {{evento}}: {{descricao}} | {{resultado}} |
> | ... | ... | ... |
>
> Confirma?"

Aguarde confirmacao.

### 6.3: Criar Frame da Pagina

Posicione o frame ao lado do anterior (horizontalmente). Gap de 100px entre paginas:

> "Cria um frame chamado 'Page — {{rota}}' de 1440x900 posicionado a direita do ultimo frame com gap de 100px, fundo $color-background."

### 6.4: Construir com Instancias

Siga a ordem:

1. **Shell do layout** — instancia do componente de layout
   > "No frame 'Page — /dashboard', insere uma instancia do componente 'AppLayout'."

2. **Preencher slots do layout** — instancias de Sidebar, Navbar com conteudo
   > "No slot da Sidebar do AppLayout, insere itens de navegacao: logo no topo, e abaixo links 'Dashboard', 'Settings', 'Users' em $font-family-sans 400 $font-size-sm. O item 'Dashboard' fica destacado com fundo $color-primary 10% e cor $color-primary."

   > "No Navbar, insere breadcrumb 'Home / Dashboard' a esquerda e um avatar com dropdown a direita."

3. **Conteudo da pagina** — instancias dos componentes de pagina/feature
   > "No slot de conteudo principal do AppLayout, insere: uma row horizontal com 4 instancias de 'StatsCard' (muda labels para 'Receita', 'Usuarios', 'Pedidos', 'Conversao' e valores para 'R$ 12.450', '1.234', '856', '3.2%'). Abaixo, insere uma instancia de DataTable com 5 rows de dados placeholder."

4. **Textos e dados** — copies do blueprint ou dados placeholder realistas

- `mcp__pencil__snapshot_layout` apos construir a pagina -> corrigir problemas detectados

### 6.5: Milestone — Pagina

1. `mcp__pencil__get_screenshot`
2. Review checklist: Spacing, Typography, Contrast, Alignment, Clipping, Repetition
3. Apresentar ao usuario

### 6.6: Verificar Componentes Nao Previstos

Se durante a composicao surgiu algum componente que NAO estava no planejamento:

1. Informe ao usuario:
   > "Durante a construcao de **{{pagina}}**, identifiquei {{N}} componente(s) nao previsto(s): {{lista}}.
   > Vou adiciona-los ao Design System."

2. Volte ao frame do DS e adicione os componentes novos como `reusable: true`
3. `mcp__pencil__snapshot_layout` no DS
4. Use instancias dos novos componentes na pagina

### 6.7: Proxima Pagina

> "Pagina **{{nome}}** ({{rota}}) composta.
>
> **Progresso:** {{N}}/{{total}} paginas concluidas
>
> Proxima na fila: **{{proxima rota}}** ({{layout}})
>
> Deseja criar? Ou escolha outra da lista."

Se o usuario quiser, volte ao Passo 6.1 para a proxima pagina.

---

## Passo 7: Fluxos de Interacao

Simula a experiencia do usuario com frames sequenciais representando estados antes/durante/depois de cada acao.

### 7.1: Identificar Fluxos por Pagina

Para cada pagina, baseado no plano (Passo 4) e em `docs/frontend/08-flows.md`:
- **Happy path** — obrigatorio
- **Erro mais comum** — obrigatorio
- Estados intermediarios (loading, empty) — se relevantes

Apresente ao usuario antes de criar:
> "**Fluxos de interacao para {{pagina}}:**
>
> **Happy path:** {{N}} frames
> 1. Estado inicial -> 2. {{acao}} -> 3. {{feedback}} -> 4. {{resultado}}
>
> **Erro:** {{N}} frames
> 1. Estado inicial -> 2. {{acao invalida}} -> 3. {{feedback erro}}
>
> Criar fluxos de interacao? (S/N)"

Aguarde confirmacao.

### 7.2: Criar Frames de Fluxo

Para cada estado do fluxo, use `mcp__pencil__batch_design` para duplicar o frame base e modificar os elementos que mudam:

**Happy path exemplo (/login):**

> "Duplica o frame 'Page — /login' e renomeia para 'Page — /login -> Form preenchido'. Posiciona a direita com gap de 60px. No novo frame, altera o texto do Input de email para 'user@email.com' e o Input de senha para '********'."

> "Duplica o frame 'Page — /login -> Form preenchido' e renomeia para 'Page — /login -> Loading'. Posiciona a direita com gap de 60px. No novo frame, desabilita o Button (opacidade 50%) e altera o texto para 'Entrando...'."

> "Duplica o frame 'Page — /login -> Loading' e renomeia para 'Page — /login -> Sucesso'. Posiciona a direita com gap de 60px. Substitui o conteudo do frame pelo conteudo do dashboard (ou mostra redirect visual)."

**Erro exemplo (/login):**

> "Duplica o frame 'Page — /login' e renomeia para 'Page — /login -> Email invalido'. Posiciona a direita com gap de 60px. No novo frame, troca a instancia do Input de email por Input/Error com borda $color-error e texto 'Email invalido' abaixo."

> "Duplica o frame 'Page — /login -> Email invalido' e renomeia para 'Page — /login -> Erro API'. Posiciona a direita com gap de 60px. Adiciona um toast no topo direito com fundo $color-error, texto 'Credenciais invalidas' em branco."

**Nomenclatura:**
- `Page — /login` (base)
- `Page — /login -> Form preenchido`
- `Page — /login -> Loading`
- `Page — /login -> Erro validacao`
- `Page — /login -> Sucesso`

### 7.3: Posicionamento

Frames do mesmo fluxo ficam lado a lado com gap menor (60px) para agrupar visualmente. Gap de 100px entre paginas diferentes:

```
[DS] --100-- [/login] --60-- [/login -> Form] --60-- [/login -> Loading] --60-- [/login -> Erro] --100-- [/dashboard] ...
```

### 7.4: Anotacoes de Conexao

Entre cada frame do fluxo, adicione labels descrevendo a acao:

> "Entre os frames 'Page — /login' e 'Page — /login -> Form preenchido', adiciona um texto 'Preenche email e senha' com fonte $font-family-sans 400 12px cor $color-muted, posicionado entre os dois frames."

**Quando NAO simular:**
- Navegacao simples entre paginas (Link -> outra rota) — basta a pagina destino existir como frame proprio
- Estados identicos a outra tela ja simulada

### 7.5: Verificacao

- `mcp__pencil__snapshot_layout` apos todos os frames de fluxo de uma pagina
- Milestone: `mcp__pencil__get_screenshot` do conjunto
- Review checklist: Spacing, Typography, Contrast, Alignment

### 7.6: Resumo do Fluxo

Apos criar, apresentar resumo com lista de frames e conexoes. Seguir para proxima pagina (voltar ao Passo 7.1) ou encerrar.

---

## Passo 8: Resumo Final

Quando o usuario encerrar:

> "**Resumo do projeto no Pencil:**
>
> | Frame | Rota | Tipo | Dimensao |
> |-------|------|------|----------|
> | Design System | — | DS | 1440 x {{altura final}} |
> | {{pagina}} | {{rota}} | Pagina | 1440 x 900 |
> | {{pagina}} -> {{acao}} | {{rota}} | Fluxo | 1440 x 900 |
> | ... | ... | ... | ... |
>
> **Design System final:**
> - Tokens: {{N}} cores (light/dark), {{N}} tipografia, {{N}} espacamento, {{N}} breakpoints, {{N}} radius
> - Componentes: {{N}} primitivos, {{N}} compostos, {{N}} layout, {{N}} feature
>
> **Paginas compostas:** {{N}}/{{total}}
> **Fluxos de interacao:** {{N}} frames de fluxo ({{N}} happy paths + {{N}} fluxos de erro)
> **Paginas restantes:** {{lista, se houver}}
>
> O arquivo `.pen` esta salvo no repositorio e versionado via Git.
> Para revisar ou ajustar, selecione elementos no Pencil e descreva as alteracoes.
> Para criar mais paginas, rode `/pencil` novamente."
