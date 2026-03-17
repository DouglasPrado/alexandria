---
name: blueprint-security
description: Use when filling the security section (13-security.md) of the software blueprint. Defines threat model (STRIDE), authentication, authorization, data protection, OWASP checklist, and compliance.
---

# Blueprint — Seguranca

Voce vai preencher a secao de Seguranca do blueprint. Seguranca nao e uma feature — e uma propriedade do sistema. Esta secao documenta como o sistema se protege.

## Leitura de Contexto

1. Leia `docs/prd.md` — fonte primaria
2. Leia `docs/blueprint/05-data_model.md` — dados sensiveis e persistencia
3. Leia `docs/blueprint/06-system_architecture.md` — componentes e comunicacao
4. Leia `docs/blueprint/13-security.md` — template a preencher
5. Leia `docs/diagrams/sequences/auth-flow.mmd` — template de fluxo de autenticacao

## Analise de Lacunas

Identifique a partir do PRD e secoes anteriores:

- **Modelo de ameacas**: STRIDE aplicado aos componentes do sistema
- **Autenticacao**: OAuth, JWT, API keys, SSO, MFA — o PRD pode especificar ou nao
- **Autorizacao**: RBAC, ABAC — roles e permissoes
- **Dados sensiveis**: PII, dados financeiros — classificacao e protecao
- **Compliance**: LGPD, SOC2, PCI-DSS — regulamentacoes aplicaveis

Se o PRD nao especificar metodo de autenticacao ou regulamentacoes aplicaveis, pergunte ao usuario (max 3 perguntas).

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/blueprint-incrementar`.

Preencha `docs/blueprint/13-security.md`:

- **Modelo de ameacas**: tabela STRIDE com ameaca, categoria, impacto e mitigacao
- **Autenticacao**: metodo, provedor, fluxo, politicas de credenciais
- **Autorizacao**: modelo, roles e permissoes, regras de acesso
- **Protecao de dados**: dados em transito (TLS), em repouso (criptografia), PII
- **Checklist OWASP**: status de cada item do Top 10
- **Auditoria e compliance**: regulamentacoes, logging, retencao, resposta a incidentes

## Diagrama

Atualize `docs/diagrams/sequences/auth-flow.mmd` com o fluxo de autenticacao real do sistema.

## Revisao

Apresente ao usuario. Aplique ajustes. Salve os arquivos finais.

## Proxima Etapa

> "Seguranca documentada. Rode `/blueprint-scalability` para definir a Escalabilidade."
