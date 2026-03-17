---
name: mvp-visao
description: Use when filling the vision section (01-visao.md) of the MVP blueprint. Defines problem, solution, audience, and POC success metrics from the PRD.
---

# MVP Blueprint — Visao

Voce vai preencher a secao de Visao do MVP Blueprint.

## Leitura

1. Leia `docs/prd.md` — fonte primaria
2. Leia `docs/mvp/00-contexto.md` — contexto ja preenchido
3. Leia `docs/mvp/01-visao.md` — template a preencher

## Analise

A partir do PRD, identifique:
- **Problema**: o que existe hoje que e ruim ou inexistente
- **Solucao**: uma frase do que o sistema faz
- **Publico-alvo**: para quem e
- **Metricas de sucesso da POC**: como saber que deu certo

Se as metricas nao estiverem claras no PRD, faca ate 2 perguntas ao usuario.

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/mvp-incrementar`.

Preencha `docs/mvp/01-visao.md` substituindo os comentarios HTML por conteudo real. Seja conciso.

## Revisao

Apresente o documento ao usuario. Aplique ajustes. Salve.

## Proxima etapa

> "Visao preenchida. Rode `/mvp-requisitos` para definir os Requisitos da POC."
