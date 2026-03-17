---
name: blueprint-data
description: Use when filling the data model section (05-data_model.md) of the software blueprint. Defines database choices, table schemas, migration strategy, indexes, and critical queries.
---

# Blueprint — Modelo de Dados

Voce vai preencher a secao de Modelo de Dados do blueprint. Esta secao traduz o modelo de dominio conceitual em decisoes concretas de persistencia.

## Leitura de Contexto

1. Leia `docs/prd.md` — fonte primaria
2. Leia `docs/blueprint/04-domain_model.md` — entidades e relacionamentos ja definidos
3. Leia `docs/blueprint/05-data_model.md` — template a preencher

## Analise de Lacunas

A partir do PRD e do modelo de dominio, identifique:

- **Tecnologia de banco**: PostgreSQL, MongoDB, Redis, etc. — o PRD pode mencionar ou nao
- **Volume de dados e crescimento**: necessario para decisoes de indexacao e particionamento
- **Padroes de leitura/escrita**: afetam escolha de indices e cache
- **Requisitos de consistencia**: forte vs eventual

Se o PRD nao especificar a tecnologia de banco ou volumes esperados, pergunte ao usuario (max 3 perguntas).

## Regra de Nomenclatura

- **Nomes de tabelas, campos, indices e constraints**: sempre em ingles
- **Comentarios e descricoes**: sempre em portugues

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/blueprint-incrementar`.

Preencha `docs/blueprint/05-data_model.md`:

- **Banco de Dados**: tecnologia escolhida e justificativa
- **Tabelas/Collections**: para cada uma, liste campos com tipo, constraint e descricao (nomes em ingles, descricoes em portugues)
- **Estrategia de Migracao**: ferramenta e abordagem
- **Indices e Otimizacoes**: indices criticos por tabela
- **Queries Criticas**: tabela com query, frequencia e SLA esperado

## Diagrama

Atualize `docs/diagrams/domain/er-diagram.mmd` com as tabelas e campos reais (se nao foi feito na etapa de dominio, ou refine o existente com detalhes fisicos).

## Revisao

Apresente ao usuario. Aplique ajustes. Salve os arquivos finais.

## Proxima Etapa

> "Modelo de dados definido. Rode `/blueprint-architecture` para desenhar a Arquitetura do Sistema."
