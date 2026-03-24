---
name: frontend-security
description: Preenche a secao de Seguranca (11-security.md) do frontend blueprint a partir do blueprint tecnico.
---

# Frontend Blueprint — Seguranca

Preenche `docs/frontend/11-security.md` com base no blueprint tecnico e no contexto do projeto.

## Leitura de Contexto

1. Leia `docs/blueprint/13-security.md` — STRIDE, autenticacao, autorizacao, OWASP
2. Leia `docs/frontend/11-security.md` — template a preencher
3. Leia `docs/prd.md` — complemento se necessario

## Analise de Lacunas

A partir do blueprint tecnico, identifique o que esta disponivel para cada subsecao:

- **Modelo de Autenticacao**: Qual o mecanismo de autenticacao (JWT, session, OAuth) e como tokens sao gerenciados no frontend?
- **Protecao de Rotas**: Quais rotas exigem autenticacao ou autorizacao e como o acesso e controlado no client-side?
- **Protecao contra Vulnerabilidades**: Quais medidas existem contra XSS, CSRF, injection e outras vulnerabilidades comuns?
- **Content Security Policy**: Qual a politica CSP adotada e como headers de seguranca sao configurados?
- **Checklist de Seguranca**: Quais verificacoes de seguranca devem ser feitas antes de cada release?

Se houver lacunas criticas que NAO podem ser inferidas do PRD, faca ate 3 perguntas pontuais ao usuario antes de gerar.

> **Versões atualizadas:** Ao referenciar tecnologias específicas com versões, use o MCP context7 para consultar documentação atualizada. Primeiro chame `mcp__context7__resolve-library-id` para obter o ID da biblioteca, depois `mcp__context7__query-docs` para consultar versões e exemplos.

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/frontend-increment`.

Preencha `docs/frontend/11-security.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:
- Informacoes do blueprint tecnico (fonte primaria)
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- do blueprint: 13-security.md -->`)

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Seguranca preenchido. Rode `/frontend-observability` para preencher Observabilidade."
