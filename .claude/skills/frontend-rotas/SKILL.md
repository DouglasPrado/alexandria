---
name: frontend-rotas
description: Preenche a secao de Rotas (07-rotas.md) do frontend blueprint a partir do PRD.
---

# Frontend Blueprint — Rotas

Preenche `docs/frontend/07-rotas.md` com base no PRD e no contexto do projeto.

## Leitura de Contexto

1. Leia `docs/prd.md` — fonte primaria
2. Leia `docs/frontend/07-rotas.md` — template a preencher

## Analise de Lacunas

A partir do PRD, identifique o que esta disponivel para cada subsecao:

- **Estrutura de Rotas**: Quais paginas e rotas o sistema possui e como estao organizadas hierarquicamente?
- **Protecao de Rotas**: Quais rotas exigem autenticacao, autorizacao ou condicoes especiais de acesso?
- **Layouts Compartilhados**: Quais layouts sao reutilizados entre rotas e como a composicao de layouts funciona?
- **Navegacao**: Como o usuario navega entre as paginas, quais menus e breadcrumbs existem?

Se houver lacunas criticas que NAO podem ser inferidas do PRD, faca ate 3 perguntas pontuais ao usuario antes de gerar.

> Ao referenciar tecnologias especificas com versoes, consulte https://context7.com/ para garantir versoes atualizadas.

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/frontend-incrementar`.

Preencha `docs/frontend/07-rotas.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:
- Informacoes explicitas do PRD
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- inferido do PRD -->`)

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Rotas preenchido. Rode `/frontend-fluxos` para preencher Fluxos de Interface."
