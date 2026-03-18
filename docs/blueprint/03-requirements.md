# Requisitos

---

## Requisitos Funcionais

> O que o sistema precisa fazer para resolver o problema descrito na Visão?

**Legenda de Prioridade (MoSCoW):**
- **Must** — obrigatório para o lançamento; sem ele o sistema não resolve o problema
- **Should** — importante, mas o sistema funciona sem ele no curto prazo
- **Could** — desejável se houver tempo e recurso disponível
- **Won't** — fora do escopo desta versão, mas documentado para o futuro

### Gerenciamento de Cluster Familiar

| ID | Descrição | Prioridade | Status | Objetivo |
|----|-----------|------------|--------|----------|
| RF-001 | Criar grupo familiar com identidade criptográfica (cluster_id = hash da chave pública) | Must | Proposto | OBJ-01 |
| RF-002 | Convidar membros via token assinado com expiração | Must | Proposto | OBJ-06 |
| RF-003 | Definir permissões por membro (admin, membro, leitura) | Must | Proposto | OBJ-06 |
| RF-004 | Auditoria de atividades do cluster (log de operações) | Should | Proposto | OBJ-01 |
| RF-005 | Multi-admin e recovery guardians (múltiplas seeds) | Could | Proposto | OBJ-02 |
| RF-006 | Governança familiar (transferência de admin, saída de membro) | Should | Proposto | OBJ-06 |

### Gerenciamento de Nós

| ID | Descrição | Prioridade | Status | Objetivo |
|----|-----------|------------|--------|----------|
| RF-007 | Registrar novo nó (computador, celular, NAS, VPS, cloud bucket) | Must | Proposto | OBJ-04 |
| RF-008 | Heartbeat monitoring de nós (sinais periódicos de "estou vivo") | Must | Proposto | OBJ-01 |
| RF-009 | Configurar quota/limite de armazenamento por nó | Should | Proposto | OBJ-04 |
| RF-010 | Desconectar nó com drain (migrar todos os chunks antes de remover) | Must | Proposto | OBJ-01 |
| RF-011 | Classificar nós em tiers: hot (sempre online), warm (frequente), cold (ocasional) | Should | Proposto | OBJ-04 |
| RF-012 | Armazenamento elástico (expulsar chunks quando disco local enche) | Should | Proposto | OBJ-05 |
| RF-013 | Virtual nodes para consistent hashing proporcional à capacidade | Should | Proposto | OBJ-01 |
| RF-014 | Descoberta de nós via bootstrap nodes + DNS fixo | Must | Proposto | OBJ-02 |
| RF-015 | Descoberta peer-to-peer via gossip protocol / DHT | Won't | Proposto | — |

### Integração com Provedores Cloud

| ID | Descrição | Prioridade | Status | Objetivo |
|----|-----------|------------|--------|----------|
| RF-016 | Conectar contas cloud via OAuth (Google Drive, Dropbox, OneDrive) | Must | Proposto | OBJ-04 |
| RF-017 | Suporte a múltiplas contas do mesmo provedor | Must | Proposto | OBJ-04 |
| RF-018 | Integração S3-compatible (AWS S3, Cloudflare R2, Backblaze B2) | Must | Proposto | OBJ-04 |
| RF-019 | Monitoramento de espaço livre por conta/bucket cloud | Must | Proposto | OBJ-04 |
| RF-020 | Renovação automática de refresh tokens expirados | Should | Proposto | OBJ-04 |
| RF-021 | Rate limiting por provedor para respeitar limites de API | Must | Proposto | OBJ-04 |
| RF-022 | StorageProvider interface unificada (put/get/exists/delete/list/capacity) | Must | Proposto | OBJ-04 |

### Upload e Pipeline de Processamento

| ID | Descrição | Prioridade | Status | Objetivo |
|----|-----------|------------|--------|----------|
| RF-023 | Upload manual de arquivos via cliente | Must | Proposto | OBJ-05 |
| RF-024 | Detecção automática de novos arquivos (sync engine) | Must | Proposto | OBJ-05 |
| RF-025 | Chunking de arquivos em blocos de tamanho fixo (~4MB) | Must | Proposto | OBJ-01 |
| RF-026 | Criação de manifest para cada arquivo (lista de chunks + hashes + metadata) | Must | Proposto | OBJ-01 |
| RF-027 | Criptografia AES-256-GCM de chunks no cliente antes do upload | Must | Proposto | OBJ-01 |
| RF-028 | Deduplicação via content-addressable storage (hash como identificador) | Must | Proposto | OBJ-03 |
| RF-029 | Compressão automática de chunks com Zstandard quando vantajosa | Should | Proposto | OBJ-03 |
| RF-030 | Distribuição de chunks via consistent hashing entre nós | Must | Proposto | OBJ-01 |

### Otimização de Mídia

| ID | Descrição | Prioridade | Status | Objetivo |
|----|-----------|------------|--------|----------|
| RF-031 | Fotos: redimensionar para máximo 1920px no maior lado, converter para WebP | Must | Proposto | OBJ-03 |
| RF-032 | Vídeos: downscale para 1080p, transcodificar para H.265 ou AV1 | Must | Proposto | OBJ-03 |
| RF-033 | Gerar preview (thumbnail ~50KB para fotos; 480p ~5MB para vídeos) | Must | Proposto | OBJ-05 |
| RF-034 | Preservar metadados EXIF (GPS, data, câmera, lente) em metadata separado | Must | Proposto | OBJ-01 |
| RF-035 | Pipeline completo: upload → análise → resize → transcode → preview → encrypt → chunk → distribute | Must | Proposto | OBJ-03 |
| RF-036 | Fila de processamento com workers paralelos para transcodificação | Should | Proposto | OBJ-03 |
| RF-037 | Controle de qualidade perceptual para vídeo (CRF ~30, bitrate alvo ~4Mbps) | Should | Proposto | OBJ-03 |

### Processamento de Documentos

| ID | Descrição | Prioridade | Status | Objetivo |
|----|-----------|------------|--------|----------|
| RF-062 | Documentos (não mídia) fazem bypass do pipeline de otimização — chunk e distribui diretamente | Must | Proposto | OBJ-01 |
| RF-063 | Formatos aceitos para documentos: PDF, DOCX, XLSX, PPTX, TXT, MD, JSON, SQL, CSV, XML, ZIP, RAR, 7Z e qualquer arquivo genérico | Must | Proposto | OBJ-05 |
| RF-064 | Gerar thumbnail/preview para documentos quando possível: PDF → imagem da primeira página; demais → ícone genérico por tipo | Should | Proposto | OBJ-05 |
| RF-065 | Limite de tamanho por tipo: fotos até 50MB, vídeos até 10GB, documentos até 2GB, archives até 5GB | Must | Proposto | OBJ-03 |
| RF-066 | Extrair metadados básicos de documentos: nome, extensão, MIME type, tamanho, número de páginas (PDF), encoding (texto) | Should | Proposto | OBJ-01 |
| RF-067 | Classificação automática de media_type baseada em MIME type: image/* → foto, video/* → video, demais → documento | Must | Proposto | OBJ-01 |

### Replicação e Redundância

| ID | Descrição | Prioridade | Status | Objetivo |
|----|-----------|------------|--------|----------|
| RF-038 | Replicação mínima de 3 cópias por chunk em nós diferentes | Must | Proposto | OBJ-01 |
| RF-039 | Diversidade obrigatória de nós (1 local + 1 cloud + 1 outro dispositivo) | Should | Proposto | OBJ-01 |
| RF-040 | Auto-reparação (self-healing) quando nó é perdido | Must | Proposto | OBJ-01 |
| RF-041 | Erasure coding opcional (ex: 10 shards dados + 4 redundância) | Could | Proposto | OBJ-01 |
| RF-042 | Monitoramento contínuo de saúde de replicação | Must | Proposto | OBJ-01 |

### Integridade e Manutenção

| ID | Descrição | Prioridade | Status | Objetivo |
|----|-----------|------------|--------|----------|
| RF-043 | Scrubbing periódico (recalcular hashes, detectar corrupção, restaurar de réplica) | Must | Proposto | OBJ-01 |
| RF-044 | Garbage collection de chunks órfãos (sem referência em nenhum manifest) | Must | Proposto | OBJ-01 |
| RF-045 | Rebalanceamento automático quando nós entram, saem ou mudam de capacidade | Must | Proposto | OBJ-01 |
| RF-046 | Scheduler interno para tarefas periódicas (scrubbing, GC, rebalancing) | Must | Proposto | OBJ-01 |

### Segurança e Criptografia

| ID | Descrição | Prioridade | Status | Objetivo |
|----|-----------|------------|--------|----------|
| RF-047 | Gerar seed phrase de 12 palavras (padrão BIP-39) na criação do cluster | Must | Proposto | OBJ-02 |
| RF-048 | Envelope encryption (seed → master key → file keys → chunk keys) | Must | Proposto | OBJ-01 |
| RF-049 | Vault criptografado individual por membro para tokens, credenciais, chaves e senhas | Must | Proposto | OBJ-01 |
| RF-050 | Tokens OAuth nunca em texto puro; usados somente em memória | Must | Proposto | OBJ-01 |
| RF-051 | Autenticação mútua entre nós (mutual TLS ou Ed25519) | Should | Proposto | OBJ-01 |
| RF-052 | Assinatura criptográfica de manifests | Should | Proposto | OBJ-01 |
| RF-053 | TLS 1.3 para toda comunicação entre componentes | Must | Proposto | OBJ-01 |

### Recuperação do Sistema

| ID | Descrição | Prioridade | Status | Objetivo |
|----|-----------|------------|--------|----------|
| RF-054 | Recuperar orquestrador com seed phrase em nova VPS | Must | Proposto | OBJ-02 |
| RF-055 | Metadata mínimo embutido em cada chunk (file_id, chunk_index, hash, timestamp) | Must | Proposto | OBJ-02 |
| RF-056 | Manifests replicados em múltiplos nós (não apenas no orquestrador) | Must | Proposto | OBJ-02 |
| RF-057 | Reconexão automática de nós via DNS fixo + retry com backoff | Must | Proposto | OBJ-02 |
| RF-058 | Testes automáticos de recuperação (disaster drills periódicos) | Could | Proposto | OBJ-02 |

### Versionamento e Retenção

| ID | Descrição | Prioridade | Status | Objetivo |
|----|-----------|------------|--------|----------|
| RF-059 | Versionamento de arquivos com deduplicação chunk-level entre versões | Should | Proposto | OBJ-01 |
| RF-060 | Política de retenção configurável (últimas N versões ou por tempo) | Should | Proposto | OBJ-01 |
| RF-061 | Snapshots imutáveis periódicos do acervo completo | Could | Proposto | OBJ-01 |

### Visualização e Clientes

| ID | Descrição | Prioridade | Status | Objetivo |
|----|-----------|------------|--------|----------|
| RF-062 | Placeholder files com download sob demanda | Must | Proposto | OBJ-05 |
| RF-063 | Timeline de fotos/vídeos com navegação cronológica | Should | Proposto | OBJ-06 |
| RF-064 | Busca por nome, data, tipo, tags e metadados | Should | Proposto | OBJ-06 |
| RF-065 | Streaming de vídeo sob demanda | Could | Proposto | OBJ-06 |
| RF-066 | Exportação completa do acervo (tar + manifests) | Should | Proposto | OBJ-04 |

### Indexação e Inteligência

| ID | Descrição | Prioridade | Status | Objetivo |
|----|-----------|------------|--------|----------|
| RF-067 | EXIF parsing automático (data, GPS, câmera) | Should | Proposto | OBJ-06 |
| RF-068 | Reconhecimento facial para agrupamento de pessoas | Could | Proposto | OBJ-06 |
| RF-069 | OCR em documentos para busca de texto | Could | Proposto | OBJ-06 |
| RF-070 | Organização automática por data/local/evento | Should | Proposto | OBJ-06 |

### Operação e Monitoramento

| ID | Descrição | Prioridade | Status | Objetivo |
|----|-----------|------------|--------|----------|
| RF-071 | Alertas automáticos (nó offline, replicação baixa, token expirado, espaço baixo) | Must | Proposto | OBJ-01 |
| RF-072 | Dashboard de saúde do cluster (capacidade, replicação, nós online) | Should | Proposto | OBJ-01 |
| RF-073 | Logs estruturados de todas as operações | Must | Proposto | OBJ-01 |
| RF-074 | Rate limiting e controle de banda para uploads/downloads | Should | Proposto | OBJ-05 |

### Evolução e Protocolo

| ID | Descrição | Prioridade | Status | Objetivo |
|----|-----------|------------|--------|----------|
| RF-075 | Family Storage Protocol (FSP) — protocolo documentado para comunicação entre nós | Should | Proposto | OBJ-04 |
| RF-076 | Atualização automática de clientes e agentes de nó | Could | Proposto | OBJ-06 |
| RF-077 | Migração de formatos ao longo do tempo (workers de conversão) | Could | Proposto | OBJ-01 |
| RF-078 | Proteção contra ransomware (detectar alterações massivas anômalas) | Could | Proposto | OBJ-01 |
| RF-079 | Quotas de armazenamento por usuário no cluster | Should | Proposto | OBJ-04 |

### Resumo MoSCoW

| Prioridade | Quantidade | Requisitos |
|------------|-----------|------------|
| **Must** | 42 | RF-001 a RF-003, RF-007, RF-008, RF-010, RF-014, RF-016 a RF-019, RF-021 a RF-028, RF-030 a RF-035, RF-038, RF-040, RF-042 a RF-050, RF-053 a RF-057, RF-062, RF-071, RF-073 |
| **Should** | 23 | RF-004, RF-006, RF-009, RF-011 a RF-013, RF-020, RF-029, RF-036, RF-037, RF-039, RF-051, RF-052, RF-059, RF-060, RF-063, RF-064, RF-066, RF-067, RF-070, RF-072, RF-074, RF-075, RF-079 |
| **Could** | 13 | RF-005, RF-041, RF-058, RF-061, RF-065, RF-068, RF-069, RF-076 a RF-078 |
| **Won't** | 1 | RF-015 (P2P/DHT) |

---

## Requisitos Não Funcionais

> Quais são os limites aceitáveis de performance, disponibilidade e segurança?

| Categoria | Requisito | Métrica | Threshold |
|-----------|-----------|---------|-----------|
| Durabilidade | Durabilidade de dados no cluster | Probabilidade de perda de dados | 99.999999999% (11 nines) |
| Disponibilidade | Uptime do orquestrador | SLA mensal | >99.5% |
| Performance | Tempo de resposta API de metadata | Latência p95 | < 500ms |
| Performance | Upload paralelo de chunks | Throughput | Saturar banda disponível |
| Segurança | Criptografia de dados em repouso | Algoritmo | AES-256-GCM em todos os chunks |
| Segurança | Criptografia em trânsito | Protocolo | TLS 1.3 em todas as comunicações |
| Segurança | Proteção de credenciais e senhas | Armazenamento | Vault criptografado por membro; nunca em texto puro |
| Escalabilidade | Nós suportados por cluster | Máximo | Até 50 nós |
| Escalabilidade | Usuários por cluster | Máximo | Até 10 usuários |
| Escalabilidade | Armazenamento total por cluster | Capacidade | Até 100TB |
| Eficiência | Redução de armazenamento para fotos | Razão de compressão | 10-20x vs JPEG original |
| Eficiência | Redução de armazenamento para vídeos | Razão de compressão | 3-5x vs H.264 4K original |
| Recuperabilidade | Reconstrução do orquestrador via seed | Tempo (RTO) | < 2 horas |
| Recuperabilidade | Perda de dados em desastre | RPO | Zero (replicação síncrona 3x) |
| Compatibilidade | Browsers suportados (web client) | Cobertura | Chrome, Firefox, Safari últimas 2 versões |
| Portabilidade | Plataformas desktop | Build targets | macOS, Windows, Linux (via Tauri — fase 2) |
| Portabilidade | Plataformas mobile | Build targets | iOS, Android (via React Native — fase 3) |
| Usabilidade | Fluxo de upload | Passos necessários | Upload funcional em < 3 cliques |
| Usabilidade | Fluxo de recovery | Passos necessários | Completável em < 10 passos |

---

## Matriz de Priorização

> Requisitos agrupados por domínio funcional para facilitar planejamento de fases.

| Requisito(s) | Valor de Negócio (1-5) | Esforço Técnico (1-5) | Risco (1-5) | Prioridade Final |
|--------------|------------------------|----------------------|-------------|-------------------|
| RF-047, RF-048, RF-049 (Seed + Vault + Envelope encryption) | 5 | 4 | 4 | Alta — fundação criptográfica; tudo depende disso |
| RF-025, RF-027, RF-030 (Chunking + Encrypt + Distribute) | 5 | 4 | 3 | Alta — core pipeline; sem isso não há storage |
| RF-038, RF-040, RF-042 (Replicação 3x + Auto-healing + Monitoramento) | 5 | 4 | 4 | Alta — garantia de durabilidade; razão de existir do sistema |
| RF-054, RF-055, RF-056, RF-057 (Recovery via seed) | 5 | 5 | 5 | Alta — valida princípio "orquestrador descartável"; alto risco técnico |
| RF-022, RF-018 (StorageProvider + S3 integration) | 5 | 3 | 2 | Alta — interface unificada desbloqueia todos os provedores |
| RF-031, RF-032, RF-033, RF-035 (Pipeline de mídia) | 4 | 4 | 3 | Alta — diferencial de eficiência; depende de FFmpeg/libvips |
| RF-001, RF-002, RF-003 (Cluster + Membros + Permissões) | 4 | 2 | 1 | Alta — baixo esforço, habilita multi-usuário |
| RF-007, RF-008, RF-010, RF-014 (Nós + Heartbeat + Drain + DNS) | 4 | 3 | 3 | Alta — infraestrutura de nós; pré-requisito para replicação |
| RF-023, RF-024, RF-026, RF-062 (Upload + Sync + Manifest + Placeholder) | 4 | 3 | 2 | Alta — fluxo de uso principal |
| RF-043, RF-044, RF-045, RF-046 (Scrubbing + GC + Rebalance + Scheduler) | 4 | 3 | 3 | Média — manutenção de longo prazo; pode ser simplificado no MVP |
| RF-071, RF-073 (Alertas + Logs) | 3 | 2 | 1 | Média — essencial para operação mas baixo esforço |
| RF-016, RF-017, RF-019, RF-020, RF-021 (OAuth clouds + Rate limiting) | 3 | 4 | 3 | Média — valor alto mas complexidade de OAuth; S3 cobre MVP |
| RF-063, RF-064, RF-067, RF-070 (Timeline + Busca + EXIF + Organização) | 3 | 3 | 1 | Média — UX importante mas não bloqueia validação core |
| RF-059, RF-060, RF-066 (Versionamento + Retenção + Exportação) | 2 | 3 | 2 | Baixa — valor futuro; não necessário para MVP |
| RF-041, RF-061, RF-065, RF-068, RF-069 (Erasure coding + Snapshots + Streaming + AI) | 2 | 5 | 3 | Baixa — alto esforço para valor incremental; fase 3 |
| RF-015 (P2P/DHT) | 1 | 5 | 5 | Won't — complexidade desproporcional; orquestrador centralizado é suficiente |
