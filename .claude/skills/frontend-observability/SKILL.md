---
name: frontend-observability
description: Preenche a secao de Observabilidade (12-observability.md) do frontend blueprint a partir do blueprint tecnico.
---

# Frontend Blueprint — Observabilidade

Preenche `docs/frontend/12-observability.md` com base no blueprint tecnico e no contexto do projeto.

## Leitura de Contexto

1. Leia `docs/blueprint/15-observability.md` — logs, metricas, traces, alertas
2. Leia `docs/frontend/12-observability.md` — template a preencher
3. Leia `docs/prd.md` — complemento se necessario

## Analise de Lacunas

A partir do blueprint tecnico, identifique o que esta disponivel para cada subsecao:

- **Error Tracking**: Como erros de frontend sao capturados, categorizados e reportados?
- **Logging Estruturado**: Qual a estrategia de logging no frontend e como logs sao enviados ao backend?
- **Metricas de API**: Como chamadas de API sao monitoradas (latencia, taxa de erro, volume)?
- **User Flow Monitoring**: Como fluxos criticos do usuario sao rastreados para detectar abandono ou falhas?
- **Feature Flags**: Como feature flags sao gerenciadas e como a observabilidade se integra com rollouts graduais?

Se houver lacunas criticas que NAO podem ser inferidas do PRD, faca ate 3 perguntas pontuais ao usuario antes de gerar.

> **Versões atualizadas:** Ao referenciar tecnologias específicas com versões, use o MCP context7 para consultar documentação atualizada. Primeiro chame `mcp__context7__resolve-library-id` para obter o ID da biblioteca, depois `mcp__context7__query-docs` para consultar versões e exemplos.

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/frontend-increment`.

Preencha `docs/frontend/12-observability.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:
- Informacoes do blueprint tecnico (fonte primaria)
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- do blueprint: 15-observability.md -->`)

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Observabilidade preenchido. Rode `/frontend-cicd` para preencher CI/CD e Convencoes."
