# Performance

Define a estrategia de performance do frontend, as tecnicas de otimizacao adotadas, os Core Web Vitals alvos e o budget de performance. Performance e um requisito nao-funcional critico que impacta diretamente a experiencia do usuario e metricas de negocio.

<!-- do blueprint: 14-scalability.md (cache, limites) + 03-requirements.md (latencia p95 < 500ms, browsers) -->

> **Contexto:** Alexandria e usado por familias (5-10 pessoas) em dispositivos variados — celulares antigos, notebooks, tablets. A galeria de fotos e a pagina mais visitada e precisa carregar rapido mesmo com centenas de thumbnails. Upload de video e CPU-bound no backend — o frontend precisa dar feedback constante.

---

## Estrategias de Otimizacao

> Quais tecnicas de performance sao aplicadas?

| Tecnica | Descricao | Onde no Alexandria | Ferramenta/API |
|---------|-----------|-------------------|----------------|
| Code Splitting | Carregar apenas codigo da rota atual | Rotas do App Router (automatico) | Next.js App Router (automatic splitting) |
| Dynamic Import | Carregar componentes pesados sob demanda | FilePreview (video player), RecoveryForm (core-sdk WASM) | `next/dynamic` com `ssr: false` |
| Lazy Loading de Imagens | Carregar thumbnails somente quando visiveis | GalleryGrid (centenas de thumbnails) | `loading="lazy"` nativo + IntersectionObserver |
| Virtualizacao | Renderizar apenas itens visiveis na viewport | GalleryGrid (infinite scroll com 1000+ itens) | `@tanstack/react-virtual` |
| React Server Components | Renderizar no servidor sem JS no cliente | PageShell, Header, Sidebar, MemberList, NodeList | Next.js RSC (default) |
| Streaming SSR | Renderizacao progressiva com Suspense | GalleryPage, HealthPage (dados assincronos) | React Suspense + Next.js streaming |
| Prefetch | Pre-carregar proxima pagina da galeria | Infinite scroll (prefetch a 80% do scroll) | TanStack Query `prefetchInfiniteQuery` |
| Memoizacao | Evitar re-renders em listas de thumbnails | GalleryItem, NodeCard, AlertItem | `React.memo` + `useMemo` para filtros |
| Image Optimization | Servir previews no tamanho correto | Thumbnails na galeria (~50KB WebP) | Previews pre-gerados pelo backend; `<img>` com `srcSet` |
| Font Optimization | Eliminar layout shift de fontes | Merriweather + Inter + JetBrains Mono | `next/font` (self-hosted, zero CLS) |
| WASM Lazy Load | Carregar core-sdk WASM somente quando necessario | SeedPhraseInput (validacao BIP-39), RecoveryForm | `next/dynamic` com `ssr: false` |

<!-- APPEND:estrategias -->

### Code Splitting por rota

```
Rota                    Bundle estimado    Componentes pesados
/login                  ~15KB              LoginForm (leve)
/gallery                ~40KB              GalleryGrid + @tanstack/react-virtual
/gallery/[fileId]       ~30KB              FilePreview (dynamic: video player)
/upload                 ~35KB              FileUploader + UploadQueue
/nodes                  ~25KB              NodeList + AddNodeForm
/health                 ~30KB              HealthDashboard + MetricCards
/recovery               ~50KB              core-sdk WASM (dynamic, ssr: false)
/cluster/setup          ~45KB              core-sdk WASM (dynamic, ssr: false)
```

### Componentes com dynamic import

```tsx
// Componentes que usam core-sdk WASM — nunca no servidor
const SeedPhraseInput = dynamic(
  () => import('@/features/cluster/components/SeedPhraseInput'),
  { ssr: false, loading: () => <Skeleton variant="grid" /> }
);

// Video player — pesado, so quando usuario clica em video
const VideoPlayer = dynamic(
  () => import('@/features/gallery/components/VideoPlayer'),
  { ssr: false, loading: () => <Skeleton variant="card" /> }
);

// PDF viewer — pesado, so quando usuario clica em PDF
const PDFViewer = dynamic(
  () => import('@/features/gallery/components/PDFViewer'),
  { ssr: false, loading: () => <Skeleton variant="card" /> }
);
```

### Virtualizacao da galeria

```tsx
// features/gallery/components/GalleryGrid.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function GalleryGrid({ files }: { files: FileDTO[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const columns = useResponsiveColumns(); // 2 (mobile) → 6 (desktop)

  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(files.length / columns),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // altura estimada de cada row
    overscan: 3, // renderizar 3 rows extras acima/abaixo
  });

  return (
    <div ref={parentRef} style={{ height: '100vh', overflow: 'auto' }}>
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          // renderizar apenas thumbnails visiveis
        ))}
      </div>
    </div>
  );
}
```

---

## Core Web Vitals

> Quais sao as metas de performance?

| Metrica | Meta | Estrategia para atingir |
|---------|------|------------------------|
| LCP (Largest Contentful Paint) | < 2.0s | SSR da galeria (thumbnails pre-carregados via Server Component); `next/font` elimina flash; previews servidos com `Cache-Control: max-age=31536000` |
| INP (Interaction to Next Paint) | < 150ms | Memoizacao de GalleryItem; virtualizacao de listas longas; event handlers leves (sem crypto no main thread) |
| CLS (Cumulative Layout Shift) | < 0.05 | Thumbnails com `width`/`height` explicitos; Skeleton com dimensoes fixas; `next/font` self-hosted; sem ads/banners dinamicos |
| TTFB (Time to First Byte) | < 500ms | SSR com streaming; Caddy como proxy com cache de assets; VPS proxima do usuario (Contabo EU) |
| FCP (First Contentful Paint) | < 1.2s | Server Components para shell (sidebar, header); CSS critico inline via Tailwind |

### Metas por pagina

| Pagina | LCP | Elemento LCP | INP critico |
|--------|-----|-------------|-------------|
| /gallery | < 1.5s | Primeiro thumbnail visivel | Click em thumbnail (abrir preview) |
| /gallery/[fileId] | < 2.0s | Preview da foto/video | Click "Download" |
| /upload | < 1.0s | Zona de drag-and-drop | Drop de arquivo |
| /health | < 2.0s | MetricCard "Nos Online" | Click em alerta |
| /login | < 1.0s | LoginForm | Submit do formulario |
| /recovery | < 1.5s | SeedPhraseInput (WASM load) | Paste de seed phrase |

---

## Budget de Performance

> Qual o tamanho maximo aceitavel?

| Recurso | Budget | Justificativa |
|---------|--------|---------------|
| JavaScript total (first load) | < 80KB gzipped | Dispositivos moveis antigos; conexoes 3G/4G |
| JavaScript total (por rota) | < 50KB gzipped | Code splitting automatico; dynamic imports |
| CSS total | < 30KB gzipped | Tailwind CSS v4 com purge; atomic classes |
| Fontes (web fonts) | < 80KB | Merriweather (2 pesos) + Inter (4 pesos) + JetBrains Mono (1 peso) via `next/font` |
| Imagens por pagina (galeria) | < 1MB (thumbnails visiveis) | Thumbnails ~50KB WebP; ~20 visiveis = ~1MB; lazy load o resto |
| Preview de foto | < 600KB | WebP Full HD pre-otimizado pelo backend |
| Preview de video | < 5MB | 480p MP4; carregado on-demand |
| core-sdk WASM | < 200KB gzipped | Carregado somente em /recovery e /cluster/setup |
| Requests por pagina (initial load) | < 15 | SSR reduz cascade; prefetch para dados criticos |
| Total transfer (initial page load) | < 500KB | First Load JS + CSS + fontes + dados SSR |

<!-- APPEND:budget -->

### Alertas de budget

| Metrica | Threshold warning | Threshold error | Acao |
|---------|-------------------|-----------------|------|
| First Load JS | > 70KB | > 100KB | Revisar imports; verificar tree shaking |
| Route bundle | > 40KB | > 60KB | Mover componente pesado para dynamic import |
| LCP | > 2.0s | > 3.0s | Investigar SSR; verificar cache de previews |
| CLS | > 0.05 | > 0.15 | Adicionar dimensoes explicitas; verificar fontes |
| Total transfer | > 400KB | > 600KB | Auditar imagens; verificar duplicacao de bundles |

---

## Otimizacoes de Imagens e Previews

> Como otimizamos o carregamento de fotos e videos na galeria?

<!-- do blueprint: 02-architecture_principles.md (Eficiencia sobre Fidelidade) + 14-scalability.md (cache de previews) -->

| Tecnica | Descricao | Impacto |
|---------|-----------|---------|
| Previews pre-otimizados | Backend gera WebP ~50KB (foto) e MP4 480p ~5MB (video) | Elimina processamento no frontend |
| Cache agressivo | Previews sao imutaveis (novo preview_id se reprocessado); `Cache-Control: max-age=31536000` | Cache hit rate ~99% apos primeira visita |
| Proxy BFF | Previews servidos via `/api/preview/[fileId]` (proxy Next.js) | Evita CORS; adiciona cache headers |
| Lazy loading nativo | `loading="lazy"` em `<img>` de thumbnails | Browser decide quando carregar |
| Blur placeholder | Thumbnail ~1KB blur hash inline no HTML (SSR) | Percepçao de velocidade enquanto thumbnail real carrega |
| Responsive sizing | `srcSet` nao necessario — previews tem tamanho unico (WebP 50KB) | Simplicidade; preview ja e pequeno |
| Prefetch da proxima pagina | Quando scroll atinge 80%, busca proxima pagina de thumbnails | Scroll infinito sem "loading" visivel |

---

## Monitoramento

> Como medimos performance continuamente?

| Ferramenta | Proposito | Frequencia | Custo |
|------------|-----------|------------|-------|
| Lighthouse CI | Auditoria automatica no pipeline CI; score minimo por rota | Cada PR | Gratuito |
| web-vitals (lib) | Coleta de CWV reais dos usuarios (RUM) enviados para endpoint | Continuo em producao | Gratuito (lib JS ~1KB) |
| `@next/bundle-analyzer` | Analise visual do tamanho de cada bundle/chunk | Cada release / sob demanda | Gratuito |
| Caddy access logs | Latencia de requests, cache hit rate, status codes | Continuo | Gratuito (logs) |
| Console Performance API | `performance.mark()` / `performance.measure()` para fluxos criticos | Desenvolvimento | Nativo do browser |

### Metricas coletadas via web-vitals

```typescript
// shared/lib/analytics.ts
import { onLCP, onINP, onCLS, onFCP, onTTFB } from 'web-vitals';

function sendMetric(metric: { name: string; value: number; id: string }) {
  // Enviar para endpoint do orquestrador ou console (dev)
  if (process.env.NODE_ENV === 'production') {
    navigator.sendBeacon('/api/vitals', JSON.stringify(metric));
  } else {
    console.log(`[CWV] ${metric.name}: ${metric.value.toFixed(1)}`);
  }
}

onLCP(sendMetric);
onINP(sendMetric);
onCLS(sendMetric);
onFCP(sendMetric);
onTTFB(sendMetric);
```

### Lighthouse CI no pipeline

```yaml
# Dentro do workflow de CI (GitHub Actions)
- name: Lighthouse CI
  uses: treosh/lighthouse-ci-action@v12
  with:
    urls: |
      http://localhost:3000/login
      http://localhost:3000/gallery
      http://localhost:3000/health
    budgetPath: ./lighthouse-budget.json
    uploadArtifacts: true
```

```json
// lighthouse-budget.json
[
  {
    "path": "/gallery",
    "timings": [
      { "metric": "largest-contentful-paint", "budget": 2000 },
      { "metric": "interactive", "budget": 3500 },
      { "metric": "cumulative-layout-shift", "budget": 0.05 }
    ],
    "resourceSizes": [
      { "resourceType": "script", "budget": 100 },
      { "resourceType": "total", "budget": 500 }
    ]
  }
]
```

> Para integracao com CI, (ver 13-cicd-conventions.md).

---

## Historico de Decisoes

| Data | Decisao | Motivo |
|------|---------|--------|
| 2026-03-23 | @tanstack/react-virtual para galeria | Galeria pode ter 1000+ thumbnails; renderizar apenas visiveis evita DOM bloat e re-renders |
| 2026-03-23 | core-sdk WASM via dynamic import (ssr: false) | WASM nao roda no servidor; carregado somente em /recovery e /cluster/setup (~200KB) |
| 2026-03-23 | Previews imutaveis com cache 1 ano | Preview nunca muda (novo preview_id se reprocessado); cache agressivo elimina requests repetidos |
| 2026-03-23 | web-vitals via sendBeacon (nao analytics SaaS) | Simplicidade operacional; sem dependencia externa; dados enviados para o proprio orquestrador |
| 2026-03-23 | Lighthouse CI com budget por rota | Previne regressao de performance no pipeline; falha CI se LCP > 2s na galeria |
| 2026-03-23 | Server Components como default | Reduz JS enviado ao cliente; sidebar, header e listas sao RSC; client components somente para interatividade |
| 2026-03-23 | Blur placeholder para thumbnails | Percepcao de velocidade; hash ~1KB inline no HTML SSR enquanto WebP 50KB carrega |
