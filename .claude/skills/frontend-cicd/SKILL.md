---
name: frontend-cicd
description: Preenche a secao de CI/CD e Convencoes (13-cicd-convencoes.md) do frontend blueprint a partir do PRD.
---

# Frontend Blueprint — CI/CD e Convencoes

Preenche `docs/frontend/13-cicd-convencoes.md` com base no PRD e no contexto do projeto.

## Leitura de Contexto

1. Leia `docs/prd.md` — fonte primaria
2. Leia `docs/frontend/13-cicd-convencoes.md` — template a preencher

## Analise de Lacunas

A partir do PRD, identifique o que esta disponivel para cada subsecao:

- **Pipeline CI/CD**: Quais etapas compoe o pipeline (lint, test, build, deploy) e quais ferramentas sao utilizadas?
- **Ambientes**: Quais ambientes existem (dev, staging, production) e como o deploy e promovido entre eles?
- **Convencoes de Codigo (Arquivos, Componentes, Commits)**: Quais padroes de nomenclatura, organizacao de arquivos e mensagens de commit sao adotados?
- **Ferramentas de Qualidade**: Quais ferramentas de linting, formatting e analise estatica sao configuradas?
- **Documentacao Viva**: Como a documentacao tecnica e mantida atualizada junto com o codigo?

Se houver lacunas criticas que NAO podem ser inferidas do PRD, faca ate 3 perguntas pontuais ao usuario antes de gerar.

> Ao referenciar tecnologias especificas com versoes, consulte https://context7.com/ para garantir versoes atualizadas.

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/frontend-incrementar`.

Preencha `docs/frontend/13-cicd-convencoes.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:
- Informacoes explicitas do PRD
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- inferido do PRD -->`)

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "CI/CD e Convencoes preenchido. Rode `/frontend-copies` para preencher os textos e copies de todas as telas."
