---
name: frontend-tests
description: Preenche a secao de Estrategia de Testes (09-tests.md) do frontend blueprint a partir do blueprint tecnico.
---

# Frontend Blueprint — Estrategia de Testes

Preenche `docs/frontend/{client}/09-tests.md` com base no blueprint tecnico e no contexto do projeto.

## Identificacao do Cliente

Este skill aceita um parametro de cliente: `web`, `mobile`, ou `desktop`.
Se o parametro nao for fornecido, pergunte:

> "Para qual cliente voce esta preenchendo este documento? (web / mobile / desktop)"

Caminho de saida: `docs/frontend/{client}/09-tests.md`
Leia tambem os documentos compartilhados em `docs/frontend/shared/` para contexto.

## Leitura de Contexto

1. Leia `docs/blueprint/12-testing_strategy.md` — piramide e cobertura do sistema
2. Leia `docs/blueprint/03-requirements.md` — requisitos para criterios de aceite
3. Leia `docs/frontend/{client}/09-tests.md` — template a preencher
4. Leia `docs/prd.md` — complemento se necessario

## Analise de Lacunas

A partir do blueprint tecnico, identifique o que esta disponivel para cada subsecao:

- **Piramide de Testes**: Qual a proporcao ideal entre testes unitarios, de integracao e e2e para este projeto?
- **Padroes por Tipo de Componente**: Quais padroes de teste se aplicam a cada tipo de componente (paginas, formularios, hooks, servicos)?
- **Cobertura e Metas**: Quais metas de cobertura sao adequadas e quais areas criticas exigem cobertura obrigatoria?
- **Integracao com CI**: Como os testes se integram ao pipeline de CI/CD e quais gates de qualidade existem?

Se houver lacunas criticas que NAO podem ser inferidas do blueprint tecnico, faca ate 3 perguntas pontuais ao usuario antes de gerar.

> **Versões atualizadas:** Ao referenciar tecnologias específicas com versões, use o MCP context7 para consultar documentação atualizada. Primeiro chame `mcp__context7__resolve-library-id` para obter o ID da biblioteca, depois `mcp__context7__query-docs` para consultar versões e exemplos.

## Contexto por Plataforma

### Se web:
- Playwright para testes E2E
- Testing Library para testes de componentes
- Jest/Vitest para testes unitarios

### Se mobile:
- Detox ou Maestro para testes E2E
- React Native Testing Library para testes de componentes
- Testes de integracao com APIs nativas

### Se desktop:
- Playwright + Electron para testes E2E
- Testes de IPC handlers (main <-> renderer)
- Testes de integracao com APIs do sistema operacional

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/frontend-increment`.

Preencha `docs/frontend/{client}/09-tests.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:
- Informacoes explicitas do blueprint tecnico
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- do blueprint: XX-arquivo.md -->`)

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Estrategia de Testes preenchida para {client}. Rode `/frontend-performance {client}` para preencher Performance."
