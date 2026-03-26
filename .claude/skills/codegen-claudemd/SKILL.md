---
name: codegen-claudemd
description: Gera o CLAUDE.md router para o projeto-alvo a partir dos blueprints preenchidos. Analisa a estrutura dos docs e cria um mapa de contexto que guia o Claude Code durante a geracao de codigo.
---

# Codegen — Gerar CLAUDE.md Router

Voce vai analisar os blueprints preenchidos e gerar um arquivo `CLAUDE.md` no projeto-alvo. Este arquivo funciona como um **router de contexto** — diz ao Claude Code exatamente quais documentos do blueprint ler para cada tipo de tarefa de codificacao.

## Passo 1: Receber o Projeto-Alvo

Verifique se o usuario passou um argumento (caminho do projeto-alvo). Se sim, use-o. Se nao, pergunte:

> "Para gerar o CLAUDE.md, preciso saber:
>
> 1. **Caminho do projeto-alvo**: onde o codigo sera gerado (ex: `../meu-saas/`)
> 2. **Caminho dos blueprints**: onde estao os docs preenchidos (default: `docs/`)
>
> Informe o caminho do projeto-alvo."

Aguarde a resposta do usuario.

## Passo 2: Leitura dos Indices dos Blueprints

**NAO leia o conteudo completo dos docs.** Leia apenas os headers (titulos e subtitulos) de cada documento para entender a estrutura. Use Bash com `grep` para extrair apenas as linhas que comecam com `#`:

Para cada doc em `docs/blueprint/`, `docs/backend/`, `docs/frontend/`, `docs/business/`, `docs/shared/`:

1. Extraia os headers (`# `, `## `, `### `)
2. Identifique quais secoes contem conteudo real (nao apenas `{{placeholders}}`)
3. Monte um mapa: `doc → secoes preenchidas`

## Passo 3: Identificar Clientes Frontend

Verifique quais clientes existem em `docs/frontend/`:

```
docs/frontend/shared/    → Docs compartilhados (design system, data layer, API deps)
docs/frontend/web/       → Cliente web
docs/frontend/mobile/    → Cliente mobile
docs/frontend/desktop/   → Cliente desktop
```

Liste apenas os que possuem docs preenchidos.

## Passo 4: Analisar Stack e Convencoes

Leia estes docs **completos** (sao essenciais para o CLAUDE.md):

1. `docs/blueprint/02-architecture_principles.md` — principios que guiam decisoes de codigo
2. `docs/blueprint/06-system-architecture.md` — stack tecnologica, componentes, protocolos
3. `docs/backend/00-backend-vision.md` — stack e padroes do backend
4. `docs/backend/01-architecture.md` — camadas arquiteturais do backend
5. `docs/blueprint/04-domain-model.md` — **somente a secao Glossario/Linguagem Ubiqua** (grep por "Glossario" ou "Linguagem")
6. `docs/shared/glossary.md` — linguagem ubiqua e convencoes de nomenclatura
7. `docs/shared/MAPPING.md` — rastreabilidade entre docs

Extraia:

- **Stack**: linguagens, frameworks, ORMs, bancos, filas
- **Convencoes de nomenclatura**: PascalCase para entidades, camelCase para campos, etc.
- **Principios arquiteturais**: patterns (Clean Architecture, DDD, etc.)
- **Glossario**: termos do dominio que devem ser usados no codigo
- **Camadas do backend**: e suas regras de dependencia

## Passo 5: Gerar o CLAUDE.md

Use o template em `docs/templates/claudemd-template.md` como base (se existir). Caso contrario, gere seguindo esta estrutura:

```markdown
# {{Nome do Projeto}}

## Fonte de Verdade

Todo codigo DEVE implementar fielmente o que esta documentado nos blueprints e docs de implementacao.

**Hierarquia de documentacao:**

- `docs/blueprint/` — O QUE construir (fonte primaria)
- `docs/backend/` — COMO construir o backend (spec de implementacao)
- `docs/frontend/` — COMO construir o frontend (spec de implementacao)
  - `shared/` — Design system, data layer, API deps (compartilhado entre clientes)
  - `web/` — Cliente web
  - `mobile/` — Cliente mobile
  - `desktop/` — Cliente desktop
- `docs/shared/` — Conectores cross-suite (glossario, mappings)
- `docs/business/` — Modelo de negocio

**Regras inviolaveis:**

- NUNCA gere codigo sem antes ler os docs relevantes para a tarefa
- Use a linguagem ubiqua do dominio (`docs/shared/glossary.md`)
- Sempre leia `src/contracts/` antes de implementar qualquer feature
- Test-first: escreva testes ANTES da implementacao (XP)
- Consulte `docs/shared/MAPPING.md` para rastreabilidade entre docs

## Stack Tecnologica

{{Extraido de backend/00-backend-vision.md e blueprint/06-system-architecture.md}}

## Clientes Frontend

{{Lista de clientes ativos com stack de cada um}}

## Mapa de Contexto por Tarefa

Antes de iniciar qualquer tarefa, leia os docs listados abaixo conforme o tipo de trabalho:

### Schema / Migrations

- `docs/blueprint/05-data-model.md`
- `docs/backend/04-data-layer.md`

### API / Backend

- `docs/backend/05-api-contracts.md`
- `docs/backend/06-services.md`
- `docs/backend/07-controllers.md`
- `docs/backend/09-errors.md`
- `docs/backend/10-validation.md`

### Frontend Components

- `docs/frontend/shared/03-design-system.md`
- `docs/frontend/{{client}}/04-components.md`
- `docs/frontend/shared/06-data-layer.md`

### Routing / Navigation

- `docs/frontend/{{client}}/07-routes.md`
- `docs/frontend/{{client}}/08-flows.md`

### Domain / Business Rules

- `docs/blueprint/04-domain-model.md`
- `docs/backend/03-domain.md`
- `docs/shared/glossary.md`

### Security

- `docs/blueprint/13-security.md`
- `docs/backend/08-middlewares.md`
- `docs/backend/11-permissions.md`
- `docs/frontend/{{client}}/11-security.md`

### Events / Integrations

- `docs/backend/12-events.md`
- `docs/backend/13-integrations.md`
- `docs/shared/event-mapping.md`

### Error Handling

- `docs/backend/09-errors.md`
- `docs/shared/error-ux-mapping.md`

### Testing

- `docs/backend/14-tests.md`
- `docs/frontend/{{client}}/09-tests.md`
- `docs/blueprint/12-testing_strategy.md`

### Observabilidade

- `docs/blueprint/15-observability.md`
- `docs/frontend/{{client}}/12-observability.md`

## Convencoes de Codigo

### Nomenclatura

- Conforme `docs/shared/glossary.md`
- Entidades: PascalCase
- Campos/propriedades: camelCase
- Rotas API: {{padrao extraido da arquitetura}}
- Arquivos: {{padrao extraido da estrutura do projeto}}

### Principios Arquiteturais

{{Extraido de 02-architecture_principles.md — resumo de 1 linha por principio}}

### Camadas do Backend

{{Extraido de backend/01-architecture.md — regras de dependencia}}

### Glossario do Dominio (Linguagem Ubiqua)

{{Tabela com os termos principais extraidos de docs/shared/glossary.md}}

## Sempre Ler Antes de Codar

- `src/contracts/` — tipos compartilhados e interfaces
- `{{arquivo de schema}}` — schema do banco de dados
- `package.json` — dependencias instaladas
- `docs/shared/glossary.md` — linguagem ubiqua

## Workflow de Desenvolvimento (XP)

1. Leia os docs relevantes (blueprint + backend/frontend)
2. Leia `src/contracts/` para tipos existentes
3. **RED**: Escreva os testes primeiro
4. **GREEN**: Implemente o minimo para os testes passarem
5. **REFACTOR**: Melhore o codigo mantendo testes verdes
6. Commit small release

## Skills de Codegen Disponiveis

- `/codegen` — apresenta entregas do build plan e guia a execucao
- `/codegen-contracts` — gera tipos, schema e scaffold do projeto (setup inicial)
- `/codegen-feature` — implementa uma feature completa (vertical slice, TDD)
- `/codegen-verify` — verifica codigo gerado contra o blueprint
```

## Passo 6: Salvar e Apresentar

1. Salve o arquivo em `{{projeto-alvo}}/CLAUDE.md`
2. Apresente ao usuario um resumo do que foi gerado:

> "CLAUDE.md gerado em `{{caminho}}`. O arquivo contem:
>
> - Hierarquia de docs (blueprint → backend → frontend → shared)
> - Mapa de contexto com **{{N}} categorias** de tarefa
> - Stack: {{resumo da stack}}
> - Clientes frontend: {{lista}}
> - **{{N}} termos** do glossario do dominio
> - **{{N}} principios** arquiteturais
> - Workflow XP com TDD
>
> Revise o arquivo e ajuste conforme necessario."

## Passo 7: Proximo Passo

> "CLAUDE.md pronto. Rode `/codegen` para ver as entregas do build plan, ou `/codegen-contracts` para gerar o scaffold e tipos compartilhados (setup inicial)."
