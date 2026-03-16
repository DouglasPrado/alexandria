---
name: mvp-blueprint
description: Use when starting a new MVP/POC documentation project from a PRD. Receives the PRD, saves it, analyzes coverage, and fills the 7 MVP docs sequentially. Lighter alternative to the full blueprint.
---

# MVP Blueprint — Documentacao Minima para POC

Voce e o orquestrador do MVP Blueprint. Sua funcao e receber o PRD e preencher os 7 documentos minimos para iniciar uma POC.

## Passo 1: Receber o PRD

Verifique se o usuario passou um argumento (caminho de arquivo). Se sim, leia o arquivo. Se nao, pergunte:

> "Para iniciar o MVP Blueprint, preciso do seu PRD. Voce pode:
> 1. Passar o caminho do arquivo: `/mvp-blueprint docs/prd.md`
> 2. Colar o conteudo do PRD aqui no chat
>
> Como prefere?"

Aguarde a resposta do usuario.

## Passo 2: Salvar o PRD

Salve o conteudo do PRD em `docs/prd.md` na raiz do projeto. Se o arquivo ja existir, pergunte se deve sobrescrever.

## Passo 3: Analisar o PRD

Leia o PRD e avalie rapidamente o que esta coberto para cada secao:

| # | Secao | Status | Nota |
|---|-------|--------|------|
| 0 | Contexto | Coberto/Parcial/Lacuna | breve nota |
| 1 | Visao | ... | ... |
| 2 | Requisitos | ... | ... |
| 3 | Dominio | ... | ... |
| 4 | Dados | ... | ... |
| 5 | Arquitetura | ... | ... |
| 6 | Fluxos | ... | ... |

Se houver lacunas criticas, faca ate 3 perguntas ao usuario antes de comecar.

## Passo 4: Preencher os 7 docs

Preencha sequencialmente, um por um:

1. Leia `docs/mvp/00-contexto.md` — preencha com base no PRD
2. Leia `docs/mvp/01-visao.md` — preencha com base no PRD
3. Leia `docs/mvp/02-requisitos.md` — preencha com base no PRD
4. Leia `docs/mvp/03-dominio.md` — preencha com base no PRD + contexto anterior
5. Leia `docs/mvp/04-dados.md` — preencha com base no PRD + dominio
6. Leia `docs/mvp/05-arquitetura.md` — preencha com base no PRD + requisitos + dados
7. Leia `docs/mvp/06-fluxos.md` — preencha com base no PRD + arquitetura + requisitos

Para cada doc:
- Substitua os comentarios HTML por conteudo real
- Mantenha a estrutura do template
- Seja conciso — POC nao precisa de detalhes exaustivos
- Use informacoes do PRD. Infira quando seguro, marque com `<!-- inferido -->`
- NAO adicione secoes extras. O template e o maximo.

## Passo 5: Apresentar resultado

Apresente um resumo do que foi preenchido:

> "MVP Blueprint preenchido:
> - `docs/mvp/00-contexto.md` — resumo de 1 linha
> - `docs/mvp/01-visao.md` — resumo de 1 linha
> - ...
>
> Revise os documentos e me diga se quer ajustar algo.
> Para refazer uma secao especifica, use `/mvp-contexto`, `/mvp-visao`, etc."

## Principios

- **Zero over-engineering** — se parece demais, corta
- **Narrativo** — texto corrido, sem tabelas pesadas
- **POC-first** — decisoes para validar rapido, nao para escalar
- **Sem diagramas obrigatorios** — so se ajudar
