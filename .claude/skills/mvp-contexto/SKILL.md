---
name: mvp-contexto
description: Use when filling the system context section (00-contexto.md) of the MVP blueprint. Defines actors, external systems, and POC boundaries from the PRD.
---

# MVP Blueprint — Contexto do Sistema

Voce vai preencher a secao de Contexto do Sistema do MVP Blueprint.

## Leitura

1. Leia `docs/prd.md` — fonte primaria
2. Leia `docs/mvp/00-contexto.md` — template a preencher

## Analise

A partir do PRD, identifique:
- **O que e**: uma frase descrevendo o sistema
- **Quem usa**: atores e o que fazem
- **Sistemas externos**: integracoes necessarias para a POC
- **Limites da POC**: o que nao faz parte

Se faltar informacao critica sobre limites ou integracoes, faca ate 2 perguntas ao usuario.

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/mvp-incrementar`.

Preencha `docs/mvp/00-contexto.md` substituindo os comentarios HTML por conteudo real. Mantenha a estrutura do template. Seja conciso.

## Revisao

Apresente o documento ao usuario. Aplique ajustes. Salve.

## Proxima etapa

> "Contexto preenchido. Rode `/mvp-visao` para definir a Visao."
