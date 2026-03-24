# Fluxos de Interface

Documenta os fluxos criticos de interacao do usuario com o frontend. Cada fluxo mostra o caminho do usuario, os componentes envolvidos e os pontos de decisao/erro. Esses fluxos sao a base para testes E2E e validacao de requisitos.

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

> 📐 Diagrama: [fluxo-1.mmd](../diagrams/frontend/fluxo-1.mmd)

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

> 📐 Diagrama: [fluxo-2.mmd](../diagrams/frontend/fluxo-2.mmd)

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

> 📐 Diagrama: [fluxo-3.mmd](../diagrams/frontend/fluxo-3.mmd)

<!-- APPEND:fluxos -->

---

## Microfrontends (quando aplicavel)

> O sistema requer particionamento em microfrontends?

- [ ] Nao — aplicacao monolitica e suficiente
- [ ] Sim — microfrontends por rota
- [ ] Sim — microfrontends por componente

Se sim:

| Microfrontend | Rota/Componente | Bundle Independente? | Ferramenta |
|---------------|-----------------|----------------------|------------|
| {{mfe-dashboard}} | {{/dashboard}} | {{Sim}} | {{Module Federation}} |
| {{mfe-checkout}} | {{/checkout}} | {{Sim}} | {{single-spa}} |
| {{mfe-adicional}} | {{/rota}} | {{Sim/Nao}} | {{Ferramenta}} |

Tecnologias comuns: Webpack Module Federation, single-spa, Next.js Multi-Zones.

> Para detalhes sobre testes de fluxos, (ver 09-tests.md).

---

## Historico de Decisoes

| Data | Decisao | Motivo |
|------|---------|--------|
| {{YYYY-MM-DD}} | {{Decisao sobre fluxos}} | {{Justificativa}} |
