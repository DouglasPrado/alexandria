---
name: business-segmentos
description: Preenche a secao de Segmentos e Personas (02-segmentos-personas.md) do business blueprint a partir do PRD.
---

# Business Blueprint — Segmentos e Personas

Define quem sao os clientes: segmentos, dimensionamento de mercado, perfil ideal e personas detalhadas.

## Leitura de Contexto

1. Leia `docs/prd.md` — fonte primaria
2. Leia `docs/business/02-segmentos-personas.md` — template a preencher

## Analise de Lacunas

A partir do PRD, identifique o que esta disponivel para cada subsecao:

- **Segmentos**: Quais grupos de clientes o produto atende, qual a Complexidade de Venda e Disposicao a Pagar de cada um?
- **Dimensionamento de Mercado**: Qual o TAM, Mercado Alcancavel e Meta Ano 1? (modelo simplificado de tres niveis)
- **ICP - Ideal Customer Profile**: Qual o perfil do cliente ideal em termos de tamanho, setor, stack tecnico, orcamento e ciclo de venda?
- **Personas**: Quais os perfis detalhados dos usuarios-alvo com demografias, comportamentos, objetivos e frustracoes? (inclui subsecao de Early Adopters)

Se houver lacunas criticas que NAO podem ser inferidas do PRD, faca ate 3 perguntas pontuais ao usuario antes de gerar.

## Geracao

Preencha `docs/business/02-segmentos-personas.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:
- Informacoes explicitas do PRD
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- inferido do PRD -->`)

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Segmentos e Personas preenchidos. Rode `/business-canais` para definir Canais e Distribuicao."
