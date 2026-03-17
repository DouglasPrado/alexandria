# Performance

Define a estrategia de performance do frontend, as tecnicas de otimizacao adotadas, os Core Web Vitals alvos e o budget de performance. Performance e um requisito nao-funcional critico que impacta diretamente a experiencia do usuario e metricas de negocio.

---

## Estrategias de Otimizacao

> Quais tecnicas de performance sao aplicadas?

| Tecnica | Descricao | Quando Usar | Ferramenta/API |
|---------|-----------|-------------|----------------|
| Code Splitting | Carregar apenas o codigo necessario | Rotas e features grandes | `next/dynamic`, `React.lazy` |
| Lazy Loading | Carregar componentes sob demanda | Abaixo da fold, modais | Intersection Observer, dynamic import |
| Streaming | Renderizacao progressiva do servidor | Pages com dados assincronos | React Suspense, Next.js streaming |
| Partial Hydration | Hidratar apenas componentes interativos | Pages estaticas com partes dinamicas | React Server Components |
| Edge Rendering | Renderizar perto do usuario | Conteudo personalizado | Vercel Edge, Cloudflare Workers |
| Memoizacao | Evitar re-renders desnecessarios | Componentes pesados, listas | `React.memo`, `useMemo`, `useCallback` |
| Virtualizacao | Renderizar apenas itens visiveis | Listas longas (100+ itens) | `@tanstack/virtual`, `react-window` |

<!-- APPEND:estrategias -->

<details>
<summary>Exemplo — Code Splitting com next/dynamic</summary>

```tsx
import dynamic from 'next/dynamic';

// Componente carregado apenas quando necessario
const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // Nao renderizar no servidor
});

export function DashboardPage() {
  return (
    <main>
      <h1>Dashboard</h1>
      <Suspense fallback={<ChartSkeleton />}>
        <HeavyChart data={chartData} />
      </Suspense>
    </main>
  );
}
```

</details>

---

## Core Web Vitals

> Quais sao as metas de performance?

| Metrica | Meta | Descricao |
|---------|------|-----------|
| LCP (Largest Contentful Paint) | {{< 2.5s}} | Tempo ate o maior elemento visivel carregar |
| INP (Interaction to Next Paint) | {{< 200ms}} | Responsividade a interacoes do usuario |
| CLS (Cumulative Layout Shift) | {{< 0.1}} | Estabilidade visual da pagina |
| TTFB (Time to First Byte) | {{< 800ms}} | Tempo de resposta do servidor |

---

## Budget de Performance

> Qual o tamanho maximo aceitavel?

| Recurso | Budget | Atual |
|---------|--------|-------|
| JavaScript total | {{< 200KB gzipped}} | {{A medir}} |
| CSS total | {{< 50KB gzipped}} | {{A medir}} |
| Imagens (por pagina) | {{< 500KB}} | {{A medir}} |
| Fonte (web fonts) | {{< 100KB}} | {{A medir}} |
| First Load JS | {{< 80KB}} | {{A medir}} |

<!-- APPEND:budget -->

---

## Monitoramento

> Como medimos performance continuamente?

| Ferramenta | Proposito | Frequencia |
|------------|-----------|------------|
| Lighthouse CI | Auditoria automatica no CI | {{Cada PR}} |
| Web Vitals (lib) | Metricas reais de usuarios (RUM) | {{Continuo em producao}} |
| {{APM tool — Vercel Analytics / Datadog}} | Monitoramento de performance em producao | {{Continuo}} |
| Bundle Analyzer | Analise de tamanho do bundle | {{Cada release}} |

> Para integracao com CI, (ver 13-cicd-convencoes.md).

---

## Historico de Decisoes

| Data | Decisao | Motivo |
|------|---------|--------|
| {{YYYY-MM-DD}} | {{Decisao sobre performance}} | {{Justificativa}} |
