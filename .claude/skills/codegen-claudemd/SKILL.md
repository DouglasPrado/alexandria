---
name: codegen-claudemd
description: Gera o CLAUDE.md router para o projeto-alvo a partir dos blueprints preenchidos. Analisa a estrutura dos docs e cria um mapa de contexto que guia o Claude Code durante a geracao de codigo.
---

# Codegen — Gerar CLAUDE.md Router

Voce vai analisar os blueprints preenchidos e gerar um arquivo `CLAUDE.md` no projeto-alvo. Este arquivo funciona como um **router de contexto** — diz ao Claude Code exatamente quais documentos do blueprint ler para cada tipo de tarefa de codificacao.

## Passo 1: Receber o Projeto-Alvo

Verifique se o usuario passou um argumento (caminho do projeto-alvo). Se sim, use-o. Se nao, pergunte:

> "Para gerar o CLAUDE.md, preciso saber:
> 1. **Caminho do projeto-alvo**: onde o codigo sera gerado (ex: `../meu-saas/`)
> 2. **Caminho dos blueprints**: onde estao os docs preenchidos (default: `docs/`)
>
> Informe o caminho do projeto-alvo."

Aguarde a resposta do usuario.

## Passo 2: Leitura dos Indices dos Blueprints

**NAO leia o conteudo completo dos docs.** Leia apenas os headers (titulos e subtitulos) de cada documento para entender a estrutura. Use Bash com `grep` para extrair apenas as linhas que comecam com `#`:

Para cada doc em `docs/blueprint/`, `docs/frontend/`, `docs/business/`:
1. Extraia os headers (`# `, `## `, `### `)
2. Identifique quais secoes contem conteudo real (nao apenas `{{placeholders}}`)
3. Monte um mapa: `doc → secoes preenchidas`

## Passo 3: Analisar Stack e Convencoes

Leia estes docs **completos** (sao essenciais para o CLAUDE.md):

1. `docs/blueprint/02-architecture_principles.md` — principios que guiam decisoes de codigo
2. `docs/blueprint/06-system-architecture.md` — stack tecnologica, componentes, protocolos
3. `docs/blueprint/04-domain-model.md` — **somente a secao Glossario/Linguagem Ubiqua** (grep por "Glossario" ou "Linguagem")

Extraia:
- **Stack**: linguagens, frameworks, ORMs, bancos, filas
- **Convencoes de nomenclatura**: PascalCase para entidades, camelCase para campos, etc.
- **Principios arquiteturais**: patterns (Clean Architecture, DDD, etc.)
- **Glossario**: termos do dominio que devem ser usados no codigo

## Passo 4: Gerar o CLAUDE.md

Use o template em `docs/templates/claudemd-template.md` como base (se existir). Caso contrario, gere seguindo esta estrutura:

```markdown
# {{Nome do Projeto}}

## Fonte de Verdade

Todo codigo DEVE implementar fielmente o que esta documentado nos blueprints.
Localizacao dos blueprints: {{caminho relativo dos docs}}

**Regras inviolaveis:**
- NUNCA gere codigo sem antes ler os docs de blueprint relevantes para a tarefa
- Use a linguagem ubiqua do dominio (nomes de entidades, campos, acoes)
- Sempre leia `src/contracts/` antes de implementar qualquer feature
- Test-first: escreva testes ANTES da implementacao (XP)

## Stack Tecnologica

{{Extraido de 06-system-architecture.md}}

## Mapa de Contexto por Tarefa

Antes de iniciar qualquer tarefa, leia os docs listados abaixo conforme o tipo de trabalho:

### Schema / Migrations
{{lista de docs relevantes com caminho relativo}}

### API / Backend
{{lista de docs relevantes com caminho relativo}}

### Frontend Components
{{lista de docs relevantes com caminho relativo}}

### Routing / Navigation
{{lista de docs relevantes com caminho relativo}}

### Security
{{lista de docs relevantes com caminho relativo}}

### Testing
{{lista de docs relevantes com caminho relativo}}

### Observabilidade
{{lista de docs relevantes com caminho relativo}}

## Convencoes de Codigo

### Nomenclatura
- Entidades: PascalCase (conforme glossario do dominio)
- Campos/propriedades: camelCase
- Rotas API: {{padrao extraido da arquitetura}}
- Arquivos: {{padrao extraido da estrutura do projeto}}

### Principios Arquiteturais
{{Extraido de 02-architecture_principles.md — resumo de 1 linha por principio}}

### Glossario do Dominio (Linguagem Ubiqua)
{{Tabela com os termos principais extraidos de 04-domain-model.md}}

## Sempre Ler Antes de Codar

- `src/contracts/` — tipos compartilhados e interfaces
- `{{arquivo de schema}}` — schema do banco de dados
- `package.json` — dependencias instaladas

## Workflow de Desenvolvimento (XP)

1. Leia os docs do blueprint relevantes para a feature
2. Leia `src/contracts/` para tipos existentes
3. **RED**: Escreva os testes primeiro
4. **GREEN**: Implemente o minimo para os testes passarem
5. **REFACTOR**: Melhore o codigo mantendo testes verdes
6. Commit small release

## Skills de Codegen Disponiveis

- `/codegen` — apresenta fases do build plan e guia a execucao
- `/codegen-contracts` — gera tipos, schema e scaffold do projeto (Phase 0)
- `/codegen-feature` — implementa uma feature completa (vertical slice, TDD)
- `/codegen-verify` — verifica codigo gerado contra o blueprint
```

## Passo 5: Salvar e Apresentar

1. Salve o arquivo em `{{projeto-alvo}}/CLAUDE.md`
2. Apresente ao usuario um resumo do que foi gerado:

> "CLAUDE.md gerado em `{{caminho}}`. O arquivo contem:
> - Mapa de contexto com **{{N}} categorias** de tarefa
> - Stack: {{resumo da stack}}
> - **{{N}} termos** do glossario do dominio
> - **{{N}} principios** arquiteturais
> - Workflow XP com TDD
>
> Revise o arquivo e ajuste conforme necessario."

## Passo 6: Proximo Passo

> "CLAUDE.md pronto. Rode `/codegen` para ver as fases do build plan, ou `/codegen-contracts` para gerar o scaffold e tipos compartilhados (Phase 0)."
