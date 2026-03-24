---
name: frontend-performance
description: Preenche a secao de Performance (10-performance.md) do frontend blueprint a partir do blueprint tecnico.
---

# Frontend Blueprint — Performance

Preenche `docs/frontend/{client}/10-performance.md` com base no blueprint tecnico e no contexto do projeto.

## Identificacao do Cliente

Este skill aceita um parametro de cliente: `web`, `mobile`, ou `desktop`.
Se o parametro nao for fornecido, pergunte:

> "Para qual cliente voce esta preenchendo este documento? (web / mobile / desktop)"

Caminho de saida: `docs/frontend/{client}/10-performance.md`
Leia tambem os documentos compartilhados em `docs/frontend/shared/` para contexto.

## Leitura de Contexto

1. Leia `docs/blueprint/14-scalability.md` — estrategias de cache e escala
2. Leia `docs/blueprint/03-requirements.md` — requisitos nao-funcionais (latencia, throughput)
3. Leia `docs/frontend/{client}/10-performance.md` — template a preencher
4. Leia `docs/prd.md` — complemento se necessario

## Analise de Lacunas

A partir do blueprint tecnico, identifique o que esta disponivel para cada subsecao:

- **Estrategias de Otimizacao**: Quais tecnicas de otimizacao (code splitting, lazy loading, tree shaking, caching) sao aplicaveis ao projeto?
- **Core Web Vitals**: Quais sao as metas para LCP, FID/INP e CLS e como serao alcancadas?
- **Budget de Performance**: Qual o tamanho maximo aceitavel para bundles, tempo de carregamento e numero de requests?
- **Monitoramento**: Como a performance sera monitorada em producao e quais alertas serao configurados?

Se houver lacunas criticas que NAO podem ser inferidas do blueprint tecnico, faca ate 3 perguntas pontuais ao usuario antes de gerar.

> **Versões atualizadas:** Ao referenciar tecnologias específicas com versões, use o MCP context7 para consultar documentação atualizada. Primeiro chame `mcp__context7__resolve-library-id` para obter o ID da biblioteca, depois `mcp__context7__query-docs` para consultar versões e exemplos.

## Contexto por Plataforma

### Se web:
- Core Web Vitals: LCP, INP, CLS como metricas primarias
- Code splitting e lazy loading de rotas
- Streaming SSR e progressive hydration

### Se mobile:
- App startup time (cold start e warm start)
- Frame rate alvo de 60fps
- Consumo de memoria e bateria
- Otimizacoes do Hermes engine

### Se desktop:
- Startup time da aplicacao
- Uso de memoria (main process + renderer)
- Consumo de CPU em idle e em uso
- Tamanho do instalador e atualizacoes delta

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/frontend-increment`.

Preencha `docs/frontend/{client}/10-performance.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:
- Informacoes explicitas do blueprint tecnico
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- do blueprint: XX-arquivo.md -->`)

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Performance preenchida para {client}. Rode `/frontend-security {client}` para preencher Seguranca."
