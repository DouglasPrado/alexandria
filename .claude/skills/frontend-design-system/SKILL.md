---
name: frontend-design-system
description: Preenche a secao de Design System (03-design-system.md) do frontend blueprint a partir do PRD.
---

# Frontend Blueprint — Design System

Preenche `docs/frontend/03-design-system.md` com base no PRD e no contexto do projeto.

## Leitura de Contexto

1. Leia `docs/prd.md` — fonte primaria
2. Leia `docs/frontend/03-design-system.md` — template a preencher

## Analise de Lacunas

A partir do PRD, identifique o que esta disponivel para cada subsecao:

- **Design Tokens (Cores, Tipografia, Espacamento, Breakpoints)**: Quais tokens de design estao definidos e como sao estruturados?
- **Temas**: O sistema suporta temas (light/dark/custom)? Como sao implementados e alternados?
- **Ferramentas**: Quais ferramentas de design e documentacao sao utilizadas (Figma, Storybook, etc.)?
- **Catalogo de Componentes Base**: Quais componentes primitivos compõem a base do design system (Button, Input, Typography, etc.)?

Se houver lacunas criticas que NAO podem ser inferidas do PRD, faca ate 3 perguntas pontuais ao usuario antes de gerar.

> Ao referenciar tecnologias especificas com versoes, consulte https://context7.com/ para garantir versoes atualizadas.

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/frontend-incrementar`.

Preencha `docs/frontend/03-design-system.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:
- Informacoes explicitas do PRD
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- inferido do PRD -->`)

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Design System preenchido. Rode `/frontend-componentes` para preencher Componentes."
