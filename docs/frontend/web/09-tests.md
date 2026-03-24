# Estratégia de Testes

Define a pirâmide de testes do frontend web (Next.js 16), as ferramentas utilizadas, os padrões de escrita de testes e as metas de cobertura por camada. Uma estratégia de testes bem definida garante confiança nas releases e velocidade no desenvolvimento.

<!-- do blueprint: 12-testing_strategy.md (pirâmide 70/20/10), 03-requirements.md -->

---

## Pirâmide de Testes

> Como distribuímos o esforço de teste entre os níveis?

```
        ┌─────────┐
        │   E2E   │  ← 10% — fluxos críticos end-to-end (Playwright)
        ├─────────┤
        │ Integr. │  ← 20% — componentes + interações (Testing Library)
        ├─────────┤
        │  Unit   │  ← 70% — hooks, utils, lógica isolada (Vitest)
        └─────────┘
```

| Nível | Ferramenta | O que Testa | Meta de Cobertura |
|-------|------------|-------------|-------------------|
| Unit | Vitest | Hooks, utils, validações, store actions, lógica de domínio | 80%+ |
| Integration | Vitest + Testing Library | Componentes + interações, formulários, estados visuais | 60%+ |
| E2E | Playwright | Fluxos completos do usuário no browser | 100% dos 5 fluxos críticos |

---

## Padrões por Tipo de Componente

> O que testar em cada tipo de componente?

| Tipo | O que Testar | O que NÃO Testar |
|------|-------------|------------------|
| Primitive (Button, Input, Badge) | Renderização, props, variantes, acessibilidade (role, aria) | Estilo visual (use Storybook visual regression) |
| Composite (FormField, Stepper, EmptyState) | Interação entre primitivos, validação, estados (loading, error, empty) | Componentes filhos isolados |
| Feature (GalleryGrid, UploadQueue, NodeList) | Fluxo completo com API mock, estados de loading/error/success, interações do usuário | Implementação interna, detalhes de styling |
| Hooks (useFiles, useUploadQueue) | Retorno, side effects, edge cases, error handling | Implementação do React internals |
| Utils (formatBytes, formatDate, validators) | Input/output, edge cases, tipos de entrada | — (100% testáveis) |
| Stores (authStore, uploadStore) | Actions, transições de estado, persistência | Implementação do Zustand |

<details>
<summary>Exemplo — Teste de componente (Integration)</summary>

```tsx
// features/gallery/components/__tests__/UploadDropzone.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UploadDropzone } from '../UploadDropzone';

describe('UploadDropzone', () => {
  it('deve aceitar arquivos de tipo válido e rejeitar inválidos', async () => {
    const onFilesSelected = vi.fn();
    render(<UploadDropzone onFilesSelected={onFilesSelected} />);

    const input = screen.getByLabelText('Selecionar arquivos');
    const validFile = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
    const invalidFile = new File(['content'], 'script.exe', { type: 'application/x-msdownload' });

    await userEvent.upload(input, [validFile, invalidFile]);

    expect(onFilesSelected).toHaveBeenCalledWith([validFile]);
    expect(screen.getByText('Formato não suportado: .exe')).toBeInTheDocument();
  });
});
```

</details>

<details>
<summary>Exemplo — Teste de hook (Unit)</summary>

```tsx
// features/auth/hooks/__tests__/useAuth.test.ts
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '@/store/authStore';

describe('authStore', () => {
  beforeEach(() => useAuthStore.setState({ member: null, token: null, isAuthenticated: false }));

  it('deve autenticar membro após login', async () => {
    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.login({ email: 'admin@prado.family', password: 'secret' });
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.member?.role).toBe('admin');
  });

  it('deve limpar estado após logout', () => {
    useAuthStore.setState({ member: { id: '1', role: 'admin' }, isAuthenticated: true });
    const { result } = renderHook(() => useAuthStore());

    act(() => result.current.logout());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.member).toBeNull();
  });
});
```

</details>

<details>
<summary>Exemplo — Teste de store (Unit)</summary>

```tsx
// store/__tests__/uploadStore.test.ts
import { useUploadStore } from '@/store/uploadStore';

describe('uploadStore', () => {
  beforeEach(() => useUploadStore.setState({ items: [] }));

  it('deve adicionar arquivos à fila com status queued', () => {
    const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
    useUploadStore.getState().addFiles([file]);

    const items = useUploadStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].status).toBe('queued');
  });

  it('deve transicionar de queued para uploading quando slot disponível', () => {
    const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
    useUploadStore.getState().addFiles([file]);
    useUploadStore.getState().startNext();

    expect(useUploadStore.getState().items[0].status).toBe('uploading');
  });

  it('deve limitar uploads concorrentes a 3', () => {
    const files = Array.from({ length: 5 }, (_, i) =>
      new File(['content'], `photo${i}.jpg`, { type: 'image/jpeg' })
    );
    useUploadStore.getState().addFiles(files);

    // Start all possible
    for (let i = 0; i < 5; i++) useUploadStore.getState().startNext();

    const uploading = useUploadStore.getState().items.filter(i => i.status === 'uploading');
    expect(uploading).toHaveLength(3);
  });
});
```

</details>

---

## Testes E2E — Fluxos Críticos

> Quais fluxos são testados end-to-end via Playwright?

<!-- do blueprint: 07-critical_flows.md (5 fluxos), 12-testing_strategy.md (E2E) -->

| # | Fluxo | Passos Testados | Critério de Sucesso |
|---|-------|-----------------|---------------------|
| 1 | Criação de Cluster | Setup → nome → seed exibida → confirma checkbox → dashboard | Dashboard carrega com empty state |
| 2 | Upload de Arquivo | Login → dashboard → seleciona foto → upload → processing → thumbnail na galeria | Arquivo com status `ready` e thumbnail visível |
| 3 | Visualizar e Baixar | Login → galeria → clica thumbnail → lightbox → metadados → download | Arquivo baixado com conteúdo correto |
| 4 | Convidar Membro | Login admin → membros → convite → copiar link → abrir em outra sessão → aceitar | Novo membro listado com role correto |
| 5 | Recovery via Seed | Acessa /recovery → insere 12 palavras → stepper completa → dashboard | Dashboard com arquivos recuperados |

<details>
<summary>Exemplo — E2E Upload de Arquivo</summary>

```typescript
// e2e/upload.spec.ts
import { test, expect } from '@playwright/test';

test('upload de foto deve aparecer na galeria', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'admin@prado.family');
  await page.fill('[name="password"]', 'testpassword');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/dashboard');

  // Upload
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('e2e/fixtures/sample-photo.jpg');

  // Aguarda processing
  await expect(page.locator('[data-testid="upload-queue-item"]')).toContainText('processing');

  // Aguarda ready
  await expect(page.locator('[data-testid="gallery-grid"] img')).toBeVisible({ timeout: 30000 });
});
```

</details>

---

## Cobertura e Metas

> Quais são as metas de cobertura por camada?

| Camada | Meta | Medição |
|--------|------|---------|
| Domain (types, utils, validators) | 90%+ | Vitest coverage (v8) |
| Application (hooks, stores) | 80%+ | Vitest coverage |
| UI (components) | 60%+ | Testing Library + Vitest |
| E2E (fluxos críticos) | 100% dos 5 fluxos | Playwright reports |

### Áreas de Cobertura Obrigatória

| Área | Justificativa |
|------|---------------|
| uploadStore (transições de estado) | Fila de upload é o fluxo mais complexo do frontend; bugs = perda de dados do usuário |
| authStore (login, logout, role check) | Segurança; bugs = acesso não autorizado |
| File validators (tipo, tamanho) | Primeira barreira contra uploads inválidos |
| SeedPhraseInput (validação BIP-39) | Recovery depende de input correto; bugs = recovery falho |
| Middleware de auth (redirect logic) | Proteção de rotas; bugs = exposição de dados |

<!-- APPEND:cobertura -->

---

## Integração com CI

> Testes rodam automaticamente no pipeline?

- [x] Testes unitários rodam em cada PR
- [x] Testes de integração rodam em cada PR
- [x] E2E roda antes de merge na main
- [x] Cobertura é reportada no PR
- [x] Testes falhos bloqueiam merge

<!-- do blueprint: 12-testing_strategy.md (pipeline CI) -->

| Etapa | Comando | Timeout | Gatilho | Bloqueante |
|-------|---------|---------|---------|------------|
| Lint + Type Check | `pnpm lint && pnpm typecheck` | 60s | Push / PR | Sim |
| Unit + Integration | `pnpm test` | 120s | Push / PR | Sim |
| Coverage report | `pnpm test:coverage` | 120s | PR | Sim (threshold) |
| Build | `pnpm build` | 180s | PR | Sim |
| E2E | `pnpm test:e2e` | 300s | Merge na main | Sim |

### Thresholds de Cobertura

```json
{
  "coverageThreshold": {
    "global": { "branches": 70, "functions": 75, "lines": 75, "statements": 75 },
    "src/store/": { "branches": 80, "functions": 85, "lines": 85 },
    "src/features/*/hooks/": { "branches": 80, "functions": 80, "lines": 80 }
  }
}
```

> Para pipeline completo, (ver [13-cicd-conventions.md](13-cicd-conventions.md)).

---

## Histórico de Decisões

| Data | Decisão | Motivo |
|------|---------|--------|
| 2026-03-24 | Vitest em vez de Jest | Compatibilidade nativa com ESM e Vite; HMR nos testes; mais rápido para projetos Next.js |
| 2026-03-24 | Playwright em vez de Cypress | Suporte nativo a múltiplos browsers, melhor performance, API async/await nativa |
| 2026-03-24 | Testing Library (não Enzyme) | Testa comportamento do usuário, não implementação; alinhado com filosofia React moderna |
| 2026-03-24 | Coverage obrigatória em stores e hooks | Upload queue e auth são fluxos críticos; bugs nessas áreas têm impacto direto na experiência |
| 2026-03-24 | E2E apenas nos 5 fluxos críticos | Time de 1 pessoa; foco no que tem maior impacto; pirâmide 70/20/10 do blueprint |
