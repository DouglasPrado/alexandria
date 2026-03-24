# Fluxos de Interface

Documenta os fluxos críticos de interação do usuário com o app mobile (React Native / Expo). Cada fluxo mostra o caminho do usuário, os componentes envolvidos, interações gestuais e os pontos de decisão/erro. Esses fluxos são a base para testes E2E e validação de requisitos.

<!-- do blueprint: 07-critical_flows.md, 08-use_cases.md, 09-state-models.md -->

---

## Fluxos Críticos

| # | Fluxo | Atores | Criticidade |
|---|-------|--------|-------------|
| 1 | Onboarding e Entrada no Cluster | Membro convidado | Alta |
| 2 | Upload de Fotos e Vídeos | Membro autenticado | Alta |
| 3 | Visualizar e Navegar pelo Acervo | Membro autenticado (qualquer role) | Alta |
| 4 | Liberação de Espaço no Dispositivo | Membro / Fotógrafo Amador | Alta |
| 5 | Monitoramento e Alertas (Admin) | Admin | Média |

---

### Fluxo 1: Onboarding e Entrada no Cluster

> Membro recebe convite (WhatsApp, SMS, email), abre o deep link no celular, aceita o convite e entra no cluster familiar. No mobile, a criação de cluster é feita pelo web — o app foca na jornada do membro convidado.

<!-- do blueprint: 08-use_cases.md (UC-002), 07-critical_flows.md (Fluxo 4) -->

**Passos:**

1. Membro recebe link de convite via WhatsApp/SMS/email
2. Toque no link abre o app via Universal Link (iOS) ou App Link (Android)
3. Se app não instalado → redireciona para App Store / Play Store com deferred deep link
4. App detecta deep link `/invite/:token` e navega para `(auth)/invite`
5. Tela exibe nome do cluster, quem convidou e role atribuída
6. Membro preenche nome e define senha → toque em "Aceitar Convite"
7. Haptic feedback (success) ao tocar no botão
8. App envia `POST /invites/:token/accept` — loading indicator no botão
9. Resposta 200 → armazena JWT em SecureStore (iOS Keychain / Android Keystore)
10. App navega para `(tabs)` — galeria do cluster com onboarding overlay
11. Overlay destaca: "Toque no + para fazer upload" e "Puxe para baixo para atualizar"
12. Membro descarta overlay → fluxo completo

**Componentes envolvidos:**

| Componente | Responsabilidade |
|------------|-----------------|
| `InviteScreen` | Exibe detalhes do convite e formulário de aceite |
| `AcceptInviteForm` | Captura nome e senha com validação inline |
| `DeepLinkHandler` | Intercepta Universal/App Links e navega para tela correta |
| `OnboardingOverlay` | Coach marks com dicas de uso (swipe para dismiss) |
| `SplashScreen` | Exibido durante verificação de auth no app launch |

**Interações Nativas:**

| Interação | Plataforma | Comportamento |
|-----------|-----------|---------------|
| Deep link | iOS: Universal Links, Android: App Links | Abre direto na tela de convite |
| Haptic feedback | iOS e Android | `Haptics.notificationAsync(Success)` ao aceitar convite |
| Keyboard avoiding | iOS e Android | `KeyboardAvoidingView` no formulário de aceite |
| SecureStore | iOS: Keychain, Android: Keystore | Armazena JWT de forma segura |

**Tratamento de Erros:**

- Token de convite expirado → Tela: "Convite expirado. Solicite novo convite ao administrador." + haptic error
- Token com assinatura inválida (403) → Tela: "Convite inválido" + botão "Voltar"
- Email já existe no cluster (409) → Inline error: "Você já faz parte deste cluster" + botão "Ir para o app"
- Sem conexão → Banner offline: "Sem conexão. Conecte-se para aceitar o convite."
- App não instalado → Deferred deep link: redireciona para store, após install abre na tela de convite

---

### Fluxo 2: Upload de Fotos e Vídeos

> Membro envia fotos e vídeos do rolo da câmera ou captura diretamente. O app mobile adiciona sync automático de novas fotos (background upload) como diferencial em relação ao web.

<!-- do blueprint: 07-critical_flows.md (Fluxo 1), 08-use_cases.md (UC-004), 09-state-models.md (Upload FE) -->

**Passos:**

1. Membro toca no botão "+" (FAB) na tab de galeria
2. Bottom sheet abre com opções: "Galeria do dispositivo", "Câmera", "Documentos"
3. **Galeria:** abre image picker nativo com seleção múltipla (até 20 por vez)
4. **Câmera:** abre câmera nativa (expo-camera); após captura, entra na fila
5. **Documentos:** abre document picker nativo (expo-document-picker)
6. Arquivos selecionados entram na fila do `uploadStore` com status `queued`
7. Upload queue processa até 3 arquivos concorrentes — status `uploading`
8. Barra de progresso individual em cada item da fila (mini-thumbnail + percentual)
9. Upload concluído → status `processing` → polling `GET /files/:id` a cada 3s
10. Backend retorna `status: ready` → haptic success + thumbnail real substitui placeholder na galeria
11. Se `status: error` → haptic error + ícone de erro + botão "Tentar novamente"
12. Fila visível como mini-bar colapsável acima das tabs (não bloqueia navegação)

**Sync Automático (background):**

1. Membro ativa "Sync automático" em Configurações → solicita permissão de acesso à galeria
2. App monitora novas fotos/vídeos no rolo da câmera (`expo-media-library`)
3. Novas mídias detectadas → enfileiradas automaticamente para upload
4. Upload acontece em background (iOS: background fetch + BGTaskScheduler, Android: WorkManager)
5. Notificação local ao concluir lote: "12 fotos sincronizadas com o cluster"
6. Sync respeita configurações: somente Wi-Fi, excluir screenshots, excluir apps específicos

**Componentes envolvidos:**

| Componente | Responsabilidade |
|------------|-----------------|
| `UploadFAB` | Floating action button "+" na galeria |
| `UploadOptionsSheet` | Bottom sheet com opções (Galeria, Câmera, Documentos) |
| `ImagePickerMulti` | Seleção múltipla de fotos/vídeos do rolo |
| `UploadMiniBar` | Barra colapsável acima das tabs com progresso geral |
| `UploadQueueItem` | Item individual: mini-thumbnail + barra + retry |
| `SyncSettingsScreen` | Configurações de sync automático |
| `BackgroundSyncService` | Serviço de sync em background (expo-task-manager) |

**Interações Nativas:**

| Interação | Plataforma | Comportamento |
|-----------|-----------|---------------|
| Image picker | iOS: PHPickerViewController, Android: MediaStore | Seleção múltipla nativa |
| Camera | iOS e Android | `expo-camera` com captura direta |
| Haptic feedback | iOS e Android | Success ao completar, error ao falhar |
| Background fetch | iOS: BGTaskScheduler, Android: WorkManager | Sync em background |
| Local notification | iOS e Android | Notifica conclusão de lote de sync |
| Permission request | iOS e Android | Solicitação de acesso à galeria e câmera |

**Tratamento de Erros:**

- Permissão negada (galeria/câmera) → Alert: "Permita acesso nas Configurações" + botão para abrir Settings do OS
- Upload interrompido (app em background / rede instável) → Retry automático quando reconectar; fila persistida em MMKV
- Token JWT expirado (401) → Pausa uploads; navega para `(auth)/login`; retoma após re-auth
- Nós insuficientes (503) → Toast: "Armazenamento indisponível" + pausa na fila; retry automático a cada 60s
- Espaço do cluster cheio → Toast: "Cluster sem espaço. Peça ao admin para adicionar nós."
- App fechado durante upload → Fila persistida em MMKV; retoma automaticamente no próximo launch
- Sem conexão → Banner offline; fila continua acumulando; upload inicia quando reconectar

**Estados do uploadStore (Zustand + MMKV):**

```
queued → uploading → processing → done
              ↓            ↓
            error ←──── error
              ↓
          uploading (retry)
```

---

### Fluxo 3: Visualizar e Navegar pelo Acervo

> Membro explora a galeria de fotos, vídeos e documentos com interações nativas: pinch-to-zoom, swipe entre fotos, pull-to-refresh. Fluxo mais acessado do app.

<!-- do blueprint: 08-use_cases.md (UC-005, UC-010) -->

**Passos:**

1. Membro abre o app → tab "Galeria" carrega automaticamente
2. `FlatList` com grid de thumbnails (~50KB cada) e lazy loading + cursor pagination
3. Pull-to-refresh recarrega dados mais recentes
4. Membro pode alternar entre modos: **Grid** (padrão) e **Timeline** (por data, com `SectionList`)
5. Barra de busca no topo com filtros rápidos: Fotos, Vídeos, Documentos
6. Membro toca em thumbnail → navega para `(app)/file/[id]` (tela de detalhe fullscreen)
7. **Foto:** imagem fullscreen com pinch-to-zoom e double-tap to zoom
8. **Vídeo:** player nativo fullscreen com controles (`expo-av`)
9. **Documento PDF:** preview da primeira página com botão "Abrir no leitor"
10. Swipe horizontal para navegar entre arquivos (prev/next)
11. Swipe down para fechar e voltar à galeria (gesto de dismiss)
12. Painel de metadados acessível via bottom sheet: data, tamanho, tipo, EXIF, localização
13. Botão "Baixar" → download do arquivo otimizado completo para o rolo da câmera ou Files app
14. Botão "Compartilhar" → share sheet nativo (iOS/Android)

**Componentes envolvidos:**

| Componente | Responsabilidade |
|------------|-----------------|
| `GalleryGrid` | `FlatList` com grid responsivo (3-4 colunas), `getItemLayout` para performance |
| `GalleryTimeline` | `SectionList` agrupado por mês/ano com sticky headers |
| `SearchBar` | Input com debounce 300ms e filtros rápidos (chips) |
| `FilterChips` | Chips: Fotos, Vídeos, Documentos, Todos |
| `FileDetailScreen` | Tela fullscreen com gestos (zoom, swipe, dismiss) |
| `ZoomableImage` | `react-native-gesture-handler` + `react-native-reanimated` para pinch-to-zoom |
| `VideoPlayer` | Player nativo via `expo-av` com controles fullscreen |
| `MetadataSheet` | Bottom sheet com metadados e EXIF |
| `ShareButton` | Share sheet nativo via `expo-sharing` |

**Interações Gestuais:**

| Gesto | Componente | Ação |
|-------|-----------|------|
| Pull-to-refresh | `GalleryGrid` / `GalleryTimeline` | `RefreshControl` recarrega dados |
| Toque | Thumbnail | Navega para tela de detalhe |
| Pinch-to-zoom | `ZoomableImage` | Zoom contínuo na foto |
| Double tap | `ZoomableImage` | Zoom 2x / reset zoom |
| Swipe horizontal | `FileDetailScreen` | Navega prev/next entre arquivos |
| Swipe down | `FileDetailScreen` | Dismiss — volta para galeria |
| Long press | Thumbnail | Seleciona para ações em lote (compartilhar, baixar) |

**Tratamento de Erros:**

- Galeria vazia → Empty state: ilustração + "Toque no + para fazer o primeiro upload"
- Nenhum resultado na busca → Empty state: "Nenhum resultado" + sugestão de ajustar filtros
- Thumbnail falha ao carregar → Placeholder com ícone de tipo + retry silencioso
- Chunk indisponível no download (nó offline) → Toast: "Arquivo temporariamente indisponível"
- Sem conexão → Banner offline + galeria exibe thumbnails do cache local (TanStack Query persisted)
- Galeria com 10k+ itens → `FlatList` com `windowSize` otimizado + `removeClippedSubviews`

---

### Fluxo 4: Liberação de Espaço no Dispositivo

> Membro libera espaço no celular substituindo arquivos já sincronizados (3+ réplicas confirmadas) por placeholders (thumbnails ~50KB). Funcionalidade mobile-exclusive de alto valor.

<!-- do blueprint: 08-use_cases.md (UC-009) -->

**Passos:**

1. Membro acessa tab "Configurações" → "Armazenamento"
2. Tela exibe: espaço usado por fotos sincronizadas vs. thumbnails vs. outros
3. Gráfico circular mostra distribuição do espaço no dispositivo
4. Botão "Liberar Espaço" com estimativa: "Libere até X GB"
5. Membro toca → bottom sheet de confirmação: "Substituir X arquivos por thumbnails?"
6. Membro confirma → haptic feedback (medium impact)
7. App consulta `GET /files?status=ready&replicas_min=3` para listar arquivos seguros
8. Para cada arquivo: substitui arquivo local por thumbnail (~50KB) no rolo da câmera
9. Barra de progresso: "Liberando espaço... X/Y arquivos (Z GB liberados)"
10. Conclusão → haptic success + tela de resumo: "X GB liberados, Y arquivos convertidos"
11. Na galeria, arquivos liberados exibem ícone de nuvem (☁) no canto — download sob demanda ao tocar

**Liberação Automática:**

1. Membro ativa "Liberação automática" em Configurações → define limiar (ex.: quando disco > 80%)
2. App monitora espaço em disco periodicamente
3. Quando limiar atingido → substitui automaticamente os arquivos mais antigos já sincronizados
4. Notificação local: "X GB liberados automaticamente. Seus arquivos estão seguros no cluster."

**Componentes envolvidos:**

| Componente | Responsabilidade |
|------------|-----------------|
| `StorageScreen` | Tela de armazenamento com gráfico e métricas |
| `StorageChart` | Gráfico circular (espaço usado por tipo) |
| `FreeSpaceButton` | CTA com estimativa de espaço liberável |
| `FreeSpaceConfirmSheet` | Bottom sheet de confirmação com detalhes |
| `FreeSpaceProgress` | Barra de progresso da liberação |
| `FreeSpaceSummary` | Resumo final: GB liberados, arquivos convertidos |
| `CloudBadge` | Ícone ☁ no thumbnail para arquivos armazenados na nuvem |
| `AutoFreeSettings` | Toggle + slider de limiar para liberação automática |

**Interações Nativas:**

| Interação | Plataforma | Comportamento |
|-----------|-----------|---------------|
| Haptic feedback | iOS e Android | Medium impact ao confirmar, success ao concluir |
| File system access | iOS: PhotoKit, Android: MediaStore | Substituir arquivos por thumbnails |
| Disk space query | iOS e Android | Verificar espaço disponível no dispositivo |
| Local notification | iOS e Android | Notificar liberação automática |

**Tratamento de Erros:**

- Arquivo sem replicação 3x confirmada → Excluído da lista; toast: "X arquivos aguardando replicação completa"
- Falha ao acessar rolo da câmera (permissão revogada) → Alert: "Permita acesso nas Configurações"
- Download sob demanda falha (nó offline) → Toast: "Arquivo temporariamente indisponível. Tentando réplica alternativa..."
- Sem conexão → Botão "Liberar Espaço" desabilitado: "Requer conexão para verificar replicação"

---

### Fluxo 5: Monitoramento e Alertas (Admin)

> Admin recebe push notifications para alertas críticos (nó perdido, chunk irrecuperável) e pode responder diretamente do celular. Gestão rápida on-the-go.

<!-- do blueprint: 07-critical_flows.md (Fluxo 3), 08-use_cases.md (UC-008) -->

**Passos:**

1. Sistema detecta anomalia (nó lost, replicação baixa, chunk corrupto)
2. Backend gera alerta e envia push notification via serviço de push (APNs / FCM)
3. Admin recebe notificação no celular com título e severidade (ex.: "⚠ Nó 'NAS-Home' perdido")
4. Admin toca na notificação → app abre na tela `(admin)/alerts`
5. Lista de alertas com severidade visual: vermelho (critical), amarelo (warning), azul (info)
6. Admin toca em alerta → expande com detalhes: causa, impacto, ação recomendada
7. Para alertas de nó: botão "Ver Nó" → navega para detalhes do nó com status e heartbeats
8. Para alertas auto-resolvidos: badge "Auto-resolvido" com timestamp
9. Admin pode marcar alerta como resolvido via swipe left → "Resolver"
10. Haptic feedback ao resolver

**Push Notifications:**

| Tipo de Alerta | Prioridade Push | Título | Exemplo |
|---------------|----------------|--------|---------|
| Nó lost | Alta (imediata) | "⚠ Nó perdido" | "NAS-Home sem heartbeat há 1h. Auto-healing iniciado." |
| Chunk irrecuperável | Alta (imediata) | "🔴 Dados em risco" | "3 chunks sem réplica saudável. Ação necessária." |
| Replicação baixa | Normal | "Replicação degradada" | "15 chunks com menos de 3 réplicas." |
| Espaço baixo (<20%) | Normal | "Espaço acabando" | "Nó S3-Backup com 85% de uso." |
| Nó suspect | Silenciosa | "Nó instável" | "VPS-Cloud sem heartbeat há 30min." |

**Componentes envolvidos:**

| Componente | Responsabilidade |
|------------|-----------------|
| `AlertListScreen` | Lista de alertas com filtro por severidade |
| `AlertCard` | Card com severidade visual, título, timestamp, ação |
| `AlertDetailSheet` | Bottom sheet com detalhes expandidos e ações |
| `NodeStatusScreen` | Detalhes do nó: status, capacidade, heartbeats, chunks |
| `PushNotificationHandler` | Registra token APNs/FCM, trata deep link de notificação |
| `AlertBadge` | Badge na tab de admin com contagem de alertas ativos |

**Interações Nativas:**

| Interação | Plataforma | Comportamento |
|-----------|-----------|---------------|
| Push notification | iOS: APNs, Android: FCM | Notificação com título e preview |
| Deep link da notificação | iOS e Android | Abre direto na tela de alertas |
| Swipe left | Lista de alertas | Revela botão "Resolver" |
| Haptic feedback | iOS e Android | Feedback ao resolver alerta |
| Badge count | iOS e Android | Número no ícone do app |

**Tratamento de Erros:**

- Permissão de push negada → Banner no app: "Ative notificações para receber alertas importantes" + botão Settings
- Push não recebido (token expirado) → App renova token APNs/FCM no launch; alerta visível na lista ao abrir o app
- Sem conexão → Alertas carregam do cache local (TanStack Query persisted); atualiza ao reconectar
- Admin não é admin (role check) → Tab "Admin" não visível; deep link redireciona para galeria

<!-- APPEND:fluxos -->

---

## Padrões de Interação Mobile

| Padrão | Onde Usado | Implementação |
|--------|-----------|---------------|
| Pull-to-refresh | Galeria, lista de alertas, lista de nós | `RefreshControl` no `FlatList`/`SectionList` |
| Swipe actions | Alertas (resolver), uploads (cancelar) | `react-native-gesture-handler` / Swipeable |
| Infinite scroll | Galeria com cursor pagination | `onEndReached` do `FlatList` + TanStack Query |
| Skeleton loading | Todas as telas com dados assíncronos | Componentes Skeleton customizados |
| Haptic feedback | Upload success/error, aceite de convite, liberar espaço, resolver alerta | `expo-haptics` |
| Bottom sheet | Opções de upload, confirmações, metadados, filtros | `@gorhom/bottom-sheet` |
| Toast/Snackbar | Feedback de ações (sucesso, erro, informativo) | `react-native-toast-message` |
| Pinch-to-zoom | Visualização de fotos em detalhe | `react-native-gesture-handler` + `react-native-reanimated` |
| Long press | Seleção múltipla na galeria | Custom gesture handler com estado de seleção |
| Swipe to dismiss | Tela de detalhe de arquivo | Gesto vertical para fechar e voltar |
| Offline banner | Todas as telas quando sem conexão | `@react-native-community/netinfo` + banner persistente |

---

## Histórico de Decisões

| Data | Decisão | Motivo |
|------|---------|--------|
| 2026-03-24 | Criação de cluster não disponível no mobile | Seed phrase de 12 palavras requer tela grande e atenção; admin usa web para setup |
| 2026-03-24 | Upload com fila persistida em MMKV | App pode ser fechado durante upload; fila retoma automaticamente no próximo launch |
| 2026-03-24 | Sync automático via expo-task-manager | Background fetch para sync de novas fotos sem intervenção manual |
| 2026-03-24 | Liberação de espaço como feature mobile-exclusive | Espaço em celular é limitado; substituir por thumbnails é alto valor para o usuário |
| 2026-03-24 | Push notifications para alertas críticos | Admin precisa responder rápido a nós perdidos; celular é o dispositivo mais acessível |
| 2026-03-24 | Thumbnails cacheados para modo offline | Galeria continua navegável sem conexão via TanStack Query persisted + MMKV |
