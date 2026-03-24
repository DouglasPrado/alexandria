---
name: blueprint-buildplan
description: Use when filling the build plan section (11-build_plan.md) of the software blueprint. Defines implementation phases, milestones, deliverables, priorities, risks, and external dependencies.
---

# Blueprint — Plano de Construcao

Voce vai preencher a secao de Plano de Construcao do blueprint. O plano de construcao transforma a arquitetura em um roadmap executavel com fases, entregas e riscos.

## Leitura de Contexto

1. Leia `docs/prd.md` — fonte primaria (prazos, prioridades, MVP)
2. Leia `docs/blueprint/03-requirements.md` — requisitos priorizados
3. Leia `docs/blueprint/07-critical_flows.md` — fluxos criticos (determinam ordem)
4. Leia `docs/blueprint/08-use_cases.md` — casos de uso (escopo de cada fase)
5. Leia `docs/blueprint/11-build_plan.md` — template a preencher

## Analise de Lacunas

Identifique a partir do PRD:

- **Fases/Milestones**: o PRD define fases? MVP vs versao completa?
- **Prioridades**: quais features primeiro?
- **Riscos tecnicos**: dependencias externas, complexidade, incertezas
- **Dependencias externas**: equipes, sistemas, parceiros

Se o PRD nao definir fases ou prioridades claras, proponha uma divisao baseada nos requisitos Must/Should/Could e pergunte ao usuario (max 3 perguntas).

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/blueprint-increment`.

Preencha `docs/blueprint/11-build_plan.md`:

- **Fases**: 2-4 fases com objetivo, entregas, dependencias e criterios de aceite. Estimativas em T-shirt (S/M/L/XL).
- **Priorizacao**: tabela com item, valor de negocio, esforco, risco, prioridade
- **Riscos tecnicos**: tabela com descricao, probabilidade, impacto e mitigacao
- **Dependencias externas**: tabela com sistema/equipe, tipo, responsavel e status

## Revisao

Apresente ao usuario. Aplique ajustes. Salve o arquivo final.

## Proxima Etapa

> "Plano de construcao definido. Rode `/blueprint-testing` para definir a Estrategia de Testes."
