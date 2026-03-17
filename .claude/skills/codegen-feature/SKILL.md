---
name: codegen-feature
description: Implementa UMA feature como vertical slice (DB + API + Frontend + Testes) usando TDD e pair programming (XP). O skill do dia-a-dia para geracao de codigo a partir dos blueprints.
---

# Codegen — Feature Vertical (XP Pair Programming)

Voce vai implementar UMA feature como um vertical slice completo: banco de dados, API, frontend e testes. Siga o ciclo XP: **RED → GREEN → REFACTOR**.

Este e o skill principal do dia-a-dia. O dev guia, voce implementa como "pair".

## Pre-requisitos

- Phase 0 executada (`/codegen-contracts` — tipos e schema existem)
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

### 2.2: Context Excerpting — Carregar apenas o necessario

Para cada doc relevante:

1. **Leia os headers** do doc (grep por linhas que comecam com `#`)
2. **Identifique secoes** que mencionam a feature ou suas entidades
3. **Carregue apenas essas secoes** (usando Read com offset/limit)

**Mapa de docs por tipo de feature:**

| Tipo | Docs a consultar |
|------|-----------------|
| CRUD de entidade | 04-domain_model (entidade), 05-data_model (tabela), 08-use_cases (UC da entidade), frontend/04-componentes |
| Fluxo de negocio | 07-critical_flows (fluxo), 08-use_cases (UCs do fluxo), 09-state_models (estados), frontend/08-fluxos |
| Autenticacao | 07-critical_flows (auth flow), 13-security, frontend/11-seguranca |
| Dashboard/Relatorio | frontend/04-componentes, frontend/06-data-layer, 07-critical_flows |
| Integracao externa | 06-system_architecture (componente), 07-critical_flows (fluxo de integracao) |

### 2.3: Ler Contratos Existentes

Leia `src/contracts/` para entender os tipos ja gerados:
- Entidades relevantes para esta feature
- Enums usados
- Tipos de API existentes

### 2.4: Ler Codigo Existente Relacionado

Se a feature depende de codigo ja implementado (ex: middleware de auth, servicos base), leia esses arquivos.

### Budget de Contexto

| Item | Tokens estimados |
|------|-----------------|
| Secoes dos blueprints (excerpted) | ~20-40k |
| Contratos existentes | ~10-20k |
| Codigo relacionado | ~10-20k |
| **Total** | **~40-80k** |

Se estiver acima de 80k, reduza: carregue menos secoes dos blueprints ou resuma o codigo existente.

## Passo 3: Apresentar Plano da Feature

Antes de codar, apresente o plano:

> "Feature: **{{nome}}**
>
> **Baseado nos blueprints, vou implementar:**
>
> 1. **Banco**: {{migrations/alteracoes no schema}}
> 2. **Backend**: {{endpoints, services, validators}}
> 3. **Frontend**: {{componentes, pages, hooks}}
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
- Testes unitarios para regras de negocio (baseados nas regras do domain model)
- Testes de integracao para endpoints (baseados nos use cases)
- Testes de estado (baseados nas state machines, se houver)

### 4.2: Testes de Frontend
- Testes de componente (renderizacao, interacao)
- Testes de hook/estado
- Testes de integracao (fluxo completo)

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

### 5.2: Backend
- Repository/data access
- Service/use case (regras de negocio)
- Controller/route (endpoints)
- Validacao de input
- Tratamento de erros (conforme fluxos criticos)

### 5.3: Frontend
- Componentes (conforme frontend/04-componentes)
- Hooks de estado (conforme frontend/05-estado)
- Data layer/API client (conforme frontend/06-data-layer)
- Rotas (conforme frontend/07-rotas)

**Regras:**
- Use os tipos de `src/contracts/` — NAO crie tipos locais duplicados
- Siga a linguagem ubiqua do glossario
- Implemente apenas o que os testes exigem
- Se novos tipos foram necessarios, adicione-os em `src/contracts/` primeiro

Execute os testes — todos devem **PASSAR** (GREEN).

> "**GREEN**: Todos os {{N}} testes passando. Vou refatorar."

## Passo 6: REFACTOR — Melhorar Mantendo Verde

Refatore o codigo mantendo os testes verdes:

- Extraia duplicacoes
- Melhore nomes (use a linguagem ubiqua)
- Simplifique logica complexa
- Verifique que segue os principios arquiteturais do blueprint

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
> | Frontend | {{lista}} | {{N}} testes |
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
