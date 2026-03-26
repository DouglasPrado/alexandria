---
name: frontend-cicd
description: Preenche a secao de CI/CD e Convencoes (13-cicd-conventions.md) do frontend blueprint a partir do blueprint tecnico.
---

# Frontend Blueprint — CI/CD e Convencoes

Preenche `docs/frontend/{client}/13-cicd-conventions.md` com base no blueprint tecnico e no contexto do projeto.

## Identificacao do Cliente

Este skill aceita um parametro de cliente: `web`, `mobile`, ou `desktop`.
Se o parametro nao for fornecido, pergunte:

> "Para qual cliente voce esta preenchendo este documento? (web / mobile / desktop)"

Caminho de saida: `docs/frontend/{client}/13-cicd-conventions.md`
Leia tambem os documentos compartilhados em `docs/frontend/shared/` para contexto.

## Leitura de Contexto

1. Leia `docs/blueprint/06-system-architecture.md` — pipeline CI/CD e deploy
2. Leia `docs/frontend/{client}/13-cicd-conventions.md` — template a preencher
3. Leia `docs/prd.md` — complemento se necessario

## Analise de Lacunas

A partir do blueprint tecnico, identifique o que esta disponivel para cada subsecao:

- **Pipeline CI/CD**: Quais etapas compoe o pipeline (lint, test, build, deploy) e quais ferramentas sao utilizadas?
- **Ambientes**: Quais ambientes existem (dev, staging, production) e como o deploy e promovido entre eles?
- **Convencoes de Codigo (Arquivos, Componentes, Commits)**: Quais padroes de nomenclatura, organizacao de arquivos e mensagens de commit sao adotados?
- **Ferramentas de Qualidade**: Quais ferramentas de linting, formatting e analise estatica sao configuradas?
- **Documentacao Viva**: Como a documentacao tecnica e mantida atualizada junto com o codigo?

Se houver lacunas criticas que NAO podem ser inferidas do PRD, faca ate 3 perguntas pontuais ao usuario antes de gerar.

> **Versões atualizadas:** Ao referenciar tecnologias específicas com versões, use o MCP context7 para consultar documentação atualizada. Primeiro chame `mcp__context7__resolve-library-id` para obter o ID da biblioteca, depois `mcp__context7__query-docs` para consultar versões e exemplos.

## Contexto por Plataforma

### Se web:

- Deploy via Vercel/Netlify
- PR preview environments automaticos
- CDN e cache invalidation

### Se mobile:

- EAS Build para builds na nuvem
- TestFlight (iOS) e Play Console (Android) para distribuicao
- OTA updates via EAS Update
- Code push para hotfixes

### Se desktop:

- electron-builder ou tauri-action para builds
- Artefatos: DMG (macOS), NSIS (Windows), AppImage (Linux)
- Code signing em CI (certificados Apple e Windows)
- Notarization automatica para macOS

## Geracao

> **Modo de escrita:**
>
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/frontend-increment`.

Preencha `docs/frontend/{client}/13-cicd-conventions.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:

- Informacoes do blueprint tecnico (fonte primaria)
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- do blueprint: 06-system-architecture.md -->`)

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "CI/CD e Convencoes preenchidos para {client}. Rode `/frontend-copies {client}` para preencher os textos e copies de todas as telas."
