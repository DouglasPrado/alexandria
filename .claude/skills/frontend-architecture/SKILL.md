---
name: frontend-architecture
description: Preenche a secao de Arquitetura (01-architecture.md) do frontend blueprint a partir do blueprint tecnico.
---

# Frontend Blueprint — Arquitetura do Frontend

Preenche `docs/frontend/{client}/01-architecture.md` com base no blueprint tecnico e no contexto do projeto.

## Identificacao do Cliente

Este skill aceita um parametro de cliente: `web`, `mobile`, ou `desktop`.
Se o parametro nao for fornecido, pergunte:

> "Para qual cliente voce esta preenchendo este documento? (web / mobile / desktop)"

Caminho de saida: `docs/frontend/{client}/01-architecture.md`
Leia tambem os documentos compartilhados em `docs/frontend/shared/` para contexto.

## Leitura de Contexto

1. Leia `docs/blueprint/06-system-architecture.md` — componentes, comunicacao, deploy
2. Leia `docs/blueprint/02-architecture_principles.md` — principios
3. Leia `docs/blueprint/10-architecture_decisions.md` — ADRs
4. Leia `docs/frontend/{client}/01-architecture.md` — template a preencher
5. Leia `docs/prd.md` — complemento se necessario

## Analise de Lacunas

A partir do blueprint tecnico, identifique o que esta disponivel para cada subsecao:

- **Camadas Arquiteturais**: Quais camadas compõem o frontend (presentation, application, domain, infrastructure)?
- **Regras de Dependencia**: Quais regras governam as dependencias entre camadas e modulos?
- **Fronteiras de Dominio**: Como os dominios de negocio se refletem na organizacao do frontend?
- **Diagrama de Arquitetura**: Qual a visao geral da arquitetura e como os componentes se conectam?

Se houver lacunas criticas que NAO podem ser inferidas do blueprint tecnico, faca ate 3 perguntas pontuais ao usuario antes de gerar.

> **Versões atualizadas:** Ao referenciar tecnologias específicas com versões, use o MCP context7 para consultar documentação atualizada. Primeiro chame `mcp__context7__resolve-library-id` para obter o ID da biblioteca, depois `mcp__context7__query-docs` para consultar versões e exemplos.

## Contexto por Plataforma

### Se web:

- Camadas SSR/SSG, React Server Components, API routes
- Middleware de autenticacao e redirecionamento no edge
- Hydration boundaries e streaming

### Se mobile:

- Bridge para modulos nativos (camera, GPS, biometria)
- Arquitetura de navegacao (stack, tab, drawer)
- Camada de comunicacao com APIs (offline queue, retry)

### Se desktop:

- Processo main vs renderer (Electron) ou core vs webview (Tauri)
- IPC (Inter-Process Communication) entre processos
- Integracao com APIs do sistema operacional (filesystem, notifications, tray)

## Geracao

> **Modo de escrita:**
>
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/frontend-increment`.

Preencha `docs/frontend/{client}/01-architecture.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:

- Informacoes do blueprint tecnico
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- do blueprint: XX-arquivo.md -->`)

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Arquitetura preenchida para {client}. Rode `/frontend-structure {client}` para preencher Estrutura do Projeto."
