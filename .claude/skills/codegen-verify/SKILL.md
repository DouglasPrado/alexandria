---
name: codegen-verify
description: Verifica se o codigo gerado esta aderente ao blueprint. Compara tipos, schema, endpoints, fluxos e regras de negocio documentados contra o codigo implementado. Roda apos cada feature ou conjunto de entregas.
---

# Codegen — Verificacao contra Blueprint

Voce vai comparar o codigo gerado com os blueprints e docs de implementacao para encontrar discrepancias. Este skill e o "quality gate" que garante que o codigo segue o que foi documentado.

## Quando Usar

- Apos implementar 3-5 features (verificacao periodica)
- Ao concluir um conjunto de entregas
- Quando suspeitar que algo divergiu do blueprint
- Antes de uma release

## Passo 1: Escolher Escopo de Verificacao

Pergunte ao usuario:

> "Qual escopo de verificacao?
>
> 1. **Feature especifica** — verifica uma feature contra os docs relevantes
> 2. **Conjunto de entregas** — verifica um grupo de entregas do build plan
> 3. **Completa** — verifica todo o projeto contra todos os blueprints
>
> Escolha o escopo (ou informe o nome da feature/entrega)."

Aguarde a resposta.

## Passo 2: Selecionar Verificacoes por Escopo

### Para Feature Especifica:
Carregue apenas os docs relevantes para a feature (mesmo mapeamento do `/codegen-feature`). Consulte `docs/shared/MAPPING.md` para rastreabilidade.

### Para Conjunto de Entregas:
1. Leia `docs/blueprint/11-build_plan.md` — identifique as entregas selecionadas
2. Carregue os docs relevantes para cada entrega

### Para Verificacao Completa:
Execute cada verificacao abaixo carregando os docs um par de cada vez (doc + codigo correspondente) para nao estourar o contexto.

## Passo 3: Identificar Clientes Frontend

Verifique quais clientes existem em `docs/frontend/` (web, mobile, desktop).
Execute V7 para cada cliente ativo.

## Passo 4: Executar Verificacoes

### V1: Entidades vs Tipos (Domain Model → src/contracts/)

**Docs:** `docs/blueprint/04-domain-model.md` + `docs/backend/03-domain.md`
**Codigo:** `src/contracts/entities/`

Para cada entidade no domain model:
- [ ] Existe um tipo correspondente em `src/contracts/entities/`?
- [ ] Todos os atributos documentados estao presentes no tipo?
- [ ] Os tipos dos atributos estao corretos?
- [ ] As regras de negocio documentadas estao implementadas (validators, guards)?
- [ ] O nome usa a linguagem ubiqua (`docs/shared/glossary.md`)?
- [ ] Value objects documentados em `backend/03-domain.md` existem?

### V2: Tabelas vs Schema (Data Model → Schema)

**Docs:** `docs/blueprint/05-data-model.md` + `docs/backend/04-data-layer.md`
**Codigo:** Arquivo de schema (prisma, drizzle, etc.)

Para cada tabela no data model:
- [ ] Existe no schema?
- [ ] Todos os campos estao presentes com tipos corretos?
- [ ] Constraints (unique, not null, default) estao aplicadas?
- [ ] Indices documentados existem?
- [ ] Foreign keys/relacionamentos estao corretos?
- [ ] Patterns de repository definidos em `backend/04-data-layer.md` foram seguidos?

### V3: API Contracts vs Endpoints

**Docs:** `docs/backend/05-api-contracts.md` + `docs/blueprint/07-critical_flows.md`
**Codigo:** Rotas/controllers do projeto

Para cada endpoint documentado:
- [ ] A rota existe no codigo?
- [ ] Request/response types correspondem ao documentado?
- [ ] Validacao de input conforme `backend/10-validation.md`?
- [ ] Tratamento de erros conforme `backend/09-errors.md`?
- [ ] Middlewares aplicados conforme `backend/08-middlewares.md`?

### V4: Use Cases vs Testes

**Docs:** `docs/blueprint/08-use_cases.md` + `docs/backend/14-tests.md`
**Codigo:** Arquivos de teste

Para cada use case:
- [ ] Existe pelo menos um teste que cobre o cenario principal?
- [ ] Pre-condicoes sao verificadas nos testes?
- [ ] Excecoes documentadas tem testes?
- [ ] Estrategia de teste segue `backend/14-tests.md`?

### V5: State Machines vs Implementacao

**Docs:** `docs/blueprint/09-state-models.md` + `docs/backend/03-domain.md`
**Codigo:** Services/entities com logica de estado

Para cada state machine:
- [ ] Todos os estados documentados existem no enum/tipo?
- [ ] Todas as transicoes documentadas estao implementadas?
- [ ] Transicoes invalidas sao bloqueadas?
- [ ] Triggers/eventos estao corretos?

### V6: Seguranca (Security → Middleware/Auth)

**Docs:** `docs/blueprint/13-security.md` + `docs/backend/08-middlewares.md` + `docs/backend/11-permissions.md`
**Codigo:** Middlewares, auth, validators

- [ ] Autenticacao implementada conforme documentado?
- [ ] Autorizacao (roles/permissions) conforme `backend/11-permissions.md`?
- [ ] Validacao de input nos endpoints?
- [ ] Headers de seguranca configurados?

### V7: Frontend Components vs Implementacao (por cliente)

Para cada cliente frontend ativo (web, mobile, desktop):

**Docs:** `docs/frontend/{{client}}/04-components.md` + `docs/frontend/shared/03-design-system.md`
**Codigo:** Componentes do frontend

Para cada componente documentado:
- [ ] Existe no codigo?
- [ ] Props/interface correspondem ao documentado?
- [ ] Estados locais conforme documentado?
- [ ] Usa design tokens do design system compartilhado?

### V8: Cross-Layer Mappings

**Docs:** `docs/shared/event-mapping.md` + `docs/shared/error-ux-mapping.md`
**Codigo:** Event handlers, error handlers

- [ ] Eventos de backend mapeados estao sendo consumidos no frontend?
- [ ] Erros de backend tem tratamento visual correspondente no frontend?
- [ ] Payloads de eventos correspondem entre backend e frontend?

## Passo 5: Apresentar Relatorio

> "## Relatorio de Verificacao — {{escopo}}
>
> **Data:** {{data}}
> **Escopo:** {{feature/entregas/completa}}
> **Clientes verificados:** {{web, mobile, desktop}}
>
> ### Resumo
>
> | Verificacao | Total | OK | Divergencias |
> |------------|-------|-----|-------------|
> | V1: Entidades vs Tipos | {{N}} | {{N}} | {{N}} |
> | V2: Tabelas vs Schema | {{N}} | {{N}} | {{N}} |
> | V3: API Contracts vs Endpoints | {{N}} | {{N}} | {{N}} |
> | V4: Use Cases vs Testes | {{N}} | {{N}} | {{N}} |
> | V5: State Machines | {{N}} | {{N}} | {{N}} |
> | V6: Seguranca | {{N}} | {{N}} | {{N}} |
> | V7: Frontend ({{client}}) | {{N}} | {{N}} | {{N}} |
> | V8: Cross-Layer Mappings | {{N}} | {{N}} | {{N}} |
>
> ### Divergencias Encontradas
>
> | # | Tipo | Blueprint/Doc | Codigo | Acao Sugerida |
> |---|------|--------------|--------|--------------|
> | 1 | {{V1/V2/...}} | {{o que diz o doc}} | {{o que existe no codigo}} | {{corrigir codigo / atualizar doc}} |
> | 2 | ... | ... | ... | ... |
>
> **Score de aderencia:** {{N}}% ({{ok}}/{{total}} verificacoes passaram)"

## Passo 6: Sugerir Correcoes

Para cada divergencia, sugira:

- **Se o codigo esta errado:** "Corrija o codigo para seguir o blueprint. Use `/codegen-feature` para reimplementar."
- **Se o doc esta desatualizado:** "Atualize o blueprint com `/blueprint-increment` ou o backend com `/backend` para refletir a decisao tomada no codigo."
- **Se e ambiguo:** "Confirme com o dev: o doc ou o codigo esta correto?"

## Passo 7: Proximo

> "Verificacao concluida. Score: {{N}}%.
>
> Para corrigir divergencias:
> - No codigo: `/codegen-feature [feature]`
> - No blueprint: `/blueprint-increment`
> - No frontend: `/frontend-increment`
>
> Para continuar implementando: `/codegen`"
