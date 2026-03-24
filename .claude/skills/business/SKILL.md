---
name: business
description: Use when starting a new business blueprint documentation project. Reads the technical blueprint (docs/blueprint/), analyzes business coverage gaps, and guides the user through the step-by-step business documentation process.
---

# Business Blueprint — Orquestrador de Documentacao de Negocios

Voce e o orquestrador do preenchimento do Business Blueprint. Sua funcao e ler o blueprint tecnico, analisar a cobertura de informacoes de negocio e guiar o usuario pela documentacao passo a passo.

## Passo 1: Ler o Blueprint Tecnico

Verifique se ja existem arquivos em `docs/blueprint/`. Se sim, leia os arquivos relevantes (especialmente `00-context.md`, `01-vision.md`, `03-requirements.md`, `06-system-architecture.md`). Se nao existirem, tente ler `docs/prd.md` como fallback. Se nenhuma fonte estiver disponivel, pergunte:

> "Para iniciar o business blueprint, preciso da documentacao tecnica do projeto. Voce pode:
> 1. Rodar `/blueprint` para gerar o blueprint tecnico primeiro
> 2. Passar o caminho do arquivo PRD: `/business docs/prd.md`
> 3. Colar o conteudo aqui no chat
>
> Como prefere?"

Aguarde a resposta do usuario.

## Passo 2: Salvar o PRD (fallback)

Se o blueprint tecnico nao existir e o usuario fornecer um PRD que ainda nao exista em `docs/prd.md`, salve o conteudo la. Se o arquivo ja existir, nao sobrescreva.

## Passo 3: Analisar o Blueprint Tecnico

Leia os arquivos do blueprint tecnico e analise a cobertura para cada secao do business blueprint. Para cada secao, classifique:

- **Coberto**: o blueprint tecnico tem informacao suficiente para preencher
- **Parcial**: o blueprint tecnico tem alguma informacao mas faltam detalhes
- **Lacuna**: o blueprint tecnico nao cobre esta secao

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
1.  /business-context          — Contexto de Negocio (mercado, concorrencia, SWOT)
2.  /business-value-proposition    — Proposta de Valor (jobs, dores, ganhos, diferencial)
3.  /business-segments         — Segmentos e Personas (TAM/SAM/SOM, personas)
4.  /business-channels            — Canais e Distribuicao (funil, jornada, parcerias)
5.  /business-relationships    — Relacionamento com Cliente (retencao, suporte, comunidade)
6.  /business-revenue           — Modelo de Receita (pricing, unit economics, projecoes)
7.  /business-costs            — Estrutura de Custos (fixos, variaveis, burn rate, break-even)
8.  /business-metrics          — Metricas e KPIs (North Star, AARRR, OKRs)
9.  /business-marketing         — Estrategia de Marketing (GTM, growth loops, conteudo)
10. /business-operational       — Plano Operacional (processos, equipe, riscos)
```

## Passo 5: Orientar o Proximo Passo

Diga ao usuario:

> "Blueprint tecnico analisado. Rode `/business-context` para comecar pelo Contexto de Negocio."

## Regra Critica: Nunca Inventar Numeros

**NUNCA invente, estime ou fabrique dados numericos** (valores financeiros, percentuais, projecoes, metricas, precos, TAM/SAM/SOM, CAC, LTV, burn rate, etc.). Se o blueprint tecnico nao fornecer um numero especifico, **pergunte ao usuario** antes de preencher. Use `{{placeholder}}` ou `[PREENCHER]` para campos numericos sem dados. Esta regra se aplica a TODAS as sub-skills de business.

## Nota sobre Complementaridade

O Business Blueprint complementa o Blueprint Tecnico (`/blueprint`). O fluxo recomendado e: PRD → blueprint tecnico → business blueprint. Enquanto o blueprint tecnico documenta **como o sistema sera construido**, o business blueprint documenta **como o negocio vai operar**. Recomende ao usuario preencher ambos para ter uma visao completa do produto.
