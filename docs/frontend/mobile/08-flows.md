# Fluxos de Interface

Documenta os fluxos criticos de interacao do usuario com o app mobile. Cada fluxo mostra o caminho do usuario, os componentes envolvidos, interacoes gestuais e os pontos de decisao/erro. Esses fluxos sao a base para testes E2E e validacao de requisitos.

---

## Fluxos Criticos

> Quais sao os 3-5 fluxos mais importantes do app?

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

1. {{Passo 1 — acao do usuario (ex: toque, gesto, swipe)}}
2. {{Passo 2 — resposta do sistema (ex: navegacao, feedback haptico)}}
3. {{Passo 3 — proxima acao}}
4. {{Passo 4 — conclusao}}

**Componentes envolvidos:**

| Componente | Responsabilidade |
|------------|-----------------|
| {{LoginForm}} | {{Captura credenciais}} |
| {{BiometricPrompt}} | {{Autenticacao biometrica (Face ID / Fingerprint)}} |
| {{AuthProvider}} | {{Gerencia estado de auth}} |
| {{Toast}} | {{Exibe feedback de sucesso/erro}} |

**Interacoes Nativas:**

| Interacao | Plataforma | Comportamento |
|-----------|-----------|---------------|
| {{Biometria}} | {{iOS: Face ID, Android: Fingerprint}} | {{Autenticacao rapida sem senha}} |
| {{Haptic feedback}} | {{iOS e Android}} | {{Feedback tatil em sucesso/erro}} |
| {{Keyboard avoiding}} | {{iOS e Android}} | {{Teclado nao cobre campos do form}} |

**Tratamento de Erros:**

- {{Erro possivel 1 — credenciais invalidas}} -> {{Exibe mensagem inline no form + haptic error}}
- {{Erro possivel 2 — servidor indisponivel}} -> {{Toast de erro + botao de retry}}
- {{Erro possivel 3 — sem conexao}} -> {{Banner de offline + desabilitar submit}}

> Diagrama: [fluxo-1.mmd](../diagrams/mobile/fluxo-1.mmd)

---

### Fluxo 2: {{Nome do Fluxo}}

> {{Descreva o fluxo em alto nivel}}

**Passos:**

1. {{Passo 1 — acao do usuario}}
2. {{Passo 2 — resposta do sistema}}
3. {{Passo 3 — proxima acao}}
4. {{Passo 4 — conclusao}}

**Interacoes Gestuais:**

| Gesto | Componente | Acao |
|-------|-----------|------|
| {{Pull-to-refresh}} | {{FlatList}} | {{Recarrega dados da lista}} |
| {{Swipe left}} | {{ListItem}} | {{Revela acoes (editar, deletar)}} |
| {{Long press}} | {{ListItem}} | {{Abre menu de contexto}} |
| {{Pinch-to-zoom}} | {{ImageViewer}} | {{Zoom em imagens}} |

**Tratamento de Erros:**

- {{Erro possivel 1}} -> {{Como o app responde}}
- {{Erro possivel 2}} -> {{Como o app responde}}

> Diagrama: [fluxo-2.mmd](../diagrams/mobile/fluxo-2.mmd)

---

### Fluxo 3: {{Nome do Fluxo}}

> {{Descreva o fluxo em alto nivel}}

**Passos:**

1. {{Passo 1 — acao do usuario}}
2. {{Passo 2 — resposta do sistema}}
3. {{Passo 3 — proxima acao}}
4. {{Passo 4 — conclusao}}

**Tratamento de Erros:**

- {{Erro possivel 1}} -> {{Como o app responde}}
- {{Erro possivel 2}} -> {{Como o app responde}}

> Diagrama: [fluxo-3.mmd](../diagrams/mobile/fluxo-3.mmd)

<!-- APPEND:fluxos -->

---

## Padroes de Interacao Mobile

> Quais padroes de interacao sao adotados consistentemente no app?

| Padrao | Onde Usado | Implementacao |
|--------|-----------|---------------|
| Pull-to-refresh | Todas as listas com dados do servidor | `RefreshControl` no `FlatList`/`ScrollView` |
| Swipe actions | Itens de lista com acoes rapidas | `react-native-gesture-handler` / Swipeable |
| Infinite scroll | Listas longas paginadas | `onEndReached` do `FlatList` + TanStack Query |
| Skeleton loading | Todas as telas com dados assincronos | Componentes Skeleton customizados |
| Haptic feedback | Acoes importantes (submit, delete, toggle) | `expo-haptics` |
| Bottom sheet | Opcoes de contexto, filtros | `@gorhom/bottom-sheet` |
| Toast/Snackbar | Feedback de acoes (sucesso, erro) | Toast customizado ou `react-native-toast-message` |

---

## Historico de Decisoes

| Data | Decisao | Motivo |
|------|---------|--------|
| {{YYYY-MM-DD}} | {{Decisao sobre fluxos}} | {{Justificativa}} |
