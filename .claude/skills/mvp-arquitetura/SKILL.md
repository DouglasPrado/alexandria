---
name: mvp-arquitetura
description: Use when filling the architecture section (05-arquitetura.md) of the MVP blueprint. Defines stack, components, and technical decisions for the POC.
---

# MVP Blueprint — Arquitetura

Voce vai preencher a secao de Arquitetura do MVP Blueprint.

## Leitura

1. Leia `docs/prd.md` — fonte primaria
2. Leia `docs/mvp/02-requisitos.md` e `docs/mvp/04-dados.md` — requisitos e dados
3. Leia `docs/mvp/05-arquitetura.md` — template a preencher

## Analise

A partir do PRD, requisitos e dados, defina:
- **Stack**: frontend, backend, database, infra (onde roda)
- **Componentes**: o que faz cada peca e como se comunicam
- **Decisoes tecnicas**: por que X e nao Y

Para POC, prefira:
- Monolito > microservicos
- Framework simples > framework enterprise
- Deploy simples (Vercel, Railway, local) > Kubernetes
- Menos dependencias > mais dependencias

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/mvp-incrementar`.

Preencha `docs/mvp/05-arquitetura.md`. Sem deployment topology, sem diagrama C4 obrigatorio, sem infrastructure-as-code.

## Revisao

Apresente o documento ao usuario. Aplique ajustes. Salve.

## Proxima etapa

> "Arquitetura preenchida. Rode `/mvp-fluxos` para definir os Fluxos Criticos."
