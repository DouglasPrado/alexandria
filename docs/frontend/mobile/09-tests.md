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

| Nivel | Ferramenta | O que Testa | Meta de Cobertura |
|-------|------------|-------------|-------------------|
| Unit | {{Jest / Vitest}} | Hooks, utils, logica isolada | {{80%+}} |
| Integration | {{React Native Testing Library}} | Componentes + interacoes | {{60%+}} |
| E2E | {{Detox / Maestro}} | Fluxos completos no dispositivo/emulador | {{Fluxos criticos 100%}} |

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

| Camada | Meta | Medicao |
|--------|------|---------|
| Domain (models, utils) | 90%+ | {{Jest coverage}} |
| Application (hooks) | 80%+ | {{Jest coverage}} |
| UI (components) | 60%+ | {{RNTL + Jest}} |
| E2E (fluxos criticos) | 100% | {{Detox/Maestro reports}} |

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

- [ ] Testes unitarios rodam em cada PR
- [ ] Testes de integracao rodam em cada PR
- [ ] E2E roda antes de merge na main
- [ ] Cobertura e reportada no PR
- [ ] Testes falhos bloqueiam merge

| Etapa | Comando | Timeout |
|-------|---------|---------|
| Unit + Integration | `npm run test` | {{60s}} |
| E2E (iOS) | `npm run test:e2e:ios` | {{600s}} |
| E2E (Android) | `npm run test:e2e:android` | {{600s}} |
| Coverage report | `npm run test:coverage` | {{90s}} |

> Para pipeline completo, (ver 13-cicd-conventions.md).

---

## Historico de Decisoes

| Data | Decisao | Motivo |
|------|---------|--------|
| {{YYYY-MM-DD}} | {{Decisao sobre testes}} | {{Justificativa}} |
