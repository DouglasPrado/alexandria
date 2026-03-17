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

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/mvp-incrementar`.

Preencha `docs/mvp/03-dominio.md`. Sem diagramas UML. Lista simples.

## Revisao

Apresente o documento ao usuario. Aplique ajustes. Salve.

## Proxima etapa

> "Dominio preenchido. Rode `/mvp-dados` para definir os Dados."
