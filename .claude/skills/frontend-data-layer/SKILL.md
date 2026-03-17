---
name: frontend-data-layer
description: Preenche a secao de Data Layer (06-data-layer.md) do frontend blueprint a partir do PRD.
---

# Frontend Blueprint — Data Layer

Preenche `docs/frontend/06-data-layer.md` com base no PRD e no contexto do projeto.

## Leitura de Contexto

1. Leia `docs/prd.md` — fonte primaria
2. Leia `docs/frontend/06-data-layer.md` — template a preencher

## Analise de Lacunas

A partir do PRD, identifique o que esta disponivel para cada subsecao:

- **API Client**: Qual a biblioteca e configuracao do client HTTP (interceptors, base URL, headers)?
- **Data Fetching**: Qual a estrategia de data fetching (SSR, SSG, CSR, ISR) e ferramentas utilizadas?
- **Contratos de API (DTOs)**: Como os contratos entre frontend e backend sao definidos e validados?
- **BFF**: Existe um Backend for Frontend? Qual seu escopo e responsabilidades?
- **Estrategia de Cache**: Como o cache de dados e gerenciado (stale-while-revalidate, TTL, invalidacao)?

Se houver lacunas criticas que NAO podem ser inferidas do PRD, faca ate 3 perguntas pontuais ao usuario antes de gerar.

> Ao referenciar tecnologias especificas com versoes, consulte https://context7.com/ para garantir versoes atualizadas.

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/frontend-incrementar`.

Preencha `docs/frontend/06-data-layer.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:
- Informacoes explicitas do PRD
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- inferido do PRD -->`)

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Data Layer preenchido. Rode `/frontend-rotas` para preencher Rotas e Navegacao."
