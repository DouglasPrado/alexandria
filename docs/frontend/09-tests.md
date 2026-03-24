# Estrategia de Testes

Define a piramide de testes do frontend, as ferramentas utilizadas, os padroes de escrita de testes e as metas de cobertura por camada. Uma estrategia de testes bem definida garante confianca nas releases e velocidade no desenvolvimento.

<!-- do blueprint: 12-testing_strategy.md (piramide 70/20/10) + 03-requirements.md (criterios de aceite) -->

---

## Piramide de Testes

> Como distribuimos o esforco de teste entre os niveis?

```
        ┌─────────┐
        │   E2E   │  ← 10% — Fluxos criticos end-to-end (Playwright)
        ├─────────┤
        │ Integr. │  ← 20% — Componentes + hooks + API mocking
        ├─────────┤
        │  Unit   │  ← 70% — Utils, domain rules, stores, pure logic
        └─────────┘
```

| Nivel | Ferramenta | O que Testa | Meta de Cobertura |
|-------|------------|-------------|-------------------|
| Unit | Vitest | Hooks, utils, domain rules, stores Zustand, query keys, formatters | 80%+ |
| Integration | Vitest + Testing Library | Componentes com interacao, formularios, fluxos de UI, API mocking via MSW | 60%+ |
| E2E | Playwright | 5 fluxos criticos end-to-end contra app real (Docker Compose) | 100% dos fluxos criticos |
| Visual | Storybook + Chromatic (opcional) | Regressao visual de componentes primitivos e compostos | Componentes do design system |

---

## Ferramentas

| Ferramenta | Proposito | Versao |
|------------|-----------|--------|
| Vitest | Test runner + coverage (unit e integration) | ^3.x |
| @testing-library/react | Render e interacao de componentes | ^16.x |
| @testing-library/user-event | Simulacao de interacoes de usuario (click, type, drag) | ^14.x |
| MSW (Mock Service Worker) | Mock de API HTTP em testes de integracao (handlers reutilizaveis) | ^2.x |
| Playwright | Testes E2E contra app real em browser | ^1.50+ |
| @faker-js/faker | Geracao de dados de teste (nomes, emails, hashes) | ^9.x |
| Zod | Validacao de DTOs em testes (mesmos schemas da app) | ^3.x |

### Configuracao

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.stories.{ts,tsx}', 'src/test/**'],
      thresholds: {
        branches: 70,
        functions: 70,
        lines: 80,
        statements: 80,
      },
    },
  },
});
```

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => { cleanup(); server.resetHandlers(); });
afterAll(() => server.close());
```

---

## Padroes por Tipo de Componente

> O que testar em cada tipo de componente?

### Primitive Components (shared/components/ui/)

| O que Testar | O que NAO Testar |
|-------------|------------------|
| Rendering com props default | Estilo visual (use Storybook) |
| Variantes (primary, destructive, ghost) | Layout CSS |
| Estados (disabled, loading) | Implementacao interna do Radix UI |
| Acessibilidade (aria-*, role, keyboard) | |
| Eventos (onClick, onChange) | |

```tsx
// shared/components/ui/__tests__/Button.test.tsx
describe('Button', () => {
  it('renders with default variant', () => {
    render(<Button>Salvar</Button>);
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
  });

  it('shows spinner when loading', () => {
    render(<Button loading>Salvando</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });

  it('is accessible via keyboard', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Acao</Button>);
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledOnce();
  });
});
```

### Composite Components (shared/components/)

| O que Testar | O que NAO Testar |
|-------------|------------------|
| Interacao entre primitivos | Cada primitivo isolado (ja testado) |
| Validacao de formularios | Mock de API (testar no hook) |
| Estados compostos (empty, loading, error) | |
| Navegacao por teclado (Tab order, Esc) | |

```tsx
// shared/components/__tests__/FormDialog.test.tsx
describe('FormDialog', () => {
  it('submits form and closes on success', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <FormDialog open title="Convidar Membro" onSubmit={onSubmit}>
        <FormField label="Email" name="email" required />
      </FormDialog>
    );

    await userEvent.type(screen.getByLabelText('Email'), 'tio@familia.com');
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(onSubmit).toHaveBeenCalledWith({ email: 'tio@familia.com' });
  });
});
```

### Feature Components (features/xxx/components/)

| O que Testar | O que NAO Testar |
|-------------|------------------|
| Fluxo completo da feature (render → interact → assert) | Implementacao interna de hooks |
| API mocking via MSW (success + error) | Chamadas HTTP reais |
| Loading, error e empty states | Componentes primitivos (ja testados) |
| Integracao com TanStack Query (data flow) | |

```tsx
// features/gallery/__tests__/GalleryGrid.test.tsx
describe('GalleryGrid', () => {
  it('renders files from API', async () => {
    server.use(
      http.get('*/files', () =>
        HttpResponse.json({
          data: [mockFile({ originalName: 'praia.webp', status: 'ready' })],
          nextCursor: null,
        })
      )
    );

    render(<GalleryGrid clusterId="cluster-1" filters={{}} />, {
      wrapper: createQueryWrapper(),
    });

    expect(await screen.findByText('praia.webp')).toBeInTheDocument();
  });

  it('shows empty state when no files', async () => {
    server.use(
      http.get('*/files', () =>
        HttpResponse.json({ data: [], nextCursor: null })
      )
    );

    render(<GalleryGrid clusterId="cluster-1" filters={{}} />, {
      wrapper: createQueryWrapper(),
    });

    expect(await screen.findByText(/Faca seu primeiro upload/)).toBeInTheDocument();
  });

  it('shows error state on API failure', async () => {
    server.use(http.get('*/files', () => HttpResponse.error()));

    render(<GalleryGrid clusterId="cluster-1" filters={{}} />, {
      wrapper: createQueryWrapper(),
    });

    expect(await screen.findByText(/Nao foi possivel carregar/)).toBeInTheDocument();
  });
});
```

### Hooks (features/xxx/hooks/ e shared/hooks/)

| O que Testar | O que NAO Testar |
|-------------|------------------|
| Retorno (data, loading, error) | Implementacao interna do React |
| Side effects (mutations, invalidations) | TanStack Query internals |
| Edge cases (empty, null, timeout) | |
| Parametros e filtros | |

```tsx
// features/gallery/hooks/__tests__/useFiles.test.ts
describe('useFiles', () => {
  it('fetches files with filters', async () => {
    server.use(
      http.get('*/files', ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('media_type')).toBe('photo');
        return HttpResponse.json({
          data: [mockFile({ mediaType: 'photo' })],
          nextCursor: null,
        });
      })
    );

    const { result } = renderHook(
      () => useFiles('cluster-1', { mediaType: 'photo' }),
      { wrapper: createQueryWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages[0].data).toHaveLength(1);
  });
});
```

### Stores Zustand (shared/store/)

| O que Testar | O que NAO Testar |
|-------------|------------------|
| State transitions (login → authenticated) | Zustand internals |
| Actions (setAuth, logout, addFiles) | Persist middleware |
| Computed values (isAuthenticated) | |
| Edge cases (double login, empty queue) | |

```tsx
// shared/store/__tests__/auth-store.test.ts
describe('authStore', () => {
  beforeEach(() => useAuthStore.setState({
    member: null, accessToken: null, isAuthenticated: false,
  }));

  it('sets auth state on login', () => {
    const member = mockMember({ role: 'admin' });
    useAuthStore.getState().setAuth(member, 'token-123', 'refresh-456');

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().member?.role).toBe('admin');
    expect(useAuthStore.getState().accessToken).toBe('token-123');
  });

  it('clears state on logout', () => {
    useAuthStore.getState().setAuth(mockMember(), 'token', 'refresh');
    useAuthStore.getState().logout();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().member).toBeNull();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});
```

### Domain Rules (shared/domain/rules/)

| O que Testar | O que NAO Testar |
|-------------|------------------|
| Regras de negocio client-side | Regras que so existem no backend |
| Validacoes (canUpload, isReplicationHealthy) | |
| Edge cases (limites, zero, null) | |

```tsx
// shared/domain/rules/__tests__/upload-rules.test.ts
describe('canUpload', () => {
  it('returns false when fewer than 3 nodes online', () => {
    expect(canUpload({ activeNodes: 2, memberRole: 'member' })).toBe(false);
  });

  it('returns false for reader role', () => {
    expect(canUpload({ activeNodes: 5, memberRole: 'reader' })).toBe(false);
  });

  it('returns true for member with 3+ nodes', () => {
    expect(canUpload({ activeNodes: 3, memberRole: 'member' })).toBe(true);
  });
});
```

---

## Testes E2E (Playwright)

> Quais fluxos criticos sao cobertos end-to-end?

<!-- do blueprint: 07-critical_flows.md + 08-use_cases.md -->

### Setup

Testes E2E rodam contra a app completa via Docker Compose (orquestrador NestJS + PostgreSQL + Redis + MinIO + Next.js).

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'mobile', use: { ...devices['iPhone 14'] } },
  ],
  webServer: {
    command: 'docker compose -f docker-compose.test.yml up',
    url: 'http://localhost:3000',
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
```

### Fluxos Criticos

| # | Fluxo | Arquivo | Criterios de Aceite |
|---|-------|---------|---------------------|
| 1 | Criar Cluster | `e2e/cluster-setup.spec.ts` | Wizard completo → seed exibida → checkbox confirmacao → cluster ativo → redirect /gallery |
| 2 | Upload de Arquivo | `e2e/upload.spec.ts` | Selecionar foto → upload progress → processing status → thumbnail na galeria (status ready) |
| 3 | Galeria e Download | `e2e/gallery.spec.ts` | Grid com thumbnails → click para preview → download → arquivo salvo com nome original |
| 4 | Convidar Membro | `e2e/invite.spec.ts` | Admin gera convite → link com token → convidado aceita → aparece na lista de membros |
| 5 | Recovery via Seed | `e2e/recovery.spec.ts` | Inserir 12 palavras → validacao BIP-39 → progress steps → relatorio → galeria recuperada |

```typescript
// e2e/upload.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Upload de Arquivo', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('upload de foto aparece na galeria', async ({ page }) => {
    await page.goto('/gallery');
    await page.getByRole('button', { name: /upload/i }).click();

    // Drag-and-drop de arquivo de teste
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./e2e/fixtures/photo-sample.jpg');

    // Aguardar upload progress
    await expect(page.getByText(/uploading/i)).toBeVisible();

    // Aguardar processing (polling)
    await expect(page.getByText(/processing/i)).toBeVisible({ timeout: 30_000 });

    // Aguardar ready
    await expect(page.getByText(/processado com sucesso/i)).toBeVisible({ timeout: 60_000 });

    // Verificar na galeria
    await page.goto('/gallery');
    await expect(page.getByText('photo-sample.jpg')).toBeVisible();
  });

  test('rejeita arquivo maior que o limite', async ({ page }) => {
    await page.goto('/gallery');
    await page.getByRole('button', { name: /upload/i }).click();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./e2e/fixtures/oversized-file.bin');

    await expect(page.getByText(/muito grande/i)).toBeVisible();
  });

  test('desabilita upload quando menos de 3 nos ativos', async ({ page }) => {
    // Parar 2 nos de teste para ficar com < 3
    await stopTestNodes(2);

    await page.goto('/gallery');
    await page.getByRole('button', { name: /upload/i }).click();
    await expect(page.getByText(/Minimo 3 nos/i)).toBeVisible();

    // Restaurar nos
    await startTestNodes(2);
  });
});
```

### Fixtures de teste

```
e2e/
  fixtures/
    photo-sample.jpg       # Foto JPEG 2MB para teste de upload
    video-sample.mp4       # Video MP4 10MB para teste de pipeline
    document-sample.pdf    # PDF 500KB para teste de documento
    oversized-file.bin     # Arquivo > limite para teste de rejeicao
    seed-phrase.txt        # 12 palavras validas BIP-39 para teste de recovery
```

---

## Cobertura e Metas

> Quais sao as metas de cobertura por camada?

| Camada | Diretorio | Meta | Medicao |
|--------|-----------|------|---------|
| Domain (models, rules) | shared/domain/ | 90%+ | Vitest coverage (v8) |
| Stores (Zustand) | shared/store/ | 90%+ | Vitest coverage |
| Hooks (TanStack Query wrappers) | features/*/hooks/ | 80%+ | Vitest coverage |
| Utils (formatters, helpers) | shared/utils/ | 90%+ | Vitest coverage |
| Lib (api-client, auth, query-keys) | shared/lib/ | 80%+ | Vitest coverage |
| Feature Components | features/*/components/ | 60%+ | Vitest + Testing Library |
| Shared Components | shared/components/ | 60%+ | Vitest + Testing Library |
| E2E (fluxos criticos) | e2e/ | 100% (5 fluxos) | Playwright reports |

### Areas com cobertura obrigatoria (>90%)

- `shared/domain/rules/` — regras de negocio client-side (canUpload, isReplicationHealthy, validateSeedPhrase)
- `shared/store/auth-store.ts` — estado de autenticacao (login, logout, token management)
- `shared/store/upload-store.ts` — fila de uploads (addFiles, updateProgress, setStatus)
- `shared/lib/query-keys.ts` — chaves de cache centralizadas (determinismo)
- `shared/utils/` — formatters puros (formatBytes, formatDate, cn)

### Areas com cobertura reduzida (ok <60%)

- `app/` — paginas Next.js (testadas via E2E, nao unit)
- Componentes puramente visuais sem logica (Divider, Skeleton sem estado)

<!-- APPEND:cobertura -->

---

## MSW (Mock Service Worker) — Handlers Compartilhados

> Como padronizamos os mocks de API entre testes?

```typescript
// src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export const handlers = [
  // Files
  http.get(`${API}/files`, () =>
    HttpResponse.json({
      data: [mockFile(), mockFile({ mediaType: 'video' })],
      nextCursor: null,
    })
  ),
  http.get(`${API}/files/:id`, ({ params }) =>
    HttpResponse.json(mockFile({ id: params.id as string }))
  ),
  http.post(`${API}/files/upload`, () =>
    HttpResponse.json(mockFile({ status: 'processing' }), { status: 201 })
  ),

  // Auth
  http.post(`${API}/auth/login`, () =>
    HttpResponse.json({
      member: mockMember({ role: 'admin' }),
      accessToken: 'test-token',
      refreshToken: 'test-refresh',
    })
  ),

  // Nodes
  http.get(`${API}/nodes`, () =>
    HttpResponse.json([mockNode(), mockNode({ type: 's3' }), mockNode({ type: 'r2' })])
  ),

  // Alerts
  http.get(`${API}/alerts`, () =>
    HttpResponse.json({
      data: [mockAlert({ severity: 'critical' })],
      nextCursor: null,
    })
  ),

  // Cluster Health
  http.get(`${API}/cluster/health`, () =>
    HttpResponse.json({
      nodesOnline: 4, nodesTotal: 5,
      capacityUsed: 50_000_000_000, capacityTotal: 200_000_000_000,
      replicationHealthy: 98.5, filesTotal: 1234, alertsActive: 2,
    })
  ),

  // Members
  http.get(`${API}/members`, () =>
    HttpResponse.json([mockMember({ role: 'admin' }), mockMember({ role: 'member' })])
  ),
  http.get(`${API}/members/me`, () =>
    HttpResponse.json(mockMember({ role: 'admin' }))
  ),
];
```

### Factories (mocks tipados)

```typescript
// src/test/mocks/factories.ts
import { faker } from '@faker-js/faker';
import type { FileDTO, MemberDTO, NodeDTO, AlertDTO } from '@alexandria/types';

export function mockFile(overrides?: Partial<FileDTO>): FileDTO {
  return {
    id: faker.string.uuid(),
    originalName: faker.system.fileName({ extensionCount: 1 }),
    mediaType: 'photo',
    originalSize: faker.number.int({ min: 100_000, max: 50_000_000 }),
    optimizedSize: faker.number.int({ min: 50_000, max: 600_000 }),
    contentHash: faker.string.hexadecimal({ length: 64 }),
    metadata: null,
    status: 'ready',
    createdAt: faker.date.recent().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides,
  };
}

export function mockMember(overrides?: Partial<MemberDTO>): MemberDTO {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    role: 'member',
    joinedAt: faker.date.past().toISOString(),
    ...overrides,
  };
}

export function mockNode(overrides?: Partial<NodeDTO>): NodeDTO {
  return {
    id: faker.string.uuid(),
    type: 'local',
    name: faker.commerce.productName(),
    totalCapacity: 100_000_000_000,
    usedCapacity: faker.number.int({ min: 0, max: 80_000_000_000 }),
    status: 'online',
    endpoint: faker.internet.url(),
    lastHeartbeat: new Date().toISOString(),
    tier: 'warm',
    ...overrides,
  };
}

export function mockAlert(overrides?: Partial<AlertDTO>): AlertDTO {
  return {
    id: faker.string.uuid(),
    type: 'node_offline',
    message: 'No "NAS Sala" offline ha 1 hora',
    severity: 'warning',
    resolved: false,
    createdAt: faker.date.recent().toISOString(),
    resolvedAt: null,
    ...overrides,
  };
}
```

---

## Integracao com CI

> Testes rodam automaticamente no pipeline?

- [x] Testes unitarios rodam em cada PR
- [x] Testes de integracao rodam em cada PR
- [x] E2E roda antes de merge na main
- [x] Cobertura e reportada no PR
- [x] Testes falhos bloqueiam merge

| Etapa | Comando | Gatilho | Timeout | Bloqueante? |
|-------|---------|---------|---------|-------------|
| Lint + Type Check | `turbo lint && turbo typecheck` | Push / PR | 60s | Sim |
| Unit + Integration | `turbo test --filter=web` | Push / PR | 120s | Sim |
| Coverage Report | `turbo test:coverage --filter=web` | PR | 90s | Sim (threshold) |
| E2E | `turbo test:e2e --filter=web` | Merge na main | 300s | Sim |
| Visual Regression | `turbo storybook:test` | PR (componentes alterados) | 120s | Nao (report) |

### Pipeline CI (GitHub Actions)

```yaml
# .github/workflows/frontend-tests.yml
name: Frontend Tests
on:
  pull_request:
    paths: ['apps/web/**', 'packages/**']

jobs:
  unit-integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: turbo lint --filter=web
      - run: turbo typecheck --filter=web
      - run: turbo test:coverage --filter=web
      - uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: apps/web/coverage/

  e2e:
    runs-on: ubuntu-latest
    if: github.event.pull_request.base.ref == 'main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: docker compose -f docker-compose.test.yml up -d
      - run: turbo test:e2e --filter=web
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: apps/web/playwright-report/
```

### Scripts package.json

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

> **Tempo maximo do pipeline CI (PR):** <5 min (lint + typecheck + unit + integration)

> Para pipeline completo, (ver 13-cicd-conventions.md).

---

## Convencoes de Teste

### Nomeacao

- Arquivos de teste: `ComponentName.test.tsx`, `useHook.test.ts`, `util.test.ts`
- Testes E2E: `flow-name.spec.ts`
- Descrever **comportamento**, nao implementacao: "deve exibir erro quando credenciais sao invalidas" (nao "deve chamar setError")

### Organizacao

```
src/
  features/
    gallery/
      components/
        GalleryGrid.tsx
        __tests__/
          GalleryGrid.test.tsx     # Teste ao lado do componente
      hooks/
        useFiles.ts
        __tests__/
          useFiles.test.ts
  shared/
    store/
      auth-store.ts
      __tests__/
        auth-store.test.ts
    domain/
      rules/
        upload-rules.ts
        __tests__/
          upload-rules.test.ts
  test/                            # Infraestrutura compartilhada
    setup.ts
    mocks/
      handlers.ts
      factories.ts
      server.ts
    utils/
      create-query-wrapper.tsx     # QueryClient wrapper para testes
      render-with-providers.tsx    # Render com todos os providers
e2e/
  cluster-setup.spec.ts
  upload.spec.ts
  gallery.spec.ts
  invite.spec.ts
  recovery.spec.ts
  fixtures/
```

### Regras

- Testar **comportamento do usuario**, nao detalhes de implementacao
- Usar `screen.getByRole`, `getByLabelText`, `getByText` (nao `getByTestId` exceto ultimo recurso)
- Mocks de API via MSW (handlers compartilhados), nao `vi.mock` em modulos HTTP
- Cada teste deve ser independente (sem ordem, sem estado compartilhado)
- Factories com `faker` para dados; nunca hardcodar emails/nomes reais

---

## Historico de Decisoes

| Data | Decisao | Motivo |
|------|---------|--------|
| 2026-03-23 | Vitest (nao Jest) | Mais rapido, ESM nativo, compativel com Vite/Next.js; setup mais simples |
| 2026-03-23 | MSW para mocks de API | Intercepta no nivel de rede; handlers reutilizaveis entre unit, integration e Storybook |
| 2026-03-23 | Playwright (nao Cypress) | Multi-browser nativo, melhor suporte a Next.js App Router, auto-wait mais robusto |
| 2026-03-23 | Factories com faker | Dados aleatorios mas tipados; evita dados reais; reproduzivel via seed |
| 2026-03-23 | Testes ao lado do componente (__tests__/) | Facilita navegacao; arquivo de teste proximo do codigo testado |
| 2026-03-23 | Coverage thresholds no CI | Previne regressao de cobertura; falha o pipeline se cair abaixo do minimo |
