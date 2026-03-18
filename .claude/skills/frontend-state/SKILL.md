---
name: frontend-estado
description: Preenche a secao de Gerenciamento de Estado (05-estado.md) do frontend blueprint a partir do PRD.
---

# Frontend Blueprint — Gerenciamento de Estado

Preenche `docs/frontend/05-estado.md` com base no PRD e no contexto do projeto.

## Leitura de Contexto

1. Leia `docs/prd.md` — fonte primaria
2. Leia `docs/frontend/05-estado.md` — template a preencher

## Analise de Lacunas

A partir do PRD, identifique o que esta disponivel para cada subsecao:

- **Tipos de Estado**: Quais categorias de estado existem (local, global, server, URL, form)?
- **Server State**: Como o estado vindo do servidor e gerenciado (caching, revalidacao, optimistic updates)?
- **Global State**: Qual a estrategia para estado global (store, context, signals) e quando utiliza-lo?
- **Event Bus**: Existe comunicacao entre componentes via eventos? Qual o padrao adotado?
- **Anti-patterns**: Quais praticas de gerenciamento de estado devem ser evitadas no projeto?

Se houver lacunas criticas que NAO podem ser inferidas do PRD, faca ate 3 perguntas pontuais ao usuario antes de gerar.

> Ao referenciar tecnologias especificas com versoes, consulte https://context7.com/ para garantir versoes atualizadas.

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/frontend-incrementar`.

Preencha `docs/frontend/05-estado.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:
- Informacoes explicitas do PRD
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- inferido do PRD -->`)

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Gerenciamento de Estado preenchido. Rode `/frontend-data-layer` para preencher Data Layer."
