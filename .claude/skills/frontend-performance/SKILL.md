---
name: frontend-performance
description: Preenche a secao de Performance (10-performance.md) do frontend blueprint a partir do PRD.
---

# Frontend Blueprint — Performance

Preenche `docs/frontend/10-performance.md` com base no PRD e no contexto do projeto.

## Leitura de Contexto

1. Leia `docs/prd.md` — fonte primaria
2. Leia `docs/frontend/10-performance.md` — template a preencher

## Analise de Lacunas

A partir do PRD, identifique o que esta disponivel para cada subsecao:

- **Estrategias de Otimizacao**: Quais tecnicas de otimizacao (code splitting, lazy loading, tree shaking, caching) sao aplicaveis ao projeto?
- **Core Web Vitals**: Quais sao as metas para LCP, FID/INP e CLS e como serao alcancadas?
- **Budget de Performance**: Qual o tamanho maximo aceitavel para bundles, tempo de carregamento e numero de requests?
- **Monitoramento**: Como a performance sera monitorada em producao e quais alertas serao configurados?

Se houver lacunas criticas que NAO podem ser inferidas do PRD, faca ate 3 perguntas pontuais ao usuario antes de gerar.

> Ao referenciar tecnologias especificas com versoes, consulte https://context7.com/ para garantir versoes atualizadas.

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/frontend-incrementar`.

Preencha `docs/frontend/10-performance.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:
- Informacoes explicitas do PRD
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- inferido do PRD -->`)

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Performance preenchido. Rode `/frontend-seguranca` para preencher Seguranca."
