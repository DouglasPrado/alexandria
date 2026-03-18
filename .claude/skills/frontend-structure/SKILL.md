---
name: frontend-estrutura
description: Preenche a secao de Estrutura do Projeto (02-estrutura-projeto.md) do frontend blueprint a partir do PRD.
---

# Frontend Blueprint — Estrutura do Projeto

Preenche `docs/frontend/02-estrutura-projeto.md` com base no PRD e no contexto do projeto.

## Leitura de Contexto

1. Leia `docs/prd.md` — fonte primaria
2. Leia `docs/frontend/02-estrutura-projeto.md` — template a preencher

## Analise de Lacunas

A partir do PRD, identifique o que esta disponivel para cada subsecao:

- **Estrutura de Pastas**: Qual a organizacao de diretorios do projeto e onde ficam os principais artefatos?
- **Organizacao por Feature**: Como as features sao isoladas e organizadas dentro da estrutura?
- **Monorepo**: O projeto utiliza monorepo? Se sim, qual a estrategia de workspaces e compartilhamento?
- **Regras de Importacao**: Quais convencoes e restricoes de importacao entre modulos devem ser seguidas?

Se houver lacunas criticas que NAO podem ser inferidas do PRD, faca ate 3 perguntas pontuais ao usuario antes de gerar.

> Ao referenciar tecnologias especificas com versoes, consulte https://context7.com/ para garantir versoes atualizadas.

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/frontend-incrementar`.

Preencha `docs/frontend/02-estrutura-projeto.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:
- Informacoes explicitas do PRD
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- inferido do PRD -->`)

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Estrutura do Projeto preenchida. Rode `/frontend-design-system` para preencher Design System."
