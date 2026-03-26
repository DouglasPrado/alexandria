---
name: specs
description: Gera documento integral de specs detalhadas de todas as tarefas de implementacao a partir dos docs do backend, frontend e blueprint. Use quando os 3 blueprints estiverem preenchidos e precisar de um backlog completo de tarefas.
---

# Specs — Geracao Integral de Tarefas de Implementacao

Voce e o gerador de specs. Sua funcao e ler a **documentacao do backend** (`docs/backend/`) como fonte primaria, usar o **frontend** (`docs/frontend/`) para garantir consistencia, e gerar um **documento unico e completo** com todas as tarefas de implementacao. Ao final, valida contra o **blueprint tecnico** (`docs/blueprint/`).

O output e um backlog integral — sem fases, sem etapas. Todas as tasks de uma vez.

## Fonte de Dados

```
docs/backend/   → LEITURA (fonte PRIMARIA — define as tasks)
docs/frontend/  → LEITURA (consistencia — valida alinhamento)
docs/blueprint/ → LEITURA (validacao — confirma cobertura)
docs/shared/    → LEITURA (glossario, mappings, erros)

docs/specs/     → ESCRITA (saida)
  TASKS.md         Documento unico com todas as tasks
```

---

## Passo 1: Verificar Pre-requisitos

Verifique se os docs existem e tem conteudo real (nao apenas `{{placeholders}}`):

1. Leia `docs/backend/03-domain.md` — se contem apenas `{{placeholders}}`:

   > "O backend ainda nao foi preenchido. Rode `/backend` primeiro para gerar a especificacao de implementacao."
   > E pare aqui.

2. Verifique `docs/frontend/` — se nao existe ou esta vazio:

   > "Frontend docs nao encontrados. Para consistencia completa, rode `/frontend` primeiro. Posso continuar sem, mas as tasks de alinhamento frontend-backend serao parciais."

3. Verifique `docs/blueprint/` — se nao existe:

   > "Blueprint tecnico nao encontrado. A validacao final sera impossivel. Rode `/blueprint` primeiro."
   > E pare aqui.

4. Verifique `docs/shared/glossary.md` — se existe, use como referencia de linguagem ubiqua.

Apresente status:

| Fonte     | Docs encontrados | Status                   |
| --------- | ---------------- | ------------------------ |
| Backend   | {{N}}/15         | Completo/Parcial/Ausente |
| Frontend  | {{N}}/15         | Completo/Parcial/Ausente |
| Blueprint | {{N}}/18         | Completo/Parcial/Ausente |
| Shared    | {{N}}/4          | Completo/Parcial/Ausente |

Atualize o progresso:

| #   | Passo                      | Status |
| --- | -------------------------- | ------ |
| 1   | Verificar Pre-requisitos   | ✅     |
| 2   | Leitura do Backend         | ⏳     |
| 3   | Leitura do Frontend        | ⏳     |
| 4   | Geracao das Specs          | ⏳     |
| 5   | Validacao contra Blueprint | ⏳     |
| 6   | Apresentar Resultado       | ⏳     |

---

## Passo 2: Leitura Integral do Backend (fonte primaria)

Leia TODOS os 15 arquivos de `docs/backend/`. Para cada um, extraia as tasks conforme o mapa abaixo:

| Backend Doc          | O que extrair                              | Tipo de Task                                                     |
| -------------------- | ------------------------------------------ | ---------------------------------------------------------------- |
| 00-backend-vision    | Stack, principios, metricas                | SETUP: config de projeto, linting, CI base                       |
| 01-architecture      | Camadas, fronteiras, deploy                | SETUP: estrutura de pastas, boundaries, pipeline                 |
| 02-project-structure | Arvore de diretorios, nomenclatura         | SETUP: scaffold de diretorios                                    |
| 03-domain            | Entidades, metodos, invariantes, eventos   | DOMAIN: 1 task por entidade (classe + testes)                    |
| 04-data-layer        | Repositories, queries, indices, migrations | DATA: 1 task por repository + 1 task de migration                |
| 05-api-contracts     | Endpoints, DTOs, status codes              | API: 1 task por grupo de endpoints (recurso)                     |
| 06-services          | Services, fluxos detalhados                | SERVICE: 1 task por service                                      |
| 07-controllers       | Controllers, rotas                         | CONTROLLER: 1 task por controller                                |
| 08-middlewares       | Pipeline de request                        | MIDDLEWARE: 1 task por middleware                                |
| 09-errors            | Hierarquia de excecoes, catalogo           | ERROR: 1 task para hierarquia + 1 por erro especifico de negocio |
| 10-validation        | Regras por campo, sanitizacao              | VALIDATION: 1 task por grupo de validacao (entidade)             |
| 11-permissions       | RBAC, JWT, ownership                       | AUTH: 1 task para setup de auth + 1 por role/policy              |
| 12-events            | Eventos, workers, filas, DLQ               | EVENT: 1 task por evento + 1 por worker                          |
| 13-integrations      | Clients externos, circuit breaker          | INTEGRATION: 1 task por integracao externa                       |
| 14-tests             | Piramide, cenarios obrigatorios            | TEST: tasks de cenarios obrigatorios por camada                  |

### Regras de Extracao

- **Cada entidade do `03-domain.md`** gera no minimo: 1 task DOMAIN + 1 task DATA + 1 task SERVICE + 1 task API
- **Cada fluxo detalhado do `06-services.md`** gera tasks com os passos exatos do fluxo como criterios de aceite
- **Cada endpoint do `05-api-contracts.md`** deve ter request, response, status codes e erros como criterios de aceite
- **Cada evento do `12-events.md`** gera 1 task de produtor + 1 task de consumidor
- **Cada middleware do `08-middlewares.md`** gera 1 task com o pipeline como criterio de aceite
- Use os IDs de regra de negocio (RN-XX) quando referenciados nos docs
- Use a linguagem ubiqua do glossario (`docs/shared/glossary.md`)

---

## Passo 3: Leitura do Frontend (consistencia)

Leia os docs relevantes de `docs/frontend/`:

| Frontend Doc        | O que verificar                                        |
| ------------------- | ------------------------------------------------------ |
| 04-components       | Quais componentes consomem cada endpoint               |
| 05-state            | Quais stores/estados mapeiam para entidades do backend |
| 06-data-layer       | Quais hooks/queries chamam cada endpoint               |
| 08-flows            | Quais fluxos de UI dependem dos fluxos do backend      |
| 11-security         | Auth frontend alinhado com auth backend                |
| 15-api-dependencies | Lista de endpoints que o frontend depende              |

Tambem leia os mappings compartilhados:

| Shared Doc          | O que verificar                              |
| ------------------- | -------------------------------------------- |
| event-mapping.md    | Cada evento backend tem reacao no frontend   |
| error-ux-mapping.md | Cada erro backend tem tratamento no frontend |
| glossary.md         | Termos consistentes entre backend e frontend |

### Cross-reference

Para cada endpoint do backend:

- Identifique qual componente/hook/page do frontend o consome
- Se nao houver consumidor documentado → marque como **gap de frontend**

Para cada evento do backend:

- Identifique como o frontend reage (via event-mapping ou realtime)
- Se nao houver reacao → marque como **gap de frontend**

Para cada erro do backend:

- Identifique como o frontend exibe (via error-ux-mapping)
- Se nao houver mapeamento → marque como **gap de frontend**

---

## Passo 4: Geracao Integral das Specs

Crie o diretorio `docs/specs/` se nao existir. Gere `docs/specs/TASKS.md` usando **Write**.

### Estrutura do Documento

```markdown
# Specs de Implementacao

> Documento gerado a partir de docs/backend/ (fonte primaria), validado contra docs/frontend/ e docs/blueprint/.
> Gerado em: {{data}}

## Resumo

| Grupo              | Tasks     | Must      | Should    | Could     |
| ------------------ | --------- | --------- | --------- | --------- |
| Setup & Infra      | {{N}}     | {{N}}     | {{N}}     | {{N}}     |
| Domain             | {{N}}     | {{N}}     | {{N}}     | {{N}}     |
| Data Layer         | {{N}}     | {{N}}     | {{N}}     | {{N}}     |
| Services           | {{N}}     | {{N}}     | {{N}}     | {{N}}     |
| API & Controllers  | {{N}}     | {{N}}     | {{N}}     | {{N}}     |
| Auth & Permissions | {{N}}     | {{N}}     | {{N}}     | {{N}}     |
| Error Handling     | {{N}}     | {{N}}     | {{N}}     | {{N}}     |
| Middlewares        | {{N}}     | {{N}}     | {{N}}     | {{N}}     |
| Events & Workers   | {{N}}     | {{N}}     | {{N}}     | {{N}}     |
| Integrations       | {{N}}     | {{N}}     | {{N}}     | {{N}}     |
| Tests              | {{N}}     | {{N}}     | {{N}}     | {{N}}     |
| Frontend Sync      | {{N}}     | {{N}}     | {{N}}     | {{N}}     |
| **Total**          | **{{N}}** | **{{N}}** | **{{N}}** | **{{N}}** |

---
```

### Formato de Cada Task

```markdown
### TASK-{{GRP}}-{{NNN}}: {{Titulo descritivo}}

**Camada:** {{Domain | Data | Service | API | Controller | Middleware | Event | Integration | Test | Setup}}
**Entidade:** {{Entidade principal envolvida ou "—" se transversal}}
**Prioridade:** {{Must | Should | Could}}
**Origem:** {{arquivo do backend de onde foi derivada — ex: 03-domain.md}}

**Descricao:**
{{O que deve ser implementado. Derivado diretamente do doc do backend. Seja especifico: nomes de classes, metodos, campos, tipos.}}

**Arquivos a criar/editar:**

- `{{caminho/do/arquivo}}` — {{criar | editar}} — {{o que fazer neste arquivo}}
- `{{caminho/do/arquivo}}` — {{criar | editar}} — {{o que fazer neste arquivo}}

**Dependencias:**

- {{TASK-GRP-NNN: motivo da dependencia}}
- {{Nenhuma — se nao houver}}

**Regras de Negocio:**

- {{RN-XX}}: {{descricao da regra, se aplicavel}}
- {{Nenhuma — se nao houver regra associada}}

**Criterios de Aceite:**

- [ ] {{Condicao verificavel 1 — derivada do doc do backend}}
- [ ] {{Condicao verificavel 2}}
- [ ] {{Condicao verificavel 3}}

**Testes Necessarios:**

- [ ] {{Unitario}}: {{descricao do teste — baseado em 14-tests.md}}
- [ ] {{Integracao}}: {{descricao do teste}}
- [ ] {{E2E}}: {{descricao do teste, se aplicavel}}

**Consistencia Frontend:**

- {{Componente/Hook/Page que depende desta task — do frontend docs}}
- {{Endpoint/DTO que o frontend consome}}
- {{Nenhuma — se nao houver dependencia frontend}}
```

### Convencao de IDs

Use prefixos por grupo:

| Grupo              | Prefixo | Exemplo        |
| ------------------ | ------- | -------------- |
| Setup & Infra      | SETUP   | TASK-SETUP-001 |
| Domain             | DOM     | TASK-DOM-001   |
| Data Layer         | DATA    | TASK-DATA-001  |
| Services           | SVC     | TASK-SVC-001   |
| API & Controllers  | API     | TASK-API-001   |
| Auth & Permissions | AUTH    | TASK-AUTH-001  |
| Error Handling     | ERR     | TASK-ERR-001   |
| Middlewares        | MW      | TASK-MW-001    |
| Events & Workers   | EVT     | TASK-EVT-001   |
| Integrations       | INT     | TASK-INT-001   |
| Tests              | TEST    | TASK-TEST-001  |
| Frontend Sync      | FE      | TASK-FE-001    |

### Grupos e Ordem no Documento

Gere as tasks na seguinte ordem (agrupadas, NAO em fases):

#### Grupo 1: Setup & Infra

Extraia de: `00-backend-vision.md`, `01-architecture.md`, `02-project-structure.md`

- Task de scaffold de projeto (diretorios, config, tsconfig, eslint, prettier)
- Task de setup de banco (connection, config, env vars)
- Task de setup de CI/CD (pipeline, stages, triggers)
- Task de setup de observabilidade (logger, health check)
- Task de setup de config global (env, secrets, CORS)

#### Grupo 2: Domain

Extraia de: `03-domain.md`

- 1 task por entidade: classe com atributos, invariantes, metodos, factory method
- 1 task por value object
- 1 task para enums compartilhados do dominio

#### Grupo 3: Data Layer

Extraia de: `04-data-layer.md`

- 1 task por repository: interface + implementacao + queries
- 1 task para schema/migrations inicial
- 1 task por indice critico adicional

#### Grupo 4: Services

Extraia de: `06-services.md`

- 1 task por service: metodos, DI, transacoes
- Para cada fluxo detalhado: criterios de aceite = passos do fluxo

#### Grupo 5: API & Controllers

Extraia de: `05-api-contracts.md`, `07-controllers.md`, `10-validation.md`

- 1 task por grupo de endpoints (recurso): controller + rotas + DTOs + validacao
- Cada task inclui: request, response, status codes, erros

#### Grupo 6: Auth & Permissions

Extraia de: `11-permissions.md`, `08-middlewares.md` (secao de auth)

- Task de setup de auth (JWT, provider, middleware)
- 1 task por role/policy RBAC
- Task de ownership check

#### Grupo 7: Error Handling

Extraia de: `09-errors.md`

- Task de hierarquia base (AppError + subclasses)
- Task de error handler global (middleware)
- 1 task por erro de negocio especifico (se houver muitos, agrupe por entidade)

#### Grupo 8: Middlewares (nao-auth)

Extraia de: `08-middlewares.md`

- 1 task por middleware: rate limit, CORS, request ID, logging, compression

#### Grupo 9: Events & Workers

Extraia de: `12-events.md`

- Task de setup do message broker
- 1 task por evento: schema, produtor, topico/fila
- 1 task por worker/consumer: logica, retry, DLQ

#### Grupo 10: Integrations

Extraia de: `13-integrations.md`

- 1 task por integracao externa: client, circuit breaker, retry, fallback

#### Grupo 11: Tests

Extraia de: `14-tests.md`

- Task de setup de test runner + config
- 1 task por grupo de cenarios obrigatorios (happy path, validacao, estado, auth, etc.)
- Task de setup de testcontainers (se aplicavel)
- Task de testes de carga (se aplicavel)

#### Grupo 12: Frontend Sync

Derivado do cross-reference do Passo 3:

- 1 task por gap identificado (endpoint sem consumidor, evento sem reacao, erro sem mapeamento)
- Tasks de alinhamento de tipos (DTOs backend ↔ types frontend)
- Tasks de alinhamento de estados (state machines backend ↔ stores frontend)

---

## Passo 5: Validacao contra Blueprint

Leia os docs do `docs/blueprint/` e cruze com as tasks geradas:

| Blueprint Doc                | Validacao                                                  |
| ---------------------------- | ---------------------------------------------------------- |
| 03-requirements.md           | Cada RF tem pelo menos 1 task? Cada RNF esta coberto?      |
| 04-domain-model.md           | Cada entidade tem tasks DOM + DATA + SVC + API?            |
| 07-critical_flows.md         | Cada fluxo critico tem tasks de service + test E2E?        |
| 08-use_cases.md              | Cada use case tem endpoint + controller + service?         |
| 09-state-models.md           | Cada maquina de estado tem transicoes implementadas?       |
| 10-architecture_decisions.md | Cada ADR esta refletido nas tasks de setup/infra?          |
| 11-build_plan.md             | Todas as entregas do build plan tem tasks correspondentes? |
| 12-testing_strategy.md       | Cobertura minima esta refletida nas tasks de teste?        |
| 13-security.md               | Cada ameaca STRIDE tem task de mitigacao?                  |
| 14-scalability.md            | Cada estrategia de cache/rate limit tem task MW ou SETUP?  |
| 15-observability.md          | Logging, metricas e traces tem tasks de setup?             |
| 05-data-model.md             | Cada tabela/indice tem task DATA correspondente?           |
| 06-system-architecture.md    | Cada componente tem task SETUP ou INT?                     |
| 17-communication.md          | Cada canal de comunicacao tem task de integracao + evento? |

Gere a tabela de cobertura no final do `TASKS.md`:

```markdown
---

## Validacao contra Blueprint

| Blueprint Doc         | Itens no Blueprint | Tasks geradas | Cobertura | Gaps              |
| --------------------- | ------------------ | ------------- | --------- | ----------------- |
| 03-requirements (RF)  | {{N}}              | {{N}}         | {{%}}     | {{lista de gaps}} |
| 03-requirements (RNF) | {{N}}              | {{N}}         | {{%}}     | {{lista de gaps}} |
| 04-domain-model       | {{N}} entidades    | {{N}} tasks   | {{%}}     | {{lista de gaps}} |
| 07-critical_flows     | {{N}} fluxos       | {{N}} tasks   | {{%}}     | {{lista de gaps}} |
| 08-use_cases          | {{N}} UCs          | {{N}} tasks   | {{%}}     | {{lista de gaps}} |
| 09-state-models       | {{N}} maquinas     | {{N}} tasks   | {{%}}     | {{lista de gaps}} |
| 13-security (STRIDE)  | {{N}} ameacas      | {{N}} tasks   | {{%}}     | {{lista de gaps}} |
| 17-communication      | {{N}} canais       | {{N}} tasks   | {{%}}     | {{lista de gaps}} |

### Gaps Identificados

> Itens do blueprint que NAO tem tasks correspondentes:

1. {{Item do blueprint sem task — ex: RF-05 nao tem endpoint}}
2. {{Item do blueprint sem task}}

### Consistencia Frontend

| Aspecto   | Backend | Frontend              | Status       |
| --------- | ------- | --------------------- | ------------ |
| Endpoints | {{N}}   | {{N}} consumidos      | {{OK / Gap}} |
| Eventos   | {{N}}   | {{N}} com reacao      | {{OK / Gap}} |
| Erros     | {{N}}   | {{N}} com mapeamento  | {{OK / Gap}} |
| DTOs      | {{N}}   | {{N}} types alinhados | {{OK / Gap}} |
```

Se houver gaps, liste-os e sugira acoes:

> "Gaps identificados:
>
> 1. {{Gap 1}} — sugiro adicionar TASK-{{ID}} ou atualizar o blueprint
> 2. {{Gap 2}} — sugiro rodar `/backend` para completar
> 3. {{Gap 3}} — sugiro rodar `/frontend-data-layer` para alinhar"

---

## Passo 6: Apresentar Resultado

Apresente o dashboard final:

> "## Specs Geradas
>
> **Documento:** `docs/specs/TASKS.md`
>
> | Metrica                  | Valor       |
> | ------------------------ | ----------- |
> | Total de tasks           | {{N}}       |
> | Tasks Must               | {{N}}       |
> | Tasks Should             | {{N}}       |
> | Tasks Could              | {{N}}       |
> | Entidades cobertas       | {{N}}/{{N}} |
> | Endpoints cobertos       | {{N}}/{{N}} |
> | Fluxos criticos cobertos | {{N}}/{{N}} |
> | Cobertura do blueprint   | {{%}}       |
> | Gaps identificados       | {{N}}       |
>
> **Proximos passos:**
>
> - Revise as tasks e ajuste prioridades
> - Para implementar, rode `/codegen-feature [nome]` por feature
> - Para verificar aderencia, rode `/codegen-verify`
> - Para ajustar o blueprint, rode `/blueprint-increment`"

---

## Regras

1. **Backend e a fonte primaria** — TODAS as tasks derivam dos docs do backend
2. **Frontend e para consistencia** — use para cross-reference, nao para gerar tasks de backend
3. **Blueprint e para validacao** — use para confirmar cobertura, nao para gerar tasks
4. **Tudo integral** — gere TODAS as tasks de uma vez, sem fases ou etapas
5. **Cada task deve ser atomica** — implementavel de forma independente (exceto dependencias explicitas)
6. **Cada task deve ter criterios de aceite verificaveis** — derivados diretamente dos docs
7. **Use IDs consistentes** — TASK-GRP-NNN em todo o documento
8. **Marque origem** — cada task deve referenciar o doc de onde veio
9. **Use a linguagem ubiqua** — termos do glossario, nao sinonimos
10. **NAO invente** — se o backend doc nao menciona, nao crie task para isso
11. **Use Write** para criar `docs/specs/TASKS.md` (documento novo)
12. **Use Edit** se o documento ja existir e precisar de atualizacao
