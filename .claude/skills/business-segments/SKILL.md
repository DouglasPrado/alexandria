---
name: business-segments
description: Preenche a secao de Segmentos e Personas (02-segments-personas.md) do business blueprint a partir do blueprint tecnico.
---

# Business Blueprint — Segmentos e Personas

Define quem sao os clientes: segmentos, dimensionamento de mercado, perfil ideal e personas detalhadas.

## Leitura de Contexto

1. Leia `docs/blueprint/00-context.md` — fonte primaria (atores/personas)
2. Leia `docs/prd.md` — fallback/complemento
3. Leia `docs/business/02-segments-personas.md` — template a preencher

## Analise de Lacunas

A partir do blueprint tecnico, identifique o que esta disponivel para cada subsecao:

- **Segmentos**: Quais grupos de clientes o produto atende, qual a Complexidade de Venda e Disposicao a Pagar de cada um?
- **Dimensionamento de Mercado**: Qual o TAM, Mercado Alcancavel e Meta Ano 1? (modelo simplificado de tres niveis)
- **ICP - Ideal Customer Profile**: Qual o perfil do cliente ideal em termos de tamanho, setor, stack tecnico, orcamento e ciclo de venda?
- **Personas**: Quais os perfis detalhados dos usuarios-alvo com demografias, comportamentos, objetivos e frustracoes? (inclui subsecao de Early Adopters)

Se houver lacunas criticas que NAO podem ser inferidas do blueprint tecnico, faca ate 3 perguntas pontuais ao usuario antes de gerar.

## Geracao

> **Modo de escrita:**
>
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/business-increment`.

Preencha `docs/business/02-segments-personas.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:

- Informacoes explicitas do blueprint tecnico
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- do blueprint: 00-context.md -->`)

**REGRA CRITICA: NUNCA invente numeros.** Valores financeiros, percentuais, projecoes, metricas, TAM/SAM/SOM ou qualquer dado numerico que NAO esteja explicitamente no blueprint tecnico devem ser perguntados ao usuario. Use `{{placeholder}}` para campos numericos sem dados.

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Segmentos e Personas preenchidos. Rode `/business-channels` para definir Canais e Distribuicao."
