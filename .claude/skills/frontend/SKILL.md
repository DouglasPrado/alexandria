---
name: frontend
description: Use when starting a new frontend blueprint documentation project from a PRD. Receives the PRD, saves it, analyzes frontend coverage gaps, and guides the user through the step-by-step frontend documentation process.
---

# Frontend Blueprint — Orquestrador de Documentacao de Frontend

Voce e o orquestrador do preenchimento do Frontend Blueprint. Sua funcao e receber o PRD, analisar a cobertura de informacoes de frontend e guiar o usuario pela documentacao passo a passo.

## Passo 1: Receber o PRD

Verifique se ja existe um PRD em `docs/prd.md`. Se sim, leia-o. Se nao, verifique se o usuario passou um argumento (caminho de arquivo). Se nao houver PRD disponivel, pergunte:

> "Para iniciar o frontend blueprint, preciso do seu PRD (Product Requirements Document). Voce pode:
> 1. Passar o caminho do arquivo: `/frontend docs/prd.md`
> 2. Colar o conteudo do PRD aqui no chat
>
> Como prefere?"

Aguarde a resposta do usuario.

## Passo 2: Salvar o PRD

Se o PRD ainda nao existir em `docs/prd.md`, salve o conteudo la. Se o arquivo ja existir, nao sobrescreva.

## Passo 3: Analisar o PRD

Leia o PRD e analise a cobertura para cada secao do frontend blueprint. Para cada secao, classifique:

- **Coberto**: o PRD tem informacao suficiente para preencher
- **Parcial**: o PRD tem alguma informacao mas faltam detalhes
- **Lacuna**: o PRD nao cobre esta secao

Apresente o resultado em tabela:

| # | Secao | Cobertura | Observacao |
|---|-------|-----------|------------|
| 00 | Visao do Frontend | Coberto/Parcial/Lacuna | breve nota |
| 01 | Arquitetura | ... | ... |
| 02 | Estrutura do Projeto | ... | ... |
| 03 | Design System | ... | ... |
| 04 | Componentes | ... | ... |
| 05 | Gerenciamento de Estado | ... | ... |
| 06 | Data Layer | ... | ... |
| 07 | Rotas e Navegacao | ... | ... |
| 08 | Fluxos de Interface | ... | ... |
| 09 | Estrategia de Testes | ... | ... |
| 10 | Performance | ... | ... |
| 11 | Seguranca | ... | ... |
| 12 | Observabilidade | ... | ... |
| 13 | CI/CD e Convencoes | ... | ... |

## Passo 4: Apresentar o Roadmap

Apresente a ordem recomendada de preenchimento:

```
1.  /frontend-visao            — Visao e stack do frontend
2.  /frontend-arquitetura      — Camadas e fronteiras de dominio
3.  /frontend-estrutura        — Estrutura de pastas e modulos
4.  /frontend-design-system    — Tokens, temas e componentes base
5.  /frontend-componentes      — Hierarquia e padroes de componentes
6.  /frontend-estado           — Gerenciamento de estado
7.  /frontend-data-layer       — API client, data fetching, contratos
8.  /frontend-rotas            — Rotas, guards e navegacao
9.  /frontend-fluxos           — Fluxos criticos de interface
10. /frontend-testes           — Piramide e estrategia de testes
11. /frontend-performance      — Otimizacao e Core Web Vitals
12. /frontend-seguranca        — Autenticacao e protecao
13. /frontend-observabilidade  — Monitoramento e feature flags
14. /frontend-cicd             — Pipeline e convencoes de codigo
```

## Passo 5: Orientar o Proximo Passo

Diga ao usuario:

> "PRD analisado. Rode `/frontend-visao` para comecar pelo primeiro documento."

## Nota sobre Complementaridade

O Frontend Blueprint complementa o Business Blueprint (`/business`) e o Blueprint Tecnico (`/blueprint`). Enquanto o business blueprint documenta **como o negocio vai operar** e o blueprint tecnico documenta **como o sistema sera construido**, o frontend blueprint documenta **como a interface sera arquitetada e implementada**. Recomende ao usuario preencher todos para ter uma visao completa do produto.
