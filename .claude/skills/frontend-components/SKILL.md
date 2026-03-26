---
name: frontend-components
description: Preenche a secao de Componentes (04-components.md) do frontend blueprint a partir do blueprint tecnico.
---

# Frontend Blueprint — Componentes

Preenche `docs/frontend/{client}/04-components.md` com base no blueprint tecnico e no contexto do projeto.

## Identificacao do Cliente

Este skill aceita um parametro de cliente: `web`, `mobile`, ou `desktop`.
Se o parametro nao for fornecido, pergunte:

> "Para qual cliente voce esta preenchendo este documento? (web / mobile / desktop)"

Caminho de saida: `docs/frontend/{client}/04-components.md`
Leia tambem os documentos compartilhados em `docs/frontend/shared/` para contexto.

## Leitura de Contexto

1. Leia `docs/blueprint/04-domain-model.md` — entidades para mapear em componentes
2. Leia `docs/blueprint/08-use_cases.md` — casos de uso para features
3. Leia `docs/frontend/{client}/03-design-system.md` — design system (ja preenchido)
4. Leia `docs/frontend/{client}/04-components.md` — template a preencher
5. Leia `docs/prd.md` — complemento se necessario

## Analise de Lacunas

A partir do blueprint tecnico, identifique o que esta disponivel para cada subsecao:

- **Hierarquia de Componentes (Primitive, Composite, Feature)**: Quais niveis de componentes existem e como se relacionam?
- **Template de Documentacao**: Qual o padrao de documentacao para cada componente (props, exemplos, variantes)?
- **Padroes de Composicao**: Quais padroes de composicao sao utilizados (compound components, render props, slots)?
- **Quando Criar vs Reutilizar**: Quais criterios definem se um componente deve ser criado do zero ou reutilizado?

Se houver lacunas criticas que NAO podem ser inferidas do blueprint tecnico, faca ate 3 perguntas pontuais ao usuario antes de gerar.

> **Versões atualizadas:** Ao referenciar tecnologias específicas com versões, use o MCP context7 para consultar documentação atualizada. Primeiro chame `mcp__context7__resolve-library-id` para obter o ID da biblioteca, depois `mcp__context7__query-docs` para consultar versões e exemplos.

## Contexto por Plataforma

### Se web:

- Componentes baseados em DOM (div, button, input)
- Bibliotecas de componentes: shadcn/ui, Radix, Headless UI
- Padroes: Server Components vs Client Components, portals, modais

### Se mobile:

- Componentes baseados em React Native Views (View, Text, Pressable, ScrollView)
- Listas performaticas: FlatList, FlashList, SectionList
- Padroes: gestos (PanResponder, Reanimated), bottom sheets, navigation headers

### Se desktop:

- Mesma base web + componentes especificos de desktop
- Componentes nativos: TitleBar, SystemTray, MenuBar, ContextMenu
- Padroes: janelas multiplas, dialogs nativos do OS, drag-and-drop de arquivos

## Geracao

> **Modo de escrita:**
>
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/frontend-increment`.

Preencha `docs/frontend/{client}/04-components.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:

- Informacoes explicitas do blueprint tecnico
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- do blueprint: XX-arquivo.md -->`)

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Componentes preenchido para {client}. Rode `/frontend-state {client}` para preencher Gerenciamento de Estado."
