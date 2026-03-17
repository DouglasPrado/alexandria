---
name: codegen-verify
description: Verifica se o codigo gerado esta aderente ao blueprint. Compara tipos, schema, endpoints, fluxos e regras de negocio documentados contra o codigo implementado. Roda apos cada feature ou fase.
---

# Codegen — Verificacao contra Blueprint

Voce vai comparar o codigo gerado com os blueprints para encontrar discrepancias. Este skill e o "quality gate" que garante que o codigo segue o que foi documentado.

## Quando Usar

- Apos implementar 3-5 features (verificacao periodica)
- Ao concluir uma fase do build plan (verificacao de fase)
- Quando suspeitar que algo divergiu do blueprint
- Antes de uma release

## Passo 1: Escolher Escopo de Verificacao

Pergunte ao usuario:

> "Qual escopo de verificacao?
>
> 1. **Feature especifica** — verifica uma feature contra os docs relevantes
> 2. **Fase do build plan** — verifica todas as entregas de uma fase
> 3. **Completa** — verifica todo o projeto contra todos os blueprints
>
> Escolha o escopo (ou informe o nome da feature/fase)."

Aguarde a resposta.

## Passo 2: Selecionar Verificacoes por Escopo

### Para Feature Especifica:
Carregue apenas os docs relevantes para a feature (mesmo mapeamento do `/codegen-feature`).

### Para Fase do Build Plan:
1. Leia `docs/blueprint/11-build_plan.md` — identifique as entregas da fase
2. Carregue os docs relevantes para cada entrega

### Para Verificacao Completa:
Execute cada verificacao abaixo carregando os docs um par de cada vez (doc + codigo correspondente) para nao estourar o contexto.

## Passo 3: Executar Verificacoes

### V1: Entidades vs Tipos (Domain Model → src/contracts/)

**Docs:** `docs/blueprint/04-domain_model.md`
**Codigo:** `src/contracts/entities/`

Para cada entidade no domain model:
- [ ] Existe um tipo correspondente em `src/contracts/entities/`?
- [ ] Todos os atributos documentados estao presentes no tipo?
- [ ] Os tipos dos atributos estao corretos?
- [ ] As regras de negocio documentadas estao implementadas (validators, guards)?
- [ ] O nome usa a linguagem ubiqua (glossario)?

### V2: Tabelas vs Schema (Data Model → Schema)

**Docs:** `docs/blueprint/05-data_model.md`
**Codigo:** Arquivo de schema (prisma, drizzle, etc.)

Para cada tabela no data model:
- [ ] Existe no schema?
- [ ] Todos os campos estao presentes com tipos corretos?
- [ ] Constraints (unique, not null, default) estao aplicadas?
- [ ] Indices documentados existem?
- [ ] Foreign keys/relacionamentos estao corretos?

### V3: Fluxos vs Endpoints (Critical Flows → Routes/Controllers)

**Docs:** `docs/blueprint/07-critical_flows.md`
**Codigo:** Rotas/controllers do projeto

Para cada fluxo critico:
- [ ] Os endpoints necessarios existem?
- [ ] O happy path esta implementado?
- [ ] Os tratamentos de erro documentados estao cobertos?
- [ ] A ordem dos passos esta correta?

### V4: Use Cases vs Testes

**Docs:** `docs/blueprint/08-use_cases.md`
**Codigo:** Arquivos de teste

Para cada use case:
- [ ] Existe pelo menos um teste que cobre o cenario principal?
- [ ] Pre-condicoes sao verificadas nos testes?
- [ ] Excecoes documentadas tem testes?

### V5: State Machines vs Implementacao

**Docs:** `docs/blueprint/09-state_models.md`
**Codigo:** Services/entities com logica de estado

Para cada state machine:
- [ ] Todos os estados documentados existem no enum/tipo?
- [ ] Todas as transicoes documentadas estao implementadas?
- [ ] Transicoes invalidas sao bloqueadas?
- [ ] Triggers/eventos estao corretos?

### V6: Seguranca (Security → Middleware/Auth)

**Docs:** `docs/blueprint/13-security.md`
**Codigo:** Middlewares, auth, validators

- [ ] Autenticacao implementada conforme documentado?
- [ ] Autorizacao (roles/permissions) conforme documentado?
- [ ] Validacao de input nos endpoints?
- [ ] Headers de seguranca configurados?

### V7: Componentes Frontend vs Implementacao

**Docs:** `docs/frontend/04-componentes.md`
**Codigo:** Componentes do frontend

Para cada componente documentado:
- [ ] Existe no codigo?
- [ ] Props/interface correspondem ao documentado?
- [ ] Estados locais conforme documentado?

## Passo 4: Apresentar Relatorio

> "## Relatorio de Verificacao — {{escopo}}
>
> **Data:** {{data}}
> **Escopo:** {{feature/fase/completa}}
>
> ### Resumo
>
> | Verificacao | Total | OK | Divergencias |
> |------------|-------|-----|-------------|
> | V1: Entidades vs Tipos | {{N}} | {{N}} | {{N}} |
> | V2: Tabelas vs Schema | {{N}} | {{N}} | {{N}} |
> | V3: Fluxos vs Endpoints | {{N}} | {{N}} | {{N}} |
> | V4: Use Cases vs Testes | {{N}} | {{N}} | {{N}} |
> | V5: State Machines | {{N}} | {{N}} | {{N}} |
> | V6: Seguranca | {{N}} | {{N}} | {{N}} |
> | V7: Frontend Components | {{N}} | {{N}} | {{N}} |
>
> ### Divergencias Encontradas
>
> | # | Tipo | Blueprint | Codigo | Acao Sugerida |
> |---|------|-----------|--------|--------------|
> | 1 | {{V1/V2/...}} | {{o que diz o doc}} | {{o que existe no codigo}} | {{corrigir codigo / atualizar blueprint}} |
> | 2 | ... | ... | ... | ... |
>
> **Score de aderencia:** {{N}}% ({{ok}}/{{total}} verificacoes passaram)"

## Passo 5: Sugerir Correcoes

Para cada divergencia, sugira:

- **Se o codigo esta errado:** "Corrija o codigo para seguir o blueprint. Use `/codegen-feature` para reimplementar."
- **Se o blueprint esta desatualizado:** "Atualize o blueprint com `/blueprint-incrementar` para refletir a decisao tomada no codigo."
- **Se e ambiguo:** "Confirme com o dev: o blueprint ou o codigo esta correto?"

## Passo 6: Proximo

> "Verificacao concluida. Score: {{N}}%.
>
> Para corrigir divergencias:
> - No codigo: `/codegen-feature [feature]`
> - No blueprint: `/blueprint-incrementar`
>
> Para continuar implementando: `/codegen`"
