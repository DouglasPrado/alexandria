---
name: business-metrics
description: Preenche a secao de Metricas e KPIs (07-metrics-kpis.md) do business blueprint a partir do blueprint tecnico.
---

# Business Blueprint — Metricas e KPIs

Define a North Star Metric com metricas de suporte, funil AARRR, retencao por coorte, metas e milestones, dashboard operacional e glossario de metricas SaaS.

## Leitura de Contexto

1. Leia `docs/blueprint/01-vision.md` (metricas de sucesso) e `docs/blueprint/15-observability.md` — fontes primarias
2. Leia `docs/prd.md` — fallback/complemento
3. Leia `docs/business/07-metrics-kpis.md` — template a preencher

## Analise de Lacunas

A partir do blueprint tecnico, identifique o que esta disponivel para cada subsecao:

- **North Star + Metricas de Suporte**: qual a metrica que melhor representa valor entregue ao cliente? Quais 2-3 metricas de suporte a influenciam diretamente?
- **AARRR (Pirate Metrics)**: quais sao as 2 metricas essenciais por estagio do funil (Acquisition, Activation, Retention, Revenue, Referral)? Ha benchmarks de referencia?
- **Retencao por Coorte**: como acompanhar a retencao de cada coorte ao longo do tempo (Mes 0 a Mes 12)?
- **Metas e Milestones**: quais sao os milestones por fase (lancamento, crescimento, maturidade) com criterios de saida? Ha OKRs definidos?
- **Dashboard Operacional**: quais 5 metricas (2 diarias + 3 semanais) o time deve monitorar com alertas?
- **Glossario de Metricas SaaS**: definicoes canonicas de MRR, ARR, ARPU, CAC, LTV, LTV/CAC, Payback, Churn, NRR, Quick Ratio e Magic Number?

Se houver lacunas criticas que NAO podem ser inferidas do blueprint tecnico, faca ate 3 perguntas pontuais ao usuario antes de gerar.

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/business-increment`.

Preencha `docs/business/07-metrics-kpis.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:
- Informacoes explicitas do blueprint tecnico
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- do blueprint: 01-vision.md, 15-observability.md -->`)

**REGRA CRITICA: NUNCA invente numeros.** Valores de metricas, metas, taxas, benchmarks, percentuais ou qualquer dado numerico que NAO esteja explicitamente no blueprint tecnico devem ser perguntados ao usuario. Use `{{placeholder}}` para campos numericos sem dados.

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Metricas e KPIs preenchidos. Rode `/business-marketing` para definir a Estrategia de Marketing."
