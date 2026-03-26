---
name: business-increment
description: Incrementa o business blueprint com nova informacao ou correcao sem sobrescrever conteudo existente. Usa Edit (nao Write) para preservar tudo.
---

# Business Blueprint — Incrementar ou Corrigir

Atualiza os documentos existentes do business blueprint de forma incremental,
preservando todo o conteudo ja preenchido. Use este skill para:

- **Adicionar** novo mercado, novo segmento, nova fonte de receita, etc.
- **Corrigir** informacoes existentes (metricas erradas, precos desatualizados, personas incorretas, etc.)
- **Atualizar** dados de mercado, concorrencia, custos, projecoes, etc.
- **Remover** segmento descontinuado, canal abandonado, metrica obsoleta, etc.

## Passo 1: Receber a Alteracao

Pergunte ao usuario:

> "O que precisa ser atualizado no business blueprint?
>
> Exemplos:
>
> - **Nova informacao:** 'Novo segmento B2B Enterprise identificado'
> - **Correcao:** 'O custo de CAC estava R$150, correto e R$210'
> - **Atualizacao:** 'Novo concorrente entrou no mercado: CompetidorX'
> - **Remocao:** 'Canal de distribuicao via marketplace foi descontinuado'
>
> Descreva a alteracao."

Aguarde a resposta antes de prosseguir.

## Passo 2: Leitura do Estado Atual

Leia TODOS os documentos existentes em `docs/business/`:

1. `docs/business/00-business-context.md`
2. `docs/business/01-value-proposition.md`
3. `docs/business/02-segments-personas.md`
4. `docs/business/03-channels-distribution.md`
5. `docs/business/04-relationships.md`
6. `docs/business/05-revenue-model.md`
7. `docs/business/06-cost-structure.md`
8. `docs/business/07-metrics-kpis.md`
9. `docs/business/08-marketing-strategy.md`
10. `docs/business/09-operational-plan.md`

Leia tambem os arquivos relevantes de `docs/blueprint/` para contexto tecnico, e `docs/prd.md` como fallback/complemento.

> **Versoes atualizadas:** Ao referenciar tecnologias, ferramentas ou plataformas especificas com versoes, use o MCP context7 para consultar documentacao atualizada. Primeiro chame `mcp__context7__resolve-library-id` para obter o ID da biblioteca, depois `mcp__context7__query-docs` para consultar versoes e exemplos.

## Passo 3: Classificar Tipo de Alteracao

Identifique o tipo de alteracao:

- **Adicao** — novo mercado, novo segmento, nova persona, nova fonte de receita, novo canal
- **Correcao** — metrica errada, preco desatualizado, persona incorreta, dado errado
- **Atualizacao** — novo concorrente, mercado atualizado, custo revisado, projecao ajustada
- **Remocao** — segmento descontinuado, canal abandonado, metrica obsoleta

## Passo 4: Analise de Impacto

Identifique quais documentos sao impactados. Use a tabela de referencia abaixo para orientar a analise:

| Doc                  | Quando impactado                                |
| -------------------- | ----------------------------------------------- |
| 00-contexto          | Novo mercado, novo concorrente                  |
| 01-value-proposition | Nova necessidade do cliente, novo diferencial   |
| 02-segmentos         | Novo segmento, nova persona                     |
| 03-canais            | Novo canal, nova parceria                       |
| 04-relationships     | Nova estrategia de retencao, novo churn signal  |
| 05-receita           | Nova fonte de receita, novo plano de preco      |
| 06-custos            | Novo custo, novo fornecedor                     |
| 07-metrics           | Nova metrica, novo milestone                    |
| 08-marketing         | Novo canal de marketing, novo growth loop       |
| 09-operacional       | Novo processo, nova contratacao, novo milestone |

Apresente ao usuario:

| Doc                  | Impactado?  | Tipo                                    | O que fazer   |
| -------------------- | ----------- | --------------------------------------- | ------------- |
| 00-contexto          | {{Sim/Nao}} | {{Adicao/Correcao/Atualizacao/Remocao}} | {{Descricao}} |
| 01-value-proposition | {{Sim/Nao}} | {{Tipo}}                                | {{Descricao}} |
| 02-segmentos         | {{Sim/Nao}} | {{Tipo}}                                | {{Descricao}} |
| 03-canais            | {{Sim/Nao}} | {{Tipo}}                                | {{Descricao}} |
| 04-relationships     | {{Sim/Nao}} | {{Tipo}}                                | {{Descricao}} |
| 05-receita           | {{Sim/Nao}} | {{Tipo}}                                | {{Descricao}} |
| 06-custos            | {{Sim/Nao}} | {{Tipo}}                                | {{Descricao}} |
| 07-metrics           | {{Sim/Nao}} | {{Tipo}}                                | {{Descricao}} |
| 08-marketing         | {{Sim/Nao}} | {{Tipo}}                                | {{Descricao}} |
| 09-operacional       | {{Sim/Nao}} | {{Tipo}}                                | {{Descricao}} |

> Confirme com o usuario antes de prosseguir: "Estes sao os documentos que serao atualizados. Deseja ajustar algo?"

## Passo 5: Aplicar Alteracoes

**Use SEMPRE Edit tool, NUNCA Write tool** — Write sobrescreve o arquivo inteiro.

Para CADA documento marcado como impactado, aplique conforme o tipo:

### Para ADICAO (nova informacao):

1. **Leia** o documento atual (Read tool)
2. **Localize** os marcadores `<!-- APPEND:section-id -->`
3. **Gere** APENAS o conteudo novo (delta)
4. **Insira** ANTES do marcador usando Edit tool
5. **Marque** com: `<!-- adicionado: descricao-breve -->`

Marcadores disponiveis:

- `<!-- APPEND:mercado -->` — dados de mercado
- `<!-- APPEND:concorrencia -->` — concorrentes
- `<!-- APPEND:premissas -->` — premissas do negocio
- `<!-- APPEND:necessidades -->` — necessidades dos clientes
- `<!-- APPEND:diferenciais -->` — diferenciais competitivos
- `<!-- APPEND:segmentos -->` — segmentos de mercado
- `<!-- APPEND:personas -->` — personas
- `<!-- APPEND:canais -->` — canais de distribuicao
- `<!-- APPEND:rotas-funil -->` — rotas de funil
- `<!-- APPEND:parcerias -->` — parcerias estrategicas
- `<!-- APPEND:ciclo-vida -->` — ciclo de vida do cliente
- `<!-- APPEND:churn-signals -->` — sinais de churn
- `<!-- APPEND:expansion -->` — estrategias de expansao
- `<!-- APPEND:fontes-receita -->` — fontes de receita
- `<!-- APPEND:precos -->` — planos de preco
- `<!-- APPEND:projecoes -->` — projecoes financeiras
- `<!-- APPEND:custos-fixos -->` — custos fixos
- `<!-- APPEND:custos-variaveis -->` — custos variaveis
- `<!-- APPEND:fornecedores -->` — fornecedores
- `<!-- APPEND:aarrr -->` — metricas AARRR
- `<!-- APPEND:milestones -->` — milestones
- `<!-- APPEND:dashboard -->` — dashboard de KPIs
- `<!-- APPEND:canais-marketing -->` — canais de marketing
- `<!-- APPEND:growth-loops -->` — growth loops
- `<!-- APPEND:processos -->` — processos operacionais
- `<!-- APPEND:equipe -->` — equipe e contratacoes
- `<!-- APPEND:timeline -->` — timeline operacional

### Para CORRECAO (dado errado, metrica desatualizada, etc.):

1. **Leia** o documento atual (Read tool)
2. **Localize** a linha/celula com o dado incorreto
3. **Use Edit** com old_string = valor antigo, new_string = valor correto
4. **Marque** com: `<!-- corrigido: descricao-breve -->`
5. **NAO toque** em nenhuma outra linha

### Para ATUALIZACAO (concorrente novo, custo revisado, etc.):

1. **Leia** o documento atual (Read tool)
2. **Localize** TODAS as ocorrencias do valor antigo (pode estar em multiplos docs)
3. **Use Edit** com replace_all se o valor aparece multiplas vezes no mesmo arquivo
4. **Marque** com: `<!-- atualizado: descricao-breve -->`

### Para REMOCAO (segmento descontinuado, canal abandonado, etc.):

1. **Leia** o documento atual (Read tool)
2. **Localize** as linhas do item removido
3. **Use Edit** para substituir o conteudo por: `~~conteudo original~~ <!-- removido: motivo -->`
4. **NAO delete** a linha — marque como removida com strikethrough para manter historico
5. Se a remocao for definitiva e o usuario confirmar, ai sim delete a linha

### Regras criticas — NUNCA violar:

- **Tabelas (adicao)**: novas linhas ANTES do marcador `<!-- APPEND:... -->`
- **Tabelas (correcao)**: Edit na celula especifica, sem tocar outras linhas
- **Secoes (adicao)**: novo bloco `### Secao` com numeracao sequencial
- **Secoes (correcao)**: Edit nos itens especificos da secao
- **NUNCA altere** linhas nao relacionadas a alteracao solicitada
- **Alteracoes minimas**: mude o minimo necessario para aplicar a correcao

### Exemplo de insercao em tabela:

**Antes:**

```
| Startup SaaS | Ferramenta de gestao | R$49/mes | UX simples |
<!-- APPEND:concorrencia -->
```

**Edit:** old_string = `<!-- APPEND:concorrencia -->`, new_string =

```
| CompetidorX | Plataforma all-in-one | R$99/mes | Integracao nativa com ERPs |
<!-- APPEND:concorrencia -->
```

**Resultado:**

```
| Startup SaaS | Ferramenta de gestao | R$49/mes | UX simples |
| CompetidorX | Plataforma all-in-one | R$99/mes | Integracao nativa com ERPs |
<!-- APPEND:concorrencia -->
```

### Exemplo de insercao de persona:

**Antes:**

```
### Persona 1: Maria — Gerente de Operacoes
(conteudo existente)

<!-- APPEND:personas -->
```

**Edit:** old_string = `<!-- APPEND:personas -->`, new_string =

```
---

### Persona 3: Roberto — CTO Enterprise
<!-- adicionado: segmento-enterprise -->

> Decisor tecnico em empresas com +500 funcionarios.

**Perfil:**
- Idade: 38-50
- Cargo: CTO / VP Engineering
- Empresa: 500-5000 funcionarios
- Dor principal: Integracao com sistemas legados

**Comportamento:**
- Avalia ferramentas por compliance e seguranca primeiro
- Ciclo de decisao: 3-6 meses
- Influenciado por analyst reports (Gartner, Forrester)

<!-- APPEND:personas -->
```

## Passo 6: Revisao

Apresente ao usuario um resumo do que foi alterado:

> "Informacao **{{nome}}** documentada. Alteracoes em **{{N}}** documentos:
>
> | Doc          | Alteracao           |
> | ------------ | ------------------- |
> | 00-contexto  | +{{X}} concorrentes |
> | 02-segmentos | +{{Y}} personas     |
> | ...          | ...                 |
>
> Revise os documentos atualizados e solicite ajustes se necessario."

## Passo 7: Proximo

> "Alteracao documentada. Para adicionar outra informacao de negocio, rode
> `/business-increment` novamente.
> Para revisar o blueprint completo de negocio, rode `/business`."
