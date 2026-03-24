# Performance

Define a estrategia de performance do app mobile, as tecnicas de otimizacao adotadas, as metricas-alvo e o budget de performance. Performance e um requisito nao-funcional critico que impacta diretamente a experiencia do usuario, retencao e avaliacoes nas lojas.

---

## Estrategias de Otimizacao

> Quais tecnicas de performance sao aplicadas?

| Tecnica | Descricao | Quando Usar | Ferramenta/API |
|---------|-----------|-------------|----------------|
| Lazy Screens | Carregar telas sob demanda | Telas pouco acessadas | `React.lazy`, Expo Router lazy |
| Hermes Engine | Bytecode pre-compilado para startup rapido | Sempre (default no Expo) | Hermes |
| Memoizacao | Evitar re-renders desnecessarios | Componentes pesados, listas | `React.memo`, `useMemo`, `useCallback` |
| Virtualizacao | Renderizar apenas itens visiveis | Listas longas (100+ itens) | `FlatList`, `FlashList`, `SectionList` |
| Image Caching | Cache de imagens em disco | Imagens remotas recorrentes | `expo-image`, `FastImage` |
| Bundle Splitting | Separar codigo por feature | Features grandes e opcionais | Metro bundler, lazy requires |
| Native Driver | Animacoes no thread nativo | Todas as animacoes | `useNativeDriver: true`, Reanimated |
| Inline Requires | Adiar imports ate serem necessarios | Modulos pesados | Metro `inlineRequires` |

<!-- APPEND:estrategias -->

<details>
<summary>Exemplo — Lista performatica com FlashList</summary>

```tsx
import { FlashList } from '@shopify/flash-list';

export function UserList({ users }: { users: User[] }) {
  const renderItem = useCallback(({ item }: { item: User }) => (
    <UserCard user={item} />
  ), []);

  return (
    <FlashList
      data={users}
      renderItem={renderItem}
      estimatedItemSize={80}
      keyExtractor={(item) => item.id}
    />
  );
}
```

</details>

---

## Metricas de Performance Mobile

> Quais sao as metas de performance?

| Metrica | Meta | Descricao |
|---------|------|-----------|
| Cold Start Time | < 2s | Tempo desde toque no icone ate primeira tela interativa |
| Warm Start Time | < 1s | Tempo ao reabrir app em background |
| Frame Rate | 60fps consistente | Sem frame drops durante scroll e animacoes |
| JS Thread FPS | > 55fps | Performance do thread JavaScript |
| Memory Usage | < 200MB | Consumo de memoria RAM em uso normal |
| Memory Peak | < 350MB | Pico de memoria em operacoes pesadas (galeria com 1000+ fotos) |
| Battery Consumption | < 5% por hora de uso ativo | Impacto na bateria durante uso normal (sem sync em background) |
| TTI (Time to Interactive) | < 3s em cold start | Tempo ate o app responder a toques |
| Background Sync | < 15s por ciclo | Tempo para detectar novas fotos e enfileirar uploads |
| Thumbnail Load | < 200ms | Tempo para exibir thumbnail a partir do cache `expo-image` |
| Encryption throughput | > 10MB/s | Throughput do Core SDK (AES-256-GCM) no device |

---

## Budget de Performance

> Qual o tamanho maximo aceitavel?

| Recurso | Budget | Atual |
|---------|--------|-------|
| Bundle JS (Hermes bytecode) | < 15MB | A medir (pre-launch) |
| App binary (iOS IPA) | < 50MB | A medir (pre-launch) |
| App binary (Android APK) | < 30MB | A medir (pre-launch) |
| Assets bundled (icons, fonts) | < 5MB | A medir (pre-launch) |
| Memoria em idle (app aberto, sem galeria) | < 80MB | A medir (pre-launch) |
| Cache de thumbnails em disco (`expo-image`) | < 500MB | Configuravel via `cachePolicy` |
| SQLite upload queue | < 50MB | Proporcional a fila de upload |

<!-- APPEND:budget -->

---

## Otimizacoes Hermes

> Como o Hermes engine e otimizado?

| Otimizacao | Descricao | Impacto |
|-----------|-----------|---------|
| Bytecode pre-compilado | JS e compilado para bytecode no build, nao no device | Startup 2-3x mais rapido |
| Garbage Collection | GC incremental e generacional | Menos pauses, animacoes mais fluidas |
| Inline Requires | Imports carregados sob demanda | Reduz tempo de startup |
| Hermes profiler | Profiling de CPU e memoria | Identifica gargalos |

---

## Otimizacao de Imagens

> Como imagens sao gerenciadas para performance?

| Estrategia | Implementacao | Quando Usar |
|-----------|---------------|-------------|
| Cache em disco | `expo-image` com cache policy | Todas as imagens remotas |
| Placeholder blur | BlurHash ou thumbnail | Imagens grandes |
| Resize on load | Dimensoes exatas no request | Evitar decode de imagens grandes |
| Formatos modernos | WebP (Android), HEIC (iOS) | Imagens do servidor |
| Prefetch | Pre-carregar imagens antes de exibir | Listas com imagens previsiveis |

---

## Monitoramento

> Como medimos performance continuamente?

| Ferramenta | Proposito | Frequencia |
|------------|-----------|------------|
| Flipper | Profiling em desenvolvimento (CPU, memoria, rede) | Continuo em dev |
| React DevTools Profiler | Analise de re-renders e performance de componentes | Continuo em dev |
| Hermes Profiler | Profiling de CPU e memoria do engine JavaScript | Continuo em dev (quando investigando lentidao) |
| Sentry Performance | Monitoramento de transacoes e slow frames em producao | Continuo em producao |
| Xcode Instruments | Profiling nativo detalhado em iOS (Allocations, Time Profiler) | Antes de releases e quando CPU/memoria acima do budget |
| Android Profiler | Profiling nativo em Android (Memory, CPU, Network) | Antes de releases e quando CPU/memoria acima do budget |
| Bundle Analyzer (`expo-atlas`) | Analise de tamanho e composicao do bundle JS | A cada release |
| `expo diagnostics` | Verificacao do ambiente e dependencias | Em resolucao de problemas |

> Para integracao com CI, (ver 13-cicd-conventions.md).

---

## Historico de Decisoes

| Data | Decisao | Motivo |
|------|---------|--------|
| 2026-03-24 | FlashList em vez de FlatList para GalleryGrid e UploadQueueList | FlatList tem overhead de medição de itens em cada render; FlashList reutiliza células de forma mais eficiente, crucial para galeria com 1000+ miniaturas |
| 2026-03-24 | `expo-image` em vez de FastImage para cache de thumbnails | expo-image tem suporte nativo a blurhash (placeholder), cache em disco configuravel por policy, e manutencao oficial pela equipe Expo; FastImage esta deprecated |
| 2026-03-24 | Hermes habilitado por padrao (nao desabilitar) | Bytecode pre-compilado reduz cold start em 2-3x; sem custo adicional de configuracao no Expo SDK |
| 2026-03-24 | Animacoes exclusivamente via Reanimated (nao JS-thread) | Animacoes no JS thread sofrem jank durante operacoes pesadas (upload, criptografia); Reanimated roda no UI thread via Worklets |
| 2026-03-24 | Criptografia AES-256-GCM no Core SDK executada em background task | Criptografia de chunks grandes (4MB) bloqueia o JS thread por ~100-300ms; isolar em task nativa evita frame drops na galeria |
