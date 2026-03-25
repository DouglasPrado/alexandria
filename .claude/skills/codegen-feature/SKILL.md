---
name: codegen-feature
description: Implementa UMA feature como vertical slice (DB + API + Frontend + Testes) usando TDD e pair programming (XP). O skill do dia-a-dia para geracao de codigo a partir dos blueprints.
---

# Codegen — Feature Vertical (XP Pair Programming)

Voce vai implementar UMA feature como um vertical slice completo: banco de dados, API, frontend e testes. Siga o ciclo XP: **RED → GREEN → REFACTOR**.

Este e o skill principal do dia-a-dia. O dev guia, voce implementa como "pair".

## Pre-requisitos

- Setup inicial executado (`/codegen-contracts` — tipos e schema existem)
- CLAUDE.md presente no projeto (via `/codegen-claudemd`)

## Passo 1: Receber a Feature

Verifique se o usuario passou um argumento (nome da feature). Se sim, use-o. Se nao, pergunte:

> "Qual feature vamos implementar?
>
> Exemplos:
> - `autenticacao` (login, registro, recuperacao de senha)
> - `crud-produtos` (CRUD completo de uma entidade)
> - `checkout` (fluxo de compra com pagamento)
> - `dashboard` (painel com metricas)
>
> Diga o nome ou descreva a feature."

Aguarde a resposta.

## Passo 2: Identificar Contexto Relevante (Context Excerpting)

**NAO carregue todos os blueprints.** Identifique quais docs sao relevantes para ESTA feature.

### 2.1: Ler o CLAUDE.md do projeto

Leia o `CLAUDE.md` para identificar a categoria da feature e quais docs consultar.

### 2.2: Consultar Rastreabilidade

Leia `docs/shared/MAPPING.md` para identificar quais docs de backend e frontend correspondem aos docs do blueprint relevantes para a feature.

### 2.3: Context Excerpting — Carregar apenas o necessario

Para cada doc relevante:

1. **Leia os headers** do doc (grep por linhas que comecam com `#`)
2. **Identifique secoes** que mencionam a feature ou suas entidades
3. **Carregue apenas essas secoes** (usando Read com offset/limit)

**Mapa de docs por tipo de feature:**

| Tipo | Blueprint | Backend | Frontend |
|------|-----------|---------|----------|
| CRUD de entidade | 04-domain-model, 05-data-model, 08-use_cases | 03-domain, 04-data-layer, 05-api-contracts, 06-services, 07-controllers | {{client}}/04-components, shared/06-data-layer |
| Fluxo de negocio | 07-critical_flows, 08-use_cases, 09-state-models | 06-services, 09-errors, 12-events | {{client}}/08-flows, {{client}}/05-state |
| Autenticacao | 07-critical_flows, 13-security | 08-middlewares, 11-permissions | {{client}}/11-security, {{client}}/07-routes |
| Dashboard/Relatorio | 07-critical_flows | 05-api-contracts, 06-services | {{client}}/04-components, shared/06-data-layer |
| Integracao externa | 06-system-architecture | 13-integrations, 12-events | {{client}}/08-flows |

**Docs compartilhados (sempre consultar quando relevante):**
- `docs/shared/glossary.md` — linguagem ubiqua
- `docs/shared/event-mapping.md` — quando a feature envolve eventos backend → frontend
- `docs/shared/error-ux-mapping.md` — quando a feature tem tratamento de erros

### 2.4: Identificar Clientes Frontend

Verifique quais clientes frontend existem em `docs/frontend/` (web, mobile, desktop).
Se a feature for backend-only, pule o frontend. Se for full-stack, pergunte:

> "A feature sera implementada em quais clientes? {{lista de clientes existentes}}"

Ou, se apenas um cliente existir, use-o automaticamente.

### 2.5: Ler Contratos Existentes

Leia `src/contracts/` para entender os tipos ja gerados:
- Entidades relevantes para esta feature
- Enums usados
- Tipos de API existentes

### 2.6: Ler Codigo Existente Relacionado

Se a feature depende de codigo ja implementado (ex: middleware de auth, servicos base), leia esses arquivos.

### Budget de Contexto

| Item | Tokens estimados |
|------|-----------------|
| Secoes dos blueprints (excerpted) | ~15-25k |
| Secoes do backend docs (excerpted) | ~10-20k |
| Secoes do frontend docs (excerpted) | ~10-15k |
| Contratos existentes | ~10-20k |
| Codigo relacionado | ~10-20k |
| **Total** | **~55-100k** |

Se estiver acima de 100k, reduza: carregue menos secoes ou resuma o codigo existente.

## Passo 3: Apresentar Plano da Feature

Antes de codar, apresente o plano:

> "Feature: **{{nome}}**
>
> **Baseado nos blueprints e docs de implementacao, vou implementar:**
>
> 1. **Banco**: {{migrations/alteracoes no schema}}
> 2. **Backend**: {{endpoints, services, validators — conforme backend docs}}
> 3. **Frontend ({{clientes}})**: {{componentes, pages, hooks}}
> 4. **Testes**: {{unit tests, integration tests}}
>
> **Entidades envolvidas:** {{lista}}
> **Fluxos implementados:** {{lista de fluxos do blueprint}}
> **Use cases cobertos:** {{lista de UCs}}
>
> Confirma? Ou quer ajustar o escopo?"

Aguarde confirmacao do dev.

## Passo 4: RED — Escrever Testes Primeiro

**ANTES de qualquer implementacao**, escreva os testes:

### 4.1: Testes de Backend
- Testes unitarios para regras de negocio (baseados em `backend/03-domain.md` e `backend/06-services.md`)
- Testes de integracao para endpoints (baseados em `backend/05-api-contracts.md`)
- Testes de estado (baseados em `blueprint/09-state-models.md`, se houver)
- Estrategia conforme `backend/14-tests.md`

### 4.2: Testes de Frontend
- Testes de componente (renderizacao, interacao)
- Testes de hook/estado
- Testes de integracao (fluxo completo)
- Estrategia conforme `frontend/{{client}}/09-tests.md`

**Cada teste deve:**
- Ter um nome descritivo baseado no use case ou regra de negocio
- Referenciar o doc do blueprint de onde veio (comentario)
- Usar os tipos de `src/contracts/`

Execute os testes — todos devem **FALHAR** (RED).

> "**RED**: {{N}} testes escritos, todos falhando conforme esperado.
> Vou implementar o minimo para faze-los passar."

## Passo 5: GREEN — Implementar o Minimo

Implemente o codigo minimo para os testes passarem:

### 5.1: Schema/Migrations (se necessario)
- Adicione novas tabelas ou campos ao schema
- Gere e aplique migrations

### 5.2: Backend (conforme docs/backend/)
- Repository/data access (conforme `backend/04-data-layer.md`)
- Service/use case (conforme `backend/06-services.md`)
- Controller/route (conforme `backend/07-controllers.md`)
- Validacao de input (conforme `backend/10-validation.md`)
- Tratamento de erros (conforme `backend/09-errors.md`)
- Middlewares se necessario (conforme `backend/08-middlewares.md`)
- Permissoes se necessario (conforme `backend/11-permissions.md`)

### 5.3: Frontend (conforme docs/frontend/)
- Componentes (conforme `frontend/{{client}}/04-components.md`)
- Hooks de estado (conforme `frontend/{{client}}/05-state.md`)
- Data layer/API client (conforme `frontend/shared/06-data-layer.md`)
- Rotas (conforme `frontend/{{client}}/07-routes.md`)
- Copies/textos (conforme `frontend/{{client}}/14-copies.md`)

**Regras:**
- Use os tipos de `src/contracts/` — NAO crie tipos locais duplicados
- Siga a linguagem ubiqua do glossario (`docs/shared/glossary.md`)
- Implemente apenas o que os testes exigem
- Se novos tipos foram necessarios, adicione-os em `src/contracts/` primeiro
- Use o error-ux-mapping para mapear erros de backend → resposta visual

Execute os testes — todos devem **PASSAR** (GREEN).

> "**GREEN**: Todos os {{N}} testes passando. Vou refatorar."

## Passo 6: REFACTOR — Melhorar Mantendo Verde

Refatore o codigo mantendo os testes verdes:

- Extraia duplicacoes
- Melhore nomes (use a linguagem ubiqua)
- Simplifique logica complexa
- Verifique que segue os principios arquiteturais do blueprint
- Verifique aderencia com as camadas definidas em `backend/01-architecture.md`

Execute os testes apos cada refatoracao — devem continuar passando.

> "**REFACTOR**: Codigo refatorado. {{N}} testes continuam verdes."

## Passo 7: Atualizar Contratos (se necessario)

Se a feature introduziu novos tipos:

1. Adicione em `src/contracts/` (nao em arquivos locais)
2. Atualize barrel exports (`index.ts`)
3. Rode type check para garantir consistencia

## Passo 8: Apresentar Resultado

> "Feature **{{nome}}** implementada:
>
> | Camada | Arquivos | Testes |
> |--------|---------|--------|
> | Schema | {{lista}} | — |
> | Backend | {{lista}} | {{N}} testes |
> | Frontend ({{client}}) | {{lista}} | {{N}} testes |
> | Contracts | {{lista de novos tipos}} | — |
>
> **Total: {{N}} testes, todos passando.**
>
> Revise o codigo. Quando estiver ok, faca o commit."

## Passo 9: Commit

Sugira:

> "Commit sugerido: `feat: {{nome-da-feature}} — {{descricao curta}}`
>
> Deseja commitar?"

## Passo 10: Proximo

> "Feature concluida. Para a proxima feature, rode `/codegen-feature [nome]`.
> Para verificar aderencia ao blueprint, rode `/codegen-verify`."
