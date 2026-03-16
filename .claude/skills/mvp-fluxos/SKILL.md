---
name: mvp-fluxos
description: Use when filling the critical flows section (06-fluxos.md) of the MVP blueprint. Documents 2-3 critical flows with numbered steps and main error handling.
---

# MVP Blueprint — Fluxos Criticos

Voce vai preencher a secao de Fluxos Criticos do MVP Blueprint.

## Leitura

1. Leia `docs/prd.md` — fonte primaria
2. Leia `docs/mvp/02-requisitos.md` e `docs/mvp/05-arquitetura.md` — requisitos e arquitetura
3. Leia `docs/mvp/06-fluxos.md` — template a preencher

## Analise

A partir dos requisitos must-have, identifique os 2-3 fluxos mais criticos. Um fluxo critico e aquele sem o qual a POC nao tem valor.

Para cada fluxo, defina:
- **Nome**: o que o fluxo faz
- **Passos**: caminho feliz em passos numerados
- **Erro principal**: o que pode dar errado e como trata

Maximo 3 fluxos. Se o PRD sugere mais, escolha os mais essenciais.

## Geracao

Preencha `docs/mvp/06-fluxos.md`. Sem sequence diagrams obrigatorios, sem performance requirements. Passos numerados + erro principal.

## Revisao

Apresente o documento ao usuario. Aplique ajustes. Salve.

## Conclusao

> "MVP Blueprint completo! Todos os 7 documentos foram preenchidos:
> - `docs/mvp/00-contexto.md`
> - `docs/mvp/01-visao.md`
> - `docs/mvp/02-requisitos.md`
> - `docs/mvp/03-dominio.md`
> - `docs/mvp/04-dados.md`
> - `docs/mvp/05-arquitetura.md`
> - `docs/mvp/06-fluxos.md`
>
> Revise os documentos. Para refazer qualquer secao, use o comando correspondente (ex: `/mvp-contexto`)."
