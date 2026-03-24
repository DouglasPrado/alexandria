---
name: business-channels
description: Preenche a secao de Canais e Distribuicao (03-channels-distribution.md) do business blueprint a partir do blueprint tecnico.
---

# Business Blueprint — Canais e Distribuicao

Define como o produto chega ate o cliente: canais, PLG, funil de vendas, jornada e parcerias.

## Leitura de Contexto

1. Leia `docs/blueprint/06-system-architecture.md` (interfaces) e `docs/blueprint/17-communication.md` — fontes primarias
2. Leia `docs/prd.md` — fallback/complemento
3. Leia `docs/business/03-channels-distribution.md` — template a preencher

## Analise de Lacunas

A partir do blueprint tecnico, identifique o que esta disponivel para cada subsecao:

- **Canais**: Quais canais de aquisicao e distribuicao serao usados, qual o CAC estimado e CAC Payback de cada um?
- **Product-Led Growth**: O produto possui mecanismo PLG (free trial, freemium, viral loop, self-service onboarding)?
- **Funil de Vendas**: Quais as 4 etapas do funil (Descoberta, Experimentacao, Conversao, Retencao) e taxas esperadas?
- **Jornada do Cliente**: Qual o caminho em 4 etapas (Descoberta, Primeiro uso, Uso recorrente, Expansao/Indicacao) com dores e solucoes?
- **Parcerias Estrategicas**: Quais parcerias podem acelerar aquisicao e distribuicao?

Se houver lacunas criticas que NAO podem ser inferidas do blueprint tecnico, faca ate 3 perguntas pontuais ao usuario antes de gerar.

## Geracao

> **Modo de escrita:**
> - Se o documento contem apenas `{{placeholders}}` (primeira vez): use Write para preencher tudo.
> - Se o documento ja tem conteudo real (reexecucao): use **Edit** para atualizar APENAS o que mudou. Preserve conteudo existente. Insira novo conteudo antes dos marcadores `<!-- APPEND:... -->`.
> - Para adicionar uma feature especifica sem reescrever, prefira `/business-increment`.

Preencha `docs/business/03-channels-distribution.md` substituindo TODOS os `{{placeholders}}`. Mantenha a estrutura. Use:
- Informacoes explicitas do blueprint tecnico
- Respostas do usuario (se houve perguntas)
- Inferencias logicas quando seguro (marque com `<!-- do blueprint: 06-system-architecture.md, 17-communication.md -->`)

**REGRA CRITICA: NUNCA invente numeros.** Valores financeiros, percentuais, CAC, taxas de conversao ou qualquer dado numerico que NAO esteja explicitamente no blueprint tecnico devem ser perguntados ao usuario. Use `{{placeholder}}` para campos numericos sem dados.

## Revisao

Apresente o documento preenchido ao usuario. Aplique ajustes solicitados. Salve o arquivo final.

## Proxima Etapa

> "Canais e Distribuicao preenchidos. Rode `/business-relationships` para definir o Relacionamento com Cliente."
