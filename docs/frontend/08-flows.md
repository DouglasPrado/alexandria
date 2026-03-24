# Fluxos de Interface

Documenta os fluxos criticos de interacao do usuario com o frontend. Cada fluxo mostra o caminho do usuario, os componentes envolvidos e os pontos de decisao/erro. Esses fluxos sao a base para testes E2E e validacao de requisitos.

<!-- do blueprint: 07-critical_flows.md + 08-use_cases.md + 09-state-models.md -->

---

## Fluxos Criticos

> Quais sao os 5 fluxos mais importantes da aplicacao?

| # | Fluxo | Atores | Criticidade | Casos de Uso |
|---|-------|--------|-------------|--------------|
| 1 | Criacao de Cluster e Onboarding | Admin | Alta | UC-001, UC-002 |
| 2 | Upload de Arquivo | Membro (admin/member) | Maxima | UC-004 |
| 3 | Galeria, Busca e Download | Membro (qualquer role) | Alta | UC-005, UC-010 |
| 4 | Recovery via Seed Phrase | Admin | Maxima | UC-007 |
| 5 | Monitoramento e Gestao de Nos | Admin | Alta | UC-003, UC-006, UC-008 |

---

### Fluxo 1: Criacao de Cluster e Onboarding

> Admin cria o cluster familiar, recebe a seed phrase, e convida membros. Executado uma unica vez — e pre-requisito para todo o sistema.

**Passos:**

1. Admin acessa `/cluster/setup` (SetupLayout sem sidebar)
2. ClusterSetup wizard exibe passo 1: campo "Nome do Cluster" (ex.: "Familia Prado")
3. Admin preenche nome e clica "Criar Cluster"
4. Frontend envia POST /clusters via `useCreateCluster` mutation
5. Backend gera seed phrase (12 palavras BIP-39), par de chaves, vault do admin
6. Frontend recebe seed phrase na response e exibe via SeedPhraseDisplay (grid 3x4, fonte mono-lg 20px)
7. SeedPhraseDisplay exibe instrucoes: "Anote em papel. Esta e a UNICA vez que a seed sera exibida."
8. Admin marca checkbox "Anotei a seed phrase em local seguro" (obrigatorio)
9. CopyButton permite copiar seed para clipboard (com toast de confirmacao)
10. Admin clica "Continuar" → redirect para `/gallery` (cluster ativo)
11. Admin acessa `/cluster` → MemberList + InviteForm
12. Admin preenche email + role no InviteForm e clica "Convidar"
13. Frontend envia POST /clusters/:id/invite via `useCreateInvite` → retorna link com token
14. Admin compartilha link (WhatsApp, email) — CopyButton para copiar
15. Convidado acessa `/invite/:token` → InviteAcceptPage valida token, exibe nome do cluster e role
16. Convidado preenche nome e clica "Aceitar Convite"
17. Frontend envia POST /invites/:token/accept via `useAcceptInvite`
18. Convidado e redirecionado para `/gallery` como membro do cluster

**Componentes envolvidos:**

| Componente | Feature | Responsabilidade |
|------------|---------|-----------------|
| ClusterSetup | cluster | Wizard de criacao: nome → seed → confirmacao |
| SeedPhraseDisplay | cluster | Grid 3x4 com 12 palavras em fonte mono grande |
| CopyButton | shared/ui | Copiar seed/token para clipboard com feedback |
| InviteForm | cluster | Formulario de convite: email + role |
| InviteAccept | cluster | Tela de aceite com nome do cluster e role |
| MemberList | cluster | Lista de membros com role badges e acoes |
| Toast | shared/ui | Feedback de sucesso/erro em cada etapa |

**Tratamento de Erros:**

| Etapa | Erro | UI Response |
|-------|------|------------|
| 4 | PostgreSQL indisponivel (503) | Toast error "Nao foi possivel criar o cluster. Tente novamente." + retry button |
| 4 | Falha na geracao de entropia (500) | Toast error "Erro interno. Contate o suporte." (nao exibe seed) |
| 8 | Admin nao marca checkbox | Botao "Continuar" desabilitado; tooltip "Confirme que anotou a seed" |
| 13 | Email ja existe no cluster (409) | FormField error inline "Este email ja e membro do cluster" |
| 15 | Token expirado | AlertBanner warning "Convite expirado. Solicite novo convite ao admin." |
| 15 | Token com assinatura invalida (403) | AlertBanner error "Convite invalido." + redirect para /login |
| 17 | Rede indisponivel | Toast error + retry button |

**Transicoes de estado:**

```
Cluster: (nao existe) → active
Member (admin): (nao existe) → joined
Invite: (nao existe) → pending → accepted/expired
Member (convidado): (nao existe) → joined
```

> 📐 Diagrama: [cluster-onboarding.mmd](../diagrams/frontend/cluster-onboarding.mmd)

---

### Fluxo 2: Upload de Arquivo

> Membro seleciona arquivos, acompanha upload e processamento ate o arquivo aparecer na galeria. Fluxo central — sem ele, o sistema nao armazena nada.

**Passos:**

1. Membro acessa `/gallery` e clica no botao "Upload" no header (ou FAB no mobile)
2. Modal/drawer de upload abre com FileUploader: zona de drag-and-drop + botao "Selecionar Arquivos"
3. Membro arrasta ou seleciona arquivo(s)
4. FileUploader valida tipo MIME (foto/video/documento) e tamanho (RN-F4: foto 50MB, video 10GB, doc 2GB)
5. Arquivos validos sao adicionados a fila via `uploadStore.addFiles(files)`
6. UploadQueue exibe lista com preview, nome, tamanho e status "queued"
7. `useUploadFile` mutation inicia upload do primeiro arquivo (max 3 concorrentes)
8. UploadProgress exibe barra com percentual, velocidade e tempo estimado
9. Upload concluido → status muda para "processing" no uploadStore
10. ProcessingStatus inicia polling GET /files/:id a cada 3s (via useQuery com refetchInterval)
11. ProcessingStatus exibe etapa atual: uploading → processing → distributing → ready
12. Quando status = "ready": Toast success "Arquivo processado com sucesso!"
13. TanStack Query invalida `files.all` e `cluster.health` → galeria atualiza automaticamente
14. UploadQueue marca arquivo como "done" com check verde
15. Membro pode continuar adicionando arquivos enquanto anteriores processam

**Componentes envolvidos:**

| Componente | Feature | Responsabilidade |
|------------|---------|-----------------|
| FileUploader | upload | Drag-and-drop + seletor com validacao tipo/tamanho |
| UploadQueue | upload | Lista de arquivos na fila com status individual |
| UploadProgress | upload | Barra de progresso com velocidade e ETA |
| ProcessingStatus | upload | Indicador de etapa do pipeline (animacao lucide-animated) |
| Toast | shared/ui | Notificacao de sucesso/erro por arquivo |
| Badge | shared/ui | Status badge na sidebar (contador de uploads pendentes) |

**Tratamento de Erros:**

| Etapa | Erro | UI Response |
|-------|------|------------|
| 4 | Tipo de arquivo nao suportado | Toast warning "Tipo de arquivo nao suportado: {mimeType}" + arquivo rejeitado |
| 4 | Arquivo excede limite de tamanho | Toast warning "Arquivo muito grande. Maximo: {limit}" |
| 4 | Menos de 3 nos ativos (503) | FileUploader desabilitado com `disabledReason="Minimo 3 nos ativos para upload"` |
| 7 | Upload interrompido (rede) | uploadStore status → "error"; UploadQueue exibe retry button por arquivo |
| 10 | Pipeline falhou (status = "error") | ProcessingStatus exibe Badge error + mensagem do backend + retry button |
| 10 | Arquivo duplicado (hash identico) | Toast info "Arquivo ja existe no cluster. Chunks reutilizados." |
| 7 | Rate limit S3/R2 (429) | Upload pausado; retry automatico com backoff; UploadProgress exibe "Aguardando..." |

**Transicoes de estado (frontend):**

```
UploadItem: queued → uploading → processing → done
                  ↘ error (retry → uploading)

File (backend): processing → ready
                          ↘ error (retry → processing)
```

> 📐 Diagrama: [upload-flow.mmd](../diagrams/frontend/upload-flow.mmd)

---

### Fluxo 3: Galeria, Busca e Download

> Membro navega pelo acervo familiar em grid ou timeline, busca por nome/tipo/data, visualiza preview e baixa arquivo otimizado.

**Passos:**

1. Membro acessa `/gallery` (AppLayout)
2. GalleryPage carrega via SSR (Server Component fetch inicial) + CSR hydration
3. SearchBar exibe campo de busca + filtros (media_type: foto/video/documento)
4. GalleryGrid exibe thumbnails em grid responsivo (2 colunas mobile → 6+ desktop)
5. Thumbnails carregam via lazy loading (IntersectionObserver) com Skeleton placeholder
6. Infinite scroll: ao chegar a 80% do scroll, prefetch da proxima pagina via `useFiles` (cursor-based)
7. Membro pode alternar para TimelineView (agrupado por data com headers de mes/ano)
8. Membro clica em thumbnail → FileDetail modal abre com preview ampliado
9. FilePreview exibe: foto fullscreen WebP, video player 480p, PDF viewer (primeira pagina)
10. FileDetail exibe metadata: nome original, tamanho, data, tipo, hash, status
11. Membro clica "Download" → `useFileDownload` mutation inicia download
12. Frontend baixa arquivo otimizado completo (chunks reassemblados pelo backend)
13. Browser salva arquivo com nome original

**Componentes envolvidos:**

| Componente | Feature | Responsabilidade |
|------------|---------|-----------------|
| GalleryGrid | gallery | Grid responsivo com lazy loading e infinite scroll |
| GalleryItem | gallery | Thumbnail individual com nome, status badge, menu contexto |
| TimelineView | gallery | Navegacao cronologica com headers de data |
| FilePreview | gallery | Preview ampliado: foto, video player, PDF |
| FileDetail | gallery | Modal com metadata, status, acoes (download, delete) |
| SearchBar | gallery | Busca por nome + filtros media_type e periodo |
| GalleryEmpty | gallery | Empty state com ilustracao e CTA para upload |
| Skeleton | shared/ui | Placeholder durante carregamento de thumbnails |

**Tratamento de Erros:**

| Etapa | Erro | UI Response |
|-------|------|------------|
| 2 | API indisponivel (500/503) | EmptyState com icone AlertTriangle + "Nao foi possivel carregar a galeria" + retry button |
| 6 | Proxima pagina falha | Toast warning + retry automatico; pagina atual permanece visivel |
| 9 | Preview indisponivel (no offline) | FilePreview exibe Skeleton + "Preview temporariamente indisponivel" |
| 11 | Chunk indisponivel durante download | Toast error "Arquivo temporariamente indisponivel. Tente novamente." |
| 11 | Chunk corrompido | Backend tenta outra replica; se falha → Toast error "Arquivo corrompido" + Badge error |
| 4 | Nenhum resultado na busca | GalleryEmpty com "Nenhum arquivo encontrado" + sugestao de ajustar filtros |
| 4 | Galeria vazia (sem uploads) | GalleryEmpty com ilustracao + CTA "Faca seu primeiro upload" → abre modal/drawer de upload |

**Filtros via URL State:**

```
/gallery?media_type=photo&search=praia&view=timeline
```

- `media_type`: photo, video, document (Select)
- `search`: busca por nome (Input search)
- `view`: grid, timeline (Toggle)
- Filtros sincronizados via `useSearchParams` → TanStack Query keys → refetch automatico

> 📐 Diagrama: [gallery-flow.mmd](../diagrams/frontend/gallery-flow.mmd)

---

### Fluxo 4: Recovery via Seed Phrase

> Admin perdeu o servidor e reconstroi o sistema completo usando a seed phrase de 12 palavras. Fluxo CSR-only — seed nunca e renderizada no servidor (principio Zero-Knowledge).

**Passos:**

1. Admin provisiona nova VPS e instala Orquestrador via Docker Compose
2. Admin acessa `/recovery` (AuthLayout, CSR-only)
3. RecoveryForm exibe SeedPhraseInput: 12 campos individuais para cada palavra
4. SeedPhraseInput aceita paste de todas as 12 palavras de uma vez (split por espaco)
5. SeedPhraseInput valida cada palavra contra wordlist BIP-39 em tempo real (client-side via core-sdk WASM)
6. Admin clica "Iniciar Recovery"
7. Frontend envia POST /recovery/seed via `useStartRecovery` mutation
8. RecoveryProgress inicia polling GET /recovery/status a cada 5s (refetchInterval)
9. RecoveryProgress exibe Progress (steps) com 6 etapas:
   - Seed → Validando seed phrase ✓
   - Vaults → Buscando e descriptografando vaults...
   - Manifests → Escaneando nos em busca de manifests...
   - Rebuild → Reconstruindo banco de metadados...
   - Nodes → Aguardando reconexao dos nos...
   - Integrity → Validando integridade dos dados...
10. Cada etapa exibe contadores em tempo real (ex.: "42/150 manifests encontrados")
11. Recovery concluido → RecoveryReport exibe relatorio:
    - Arquivos recuperados: X
    - Chunks faltantes: Y
    - Nos reconectados: Z/W
    - Alertas pendentes: N
12. Admin clica "Ir para o Cluster" → redirect para `/gallery`
13. TanStack Query `invalidateQueries()` global — todo o cache e descartado

**Componentes envolvidos:**

| Componente | Feature | Responsabilidade |
|------------|---------|-----------------|
| RecoveryForm | recovery | Container do fluxo de recovery |
| SeedPhraseInput | cluster | 12 campos de input com validacao BIP-39 (core-sdk WASM) |
| RecoveryProgress | recovery | Progress (steps) com 6 etapas + contadores em tempo real |
| RecoveryReport | recovery | Relatorio final: arquivos, chunks, nos, alertas |
| Progress | shared/ui | Barra de progresso por etapa (steps variant) |
| Toast | shared/ui | Feedback de sucesso/erro |

**Tratamento de Erros:**

| Etapa | Erro | UI Response |
|-------|------|------------|
| 5 | Palavra fora do wordlist BIP-39 | SeedPhraseInput: campo individual com borda vermelha + tooltip "Palavra invalida" |
| 7 | Seed phrase incorreta (valida mas errada) | Toast error "Seed incorreta — vaults nao puderam ser descriptografados" |
| 9 (Vaults) | Vaults nao encontrados em nenhum no | RecoveryProgress pausa + AlertBanner warning "Vaults nao encontrados. Insira credenciais S3/R2 manualmente." + formulario manual |
| 9 (Manifests) | Nenhum manifest encontrado | RecoveryProgress para + AlertBanner critical "Recovery impossivel sem manifests." |
| 9 (Nodes) | Nos locais offline | RecoveryProgress continua; nota "X nos ainda offline — reconectarao quando disponveis" |
| 9 (Integrity) | Chunks faltantes | RecoveryReport exibe lista de arquivos afetados com Badge "corrompido" |

**Regras de seguranca:**

- `/recovery` e CSR-only (`"use client"`) — seed nunca e renderizada no servidor
- Seed phrase nunca e enviada em logs, telemetria ou error reports
- Validacao BIP-39 acontece client-side via core-sdk WASM (sem round-trip ao servidor)
- Apos recovery, seed e limpa da memoria (garbage collected)

> 📐 Diagrama: [recovery-flow.mmd](../diagrams/frontend/recovery-flow.mmd)

---

### Fluxo 5: Monitoramento e Gestao de Nos

> Admin monitora saude do cluster, gerencia nos de armazenamento, visualiza alertas e executa drain de nos. Inclui registro de novos nos e acompanhamento de auto-healing.

**Passos — Monitoramento:**

1. Admin acessa `/health` (AppLayout, admin-only)
2. HealthDashboard carrega via SSR + polling CSR (30s via useClusterHealth)
3. Dashboard exibe MetricCards: nos online/total, capacidade usada/total, replicacao saudavel (%), arquivos total, alertas ativos
4. AlertList exibe alertas ativos ordenados por severidade (critical primeiro)
5. Cada AlertDetail mostra: tipo, mensagem, entidade relacionada, timestamp, sugestao de acao
6. Alertas criticos exibem AlertBanner no topo do AppLayout (visivel em todas as paginas)
7. Admin pode resolver alerta manualmente via `useResolveAlert` (optimistic update — remove da lista)

**Passos — Registro de No:**

8. Admin acessa `/nodes` e clica "Adicionar No"
9. AddNodeForm exibe selecao de tipo: Local (PC/NAS), S3, R2, B2, VPS
10. Campos dinamicos por tipo: S3 → bucket, region, access_key, secret_key; Local → endpoint, path
11. Admin preenche e clica "Testar Conexao"
12. Frontend envia POST /nodes via `useRegisterNode`
13. Backend testa conectividade (PUT/GET chunk de teste) e retorna resultado
14. Sucesso → NodeCard aparece na lista com StatusDot online + capacidade
15. Falha → FormField errors com detalhes do provedor + botao "Re-testar"

**Passos — Drain de No:**

16. Admin acessa `/nodes/:nodeId` → NodeDetail
17. NodeDetail exibe: endpoint, tipo, capacidade, chunks armazenados, ultimo heartbeat
18. Admin clica "Desconectar" → ConfirmDialog "Tem certeza? Chunks serao migrados para outros nos."
19. Admin confirma → `useDrainNode` mutation
20. DrainProgress exibe: chunks migrados/total, tempo estimado, barra de progresso
21. DrainProgress faz polling GET /nodes/:id a cada 5s
22. Drain completo → NodeCard desaparece da lista; Toast success "No desconectado com sucesso"

**Componentes envolvidos:**

| Componente | Feature | Responsabilidade |
|------------|---------|-----------------|
| HealthDashboard | health | Dashboard com MetricCards e metricas do cluster |
| AlertList | health | Lista de alertas com severity badges e acoes |
| AlertDetail | health | Detalhes do alerta com sugestao de acao |
| ReplicationStatus | health | Indicador visual de % chunks com 3+ replicas |
| NodeList | nodes | Lista de nos com StatusDot, tipo e capacidade |
| NodeCard | nodes | Card individual com status, capacidade, acoes |
| AddNodeForm | nodes | Formulario dinamico por tipo de no |
| NodeDetail | nodes | Detalhes de um no especifico |
| DrainProgress | nodes | Progresso de migracao de chunks |
| MetricCard | shared | Card de metrica com valor, tendencia e tooltip |
| ConfirmDialog | shared | Dialog de confirmacao para acoes destrutivas |
| AlertBanner | shared/ui | Banner de alerta critico no topo da pagina |

**Tratamento de Erros:**

| Etapa | Erro | UI Response |
|-------|------|------------|
| 2 | API indisponivel | EmptyState + retry; metricas exibem ultimo valor cacheado |
| 7 | Falha ao resolver alerta | Rollback optimistic update; Toast error "Nao foi possivel resolver o alerta" |
| 13 | Credenciais S3 invalidas | AddNodeForm error "Credenciais invalidas. Verifique access key e secret." |
| 13 | Bucket nao existe | AddNodeForm error "Bucket '{name}' nao encontrado na regiao '{region}'" |
| 18 | Remocao deixaria < 3 nos | ConfirmDialog bloqueado: "Nao e possivel remover — minimo 3 nos necessario" |
| 21 | Espaco insuficiente nos restantes | DrainProgress pausa + AlertBanner "Espaco insuficiente. Adicione nos antes de continuar." |

**Transicoes de estado dos nos:**

```
Node: (registro) → online → suspect (30min sem heartbeat)
                           → lost (1h sem heartbeat) → auto-healing
      online → draining (admin inicia drain) → disconnected (drain completo)
      suspect → online (heartbeat retomado)
```

**Transicoes de estado dos alertas:**

```
Alert: created → resolved (manual pelo admin ou auto pelo sistema)
```

> 📐 Diagrama: [monitoring-flow.mmd](../diagrams/frontend/monitoring-flow.mmd)

<!-- APPEND:fluxos -->

---

## Microfrontends (quando aplicavel)

> O sistema requer particionamento em microfrontends?

- [x] Nao — aplicacao monolitica e suficiente

<!-- do blueprint: 02-architecture_principles.md (Simplicidade Operacional — time de 1 pessoa, monolito preferido) -->

Justificativa: Alexandria e mantido por 1 pessoa e usado por ~10 membros familiares. Microfrontends adicionam complexidade de build, deploy e compartilhamento de estado sem beneficio para esta escala. Next.js App Router com code splitting automatico por rota e suficiente.

> Para detalhes sobre testes de fluxos, (ver 09-tests.md).

---

## Historico de Decisoes

| Data | Decisao | Motivo |
|------|---------|--------|
| 2026-03-23 | Recovery e CSR-only | Seed phrase nunca renderizada no servidor — principio Zero-Knowledge |
| 2026-03-23 | Polling para processamento de upload | Status muda no backend (pipeline assincrono); polling simples e suficiente para escala familiar |
| 2026-03-23 | Infinite scroll na galeria (nao paginacao) | UX mais fluida para navegar centenas de fotos; cursor-based para performance |
| 2026-03-23 | Monolito (sem microfrontends) | Simplicidade operacional — 1 dev, ~10 usuarios, sem necessidade de deploy independente |
| 2026-03-23 | AddNodeForm com campos dinamicos por tipo | Cada tipo de no (S3, R2, local) tem campos diferentes; formulario adaptativo |
| 2026-03-23 | Optimistic update somente em resolver alerta | Baixo risco de rollback; melhora UX do admin que resolve alertas em sequencia |
