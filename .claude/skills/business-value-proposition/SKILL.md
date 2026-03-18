---
name: business-proposta-valor
description: Preenche a secao de Proposta de Valor (01-proposta-valor.md) do business blueprint a partir do PRD.
---

# Business Blueprint — Proposta de Valor

Define por que o cliente escolheria este produto: necessidades, proposta de valor, unidade de valor e diferenciais defensaveis.

## Leitura de Contexto

1. Leia `docs/prd.md` — fonte primaria
2. Leia `docs/business/01-proposta-valor.md` — template a preencher

## Analise de Lacunas

A partir do PRD, identifique o que esta disponivel para cada subsecao:

- **Necessidades do Cliente**: Quais Jobs, Dores, Ganhos e Evidencias existem? (tabela unificada Job/Dor/Ganho/Evidencia)
- **Proposta de Valor**: Qual a declaracao de valor e o mapeamento Necessidade-Solucao? (inclui exemplos SaaS de referencia)
- **Unidade de Valor**: O que exatamente o cliente paga e como a cobranca se alinha ao valor percebido?
- **Diferencial e Defensabilidade**: O que diferencia o produto e o que impede concorrentes de copiar? (tipo, copiabilidade, como fortalecer)

Se houver lacunas criticas que NAO podem ser inferidas do PRD, faca ate 3 perguntas pontuais ao usuario antes de gerar.

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/business-incrementar`.

Preencha `docs/business/01-proposta-valor.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:
- Informacoes explicitas do PRD
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- inferido do PRD -->`)

**REGRA CRITICA: NUNCA invente numeros.** Valores financeiros, percentuais, projecoes, metricas ou qualquer dado numerico que NAO esteja explicitamente no PRD devem ser perguntados ao usuario. Use `{{placeholder}}` para campos numericos sem dados.

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Proposta de Valor preenchida. Rode `/business-segmentos` para definir Segmentos e Personas."
