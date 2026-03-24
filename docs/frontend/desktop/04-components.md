# Componentes

Define a hierarquia de componentes, padroes de composicao e o template de documentacao que cada componente deve seguir. A organizacao em niveis garante reusabilidade e clareza de responsabilidades, evitando componentes que fazem "tudo" e dificultam manutencao.

---

## Hierarquia de Componentes

> Como os componentes sao classificados por nivel de complexidade?

### Primitive Components (UI)

> Componentes atomicos sem logica de negocio. Vivem em `renderer/components/ui/`.

| Componente | Props Principais | Variantes |
| --- | --- | --- |
| Button | {{variant, size, disabled, loading}} | {{primary, secondary, ghost, destructive}} |
| Input | {{type, placeholder, error, disabled}} | {{text, password, search, number}} |
| Card | {{padding, border, shadow}} | {{default, outlined, elevated}} |
| Modal | {{open, onClose, title, size}} | {{default, confirmation, fullscreen}} |
| Badge | {{variant, count}} | {{default, dot, count}} |
| Avatar | {{src, name, size}} | {{image, initials, fallback}} |

<!-- APPEND:primitivos -->

### Desktop-Specific Components

> Componentes exclusivos da aplicacao desktop. Vivem em `renderer/components/desktop/`.

| Componente | Props Principais | Descricao |
| --- | --- | --- |
| TitleBar | {{title, showControls, draggable}} | Barra de titulo customizada (frameless window) com botoes de minimizar, maximizar e fechar |
| SystemTray | {{tooltip, icon, contextMenu}} | Gerenciamento do icone e menu de contexto na system tray |
| MenuBar | {{items, onItemClick}} | Barra de menu da aplicacao (File, Edit, View, Help) |
| NativeNotification | {{title, body, icon, onClick}} | Wrapper para notificacoes nativas do sistema operacional |
| FileDialog | {{type, filters, defaultPath}} | Dialogo nativo de abrir/salvar arquivo via IPC |
| UpdateBanner | {{version, onUpdate, onDismiss}} | Banner de atualizacao disponivel com acoes de instalar ou ignorar |

<!-- APPEND:desktop-components -->

### Composite Components

> Combinacao de primitivos para padroes recorrentes. Vivem em `renderer/components/` ou `renderer/components/forms/`.

| Componente | Primitivos Usados | Contexto de Uso |
| --- | --- | --- |
| Form | {{Input, Button, Select}} | {{Formularios com validacao}} |
| Sidebar | {{Button, Avatar, Badge}} | {{Navegacao lateral}} |
| Navbar | {{Button, Avatar, Input}} | {{Navegacao superior}} |
| DataTable | {{Input, Button, Badge, Pagination}} | {{Listagem de dados tabulares}} |
| Pagination | {{Button}} | {{Navegacao entre paginas de dados}} |

<!-- APPEND:compostos -->

### Feature Components

> Componentes ligados a um dominio de negocio especifico. Vivem em `renderer/features/xxx/components/`.

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
<summary>Exemplo — Documentacao do TitleBar</summary>

### TitleBar

**Descricao:** Barra de titulo customizada para janelas frameless, com suporte a drag e botoes nativos de controle (minimizar, maximizar, fechar).

**Props:**
| Prop | Tipo | Default | Obrigatoria | Descricao |
| --- | --- | --- | --- | --- |
| title | `string` | App name | Nao | Texto exibido na barra de titulo |
| showControls | `boolean` | `true` | Nao | Exibe botoes de minimizar, maximizar e fechar |
| draggable | `boolean` | `true` | Nao | Permite arrastar a janela pela barra |
| onMinimize | `() => void` | — | Nao | Callback ao minimizar |
| onMaximize | `() => void` | — | Nao | Callback ao maximizar |
| onClose | `() => void` | — | Nao | Callback ao fechar |

**Exemplo de Uso:**
```tsx
<TitleBar title="Minha Aplicacao" showControls draggable>
  <MenuBar items={menuItems} />
</TitleBar>
```

**Storybook:** [Link para story](http://localhost:6006/?path=/story/desktop-titlebar)

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
- **IPC-aware components** — componentes que encapsulam comunicacao IPC
  - Ex: `<FileDialog>` que internamente chama `window.electronAPI.showOpenDialog()`

---

## Quando Criar vs Reutilizar

> Pergunta-guia para decidir se criar novo componente:

| Situacao | Acao | Onde criar |
| --- | --- | --- |
| Sera usado em 2+ lugares | Crie como componente compartilhado | `renderer/components/ui/` |
| E especifico de uma feature | Crie dentro da feature | `renderer/features/xxx/components/` |
| E especifico do desktop (tray, menu, titlebar) | Crie como componente desktop | `renderer/components/desktop/` |
| Ja existe no design system | Reutilize | — |
| E uma variante de componente existente | Adicione variante ao existente | Componente original |

> Antes de criar, verifique o Storybook e o catalogo de componentes. (ver 03-design-system.md)
