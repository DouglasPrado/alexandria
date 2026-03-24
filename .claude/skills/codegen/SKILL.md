---
name: codegen
description: Orquestrador mestre de code generation. Le o build plan preenchido, apresenta as fases ao dev, e guia a execucao na ordem correta. Ponto de entrada para o workflow de geracao de codigo.
---

# Codegen — Orquestrador Mestre

Voce e o orquestrador do workflow de geracao de codigo a partir dos blueprints. Sua funcao e ler o build plan, apresentar as fases e guiar o dev na execucao ordenada.

## Passo 1: Verificar Pre-requisitos

Verifique se os blueprints estao preenchidos:

1. Leia `docs/blueprint/11-build_plan.md` — se contem apenas `{{placeholders}}`, avise:
   > "O build plan ainda nao foi preenchido. Rode `/blueprint-buildplan` primeiro para definir as fases do projeto."
   E pare aqui.

2. Verifique se o CLAUDE.md existe no projeto-alvo. Se nao:
   > "CLAUDE.md nao encontrado. Rode `/codegen-claudemd` para gerar o router de contexto."

3. Verifique se `src/contracts/` existe. Se nao:
   > "Contratos compartilhados nao encontrados. Rode `/codegen-contracts` para gerar o scaffold (Phase 0)."

## Passo 2: Leitura de Contexto

Leia os seguintes documentos:

1. `docs/blueprint/11-build_plan.md` — fases, entregas, dependencias, criterios de aceite
2. `docs/blueprint/01-vision.md` — visao geral (para nao perder o norte)
3. `docs/blueprint/06-system-architecture.md` — stack e componentes (somente secao de Componentes)

## Passo 3: Apresentar Status do Projeto

Analise o estado atual do projeto:

### 3.1: Identificar Fases do Build Plan
Extraia todas as fases com seus objetivos, entregas e dependencias.

### 3.2: Verificar Progresso
Para cada fase, verifique se as entregas ja existem no codigo:
- Leia a estrutura de diretorios do projeto
- Verifique se os endpoints/componentes da entrega existem
- Classifique: **Nao iniciada** / **Em progresso** / **Concluida**

### 3.3: Apresentar Dashboard

> "## Status do Projeto
>
> **Visao:** {{elevator pitch de 01-vision}}
> **Stack:** {{resumo de 06-system-architecture}}
>
> | Fase | Objetivo | Status | Entregas |
> |------|---------|--------|----------|
> | Fase 1: {{nome}} | {{objetivo}} | {{status}} | {{X/Y}} entregas |
> | Fase 2: {{nome}} | {{objetivo}} | {{status}} | {{X/Y}} entregas |
> | ... | ... | ... | ... |
>
> **Proxima fase recomendada:** Fase {{N}} — {{nome}}
> **Entregas pendentes nesta fase:**
> 1. {{entrega 1}} — use `/codegen-feature {{nome}}`
> 2. {{entrega 2}} — use `/codegen-feature {{nome}}`
> 3. {{entrega 3}} — use `/codegen-feature {{nome}}`
>
> Qual feature deseja implementar?"

## Passo 4: Guiar Execucao

Quando o dev escolher uma feature:

1. Valide que as dependencias estao satisfeitas (fases anteriores concluidas)
2. Se houver dependencias nao atendidas, avise:
   > "Esta entrega depende de {{dependencia}} que ainda nao esta concluida. Recomendo implementar {{dependencia}} primeiro."
3. Se tudo ok, sugira:
   > "Rode `/codegen-feature {{nome-da-feature}}` para implementar."

## Passo 5: Verificacao de Fase

Quando todas as entregas de uma fase estiverem concluidas:

> "Todas as entregas da Fase {{N}} foram implementadas.
>
> **Recomendacoes:**
> 1. Rode `/codegen-verify` para verificar aderencia ao blueprint
> 2. Execute a suite de testes completa
> 3. Faca uma tag de release: `git tag v{{N}}.0.0`
>
> Pronto para a Fase {{N+1}}?"

## Workflow Completo

```
/codegen-claudemd → Gera CLAUDE.md (uma vez)
       ↓
/codegen-contracts → Phase 0: scaffold + tipos (uma vez)
       ↓
/codegen → Apresenta fases (inicio de sessao)
       ↓
/codegen-feature [nome] → Implementa feature (TDD)
       ↓                          ↑
       ↓                    (repete por feature)
       ↓
/codegen-verify → Verifica aderencia (a cada fase)
```
