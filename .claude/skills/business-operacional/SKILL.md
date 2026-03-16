---
name: business-operacional
description: Use when filling the operational plan section (09-plano-operacional.md) of the business blueprint. Defines core processes, team roadmap, infrastructure, disaster recovery, timeline, scale plan, risks, and legal aspects.
---

# Business Blueprint — Plano Operacional

Define os processos core, roadmap de equipe, infraestrutura, disaster recovery, timeline de lancamento, plano de escala, riscos e aspectos legais do negocio.

## Leitura de Contexto

1. Leia `docs/prd.md` — fonte primaria
2. Leia `docs/business/09-plano-operacional.md` — template a preencher

## Analise de Lacunas

A partir do PRD, identifique o que esta disponivel para cada subsecao:

- **Processos Core**: quais sao os 3 processos que quebram o negocio se falharem (responsavel, frequencia, ferramenta)?
- **Roadmap de Equipe**: qual a estrutura atual e futura do time, com triggers claros para cada contratacao?
- **Fornecedores**: referencia a `docs/business/06-estrutura-custos.md` — fornecedores e parceiros estao documentados la
- **Infraestrutura**: quais 4 componentes de infraestrutura digital sao necessarios (hospedagem, monitoramento, analytics, comunicacao)?
- **Disaster Recovery**: quais sao os alvos de RTO e RPO e a estrategia de backup?
- **Timeline**: quais 4 marcos de lancamento com datas, criterios de sucesso e criterios Go/No-Go?
- **Plano de Escala**: o que muda em infraestrutura, equipe, processos e custo/usuario nos patamares de 1K, 10K e 100K usuarios?
- **Riscos e Mitigacoes**: quais sao os principais riscos (mercado, produto, time, financeiro) e como mitiga-los?
- **Aspectos Legais**: checklist minimo (Termos de Uso, Politica de Privacidade, LGPD, regime tributario, contratos) e estrutura juridica?

Se houver lacunas criticas que NAO podem ser inferidas do PRD, faca ate 3 perguntas pontuais ao usuario antes de gerar.

## Geracao

Preencha `docs/business/09-plano-operacional.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:
- Informacoes explicitas do PRD
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- inferido do PRD -->`)

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Plano Operacional preenchido. Todas as secoes do Business Blueprint estao completas! Revise os documentos em `docs/business/` e considere rodar `/blueprint` para complementar com a documentacao tecnica."
