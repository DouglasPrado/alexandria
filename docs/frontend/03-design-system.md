# Design System

Define os tokens de design, padroes visuais e componentes base que garantem consistencia visual em toda a aplicacao. O design system funciona como plataforma compartilhada entre designers e desenvolvedores, servindo como fonte unica de verdade para decisoes visuais.

---

## Design Tokens

> Quais sao os tokens fundamentais do sistema visual?

### Cores

| Token | Valor | Uso |
| --- | --- | --- |
| `--color-primary` | {{#3B82F6}} | {{Acoes principais, links, botoes primarios}} |
| `--color-secondary` | {{#6366F1}} | {{Acoes secundarias, destaques}} |
| `--color-background` | {{#FFFFFF}} | {{Fundo principal da aplicacao}} |
| `--color-surface` | {{#F9FAFB}} | {{Fundo de cards e superficies elevadas}} |
| `--color-text` | {{#111827}} | {{Texto principal}} |
| `--color-error` | {{#EF4444}} | {{Erros e validacoes}} |
| `--color-warning` | {{#F59E0B}} | {{Alertas e avisos}} |
| `--color-success` | {{#10B981}} | {{Sucesso e confirmacoes}} |

<!-- APPEND:cores -->

### Tipografia

| Token | Font Family | Size | Weight | Uso |
| --- | --- | --- | --- | --- |
| `heading-1` | {{Inter}} | {{2.25rem}} | {{700}} | {{Titulos de pagina}} |
| `heading-2` | {{Inter}} | {{1.5rem}} | {{600}} | {{Titulos de secao}} |
| `body` | {{Inter}} | {{1rem}} | {{400}} | {{Texto corrido}} |
| `caption` | {{Inter}} | {{0.875rem}} | {{400}} | {{Textos auxiliares e labels}} |
| `code` | {{JetBrains Mono}} | {{0.875rem}} | {{400}} | {{Blocos de codigo}} |

### Espacamento

> Sistema baseado em grid de 8px

| Token | Valor |
| --- | --- |
| `space-xs` | 4px |
| `space-sm` | 8px |
| `space-md` | 16px |
| `space-lg` | 24px |
| `space-xl` | 32px |
| `space-2xl` | 48px |

### Breakpoints

| Token | Valor | Dispositivo |
| --- | --- | --- |
| `sm` | 640px | Mobile |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Wide Desktop |

---

## Temas

> A aplicacao suporta multiplos temas?

- [ ] Light only
- [ ] Light + Dark
- [ ] Customizavel pelo usuario

{{Descreva a estrategia de temas — como os tokens sao alternados, onde fica a logica de troca, se usa CSS variables ou outra abordagem}}

<details>
<summary>Exemplo — Implementacao com CSS Variables</summary>

```css
:root {
  --color-background: #FFFFFF;
  --color-text: #111827;
  --color-surface: #F9FAFB;
}

[data-theme="dark"] {
  --color-background: #111827;
  --color-text: #F9FAFB;
  --color-surface: #1F2937;
}
```

</details>

---

## Ferramentas

> Quais ferramentas conectam design e codigo?

| Ferramenta | Proposito | URL |
| --- | --- | --- |
| Figma | Design de interfaces e prototipacao | {{URL do projeto Figma}} |
| Storybook | Documentacao interativa de componentes | {{URL do Storybook}} |
| {{Outra ferramenta}} | {{Proposito}} | {{URL}} |

---

## Catalogo de Componentes Base

> Quais sao os componentes primitivos do design system?

| Componente | Variantes | Status |
| --- | --- | --- |
| Button | {{primary, secondary, ghost, destructive}} | {{Pronto}} |
| Input | {{text, password, search, number}} | {{Pronto}} |
| Select | {{single, multi, searchable}} | {{Pronto}} |
| Card | {{default, outlined, elevated}} | {{Pronto}} |
| Modal | {{default, confirmation, fullscreen}} | {{Em desenvolvimento}} |
| Toast | {{success, error, warning, info}} | {{Em desenvolvimento}} |
| Badge | {{default, dot, count}} | {{Pronto}} |
| Avatar | {{image, initials, fallback}} | {{Pronto}} |
| Tooltip | {{top, bottom, left, right}} | {{Planejado}} |
| Skeleton | {{text, card, avatar, table}} | {{Planejado}} |

<!-- APPEND:catalogo -->

> Documentacao completa dos componentes: (ver 04-componentes.md)
