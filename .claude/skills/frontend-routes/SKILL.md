---
name: frontend-routes
description: Preenche a secao de Rotas (07-routes.md) do frontend blueprint a partir do blueprint tecnico.
---

# Frontend Blueprint — Rotas

Preenche `docs/frontend/{client}/07-routes.md` com base no blueprint tecnico e no contexto do projeto.

## Identificacao do Cliente

Este skill aceita um parametro de cliente: `web`, `mobile`, ou `desktop`.
Se o parametro nao for fornecido, pergunte:

> "Para qual cliente voce esta preenchendo este documento? (web / mobile / desktop)"

Caminho de saida: `docs/frontend/{client}/07-routes.md`
Leia tambem os documentos compartilhados em `docs/frontend/shared/` para contexto.

## Leitura de Contexto

1. Leia `docs/blueprint/08-use_cases.md` — casos de uso que mapeiam para telas
2. Leia `docs/blueprint/07-critical_flows.md` — fluxos criticos com navegacao
3. Leia `docs/frontend/{client}/07-routes.md` — template a preencher
4. Leia `docs/prd.md` — complemento se necessario

## Analise de Lacunas

A partir do blueprint tecnico, identifique o que esta disponivel para cada subsecao:

- **Estrutura de Rotas**: Quais paginas e rotas o sistema possui e como estao organizadas hierarquicamente?
- **Protecao de Rotas**: Quais rotas exigem autenticacao, autorizacao ou condicoes especiais de acesso?
- **Layouts Compartilhados**: Quais layouts sao reutilizados entre rotas e como a composicao de layouts funciona?
- **Navegacao**: Como o usuario navega entre as paginas, quais menus e breadcrumbs existem?

Se houver lacunas criticas que NAO podem ser inferidas do blueprint tecnico, faca ate 3 perguntas pontuais ao usuario antes de gerar.

> **Versões atualizadas:** Ao referenciar tecnologias específicas com versões, use o MCP context7 para consultar documentação atualizada. Primeiro chame `mcp__context7__resolve-library-id` para obter o ID da biblioteca, depois `mcp__context7__query-docs` para consultar versões e exemplos.

## Contexto por Plataforma

### Se web:
- URL-based App Router, file-based routing
- Guards via middleware
- Suporte a layouts aninhados e rotas paralelas

### Se mobile:
- React Navigation com stacks, tabs e drawers
- Deep linking via URL schemes e universal links
- Navegacao gestual nativa

### Se desktop:
- Window-based navigation
- Menu bar e system tray com context menu
- Suporte a multiplas janelas

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/frontend-increment`.

Preencha `docs/frontend/{client}/07-routes.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:
- Informacoes explicitas do blueprint tecnico
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- do blueprint: XX-arquivo.md -->`)

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Rotas preenchidas para {client}. Rode `/frontend-flows {client}` para preencher Fluxos de Interface."
