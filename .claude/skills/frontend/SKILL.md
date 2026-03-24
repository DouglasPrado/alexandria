---
name: frontend
description: Use when starting a new frontend blueprint documentation project a partir do blueprint tecnico (docs/blueprint/). Reads the technical blueprint, analyzes frontend coverage gaps, and guides the user through the step-by-step frontend documentation process.
---

# Frontend Blueprint — Orquestrador de Documentacao de Frontend

Voce e o orquestrador do preenchimento do Frontend Blueprint. Sua funcao e ler o blueprint tecnico (docs/blueprint/), analisar a cobertura de informacoes de frontend e guiar o usuario pela documentacao passo a passo.

## Passo 1: Ler o Blueprint Tecnico

Leia todos os arquivos do blueprint tecnico em `docs/blueprint/` como fonte primaria:

1. `docs/blueprint/00-context.md` — atores, sistemas externos, limites
2. `docs/blueprint/01-vision.md` — problema, metricas, nao-objetivos
3. `docs/blueprint/02-architecture_principles.md` — principios e restricoes
4. `docs/blueprint/03-requirements.md` — requisitos funcionais e nao-funcionais
5. `docs/blueprint/04-domain-model.md` — entidades, regras, relacionamentos
6. `docs/blueprint/05-data-model.md` — banco, tabelas, migrations
7. `docs/blueprint/06-system-architecture.md` — componentes, comunicacao, deploy
8. `docs/blueprint/07-critical_flows.md` — fluxos criticos com happy/error path
9. `docs/blueprint/08-use_cases.md` — casos de uso estruturados
10. `docs/blueprint/09-state-models.md` — maquinas de estado
11. `docs/blueprint/10-architecture_decisions.md` — ADRs
12. `docs/blueprint/11-build_plan.md` — fases e milestones
13. `docs/blueprint/12-testing_strategy.md` — piramide e cobertura
14. `docs/blueprint/13-security.md` — STRIDE, auth, OWASP
15. `docs/blueprint/14-scalability.md` — cache, rate limit, escala
16. `docs/blueprint/15-observability.md` — logs, metricas, traces
17. `docs/blueprint/16-evolution.md` — roadmap, deprecacao
18. `docs/blueprint/17-communication.md` — email, SMS, WhatsApp

Se o blueprint tecnico estiver vazio ou incompleto, use `docs/prd.md` como fallback. Se nenhum dos dois estiver disponivel, pergunte:

> "Para iniciar o frontend blueprint, preciso do blueprint tecnico preenchido (docs/blueprint/). Voce pode:
> 1. Rodar `/blueprint` para preencher o blueprint tecnico primeiro
> 2. Passar o caminho do PRD como fallback: `/frontend docs/prd.md`
>
> Como prefere?"

Aguarde a resposta do usuario.

## Passo 2: Salvar o PRD

Se o PRD ainda nao existir em `docs/prd.md`, salve o conteudo la. Se o arquivo ja existir, nao sobrescreva.

## Passo 3: Analisar o Blueprint Tecnico

Leia o blueprint tecnico e analise a cobertura para cada secao do frontend blueprint. Para cada secao, classifique:

- **Coberto**: o blueprint tecnico tem informacao suficiente para preencher
- **Parcial**: o blueprint tecnico tem alguma informacao mas faltam detalhes
- **Lacuna**: o blueprint tecnico nao cobre esta secao

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
| 14 | Copies | ... | ... |

## Passo 4: Apresentar o Roadmap

Apresente a ordem recomendada de preenchimento:

```
1.  /frontend-vision            — Visao e stack do frontend
2.  /frontend-architecture      — Camadas e fronteiras de dominio
3.  /frontend-structure        — Estrutura de pastas e modulos
4.  /frontend-design-system    — Tokens, temas e componentes base
5.  /frontend-components      — Hierarquia e padroes de componentes
6.  /frontend-state           — Gerenciamento de estado
7.  /frontend-data-layer       — API client, data fetching, contratos
8.  /frontend-routes            — Rotas, guards e navegacao
9.  /frontend-flows           — Fluxos criticos de interface
10. /frontend-tests           — Piramide e estrategia de testes
11. /frontend-performance      — Otimizacao e Core Web Vitals
12. /frontend-security        — Autenticacao e protecao
13. /frontend-observability  — Monitoramento e feature flags
14. /frontend-cicd             — Pipeline e convencoes de codigo
15. /frontend-copies            — Textos e copies de todas as telas
```

## Passo 5: Orientar o Proximo Passo

Diga ao usuario:

> "Blueprint tecnico analisado. Rode `/frontend-vision` para comecar pelo primeiro documento."

## Nota sobre Hierarquia

A hierarquia de documentacao segue o fluxo: **PRD** -> **Blueprint Tecnico** (`docs/blueprint/`) -> **Frontend Blueprint** (`docs/frontend/`). O PRD define o produto, o blueprint tecnico detalha a arquitetura e decisoes do sistema, e o frontend blueprint documenta como a interface sera arquitetada e implementada. O frontend blueprint usa o blueprint tecnico como fonte primaria, garantindo alinhamento com as decisoes tecnicas ja tomadas.
