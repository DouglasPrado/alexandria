# Componentes

Define a hierarquia de componentes, padroes de composicao e o template de documentacao que cada componente deve seguir. A organizacao em niveis garante reusabilidade e clareza de responsabilidades, evitando componentes que fazem "tudo" e dificultam manutencao.

---

## Hierarquia de Componentes

> Como os componentes sao classificados por nivel de complexidade?

### Primitive Components (UI)

> Componentes atomicos sem logica de negocio. Vivem em `components/ui/`. Baseados em primitivos do React Native (`View`, `Text`, `Pressable`, `TextInput`, `Image`, `ScrollView`).

| Componente | Props Principais | Variantes |
| --- | --- | --- |
| Button | {{variant, size, disabled, loading}} | {{primary, secondary, ghost, destructive}} |
| TextInput | {{placeholder, error, disabled, secureTextEntry}} | {{text, password, search, number}} |
| Card | {{padding, border, shadow}} | {{default, outlined, elevated}} |
| BottomSheet | {{open, onClose, title, snapPoints}} | {{default, confirmation, fullscreen}} |
| Badge | {{variant, count}} | {{default, dot, count}} |
| Avatar | {{source, name, size}} | {{image, initials, fallback}} |
| Icon | {{name, size, color}} | {{outlined, filled}} |
| Skeleton | {{width, height, borderRadius}} | {{text, circle, rectangle}} |

<!-- APPEND:primitivos -->

### Composite Components

> Combinacao de primitivos para padroes recorrentes. Vivem em `components/` ou `components/forms/`.

| Componente | Primitivos Usados | Contexto de Uso |
| --- | --- | --- |
| Form | {{TextInput, Button, Picker}} | {{Formularios com validacao}} |
| TabBar | {{Pressable, Icon, Text}} | {{Navegacao inferior (bottom tabs)}} |
| Header | {{Pressable, Text, Icon}} | {{Cabecalho de tela com navegacao}} |
| ListItem | {{View, Text, Icon, Pressable}} | {{Item de lista com swipe actions}} |
| SearchBar | {{TextInput, Icon, Pressable}} | {{Busca com autocomplete}} |
| EmptyState | {{Image, Text, Button}} | {{Estado vazio de listas}} |

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
  <Text>Conteudo</Text>
</{{NomeDoComponente}}>
\`\`\`

**Storybook:** [Link para story]({{url}})
```

<details>
<summary>Exemplo — Documentacao do Button</summary>

### Button

**Descricao:** Botao reutilizavel com variantes visuais, suporte a loading state e icones. Baseado em `Pressable` com feedback haptico.

**Props:**
| Prop | Tipo | Default | Obrigatoria | Descricao |
| --- | --- | --- | --- | --- |
| variant | `"primary" \| "secondary" \| "ghost" \| "destructive"` | `"primary"` | Nao | Estilo visual do botao |
| size | `"sm" \| "md" \| "lg"` | `"md"` | Nao | Tamanho do botao |
| loading | `boolean` | `false` | Nao | Exibe ActivityIndicator e desabilita toque |
| disabled | `boolean` | `false` | Nao | Desabilita o botao |
| leftIcon | `ReactNode` | — | Nao | Icone a esquerda do label |
| haptic | `boolean` | `true` | Nao | Feedback haptico ao pressionar |

**Exemplo de Uso:**
```tsx
<Button variant="primary" size="md" loading={isSubmitting}>
  <Text>Salvar alteracoes</Text>
</Button>
```

**Storybook:** [Link para story](http://localhost:6006/?path=/story/button)

</details>

---

## Padroes de Composicao

> Quais padroes de composicao sao adotados?

- **Compound Components** — componentes que funcionam juntos via contexto compartilhado
  - Ex: `<List><ListItem /><ListSeparator /></List>`
- **Render Props** — quando o consumidor precisa controlar a renderizacao
  - Usar apenas quando children pattern nao resolve
- **Children pattern** — composicao via `children` para flexibilidade
  - Ex: `<Card><CardHeader /><CardBody /></Card>`
- **Headless components** — logica sem UI, o consumidor fornece a renderizacao
  - Ex: `useBottomSheet()`, `useSwipeable()`
- **FlatList renderItem** — pattern para listas performaticas
  - Ex: `<FlatList renderItem={({ item }) => <ListItem data={item} />} />`

---

## Componentes Nativos Essenciais

> Quais componentes do React Native sao utilizados como base?

| Componente RN | Uso | Observacao |
| --- | --- | --- |
| `View` | Container base para layout (Flexbox) | Equivalente a `div` |
| `Text` | Todo texto deve estar dentro de `Text` | Obrigatorio no RN |
| `Pressable` | Botoes e areas tocaveis | Preferir sobre `TouchableOpacity` |
| `FlatList` | Listas longas e performaticas | Com `keyExtractor` e `getItemLayout` |
| `SectionList` | Listas agrupadas por secao | Headers de secao nativos |
| `ScrollView` | Conteudo scrollavel (nao-lista) | Evitar para listas longas |
| `Image` | Imagens locais e remotas | Considerar FastImage para cache |
| `TextInput` | Campos de entrada de texto | Suporte a `secureTextEntry` |
| `Modal` | Modais nativos | Ou usar bottom sheets |
| `ActivityIndicator` | Spinner de loading nativo | Respeita plataforma |
| `KeyboardAvoidingView` | Evita que teclado cubra inputs | Comportamento diferente iOS/Android |

---

## Quando Criar vs Reutilizar

> Pergunta-guia para decidir se criar novo componente:

| Situacao | Acao | Onde criar |
| --- | --- | --- |
| Sera usado em 2+ lugares | Crie como componente compartilhado | `components/ui/` |
| E especifico de uma feature | Crie dentro da feature | `features/xxx/components/` |
| Ja existe no design system | Reutilize | — |
| E uma variante de componente existente | Adicione variante ao existente | Componente original |
| Requer interacao com API nativa | Crie wrapper na camada de infra | `services/` ou `features/xxx/` |

> Antes de criar, verifique o Storybook e o catalogo de componentes. (ver 03-design-system.md)
