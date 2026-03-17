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
| Unit | Vitest | Hooks, utils, modelos de dominio, regras de negocio, servicos de criptografia | 80%+ |
| Integration | Testing Library + Vitest | Componentes com interacoes, formularios, fluxos de feature isolados, stores Zustand | 60%+ |
| E2E | Playwright | Fluxos completos do usuario: login, upload, galeria, recovery, gerenciamento de nos | Fluxos criticos 100% |

**Justificativa da distribuicao:** <!-- inferido do PRD -->

- **Mais testes unitarios** porque o Alexandria possui logica de dominio densa (criptografia AES-256-GCM, chunking, consistent hashing, validacao de replicacao minima, permissoes de cluster) que precisa ser testada isoladamente com alta confianca
- **Testes de integracao moderados** porque cada feature (gallery, upload, nodes, recovery, vault, health, cluster) possui componentes compostos com estado proprio via Zustand e comunicacao via Event Bus
- **Poucos testes E2E** focados nos fluxos criticos (upload pipeline completo, recovery via seed phrase, gerenciamento de nos) por serem lentos mas indispensaveis para validar a experiencia do usuario final

---

## Padroes por Tipo de Componente

> O que testar em cada tipo de componente?

| Tipo | O que Testar | O que NAO Testar |
|------|-------------|------------------|
| Primitive (Button, Input, Card, Modal, Toast) | Rendering, props, acessibilidade (ARIA roles, labels), estados (hover, focus, disabled) | Estilo visual (use Storybook) |
| Composite (Form, Table, FileInput) | Interacao do usuario, validacao de formulario, estados visuais (loading/vazio/erro/sucesso) | Componentes filhos isolados |
| Feature (GalleryGrid, UploadDropzone, NodeList) | Fluxo completo da feature, API mocking com MSW, estado via Zustand store, eventos do Event Bus | Implementacao interna de hooks ou servicos |
| Hooks (useUploadPipeline, useAuth, useClusterConnection) | Retorno correto, side effects, edge cases (erro de rede, timeout, retry), transicoes de estado | Implementacao interna do React |
| Services (cryptoService, orchestratorApi, storageProvider) | Contrato da interface, transformacao de dados, tratamento de erros, retry logic | Implementacao do browser (Web Crypto API, fetch) |
| Workers (encrypt worker, hash worker, resize worker) | Input/output correto, mensagens postMessage, tratamento de erros | Performance real (use benchmarks separados) |

<details>
<summary>Exemplo — Teste de componente e hook do Alexandria</summary>

```tsx
// Teste de componente com Testing Library
describe('UploadDropzone', () => {
  it('deve iniciar pipeline de upload ao dropar arquivo', async () => {
    const onUpload = vi.fn();
    render(<UploadDropzone onUpload={onUpload} />);

    const file = new File(['photo'], 'foto.jpg', { type: 'image/jpeg' });
    const dropzone = screen.getByTestId('upload-dropzone');

    await userEvent.upload(dropzone, file);

    expect(onUpload).toHaveBeenCalledWith(expect.objectContaining({
      name: 'foto.jpg',
      type: 'image/jpeg',
    }));
  });

  it('deve exibir erro para arquivo acima do limite', async () => {
    render(<UploadDropzone maxSize={10 * 1024 * 1024} />);

    const largeFile = new File(['x'.repeat(20 * 1024 * 1024)], 'video.mp4', { type: 'video/mp4' });
    const dropzone = screen.getByTestId('upload-dropzone');

    await userEvent.upload(dropzone, largeFile);

    expect(await screen.findByText(/arquivo excede o limite/i)).toBeInTheDocument();
  });
});

// Teste de hook com renderHook
describe('useClusterConnection', () => {
  it('deve retornar status conectado apos handshake', async () => {
    server.use(
      http.get('/api/cluster/status', () => HttpResponse.json({ status: 'healthy' }))
    );

    const { result } = renderHook(() => useClusterConnection());

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
      expect(result.current.clusterStatus).toBe('healthy');
    });
  });

  it('deve entrar em modo offline quando orquestrador indisponivel', async () => {
    server.use(
      http.get('/api/cluster/status', () => HttpResponse.error())
    );

    const { result } = renderHook(() => useClusterConnection());

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
      expect(result.current.isOffline).toBe(true);
    });
  });
});
```

</details>

---

## Cobertura e Metas

> Quais sao as metas de cobertura por camada?

| Camada | Meta | Medicao |
|--------|------|---------|
| Domain (models, business rules, utils) | 90%+ | Vitest coverage (Istanbul) |
| Application (hooks, stores, event bus) | 80%+ | Vitest coverage (Istanbul) |
| Infrastructure (API client, crypto, storage providers) | 75%+ | Vitest coverage (Istanbul) |
| UI (components, pages, layouts) | 60%+ | Testing Library + Vitest |
| E2E (fluxos criticos) | 100% | Playwright HTML reports |

**Areas com cobertura obrigatoria (100%):** <!-- inferido do PRD -->

| Area | Motivo |
|------|--------|
| Criptografia (encryptChunk, decryptChunk, deriveKey) | Zero-knowledge e a premissa central do sistema; falha aqui expoe dados da familia |
| Recovery (seed phrase → chave mestra → reconstrucao) | Requisito critico OBJ-02: recuperacao completa via 12 palavras |
| Permissoes de cluster (canAccess, canUpload, canAdmin) | Controle de acesso entre membros com niveis diferentes (admin, membro, leitura) |
| Validacao de replicacao (canRemoveNode, hasMinReplicas) | Requisito OBJ-01: zero perda de dados com minimo 3 replicas por chunk |
| Upload pipeline (analyze → resize → encrypt → chunk → distribute) | Fluxo mais complexo do sistema; falha corrompe dados permanentemente |

<!-- APPEND:cobertura -->

---

## Integracao com CI

> Testes rodam automaticamente no pipeline?

- [x] Testes unitarios rodam em cada PR
- [x] Testes de integracao rodam em cada PR
- [x] E2E roda antes de merge na main
- [x] Cobertura e reportada no PR
- [x] Testes falhos bloqueiam merge

| Etapa | Comando | Timeout |
|-------|---------|---------|
| Unit + Integration | `pnpm run test` | 120s |
| E2E | `pnpm run test:e2e` | 300s |
| Coverage report | `pnpm run test:coverage` | 120s |
| Lint + Type check | `pnpm run lint && pnpm run typecheck` | 60s |

**Configuracao de CI:** <!-- inferido do PRD -->

```yaml
# Fluxo de CI para PRs
steps:
  - lint + typecheck        # Gate 1: codigo compila e segue padroes
  - unit + integration      # Gate 2: logica e componentes funcionam
  - coverage check          # Gate 3: cobertura minima por camada
  - e2e (apenas pre-merge)  # Gate 4: fluxos criticos validados
```

**Ferramentas de suporte:**

| Ferramenta | Uso |
|------------|-----|
| MSW (Mock Service Worker) | Mock de API do orquestrador em testes de integracao e E2E |
| Vitest UI | Interface visual para debug de testes unitarios localmente |
| Playwright UI Mode | Debug interativo de testes E2E com trace viewer |
| Istanbul (via Vitest) | Relatorios de cobertura por camada com thresholds configurados |

> Para pipeline completo, (ver 13-cicd-convencoes.md).

---

## Historico de Decisoes

| Data | Decisao | Motivo |
|------|---------|--------|
| 2026-03-17 | Vitest como test runner unico (unit + integration) | Compatibilidade nativa com Vite/Turbopack, execucao rapida com ESM, API compativel com Jest |
| 2026-03-17 | Playwright para E2E em vez de Cypress | Suporte nativo a multi-browser (Chrome, Firefox, Safari), melhor performance, trace viewer integrado |
| 2026-03-17 | MSW para mocking de API | Intercepta requests no nivel de rede (nao no nivel de modulo), funciona tanto em testes quanto no Storybook |
| 2026-03-17 | Cobertura obrigatoria em criptografia e recovery | Falhas nessas areas comprometem a premissa central do sistema (zero-knowledge e recuperacao via seed phrase) |
| 2026-03-17 | pnpm como gerenciador de pacotes | Consistencia com monorepo Turborepo, instalacao mais rapida e eficiente em disco |
