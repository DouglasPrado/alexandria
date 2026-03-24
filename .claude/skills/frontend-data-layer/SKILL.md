---
name: frontend-data-layer
description: Preenche a secao de Data Layer (06-data-layer.md) do frontend blueprint a partir do blueprint tecnico.
---

# Frontend Blueprint — Data Layer

Preenche `docs/frontend/shared/06-data-layer.md` com base no blueprint tecnico e no contexto do projeto. Este e um documento **compartilhado** entre todos os clientes (web, mobile, desktop).

## Leitura de Contexto

1. Leia `docs/blueprint/05-data-model.md` — modelo de dados e queries
2. Leia `docs/blueprint/06-system-architecture.md` — API e comunicacao
3. Leia `docs/blueprint/03-requirements.md` — requisitos nao-funcionais (latencia, cache)
4. Leia `docs/frontend/shared/06-data-layer.md` — template a preencher
5. Leia `docs/prd.md` — complemento se necessario

## Analise de Lacunas

A partir do blueprint tecnico, identifique o que esta disponivel para cada subsecao:

- **API Client**: Qual a biblioteca e configuracao do client HTTP (interceptors, base URL, headers)?
- **Data Fetching**: Qual a estrategia de data fetching (SSR, SSG, CSR, ISR) e ferramentas utilizadas?
- **Contratos de API (DTOs)**: Como os contratos entre frontend e backend sao definidos e validados?
- **BFF**: Existe um Backend for Frontend? Qual seu escopo e responsabilidades?
- **Estrategia de Cache**: Como o cache de dados e gerenciado (stale-while-revalidate, TTL, invalidacao)?

Se houver lacunas criticas que NAO podem ser inferidas do blueprint tecnico, faca ate 3 perguntas pontuais ao usuario antes de gerar.

> **Versões atualizadas:** Ao referenciar tecnologias específicas com versões, use o MCP context7 para consultar documentação atualizada. Primeiro chame `mcp__context7__resolve-library-id` para obter o ID da biblioteca, depois `mcp__context7__query-docs` para consultar versões e exemplos.

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/frontend-increment`.

Preencha `docs/frontend/shared/06-data-layer.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:
- Informacoes explicitas do blueprint tecnico
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- do blueprint: XX-arquivo.md -->`)

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Data Layer preenchido (compartilhado entre todos os clientes). Rode `/frontend-routes {client}` para preencher Rotas e Navegacao do cliente desejado."
