---
name: mvp-incrementar
description: Incrementa o MVP blueprint com nova funcionalidade ou correcao sem sobrescrever conteudo existente. Usa Edit (nao Write) para preservar tudo.
---

# MVP Blueprint — Incrementar ou Corrigir

Atualiza os documentos existentes do MVP blueprint de forma incremental,
preservando todo o conteudo ja preenchido. Use este skill para:
- **Adicionar** uma nova feature (novos atores, entidades, fluxos, requisitos, etc.)
- **Corrigir** informacoes existentes (regra de negocio errada, metrica ajustada, etc.)
- **Atualizar** versoes de tecnologias, nomes de entidades, decisoes revisitadas
- **Remover** item do escopo, ator depreciado, regra de negocio revogada

## Passo 1: Receber a Alteracao

Pergunte ao usuario:

> "O que precisa ser atualizado no MVP blueprint?
>
> Exemplos:
> - **Nova feature:** 'Sistema de notificacoes push para prestadores'
> - **Correcao:** 'A regra RN3 deveria ser 48h e nao 24h de antecedencia'
> - **Atualizacao:** 'Banco de dados mudou de PostgreSQL para MongoDB'
> - **Remocao:** 'Fluxo de cancelamento foi removido do escopo da POC'
>
> Descreva a alteracao."

Aguarde a resposta antes de prosseguir.

## Passo 2: Leitura do Estado Atual

Leia TODOS os documentos existentes em `docs/mvp/`:

1. `docs/mvp/00-contexto.md`
2. `docs/mvp/01-visao.md`
3. `docs/mvp/02-requisitos.md`
4. `docs/mvp/03-dominio.md`
5. `docs/mvp/04-dados.md`
6. `docs/mvp/05-arquitetura.md`
7. `docs/mvp/06-fluxos.md`

Leia tambem `docs/prd.md` se existir, para contexto adicional.

> Ao referenciar tecnologias especificas com versoes, consulte https://context7.com/ para garantir versoes atualizadas.

## Passo 3: Classificar Tipo de Alteracao

Identifique o tipo de alteracao:

- **Adicao** — novo ator, nova entidade, novo fluxo, novo requisito, nova regra de negocio
- **Correcao** — regra errada, metrica ajustada, restricao incorreta, dado errado
- **Atualizacao** — tecnologia mudou, nome de entidade renomeado, decisao revisitada
- **Remocao** — feature removida do escopo, ator depreciado, regra revogada

## Passo 4: Analise de Impacto

Identifique quais documentos sao impactados. Apresente ao usuario:

| Doc | Impactado? | Tipo | O que fazer |
|-----|-----------|------|-------------|
| 00-contexto | {{Sim/Nao}} | {{Adicao/Correcao/Atualizacao/Remocao}} | {{Novo ator, novo sistema externo}} |
| 01-visao | {{Sim/Nao}} | {{Tipo}} | {{Novo objetivo, nova metrica}} |
| 02-requisitos | {{Sim/Nao}} | {{Tipo}} | {{Novo requisito must/should/out-of-scope}} |
| 03-dominio | {{Sim/Nao}} | {{Tipo}} | {{Nova entidade, nova regra de negocio}} |
| 04-dados | {{Sim/Nao}} | {{Tipo}} | {{Nova tabela, nova coluna}} |
| 05-arquitetura | {{Sim/Nao}} | {{Tipo}} | {{Novo componente, nova decisao tecnica}} |
| 06-fluxos | {{Sim/Nao}} | {{Tipo}} | {{Novo fluxo critico}} |

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

### Para CORRECAO (dado errado, regra incorreta, etc.):

1. **Leia** o documento atual (Read tool)
2. **Localize** a linha/celula com o dado incorreto
3. **Use Edit** com old_string = valor antigo, new_string = valor correto
4. **Marque** com: `<!-- corrigido: descricao-breve -->`
5. **NAO toque** em nenhuma outra linha

### Para ATUALIZACAO (tecnologia mudou, nome renomeado, etc.):

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
- **Fluxos (adicao)**: novo bloco `## Fluxo: Nome` com estrutura completa
- **Fluxos (correcao)**: Edit nos passos especificos do fluxo
- **NUNCA altere** linhas nao relacionadas a alteracao solicitada
- **Alteracoes minimas**: mude o minimo necessario para aplicar a correcao

### Marcadores APPEND disponiveis:

| Marcador | Arquivo | Onde inserir |
|----------|---------|-------------|
| `<!-- APPEND:atores -->` | 00-contexto.md | Nova linha na tabela de Atores |
| `<!-- APPEND:sistemas-externos -->` | 00-contexto.md | Nova linha na tabela de Sistemas Externos |
| `<!-- APPEND:restricoes -->` | 00-contexto.md | Nova linha na tabela de Restricoes |
| `<!-- APPEND:objetivos -->` | 01-visao.md | Novo item na lista de Nao-objetivos |
| `<!-- APPEND:metricas-sucesso -->` | 01-visao.md | Nova linha na tabela de Metricas de Sucesso |
| `<!-- APPEND:must-have -->` | 02-requisitos.md | Novo requisito Must Have |
| `<!-- APPEND:should-have -->` | 02-requisitos.md | Novo requisito Should Have |
| `<!-- APPEND:out-of-scope -->` | 02-requisitos.md | Novo item Fora do Escopo |
| `<!-- APPEND:glossario -->` | 03-dominio.md | Nova linha na tabela de Glossario |
| `<!-- APPEND:entidades -->` | 03-dominio.md | Nova entidade com atributos |
| `<!-- APPEND:regras-negocio -->` | 03-dominio.md | Nova regra de negocio |
| `<!-- APPEND:tabelas -->` | 04-dados.md | Nova tabela/collection |
| `<!-- APPEND:decisoes-dados -->` | 04-dados.md | Nova decisao de dados |
| `<!-- APPEND:componentes -->` | 05-arquitetura.md | Novo componente |
| `<!-- APPEND:decisoes-tech -->` | 05-arquitetura.md | Nova decisao tecnica |
| `<!-- APPEND:fluxos -->` | 06-fluxos.md | Novo fluxo critico |

### Exemplo de insercao em tabela:

**Antes:**
```
| {{Ator 2}} | {{Pessoa / Sistema / Dispositivo}} | {{Acao principal no sistema}} |

<!-- APPEND:atores -->
```

**Edit:** old_string = `<!-- APPEND:atores -->`, new_string =
```
| Prestador | Pessoa | Configura disponibilidade e confirma agendamentos |
<!-- APPEND:atores -->
```

**Resultado:**
```
| {{Ator 2}} | {{Pessoa / Sistema / Dispositivo}} | {{Acao principal no sistema}} |
| Prestador | Pessoa | Configura disponibilidade e confirma agendamentos |

<!-- APPEND:atores -->
```

### Exemplo de insercao de fluxo:

**Antes:**
```
- {{RN_ID}}: {{Descricao breve}}

<!-- APPEND:fluxos -->
```

**Edit:** old_string = `<!-- APPEND:fluxos -->`, new_string =
```
---

## Fluxo: Cancelar Agendamento
<!-- adicionado: cancelamento -->

**Descricao:** Cliente cancela um agendamento existente, liberando o slot.

**Atores envolvidos:** Cliente, App Web, API Routes, Supabase

**Pre-condicoes:** Cliente autenticado; Agendamento com status "confirmado".

### Caminho feliz

1. **Cliente** acessa "Meus Agendamentos" e clica em "Cancelar"
2. **App Web** exibe modal de confirmacao
3. **Cliente** confirma o cancelamento
4. **API Routes** valida regra de 24h e atualiza status
5. **App Web** exibe confirmacao

**Resultado esperado:** Agendamento cancelado; slot liberado.

### Erros e excecoes

| Passo | Falha possivel | Comportamento do sistema |
| --- | --- | --- |
| 4 | Menos de 24h para o agendamento | API retorna 422; frontend exibe mensagem |

### Regras de negocio aplicaveis

- **RN3:** Cancelamento so permitido com mais de 24h de antecedencia
- **RN4:** Apos cancelamento, slot volta a ficar disponivel

<!-- APPEND:fluxos -->
```

### Exemplo de insercao de regra de negocio:

**Antes:**
```
- **{{ID}}:** {{Descricao da regra}}

<!-- APPEND:regras-negocio -->
```

**Edit:** old_string = `<!-- APPEND:regras-negocio -->`, new_string =
```
- **RN7:** Prestador deve receber notificacao push quando um novo agendamento for criado
<!-- APPEND:regras-negocio -->
```

## Passo 6: Revisao

Apresente ao usuario um resumo do que foi alterado:

> "Alteracao **{{nome}}** documentada. Alteracoes em **{{N}}** documentos:
>
> | Doc | Alteracao |
> |-----|----------|
> | 00-contexto | +{{X}} atores, +{{Y}} sistemas externos |
> | 03-dominio | +{{X}} entidades, +{{Y}} regras de negocio |
> | 06-fluxos | +{{X}} fluxos criticos |
> | ... | ... |
>
> Revise os documentos atualizados e solicite ajustes se necessario."

## Passo 7: Proximo

> "Alteracao documentada. Para adicionar outra funcionalidade, rode
> `/mvp-incrementar` novamente.
> Para revisar o blueprint completo, rode `/mvp-blueprint`."
