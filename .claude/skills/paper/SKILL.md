---
name: paper
description: Cria paginas visuais no Paper (paper.design) a partir do frontend blueprint — design system com tokens e componentes, depois composicao de paginas.
---

# Paper — Design Visual a partir do Blueprint

Cria paginas visuais no Paper (paper.design) usando as ferramentas MCP. O fluxo segue 6 passos:

1. **Tokens** — cores, tipografia, espacamento, breakpoints no artboard Design System
2. **Planejamento de Telas** — mapa completo de todas as paginas, seus componentes, acoes e ordem de construcao
3. **Componentes no Design System** — cria todos os componentes (baseados no shadcn/ui) identificados no planejamento, isolados e com variantes
4. **Composicao de Paginas** — monta cada pagina usando os componentes ja existentes no Design System
5. **Fluxos de Interacao** — simula a experiencia do usuario com artboards sequenciais representando estados antes/durante/depois de cada acao
6. **Atualizacao do Design System** — se a pagina revelar componentes nao previstos, adiciona-os ao DS

**Escopo:** Apenas visual no Paper. NAO gera codigo para o projeto.

---

## Regras Paper MCP (OBRIGATORIAS)

> Siga estas regras em TODAS as interacoes com o Paper MCP:

- Sempre chame `mcp__paper__get_font_family_info` antes de usar qualquer fonte
- Use `px` para font-size, `em` para letter-spacing
- Um grupo visual por `mcp__paper__write_html` (max ~15 linhas HTML)
- Screenshot OBRIGATORIO a cada 2-3 modificacoes via `mcp__paper__get_screenshot`
- Review Checkpoints apos cada screenshot: **Spacing, Typography, Contrast, Alignment, Clipping, Repetition**
- Apenas inline styles com `display: flex` para layout
- NAO use `display: grid`, margins, tabelas HTML
- NAO use emojis como icones — use SVG ou omita
- Sempre chame `mcp__paper__finish_working_on_nodes` ao finalizar cada artboard
- Conversao rem→px (base 16px): 2.25rem=36px, 1.5rem=24px, 1rem=16px, 0.875rem=14px
- **Posicionamento de artboards**: artboards de paginas devem ser criados LADO A LADO horizontalmente (mesma linha Y, X incrementando). Use gap de 100px entre artboards. O Design System fica a esquerda como primeiro artboard.
- **Biblioteca de componentes**: use shadcn/ui como referencia visual para todos os componentes. Consulte a documentacao via Context7 MCP (`mcp__context7__resolve-library-id` com "shadcn/ui", depois `mcp__context7__query-docs`) para obter a aparencia, variantes e estados corretos de cada componente.
- **Estilizacao**: use classes Tailwind CSS v4 como referencia para cores, espacamento, tipografia e utilidades. Consulte a documentacao do Tailwind v4 via Context7 MCP para garantir sintaxe e tokens atualizados. Ao escrever HTML no Paper, traduza as classes Tailwind para inline styles equivalentes (ex: `text-sm` → `font-size: 14px`, `rounded-md` → `border-radius: 6px`, `shadow-sm` → `box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)`).

---

## Passo 1: Verificar Ambiente Paper

1. Chame `mcp__paper__get_basic_info` para confirmar conexao e ver artboards existentes.
2. Chame `mcp__paper__get_font_family_info` com as fontes do blueprint: `["Inter", "JetBrains Mono"]`.
   - Se alguma NAO estiver disponivel, use fallback (`system-ui` para Inter, `monospace` para JetBrains Mono) e informe ao usuario.
3. Se artboards do projeto ja existem, pergunte:
   > "Encontrei artboards existentes: {{lista}}. Deseja continuar adicionando ou comecar do zero?"

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
   - Escala de cores padrao (slate, zinc, neutral, etc.) e como mapear para os tokens do blueprint
   - Escala de espacamento (0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, etc.)
   - Utilidades de tipografia (text-xs, text-sm, text-base, text-lg, text-xl, etc.)
   - Border radius (rounded-sm=2px, rounded-md=6px, rounded-lg=8px, rounded-xl=12px)
   - Shadows (shadow-sm, shadow-md, shadow-lg)

Isso garante que os componentes no Paper reflitam fielmente o shadcn/ui com estilizacao Tailwind v4.

### 2.2: Montar Conjuntos de Referencia

Monte conjuntos internos de referencia:
- **TOKENS**: mapa de cores, escala tipografica (convertida para px), escala de espacamento, breakpoints
- **COMPONENTES**: lista de primitivos e compostos com variantes do shadcn/ui (nomes, props, estados)
- **ROTAS**: lista de rotas com layout, tipo e nome da pagina
- **FLUXOS**: fluxos de UI associados a cada rota
- **COPIES**: textos disponiveis por pagina

---

## Passo 3: Design System — Tokens

O artboard de Design System comeca com tokens visuais. Componentes serao adicionados no Passo 5 apos o planejamento.

### 3.1: Design Brief

> "**Design Brief — Design System (Tokens)**
>
> - **Cores**: {{N}} tokens (listar com hex)
> - **Tipografia**: {{font-family}} (headings {{weight}}, body {{weight}}) + {{code font}}
> - **Espacamento**: grid de 8px ({{listar tokens}})
> - **Breakpoints**: {{listar com dispositivos}}
> - **Artboard**: 1440 x 1200px (sera expandido ao adicionar componentes)
> - **Fundo**: #FFFFFF
> - **Direcao visual**: clean, minimalista, foco em documentacao
>
> Confirma?"

Aguarde confirmacao.

### 3.2: Criar Artboard

```
mcp__paper__create_artboard({
  name: "Design System",
  styles: {
    width: "1440px",
    height: "1200px",
    backgroundColor: "#FFFFFF",
    display: "flex",
    flexDirection: "column",
    padding: "48px",
    gap: "48px"
  }
})
```

Guarde o ID retornado como `DS_ID`.

### 3.3: Construir Tokens

Construa cada secao com multiplos `write_html` (um grupo visual por chamada).

**A) Header**
- Titulo "Design System" (font 700, 36px, color texto principal)
- Subtitulo com nome do projeto (font 400, 16px, color texto secundario)
- Screenshot checkpoint

**B) Paleta de Cores**
- Titulo da secao "Cores"
- Row 1: 4 swatches (primary, secondary, background, surface) — cada swatch = retangulo colorido (80x80px) + hex value + token name
- Row 2: 4 swatches (text, error, warning, success)
- Screenshot checkpoint → Review: Contrast, Alignment, Spacing

**C) Escala Tipografica**
- Titulo da secao "Tipografia"
- Sample heading-1: "Heading 1 — {{font}} 700 / 36px"
- Sample heading-2: "Heading 2 — {{font}} 600 / 24px"
- Sample body: "Body text — {{font}} 400 / 16px"
- Sample caption: "Caption — {{font}} 400 / 14px"
- Sample code: "const example = true; — {{code font}} 400 / 14px"
- Screenshot checkpoint → Review: Typography, Spacing

**D) Sistema de Espacamento**
- Titulo da secao "Espacamento"
- Para cada token (xs=4px, sm=8px, md=16px, lg=24px, xl=32px, 2xl=48px): barra horizontal colorida com largura proporcional + label
- Screenshot checkpoint → Review: Alignment

**E) Breakpoints**
- Titulo da secao "Breakpoints"
- 4 indicadores visuais: sm (640px/Mobile), md (768px/Tablet), lg (1024px/Desktop), xl (1280px/Wide)
- Screenshot checkpoint

### 3.4: Finalizar Tokens

1. Chame `mcp__paper__finish_working_on_nodes` com `DS_ID`
2. Screenshot final
3. Apresente resumo:

> "Design System criado (tokens):
>
> - {{N}} cores
> - {{N}} niveis tipograficos
> - {{N}} tokens de espacamento
> - {{N}} breakpoints
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
- **Acoes por componente**: o que cada componente FAZ nesta tela (ex: Button "Salvar" → submete formulario, Link "Esqueci senha" → navega para /forgot-password, Input "Email" → valida formato email on blur)

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
> | Button "Entrar" | on click: submit form | POST /api/auth/login → redireciona /dashboard |
> | Link "Esqueci senha" | on click: navega | /forgot-password |
> | Link "Criar conta" | on click: navega | /register |
>
> **`/dashboard`**
> | Componente | Acao | Destino/Efeito |
> |------------|------|----------------|
> | StatsCard | on click: navega | /analytics/{{metric}} |
> | DataTable row | on click: navega | /{{entity}}/{{id}} |
> | DataTable search | on change: filtra | refetch com query param |
> | Button "Novo" | on click: abre modal | CreateModal |
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
> | Button | Primitivo | primary, secondary, ghost, destructive × sm, md, lg | /login, /register, /settings, /admin/users |
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

---

## Passo 5: Criar Componentes no Design System

Com o planejamento aprovado, crie TODOS os componentes identificados no artboard de Design System, ANTES de montar qualquer pagina.

### 5.1: Expandir Artboard

Ajuste a altura do artboard para acomodar os componentes:

```
mcp__paper__update_styles({
  nodeId: DS_ID,
  styles: { height: "fit-content" }
})
```

### 5.2: Titulo da Secao de Componentes

- Titulo "Componentes" (font 700, 36px)
- Subtitulo "{{N}} componentes · {{N}} variantes" (font 400, 14px, cor secundaria)
- Screenshot checkpoint

### 5.3: Renderizar Componentes por Grupo

Agrupe componentes por tipo e renderize cada um isoladamente com todas as suas variantes.

**Ordem de renderizacao:**

**A) Primitivos** (componentes atomicos)

Para cada componente primitivo do plano:

- **Nome do componente** (font 600, 20px)
- **Usado em:** {{lista de rotas}} (font 400, 12px, cor secundaria)
- **Variantes lado a lado** — cada variante renderizada em tamanho real com label abaixo
- **Estados** (se aplicavel): default, hover, disabled, error
- Screenshot a cada 2-3 componentes → Review: Spacing, Alignment, Contrast

Exemplo para Button:
```
[Button]
Usado em: /login, /register, /settings, /admin/users

Primary:    [sm] [md] [lg]
Secondary:  [sm] [md] [lg]
Ghost:      [sm] [md] [lg]
Destructive:[sm] [md] [lg]
```

**B) Compostos** (combinacoes de primitivos)

Para cada componente composto:
- **Nome + descricao** (font 600, 20px + font 400, 14px)
- **Usado em:** {{rotas}}
- **Renderizacao completa** do componente com primitivos reais (usando mesmos tokens)
- Screenshot a cada 2-3 componentes

**C) Layout** (componentes estruturais)

Para cada componente de layout:
- **Nome** (font 600, 20px)
- **Usado em:** {{rotas que usam este layout}}
- **Renderizacao em miniatura** (escala reduzida mostrando a estrutura)
- Screenshot checkpoint

**D) Feature** (componentes de dominio)

Para cada componente de feature:
- **Nome + dominio** (font 600, 20px)
- **Usado em:** {{rotas}}
- **Renderizacao completa** usando primitivos e compostos ja definidos
- Screenshot a cada 2-3 componentes

### 5.4: Registrar Componentes

Mantenha o registro de componentes criados:

```
COMPONENTES_NO_DS = [lista de todos os componentes renderizados]
```

### 5.5: Finalizar Design System Completo

1. `mcp__paper__finish_working_on_nodes` com `DS_ID`
2. Screenshot final do Design System completo
3. Apresente resumo:

> "Design System completo:
>
> **Tokens:** {{N}} cores, {{N}} tipografia, {{N}} espacamento, {{N}} breakpoints
> **Componentes:** {{N}} primitivos, {{N}} compostos, {{N}} layout, {{N}} feature
>
> | Componente | Variantes | Usado em |
> |------------|-----------|----------|
> | Button | primary, secondary, ghost, destructive × 3 sizes | 4 paginas |
> | Input | text, password, search + error | 3 paginas |
> | ... | ... | ... |
>
> Pronto para comecar a compor as paginas. Primeira na fila: **{{rota}}**
>
> Confirma?"

---

## Passo 6: Composicao de Paginas

Agora monte cada pagina USANDO os componentes ja criados no Design System. O visual dos componentes na pagina deve ser identico ao do DS.

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
> - **Artboard**: 1440 x 900px (desktop)
> - **Componentes**: {{lista completa — todos ja existem no DS}}
> - **Estados a representar**: {{lista de estados}}
> - **Conteudo**: {{descricao baseada nos flows e copies}}
> - **Tokens**: consistente com Design System
>
> **Acoes mapeadas nesta tela:**
> | Componente | Acao | Destino/Efeito |
> |------------|------|----------------|
> | {{componente}} | {{evento}}: {{descricao}} | {{resultado}} |
> | ... | ... | ... |
>
> Confirma?"

### 6.3: Criar Artboard

Posicione o artboard ao lado do anterior (horizontalmente). Calcule a posicao X:

```
X = DS_WIDTH + GAP + (pagina_index * (1440 + GAP))
// onde GAP = 100, DS_WIDTH = 1440, pagina_index comeca em 0
```

```
mcp__paper__create_artboard({
  name: "Page — {{rota}}",
  position: { x: X, y: 0 },
  styles: {
    width: "1440px",
    height: "900px",
    backgroundColor: "#FFFFFF",
    display: "flex"
  }
})
```

### 6.4: Construir Layout Incrementalmente

Siga a ordem:

1. Shell do layout (ex: para AppLayout = sidebar 240px + area principal flex-grow)
2. Navbar (logo, links de navegacao, user menu)
3. Sidebar (itens de navegacao com icones/labels)
4. **Screenshot checkpoint**
5. Header da pagina (titulo, breadcrumbs se aplicavel)
6. Secoes do conteudo principal (1 grupo visual por `write_html`)
7. **Screenshot a cada 2-3 writes**
8. **Review completa**: Spacing, Typography, Contrast, Alignment, Clipping, Repetition

> **Dica:** Use `mcp__paper__duplicate_nodes` quando possivel para copiar componentes do DS e manter fidelidade visual. Ajuste posicao e conteudo com `update_styles` e `set_text_content`.

### 6.5: Simular Fluxos de Interacao

Para cada acao mapeada no Passo 4, crie artboards adicionais que representem os estados ANTES e DEPOIS da interacao. Isso simula a experiencia do usuario navegando pela interface.

**Estrategia de simulacao:**

Para cada fluxo critico da tela (baseado em `docs/frontend/08-flows.md`), crie uma **sequencia de artboards** lado a lado representando os passos do fluxo:

1. **Estado inicial** — tela como o usuario a ve ao chegar (ja criado no 6.4)
2. **Interacao ativa** — componente em estado de interacao (ex: input focado com texto digitado, dropdown aberto, modal visivel, tooltip aparecendo)
3. **Feedback** — resultado da acao (ex: loading spinner, skeleton, toast de sucesso/erro, validacao inline)
4. **Estado final** — tela apos a acao completar (ex: dados atualizados, redirect simulado mostrando a tela destino)

**Convencoes de nomenclatura:**
- Artboard principal: `Page — /login`
- Estado de interacao: `Page — /login → Preenchendo form`
- Estado de feedback: `Page — /login → Loading`
- Estado de erro: `Page — /login → Erro validacao`
- Estado de sucesso: `Page — /login → Sucesso → Redirect /dashboard`

**Posicionamento:**
Os artboards de fluxo ficam na MESMA LINHA horizontal, imediatamente apos o artboard principal da pagina. Gap de 60px entre artboards do mesmo fluxo (menor que o gap de 100px entre paginas diferentes, para agrupar visualmente).

```
[DS] --100px-- [/login] --60px-- [/login → Preenchendo] --60px-- [/login → Loading] --60px-- [/login → Erro] --100px-- [/dashboard] --60px-- ...
```

**Anotacoes visuais:**
- Entre cada artboard do fluxo, adicione uma seta visual (→) ou label indicando a acao que conecta os estados
- Use `write_html` para criar um pequeno label entre artboards: "Click 'Entrar'" ou "Valida email" (font 400, 12px, cor secundaria)
- Destaque o componente que mudou de estado com um outline sutil (1px, cor primary, com 20% opacity) para guiar o olhar

**O que simular por tela:**
- Fluxo principal (happy path) — OBRIGATORIO
- Fluxo de erro mais comum — OBRIGATORIO
- Estados intermediarios (loading, empty) — se relevantes

**Quando NAO simular:**
- Navegacao simples entre paginas (Link → outra rota) — basta a pagina destino existir como artboard proprio
- Estados identicos a outra tela ja simulada

**Exemplo para /login:**
```
[/login]              → [/login → Form preenchido]  → [/login → Loading]        → [/login → Dashboard redirect]
(estado inicial)        (inputs com valores,           (button disabled,            (tela do dashboard)
                         email valido)                  spinner no button)

[/login]              → [/login → Email invalido]   → [/login → Erro API]
(estado inicial)        (input email com borda          (toast de erro,
                         vermelha, msg erro)             form resetado)
```

> Apresente ao usuario antes de criar:
> "**Fluxos de interacao para {{pagina}}:**
>
> **Happy path:** {{N}} artboards
> 1. Estado inicial → 2. {{acao}} → 3. {{feedback}} → 4. {{resultado}}
>
> **Erro:** {{N}} artboards
> 1. Estado inicial → 2. {{acao invalida}} → 3. {{feedback erro}}
>
> Criar fluxos de interacao? (S/N)"

### 6.6: Finalizar Pagina

1. `mcp__paper__finish_working_on_nodes` para todos os artboards da pagina (principal + fluxos)
2. Screenshot final de cada artboard
3. Apresentar ao usuario com resumo dos fluxos

### 6.7: Verificar Componentes Nao Previstos

Se durante a composicao surgiu algum componente que NAO estava no planejamento:

1. Informe ao usuario:
   > "Durante a construcao de **{{pagina}}**, identifiquei {{N}} componente(s) nao previsto(s): {{lista}}.
   > Vou adiciona-los ao Design System."

2. Volte ao artboard do DS e adicione os componentes novos (mesmo fluxo do Passo 5.3)
3. Atualize `COMPONENTES_NO_DS`
4. `mcp__paper__finish_working_on_nodes` com `DS_ID`

---

## Passo 7: Proxima Pagina

> "Pagina **{{nome}}** ({{rota}}) composta.
>
> **Progresso:** {{N}}/{{total}} paginas concluidas
>
> Proxima na fila: **{{proxima rota}}** ({{layout}})
>
> Deseja criar? Ou escolha outra da lista."

Se o usuario quiser, volte ao Passo 6 para a proxima pagina.

---

## Passo 8: Resumo Final

Quando o usuario encerrar:

> "**Resumo do projeto no Paper:**
>
> | Artboard | Rota | Tipo | Dimensao |
> |----------|------|------|----------|
> | Design System | — | DS | 1440 x {{altura final}} |
> | {{pagina}} | {{rota}} | Pagina | 1440 x 900 |
> | {{pagina}} → {{acao}} | {{rota}} | Fluxo | 1440 x 900 |
> | ... | ... | ... | ... |
>
> **Design System final:**
> - Tokens: {{N}} cores, {{N}} tipografia, {{N}} espacamento, {{N}} breakpoints
> - Componentes: {{N}} primitivos, {{N}} compostos, {{N}} layout, {{N}} feature
>
> **Paginas compostas:** {{N}}/{{total}}
> **Fluxos de interacao:** {{N}} artboards de fluxo ({{N}} happy paths + {{N}} fluxos de erro)
> **Paginas restantes:** {{lista, se houver}}
>
> Para revisar ou ajustar, selecione elementos no Paper e descreva as alteracoes.
> Para criar mais paginas, rode `/paper` novamente."
