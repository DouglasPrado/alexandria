---
name: frontend-increment
description: Incrementa o frontend blueprint com nova funcionalidade ou correcao sem sobrescrever conteudo existente. Usa Edit (nao Write) para preservar tudo.
---

# Frontend Blueprint — Incrementar ou Corrigir

Atualiza os documentos existentes do frontend blueprint de forma incremental,
preservando todo o conteudo ja preenchido. Use este skill para:
- **Adicionar** uma nova feature (novos componentes, rotas, fluxos, etc.)
- **Corrigir** informacoes existentes (props erradas, rotas renomeadas, fluxos atualizados, etc.)
- **Atualizar** versoes de tecnologias, endpoints, nomes, ou qualquer dado que mudou

## Passo 1: Receber a Alteracao

Pergunte ao usuario:

> "O que precisa ser atualizado no frontend blueprint?
>
> Exemplos:
> - **Nova feature:** 'Sistema de chat em tempo real'
> - **Correcao:** 'O componente UserCard agora recebe prop `avatarUrl` em vez de `imageUrl`'
> - **Atualizacao:** 'Rota /settings foi renomeada para /preferences'
> - **Remocao:** 'Feature de notificacoes foi removida do escopo'
>
> Descreva a alteracao."

Aguarde a resposta antes de prosseguir.

## Passo 2: Leitura do Estado Atual

Leia TODOS os documentos existentes em `docs/frontend/`:

1. `docs/frontend/00-frontend-vision.md`
2. `docs/frontend/01-architecture.md`
3. `docs/frontend/02-project-structure.md`
4. `docs/frontend/03-design-system.md`
5. `docs/frontend/04-components.md`
6. `docs/frontend/05-state.md`
7. `docs/frontend/06-data-layer.md`
8. `docs/frontend/07-routes.md`
9. `docs/frontend/08-flows.md`
10. `docs/frontend/09-tests.md`
11. `docs/frontend/10-performance.md`
12. `docs/frontend/11-security.md`
13. `docs/frontend/12-observability.md`
14. `docs/frontend/13-cicd-conventions.md`

Leia tambem os arquivos relevantes de `docs/blueprint/` para contexto do sistema (entidades, fluxos, requisitos).
Leia `docs/prd.md` se existir, como complemento.

> **Versões atualizadas:** Ao referenciar tecnologias específicas com versões, use o MCP context7 para consultar documentação atualizada. Primeiro chame `mcp__context7__resolve-library-id` para obter o ID da biblioteca, depois `mcp__context7__query-docs` para consultar versões e exemplos.

## Passo 3: Classificar Tipo de Alteracao

Identifique o tipo de alteracao:

- **Adicao** — nova feature, novos componentes, novas rotas, novos fluxos
- **Correcao** — prop renomeada, endpoint atualizado, fluxo corrigido, dado errado
- **Atualizacao** — versao de lib, rota renomeada, componente movido
- **Remocao** — feature removida do escopo, componente depreciado

## Passo 4: Analise de Impacto

Identifique quais documentos sao impactados. Apresente ao usuario:

| Doc | Impactado? | Tipo | O que fazer |
|-----|-----------|------|-------------|
| 00-visao | {{Sim/Nao}} | {{Adicao/Correcao/Atualizacao/Remocao}} | {{Descricao}} |
| 01-architecture | {{Sim/Nao}} | {{Tipo}} | {{Descricao}} |
| 02-estrutura | {{Sim/Nao}} | {{Tipo}} | {{Descricao}} |
| 03-design-system | {{Sim/Nao}} | {{Tipo}} | {{Descricao}} |
| 04-components | {{Sim/Nao}} | {{Tipo}} | {{Descricao}} |
| 05-state | {{Sim/Nao}} | {{Tipo}} | {{Descricao}} |
| 06-data-layer | {{Sim/Nao}} | {{Tipo}} | {{Descricao}} |
| 07-routes | {{Sim/Nao}} | {{Tipo}} | {{Descricao}} |
| 08-flows | {{Sim/Nao}} | {{Tipo}} | {{Descricao}} |
| 09-tests | {{Sim/Nao}} | {{Tipo}} | {{Descricao}} |
| 10-performance | {{Sim/Nao}} | {{Tipo}} | {{Descricao}} |
| 11-security | {{Sim/Nao}} | {{Tipo}} | {{Descricao}} |
| 12-observability | {{Sim/Nao}} | {{Tipo}} | {{Descricao}} |
| 13-cicd | {{Sim/Nao}} | {{Tipo}} | {{Descricao}} |

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

### Para CORRECAO (dado errado, prop renomeada, etc.):

1. **Leia** o documento atual (Read tool)
2. **Localize** a linha/celula com o dado incorreto
3. **Use Edit** com old_string = valor antigo, new_string = valor correto
4. **Marque** com: `<!-- corrigido: descricao-breve -->`
5. **NAO toque** em nenhuma outra linha

### Para ATUALIZACAO (rota renomeada, versao atualizada, etc.):

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
- **Fluxos (adicao)**: novo bloco `### Fluxo N:` com numeracao sequencial
- **Fluxos (correcao)**: Edit nos passos especificos do fluxo
- **NUNCA altere** linhas nao relacionadas a alteracao solicitada
- **Alteracoes minimas**: mude o minimo necessario para aplicar a correcao

### Exemplo de insercao em tabela:

**Antes:**
```
| Button | variant, size | primary, secondary |
<!-- APPEND:primitivos -->
```

**Edit:** old_string = `<!-- APPEND:primitivos -->`, new_string =
```
| ChatInput | value, onSend, placeholder | text, voice |
<!-- APPEND:primitivos -->
```

**Resultado:**
```
| Button | variant, size | primary, secondary |
| ChatInput | value, onSend, placeholder | text, voice |
<!-- APPEND:primitivos -->
```

### Exemplo de insercao de fluxo:

**Antes:**
```
### Fluxo 2: Checkout
(conteudo existente)

<!-- APPEND:fluxos -->
```

**Edit:** old_string = `<!-- APPEND:fluxos -->`, new_string =
```
---

### Fluxo 3: Enviar Mensagem no Chat
<!-- adicionado: chat -->

> Fluxo de envio de mensagem em tempo real.

**Passos:**
1. Usuario abre a conversa
2. Digita mensagem no ChatInput
3. Pressiona Enter ou clica em Enviar
4. Frontend envia via WebSocket
5. Mensagem aparece na lista com status "enviando"
6. Backend confirma recebimento
7. Status muda para "enviado"

**Tratamento de Erros:**
- Falha de conexao WebSocket → Mostra banner "Reconectando..." + retry automatico
- Timeout de envio → Mostra "Falha ao enviar" + botao de retry

<!-- APPEND:fluxos -->
```

## Passo 6: Revisao

Apresente ao usuario um resumo do que foi adicionado:

> "Funcionalidade **{{nome}}** documentada. Alteracoes em **{{N}}** documentos:
>
> | Doc | Alteracao |
> |-----|----------|
> | 04-components | +{{X}} componentes |
> | 05-state | +{{Y}} stores, +{{Z}} eventos |
> | ... | ... |
>
> Revise os documentos atualizados e solicite ajustes se necessario."

## Passo 7: Proximo

> "Feature documentada. Para adicionar outra funcionalidade, rode
> `/frontend-increment` novamente.
> Para revisar o blueprint completo, rode `/frontend`."
