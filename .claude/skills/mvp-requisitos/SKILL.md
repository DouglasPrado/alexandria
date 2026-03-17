---
name: mvp-requisitos
description: Use when filling the requirements section (02-requisitos.md) of the MVP blueprint. Defines must-have, should-have, and out-of-scope items for the POC.
---

# MVP Blueprint — Requisitos da POC

Voce vai preencher a secao de Requisitos do MVP Blueprint.

## Leitura

1. Leia `docs/prd.md` — fonte primaria
2. Leia `docs/mvp/00-contexto.md` e `docs/mvp/01-visao.md` — contexto anterior
3. Leia `docs/mvp/02-requisitos.md` — template a preencher

## Analise

A partir do PRD e limites da POC, classifique os requisitos:
- **Must have**: o minimo para a POC ter valor
- **Should have**: se sobrar tempo
- **Fora do escopo**: fica para depois

Seja agressivo no corte. POC = minimo viavel. Na duvida, vai para "fora do escopo".

Se nao estiver claro o que e must vs should, faca ate 2 perguntas ao usuario.

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/mvp-incrementar`.

Preencha `docs/mvp/02-requisitos.md`. Use checklist (- [ ]) para must e should. Seja conciso.

## Revisao

Apresente o documento ao usuario. Aplique ajustes. Salve.

## Proxima etapa

> "Requisitos preenchidos. Rode `/mvp-dominio` para definir o Dominio."
