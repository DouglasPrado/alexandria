---
name: codegen
description: Orquestrador mestre de code generation. Le o build plan preenchido, apresenta as entregas ao dev, e guia a execucao na ordem correta. Ponto de entrada para o workflow de geracao de codigo.
---

# Codegen — Orquestrador Mestre

Voce e o orquestrador do workflow de geracao de codigo a partir dos blueprints. Sua funcao e ler o build plan, apresentar as entregas e guiar o dev na execucao ordenada.

## Passo 1: Verificar Pre-requisitos

Verifique se os blueprints estao preenchidos:

1. Leia `docs/blueprint/11-build_plan.md` — se contem apenas `{{placeholders}}`, avise:
   > "O build plan ainda nao foi preenchido. Rode `/blueprint-buildplan` primeiro para definir as entregas do projeto."
   E pare aqui.

2. Verifique se o CLAUDE.md existe no projeto-alvo. Se nao:
   > "CLAUDE.md nao encontrado. Rode `/codegen-claudemd` para gerar o router de contexto."

3. Verifique se `src/contracts/` existe. Se nao:
   > "Contratos compartilhados nao encontrados. Rode `/codegen-contracts` para gerar o scaffold inicial."

## Passo 2: Leitura de Contexto

Leia os seguintes documentos:

1. `docs/blueprint/11-build_plan.md` — entregas, dependencias, criterios de aceite
2. `docs/blueprint/01-vision.md` — visao geral (para nao perder o norte)
3. `docs/blueprint/06-system-architecture.md` — stack e componentes (somente secao de Componentes)

## Passo 3: Apresentar Status do Projeto

Analise o estado atual do projeto:

### 3.1: Identificar Entregas do Build Plan
Extraia todas as entregas com seus objetivos, itens e dependencias.

### 3.2: Verificar Progresso
Para cada entrega, verifique se os itens ja existem no codigo:
- Leia a estrutura de diretorios do projeto
- Verifique se os endpoints/componentes da entrega existem
- Classifique: **Nao iniciada** / **Em progresso** / **Concluida**

### 3.3: Apresentar Dashboard

> "## Status do Projeto
>
> **Visao:** {{elevator pitch de 01-vision}}
> **Stack:** {{resumo de 06-system-architecture}}
>
> | Entrega | Prioridade | Status | Dependencias | Progresso |
> |---------|-----------|--------|--------------|-----------|
> | ENT-001: {{nome}} | {{Must/Should/Could}} | {{status}} | {{deps}} | {{X/Y}} itens |
> | ENT-002: {{nome}} | {{Must/Should/Could}} | {{status}} | {{deps}} | {{X/Y}} itens |
> | ... | ... | ... | ... | ... |
>
> **Proxima entrega recomendada:** {{nome}} ({{prioridade}}, dependencias satisfeitas)
> **Itens pendentes:**
> 1. {{item 1}} — use `/codegen-feature {{nome}}`
> 2. {{item 2}} — use `/codegen-feature {{nome}}`
> 3. {{item 3}} — use `/codegen-feature {{nome}}`
>
> Qual feature deseja implementar?"

## Passo 4: Guiar Execucao

Quando o dev escolher uma feature:

1. Valide que as dependencias estao satisfeitas (entregas dependentes concluidas)
2. Se houver dependencias nao atendidas, avise:
   > "Esta entrega depende de {{dependencia}} que ainda nao esta concluida. Recomendo implementar {{dependencia}} primeiro."
3. Se tudo ok, sugira:
   > "Rode `/codegen-feature {{nome-da-feature}}` para implementar."

## Passo 5: Verificacao de Entregas

Quando todas as entregas Must estiverem concluidas:

> "Todas as entregas Must foram implementadas.
>
> **Recomendacoes:**
> 1. Rode `/codegen-verify` para verificar aderencia ao blueprint
> 2. Execute a suite de testes completa
> 3. Faca uma tag de release
>
> Deseja continuar com as entregas Should?"

## Workflow Completo

```
/codegen-claudemd → Gera CLAUDE.md (uma vez)
       ↓
/codegen-contracts → Scaffold inicial: tipos + setup (uma vez)
       ↓
/codegen → Apresenta entregas (inicio de sessao)
       ↓
/codegen-feature [nome] → Implementa feature (TDD)
       ↓                          ↑
       ↓                    (repete por feature)
       ↓
/codegen-verify → Verifica aderencia (periodico)
```
