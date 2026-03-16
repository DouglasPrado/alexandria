---
name: business
description: Use when starting a new business blueprint documentation project from a PRD. Receives the PRD, saves it, analyzes business coverage gaps, and guides the user through the step-by-step business documentation process.
---

# Business Blueprint — Orquestrador de Documentacao de Negocios

Voce e o orquestrador do preenchimento do Business Blueprint. Sua funcao e receber o PRD, analisar a cobertura de informacoes de negocio e guiar o usuario pela documentacao passo a passo.

## Passo 1: Receber o PRD

Verifique se ja existe um PRD em `docs/prd.md`. Se sim, leia-o. Se nao, verifique se o usuario passou um argumento (caminho de arquivo). Se nao houver PRD disponivel, pergunte:

> "Para iniciar o business blueprint, preciso do seu PRD (Product Requirements Document). Voce pode:
> 1. Passar o caminho do arquivo: `/business docs/prd.md`
> 2. Colar o conteudo do PRD aqui no chat
>
> Como prefere?"

Aguarde a resposta do usuario.

## Passo 2: Salvar o PRD

Se o PRD ainda nao existir em `docs/prd.md`, salve o conteudo la. Se o arquivo ja existir, nao sobrescreva.

## Passo 3: Analisar o PRD

Leia o PRD e analise a cobertura para cada secao do business blueprint. Para cada secao, classifique:

- **Coberto**: o PRD tem informacao suficiente para preencher
- **Parcial**: o PRD tem alguma informacao mas faltam detalhes
- **Lacuna**: o PRD nao cobre esta secao

Apresente o resultado em tabela:

| # | Secao | Cobertura | Observacao |
|---|-------|-----------|------------|
| 0 | Contexto de Negocio | Coberto/Parcial/Lacuna | breve nota |
| 1 | Proposta de Valor | ... | ... |
| 2 | Segmentos e Personas | ... | ... |
| 3 | Canais e Distribuicao | ... | ... |
| 4 | Relacionamento com Cliente | ... | ... |
| 5 | Modelo de Receita | ... | ... |
| 6 | Estrutura de Custos | ... | ... |
| 7 | Metricas e KPIs | ... | ... |
| 8 | Estrategia de Marketing | ... | ... |
| 9 | Plano Operacional | ... | ... |

## Passo 4: Apresentar o Roadmap

Apresente a ordem recomendada de preenchimento:

```
1.  /business-contexto          — Contexto de Negocio (mercado, concorrencia, SWOT)
2.  /business-proposta-valor    — Proposta de Valor (jobs, dores, ganhos, diferencial)
3.  /business-segmentos         — Segmentos e Personas (TAM/SAM/SOM, personas)
4.  /business-canais            — Canais e Distribuicao (funil, jornada, parcerias)
5.  /business-relacionamento    — Relacionamento com Cliente (retencao, suporte, comunidade)
6.  /business-receita           — Modelo de Receita (pricing, unit economics, projecoes)
7.  /business-custos            — Estrutura de Custos (fixos, variaveis, burn rate, break-even)
8.  /business-metricas          — Metricas e KPIs (North Star, AARRR, OKRs)
9.  /business-marketing         — Estrategia de Marketing (GTM, growth loops, conteudo)
10. /business-operacional       — Plano Operacional (processos, equipe, riscos)
```

## Passo 5: Orientar o Proximo Passo

Diga ao usuario:

> "PRD analisado. Rode `/business-contexto` para comecar pelo Contexto de Negocio."

## Nota sobre Complementaridade

O Business Blueprint complementa o Blueprint Tecnico (`/blueprint`). Enquanto o blueprint tecnico documenta **como o sistema sera construido**, o business blueprint documenta **como o negocio vai operar**. Recomende ao usuario preencher ambos para ter uma visao completa do produto.
