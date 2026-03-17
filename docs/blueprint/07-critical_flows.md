# Fluxos Críticos

> Documente os 3 a 5 fluxos mais importantes do sistema. Estes são os caminhos que, se falharem, impactam diretamente o valor entregue.

---

## Fluxo: Upload e Distribuição de Arquivo

**Descrição:** Membro envia foto ou vídeo pelo web client; o sistema processa, otimiza, criptografa, divide em chunks e distribui entre nós com replicação 3x. É o fluxo central — sem ele, o sistema não armazena nada.

**Criticidade:** Máxima — exercita pipeline completo (upload → optimize → chunk → encrypt → distribute → replicate)

**Atores envolvidos:** Membro, Web Client, Orquestrador (Axum), Media Workers, Core SDK, StorageProvider, Redis, PostgreSQL 17

### Passos

1. **Membro** seleciona arquivo(s) no Web Client e clica em "Upload"
2. **Web Client** envia arquivo para o Orquestrador via POST /files/upload (HTTPS/TLS 1.3, multipart)
3. **Orquestrador** valida autenticação (JWT), permissões do membro e tamanho do arquivo
4. **Orquestrador** registra arquivo em `files` (status: "processing") via SQLx e enfileira job no Redis
5. **Media Worker** consome job da fila Redis
6. **Media Worker** analisa arquivo (resolução, formato, tamanho, tipo MIME)
7. **Media Worker** otimiza: foto → libvips resize max 1920px + WebP; vídeo → FFmpeg 1080p H.265/AV1
8. **Media Worker** gera preview: thumbnail ~50KB (foto) ou 480p ~5MB (vídeo)
9. **Media Worker** extrai metadados EXIF (data, GPS, câmera) e prepara JSON para metadata
10. **Core SDK** divide conteúdo otimizado em chunks de ~4MB e calcula SHA-256 de cada
11. **Core SDK** verifica deduplicação: se hash já existe em `chunks`, cria referência sem rearmazenar
12. **Core SDK** gera file key via envelope encryption (master key → file key) e criptografa cada chunk com AES-256-GCM
13. **Core SDK** consulta ConsistentHashRing para determinar 3 nós destino por chunk
14. **Orquestrador** envia chunks criptografados para os 3 nós via StorageProvider (aws-sdk-s3 para cloud, REST para agentes locais)
15. **Orquestrador** cria registros em `chunks` e `chunk_replicas` dentro de uma transação SQLx
16. **Orquestrador** cria manifest (chunks_json + file_key_encrypted + assinatura) e salva em `manifests`
17. **Orquestrador** replica manifest em 2+ nós adicionais via StorageProvider
18. **Orquestrador** atualiza file status para "ready" e publica evento via Redis pub/sub
19. **Web Client** recebe confirmação e exibe thumbnail do arquivo na galeria

### Diagrama de Sequência

> 📐 Diagrama: [upload-distribution.mmd](../diagrams/sequences/upload-distribution.mmd)

### Tratamento de Erros

| Passo | Falha possível | Comportamento esperado |
|-------|---------------|----------------------|
| 2 | Upload interrompido por falha de rede | Web Client faz retry automático; chunks parciais descartados pelo Orquestrador após timeout |
| 3 | Token JWT expirado ou permissão insuficiente | Retorna 401/403; Web Client redireciona para re-autenticação |
| 7 | FFmpeg falha na transcodificação (codec não suportado, arquivo corrompido) | Job marcado como erro; file status → "error"; alerta ao membro; job movido para DLQ no Redis |
| 11 | Hash idêntico encontrado (arquivo duplicado) | Chunks existentes reutilizados; novo manifest aponta para mesmos chunks; economia de espaço |
| 13 | Menos de 3 nós ativos disponíveis | Upload bloqueado; retorna 503 "nós insuficientes para replicação mínima"; alerta ao admin |
| 14 | Nó destino falha durante recebimento | Selecionar próximo nó no ConsistentHashRing; retry no nó original após backoff exponencial |
| 14 | S3/R2 retorna rate limit (429) | Respeitar retry-after header; enfileirar para retry com backoff exponencial via Tower middleware |
| 15 | Transação PostgreSQL falha | Rollback automático; chunks já enviados ficam órfãos (GC remove depois); retry do job |
| 17 | Falha ao replicar manifest nos nós | Manifest mantido no Orquestrador; retry de replicação em background; alerta gerado |

### Requisitos de Performance

| Métrica | Valor esperado |
|---------|---------------|
| Latência upload API (p95) | < 500ms (aceitar arquivo + enfileirar) |
| Pipeline completo (foto 5MB) | < 10s (optimize + chunk + encrypt + distribute) |
| Pipeline completo (vídeo 2GB) | < 5min (transcode é gargalo) |
| Throughput mínimo | 10 uploads concorrentes |

---

## Fluxo: Recovery do Orquestrador via Seed Phrase

**Descrição:** Admin perdeu o servidor do orquestrador e reconstrói o sistema completo em nova VPS usando apenas a seed phrase de 12 palavras. Valida o princípio fundamental: "o orquestrador é descartável".

**Criticidade:** Máxima — sem recovery funcional, o sistema é tão frágil quanto um HD externo

**Atores envolvidos:** Admin, Nova VPS, Orquestrador (novo), Core SDK (CryptoEngine), Vault, StorageProvider (S3/R2), Agentes de Nó, DNS, PostgreSQL 17

### Passos

1. **Admin** provisiona nova VPS e instala Orquestrador via Docker Compose (docker compose up)
2. **Admin** acessa interface de recovery e insere seed phrase de 12 palavras
3. **Core SDK (CryptoEngine)** valida seed phrase contra wordlist BIP-39
4. **Core SDK** deriva master key da seed via PBKDF2/scrypt
5. **Orquestrador** busca vaults criptografados dos membros nos nós conhecidos (lista bootstrap hardcoded ou último DNS)
6. **Core SDK** descriptografa vaults dos membros com master key → libera credenciais S3/R2, senhas dos membros, config do cluster, lista de nós
7. **Orquestrador** conecta aos buckets cloud (S3/R2) usando credenciais dos vaults dos membros via aws-sdk-s3
8. **Orquestrador** escaneia nós cloud em busca de manifests replicados
9. **Orquestrador** reconstrói banco de metadados PostgreSQL 17 a partir dos manifests (bulk insert via SQLx)
10. **Admin** atualiza registro DNS para apontar para IP da nova VPS (TTL: 300s)
11. **Agentes de Nó** detectam novo Orquestrador via DNS lookup e reconectam com retry + backoff
12. **Orquestrador** recebe heartbeats dos nós e atualiza status em `nodes`
13. **Orquestrador** valida integridade: cruza manifests com chunks existentes nos nós
14. **Orquestrador** identifica chunks com replicação < 3x e agenda auto-healing no Scheduler
15. **Orquestrador** gera relatório de recovery: arquivos recuperados, chunks faltantes, nós reconectados

### Diagrama de Sequência

> 📐 Diagrama: [seed-recovery.mmd](../diagrams/sequences/seed-recovery.mmd)

### Tratamento de Erros

| Passo | Falha possível | Comportamento esperado |
|-------|---------------|----------------------|
| 3 | Seed phrase inválida (palavra fora do wordlist) | Mensagem clara "Palavra X não faz parte do dicionário BIP-39"; pedir correção |
| 4 | Seed phrase incorreta (válida mas errada) | Master key errada → vaults não descriptografam (AEAD auth tag falha); mensagem "Seed incorreta" |
| 5 | Vaults não encontrados em nenhum nó | Recovery parcial: admin precisa re-inserir credenciais S3/R2 manualmente; alerta |
| 8 | Manifests não encontrados em nenhum nó | Recovery impossível sem manifests; alerta crítico; chunks existem mas não podem ser reassemblados |
| 9 | PostgreSQL falha durante bulk insert | Retry por lotes; transação parcial; progresso salvo para continuar de onde parou |
| 11 | Nó local não resolve DNS ou está offline | Nó reconectará quando voltar online; chunks temporariamente indisponíveis; não bloqueia recovery |
| 13 | Chunks faltando (nós destruídos durante downtime) | Auto-healing re-replica a partir de nós restantes; se sem réplica → arquivo marcado como corrompido |

### Requisitos de Performance

| Métrica | Valor esperado |
|---------|---------------|
| Recovery completo (seed → sistema operacional) | < 2 horas para 100k arquivos |
| Rebuild do índice PostgreSQL | < 30 minutos para 100k manifests |
| Reconexão de nós via DNS | < 5 minutos após atualização DNS (TTL 300s) |
| Validação de integridade | < 1 hora para scan completo |

---

## Fluxo: Auto-Healing (Nó Perdido)

**Descrição:** Nó para de enviar heartbeats, é marcado como perdido, e o Scheduler re-replica automaticamente todos os chunks desse nó para manter fator de replicação 3x. Valida a premissa de resiliência automática.

**Criticidade:** Alta — sem auto-healing, perda de um nó degrada progressivamente a durabilidade

**Atores envolvidos:** Scheduler (tokio::time), Orquestrador, Core SDK (ConsistentHashRing), StorageProvider, PostgreSQL 17, Nós restantes

### Passos

1. **Scheduler** executa check periódico: query `nodes WHERE last_heartbeat < NOW() - INTERVAL '30 min'`
2. **Orquestrador** marca nó como "suspeito" em `nodes` e gera alerta (severidade: warning)
3. **Scheduler** aguarda mais 30 minutos (total 1h sem heartbeat)
4. **Orquestrador** marca nó como "perdido" e gera alerta (severidade: critical)
5. **Orquestrador** consulta `chunk_replicas WHERE node_id = {nó_perdido}` para listar todos os chunks afetados
6. **Orquestrador** identifica chunks com COUNT(replicas) < 3 via query agregada
7. **Core SDK (ConsistentHashRing)** seleciona novos nós destino para cada chunk sub-replicado (excluindo nó perdido)
8. **Orquestrador** para cada chunk: lê de uma réplica existente via StorageProvider
9. **Orquestrador** envia chunk para novo nó destino via StorageProvider
10. **Orquestrador** cria novo registro em `chunk_replicas` e remove o registro do nó perdido (transação SQLx)
11. **Orquestrador** repete passos 8-10 até todos os chunks terem 3+ réplicas
12. **Orquestrador** atualiza alerta como resolvido; gera relatório de auto-healing

### Diagrama de Sequência

> 📐 Diagrama: [auto-healing.mmd](../diagrams/sequences/auto-healing.mmd)

### Tratamento de Erros

| Passo | Falha possível | Comportamento esperado |
|-------|---------------|----------------------|
| 3 | Nó volta online durante período de espera | Status volta para "online"; heartbeat retomado; auto-healing cancelado; alerta resolvido |
| 6 | Chunk sem nenhuma réplica restante | Chunk marcado como irrecuperável; arquivo afetado status → "corrupted"; alerta crítico |
| 7 | Nós restantes sem espaço suficiente | Alerta "espaço insuficiente para auto-healing"; admin notificado para adicionar nós |
| 8 | Réplica de leitura corrompida (hash ≠ chunk_id) | Tentar próxima réplica; se todas corrompidas → chunk irrecuperável |
| 9 | Falha de rede durante cópia | Retry com backoff exponencial; chunk permanece na fila de re-replicação |
| 9 | Rate limit do provedor cloud | Respeitar retry-after; backoff exponencial; continuar com próximos chunks |

### Requisitos de Performance

| Métrica | Valor esperado |
|---------|---------------|
| Detecção de nó suspeito | < 30 minutos após último heartbeat |
| Detecção de nó perdido | < 1 hora após último heartbeat |
| Re-replicação completa | < 2 horas para nó com 10GB de chunks |
| Throughput de cópia | Limitado pela banda do provedor mais lento |

---

## Fluxo: Criação de Cluster e Onboarding

**Descrição:** Admin cria o cluster familiar pela primeira vez: gera identidade criptográfica, seed phrase, vault do admin e convida membros (cada um receberá seu próprio vault). É o ponto de entrada — sem cluster, nada funciona.

**Criticidade:** Alta — executado uma única vez mas é pré-requisito para todo o sistema

**Atores envolvidos:** Admin, Web Client, Orquestrador (Axum), Core SDK (CryptoEngine, BIP-39), Vault, PostgreSQL 17

### Passos

1. **Admin** acessa Web Client e inicia fluxo de criação de cluster
2. **Web Client** envia POST /clusters com nome do cluster
3. **Orquestrador** gera seed phrase de 12 palavras via BIP-39 (Core SDK)
4. **Core SDK** deriva master key da seed phrase
5. **Core SDK** gera par de chaves (public_key + private_key) para o cluster
6. **Core SDK** calcula cluster_id = SHA-256(public_key)
7. **Core SDK** criptografa private_key com master key
8. **Orquestrador** cria vault individual do admin, criptografado com senha do admin
9. **Orquestrador** persiste cluster em PostgreSQL (cluster_id, nome, public_key, encrypted_private_key)
10. **Orquestrador** cria membro admin (role: "admin") para o criador
11. **Web Client** exibe seed phrase de 12 palavras com instruções para anotar em papel
12. **Admin** confirma que anotou a seed phrase (checkbox obrigatório)
13. **Orquestrador** marca cluster como ativo
14. **Admin** convida membros via POST /clusters/:id/invite (gera token assinado com expiração)
15. **Membro** recebe link de convite, aceita, é adicionado ao cluster com role configurada e recebe seu vault individual criptografado com sua senha

### Diagrama de Sequência

> 📐 Diagrama: [cluster-onboarding.mmd](../diagrams/sequences/cluster-onboarding.mmd)

### Tratamento de Erros

| Passo | Falha possível | Comportamento esperado |
|-------|---------------|----------------------|
| 3 | Falha na geração de entropia (CSPRNG) | Retorna 500; log de erro; não criar cluster com entropia fraca |
| 9 | PostgreSQL indisponível | Retorna 503; seed phrase NÃO é exibida (cluster não foi criado); retry |
| 12 | Admin não confirma seed | Cluster criado mas seed nunca mais será exibida; alerta persistente na UI |
| 14 | Token de convite expirado | Membro recebe erro "Convite expirado"; admin gera novo convite |
| 15 | E-mail já existe no cluster | Retorna 409 "Membro já existe"; não duplicar |

### Requisitos de Performance

| Métrica | Valor esperado |
|---------|---------------|
| Criação do cluster (p95) | < 2s (geração de chaves + persist) |
| Geração de convite | < 200ms |
| Aceite de convite | < 500ms |

---

## Fluxo: Scrubbing e Verificação de Integridade

**Descrição:** Scheduler executa verificação periódica de integridade de todos os chunks, recalculando hashes e reparando corrompidos automaticamente. Protege contra bit rot — corrupção silenciosa de dados ao longo do tempo.

**Criticidade:** Alta — sem scrubbing, corrupção passa despercebida e pode se propagar

**Atores envolvidos:** Scheduler (tokio::time), Orquestrador, StorageProvider, Core SDK, PostgreSQL 17

### Passos

1. **Scheduler** dispara job de scrubbing periódico (configurável: diário ou semanal)
2. **Orquestrador** consulta `chunk_replicas` ordenado por `verified_at ASC NULLS FIRST` (prioriza não verificados)
3. **Orquestrador** seleciona batch de N réplicas para verificação (ex: 1000 por ciclo)
4. Para cada réplica no batch:
5. **StorageProvider** lê chunk do nó que armazena a réplica
6. **Core SDK** recalcula SHA-256 do chunk lido
7. **Core SDK** compara hash calculado com chunk_id (hash original)
8. Se hash confere: **Orquestrador** atualiza `verified_at = NOW()` em `chunk_replicas`
9. Se hash NÃO confere: **Orquestrador** marca réplica como corrompida
10. **Orquestrador** busca outra réplica saudável do mesmo chunk em outro nó
11. **StorageProvider** lê chunk saudável e sobrescreve a réplica corrompida
12. **Orquestrador** verifica hash da nova cópia e atualiza `verified_at`
13. **Orquestrador** gera alerta (severity: warning) com detalhes da corrupção detectada e reparada
14. Ao final do batch: **Orquestrador** gera relatório: chunks verificados, corrompidos encontrados, reparados

### Diagrama de Sequência

> 📐 Diagrama: [scrubbing.mmd](../diagrams/sequences/scrubbing.mmd)

### Tratamento de Erros

| Passo | Falha possível | Comportamento esperado |
|-------|---------------|----------------------|
| 5 | Nó offline durante leitura | Skip réplica; será verificada no próximo ciclo; não bloqueia batch |
| 10 | Todas as réplicas de um chunk corrompidas | Chunk marcado como irrecuperável; arquivo afetado status → "corrupted"; alerta crítico |
| 11 | Falha ao escrever réplica reparada | Retry com backoff; se persistir, alerta ao admin |
| 5-12 | Scrubbing sobrecarrega nós (IO-bound) | Rate limiting interno: max N verificações/minuto por nó; priorizar nós idle |

### Requisitos de Performance

| Métrica | Valor esperado |
|---------|---------------|
| Throughput de verificação | > 100 chunks/minuto |
| Ciclo completo (10k chunks) | < 2 horas |
| Overhead nos nós | < 10% de IO adicional durante scrubbing |
| Latência de reparo | < 30s por chunk corrompido |
