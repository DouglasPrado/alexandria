---
name: blueprint-context
description: Use when filling the system context section (00-context.md) of the software blueprint. Defines actors, external systems, system boundaries, and constraints from the PRD.
---

# Blueprint — Contexto do Sistema

Voce vai preencher a secao de Contexto do Sistema do blueprint. Esta secao define quem usa o sistema, com quais sistemas externos ele se comunica, onde terminam suas responsabilidades e quais restricoes moldam as decisoes.

## Leitura de Contexto

1. Leia `docs/prd.md` — esta e sua fonte primaria de informacao
2. Leia `docs/blueprint/00-context.md` — este e o template que voce vai preencher

## Analise de Lacunas

A partir do PRD, identifique o que esta disponivel e o que falta para cada subsecao:

- **Atores**: Quem interage com o sistema? (pessoas, sistemas, dispositivos)
- **Sistemas Externos**: Quais integracoes sao necessarias?
- **Limites do Sistema**: O que esta dentro e fora do escopo?
- **Restricoes e Premissas**: Restricoes tecnicas, de negocio ou regulatorias?

Se houver lacunas criticas que NAO podem ser inferidas do PRD, faca ate 3 perguntas pontuais ao usuario antes de gerar. Priorize perguntas sobre limites do sistema e integracoes — estas sao as mais dificeis de inferir.

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/blueprint-incrementar`.

Preencha `docs/blueprint/00-context.md` substituindo TODOS os `{{placeholders}}` por informacoes reais. Mantenha a estrutura e formatacao do template original. Use:

- Informacoes explicitas do PRD
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- inferido do PRD -->` em comentario HTML)

## Diagrama

Atualize tambem `docs/diagrams/context/system-context.mmd` com os atores e sistemas externos identificados. Substitua todos os placeholders do diagrama Mermaid.

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Contexto preenchido. Rode `/blueprint-vision` para definir a Visao e Objetivos do sistema."
