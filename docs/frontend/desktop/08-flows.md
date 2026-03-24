# Fluxos de Interface

Documenta os fluxos criticos de interacao do usuario com o frontend desktop. Cada fluxo mostra o caminho do usuario, os componentes envolvidos e os pontos de decisao/erro. Inclui interacoes especificas do desktop como drag-and-drop de arquivos do OS, atalhos de teclado, notificacoes nativas e acesso ao file system. Esses fluxos sao a base para testes E2E e validacao de requisitos.

---

## Fluxos Criticos

> Quais sao os 3-5 fluxos mais importantes da aplicacao?

| # | Fluxo | Atores | Criticidade |
|---|-------|--------|-------------|
| 1 | {{Autenticacao (Login/Register)}} | {{Usuario nao-autenticado}} | Alta |
| 2 | {{Onboarding}} | {{Novo usuario}} | Alta |
| 3 | {{Feature principal}} | {{Usuario autenticado}} | Alta |
| 4 | {{Pagamento/Checkout}} | {{Usuario autenticado}} | Media |
| 5 | {{Configuracoes de conta}} | {{Usuario autenticado}} | Media |

---

### Fluxo 1: {{Nome do Fluxo}}

> {{Descreva o fluxo em alto nivel}}

**Passos:**

1. {{Passo 1 — acao do usuario}}
2. {{Passo 2 — resposta do sistema}}
3. {{Passo 3 — proxima acao}}
4. {{Passo 4 — conclusao}}

**Componentes envolvidos:**

| Componente | Responsabilidade |
|------------|-----------------|
| {{LoginForm}} | {{Captura credenciais}} |
| {{AuthProvider}} | {{Gerencia estado de auth}} |
| {{ErrorToast}} | {{Exibe erros de validacao}} |

**Tratamento de Erros:**

- {{Erro possivel 1 — credenciais invalidas}} → {{Exibe mensagem inline no form}}
- {{Erro possivel 2 — servidor indisponivel}} → {{Toast de erro + retry button}}

> Diagrama: [fluxo-1.mmd](../diagrams/frontend/fluxo-1.mmd)

---

### Fluxo 2: {{Nome do Fluxo}}

> {{Descreva o fluxo em alto nivel}}

**Passos:**

1. {{Passo 1 — acao do usuario}}
2. {{Passo 2 — resposta do sistema}}
3. {{Passo 3 — proxima acao}}
4. {{Passo 4 — conclusao}}

**Tratamento de Erros:**

- {{Erro possivel 1}} → {{Como o frontend responde}}
- {{Erro possivel 2}} → {{Como o frontend responde}}

> Diagrama: [fluxo-2.mmd](../diagrams/frontend/fluxo-2.mmd)

---

### Fluxo 3: {{Nome do Fluxo}}

> {{Descreva o fluxo em alto nivel}}

**Passos:**

1. {{Passo 1 — acao do usuario}}
2. {{Passo 2 — resposta do sistema}}
3. {{Passo 3 — proxima acao}}
4. {{Passo 4 — conclusao}}

**Tratamento de Erros:**

- {{Erro possivel 1}} → {{Como o frontend responde}}
- {{Erro possivel 2}} → {{Como o frontend responde}}

> Diagrama: [fluxo-3.mmd](../diagrams/frontend/fluxo-3.mmd)

<!-- APPEND:fluxos -->

---

## Interacoes Desktop

> Quais interacoes especificas do desktop sao suportadas?

### Drag-and-Drop de Arquivos do OS

| Acao | Componente | Comportamento |
|------|-----------|---------------|
| Arrastar arquivo do Explorer/Finder para a janela | {{DropZone}} | {{Detecta tipo, valida e inicia upload/processamento}} |
| Arrastar arquivo da app para o Explorer/Finder | {{FileList}} | {{Exporta arquivo para o file system}} |

```typescript
// Exemplo — Drag-and-drop de arquivo do OS
window.addEventListener('drop', (event) => {
  event.preventDefault();
  const files = event.dataTransfer?.files;
  if (files?.length) {
    handleFileDrop(Array.from(files));
  }
});
```

### Keyboard Shortcuts (Atalhos de Teclado)

| Atalho | Acao | Contexto |
|--------|------|----------|
| {{Ctrl/Cmd + N}} | {{Criar novo item}} | {{Global}} |
| {{Ctrl/Cmd + S}} | {{Salvar}} | {{Area de edicao}} |
| {{Ctrl/Cmd + F}} | {{Buscar}} | {{Global}} |
| {{Ctrl/Cmd + ,}} | {{Abrir configuracoes}} | {{Global}} |
| {{Ctrl/Cmd + Q}} | {{Fechar aplicacao}} | {{Global}} |
| {{Outro atalho}} | {{Acao}} | {{Contexto}} |

<!-- APPEND:shortcuts -->

### Notificacoes Nativas do Sistema

| Evento | Titulo | Corpo | Acao ao Clicar |
|--------|--------|-------|----------------|
| {{Atualizacao disponivel}} | {{Atualizacao disponivel}} | {{Versao X.Y.Z pronta para instalar}} | {{Abrir janela de update}} |
| {{Tarefa concluida}} | {{Tarefa concluida}} | {{O processamento de "arquivo.csv" foi finalizado}} | {{Focar na janela principal}} |
| {{Outro evento}} | {{Titulo}} | {{Corpo}} | {{Acao}} |

<!-- APPEND:notifications -->

### Acesso ao File System

| Operacao | Metodo | Dialogo Nativo? | Filtros |
|----------|--------|-----------------|---------|
| Abrir arquivo | `dialog.showOpenDialog()` | Sim | {{Extensoes permitidas}} |
| Salvar arquivo | `dialog.showSaveDialog()` | Sim | {{Extensoes sugeridas}} |
| Selecionar diretorio | `dialog.showOpenDialog({ properties: ['openDirectory'] })` | Sim | — |
| Ler arquivo | IPC → `fs.readFile()` | Nao | — |
| Escrever arquivo | IPC → `fs.writeFile()` | Nao | — |

---

## Multi-Window (quando aplicavel)

> O sistema requer multiplas janelas?

- [ ] Nao — janela unica e suficiente
- [ ] Sim — janelas secundarias para configuracoes, about, etc.
- [ ] Sim — janelas destacaveis (detach de abas)

Se sim:

| Janela | Quando Abre | Comunicacao com Main Window |
|--------|------------|----------------------------|
| {{Settings}} | {{Menu > Configuracoes}} | {{IPC events para sincronizar preferencias}} |
| {{About}} | {{Menu > Sobre}} | {{Nenhuma}} |
| {{Janela adicional}} | {{Trigger}} | {{Mecanismo}} |

> Para detalhes sobre testes de fluxos, (ver 09-tests.md).

---

## Historico de Decisoes

| Data | Decisao | Motivo |
|------|---------|--------|
| {{YYYY-MM-DD}} | {{Decisao sobre fluxos}} | {{Justificativa}} |
