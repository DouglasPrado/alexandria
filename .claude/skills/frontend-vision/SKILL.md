---
name: frontend-vision
description: Preenche a secao de Visao do Frontend (00-frontend-vision.md) a partir do blueprint tecnico.
---

# Frontend Blueprint — Visao do Frontend

Preenche `docs/frontend/{client}/00-frontend-vision.md` com base no blueprint tecnico e no contexto do projeto.

## Identificacao do Cliente

Este skill aceita um parametro de cliente: `web`, `mobile`, ou `desktop`.
Se o parametro nao for fornecido, pergunte:

> "Para qual cliente voce esta preenchendo este documento? (web / mobile / desktop)"

Caminho de saida: `docs/frontend/{client}/00-frontend-vision.md`
Leia tambem os documentos compartilhados em `docs/frontend/shared/` para contexto.

## Leitura de Contexto

1. Leia `docs/blueprint/00-context.md` — atores e limites do sistema
2. Leia `docs/blueprint/01-vision.md` — problema, metricas, nao-objetivos
3. Leia `docs/blueprint/02-architecture_principles.md` — principios e restricoes
4. Leia `docs/frontend/{client}/00-frontend-vision.md` — template a preencher
5. Leia `docs/prd.md` — complemento se necessario

## Analise de Lacunas

A partir do blueprint tecnico, identifique o que esta disponivel para cada subsecao:

- **Objetivo do Frontend**: Qual o proposito principal da interface e que experiencia ela deve entregar?
- **Principios Arquiteturais**: Quais principios guiam as decisoes de frontend (performance-first, acessibilidade, offline-first)?
- **Plataformas e Dispositivos**: Quais plataformas (web, mobile, desktop) e dispositivos sao suportados?
- **Stack Tecnologico**: Quais frameworks, linguagens, ferramentas de build e runtime serao utilizados?
- **Tipos de Usuarios**: Quais perfis de usuario interagem com o frontend e quais suas necessidades?

Se houver lacunas criticas que NAO podem ser inferidas do blueprint tecnico, faca ate 3 perguntas pontuais ao usuario antes de gerar.

> **Versões atualizadas:** Ao referenciar tecnologias específicas com versões, use o MCP context7 para consultar documentação atualizada. Primeiro chame `mcp__context7__resolve-library-id` para obter o ID da biblioteca, depois `mcp__context7__query-docs` para consultar versões e exemplos.

## Contexto por Plataforma

### Se web:
- Frameworks tipicos: Next.js, Remix, SPA (Vite + React)
- Considere SSR/SSG, hidratacao, SEO, responsividade
- Ferramentas de build: Vite, Turbopack, Webpack

### Se mobile:
- Frameworks tipicos: React Native, Expo
- Considere navegacao nativa, gestos, notificacoes push, offline-first
- Ferramentas de build: Expo CLI, React Native CLI, EAS Build

### Se desktop:
- Frameworks tipicos: Electron, Tauri
- Considere integracao com sistema operacional, menu bar, system tray, auto-update
- Ferramentas de build: electron-builder, tauri-cli

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/frontend-increment`.

Preencha `docs/frontend/{client}/00-frontend-vision.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:
- Informacoes do blueprint tecnico
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- do blueprint: XX-arquivo.md -->`)

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Visao do Frontend preenchida para {client}. Rode `/frontend-architecture {client}` para preencher Arquitetura do Frontend."
