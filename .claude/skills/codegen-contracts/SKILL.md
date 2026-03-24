---
name: codegen-contracts
description: Setup inicial do codegen. Gera o shared kernel do projeto — tipos TypeScript compartilhados, schema do banco, scaffold de diretorios e configuracoes base. Roda UMA VEZ no inicio do projeto.
---

# Codegen — Contratos Compartilhados (Setup Inicial)

Voce vai gerar o "shared kernel" do projeto — os tipos, schema e scaffold que todas as features futuras importarao. Este skill roda UMA VEZ no inicio e cria a fundacao tipada do projeto.

**Por que este skill e critico:** Tudo que vem depois IMPORTA destes contratos. Se os tipos estiverem corretos, cada sessao subsequente pode gerar codigo tipado sem precisar reler o domain model inteiro.

## Pre-requisitos

- Blueprints preenchidos (pelo menos 04-domain-model, 05-data-model, 06-system-architecture)
- CLAUDE.md gerado no projeto-alvo (via `/codegen-claudemd`)

## Passo 1: Receber o Projeto-Alvo

Verifique se o usuario passou um argumento (caminho do projeto-alvo). Se sim, use-o. Se nao, pergunte:

> "Qual o caminho do projeto-alvo onde o scaffold sera gerado? (ex: `../meu-saas/`)"

Aguarde a resposta.

## Passo 2: Leitura de Contexto

Leia os seguintes documentos **completos**:

1. `docs/blueprint/04-domain-model.md` — entidades, glossario, regras de negocio
2. `docs/blueprint/05-data-model.md` — tabelas, campos, tipos, constraints, indices
3. `docs/blueprint/06-system-architecture.md` — stack, componentes, protocolos
4. `docs/blueprint/02-architecture_principles.md` — principios guia
5. `docs/frontend/02-project-structure.md` — estrutura de diretorios do frontend

> **Versões atualizadas:** Ao referenciar tecnologias específicas com versões, use o MCP context7 para consultar documentação atualizada. Primeiro chame `mcp__context7__resolve-library-id` para obter o ID da biblioteca, depois `mcp__context7__query-docs` para consultar versões e exemplos.

Se algum doc tiver mais de 50k tokens, use Context Excerpting:
- Grep pelos headers para ver a estrutura
- Carregue apenas as secoes de entidades, tabelas e stack

## Passo 3: Analisar e Planejar

A partir dos docs, extraia:

### Do Domain Model (04):
- Lista de entidades com seus atributos e tipos
- Enums e valores possiveis
- Regras de negocio por entidade
- Relacionamentos entre entidades

### Do Data Model (05):
- Tecnologia de banco (PostgreSQL, MySQL, MongoDB, etc.)
- Tabelas com campos, tipos e constraints
- Indices e queries criticas
- Estrategia de migration

### Da System Architecture (06):
- Stack tecnologica completa (linguagem, framework, ORM, etc.)
- Componentes do sistema
- Protocolos de comunicacao

### Dos Principios (02):
- Patterns arquiteturais (Clean Architecture, DDD, Hexagonal, etc.)
- Convencoes de organizacao de codigo

### Da Estrutura Frontend (frontend/02):
- Estrutura de pastas do frontend
- Framework e bibliotecas

Apresente ao usuario um resumo:

> "Vou gerar o scaffold com base nos blueprints:
>
> **Stack:** {{stack resumida}}
> **Entidades:** {{lista de entidades}}
> **Banco:** {{tecnologia}} com {{N}} tabelas
> **Principios:** {{patterns principais}}
>
> Confirma? Ou quer ajustar algo antes de gerar?"

Aguarde confirmacao.

## Passo 4: Gerar Scaffold

Crie a estrutura de diretorios conforme a arquitetura definida nos blueprints. A estrutura DEVE seguir o que esta documentado em `06-system-architecture.md` e `frontend/02-project-structure.md`.

Gere na seguinte ordem:

### 4.1: Configuracao do Projeto
- `package.json` (ou equivalente) com dependencias da stack definida
- `tsconfig.json` (ou equivalente)
- `.env.example` com variaveis necessarias
- `.gitignore`
- Configuracao de linting/formatting conforme blueprint

### 4.2: Tipos Compartilhados (`src/contracts/`)

Para CADA entidade do domain model, gere um arquivo de tipo:

```
src/contracts/
├── entities/          # Um arquivo por entidade
│   ├── {{entity}}.ts  # Interface/type da entidade
│   └── index.ts       # Barrel export
├── enums/             # Enums extraidos do domain model
│   ├── {{enum}}.ts    # Cada enum
│   └── index.ts       # Barrel export
├── api/               # Request/Response types
│   ├── {{resource}}.ts
│   └── index.ts
└── index.ts           # Barrel export raiz
```

**Regras para geracao de tipos:**
- Nomes de entidades: PascalCase (conforme glossario)
- Campos: camelCase
- Enums: PascalCase para o tipo, SCREAMING_SNAKE_CASE para valores
- Cada tipo deve ter JSDoc com a descricao do domain model
- Tipos de ID devem ser branded types quando possivel
- Relacionamentos devem usar os tipos das entidades referenciadas

### 4.3: Schema do Banco

Gere o schema completo baseado no `05-data-model.md`:
- Se a stack usa Prisma: `prisma/schema.prisma`
- Se usa Drizzle: `src/db/schema.ts`
- Se usa TypeORM: entities com decorators
- Se usa outro ORM: conforme a stack

O schema DEVE incluir:
- Todas as tabelas do data model
- Todos os campos com tipos corretos
- Constraints (unique, not null, default)
- Relacionamentos (foreign keys)
- Indices definidos no data model
- Enums do banco

### 4.4: Scaffold de Diretorios

Crie a estrutura de pastas com arquivos `index.ts` (ou equivalente) vazios para:
- Camada de servicos/use cases
- Camada de repositorios/data access
- Camada de rotas/controllers
- Camada de middlewares
- Camada de frontend (conforme frontend/02)

### 4.5: Configuracao de Testes

- Setup de test runner conforme `12-testing_strategy.md` (se disponivel)
- Arquivo de configuracao (jest.config, vitest.config, etc.)
- Helper/factory para criacao de fixtures baseadas nas entidades

## Passo 5: Validacao

Apos gerar, execute:

1. **Type check**: Rode o type checker para garantir que os tipos estao corretos
2. **Lint**: Rode o linter para garantir formatacao
3. **Schema validation**: Rode validacao do schema (ex: `prisma validate`)

Se houver erros, corrija antes de prosseguir.

## Passo 6: Apresentar Resultado

> "Setup inicial concluido. Scaffold gerado:
>
> - **{{N}} tipos** de entidades em `src/contracts/entities/`
> - **{{N}} enums** em `src/contracts/enums/`
> - **{{N}} tipos de API** em `src/contracts/api/`
> - **Schema** com {{N}} tabelas em `{{caminho do schema}}`
> - **Estrutura** de {{N}} diretorios criados
>
> Os contratos sao a fonte de verdade tipada. Todas as features futuras devem importar de `src/contracts/`.
>
> Rode `/codegen` para ver as entregas do build plan, ou `/codegen-feature [nome]` para implementar a primeira feature."

## Passo 7: Commit

Sugira ao usuario:

> "Deseja fazer o commit inicial? Sugestao: `feat: project scaffold and shared contracts (setup inicial)`"
