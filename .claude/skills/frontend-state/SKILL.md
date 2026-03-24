---
name: frontend-state
description: Preenche a secao de Gerenciamento de Estado (05-state.md) do frontend blueprint a partir do blueprint tecnico.
---

# Frontend Blueprint — Gerenciamento de Estado

Preenche `docs/frontend/05-state.md` com base no blueprint tecnico e no contexto do projeto.

## Leitura de Contexto

1. Leia `docs/blueprint/09-state-models.md` — maquinas de estado das entidades
2. Leia `docs/blueprint/04-domain-model.md` — entidades e regras
3. Leia `docs/frontend/05-state.md` — template a preencher
4. Leia `docs/prd.md` — complemento se necessario

## Analise de Lacunas

A partir do blueprint tecnico, identifique o que esta disponivel para cada subsecao:

- **Tipos de Estado**: Quais categorias de estado existem (local, global, server, URL, form)?
- **Server State**: Como o estado vindo do servidor e gerenciado (caching, revalidacao, optimistic updates)?
- **Global State**: Qual a estrategia para estado global (store, context, signals) e quando utiliza-lo?
- **Event Bus**: Existe comunicacao entre componentes via eventos? Qual o padrao adotado?
- **Anti-patterns**: Quais praticas de gerenciamento de estado devem ser evitadas no projeto?

Se houver lacunas criticas que NAO podem ser inferidas do blueprint tecnico, faca ate 3 perguntas pontuais ao usuario antes de gerar.

> **Versões atualizadas:** Ao referenciar tecnologias específicas com versões, use o MCP context7 para consultar documentação atualizada. Primeiro chame `mcp__context7__resolve-library-id` para obter o ID da biblioteca, depois `mcp__context7__query-docs` para consultar versões e exemplos.

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/frontend-increment`.

Preencha `docs/frontend/05-state.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:
- Informacoes explicitas do blueprint tecnico
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- do blueprint: XX-arquivo.md -->`)

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Gerenciamento de Estado preenchido. Rode `/frontend-data-layer` para preencher Data Layer."
