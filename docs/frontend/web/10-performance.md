# Performance

Define a estratégia de performance do frontend web (Next.js 16), as técnicas de otimização adotadas, os Core Web Vitals alvos e o budget de performance. Performance é um requisito não-funcional crítico que impacta diretamente a experiência do usuário — especialmente na galeria com 10k+ itens e no upload de arquivos grandes.

<!-- do blueprint: 14-scalability.md (cache, rate limiting), 03-requirements.md (latência p95 <500ms) -->

---

## Estratégias de Otimização

> Quais técnicas de performance são aplicadas?

| Técnica                | Descrição                                                 | Onde Aplicar                                         | Ferramenta/API                                    |
| ---------------------- | --------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------- |
| Code Splitting         | Carregar apenas o código necessário por rota              | Todas as rotas via App Router                        | Next.js automatic splitting, `next/dynamic`       |
| Lazy Loading           | Carregar componentes sob demanda                          | Lightbox, VideoPlayer, AddNodeModal, RecoveryStepper | `next/dynamic` com `loading` skeleton             |
| Streaming SSR          | Renderização progressiva do servidor                      | GalleryPage (thumbnails pesados), SearchPage         | `<Suspense>` boundaries no App Router             |
| Server Components      | Zero JS no client para componentes de dados               | Pages, layouts, metadata panels                      | RSC (padrão no App Router)                        |
| Virtualização          | Renderizar apenas itens visíveis no viewport              | GalleryGrid (10k+ thumbnails), NodeList              | `@tanstack/react-virtual`                         |
| Image Optimization     | Thumbnails otimizados com lazy loading e blur placeholder | Todas as thumbnails da galeria                       | `next/image` (WebP, srcset, lazy)                 |
| Memoização             | Evitar re-renders desnecessários                          | GalleryGrid items, FilterChips, NodeStatusBadge      | `React.memo`, `useMemo` para filtros              |
| Debounce               | Reduzir requests em inputs de busca                       | SearchBar (300ms), filtros                           | `useDebouncedValue` hook                          |
| Prefetch               | Pré-carregar dados de rotas adjacentes                    | Links da sidebar, próxima página de galeria          | `<Link prefetch>`, TanStack Query `prefetchQuery` |
| Stale-While-Revalidate | Exibir cache enquanto revalida em background              | Todas as queries TanStack Query                      | `staleTime: 30_000`                               |

<!-- APPEND:estrategias -->

<details>
<summary>Exemplo — Galeria virtualizada com lazy loading</summary>

```tsx
// features/gallery/components/GalleryGrid.tsx
'use client';
import { useVirtualizer } from '@tanstack/react-virtual';
import Image from 'next/image';

export function GalleryGrid({ files }: { files: File[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: files.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // thumbnail height
    overscan: 10,
  });

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div style={{ height: virtualizer.getTotalSize() }} className="relative w-full">
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div key={virtualRow.key} style={{ transform: `translateY(${virtualRow.start}px)` }}>
            <Image
              src={files[virtualRow.index].thumbnailUrl}
              alt={files[virtualRow.index].name}
              width={200}
              height={200}
              loading="lazy"
              placeholder="blur"
              blurDataURL={files[virtualRow.index].blurHash}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
```

</details>

---

## Core Web Vitals

> Quais são as metas de performance?

| Métrica                         | Meta    | Descrição                                   | Estratégia                                                                            |
| ------------------------------- | ------- | ------------------------------------------- | ------------------------------------------------------------------------------------- |
| LCP (Largest Contentful Paint)  | < 2.5s  | Tempo até o maior elemento visível carregar | SSR da galeria, `next/image` com priority no first fold, streaming SSR                |
| INP (Interaction to Next Paint) | < 200ms | Responsividade a interações do usuário      | Virtualização de listas, debounce de filtros, `startTransition` para updates pesados  |
| CLS (Cumulative Layout Shift)   | < 0.1   | Estabilidade visual da página               | `width`/`height` explícitos em imagens, skeleton com tamanho fixo, font-display: swap |
| TTFB (Time to First Byte)       | < 800ms | Tempo de resposta do servidor               | SSR leve (RSC), cache de assets no Caddy (30 dias), VPS na mesma região dos usuários  |
| FCP (First Contentful Paint)    | < 1.8s  | Tempo até primeiro conteúdo visível         | Streaming SSR, skeleton imediato, CSS inline crítico (Tailwind)                       |

---

## Budget de Performance

> Qual o tamanho máximo aceitável?

| Recurso                   | Budget          | Justificativa                                                                 |
| ------------------------- | --------------- | ----------------------------------------------------------------------------- |
| First Load JS (por rota)  | < 80KB gzipped  | App Router split automático; somente JS necessário por rota                   |
| JavaScript total (shared) | < 150KB gzipped | Zustand (~2KB), TanStack Query (~13KB), React (~40KB), Tailwind (0KB runtime) |
| CSS total                 | < 30KB gzipped  | Tailwind CSS purged; somente classes utilizadas                               |
| Thumbnail (por imagem)    | ~50KB           | Previews gerados pelo backend em WebP                                         |
| Fontes (web fonts)        | < 80KB          | Inter (variable font, subset latin)                                           |
| Galeria first load        | < 20 thumbnails | Infinite scroll carrega mais sob demanda; virtualização para 10k+             |

<!-- APPEND:budget -->

### Budget por Rota

| Rota                             | First Load JS              | Dados Iniciais        | Meta de LCP |
| -------------------------------- | -------------------------- | --------------------- | ----------- |
| `/login`                         | < 40KB                     | 0 (formulário local)  | < 1.5s      |
| `/dashboard` (galeria)           | < 80KB                     | 20 thumbnails (~1MB)  | < 2.5s      |
| `/dashboard/file/:id` (lightbox) | < 60KB (lazy: VideoPlayer) | 1 preview + metadados | < 2.0s      |
| `/dashboard/nodes`               | < 50KB                     | Lista de nós (~5KB)   | < 1.5s      |
| `/recovery`                      | < 40KB                     | 0 (formulário local)  | < 1.5s      |
| `/setup`                         | < 35KB                     | 0 (formulário local)  | < 1.5s      |

---

## Cache no Frontend

> Como o cache é gerenciado no cliente?

<!-- do blueprint: 14-scalability.md (estratégia de cache) -->

| Camada                   | O que Cacheia                             | TTL                                      | Invalidação                                                                   |
| ------------------------ | ----------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------- |
| Caddy (reverse proxy)    | Assets estáticos (JS, CSS, fontes)        | 30 dias                                  | Cache busting via hash no filename (Next.js build)                            |
| `next/image`             | Thumbnails otimizados                     | 60 dias                                  | URL muda quando arquivo é reprocessado                                        |
| TanStack Query           | Metadados de files, nós, alertas, cluster | 30s (staleTime)                          | Invalidação manual via `queryClient.invalidateQueries` + window focus refetch |
| TanStack Query (detalhe) | Arquivo individual (file/:id)             | 30s (normal), 3s polling (se processing) | Status muda para `ready` → para polling                                       |
| Browser (Service Worker) | — (não usado na v1)                       | —                                        | —                                                                             |

---

## Otimizações Específicas por Tela

### Galeria (`/dashboard`)

| Otimização         | Detalhe                                                                          |
| ------------------ | -------------------------------------------------------------------------------- |
| Virtualização      | `@tanstack/react-virtual` para 10k+ thumbnails; renderiza apenas ~20-30 visíveis |
| Infinite scroll    | Cursor-based pagination; `onEndReached` carrega próxima página                   |
| Blur placeholder   | `blurDataURL` em cada thumbnail para LCP percebido instantâneo                   |
| Prefetch next page | TanStack Query `prefetchQuery` quando cursor se aproxima do fim                  |
| Skeleton loading   | Grid de skeletons com tamanho fixo enquanto dados carregam                       |

### Upload Queue

| Otimização           | Detalhe                                                         |
| -------------------- | --------------------------------------------------------------- |
| Max 3 concorrentes   | Evita saturação de banda e rate limiting (10 uploads/min)       |
| Progress via XHR     | `XMLHttpRequest.upload.onprogress` para barra de progresso real |
| Desacoplamento da UI | Queue roda independente da navegação; componente flutuante      |

### Lightbox (`/dashboard/file/:id`)

| Otimização            | Detalhe                                                                   |
| --------------------- | ------------------------------------------------------------------------- |
| Lazy load VideoPlayer | `next/dynamic` com `ssr: false`; carrega ~200KB somente quando necessário |
| Prefetch prev/next    | Pré-carrega thumbnail do arquivo anterior e próximo                       |
| `startTransition`     | Navegação prev/next não bloqueia interações                               |

---

## Monitoramento

> Como medimos performance continuamente?

| Ferramenta             | Propósito                                             | Frequência              |
| ---------------------- | ----------------------------------------------------- | ----------------------- |
| Lighthouse CI          | Auditoria automática no CI (scores mínimos como gate) | Cada PR                 |
| `web-vitals` (lib)     | Métricas reais de usuários (RUM): LCP, INP, CLS, TTFB | Contínuo em produção    |
| `next/bundle-analyzer` | Análise visual de tamanho do bundle                   | Cada release            |
| pino (backend)         | Latência de API p95, throughput                       | Contínuo                |
| Browser DevTools       | Profiling manual de re-renders e layout shifts        | Durante desenvolvimento |

### Alertas de Performance

| Métrica              | Threshold de Alerta | Ação                                             |
| -------------------- | ------------------- | ------------------------------------------------ |
| LCP > 4s             | 3 ocorrências em 1h | Investigar: SSR lento? Thumbnails grandes?       |
| INP > 500ms          | Qualquer ocorrência | Profiling de re-renders; verificar virtualização |
| Bundle size > budget | CI falha            | Revisar imports; lazy load componentes pesados   |
| API p95 > 500ms      | Dashboard de logs   | Otimizar query PostgreSQL; verificar cache       |

> Para integração com CI, (ver [13-cicd-conventions.md](13-cicd-conventions.md)).

---

## Histórico de Decisões

| Data       | Decisão                               | Motivo                                                                                            |
| ---------- | ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 2026-03-24 | Virtualização obrigatória na galeria  | Requisito de 10k+ arquivos (plano de capacidade 12 meses); FlatList nativa do browser não suporta |
| 2026-03-24 | `next/image` para todos os thumbnails | Otimização automática (WebP, srcset, lazy), cache de longa duração, blur placeholder              |
| 2026-03-24 | Sem Service Worker na v1              | Complexidade de cache invalidation; Caddy + TanStack Query suficientes para escala familiar       |
| 2026-03-24 | Streaming SSR para galeria            | Exibe skeleton imediato enquanto dados carregam no servidor; melhora FCP e LCP percebido          |
| 2026-03-24 | Budget de 80KB first load JS por rota | App Router split automático; Tailwind zero runtime; Zustand ~2KB; meta alcançável                 |
