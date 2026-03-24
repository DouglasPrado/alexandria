---
name: frontend-flows
description: Preenche a secao de Fluxos de Interface (08-flows.md) do frontend blueprint a partir do blueprint tecnico.
---

# Frontend Blueprint — Fluxos de Interface

Preenche `docs/frontend/08-flows.md` com base no blueprint tecnico e no contexto do projeto.

## Leitura de Contexto

1. Leia `docs/blueprint/07-critical_flows.md` — fluxos criticos do sistema
2. Leia `docs/blueprint/08-use_cases.md` — casos de uso
3. Leia `docs/blueprint/09-state-models.md` — transicoes de estado
4. Leia `docs/frontend/08-flows.md` — template a preencher
5. Leia `docs/prd.md` — complemento se necessario

## Analise de Lacunas

A partir do blueprint tecnico, identifique o que esta disponivel para cada subsecao:

- **Fluxos Criticos (3-5 fluxos com passos e tratamento de erros)**: Quais sao os fluxos principais do usuario, seus passos detalhados e como erros sao tratados em cada etapa?
- **Microfrontends (quando aplicavel)**: O sistema utiliza microfrontends? Se sim, como os fluxos se distribuem entre eles?

Se houver lacunas criticas que NAO podem ser inferidas do blueprint tecnico, faca ate 3 perguntas pontuais ao usuario antes de gerar.

> **Versões atualizadas:** Ao referenciar tecnologias específicas com versões, use o MCP context7 para consultar documentação atualizada. Primeiro chame `mcp__context7__resolve-library-id` para obter o ID da biblioteca, depois `mcp__context7__query-docs` para consultar versões e exemplos.

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/frontend-increment`.

Preencha `docs/frontend/08-flows.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:
- Informacoes explicitas do blueprint tecnico
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- do blueprint: XX-arquivo.md -->`)

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Fluxos de Interface preenchido. Rode `/frontend-tests` para preencher Estrategia de Testes."
