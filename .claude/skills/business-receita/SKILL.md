---
name: business-receita
description: Use when filling the revenue model section (05-modelo-receita.md) of the business blueprint. Defines revenue sources, MRR composition, NRR, pricing strategy, unit economics, and revenue projections.
---

# Business Blueprint — Modelo de Receita

Define as fontes de receita, composicao do MRR, retencao liquida, estrategia de pricing, unit economics e projecoes financeiras do negocio.

## Leitura de Contexto

1. Leia `docs/prd.md` — fonte primaria
2. Leia `docs/business/05-modelo-receita.md` — template a preencher

## Analise de Lacunas

A partir do PRD, identifique o que esta disponivel para cada subsecao:

- **Fontes de Receita**: quais sao as formas de monetizacao e qual o tipo de cada uma (recorrente, transacional, uso, comissao)?
- **Composicao do MRR**: como o MRR se decompoe (New MRR, Expansion, Churn, Reactivation)? Ha risco de concentracao de receita?
- **Net Revenue Retention (NRR)**: qual o NRR atual e a meta? A expansao supera o churn nos clientes existentes?
- **Estrategia de Pricing**: qual modelo de precificacao (freemium, flat rate, por uso, tiered, per seat, hibrido)? Existe free tier?
- **Tabela de Precos**: existem planos/tiers definidos com recursos e precos especificos?
- **Unit Economics**: ha dados ou estimativas de CAC, LTV, LTV/CAC, payback, margem bruta, ARPU, churn rate e SaaS Magic Number? (inclui coluna de Benchmark)
- **Projecoes de Receita**: existem metas de receita em 5 checkpoints (Mes 1, 3, 6, 9, 12)?
- **Premissas Financeiras**: quais premissas sustentam as projecoes (formato simplificado: premissa, valor assumido, risco)?

Se houver lacunas criticas que NAO podem ser inferidas do PRD, faca ate 3 perguntas pontuais ao usuario antes de gerar.

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/business-incrementar`.

Preencha `docs/business/05-modelo-receita.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:
- Informacoes explicitas do PRD
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- inferido do PRD -->`)

**REGRA CRITICA: NUNCA invente numeros.** Valores de MRR, precos, CAC, LTV, projecoes, unit economics ou qualquer dado numerico que NAO esteja explicitamente no PRD devem ser perguntados ao usuario. Use `{{placeholder}}` para campos numericos sem dados.

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Modelo de Receita preenchido. Rode `/business-custos` para definir a Estrutura de Custos."
