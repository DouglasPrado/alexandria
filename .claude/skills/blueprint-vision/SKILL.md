---
name: blueprint-vision
description: Use when filling the vision section (01-vision.md) of the software blueprint. Defines the problem, elevator pitch, objectives, users, value generated, and success metrics from the PRD.
---

# Blueprint — Visao do Sistema

Voce vai preencher a secao de Visao do Sistema do blueprint. Esta secao define o problema, a proposta de valor, os objetivos e as metricas de sucesso.

## Leitura de Contexto

1. Leia `docs/prd.md` — fonte primaria
2. Leia `docs/blueprint/01-vision.md` — template a preencher

## Analise de Lacunas

A partir do PRD, identifique o que esta disponivel para cada subsecao:

- **Problema**: Qual dor o sistema resolve? Quem sofre com isso?
- **Elevator Pitch**: Publico-alvo, necessidade, categoria, beneficio, diferencial
- **Objetivos**: Resultados concretos e mensuraveis
- **Usuarios**: Personas, necessidades, frequencia de uso
- **Valor Gerado**: Valor tangivel para cada grupo
- **Metricas de Sucesso**: Como medir se o sistema esta cumprindo objetivos
- **Nao-objetivos**: O que o sistema deliberadamente NAO faz

Se o PRD nao tiver metricas de sucesso claras ou nao-objetivos definidos, pergunte ao usuario (max 3 perguntas).

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/blueprint-increment`.

Preencha `docs/blueprint/01-vision.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura do template. O Elevator Pitch deve seguir o formato: "Para [publico] que [necessidade], o [sistema] e um [categoria] que [beneficio]. Diferente de [alternativa], nosso sistema [diferencial]."

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Visao preenchida. Rode `/blueprint-principles` para definir os Principios Arquiteturais."
