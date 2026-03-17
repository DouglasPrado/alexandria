---
name: frontend-componentes
description: Preenche a secao de Componentes (04-componentes.md) do frontend blueprint a partir do PRD.
---

# Frontend Blueprint — Componentes

Preenche `docs/frontend/04-componentes.md` com base no PRD e no contexto do projeto.

## Leitura de Contexto

1. Leia `docs/prd.md` — fonte primaria
2. Leia `docs/frontend/04-componentes.md` — template a preencher

## Analise de Lacunas

A partir do PRD, identifique o que esta disponivel para cada subsecao:

- **Hierarquia de Componentes (Primitive, Composite, Feature)**: Quais niveis de componentes existem e como se relacionam?
- **Template de Documentacao**: Qual o padrao de documentacao para cada componente (props, exemplos, variantes)?
- **Padroes de Composicao**: Quais padroes de composicao sao utilizados (compound components, render props, slots)?
- **Quando Criar vs Reutilizar**: Quais criterios definem se um componente deve ser criado do zero ou reutilizado?

Se houver lacunas criticas que NAO podem ser inferidas do PRD, faca ate 3 perguntas pontuais ao usuario antes de gerar.

> Ao referenciar tecnologias especificas com versoes, consulte https://context7.com/ para garantir versoes atualizadas.

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/frontend-incrementar`.

Preencha `docs/frontend/04-componentes.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:
- Informacoes explicitas do PRD
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- inferido do PRD -->`)

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Componentes preenchido. Rode `/frontend-estado` para preencher Gerenciamento de Estado."
