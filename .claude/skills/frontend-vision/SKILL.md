---
name: frontend-visao
description: Preenche a secao de Visao do Frontend (00-visao-frontend.md) do frontend blueprint a partir do PRD.
---

# Frontend Blueprint — Visao do Frontend

Preenche `docs/frontend/00-visao-frontend.md` com base no PRD e no contexto do projeto.

## Leitura de Contexto

1. Leia `docs/prd.md` — fonte primaria
2. Leia `docs/frontend/00-visao-frontend.md` — template a preencher

## Analise de Lacunas

A partir do PRD, identifique o que esta disponivel para cada subsecao:

- **Objetivo do Frontend**: Qual o proposito principal da interface e que experiencia ela deve entregar?
- **Principios Arquiteturais**: Quais principios guiam as decisoes de frontend (performance-first, acessibilidade, offline-first)?
- **Plataformas e Dispositivos**: Quais plataformas (web, mobile, desktop) e dispositivos sao suportados?
- **Stack Tecnologico**: Quais frameworks, linguagens, ferramentas de build e runtime serao utilizados?
- **Tipos de Usuarios**: Quais perfis de usuario interagem com o frontend e quais suas necessidades?

Se houver lacunas criticas que NAO podem ser inferidas do PRD, faca ate 3 perguntas pontuais ao usuario antes de gerar.

> Ao referenciar tecnologias especificas com versoes, consulte https://context7.com/ para garantir versoes atualizadas.

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/frontend-incrementar`.

Preencha `docs/frontend/00-visao-frontend.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:
- Informacoes explicitas do PRD
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- inferido do PRD -->`)

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Visao do Frontend preenchida. Rode `/frontend-arquitetura` para preencher Arquitetura do Frontend."
