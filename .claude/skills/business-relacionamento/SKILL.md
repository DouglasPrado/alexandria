---
name: business-relacionamento
description: Preenche a secao de Relacionamento com Cliente (04-relacionamento.md) do business blueprint a partir do PRD.
---

# Business Blueprint — Relacionamento com Cliente

Define como o produto constroi e mantem relacoes duradouras: ativacao, ciclo de vida, retencao, expansao e recuperacao.

## Leitura de Contexto

1. Leia `docs/prd.md` — fonte primaria
2. Leia `docs/business/04-relacionamento.md` — template a preencher

## Analise de Lacunas

A partir do PRD, identifique o que esta disponivel para cada subsecao:

- **Definicao de Ativacao**: O que significa um usuario "ativo"? Qual o criterio, momento "aha!", prazo e taxa alvo?
- **Ciclo de Vida e Estrategia**: Quais as fases (Aquisicao, Ativacao, Retencao, Receita, Indicacao) e a acao principal em cada uma?
- **Retencao e Sinais de Churn**: Quais sinais indicam risco de churn e quais acoes preventivas e metas de retencao existem?
- **Expansion Revenue**: Qual o path de upgrade, sinais de readiness e meta de receita de expansao?
- **Health Score**: Como medir a saude do cliente (uso, satisfacao, tickets) de forma simples e acionavel?
- **Win-back**: Como re-engajar clientes que cancelaram (periodo de espera, estrategia, oferta)?
- **Suporte**: Quais canais de suporte em 2 tiers (Self-service e Assistido) serao oferecidos?
- **Programa de Indicacao**: Qual a mecanica, incentivo e momento de ativacao do programa?

Se houver lacunas criticas que NAO podem ser inferidas do PRD, faca ate 3 perguntas pontuais ao usuario antes de gerar.

## Geracao

Preencha `docs/business/04-relacionamento.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:
- Informacoes explicitas do PRD
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- inferido do PRD -->`)

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Relacionamento com Cliente preenchido. Rode `/business-receita` para definir o Modelo de Receita."
