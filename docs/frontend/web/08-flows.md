# Fluxos de Interface

Documenta os fluxos críticos de interação do usuário com o frontend web (Next.js 16). Cada fluxo mostra o caminho do usuário, os componentes envolvidos, transições de página/estado e pontos de decisão/erro. Esses fluxos são a base para testes E2E e validação de requisitos.

<!-- do blueprint: 07-critical_flows.md, 08-use_cases.md, 09-state-models.md -->

---

## Fluxos Críticos

| # | Fluxo | Atores | Criticidade |
|---|-------|--------|-------------|
| 1 | Criação de Cluster e Onboarding | Admin não-autenticado | Alta |
| 2 | Upload e Distribuição de Arquivo | Membro autenticado | Alta |
| 3 | Visualizar e Navegar pelo Acervo | Membro autenticado (qualquer role) | Alta |
| 4 | Recovery via Seed Phrase | Admin | Alta |
| 5 | Monitoramento e Gestão de Nós | Admin | Média |

---

### Fluxo 1: Criação de Cluster e Onboarding

> Admin cria o cluster familiar pela primeira vez, recebe a seed phrase de 12 palavras, e convida membros. É o ponto de entrada — sem cluster, nada funciona.

<!-- do blueprint: 07-critical_flows.md (Fluxo 4), 08-use_cases.md (UC-001, UC-002) -->

**Passos:**

1. Admin acessa `/` e é redirecionado para `/setup` (sem cluster existente)
2. Sistema exibe formulário com campo de nome do cluster (ex.: "Família Prado")
3. Admin preenche nome e define sua senha pessoal → clica "Criar Cluster"
4. Frontend envia `POST /clusters` — exibe loading skeleton durante a requisição
5. Backend gera seed phrase (BIP-39), master key, par de chaves, vault do admin
6. Frontend recebe resposta 201 e navega para `/setup/seed`
7. Tela exibe seed phrase de 12 palavras com layout destacado (cards individuais por palavra)
8. Instrução: "Anote em papel. Esta é a ÚNICA vez que a seed será exibida."
9. Admin marca checkbox obrigatório "Anotei a seed phrase em local seguro"
10. Botão "Continuar" desbloqueia → navega para `/dashboard`
11. Dashboard exibe estado vazio com CTA: "Adicionar primeiro nó" + "Convidar membro"
12. Admin clica "Convidar membro" → modal com formulário (email, role: membro/leitura)
13. Frontend envia `POST /clusters/:id/invite` → exibe link de convite copiável
14. Convidado acessa link `/invite/:token` → tela de aceite com nome do cluster e campo para nome
15. Convidado preenche nome, define senha → `POST /invites/:token/accept`
16. Frontend redireciona convidado para `/dashboard` (galeria do cluster)

**Componentes envolvidos:**

| Componente | Responsabilidade |
|------------|-----------------|
| `SetupClusterForm` | Captura nome do cluster e senha do admin |
| `SeedPhraseDisplay` | Exibe 12 palavras em grid 3×4 com destaque visual |
| `SeedConfirmCheckbox` | Checkbox obrigatório para desbloquear navegação |
| `InviteMemberModal` | Formulário de convite (email + role selector) |
| `InviteLinkCopy` | Exibe link com botão "Copiar" (clipboard API) |
| `AcceptInviteForm` | Captura nome e senha do convidado |
| `EmptyStateDashboard` | Estado vazio com CTAs de onboarding |

**Tratamento de Erros:**

- Falha na geração de entropia (500) → Toast de erro: "Erro ao criar cluster. Tente novamente."
- PostgreSQL indisponível (503) → Toast: "Serviço temporariamente indisponível"; seed NÃO é exibida
- Admin não confirma seed → Cluster criado mas alerta persistente no dashboard: "Você ainda não confirmou sua seed phrase"
- Token de convite expirado → Tela: "Convite expirado. Solicite novo convite ao administrador."
- Email já existe no cluster (409) → Inline error no modal: "Este membro já faz parte do cluster"
- Token com assinatura inválida (403) → Tela: "Convite inválido"

**Transições de página:**

```
/ → /setup → /setup/seed → /dashboard
                                 ↓
                          /invite/:token → /dashboard (convidado)
```

---

### Fluxo 2: Upload e Distribuição de Arquivo

> Membro envia fotos, vídeos ou documentos. O frontend gerencia a fila de upload, exibe progresso e faz polling até o pipeline backend concluir. É o fluxo central do produto.

<!-- do blueprint: 07-critical_flows.md (Fluxo 1), 08-use_cases.md (UC-004), 09-state-models.md (Upload FE + File) -->

**Passos:**

1. Membro acessa `/dashboard` (galeria) e clica "Upload" ou arrasta arquivos sobre a área
2. Frontend valida arquivos localmente (tipo MIME permitido, tamanho máximo)
3. Arquivos válidos entram na fila do `uploadStore` com status `queued`
4. Upload queue inicia até 3 uploads concorrentes — status muda para `uploading`
5. Para cada arquivo: `POST /files/upload` (multipart/form-data) com barra de progresso (XHR/fetch progress)
6. Resposta 201 → status muda para `processing`; UI exibe spinner no thumbnail placeholder
7. Frontend faz polling `GET /files/:id` a cada 3s para acompanhar pipeline backend
8. Backend retorna `status: "ready"` → status muda para `done`; thumbnail real substitui placeholder
9. Se `status: "error"` → exibe ícone de erro + botão "Tentar novamente"
10. Membro pode continuar navegando enquanto uploads acontecem (componente fixo no canto inferior)

**Componentes envolvidos:**

| Componente | Responsabilidade |
|------------|-----------------|
| `UploadDropzone` | Área de drag-and-drop + botão de seleção de arquivos |
| `UploadQueue` | Lista flutuante (bottom-right) com status de cada arquivo |
| `UploadQueueItem` | Progresso individual: barra, percentual, velocidade, retry |
| `FileValidation` | Validação client-side (tipo MIME, tamanho) |
| `GalleryGrid` | Grid de thumbnails com lazy loading |
| `ThumbnailPlaceholder` | Skeleton/spinner durante processing |

**Tratamento de Erros:**

- Tipo de arquivo não suportado → Inline error no dropzone: "Formato não suportado: .{ext}"
- Upload interrompido (falha de rede) → Status `error` no queue item + botão "Tentar novamente"; retry automático com backoff
- Token JWT expirado (401) → Redirect para `/login`; uploads pendentes preservados no `uploadStore`
- Nós insuficientes (503) → Toast: "Armazenamento indisponível — aguarde até que nós sejam adicionados"
- Pipeline falhou no backend (`status: error`) → Queue item mostra erro + botão "Tentar novamente"
- Arquivo duplicado (hash idêntico) → Toast informativo: "Arquivo já existe no cluster"; chunks reutilizados
- Aba fechada durante upload → Alerta `beforeunload`: "Uploads em andamento serão interrompidos"

**Estados do uploadStore (Zustand):**

```
queued → uploading → processing → done
              ↓            ↓
            error ←──── error
              ↓
          uploading (retry)
```

---

### Fluxo 3: Visualizar e Navegar pelo Acervo

> Membro explora a galeria de arquivos com thumbnails, filtros e busca. Pode visualizar previews e baixar o arquivo otimizado. Fluxo mais acessado do sistema.

<!-- do blueprint: 08-use_cases.md (UC-005, UC-010) -->

**Passos:**

1. Membro acessa `/dashboard` — galeria carrega com grid de thumbnails (lazy loading + cursor pagination)
2. Thumbnails pré-gerados (~50KB) carregam progressivamente via `<Image>` do Next.js
3. Membro pode alternar entre modos: **Grid** (padrão) ou **Timeline** (por data)
4. Membro usa barra de busca para filtrar por nome, tipo, data ou filtros rápidos (Fotos/Vídeos/Documentos)
5. Frontend envia `GET /files?q={query}&type={tipo}&cursor={cursor}` com debounce de 300ms
6. Resultados atualizam o grid com animação de transição
7. Membro clica em arquivo → modal lightbox abre com preview ampliado
   - Foto: thumbnail expandido (resolução maior)
   - Vídeo: player embutido com preview 480p
   - Documento PDF: preview da primeira página
   - Documento genérico: ícone por extensão + metadados
8. Lightbox exibe metadados (data, tamanho, tipo, EXIF quando disponível)
9. Botão "Baixar" inicia download do arquivo otimizado completo
10. Frontend solicita `GET /files/:id/download` → backend reassembla chunks, descriptografa e serve

**Componentes envolvidos:**

| Componente | Responsabilidade |
|------------|-----------------|
| `GalleryGrid` | Grid responsivo com lazy loading e infinite scroll |
| `GalleryTimeline` | Visualização por data com separadores por mês/ano |
| `SearchBar` | Input com debounce, filtros rápidos (tipo, data) |
| `FilterChips` | Chips de filtro ativo (Fotos, Vídeos, Documentos) |
| `FileLightbox` | Modal de preview com navegação prev/next via teclado |
| `VideoPlayer` | Player 480p embutido no lightbox |
| `FileMetadata` | Painel lateral com metadados e EXIF |
| `DownloadButton` | Inicia download com indicador de progresso |
| `VirtualizedList` | Virtualização para galerias com 10k+ itens |

**Tratamento de Erros:**

- Nenhum resultado encontrado → Empty state: "Nenhum arquivo encontrado" + sugestão de ajustar filtros
- Thumbnail falha ao carregar → Placeholder com ícone de tipo + retry silencioso
- Chunk indisponível no download (nó offline) → Toast: "Arquivo temporariamente indisponível. Tentando réplica alternativa..."
- Chunk corrompido durante download → Backend tenta próxima réplica; se todas falham → Toast: "Arquivo danificado"
- Galeria vazia (primeiro acesso) → Empty state com CTA: "Faça seu primeiro upload"

**Interações web específicas:**

- Navegação por teclado no lightbox: `←` / `→` para prev/next, `Esc` para fechar
- Scroll infinito no grid com interseção observer
- URL atualiza com filtros ativos (query params) para compartilhamento de links
- Prefetch de thumbnails adjacentes no viewport

---

### Fluxo 4: Recovery via Seed Phrase

> Admin perdeu o servidor e reconstrói o sistema usando a seed phrase de 12 palavras. Fluxo crítico de disaster recovery acessado via interface web dedicada.

<!-- do blueprint: 07-critical_flows.md (Fluxo 2), 08-use_cases.md (UC-007) -->

**Passos:**

1. Admin instala Orquestrador via `docker compose up` na nova VPS
2. Admin acessa o Web Client — sistema detecta banco vazio e redireciona para `/recovery`
3. Tela exibe 12 campos de input (um por palavra) com autocomplete do wordlist BIP-39
4. Admin insere as 12 palavras da seed phrase
5. Frontend valida localmente contra wordlist BIP-39 (feedback inline por campo)
6. Admin clica "Iniciar Recovery" → `POST /recovery` com seed phrase
7. Frontend navega para `/recovery/progress` com stepper de progresso
8. Backend inicia processo: derivar master key → buscar vaults → descriptografar → reconstruir DB
9. Frontend faz polling `GET /recovery/status` a cada 5s — stepper atualiza:
   - Etapa 1: "Validando seed phrase..." ✓
   - Etapa 2: "Buscando vaults nos nós..." ✓ / ⚠
   - Etapa 3: "Descriptografando vaults..." ✓
   - Etapa 4: "Conectando a S3/R2..." ✓
   - Etapa 5: "Reconstruindo banco de dados..." (progresso: X/Y manifests)
   - Etapa 6: "Validando integridade..." (progresso: X/Y chunks)
10. Recovery completo → tela de sucesso com relatório (arquivos recuperados, chunks faltantes, nós reconectados)
11. Admin é informado para atualizar DNS → link para documentação
12. Admin clica "Ir para Dashboard" → redirecionado para `/dashboard`

**Componentes envolvidos:**

| Componente | Responsabilidade |
|------------|-----------------|
| `SeedPhraseInput` | 12 inputs com autocomplete BIP-39 e validação inline |
| `RecoveryStepper` | Stepper vertical com 6 etapas e indicador de progresso |
| `RecoveryProgress` | Barra de progresso para etapas longas (rebuild DB, validação) |
| `RecoveryReport` | Relatório final: arquivos, chunks, nós, alertas pendentes |
| `RecoveryErrorState` | Exibe erro específico com ação recomendada |

**Tratamento de Erros:**

- Palavra fora do wordlist BIP-39 → Inline error no campo: "Palavra inválida" (vermelho) com sugestões
- Seed phrase incorreta (válida mas errada) → Etapa 3 falha: "Seed incorreta — vaults não puderam ser descriptografados. Verifique as palavras."
- Vaults não encontrados em nenhum nó → Etapa 2 com warning: "Vaults não encontrados. Insira credenciais S3/R2 manualmente." + formulário de fallback
- Manifests não encontrados → Alerta crítico: "Recovery impossível sem manifests. Chunks existem mas não podem ser reassemblados."
- PostgreSQL falha durante rebuild → Etapa 5 com retry automático por lotes; progresso salvo

**Transições de página:**

```
/ → /recovery → /recovery/progress → /dashboard
                                  ↘ /recovery (retry se falhar)
```

---

### Fluxo 5: Monitoramento e Gestão de Nós

> Admin monitora a saúde do cluster, gerencia nós de armazenamento (adicionar, desconectar) e responde a alertas. Fluxo administrativo recorrente.

<!-- do blueprint: 07-critical_flows.md (Fluxo 3), 08-use_cases.md (UC-003, UC-006, UC-008) -->

**Passos:**

1. Admin acessa `/dashboard/nodes` — painel exibe lista de nós com status visual (badge colorido)
2. Cada nó mostra: nome, tipo (S3/R2/Local/VPS), status (online/suspect/lost), capacidade (usado/total), último heartbeat
3. Badge de alertas ativos no header com contagem (ícone de sino com número)
4. Admin clica no badge → dropdown lista alertas ordenados por severidade (critical primeiro)
5. Admin clica em alerta → expande detalhes e ação recomendada
6. **Adicionar nó:** Admin clica "Adicionar Nó" → modal com tipo selector (Local, S3, R2, VPS) → formulário de configuração (endpoint, credenciais) → teste de conectividade → sucesso/erro
7. **Desconectar nó:** Admin seleciona nó → clica "Desconectar" → modal de confirmação com informações: chunks armazenados, réplicas dependentes, estimativa de tempo de drain
8. Admin confirma → nó entra em status `draining` → barra de progresso de migração de chunks
9. Frontend faz polling `GET /nodes/:id` a cada 10s durante drain
10. Drain completo → nó marcado como `disconnected` → removido da lista ativa

**Componentes envolvidos:**

| Componente | Responsabilidade |
|------------|-----------------|
| `NodeList` | Tabela/cards de nós com status, capacidade e heartbeat |
| `NodeStatusBadge` | Badge colorido: verde (online), amarelo (suspect), vermelho (lost), azul (draining) |
| `AlertBell` | Ícone de sino no header com contagem de alertas ativos |
| `AlertDropdown` | Lista de alertas com severidade, mensagem e ação |
| `AddNodeModal` | Wizard: tipo → configuração → teste → confirmação |
| `NodeConnectivityTest` | Teste de PUT/GET com feedback visual (spinner → check/cross) |
| `DrainProgressBar` | Barra de progresso da migração de chunks |
| `DisconnectConfirmModal` | Modal com impacto estimado e confirmação |
| `ClusterHealthSummary` | Resumo: total de nós, nós online, replicação saúde, espaço total |

**Tratamento de Erros:**

- Credenciais S3 inválidas → Inline error no modal: "Autenticação falhou — verifique access key e secret"
- Bucket não existe → Mensagem específica: "Bucket não encontrado" + sugestão de correção
- Teste de conectividade falha → Exibe erro com detalhes + botão "Testar novamente"
- Remoção deixaria cluster com <3 nós → Modal bloqueado: "Não é possível remover — mínimo de 3 nós necessário"
- Espaço insuficiente nos nós restantes para drain → Toast: "Espaço insuficiente para migração completa" + progresso parcial
- Nó suspect volta a online durante monitoramento → Badge atualiza automaticamente; alerta auto-resolvido

**Estados visuais dos nós:**

```
online (verde) → suspect (amarelo) → lost (vermelho)
     ↓
draining (azul, com progresso) → disconnected (cinza, removido)
```

<!-- APPEND:fluxos -->

---

## Microfrontends (quando aplicável)

- [x] Não — aplicação monolítica é suficiente

O Alexandria web é um monólito Next.js com App Router. A escala do projeto (1 cluster familiar, 3-50 usuários) não justifica particionamento em microfrontends. A separação de domínios é feita via feature folders (`features/gallery`, `features/nodes`, `features/settings`) com fronteiras de importação rígidas.

<!-- do blueprint: 10-architecture_decisions.md (ADR-006: simplicidade operacional) -->

---

## Histórico de Decisões

| Data | Decisão | Motivo |
|------|---------|--------|
| 2026-03-24 | Monólito Next.js sem microfrontends | Escala familiar (3-50 usuários) não justifica complexidade de MFE |
| 2026-03-24 | Upload queue com max 3 concorrentes | Evitar saturação de banda e rate limiting do backend (10 uploads/min) |
| 2026-03-24 | Polling a cada 3s para status de processamento | SSE/WebSocket seria over-engineering para v1; polling simples e confiável |
| 2026-03-24 | Lightbox com navegação por teclado | Experiência nativa de galeria; acessibilidade (a11y) |
| 2026-03-24 | Recovery como fluxo web dedicado (/recovery) | Admin já precisa de browser para acessar; CLI seria barreira adicional |
