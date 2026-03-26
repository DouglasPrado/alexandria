---
name: blueprint-decisions
description: Use when filling the architecture decisions section (10-architecture_decisions.md) of the software blueprint. Creates ADRs documenting key technical choices with context, options, and consequences.
---

# Blueprint — Decisoes Arquiteturais

Voce vai preencher a secao de Decisoes Arquiteturais do blueprint. ADRs (Architecture Decision Records) documentam as escolhas tecnicas importantes, suas alternativas e consequencias.

## Leitura de Contexto

1. Leia `docs/prd.md` — fonte primaria
2. Leia `docs/blueprint/02-architecture_principles.md` — principios que guiam decisoes
3. Leia `docs/blueprint/04-domain-model.md` — modelo de dominio
4. Leia `docs/blueprint/05-data-model.md` — decisoes de persistencia
5. Leia `docs/blueprint/06-system-architecture.md` — decisoes de arquitetura
6. Leia `docs/blueprint/10-architecture_decisions.md` — template a preencher
7. Leia `docs/adr/adr-template.md` — template de ADR individual

## Analise de Lacunas

Identifique as decisoes tecnicas significativas ja tomadas nas secoes anteriores:

- Escolha de banco de dados (do modelo de dados)
- Padrao arquitetural: monolito, microsservicos, event-driven (da arquitetura)
- Protocolos de comunicacao: REST, gRPC, mensageria (da arquitetura)
- Estrategia de cache, filas, deploy (da arquitetura)

Para cada decisao, voce precisa de contexto, alternativas consideradas e justificativa. Se alguma decisao nao tiver justificativa clara, pergunte ao usuario (max 3 perguntas).

## Geracao

> **Modo de escrita:**
>
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/blueprint-increment`.

Preencha `docs/blueprint/10-architecture_decisions.md` com a lista de ADRs. Para cada ADR, crie tambem um arquivo individual em `docs/adr/` usando o template `adr-template.md`:

- **Contexto**: problema e restricoes
- **Drivers de decisao**: fatores mais importantes
- **Opcoes**: 2-3 alternativas com pros/contras/esforco/risco
- **Decisao**: opcao escolhida e justificativa
- **Consequencias**: positivas, negativas e riscos
- **Acoes necessarias**: tarefas para implementar

## Revisao

Apresente ao usuario. Aplique ajustes. Salve os arquivos finais.

## Proxima Etapa

> "Decisoes registradas. Rode `/blueprint-buildplan` para criar o Plano de Construcao."
