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
| Cold Start Time | {{< 2s}} | Tempo desde toque no icone ate primeira tela interativa |
| Warm Start Time | {{< 1s}} | Tempo ao reabrir app em background |
| Frame Rate | {{60fps consistente}} | Sem frame drops durante scroll e animacoes |
| JS Thread FPS | {{> 55fps}} | Performance do thread JavaScript |
| Memory Usage | {{< 200MB}} | Consumo de memoria RAM em uso normal |
| Memory Peak | {{< 350MB}} | Pico de memoria em operacoes pesadas |
| Battery Consumption | {{< 5% por hora de uso ativo}} | Impacto na bateria durante uso |
| TTI (Time to Interactive) | {{< 3s em cold start}} | Tempo ate o app responder a toques |

---

## Budget de Performance

> Qual o tamanho maximo aceitavel?

| Recurso | Budget | Atual |
|---------|--------|-------|
| Bundle JS (Hermes bytecode) | {{< 15MB}} | {{A medir}} |
| App binary (iOS) | {{< 50MB}} | {{A medir}} |
| App binary (Android APK) | {{< 30MB}} | {{A medir}} |
| Imagens bundled | {{< 5MB}} | {{A medir}} |
| Memoria em idle | {{< 80MB}} | {{A medir}} |

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
| Flipper | Profiling em desenvolvimento (CPU, memoria, rede) | {{Continuo em dev}} |
| React DevTools Profiler | Analise de re-renders e performance de componentes | {{Continuo em dev}} |
| Sentry Performance | Monitoramento de transacoes e slow frames em producao | {{Continuo em producao}} |
| Firebase Performance | App startup time, slow/frozen frames, network | {{Continuo em producao}} |
| {{Xcode Instruments / Android Profiler}} | Profiling nativo detalhado | {{Antes de releases}} |
| Bundle Analyzer | Analise de tamanho do bundle | {{Cada release}} |

> Para integracao com CI, (ver 13-cicd-conventions.md).

---

## Historico de Decisoes

| Data | Decisao | Motivo |
|------|---------|--------|
| {{YYYY-MM-DD}} | {{Decisao sobre performance}} | {{Justificativa}} |
