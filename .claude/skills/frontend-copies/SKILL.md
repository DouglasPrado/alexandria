---
name: frontend-copies
description: Preenche a secao de Copies (14-copies.md) do frontend blueprint a partir do blueprint tecnico.
---

# Frontend Blueprint — Copies

Preenche `docs/frontend/{client}/14-copies.md` com base no blueprint tecnico e no contexto das telas do projeto.

## Identificacao do Cliente

Este skill aceita um parametro de cliente: `web`, `mobile`, ou `desktop`.
Se o parametro nao for fornecido, pergunte:

> "Para qual cliente voce esta preenchendo este documento? (web / mobile / desktop)"

Caminho de saida: `docs/frontend/{client}/14-copies.md`
Leia tambem os documentos compartilhados em `docs/frontend/shared/` para contexto.

## Leitura de Contexto

1. Leia `docs/blueprint/08-use_cases.md` — casos de uso com textos e mensagens
2. Leia `docs/blueprint/17-communication.md` — templates de comunicacao
3. Leia `docs/frontend/{client}/14-copies.md` — template a preencher
4. Leia `docs/frontend/{client}/07-routes.md` — para identificar todas as telas/paginas
5. Leia `docs/frontend/{client}/08-flows.md` — para identificar copies dentro dos fluxos criticos
6. Leia `docs/prd.md` — complemento se necessario

## Analise de Lacunas

A partir do blueprint tecnico e das rotas/fluxos, identifique o que esta disponivel para cada subsecao:

- **Estrategia de Copy**: Idioma padrao, suporte i18n, tom de voz, glossario de termos do produto
- **Copies por Tela**: Textos de cada tela (titulos, labels, placeholders, CTAs, links, empty states)
- **Mensagens de Feedback**: Mensagens de sucesso, erro, validacao, aviso e informacao
- **Componentes Globais**: Copies de navbar, sidebar, footer, modais genericos, empty states
- **Convencoes**: Regras de escrita (capitalizacao, pontuacao, voz ativa/passiva, tamanho maximo)

Se houver lacunas criticas que NAO podem ser inferidas do PRD, faca ate 3 perguntas pontuais ao usuario antes de gerar.

> **Versões atualizadas:** Ao referenciar tecnologias específicas com versões, use o MCP context7 para consultar documentação atualizada. Primeiro chame `mcp__context7__resolve-library-id` para obter o ID da biblioteca, depois `mcp__context7__query-docs` para consultar versões e exemplos.

## Contexto por Plataforma

### Se web:

- Bibliotecas de i18n: i18next, next-intl, react-intl
- SEO copies: meta titles, descriptions, OpenGraph
- Acessibilidade: aria-labels, alt texts, screen reader announcements

### Se mobile:

- Bibliotecas de i18n: expo-localization, react-native-localize
- Copies especificos: push notifications, app store listing, onboarding
- Adaptacao de tamanho: textos mais curtos para telas menores

### Se desktop:

- Mesmas bibliotecas web (i18next, next-intl) + copies especificos
- Strings de menu bar, system tray, dialogs nativos do OS
- Tooltips de acoes do sistema, mensagens de auto-update

## Geracao

> **Modo de escrita:**
>
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar copies de uma feature especifica sem reescrever, prefira `/frontend-increment`.

Preencha `docs/frontend/{client}/14-copies.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:

- Informacoes do blueprint tecnico (use cases, comunicacao)
- Rotas de `07-routes.md` para gerar uma subsecao por tela
- Fluxos de `08-flows.md` para garantir que mensagens de feedback estejam cobertas
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- do blueprint: XX-arquivo.md -->`)

### Checklist de Cobertura

Antes de finalizar, verifique:

- [ ] Toda rota de `07-routes.md` tem uma subsecao em "Copies por Tela"
- [ ] Todo fluxo critico de `08-flows.md` tem suas mensagens de feedback mapeadas
- [ ] Glossario contem todos os termos de dominio do PRD
- [ ] Mensagens de erro cobrem os cenarios de erro dos endpoints da API
- [ ] Empty states estao definidos para todas as listas e telas com dados dinamicos
- [ ] Convencoes de copy estao consistentes com o tom de voz definido

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Copies preenchido para {client}. O frontend blueprint esta completo! Rode `/frontend` para revisar a cobertura geral, ou `/frontend-increment` para adicionar copies de novas features."
