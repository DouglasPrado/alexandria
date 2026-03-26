---
name: business-context
description: Preenche a secao de Contexto de Negocio (00-business-context.md) do business blueprint a partir do blueprint tecnico.
---

# Business Blueprint — Contexto de Negocio

Define o cenario de negocios onde o produto sera inserido: mercado, concorrencia, tendencias, oportunidade, SWOT e premissas.

## Leitura de Contexto

1. Leia `docs/blueprint/00-context.md` e `docs/blueprint/01-vision.md` — fontes primarias
2. Leia `docs/prd.md` — fallback/complemento
3. Leia `docs/business/00-business-context.md` — template a preencher

## Analise de Lacunas

A partir do blueprint tecnico, identifique o que esta disponivel para cada subsecao:

- **Estagio do Produto**: Em que fase o produto se encontra e o que ja foi validado?
- **Mercado**: Qual o tamanho do mercado, taxa de crescimento, maturidade e regiao foco?
- **Concorrencia**: Quem sao os concorrentes, como se posicionam e qual o modelo de Pricing de cada um?
- **Tendencias**: Quais tendencias de mercado, tecnologicas ou comportamentais impactam o negocio?
- **Oportunidade**: Qual lacuna de mercado o produto preenche e por que agora e o momento certo?
- **SWOT**: Quais as forcas, fraquezas, oportunidades e ameacas do negocio?
- **Premissas**: Quais suposicoes fundamentais sustentam o negocio e qual o Impacto se estiverem erradas?
- **Regulamentacao SaaS**: Quais regulamentacoes (LGPD, hospedagem de dados, termos de servico) se aplicam?

Se houver lacunas criticas que NAO podem ser inferidas do blueprint tecnico, faca ate 3 perguntas pontuais ao usuario antes de gerar.

## Geracao

> **Modo de escrita:**
>
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/business-increment`.

Preencha `docs/business/00-business-context.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:

- Informacoes explicitas do blueprint tecnico
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- do blueprint: 00-context.md, 01-vision.md -->`)

**REGRA CRITICA: NUNCA invente numeros.** Valores financeiros, percentuais, projecoes, metricas, tamanhos de mercado ou qualquer dado numerico que NAO esteja explicitamente no blueprint tecnico devem ser perguntados ao usuario. Use `{{placeholder}}` para campos numericos sem dados.

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Contexto de Negocio preenchido. Rode `/business-value-proposition` para definir a Proposta de Valor."
