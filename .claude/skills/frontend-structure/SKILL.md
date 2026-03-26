---
name: frontend-structure
description: Preenche a secao de Estrutura do Projeto (02-project-structure.md) do frontend blueprint a partir do blueprint tecnico.
---

# Frontend Blueprint — Estrutura do Projeto

Preenche `docs/frontend/{client}/02-project-structure.md` com base no blueprint tecnico e no contexto do projeto.

## Identificacao do Cliente

Este skill aceita um parametro de cliente: `web`, `mobile`, ou `desktop`.
Se o parametro nao for fornecido, pergunte:

> "Para qual cliente voce esta preenchendo este documento? (web / mobile / desktop)"

Caminho de saida: `docs/frontend/{client}/02-project-structure.md`
Leia tambem os documentos compartilhados em `docs/frontend/shared/` para contexto.

## Leitura de Contexto

1. Leia `docs/blueprint/06-system-architecture.md` — componentes e deploy
2. Leia `docs/frontend/{client}/01-architecture.md` — arquitetura do frontend (ja preenchida)
3. Leia `docs/frontend/{client}/02-project-structure.md` — template a preencher
4. Leia `docs/prd.md` — complemento se necessario

## Analise de Lacunas

A partir do blueprint tecnico, identifique o que esta disponivel para cada subsecao:

- **Estrutura de Pastas**: Qual a organizacao de diretorios do projeto e onde ficam os principais artefatos?
- **Organizacao por Feature**: Como as features sao isoladas e organizadas dentro da estrutura?
- **Monorepo**: O projeto utiliza monorepo? Se sim, qual a estrategia de workspaces e compartilhamento?
- **Regras de Importacao**: Quais convencoes e restricoes de importacao entre modulos devem ser seguidas?

Se houver lacunas criticas que NAO podem ser inferidas do blueprint tecnico, faca ate 3 perguntas pontuais ao usuario antes de gerar.

> **Versões atualizadas:** Ao referenciar tecnologias específicas com versões, use o MCP context7 para consultar documentação atualizada. Primeiro chame `mcp__context7__resolve-library-id` para obter o ID da biblioteca, depois `mcp__context7__query-docs` para consultar versões e exemplos.

## Contexto por Plataforma

### Se web:

- Estrutura app/ router (Next.js) ou routes/ (Remix)
- Diretorio public/, middleware, API routes
- Organizacao de layouts, loading states, error boundaries

### Se mobile:

- Expo Router com app/ ou estrutura screens/ tradicional
- Diretorio assets/, navegacao, componentes nativos
- Configuracao de plataformas (ios/, android/)

### Se desktop:

- Separacao main/ (processo principal) e renderer/ (UI)
- Diretorio ipc/ para comunicacao entre processos
- Configuracao de build e empacotamento (electron-builder, tauri.conf.json)

## Geracao

> **Modo de escrita:**
>
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/frontend-increment`.

Preencha `docs/frontend/{client}/02-project-structure.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:

- Informacoes explicitas do blueprint tecnico
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- do blueprint: XX-arquivo.md -->`)

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Estrutura do Projeto preenchida para {client}. Rode `/frontend-design-system {client}` para preencher Design System."
