---
name: blueprint-architecture
description: Use when filling the system architecture section (06-system_architecture.md) of the software blueprint. Defines components, communication protocols, infrastructure decisions, and deployment topology.
---

# Blueprint — Arquitetura do Sistema

Voce vai preencher a secao de Arquitetura do Sistema do blueprint. Esta secao descreve os blocos principais do sistema, como eles se comunicam e onde sao implantados.

## Leitura de Contexto

1. Leia `docs/prd.md` — fonte primaria
2. Leia `docs/blueprint/02-architecture_principles.md` — principios que guiam as decisoes
3. Leia `docs/blueprint/04-domain_model.md` — entidades e bounded contexts
4. Leia `docs/blueprint/05-data_model.md` — tecnologias de persistencia
5. Leia `docs/blueprint/06-system_architecture.md` — template a preencher

## Pesquisa de Tecnologias Atualizadas

Antes de preencher a arquitetura, pesquise as versoes e melhores praticas atuais de cada tecnologia da stack no https://context7.com/. Para cada tecnologia principal mencionada no PRD ou nas secoes anteriores:

1. Use `WebFetch` para consultar `https://context7.com/` buscando a documentacao atualizada de cada tecnologia (ex: Rust, Next.js, PostgreSQL, Redis, FFmpeg, Docker, etc.)
2. Verifique: versao estavel mais recente, breaking changes relevantes, melhores praticas atuais, features novas que impactam a arquitetura
3. Atualize as decisoes tecnologicas com base nas informacoes encontradas (ex: versao especifica, APIs novas, padroes recomendados)

Documente as versoes confirmadas e eventuais mudancas em relacao ao que o PRD especificava.

## Analise de Lacunas

Identifique a partir do PRD e secoes anteriores:

- **Componentes**: quais servicos, apps, workers o sistema precisa
- **Comunicacao**: REST, gRPC, eventos, filas — sincrono vs assincrono
- **Infraestrutura**: cloud provider, orquestracao, CI/CD, monitoramento
- **Ambientes**: dev, staging, prod — URLs e configuracoes

Se o PRD nao especificar stack tecnologico ou infraestrutura, proponha opcoes e pergunte ao usuario (max 3 perguntas).

## Geracao

Preencha `docs/blueprint/06-system_architecture.md`:

- **Componentes**: para cada um, preencha nome, responsabilidade, tecnologia e interface
- **Comunicacao**: tabela com origem, destino, protocolo, tipo (sync/async) e descricao
- **Infraestrutura**: tabela com ambientes, decisoes de infra (cloud, orquestracao, CI/CD, banco, cache, mensageria)

## Diagramas

Atualize estes diagramas Mermaid:

- `docs/diagrams/containers/container-diagram.mmd` — containers (apps, APIs, bancos, filas)
- `docs/diagrams/components/api-components.mmd` — componentes internos do container principal
- `docs/diagrams/deployment/production.mmd` — topologia de deploy em producao

## Revisao

Apresente ao usuario. Aplique ajustes. Salve os arquivos finais.

## Proxima Etapa

> "Arquitetura definida. Rode `/blueprint-flows` para documentar os Fluxos Criticos."
