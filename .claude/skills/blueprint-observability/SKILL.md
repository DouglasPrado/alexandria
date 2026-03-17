---
name: blueprint-observability
description: Use when filling the observability section (15-observability.md) of the software blueprint. Defines structured logging, metrics (Golden Signals), distributed tracing, alerting, dashboards, and health checks.
---

# Blueprint — Observabilidade

Voce vai preencher a secao de Observabilidade do blueprint. Se voce nao consegue observar, voce nao consegue operar. Esta secao define como o sistema sera monitorado.

## Leitura de Contexto

1. Leia `docs/prd.md` — fonte primaria
2. Leia `docs/blueprint/06-system_architecture.md` — componentes e stack
3. Leia `docs/blueprint/14-scalability.md` — metricas e thresholds de escala
4. Leia `docs/blueprint/15-observability.md` — template a preencher

## Analise de Lacunas

Identifique a partir das secoes anteriores:

- **Logs**: formato, niveis, retencao, eventos criticos
- **Metricas**: Golden Signals (latencia, trafego, erros, saturacao) + metricas custom
- **Tracing**: ferramenta, protocolo de propagacao, taxa de amostragem
- **Alertas**: condicoes, severidades (P1-P4), politica de escalacao
- **Dashboards**: operacional e de negocio
- **Health checks**: liveness e readiness

Se o PRD nao mencionar ferramentas de monitoramento ou politica de alertas, proponha opcoes e pergunte ao usuario (max 3 perguntas).

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/blueprint-incrementar`.

Preencha `docs/blueprint/15-observability.md`:

- **Logs**: formato JSON estruturado com exemplo, niveis, retencao por ambiente
- **Metricas**: tabela Golden Signals com thresholds + metricas custom
- **Tracing**: ferramenta, convencoes de spans, taxa de amostragem
- **Alertas**: tabela com alerta, severidade, condicao e runbook. Tabela de severidades com SLA de resposta. Politica de escalacao em 3 etapas.
- **Dashboards**: tabela com nome, publico-alvo e metricas incluidas
- **Health checks**: endpoints de liveness e readiness com resposta JSON esperada

## Revisao

Apresente ao usuario. Aplique ajustes. Salve o arquivo final.

## Proxima Etapa

> "Observabilidade configurada. Rode `/blueprint-evolution` para a ultima etapa: Evolucao e Migracao."
