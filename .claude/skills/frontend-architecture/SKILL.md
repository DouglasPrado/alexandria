---
name: frontend-arquitetura
description: Preenche a secao de Arquitetura (01-arquitetura.md) do frontend blueprint a partir do PRD.
---

# Frontend Blueprint — Arquitetura do Frontend

Preenche `docs/frontend/01-arquitetura.md` com base no PRD e no contexto do projeto.

## Leitura de Contexto

1. Leia `docs/prd.md` — fonte primaria
2. Leia `docs/frontend/01-arquitetura.md` — template a preencher

## Analise de Lacunas

A partir do PRD, identifique o que esta disponivel para cada subsecao:

- **Camadas Arquiteturais**: Quais camadas compõem o frontend (presentation, application, domain, infrastructure)?
- **Regras de Dependencia**: Quais regras governam as dependencias entre camadas e modulos?
- **Fronteiras de Dominio**: Como os dominios de negocio se refletem na organizacao do frontend?
- **Diagrama de Arquitetura**: Qual a visao geral da arquitetura e como os componentes se conectam?

Se houver lacunas criticas que NAO podem ser inferidas do PRD, faca ate 3 perguntas pontuais ao usuario antes de gerar.

> Ao referenciar tecnologias especificas com versoes, consulte https://context7.com/ para garantir versoes atualizadas.

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/frontend-incrementar`.

Preencha `docs/frontend/01-arquitetura.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:
- Informacoes explicitas do PRD
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- inferido do PRD -->`)

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Arquitetura preenchida. Rode `/frontend-estrutura` para preencher Estrutura do Projeto."
