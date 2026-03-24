# Estrategia de Testes

Define a piramide de testes do frontend desktop, as ferramentas utilizadas, os padroes de escrita de testes e as metas de cobertura por camada. Uma estrategia de testes bem definida garante confianca nas releases e velocidade no desenvolvimento.

---

## Piramide de Testes

> Como distribuimos o esforco de teste entre os niveis?

```
        ┌─────────┐
        │   E2E   │  ← Poucos, lentos, alto valor
        ├─────────┤
        │  IPC    │  ← Testes de comunicacao entre processos
        ├─────────┤
        │ Integr. │  ← Moderados, fluxos de UI
        ├─────────┤
        │  Unit   │  ← Muitos, rapidos, isolados
        └─────────┘
```

| Nivel | Ferramenta | O que Testa | Meta de Cobertura |
|-------|------------|-------------|-------------------|
| Unit | {{Vitest / Jest}} | Hooks, utils, logica isolada | {{80%+}} |
| Integration | {{Testing Library}} | Componentes + interacoes no renderer | {{60%+}} |
| IPC | {{Vitest + mocks}} | Handlers IPC, comunicacao main↔renderer | {{90%+}} |
| E2E | {{Playwright + Electron / Spectron}} | Fluxos completos do usuario na app desktop | {{Fluxos criticos 100%}} |

---

## Testes de IPC Handlers

> Como testamos a comunicacao entre main process e renderer process?

| O que Testar | Ferramenta | Estrategia |
|-------------|------------|------------|
| IPC handlers no main | Vitest | Mock do `event` object, testar handler isolado |
| IPC calls no renderer | Vitest + mock do `window.electronAPI` | Mock da bridge, verificar chamadas |
| Tipagem dos canais IPC | TypeScript strict | Canais tipados em `shared/ipc-channels.ts` |
| Validacao de payloads | Vitest + Zod | Validar schema de entrada/saida dos handlers |

<details>
<summary>Exemplo — Teste de IPC handler</summary>

```typescript
// Teste de handler no main process
describe('user IPC handlers', () => {
  it('deve retornar usuario por ID', async () => {
    const mockUser = { id: '1', name: 'Test User' };
    vi.spyOn(userService, 'getById').mockResolvedValue(mockUser);

    const result = await handleGetUser({} as IpcMainInvokeEvent, '1');

    expect(result).toEqual(mockUser);
    expect(userService.getById).toHaveBeenCalledWith('1');
  });
});

// Teste de IPC call no renderer
describe('ipcClient', () => {
  it('deve invocar canal correto para buscar usuario', async () => {
    const mockInvoke = vi.fn().mockResolvedValue({ id: '1', name: 'Test' });
    window.electronAPI = { invoke: mockInvoke };

    await ipcClient.getUser('1');

    expect(mockInvoke).toHaveBeenCalledWith('user:get', '1');
  });
});
```

</details>

---

## Padroes por Tipo de Componente

> O que testar em cada tipo de componente?

| Tipo | O que Testar | O que NAO Testar |
|------|-------------|------------------|
| Primitive (Button, Input) | Rendering, props, acessibilidade | Estilo visual (use Storybook) |
| Composite (Form, Table) | Interacao, validacao, estados | Componentes filhos isolados |
| Desktop (TitleBar, FileDialog) | Chamadas IPC corretas, estados visuais | Comportamento nativo do OS |
| Feature (UserProfile) | Fluxo completo, API/IPC mocking | Implementacao interna |
| Hooks | Retorno, side effects, edge cases | Implementacao do React |
| IPC Handlers (main) | Logica de negocio, validacao, erros | Internals do Electron/Tauri |

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

## Testes E2E Desktop

> Como testamos a aplicacao desktop de ponta a ponta?

| Ferramenta | Descricao | Quando Usar |
|------------|-----------|-------------|
| Playwright + Electron | Playwright com suporte nativo a Electron | Fluxos completos, interacoes de janela |
| Spectron (legado) | WebDriverIO para Electron | Projetos com Spectron existente |
| Tauri Driver | WebDriver para Tauri | Apps Tauri |

<details>
<summary>Exemplo — E2E com Playwright + Electron</summary>

```typescript
import { _electron as electron } from 'playwright';

describe('App E2E', () => {
  let app: ElectronApplication;
  let page: Page;

  beforeAll(async () => {
    app = await electron.launch({ args: ['.'] });
    page = await app.firstWindow();
  });

  afterAll(async () => {
    await app.close();
  });

  it('deve exibir janela principal', async () => {
    const title = await page.title();
    expect(title).toBe('Minha Aplicacao');
  });

  it('deve navegar para configuracoes via menu', async () => {
    await app.evaluate(({ Menu }) => {
      Menu.getApplicationMenu()?.getMenuItemById('settings')?.click();
    });
    await expect(page.locator('h1')).toHaveText('Configuracoes');
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
| IPC Handlers (main) | 90%+ | {{Vitest coverage}} |
| E2E (fluxos criticos) | 100% | {{Playwright reports}} |

<!-- APPEND:cobertura -->

---

## Integracao com CI

> Testes rodam automaticamente no pipeline?

- [ ] Testes unitarios rodam em cada PR
- [ ] Testes de integracao rodam em cada PR
- [ ] Testes de IPC rodam em cada PR
- [ ] E2E roda antes de merge na main
- [ ] Cobertura e reportada no PR
- [ ] Testes falhos bloqueiam merge

| Etapa | Comando | Timeout |
|-------|---------|---------|
| Unit + Integration | `npm run test` | {{60s}} |
| IPC Tests | `npm run test:ipc` | {{30s}} |
| E2E | `npm run test:e2e` | {{300s}} |
| Coverage report | `npm run test:coverage` | {{90s}} |

> Para pipeline completo, (ver 13-cicd-convencoes.md).

---

## Historico de Decisoes

| Data | Decisao | Motivo |
|------|---------|--------|
| {{YYYY-MM-DD}} | {{Decisao sobre testes}} | {{Justificativa}} |
