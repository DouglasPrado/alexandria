---
name: mvp-dados
description: Use when filling the data section (04-dados.md) of the MVP blueprint. Defines database technology, schema, and key decisions for the POC.
---

# MVP Blueprint — Dados

Voce vai preencher a secao de Dados do MVP Blueprint.

## Leitura

1. Leia `docs/prd.md` — fonte primaria
2. Leia `docs/mvp/03-dominio.md` — entidades e regras de negocio
3. Leia `docs/mvp/04-dados.md` — template a preencher

## Analise

A partir do dominio e PRD, defina:
- **Tecnologia**: qual banco/storage e por que (uma frase)
- **Schema**: tabelas ou collections com campos chave (so o essencial)
- **Decisoes**: por que essa tech e nao outra

Para POC, prefira a opcao mais simples (SQLite > PostgreSQL, JSON file > Redis, etc.) a menos que o PRD exija algo especifico.

## Geracao

Preencha `docs/mvp/04-dados.md`. Sem migration strategy, sem indices, sem partitioning. So o schema minimo.

## Revisao

Apresente o documento ao usuario. Aplique ajustes. Salve.

## Proxima etapa

> "Dados preenchidos. Rode `/mvp-arquitetura` para definir a Arquitetura."
