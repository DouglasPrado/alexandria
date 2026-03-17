---
name: blueprint-states
description: Use when filling the state models section (09-state_models.md) of the software blueprint. Defines state machines for entities with lifecycle, including states, transitions, and triggers.
---

# Blueprint — Modelos de Estado

Voce vai preencher a secao de Modelos de Estado do blueprint. Modelos de estado descrevem o ciclo de vida das entidades cujo comportamento depende do estado em que se encontram.

## Leitura de Contexto

1. Leia `docs/prd.md` — fonte primaria
2. Leia `docs/blueprint/04-domain_model.md` — entidades e seus status
3. Leia `docs/blueprint/08-use_cases.md` — acoes que mudam estados
4. Leia `docs/blueprint/09-state_models.md` — template a preencher
5. Leia `docs/diagrams/domain/state-template.mmd` — template de diagrama de estados

## Analise de Lacunas

Identifique no modelo de dominio quais entidades possuem campo de status ou ciclo de vida relevante (ex: pedido, pagamento, assinatura, job, tarefa). Para cada uma, voce precisa de:

- **Estados possiveis**: lista completa com descricao
- **Transicoes**: de qual estado para qual, por qual gatilho, sob qual condicao
- **Transicoes proibidas**: o que NAO pode acontecer
- **Acoes por transicao**: emitir evento, auditar, atualizar timestamp

Se o PRD nao detalhar transicoes ou restricoes de estado, pergunte ao usuario (max 3 perguntas).

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/blueprint-incrementar`.

Preencha `docs/blueprint/09-state_models.md`. Para cada entidade com ciclo de vida:

- Nome e descricao da entidade
- Tabela de estados possiveis com descricao
- Tabela de transicoes: De, Para, Gatilho, Condicao
- Lista de transicoes proibidas

## Diagramas

Para cada entidade com ciclo de vida, crie um diagrama de estados em `docs/diagrams/domain/` usando o template `state-template.mmd` como base. Nomeie como `state-{entidade}.mmd` (kebab-case).

## Revisao

Apresente ao usuario. Aplique ajustes. Salve os arquivos finais.

## Proxima Etapa

> "Estados modelados. Rode `/blueprint-decisions` para registrar as Decisoes Arquiteturais."
