# Componentes

Define a hierarquia de componentes, padroes de composicao e o template de documentacao que cada componente deve seguir. A organizacao em niveis garante reusabilidade e clareza de responsabilidades, evitando componentes que fazem "tudo" e dificultam manutencao.

---

## Hierarquia de Componentes

> Como os componentes sao classificados por nivel de complexidade?

### Primitive Components (UI)

> Componentes atomicos sem logica de negocio. Vivem em `components/ui/`.

| Componente | Props Principais | Variantes |
| --- | --- | --- |
| Button | {{variant, size, disabled, loading}} | {{primary, secondary, ghost, destructive}} |
| Input | {{type, placeholder, error, disabled}} | {{text, password, search, number}} |
| Card | {{padding, border, shadow}} | {{default, outlined, elevated}} |
| Modal | {{open, onClose, title, size}} | {{default, confirmation, fullscreen}} |
| Badge | {{variant, count}} | {{default, dot, count}} |
| Avatar | {{src, name, size}} | {{image, initials, fallback}} |

<!-- APPEND:primitivos -->

### Composite Components

> Combinacao de primitivos para padroes recorrentes. Vivem em `components/` ou `components/forms/`.

| Componente | Primitivos Usados | Contexto de Uso |
| --- | --- | --- |
| Form | {{Input, Button, Select}} | {{Formularios com validacao}} |
| Sidebar | {{Button, Avatar, Badge}} | {{Navegacao lateral}} |
| Navbar | {{Button, Avatar, Input}} | {{Navegacao superior}} |
| DataTable | {{Input, Button, Badge, Pagination}} | {{Listagem de dados tabulares}} |
| Pagination | {{Button}} | {{Navegacao entre paginas de dados}} |

<!-- APPEND:compostos -->

### Feature Components

> Componentes ligados a um dominio de negocio especifico. Vivem em `features/xxx/components/`.

| Componente | Feature/Dominio | Dados que Consome |
| --- | --- | --- |
| {{UserProfile}} | {{auth}} | {{Dados do usuario autenticado}} |
| {{FileUploader}} | {{storage}} | {{Configuracoes de upload, progresso}} |
| {{BillingPanel}} | {{billing}} | {{Plano atual, faturas, metodos de pagamento}} |
| {{DashboardGrid}} | {{dashboard}} | {{Metricas, graficos, atividade recente}} |
| {{Outro componente}} | {{Feature}} | {{Dados}} |

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
<summary>Exemplo — Documentacao do Button</summary>

### Button

**Descricao:** Botao reutilizavel com variantes visuais, suporte a loading state e icones.

**Props:**
| Prop | Tipo | Default | Obrigatoria | Descricao |
| --- | --- | --- | --- | --- |
| variant | `"primary" \| "secondary" \| "ghost" \| "destructive"` | `"primary"` | Nao | Estilo visual do botao |
| size | `"sm" \| "md" \| "lg"` | `"md"` | Nao | Tamanho do botao |
| loading | `boolean` | `false` | Nao | Exibe spinner e desabilita clique |
| disabled | `boolean` | `false` | Nao | Desabilita o botao |
| leftIcon | `ReactNode` | — | Nao | Icone a esquerda do label |

**Exemplo de Uso:**
```tsx
<Button variant="primary" size="md" loading={isSubmitting}>
  Salvar alteracoes
</Button>
```

**Storybook:** [Link para story](http://localhost:6006/?path=/story/button)

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

---

## Quando Criar vs Reutilizar

> Pergunta-guia para decidir se criar novo componente:

| Situacao | Acao | Onde criar |
| --- | --- | --- |
| Sera usado em 2+ lugares | Crie como componente compartilhado | `components/ui/` |
| E especifico de uma feature | Crie dentro da feature | `features/xxx/components/` |
| Ja existe no design system | Reutilize | — |
| E uma variante de componente existente | Adicione variante ao existente | Componente original |

> Antes de criar, verifique o Storybook e o catalogo de componentes. (ver 03-design-system.md)
