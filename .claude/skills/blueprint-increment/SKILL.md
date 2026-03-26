---
name: blueprint-increment
description: Incrementa o blueprint tecnico com nova funcionalidade ou correcao sem sobrescrever conteudo existente. Usa Edit (nao Write) para preservar tudo.
---

# Blueprint Tecnico — Incrementar ou Corrigir

Atualiza os documentos existentes do blueprint tecnico de forma incremental,
preservando todo o conteudo ja preenchido. Use este skill para:

- **Adicionar** uma nova feature (novos requisitos, entidades, fluxos, casos de uso, etc.)
- **Corrigir** informacoes existentes (entidades erradas, fluxos atualizados, requisitos corrigidos, etc.)
- **Atualizar** versoes de tecnologias, nomes de componentes, endpoints, ou qualquer dado que mudou
- **Remover** features removidas do escopo, entidades depreciadas, fluxos obsoletos

## Passo 1: Receber a Alteracao

Pergunte ao usuario:

> "O que precisa ser atualizado no blueprint tecnico?
>
> Exemplos:
>
> - **Nova feature:** 'Sistema de notificacoes push'
> - **Correcao:** 'A entidade Order agora tem campo `status` enum em vez de string'
> - **Atualizacao:** 'Endpoint /api/users foi renomeado para /api/accounts'
> - **Remocao:** 'Modulo de relatorios foi removido do escopo'
>
> Descreva a alteracao."

Aguarde a resposta antes de prosseguir.

## Passo 2: Leitura do Estado Atual

Leia TODOS os documentos existentes em `docs/blueprint/`:

1. `docs/blueprint/00-context.md`
2. `docs/blueprint/01-vision.md`
3. `docs/blueprint/02-architecture_principles.md`
4. `docs/blueprint/03-requirements.md`
5. `docs/blueprint/04-domain-model.md`
6. `docs/blueprint/05-data-model.md`
7. `docs/blueprint/06-system-architecture.md`
8. `docs/blueprint/07-critical_flows.md`
9. `docs/blueprint/08-use_cases.md`
10. `docs/blueprint/09-state-models.md`
11. `docs/blueprint/10-architecture_decisions.md`
12. `docs/blueprint/11-build_plan.md`
13. `docs/blueprint/12-testing_strategy.md`
14. `docs/blueprint/13-security.md`
15. `docs/blueprint/14-scalability.md`
16. `docs/blueprint/15-observability.md`
17. `docs/blueprint/16-evolution.md`

Leia tambem `docs/prd.md` se existir, para contexto adicional.

> **Versões atualizadas:** Ao referenciar tecnologias específicas com versões, use o MCP context7 para consultar documentação atualizada. Primeiro chame `mcp__context7__resolve-library-id` para obter o ID da biblioteca, depois `mcp__context7__query-docs` para consultar versões e exemplos.

## Passo 3: Classificar Tipo de Alteracao

Identifique o tipo de alteracao:

- **Adicao** — nova feature, novos requisitos, novas entidades, novos fluxos, novos casos de uso
- **Correcao** — entidade renomeada, campo atualizado, fluxo corrigido, dado errado
- **Atualizacao** — versao de tecnologia, endpoint renomeado, componente movido
- **Remocao** — feature removida do escopo, entidade depreciada, fluxo obsoleto

## Passo 4: Analise de Impacto

Identifique quais documentos sao impactados. Apresente ao usuario:

| Doc                        | Impactado?  | Tipo                                    | O que fazer   |
| -------------------------- | ----------- | --------------------------------------- | ------------- |
| 00-context                 | {{Sim/Nao}} | {{Adicao/Correcao/Atualizacao/Remocao}} | {{Descricao}} |
| 01-vision                  | {{Sim/Nao}} | {{Tipo}}                                | {{Descricao}} |
| 02-architecture-principles | {{Sim/Nao}} | {{Tipo}}                                | {{Descricao}} |
| 03-requirements            | {{Sim/Nao}} | {{Tipo}}                                | {{Descricao}} |
| 04-domain-model            | {{Sim/Nao}} | {{Tipo}}                                | {{Descricao}} |
| 05-data-model              | {{Sim/Nao}} | {{Tipo}}                                | {{Descricao}} |
| 06-system-architecture     | {{Sim/Nao}} | {{Tipo}}                                | {{Descricao}} |
| 07-critical-flows          | {{Sim/Nao}} | {{Tipo}}                                | {{Descricao}} |
| 08-use-cases               | {{Sim/Nao}} | {{Tipo}}                                | {{Descricao}} |
| 09-state-models            | {{Sim/Nao}} | {{Tipo}}                                | {{Descricao}} |
| 10-architecture-decisions  | {{Sim/Nao}} | {{Tipo}}                                | {{Descricao}} |
| 11-build-plan              | {{Sim/Nao}} | {{Tipo}}                                | {{Descricao}} |
| 12-testing-strategy        | {{Sim/Nao}} | {{Tipo}}                                | {{Descricao}} |
| 13-security                | {{Sim/Nao}} | {{Tipo}}                                | {{Descricao}} |
| 14-scalability             | {{Sim/Nao}} | {{Tipo}}                                | {{Descricao}} |
| 15-observability           | {{Sim/Nao}} | {{Tipo}}                                | {{Descricao}} |
| 16-evolution               | {{Sim/Nao}} | {{Tipo}}                                | {{Descricao}} |

> Confirme com o usuario antes de prosseguir: "Estes sao os documentos que serao atualizados. Deseja ajustar algo?"

## Passo 5: Aplicar Alteracoes

**Use SEMPRE Edit tool, NUNCA Write tool** — Write sobrescreve o arquivo inteiro.

Para CADA documento marcado como impactado, aplique conforme o tipo:

### Para ADICAO (nova feature):

1. **Leia** o documento atual (Read tool)
2. **Localize** os marcadores `<!-- APPEND:section-id -->`
3. **Gere** APENAS o conteudo novo (delta)
4. **Insira** ANTES do marcador usando Edit tool
5. **Marque** com: `<!-- adicionado: nome-da-feature -->`

Marcadores disponiveis por documento:

- `00-context.md`: `<!-- APPEND:actors -->`, `<!-- APPEND:external-systems -->`, `<!-- APPEND:constraints -->`
- `01-vision.md`: `<!-- APPEND:objectives -->`, `<!-- APPEND:personas -->`, `<!-- APPEND:success-metrics -->`
- `03-requirements.md`: `<!-- APPEND:functional-requirements -->`, `<!-- APPEND:nonfunctional-requirements -->`
- `04-domain-model.md`: `<!-- APPEND:glossary -->`, `<!-- APPEND:entities -->`
- `09-state-models.md`: `<!-- APPEND:state-models -->`
- `10-architecture_decisions.md`: `<!-- APPEND:adrs -->`
- `11-build_plan.md`: `<!-- APPEND:technical-risks -->`, `<!-- APPEND:deliverables -->`
- `12-testing_strategy.md`: `<!-- APPEND:coverage -->`, `<!-- APPEND:ci-pipeline -->`
- `13-security.md`: `<!-- APPEND:threats -->`, `<!-- APPEND:roles -->`

Para documentos sem marcadores APPEND (02, 05, 06, 07, 08, 14, 15, 16), insira o novo conteudo na secao apropriada usando Edit tool, localizando a ultima entrada da secao e adicionando apos ela.

### Para CORRECAO (dado errado, entidade renomeada, etc.):

1. **Leia** o documento atual (Read tool)
2. **Localize** a linha/celula com o dado incorreto
3. **Use Edit** com old_string = valor antigo, new_string = valor correto
4. **Marque** com: `<!-- corrigido: descricao-breve -->`
5. **NAO toque** em nenhuma outra linha

### Para ATUALIZACAO (endpoint renomeado, versao atualizada, etc.):

1. **Leia** o documento atual (Read tool)
2. **Localize** TODAS as ocorrencias do valor antigo (pode estar em multiplos docs)
3. **Use Edit** com replace_all se o valor aparece multiplas vezes no mesmo arquivo
4. **Marque** com: `<!-- atualizado: descricao-breve -->`

### Para REMOCAO (feature removida do escopo):

1. **Leia** o documento atual (Read tool)
2. **Localize** as linhas da feature removida
3. **Use Edit** para substituir o conteudo por: `~~conteudo original~~ <!-- removido: motivo -->`
4. **NAO delete** a linha — marque como removida com strikethrough para manter historico
5. Se a remocao for definitiva e o usuario confirmar, ai sim delete a linha

### Regras criticas — NUNCA violar:

- **Tabelas (adicao)**: novas linhas ANTES do marcador `<!-- APPEND:... -->`
- **Tabelas (correcao)**: Edit na celula especifica, sem tocar outras linhas
- **Fluxos (adicao)**: novo bloco `## Fluxo: {{Nome}}` com estrutura completa
- **Fluxos (correcao)**: Edit nos passos especificos do fluxo
- **Casos de uso (adicao)**: novo bloco `## Caso de Uso: {{Nome}}` com estrutura completa
- **ADRs (adicao)**: novo bloco `## ADR-NNN: {{Titulo}}` com numeracao sequencial
- **Entidades (adicao)**: nova entrada na tabela ou novo bloco de entidade
- **NUNCA altere** linhas nao relacionadas a alteracao solicitada
- **Alteracoes minimas**: mude o minimo necessario para aplicar a correcao

### Exemplo de insercao em tabela:

**Antes:**

```
| Administrador | Gerencia configuracoes do sistema |
<!-- APPEND:actors -->
```

**Edit:** old_string = `<!-- APPEND:actors -->`, new_string =

```
| Auditor | Visualiza logs e relatorios de conformidade |
<!-- APPEND:actors -->
```

**Resultado:**

```
| Administrador | Gerencia configuracoes do sistema |
| Auditor | Visualiza logs e relatorios de conformidade |
<!-- APPEND:actors -->
```

### Exemplo de insercao de ADR:

**Antes:**

```
## ADR-002: Banco de dados relacional
(conteudo existente)

<!-- APPEND:adrs -->
```

**Edit:** old_string = `<!-- APPEND:adrs -->`, new_string =

```
---

## ADR-003: Adotar filas para processamento assincrono
<!-- adicionado: processamento-assincrono -->

**Status:** Aceita
**Contexto:** O sistema precisa processar notificacoes e relatorios sem bloquear a thread principal.
**Decisao:** Usar RabbitMQ como message broker para filas de processamento assincrono.
**Consequencias:**
- (+) Desacoplamento entre produtor e consumidor
- (+) Resiliencia a falhas temporarias
- (-) Complexidade adicional na infraestrutura
- (-) Necessidade de monitoramento de filas

<!-- APPEND:adrs -->
```

### Exemplo de insercao de fluxo critico:

**Antes:**

```
## Fluxo: Checkout
(conteudo existente)

---
```

**Edit para adicionar novo fluxo apos o ultimo existente, localizando o final do documento ou a ultima secao.**

```
---

## Fluxo: Envio de Notificacao Push
<!-- adicionado: notificacoes-push -->

> Fluxo disparado quando um evento do sistema requer notificacao ao usuario.

**Atores:** Sistema, Servico de Push, Usuario
**Trigger:** Evento de negocio (ex: pedido confirmado)

**Passos:**
1. Evento de negocio e publicado na fila
2. Consumer processa evento e monta payload da notificacao
3. Servico de push envia para APNs/FCM
4. Dispositivo do usuario recebe a notificacao
5. Sistema registra status de entrega

**Tratamento de Erros:**
- Falha no servico de push -> Retry com backoff exponencial (max 3 tentativas)
- Token de dispositivo invalido -> Marca token como inativo, nao tenta novamente
```

## Passo 6: Revisao

Apresente ao usuario um resumo do que foi alterado:

> "Alteracao **{{nome}}** aplicada ao blueprint. Modificacoes em **{{N}}** documentos:
>
> | Doc             | Alteracao                    |
> | --------------- | ---------------------------- |
> | 00-context      | +{{X}} atores                |
> | 03-requirements | +{{Y}} requisitos funcionais |
> | 04-domain-model | +{{Z}} entidades             |
> | ...             | ...                          |
>
> Revise os documentos atualizados e solicite ajustes se necessario."

## Passo 7: Proximo

> "Blueprint atualizado. Para adicionar outra alteracao, rode
> `/blueprint-increment` novamente.
> Para revisar o blueprint completo, rode `/blueprint`."
