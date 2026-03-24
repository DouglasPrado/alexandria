---
name: business-operational
description: Preenche a secao de Plano Operacional (09-operational-plan.md) do business blueprint a partir do blueprint tecnico.
---

# Business Blueprint — Plano Operacional

Define os processos core, roadmap de equipe, infraestrutura, disaster recovery, timeline de lancamento, plano de escala, riscos e aspectos legais do negocio.

## Leitura de Contexto

1. Leia `docs/blueprint/06-system-architecture.md` e `docs/blueprint/11-build_plan.md` — fontes primarias
2. Leia `docs/prd.md` — fallback/complemento
3. Leia `docs/business/09-operational-plan.md` — template a preencher

## Analise de Lacunas

A partir do blueprint tecnico, identifique o que esta disponivel para cada subsecao:

- **Processos Core**: quais sao os 3 processos que quebram o negocio se falharem (responsavel, frequencia, ferramenta)?
- **Roadmap de Equipe**: qual a estrutura atual e futura do time, com triggers claros para cada contratacao?
- **Fornecedores**: referencia a `docs/business/06-cost-structure.md` — fornecedores e parceiros estao documentados la
- **Infraestrutura**: quais 4 componentes de infraestrutura digital sao necessarios (hospedagem, monitoramento, analytics, comunicacao)?
- **Disaster Recovery**: quais sao os alvos de RTO e RPO e a estrategia de backup?
- **Timeline**: quais 4 marcos de lancamento com datas, criterios de sucesso e criterios Go/No-Go?
- **Plano de Escala**: o que muda em infraestrutura, equipe, processos e custo/usuario nos patamares de 1K, 10K e 100K usuarios?
- **Riscos e Mitigacoes**: quais sao os principais riscos (mercado, produto, time, financeiro) e como mitiga-los?
- **Aspectos Legais**: checklist minimo (Termos de Uso, Politica de Privacidade, LGPD, regime tributario, contratos) e estrutura juridica?

Se houver lacunas criticas que NAO podem ser inferidas do blueprint tecnico, faca ate 3 perguntas pontuais ao usuario antes de gerar.

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/business-increment`.

Preencha `docs/business/09-operational-plan.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:
- Informacoes explicitas do blueprint tecnico
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- do blueprint: 06-system-architecture.md, 11-build_plan.md -->`)

**REGRA CRITICA: NUNCA invente numeros.** Valores de custos, datas, salarios, percentuais, RTO/RPO ou qualquer dado numerico que NAO esteja explicitamente no blueprint tecnico devem ser perguntados ao usuario. Use `{{placeholder}}` para campos numericos sem dados.

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Plano Operacional preenchido. Todas as secoes do Business Blueprint estao completas! Revise os documentos em `docs/business/` e considere rodar `/blueprint` para complementar com a documentacao tecnica."
