---
name: business-contexto
description: Preenche a secao de Contexto de Negocio (00-contexto-negocio.md) do business blueprint a partir do PRD.
---

# Business Blueprint — Contexto de Negocio

Define o cenario de negocios onde o produto sera inserido: mercado, concorrencia, tendencias, oportunidade, SWOT e premissas.

## Leitura de Contexto

1. Leia `docs/prd.md` — fonte primaria
2. Leia `docs/business/00-contexto-negocio.md` — template a preencher

## Analise de Lacunas

A partir do PRD, identifique o que esta disponivel para cada subsecao:

- **Estagio do Produto**: Em que fase o produto se encontra e o que ja foi validado?
- **Mercado**: Qual o tamanho do mercado, taxa de crescimento, maturidade e regiao foco?
- **Concorrencia**: Quem sao os concorrentes, como se posicionam e qual o modelo de Pricing de cada um?
- **Tendencias**: Quais tendencias de mercado, tecnologicas ou comportamentais impactam o negocio?
- **Oportunidade**: Qual lacuna de mercado o produto preenche e por que agora e o momento certo?
- **SWOT**: Quais as forcas, fraquezas, oportunidades e ameacas do negocio?
- **Premissas**: Quais suposicoes fundamentais sustentam o negocio e qual o Impacto se estiverem erradas?
- **Regulamentacao SaaS**: Quais regulamentacoes (LGPD, hospedagem de dados, termos de servico) se aplicam?

Se houver lacunas criticas que NAO podem ser inferidas do PRD, faca ate 3 perguntas pontuais ao usuario antes de gerar.

## Geracao

Preencha `docs/business/00-contexto-negocio.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:
- Informacoes explicitas do PRD
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- inferido do PRD -->`)

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Contexto de Negocio preenchido. Rode `/business-proposta-valor` para definir a Proposta de Valor."
