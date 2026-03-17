---
name: frontend-testes
description: Preenche a secao de Estrategia de Testes (09-testes.md) do frontend blueprint a partir do PRD.
---

# Frontend Blueprint — Estrategia de Testes

Preenche `docs/frontend/09-testes.md` com base no PRD e no contexto do projeto.

## Leitura de Contexto

1. Leia `docs/prd.md` — fonte primaria
2. Leia `docs/frontend/09-testes.md` — template a preencher

## Analise de Lacunas

A partir do PRD, identifique o que esta disponivel para cada subsecao:

- **Piramide de Testes**: Qual a proporcao ideal entre testes unitarios, de integracao e e2e para este projeto?
- **Padroes por Tipo de Componente**: Quais padroes de teste se aplicam a cada tipo de componente (paginas, formularios, hooks, servicos)?
- **Cobertura e Metas**: Quais metas de cobertura sao adequadas e quais areas criticas exigem cobertura obrigatoria?
- **Integracao com CI**: Como os testes se integram ao pipeline de CI/CD e quais gates de qualidade existem?

Se houver lacunas criticas que NAO podem ser inferidas do PRD, faca ate 3 perguntas pontuais ao usuario antes de gerar.

> Ao referenciar tecnologias especificas com versoes, consulte https://context7.com/ para garantir versoes atualizadas.

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/frontend-incrementar`.

Preencha `docs/frontend/09-testes.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:
- Informacoes explicitas do PRD
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- inferido do PRD -->`)

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Estrategia de Testes preenchido. Rode `/frontend-performance` para preencher Performance."
