---
name: business-metricas
description: Use when filling the metrics and KPIs section (07-metricas-kpis.md) of the business blueprint. Defines North Star Metric, AARRR pirate metrics, cohort retention, milestones, operational dashboard, and SaaS glossary.
---

# Business Blueprint — Metricas e KPIs

Define a North Star Metric com metricas de suporte, funil AARRR, retencao por coorte, metas e milestones, dashboard operacional e glossario de metricas SaaS.

## Leitura de Contexto

1. Leia `docs/prd.md` — fonte primaria
2. Leia `docs/business/07-metricas-kpis.md` — template a preencher

## Analise de Lacunas

A partir do PRD, identifique o que esta disponivel para cada subsecao:

- **North Star + Metricas de Suporte**: qual a metrica que melhor representa valor entregue ao cliente? Quais 2-3 metricas de suporte a influenciam diretamente?
- **AARRR (Pirate Metrics)**: quais sao as 2 metricas essenciais por estagio do funil (Acquisition, Activation, Retention, Revenue, Referral)? Ha benchmarks de referencia?
- **Retencao por Coorte**: como acompanhar a retencao de cada coorte ao longo do tempo (Mes 0 a Mes 12)?
- **Metas e Milestones**: quais sao os milestones por fase (lancamento, crescimento, maturidade) com criterios de saida? Ha OKRs definidos?
- **Dashboard Operacional**: quais 5 metricas (2 diarias + 3 semanais) o time deve monitorar com alertas?
- **Glossario de Metricas SaaS**: definicoes canonicas de MRR, ARR, ARPU, CAC, LTV, LTV/CAC, Payback, Churn, NRR, Quick Ratio e Magic Number?

Se houver lacunas criticas que NAO podem ser inferidas do PRD, faca ate 3 perguntas pontuais ao usuario antes de gerar.

## Geracao

Preencha `docs/business/07-metricas-kpis.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:
- Informacoes explicitas do PRD
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- inferido do PRD -->`)

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Metricas e KPIs preenchidos. Rode `/business-marketing` para definir a Estrategia de Marketing."
