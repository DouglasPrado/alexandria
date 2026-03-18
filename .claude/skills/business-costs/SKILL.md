---
name: business-custos
description: Use when filling the cost structure section (06-estrutura-custos.md) of the business blueprint. Defines fixed/variable costs, COGS vs OpEx, key resources, key activities, vendors, scale curve, burn rate, break-even, runway, and sensitivity analysis.
---

# Business Blueprint — Estrutura de Custos

Define os custos fixos e variaveis, separacao COGS vs OpEx, recursos criticos, atividades-chave, fornecedores, curva de escala, burn rate, break-even, runway e analise de sensibilidade do negocio.

## Leitura de Contexto

1. Leia `docs/prd.md` — fonte primaria
2. Leia `docs/business/06-estrutura-custos.md` — template a preencher

## Analise de Lacunas

A partir do PRD, identifique o que esta disponivel para cada subsecao:

- **Custos Fixos**: quais sao os custos recorrentes independentes do volume (salarios, infraestrutura, licencas, administrativo)?
- **Custos Variaveis**: quais custos escalam com o uso ou numero de clientes (hosting, APIs, suporte, comissoes)?
- **COGS vs OpEx**: quais custos sao de entrega do produto (COGS) vs operacionais (OpEx)? Qual a margem bruta resultante?
- **Recursos Criticos**: quais recursos sao essenciais para operar (pessoas, tecnologia, IP, infraestrutura)?
- **Atividades-Chave**: quais sao as top 3 atividades que param o negocio se nao forem executadas?
- **Fornecedores e Parceiros**: quais fornecedores sao essenciais, qual a criticidade e o custo de troca de cada um?
- **Curva de Escala**: como os custos se comportam a medida que a base cresce (1K, 10K, 100K usuarios)?
- **Burn Rate**: qual o gasto mensal bruto e liquido na fase atual?
- **Break-even**: em que ponto a receita cobre os custos (MRR, numero de clientes, previsao)?
- **Runway**: com o capital disponivel e o burn rate, por quanto tempo a operacao se sustenta?
- **Analise de Sensibilidade**: o que acontece com o runway nos cenarios otimista, base e pessimista?

Se houver lacunas criticas que NAO podem ser inferidas do PRD, faca ate 3 perguntas pontuais ao usuario antes de gerar.

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/business-incrementar`.

Preencha `docs/business/06-estrutura-custos.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:
- Informacoes explicitas do PRD
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- inferido do PRD -->`)

**REGRA CRITICA: NUNCA invente numeros.** Valores de custos, burn rate, break-even, runway, salarios, percentuais ou qualquer dado numerico que NAO esteja explicitamente no PRD devem ser perguntados ao usuario. Use `{{placeholder}}` para campos numericos sem dados.

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Estrutura de Custos preenchida. Rode `/business-metricas` para definir Metricas e KPIs."
