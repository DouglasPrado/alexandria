# Estrategia de Testes

Define a piramide de testes do frontend, as ferramentas utilizadas, os padroes de escrita de testes e as metas de cobertura por camada. Uma estrategia de testes bem definida garante confianca nas releases e velocidade no desenvolvimento.

---

## Piramide de Testes

> Como distribuimos o esforco de teste entre os niveis?

```
        ┌─────────┐
        │   E2E   │  ← Poucos, lentos, alto valor
        ├─────────┤
        │ Integr. │  ← Moderados, fluxos de UI
        ├─────────┤
        │  Unit   │  ← Muitos, rapidos, isolados
        └─────────┘
```

| Nivel | Ferramenta | O que Testa | Meta de Cobertura |
|-------|------------|-------------|-------------------|
| Unit | {{Vitest / Jest}} | Hooks, utils, logica isolada | {{80%+}} |
| Integration | {{Testing Library}} | Componentes + interacoes | {{60%+}} |
| E2E | {{Playwright / Cypress}} | Fluxos completos do usuario | {{Fluxos criticos 100%}} |

---

## Padroes por Tipo de Componente

> O que testar em cada tipo de componente?

| Tipo | O que Testar | O que NAO Testar |
|------|-------------|------------------|
| Primitive (Button, Input) | Rendering, props, acessibilidade | Estilo visual (use Storybook) |
| Composite (Form, Table) | Interacao, validacao, estados | Componentes filhos isolados |
| Feature (UserProfile) | Fluxo completo, API mocking | Implementacao interna |
| Hooks | Retorno, side effects, edge cases | Implementacao do React |

<details>
<summary>Exemplo — Teste de componente e hook</summary>

```tsx
// Teste de componente com Testing Library
describe('LoginForm', () => {
  it('deve exibir erro quando credenciais sao invalidas', async () => {
    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText('Email'), 'user@test.com');
    await userEvent.type(screen.getByLabelText('Senha'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Credenciais invalidas')).toBeInTheDocument();
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

---

## Cobertura e Metas

> Quais sao as metas de cobertura por camada?

| Camada | Meta | Medicao |
|--------|------|---------|
| Domain (models, utils) | 90%+ | {{Vitest coverage}} |
| Application (hooks) | 80%+ | {{Vitest coverage}} |
| UI (components) | 60%+ | {{Testing Library + Vitest}} |
| E2E (fluxos criticos) | 100% | {{Playwright reports}} |

<!-- APPEND:cobertura -->

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
| E2E | `npm run test:e2e` | {{300s}} |
| Coverage report | `npm run test:coverage` | {{90s}} |

> Para pipeline completo, (ver 13-cicd-convencoes.md).

---

## Historico de Decisoes

| Data | Decisao | Motivo |
|------|---------|--------|
| {{YYYY-MM-DD}} | {{Decisao sobre testes}} | {{Justificativa}} |
