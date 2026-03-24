---
name: business-marketing
description: Preenche a secao de Estrategia de Marketing (08-marketing-strategy.md) do business blueprint a partir do blueprint tecnico.
---

# Business Blueprint — Estrategia de Marketing

Define o posicionamento, go-to-market, validacao de ICP, canais de marketing, growth loops, comunicacao de pricing, estrategia de conteudo e orcamento de marketing do negocio.

## Leitura de Contexto

1. Leia `docs/blueprint/01-vision.md` e `docs/blueprint/00-context.md` — fontes primarias
2. Leia `docs/prd.md` — fallback/complemento
3. Leia `docs/business/08-marketing-strategy.md` — template a preencher

## Analise de Lacunas

A partir do blueprint tecnico, identifique o que esta disponivel para cada subsecao:

- **Posicionamento**: como o produto se diferencia? Qual dos 3 frameworks se aplica (Anti-[Concorrente], Primeiro a [fazer X], Feito exclusivamente para [nicho])?
- **Go-to-Market**: qual a estrategia de entrada no mercado e como conquistar os primeiros 10-50 clientes? (inclui lancamento + primeiros clientes)
- **Validacao de ICP**: qual o ICP atual e quais sao os triggers de pivot (CAC, churn, NPS)?
- **Canais de Marketing**: quais 3 canais serao usados para aquisicao, com orcamento e ROI esperado?
- **Growth Loops**: qual o loop primario e secundario de crescimento auto-sustentavel?
- **Comunicacao de Pricing**: como apresentar precos para maximizar conversao (plano destaque, ancoragem, trial)?
- **Estrategia de Conteudo**: qual o formato principal de conteudo, frequencia, canal e pilares tematicos?
- **Orcamento de Marketing**: qual o budget total e distribuicao entre atividades? (inclui orientacao pre-receita)

Se houver lacunas criticas que NAO podem ser inferidas do blueprint tecnico, faca ate 3 perguntas pontuais ao usuario antes de gerar.

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/business-increment`.

Preencha `docs/business/08-marketing-strategy.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:
- Informacoes explicitas do blueprint tecnico
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- do blueprint: 01-vision.md, 00-context.md -->`)

**REGRA CRITICA: NUNCA invente numeros.** Valores de orcamento, ROI, percentuais, CAC, taxas ou qualquer dado numerico que NAO esteja explicitamente no blueprint tecnico devem ser perguntados ao usuario. Use `{{placeholder}}` para campos numericos sem dados.

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Estrategia de Marketing preenchida. Rode `/business-operational` para definir o Plano Operacional."
