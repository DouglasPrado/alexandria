---
name: frontend-fluxos
description: Preenche a secao de Fluxos de Interface (08-fluxos.md) do frontend blueprint a partir do PRD.
---

# Frontend Blueprint — Fluxos de Interface

Preenche `docs/frontend/08-fluxos.md` com base no PRD e no contexto do projeto.

## Leitura de Contexto

1. Leia `docs/prd.md` — fonte primaria
2. Leia `docs/frontend/08-fluxos.md` — template a preencher

## Analise de Lacunas

A partir do PRD, identifique o que esta disponivel para cada subsecao:

- **Fluxos Criticos (3-5 fluxos com passos e tratamento de erros)**: Quais sao os fluxos principais do usuario, seus passos detalhados e como erros sao tratados em cada etapa?
- **Microfrontends (quando aplicavel)**: O sistema utiliza microfrontends? Se sim, como os fluxos se distribuem entre eles?

Se houver lacunas criticas que NAO podem ser inferidas do PRD, faca ate 3 perguntas pontuais ao usuario antes de gerar.

> Ao referenciar tecnologias especificas com versoes, consulte https://context7.com/ para garantir versoes atualizadas.

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/frontend-incrementar`.

Preencha `docs/frontend/08-fluxos.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:
- Informacoes explicitas do PRD
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- inferido do PRD -->`)

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Fluxos de Interface preenchido. Rode `/frontend-testes` para preencher Estrategia de Testes."
