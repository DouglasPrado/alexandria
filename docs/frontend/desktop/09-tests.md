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

<!-- do blueprint: 12-testing_strategy.md — piramide 70/20/10; desktop/08-flows.md — 5 fluxos criticos; 02-architecture_principles.md — Embrace Failure -->

| Nivel | Ferramenta | O que Testa | Meta de Cobertura |
|-------|------------|-------------|-------------------|
| Unit | Vitest | Hooks, utils, logica de dominio, IPC stubs | 80%+ (90%+ em crypto/vault/chunking) |
| Integration | Testing Library + Vitest | Componentes + interacoes no renderer com IPC mockado | 60%+ |
| IPC | Vitest + mock `window.electronAPI` | Handlers IPC main↔renderer: vault, sync, cluster | 90%+ |
| E2E | Playwright + `_electron` | Fluxos completos na app Electron real (unlock, sync, recovery) | 5 fluxos criticos: 100% |

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
// Teste de handler vault:unlock no main process
describe('vault IPC handlers', () => {
  it('deve desbloquear vault com senha correta', async () => {
    const mockMember = { id: 'mem-1', name: 'Douglas', role: 'admin', clusterId: 'cls-1' };
    vi.spyOn(vaultManager, 'unlock').mockResolvedValue(mockMember);

    const result = await handleVaultUnlock({} as IpcMainInvokeEvent, 'senha-correta');

    expect(result).toEqual({ success: true, member: mockMember });
    expect(vaultManager.unlock).toHaveBeenCalledWith('senha-correta');
  });

  it('deve retornar erro com senha incorreta', async () => {
    vi.spyOn(vaultManager, 'unlock').mockRejectedValue(new Error('Invalid password'));

    const result = await handleVaultUnlock({} as IpcMainInvokeEvent, 'senha-errada');

    expect(result).toEqual({ success: false, error: 'Invalid password' });
  });
});

// Teste de IPC call vault:unlock no renderer
describe('ipcClient vault', () => {
  it('deve invocar canal correto para desbloquear vault', async () => {
    const mockInvoke = vi.fn().mockResolvedValue({ success: true, member: { id: 'mem-1' } });
    window.electronAPI = { invoke: mockInvoke };

    await ipcClient.vaultUnlock('minha-senha');

    expect(mockInvoke).toHaveBeenCalledWith('vault:unlock', 'minha-senha');
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

describe('Alexandria E2E — Vault Unlock + Gallery', () => {
  let app: ElectronApplication;
  let page: Page;

  beforeAll(async () => {
    app = await electron.launch({
      args: ['.'],
      env: { ...process.env, NODE_ENV: 'test' },
    });
    page = await app.firstWindow();
  });

  afterAll(async () => {
    await app.close();
  });

  it('deve exibir tela de desbloqueio do vault na inicializacao', async () => {
    await expect(page.locator('[data-testid="unlock-screen"]')).toBeVisible();
  });

  it('deve desbloquear vault e redirecionar para galeria', async () => {
    await page.locator('[data-testid="vault-password-input"]').fill('senha-de-teste');
    await page.locator('[data-testid="unlock-button"]').click();

    await expect(page.locator('[data-testid="gallery-view"]')).toBeVisible({ timeout: 5000 });
  });

  it('deve exibir status do sync na sidebar apos unlock', async () => {
    await expect(page.locator('[data-testid="sync-status-indicator"]')).toBeVisible();
  });

  it('deve abrir configuracoes via menu Exibir', async () => {
    await app.evaluate(({ Menu }) => {
      Menu.getApplicationMenu()?.getMenuItemById('settings')?.click();
    });
    await expect(page.locator('[data-testid="settings-page"]')).toBeVisible();
  });
});
```

</details>

---

## Cobertura e Metas

> Quais sao as metas de cobertura por camada?

| Camada | Meta | Medicao |
|--------|------|---------|
| Domain (models, utils) | 90%+ | Vitest coverage (`npm run test:coverage`) |
| Application (hooks) | 80%+ | Vitest coverage (`npm run test:coverage`) |
| UI (components) | 60%+ | Testing Library + Vitest (`npm run test:coverage`) |
| IPC Handlers (main) | 90%+ | Vitest coverage (`npm run test:ipc`) |
| E2E (fluxos criticos) | 100% | Playwright reports (`npm run test:e2e`) |

<!-- APPEND:cobertura -->

---

## Integracao com CI

> Testes rodam automaticamente no pipeline?

- [x] Testes unitarios rodam em cada PR
- [x] Testes de integracao rodam em cada PR
- [x] Testes de IPC rodam em cada PR
- [x] E2E roda antes de merge na main
- [x] Cobertura e reportada no PR
- [x] Testes falhos bloqueiam merge

| Etapa | Comando | Timeout |
|-------|---------|---------|
| Unit + Integration | `npm run test` | 60s |
| IPC Tests | `npm run test:ipc` | 30s |
| E2E | `npm run test:e2e` | 300s |
| Coverage report | `npm run test:coverage` | 90s |

> Para pipeline completo, (ver 13-cicd-convencoes.md).

---

## Historico de Decisoes

| Data | Decisao | Motivo |
|------|---------|--------|
| 2026-03-24 | Vitest para unit/IPC, Playwright+Electron para E2E | Vitest e nativo ao electron-vite e suporta mocking de IPC sem setup extra; Playwright tem suporte oficial a `_electron` API |
