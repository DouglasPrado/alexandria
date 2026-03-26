---
name: frontend
description: Use when starting a new frontend blueprint documentation project a partir do blueprint tecnico (docs/blueprint/). Reads the technical blueprint, analyzes frontend coverage gaps, and guides the user through the step-by-step frontend documentation process. Supports multiple clients (web, mobile, desktop) in monorepo structure.
---

# Frontend Blueprint — Orquestrador de Documentacao de Frontend

Voce e o orquestrador do preenchimento do Frontend Blueprint. Sua funcao e ler o blueprint tecnico (docs/blueprint/), analisar a cobertura de informacoes de frontend e guiar o usuario pela documentacao passo a passo. O sistema suporta multiplos clientes (web, mobile, desktop) em estrutura de monorepo.

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
12. `docs/blueprint/11-build_plan.md` — entregas e milestones
13. `docs/blueprint/12-testing_strategy.md` — piramide e cobertura
14. `docs/blueprint/13-security.md` — STRIDE, auth, OWASP
15. `docs/blueprint/14-scalability.md` — cache, rate limit, escala
16. `docs/blueprint/15-observability.md` — logs, metricas, traces
17. `docs/blueprint/16-evolution.md` — roadmap, deprecacao
18. `docs/blueprint/17-communication.md` — email, SMS, WhatsApp

Se o blueprint tecnico estiver vazio ou incompleto, use `docs/prd.md` como fallback. Se nenhum dos dois estiver disponivel, pergunte:

> "Para iniciar o frontend blueprint, preciso do blueprint tecnico preenchido (docs/blueprint/). Voce pode:
>
> 1. Rodar `/blueprint` para preencher o blueprint tecnico primeiro
> 2. Passar o caminho do PRD como fallback: `/frontend docs/prd.md`
>
> Como prefere?"

Aguarde a resposta do usuario.

## Passo 1.5: Deteccao de Estrutura Existente

Verifique se existem arquivos `.md` diretamente em `docs/frontend/` (sem subpastas). Se sim, oferecer migracao:

> "Detectei documentos em formato flat em `docs/frontend/`. O sistema agora usa estrutura multi-client.
> Deseja migrar os docs existentes para `docs/frontend/web/`? Os arquivos compartilhados (design-system, data-layer, api-dependencies) irao para `docs/frontend/shared/`."

Se o usuario aceitar, mova os arquivos correspondentes.

## Passo 2: Selecao de Clientes

Pergunte ao usuario quais clientes frontend ele precisa documentar:

> "Quais clientes frontend voce precisa documentar?
>
> 1. **Web** (Next.js / Remix / SPA)
> 2. **Mobile** (React Native / Expo)
> 3. **Desktop** (Electron / Tauri)
>
> Escolha um ou mais (ex: 1,2). Monorepo sera usado como padrao."

Aguarde a resposta. Armazene os clientes selecionados.

A estrutura de saida sera:

```
docs/frontend/
  shared/                          # Docs compartilhados entre clientes
    03-design-system.md            # Tokens, cores, tipografia (agnostico)
    06-data-layer.md               # API client, DTOs, contratos
    15-api-dependencies.md         # Mapa de endpoints

  web/                             # Se web selecionado
    00-frontend-vision.md
    01-architecture.md
    02-project-structure.md
    04-components.md
    05-state.md
    07-routes.md
    08-flows.md
    09-tests.md
    10-performance.md
    11-security.md
    12-observability.md
    13-cicd-conventions.md
    14-copies.md

  mobile/                          # Se mobile selecionado
    (mesmos 13 arquivos)

  desktop/                         # Se desktop selecionado
    (mesmos 13 arquivos)
```

## Passo 3: Salvar o PRD

Se o PRD ainda nao existir em `docs/prd.md`, salve o conteudo la. Se o arquivo ja existir, nao sobrescreva.

## Passo 4: Analisar o Blueprint Tecnico

Leia o blueprint tecnico e analise a cobertura para cada secao do frontend blueprint. Para cada secao, classifique:

- **Coberto**: o blueprint tecnico tem informacao suficiente para preencher
- **Parcial**: o blueprint tecnico tem alguma informacao mas faltam detalhes
- **Lacuna**: o blueprint tecnico nao cobre esta secao

Apresente uma tabela de cobertura por cliente selecionado:

### Documentos Compartilhados (shared)

| #   | Secao               | Cobertura              | Observacao |
| --- | ------------------- | ---------------------- | ---------- |
| 03  | Design System       | Coberto/Parcial/Lacuna | breve nota |
| 06  | Data Layer          | ...                    | ...        |
| 15  | Dependencias de API | ...                    | ...        |

### Documentos por Cliente

Para CADA cliente selecionado (web, mobile, desktop), apresente:

> **Cliente: {{web/mobile/desktop}}**

| #   | Secao                   | Cobertura              | Observacao |
| --- | ----------------------- | ---------------------- | ---------- |
| 00  | Visao do Frontend       | Coberto/Parcial/Lacuna | breve nota |
| 01  | Arquitetura             | ...                    | ...        |
| 02  | Estrutura do Projeto    | ...                    | ...        |
| 04  | Componentes             | ...                    | ...        |
| 05  | Gerenciamento de Estado | ...                    | ...        |
| 07  | Rotas e Navegacao       | ...                    | ...        |
| 08  | Fluxos de Interface     | ...                    | ...        |
| 09  | Estrategia de Testes    | ...                    | ...        |
| 10  | Performance             | ...                    | ...        |
| 11  | Seguranca               | ...                    | ...        |
| 12  | Observabilidade         | ...                    | ...        |
| 13  | CI/CD e Convencoes      | ...                    | ...        |
| 14  | Copies                  | ...                    | ...        |

## Passo 5: Apresentar o Roadmap

Apresente a ordem recomendada de preenchimento. Documentos compartilhados primeiro, depois por cliente sequencialmente:

```
DOCUMENTOS COMPARTILHADOS (rodar uma vez):
1.  /frontend-design-system        — Tokens e design system (shared)
2.  /frontend-data-layer           — API client e contratos (shared)

DOCUMENTOS POR CLIENTE (rodar para cada cliente selecionado):
Para cada cliente [web|mobile|desktop]:
3.  /frontend-vision {client}      — Visao e stack
4.  /frontend-architecture {client} — Camadas e fronteiras de dominio
5.  /frontend-structure {client}   — Estrutura de pastas e modulos
6.  /frontend-components {client}  — Hierarquia e padroes de componentes
7.  /frontend-state {client}       — Gerenciamento de estado
8.  /frontend-routes {client}      — Rotas e navegacao
9.  /frontend-flows {client}       — Fluxos criticos de interface
10. /frontend-tests {client}       — Piramide e estrategia de testes
11. /frontend-performance {client} — Otimizacao e metricas
12. /frontend-security {client}    — Autenticacao e protecao
13. /frontend-observability {client} — Monitoramento e feature flags
14. /frontend-cicd {client}        — Pipeline e convencoes de codigo
15. /frontend-copies {client}      — Textos e copies de todas as telas
```

**Recomendacao**: preencher todos os documentos de um cliente antes de passar para o proximo.

## Passo 6: Orientar o Proximo Passo

Diga ao usuario:

> "Blueprint tecnico analisado. Comece pelos documentos compartilhados:
>
> Rode `/frontend-design-system` para preencher o Design System (compartilhado entre todos os clientes).
>
> Depois, para cada cliente selecionado, rode os skills passando o cliente como parametro.
> Exemplo: `/frontend-vision web`, `/frontend-vision mobile`"

## Nota sobre Hierarquia

A hierarquia de documentacao segue o fluxo: **PRD** -> **Blueprint Tecnico** (`docs/blueprint/`) -> **Frontend Blueprint** (`docs/frontend/`). O PRD define o produto, o blueprint tecnico detalha a arquitetura e decisoes do sistema, e o frontend blueprint documenta como a interface sera arquitetada e implementada. O frontend blueprint usa o blueprint tecnico como fonte primaria, garantindo alinhamento com as decisoes tecnicas ja tomadas.

## Nota sobre Monorepo

O projeto utiliza estrutura de monorepo como padrao. A organizacao de clientes segue:

```
apps/
  api/                    # Backend
  web/                    # Cliente web (se selecionado)
  mobile/                 # Cliente mobile (se selecionado)
  desktop/                # Cliente desktop (se selecionado)

packages/
  ui/                     # Design system compartilhado
  api-client/             # Cliente de API compartilhado
  config/                 # Configs compartilhadas (ESLint, TS, Tailwind)
  utils/                  # Utilitarios compartilhados
  types/                  # Tipos compartilhados
```

Essa estrutura e documentada em `docs/frontend/shared/` (partes compartilhadas) e `docs/frontend/{client}/` (partes especificas de cada cliente).
