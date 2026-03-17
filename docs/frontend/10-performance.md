# Performance

Define a estrategia de performance do frontend, as tecnicas de otimizacao adotadas, os Core Web Vitals alvos e o budget de performance. Performance e um requisito nao-funcional critico que impacta diretamente a experiencia do usuario e metricas de negocio.

---

## Estrategias de Otimizacao

> Quais tecnicas de performance sao aplicadas?

| Tecnica | Descricao | Quando Usar | Ferramenta/API |
|---------|-----------|-------------|----------------|
| Code Splitting | Carregar apenas o codigo necessario por rota/feature | Rotas (gallery, cluster, recovery, health) e features pesadas (video player, dashboard de saude) | `next/dynamic`, `React.lazy` |
| Lazy Loading | Carregar componentes e imagens sob demanda | Thumbnails abaixo da fold, modais de configuracao, VideoPlayer, CloudConnector | Intersection Observer, `next/dynamic` |
| Streaming | Renderizacao progressiva do servidor | GalleryPage com dados assincronos do orquestrador, HealthDashboard com metricas de nos | React Suspense, Next.js streaming |
| Partial Hydration | Hidratar apenas componentes interativos | Paginas com conteudo estatico e partes dinamicas (ex: timeline com controles de filtro) | React Server Components |
| Memoizacao | Evitar re-renders desnecessarios | PhotoCard em listas grandes, NodeCard com status de heartbeat, CapacityChart | `React.memo`, `useMemo`, `useCallback` |
| Virtualizacao | Renderizar apenas itens visiveis no viewport | Galeria de fotos (100k+ itens), lista de chunks, lista de nos, logs de operacoes | `@tanstack/virtual` |
| Web Workers | Offload de operacoes pesadas para threads separadas | Criptografia AES-256-GCM, hashing SHA-256, resize de imagens, chunking | Web Workers API, `comlink` |
| Cache de Thumbnails | Armazenar previews localmente para acesso offline | Navegacao na galeria, timeline cronologica | IndexedDB via `idb` |
| Prefetch de Rotas | Pre-carregar rotas provaveis antes da navegacao | Links de navegacao principal (gallery → upload, health → nodes) | `next/link` com prefetch |
| Optimistic Updates | Atualizar UI antes da confirmacao do servidor | Upload de fotos (mostrar thumbnail imediatamente), alteracao de permissoes | TanStack Query `onMutate` |

<!-- APPEND:estrategias -->

<details>
<summary>Exemplo — Code Splitting por feature no Alexandria</summary>

```tsx
import dynamic from 'next/dynamic';

// VideoPlayer carregado apenas quando usuario clica em um video
const VideoPlayer = dynamic(() => import('@/features/gallery/components/VideoPlayer'), {
  loading: () => <VideoSkeleton />,
  ssr: false, // Nao renderizar no servidor — depende de APIs de browser
});

// HealthDashboard carregado apenas para admins
const HealthDashboard = dynamic(() => import('@/features/health/components/HealthDashboard'), {
  loading: () => <DashboardSkeleton />,
});

// RecoveryWizard carregado sob demanda
const RecoveryWizard = dynamic(() => import('@/features/recovery/components/RecoveryWizard'), {
  loading: () => <WizardSkeleton />,
});
```

</details>

<details>
<summary>Exemplo — Virtualizacao da galeria com @tanstack/virtual</summary>

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function GalleryGrid({ photos }: { photos: Photo[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: photos.length, // Suporta 100k+ itens
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Altura estimada do thumbnail
    overscan: 5, // Renderizar 5 itens extras acima/abaixo do viewport
  });

  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <PhotoCard key={virtualItem.key} photo={photos[virtualItem.index]} />
        ))}
      </div>
    </div>
  );
}
```

</details>

<details>
<summary>Exemplo — Web Worker para criptografia sem bloquear UI</summary>

```tsx
// infrastructure/crypto/crypto.worker.ts
import { wrap } from 'comlink';

const cryptoWorker = wrap<CryptoWorkerAPI>(
  new Worker(new URL('./crypto.worker.ts', import.meta.url))
);

// Application Layer — hook de upload
async function encryptAndUpload(file: File, key: CryptoKey) {
  // Criptografia roda no Worker — UI permanece responsiva
  const encryptedChunks = await cryptoWorker.encryptFile(file, key);
  // Upload dos chunks criptografados
  await uploadChunks(encryptedChunks);
}
```

</details>

---

## Core Web Vitals

> Quais sao as metas de performance?

| Metrica | Meta | Descricao |
|---------|------|-----------|
| LCP (Largest Contentful Paint) | < 1.5s | Tempo ate o grid de thumbnails da galeria carregar — thumbnails pre-gerados (~50KB) servidos do cache local ou CDN <!-- inferido do PRD --> |
| INP (Interaction to Next Paint) | < 150ms | Responsividade a interacoes: clique em foto, filtro de busca, navegacao na timeline — garantida por virtualizacao e memoizacao <!-- inferido do PRD --> |
| CLS (Cumulative Layout Shift) | < 0.05 | Estabilidade visual — thumbnails com dimensoes reservadas via aspect-ratio, skeletons com tamanho fixo, fontes com font-display: swap <!-- inferido do PRD --> |
| TTFB (Time to First Byte) | < 500ms | Tempo de resposta do servidor Next.js — alinhado com meta de p95 < 500ms do orquestrador (RNF-003) |

**Metas por tipo de pagina:**

| Pagina | LCP Alvo | Estrategia |
|--------|----------|------------|
| Galeria (home) | < 1.5s | Thumbnails pre-gerados em cache local (IndexedDB), Server Components para shell, streaming para dados |
| Upload | < 1.0s | Pagina leve, componentes de dropzone carregados eagerly |
| Dashboard de Saude | < 2.0s | Dados de nos/replicacao via streaming, graficos lazy loaded |
| Recovery | < 1.0s | Pagina estatica com wizard interativo — partial hydration |
| Configuracao de Nos | < 1.5s | Lista de nos via Server Component, OAuth redirect lazy loaded |

---

## Budget de Performance

> Qual o tamanho maximo aceitavel?

| Recurso | Budget | Atual |
|---------|--------|-------|
| JavaScript total | < 180KB gzipped | A medir |
| CSS total | < 30KB gzipped | A medir <!-- Tailwind CSS v4 com purge agressivo --> |
| Imagens (por pagina) | < 400KB | A medir <!-- thumbnails ~50KB cada, max 8 visiveis no viewport --> |
| Fonte (web fonts) | < 60KB | A medir <!-- 1 familia tipografica, subset latin --> |
| First Load JS | < 70KB | A medir <!-- shell minimo: layout + nav + auth check --> |

<!-- APPEND:budget -->

**Budget por feature (code-split):**

| Feature | JS Budget (gzipped) | Justificativa |
|---------|---------------------|---------------|
| Gallery (core) | < 40KB | Grid virtualizado + PhotoCard + lazy loading |
| Upload Pipeline | < 35KB | Dropzone + progress + fila — sem crypto (Worker separado) |
| Crypto Worker | < 25KB | AES-256-GCM + SHA-256 via Web Crypto API |
| Health Dashboard | < 30KB | Graficos lazy loaded, dados via streaming |
| Recovery Wizard | < 15KB | UI simples de steps — carregado sob demanda |
| Video Player | < 20KB | Player nativo com controles custom — lazy loaded |
| Nodes/OAuth | < 25KB | Lista + OAuth redirect — lazy loaded |

**Regras de budget:**

- PRs que excedem o budget em >10% sao bloqueados no CI pelo Lighthouse CI
- Bundle Analyzer roda a cada release para identificar regressoes
- Dependencias com >20KB gzipped requerem aprovacao explicita e justificativa

---

## Monitoramento

> Como medimos performance continuamente?

| Ferramenta | Proposito | Frequencia |
|------------|-----------|------------|
| Lighthouse CI | Auditoria automatica no CI — bloqueia PR se score < 90 ou budget excedido | Cada PR |
| Web Vitals (`web-vitals` lib) | Metricas reais de usuarios (RUM) — LCP, INP, CLS, TTFB coletados em producao | Continuo em producao |
| Vercel Analytics | Monitoramento de performance em producao com breakdown por rota e dispositivo | Continuo <!-- inferido do PRD — Next.js no Vercel --> |
| `@next/bundle-analyzer` | Analise visual do tamanho do bundle por modulo e dependencia | Cada release |
| Custom Performance Marks | Metricas especificas do Alexandria: tempo de encrypt, tempo de chunking, tempo de upload | Continuo via `performance.mark()` |

**Alertas configurados:**

| Alerta | Condicao | Acao |
|--------|----------|------|
| LCP regressao | LCP p75 > 2.0s por 24h | Notificacao no canal de desenvolvimento |
| Bundle size regressao | First Load JS > 80KB | PR bloqueado no CI |
| Crypto Worker lento | Tempo de encrypt p95 > 500ms por chunk de 4MB | Investigar — pode indicar problema no Web Worker |
| Thumbnail cache miss alto | Cache miss rate > 30% | Revisar estrategia de prefetch e eviction do IndexedDB |

> Para integracao com CI, (ver 13-cicd-convencoes.md).

---

## Historico de Decisoes

| Data | Decisao | Motivo |
|------|---------|--------|
| 2026-03-17 | Virtualizacao obrigatoria para galeria com `@tanstack/virtual` | Acervos familiares podem ter 100k+ fotos — renderizar tudo causa freeze na UI |
| 2026-03-17 | Criptografia em Web Workers com `comlink` | AES-256-GCM e SHA-256 sao CPU-intensivos — bloqueariam a main thread e degradariam INP |
| 2026-03-17 | Cache de thumbnails em IndexedDB | Suporte offline-first — thumbnails devem carregar em < 1s mesmo sem rede |
| 2026-03-17 | Budget de First Load JS < 70KB | Manter LCP agressivo (< 1.5s) para galeria — shell minimo carrega rapido, features via code splitting |
| 2026-03-17 | Vercel Analytics como APM primario | Integracao nativa com Next.js, zero-config, metricas reais de usuarios sem overhead de instrumentacao |
