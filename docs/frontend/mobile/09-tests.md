# Estrategia de Testes

Define a piramide de testes do app mobile, as ferramentas utilizadas, os padroes de escrita de testes e as metas de cobertura por camada. Uma estrategia de testes bem definida garante confianca nas releases e velocidade no desenvolvimento.

---

## Piramide de Testes

> Como distribuimos o esforco de teste entre os niveis?

```
        +---------+
        |   E2E   |  <- Poucos, lentos, alto valor
        +---------+
        | Integr. |  <- Moderados, fluxos de UI
        +---------+
        |  Unit   |  <- Muitos, rapidos, isolados
        +---------+
```

<!-- do blueprint: 12-testing_strategy.md (piramide 70/20/10, Core SDK prioritario), mobile/08-flows.md (5 fluxos criticos) -->

| Nivel | Ferramenta | O que Testa | Meta de Cobertura |
|-------|------------|-------------|-------------------|
| Unit | Jest + React Native Testing Library | Hooks, stores Zustand, utils, logica de negocio (Core SDK no mobile) | 80%+ (90%+ em crypto/upload) |
| Integration | React Native Testing Library + MSW | Componentes com API mocked, fluxo de telas, TanStack Query | 60%+ nas features criticas |
| E2E | Maestro | Fluxos completos em dispositivo/emulador (iOS + Android) | 100% dos 5 fluxos criticos |

---

## Padroes por Tipo de Componente

> O que testar em cada tipo de componente?

| Tipo | O que Testar | O que NAO Testar |
|------|-------------|------------------|
| Primitive (Button, TextInput) | Rendering, props, acessibilidade | Estilo visual (use Storybook) |
| Composite (Form, ListItem) | Interacao, validacao, estados | Componentes filhos isolados |
| Feature (UserProfile) | Fluxo completo, API mocking | Implementacao interna |
| Hooks | Retorno, side effects, edge cases | Implementacao do React |
| Navigation | Transicoes de tela, deep links | Animacoes |

<details>
<summary>Exemplo — Teste de componente e hook</summary>

```tsx
// Teste de componente com React Native Testing Library
describe('LoginForm', () => {
  it('deve exibir erro quando credenciais sao invalidas', async () => {
    render(<LoginForm />);

    fireEvent.changeText(
      screen.getByPlaceholderText('Email'),
      'user@test.com'
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('Senha'),
      'wrong'
    );
    fireEvent.press(screen.getByText('Entrar'));

    expect(await screen.findByText('Credenciais invalidas')).toBeTruthy();
  });
});

// Teste de hook com renderHook
describe('useAuth', () => {
  it('deve retornar usuario apos login', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('user@test.com', 'password');
    });

    expect(result.current.user).toBeDefined();
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

</details>

<details>
<summary>Exemplo — Teste E2E com Maestro</summary>

```yaml
# maestro/flows/login.yaml
appId: com.myapp
---
- launchApp
- tapOn: "Email"
- inputText: "user@test.com"
- tapOn: "Senha"
- inputText: "password123"
- tapOn: "Entrar"
- assertVisible: "Dashboard"
```

</details>

<details>
<summary>Exemplo — Teste E2E com Detox</summary>

```typescript
describe('Login Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('deve fazer login com credenciais validas', async () => {
    await element(by.id('email-input')).typeText('user@test.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    await expect(element(by.text('Dashboard'))).toBeVisible();
  });
});
```

</details>

---

## Cobertura e Metas

> Quais sao as metas de cobertura por camada?

<!-- do blueprint: 12-testing_strategy.md (cobertura prioritaria em Core SDK crypto e chunking) -->

| Camada | Meta | Medicao |
|--------|------|---------|
| Core SDK (crypto, chunking, hashing) | 90%+ | Jest coverage — **prioridade maxima**: corrupção de dados é catastrófica |
| Domain (models, utils, mappers) | 90%+ | Jest coverage |
| Application (hooks Zustand, hooks TanStack Query) | 80%+ | Jest coverage |
| Infrastructure (api-client, sync-engine) | 75%+ | Jest + MSW mocks |
| UI (components primitivos e compostos) | 60%+ | React Native Testing Library |
| E2E (5 fluxos criticos) | 100% | Maestro flow reports |

**Areas com cobertura obrigatoria (qualquer PR que toque deve ter testes):**
- `features/upload/services/sync-engine` — sync automatico em background
- `features/auth/services/vault` — desbloqueio do vault com senha
- `features/upload/store/upload-store` — fila persistida (SQLite)
- `packages/core-sdk/crypto` — AES-256-GCM + envelope encryption

<!-- APPEND:cobertura -->

---

## Testes Especificos Mobile

> Quais cenarios especificos de mobile devem ser testados?

| Cenario | Ferramenta | O que Validar |
|---------|------------|---------------|
| Rotacao de tela | Detox/Maestro | Layout adapta corretamente |
| Background/Foreground | Detox | Estado e restaurado ao voltar |
| Sem conexao (offline) | Detox/Jest | Feedback adequado, dados cacheados |
| Push notification | Detox | Deep link abre tela correta |
| Permissoes (camera, etc) | Detox | Fluxo de permissao e tratado |
| Teclado | RNTL | Inputs nao sao cobertos pelo teclado |
| Acessibilidade | RNTL | Labels, roles, hints configurados |

---

## Integracao com CI

> Testes rodam automaticamente no pipeline?

<!-- do blueprint: 12-testing_strategy.md (CI GitHub Actions), mobile/00-frontend-vision.md (EAS Build) -->

- [x] Testes unitarios rodam em cada PR
- [x] Testes de integracao rodam em cada PR
- [x] E2E roda antes de merge na main (via EAS Build + Maestro no emulador)
- [x] Cobertura e reportada no PR (threshold: 80% geral, 90% Core SDK)
- [x] Testes falhos bloqueiam merge

| Etapa | Comando | Timeout | Quando roda |
|-------|---------|---------|-------------|
| Type check | `pnpm tsc --noEmit` | 30s | Todo PR |
| Lint | `pnpm eslint` | 30s | Todo PR |
| Unit + Integration | `pnpm jest --coverage` | 120s | Todo PR |
| E2E iOS (emulador) | `maestro test maestro/flows/` | 600s | Merge na main |
| E2E Android (emulador) | `maestro test maestro/flows/` | 600s | Merge na main |
| Coverage report | Gerado junto com Jest | — | Todo PR |
| EAS Build (preview) | `eas build --profile preview` | — | Tag de release |

> Para pipeline completo, (ver 13-cicd-conventions.md).

---

## Historico de Decisoes

| Data | Decisao | Motivo |
|------|---------|--------|
| 2026-03-24 | Maestro como ferramenta E2E em vez de Detox | Maestro tem sintaxe YAML mais simples, sem necessidade de build nativo separado, melhor integracao com EAS Build e suporte nativo a iOS e Android sem configuracao adicional |
| 2026-03-24 | Cobertura 90%+ obrigatoria em Core SDK (crypto, chunking) | Corrupcao de dados e catastrofica em sistema zero-knowledge — nao ha backend para recuperar dados corrompidos; testes sao a unica salvaguarda |
| 2026-03-24 | MSW para mocking de API em testes de integracao | Permite testar componentes com chamadas HTTP reais sem dependencia de servidor; mais proximo do comportamento real do que mocks de funcao |
