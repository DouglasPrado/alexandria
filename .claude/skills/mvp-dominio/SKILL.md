---
name: mvp-dominio
description: Use when filling the domain section (03-dominio.md) of the MVP blueprint. Defines glossary, entities, relationships, and business rules from the PRD.
---

# MVP Blueprint — Dominio

Voce vai preencher a secao de Dominio do MVP Blueprint.

## Leitura

1. Leia `docs/prd.md` — fonte primaria
2. Leia `docs/mvp/00-contexto.md` a `docs/mvp/02-requisitos.md` — contexto anterior
3. Leia `docs/mvp/03-dominio.md` — template a preencher

## Analise

A partir do PRD e requisitos, identifique:
- **Glossario**: termos do negocio com definicao em uma frase
- **Entidades**: coisas principais do sistema, atributos chave, como se relacionam
- **Regras de negocio**: restricoes que o sistema precisa respeitar

Foque apenas nas entidades necessarias para os requisitos must-have.

Se o dominio nao estiver claro no PRD, faca ate 2 perguntas ao usuario.

## Geracao

Preencha `docs/mvp/03-dominio.md`. Sem diagramas UML. Lista simples.

## Revisao

Apresente o documento ao usuario. Aplique ajustes. Salve.

## Proxima etapa

> "Dominio preenchido. Rode `/mvp-dados` para definir os Dados."
