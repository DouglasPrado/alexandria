# Dominio

Define as entidades do sistema, value objects, regras de negocio (invariantes), eventos de dominio e maquinas de estado. Esta e a camada mais interna — nao depende de nenhuma outra.

<!-- do blueprint: 04-domain-model.md -->
<!-- do blueprint: 09-state-models.md -->

> **Implementa:** [docs/blueprint/04-domain-model.md](../blueprint/04-domain-model.md) (entidades e regras) e [docs/blueprint/09-state-models.md](../blueprint/09-state-models.md) (maquinas de estado).

---

## Glossario Ubiquo

> **Fonte unica:** [docs/shared/glossary.md](../shared/glossary.md). Nao duplique termos aqui — consulte e atualize o glossario compartilhado.

---

## Entidades

> Para cada entidade, documente atributos, invariantes, metodos e eventos. Cada entidade encapsula suas proprias regras.

### Cluster

**Descricao:** Unidade raiz do sistema — representa uma familia. Possui identidade criptografica derivada de uma seed phrase de 12 palavras (BIP-39). Agrupa membros, nos, arquivos e alertas.

**Atributos:**

| Campo | Tipo | Obrigatorio | Validacao | Descricao |
| --- | --- | --- | --- | --- |
| cluster_id | string | sim | SHA-256(public_key), imutavel, 64 chars hex | Identificador criptografico unico |
| name | string | sim | min 2, max 100 | Nome do cluster familiar (ex: "Familia Prado") |
| public_key | bytes | sim | Ed25519 public key, imutavel | Chave publica para verificacao de assinaturas |
| encrypted_private_key | bytes | sim | nao vazio | Chave privada criptografada com master key |
| status | enum | sim | `active`, `suspended` | Estado atual do cluster |
| created_at | datetime | sim | auto, imutavel | Data de criacao |
| updated_at | datetime | sim | auto | Ultima atualizacao |

**Invariantes (regras que NUNCA podem ser violadas):**

- `cluster_id` e derivado de `public_key` e imutavel apos criacao (RN-C1)
- Seed phrase de 12 palavras BIP-39 gera master key que deriva todas as chaves (RN-C2)
- Maximo de 10 membros por cluster (RN-C3)
- Maximo de 50 nos por cluster (RN-C4)
- Status so transiciona conforme maquina de estados (active <-> suspended)

**Metodos:**

| Metodo | Parametros | Retorno | Descricao |
| --- | --- | --- | --- |
| create() | { name, seedPhrase } | Cluster | Gera par de chaves, deriva cluster_id = SHA-256(public_key), status = active, emite ClusterCreated |
| suspend() | — | void | status → suspended, emite evento interno |
| activate() | — | void | status → active, emite evento interno |
| recover() | { seedPhrase } | Cluster | Reconstroi sistema via seed phrase, re-deriva master key e chaves, emite ClusterRecovered |
| canAddMember() | — | boolean | Verifica se count(members) < 10 |
| canAddNode() | — | boolean | Verifica se count(nodes) < 50 |

**Eventos Emitidos:**

| Evento | Quando | Payload |
| --- | --- | --- |
| ClusterCreated | Apos criacao com identidade criptografica | { clusterId, name, publicKey, timestamp } |
| ClusterRecovered | Sistema reconstruido via seed phrase | { clusterId, nodesRecovered, filesRecovered, timestamp } |

---

### Member

**Descricao:** Pessoa que pertence a um cluster familiar. Cada membro tem um role que define suas permissoes e um vault individual para armazenar credenciais criptografadas.

**Atributos:**

| Campo | Tipo | Obrigatorio | Validacao | Descricao |
| --- | --- | --- | --- | --- |
| member_id | UUID | sim | auto-generated | Identificador unico |
| name | string | sim | min 2, max 100 | Nome do membro |
| email | string | sim | formato RFC 5322, max 255, unico por cluster | Email para identificacao |
| password_hash | string | sim | Argon2id hash | Hash da senha para desbloquear vault |
| role | enum | sim | `admin`, `member`, `reader` | Perfil de acesso |
| invited_by | UUID | nao | FK → members(id), nullable | Membro que convidou; null para o criador |
| joined_at | datetime | sim | auto | Data de ingresso no cluster |
| created_at | datetime | sim | auto, imutavel | Data de criacao |
| updated_at | datetime | sim | auto | Ultima atualizacao |

**Invariantes (regras que NUNCA podem ser violadas):**

- Email unico dentro do cluster — tentativa com email existente retorna 409 (RN-M1)
- Pelo menos 1 admin por cluster; nao e possivel remover ou rebaixar o ultimo admin (RN-M2)
- Permissoes por role: `reader` visualiza; `member` faz upload/download; `admin` gerencia cluster, nos e membros (RN-M3)
- Membro ingressa exclusivamente via convite com token assinado, exceto o criador (RN-M4)

**Metodos:**

| Metodo | Parametros | Retorno | Descricao |
| --- | --- | --- | --- |
| create() | { name, email, password, role } | Member | Hash da senha (Argon2id), cria vault associado, emite MemberJoined |
| createFromInvite() | { invite, name, password } | Member | Valida token, aceita convite, cria membro + vault, emite MemberJoined |
| changeRole() | { newRole } | void | Valida que nao e ultimo admin (RN-M2), atualiza role |
| remove() | — | void | Valida que nao e ultimo admin (RN-M2), remove membro, emite MemberRemoved |
| canPerform() | { action } | boolean | Verifica permissao baseada no role (RN-M3) |

**Eventos Emitidos:**

| Evento | Quando | Payload |
| --- | --- | --- |
| MemberJoined | Membro aceitou convite e ingressou | { memberId, email, role, clusterId, invitedBy, timestamp } |
| MemberRemoved | Membro removido pelo admin | { memberId, email, clusterId, removedBy, timestamp } |

---

### Node

**Descricao:** Dispositivo fisico (PC, NAS, VPS) ou conta cloud (S3, R2, B2) que armazena chunks criptografados. Cada no reporta capacidade e envia heartbeats periodicos ao orquestrador.

**Atributos:**

| Campo | Tipo | Obrigatorio | Validacao | Descricao |
| --- | --- | --- | --- | --- |
| node_id | UUID | sim | auto-generated | Identificador unico |
| type | enum | sim | `local`, `s3`, `r2`, `b2`, `vps` | Tipo de armazenamento |
| name | string | sim | min 2, max 100 | Nome descritivo (ex: "NAS Sala", "R2 Cloudflare") |
| total_capacity | long | sim | >= 0 | Espaco total em bytes |
| used_capacity | long | sim | >= 0, <= total_capacity | Espaco usado em bytes |
| status | enum | sim | `online`, `suspect`, `lost`, `draining`, `disconnected` | Estado atual do no |
| endpoint | string | sim | URL ou path valido | URL ou caminho de conexao |
| config_encrypted | bytes | sim | nao vazio | Credenciais criptografadas (armazenadas no vault do owner) |
| last_heartbeat | datetime | nao | nullable | Timestamp do ultimo heartbeat recebido |
| tier | enum | nao | `hot`, `warm`, `cold`, default `warm` | Categoria de disponibilidade |
| created_at | datetime | sim | auto, imutavel | Data de criacao |
| updated_at | datetime | sim | auto | Ultima atualizacao |

**Invariantes (regras que NUNCA podem ser violadas):**

- No sem heartbeat por 30min → status `suspect`; alerta warning (RN-N1)
- No sem heartbeat por 1h → status `lost`; alerta critical; dispara auto-healing (RN-N2)
- Remocao de no exige drain obrigatorio — todos os chunks migrados antes (RN-N3)
- Credenciais de nos cloud criptografadas e armazenadas no vault do membro (RN-N4)
- Teste de conectividade (PUT/GET de chunk de teste) obrigatorio no registro (RN-N5)
- Cluster precisa de minimo 3 nos ativos para aceitar uploads (RN-N6)

**Metodos:**

| Metodo | Parametros | Retorno | Descricao |
| --- | --- | --- | --- |
| register() | { type, name, endpoint, config, ownerId } | Node | Valida conectividade (PUT/GET teste), status = online, emite NodeRegistered |
| heartbeat() | { usedCapacity } | void | Atualiza last_heartbeat e used_capacity |
| markSuspect() | — | void | status → suspect, gera alerta warning, emite NodeSuspect |
| markLost() | — | void | status → lost, gera alerta critical, emite NodeLost |
| startDrain() | — | void | status → draining, inicia migracao de chunks |
| completeDrain() | — | void | status → disconnected, remove do ConsistentHashRing, emite NodeDrained |
| recover() | — | void | status → online (de suspect), resolve alerta |
| availableCapacity() | — | long | Retorna total_capacity - used_capacity |

**Eventos Emitidos:**

| Evento | Quando | Payload |
| --- | --- | --- |
| NodeRegistered | No registrado e adicionado ao ConsistentHashRing | { nodeId, type, name, clusterId, timestamp } |
| NodeSuspect | Heartbeat ausente por 30min | { nodeId, lastHeartbeat, timestamp } |
| NodeLost | Heartbeat ausente por 1h; auto-healing iniciado | { nodeId, chunksAffected, timestamp } |
| NodeDrained | Todos os chunks migrados; no removido do ring | { nodeId, chunksMigrated, timestamp } |

---

### File

**Descricao:** Arquivo de midia ou documento enviado por um membro ao cluster. Passa pelo pipeline de processamento (otimizacao, preview, chunking, criptografia, distribuicao) antes de ficar disponivel.

**Atributos:**

| Campo | Tipo | Obrigatorio | Validacao | Descricao |
| --- | --- | --- | --- | --- |
| file_id | UUID | sim | auto-generated | Identificador unico |
| original_name | string | sim | max 500 | Nome original do arquivo enviado |
| media_type | enum | sim | `photo`, `video`, `document` | Tipo de midia, classificado via MIME type |
| mime_type | string | sim | MIME valido, max 100 | MIME type original (image/jpeg, video/mp4, etc.) |
| original_size | long | sim | > 0, respeitando limites por tipo | Tamanho antes da otimizacao (bytes) |
| optimized_size | long | nao | nullable enquanto processing | Tamanho apos otimizacao; igual ao original para documentos |
| content_hash | string | nao | SHA-256, 64 chars hex, nullable enquanto processing | SHA-256 do conteudo otimizado |
| metadata | jsonb | nao | nullable | EXIF (GPS, data, camera), duracao, codec, paginas |
| status | enum | sim | `processing`, `ready`, `error`, `corrupted` | Estado atual do arquivo |
| error_message | string | nao | nullable | Mensagem de erro do pipeline (quando status = error) |
| created_at | datetime | sim | auto, imutavel | Data de criacao |
| updated_at | datetime | sim | auto | Ultima atualizacao |

**Invariantes (regras que NUNCA podem ser violadas):**

- Classificacao automatica via MIME type: `image/*` → photo, `video/*` → video, demais → document (RN-F1)
- Otimizacao obrigatoria para midia: fotos → WebP max 1920px; videos → 1080p H.265/AV1 (RN-F2)
- Documentos fazem bypass do pipeline de otimizacao — optimized_size = original_size (RN-F3)
- Limites de tamanho: fotos 50MB, videos 10GB, documentos 2GB, archives 5GB (RN-F4)
- Deduplicacao: se content_hash ja existe, chunks existentes sao reutilizados via manifest (RN-F5)
- Placeholder substitui arquivo local somente quando replicacao 3x confirmada para todos os chunks (RN-F6)

**Metodos:**

| Metodo | Parametros | Retorno | Descricao |
| --- | --- | --- | --- |
| upload() | { name, mimeType, size, uploadedBy } | File | Classifica media_type (RN-F1), valida limites (RN-F4), status = processing, emite FileUploaded |
| process() | { optimizedSize, contentHash, metadata } | void | Atualiza campos pos-otimizacao, status = ready, emite FileProcessed |
| markError() | { errorMessage } | void | status → error, registra mensagem de erro |
| markCorrupted() | — | void | status → corrupted, emite FileCorrupted |
| isDuplicate() | { contentHash } | boolean | Verifica se content_hash ja existe no cluster (RN-F5) |
| validateSize() | { size, mediaType } | boolean | Verifica limite de tamanho por tipo (RN-F4) |

**Eventos Emitidos:**

| Evento | Quando | Payload |
| --- | --- | --- |
| FileUploaded | Arquivo recebido e enfileirado para processamento | { fileId, originalName, mediaType, size, uploadedBy, timestamp } |
| FileProcessed | Pipeline completo; status → ready | { fileId, optimizedSize, contentHash, chunkCount, timestamp } |
| FileCorrupted | Scrubbing detectou chunks irrecuperaveis | { fileId, corruptedChunks, timestamp } |

---

### Preview

**Descricao:** Representacao leve de um arquivo para exibicao no cliente (galeria, timeline). Nunca oferece download do conteudo original — serve exclusivamente para navegacao visual.

**Atributos:**

| Campo | Tipo | Obrigatorio | Validacao | Descricao |
| --- | --- | --- | --- | --- |
| preview_id | UUID | sim | auto-generated | Identificador unico |
| file_id | UUID | sim | FK → files, unico (1:1) | Arquivo ao qual o preview pertence |
| type | enum | sim | `thumbnail`, `video_preview`, `pdf_page`, `generic_icon` | Tipo de preview |
| size | long | sim | > 0 | Tamanho em bytes |
| format | enum | sim | `webp`, `mp4`, `png` | Formato do preview |
| content_hash | string | sim | SHA-256, 64 chars hex | SHA-256 do conteudo do preview |
| storage_path | string | sim | nao vazio | Caminho ou chunk_id onde o preview esta armazenado |
| created_at | datetime | sim | auto, imutavel | Data de geracao |

**Invariantes (regras que NUNCA podem ser violadas):**

- Preview e somente para exibicao — nao oferece download do conteudo original (RN-P1)
- Tamanho alvo: foto → ~50KB WebP; video → 480p ~5MB MP4; PDF → ~100KB PNG; generico → icone (RN-P2)
- Preview gerado durante o pipeline, antes da distribuicao dos chunks (RN-P3)
- Preview armazenado como chunk(s) criptografado(s) e distribuido nos nos (RN-P4)

**Metodos:**

| Metodo | Parametros | Retorno | Descricao |
| --- | --- | --- | --- |
| generate() | { fileId, type, format, content } | Preview | Gera preview, calcula content_hash, emite PreviewGenerated |
| getForFile() | { fileId } | Preview | Busca preview associado ao arquivo |

**Eventos Emitidos:**

| Evento | Quando | Payload |
| --- | --- | --- |
| PreviewGenerated | Preview criado durante processamento do arquivo | { previewId, fileId, type, format, size, timestamp } |

---

### Manifest

**Descricao:** Mapa de reconstituicao de um arquivo — contem a lista ordenada de chunk_ids, a file key criptografada e uma assinatura criptografica. Fonte de verdade para reassemblar um arquivo e para o recovery via seed.

**Atributos:**

| Campo | Tipo | Obrigatorio | Validacao | Descricao |
| --- | --- | --- | --- | --- |
| manifest_id | UUID | sim | auto-generated | Identificador unico |
| file_id | UUID | sim | FK → files, unico (1:1) | Arquivo que este manifest descreve |
| chunks_json | jsonb | sim | array ordenado de { chunk_id, chunk_index, size } | Lista ordenada de chunks para reassembly |
| file_key_encrypted | bytes | sim | nao vazio | Chave do arquivo criptografada com master key |
| signature | bytes | sim | Ed25519 signature | Assinatura criptografica do manifest |
| replicated_to | jsonb | sim | array de node_ids, default [] | Lista de node_ids onde o manifest foi replicado |
| version | integer | sim | >= 1, default 1 | Versao do manifest |
| created_at | datetime | sim | auto, imutavel | Data de criacao |
| updated_at | datetime | sim | auto | Ultima atualizacao |

**Invariantes (regras que NUNCA podem ser violadas):**

- Todo arquivo com status `ready` tem exatamente 1 manifest (RN-MA1)
- Manifest contem file key criptografada com master key — sem master key, impossivel descriptografar (RN-MA2)
- Manifest assinado com chave privada do cluster para integridade e autenticidade (RN-MA3)
- Manifest replicado em 2+ nos alem do orquestrador (PostgreSQL) (RN-MA4)
- Manifests sao fonte de verdade para reconstrucao do banco no recovery via seed (RN-MA5)

**Metodos:**

| Metodo | Parametros | Retorno | Descricao |
| --- | --- | --- | --- |
| create() | { fileId, chunks, fileKeyEncrypted, clusterPrivateKey } | Manifest | Monta chunks_json, assina com chave privada, emite ManifestCreated |
| verify() | { clusterPublicKey } | boolean | Verifica assinatura criptografica do manifest |
| replicate() | { nodeId } | void | Adiciona nodeId ao replicated_to, emite ManifestReplicated |
| getChunkIds() | — | string[] | Retorna lista ordenada de chunk_ids para reassembly |

**Eventos Emitidos:**

| Evento | Quando | Payload |
| --- | --- | --- |
| ManifestCreated | Manifest gerado apos distribuicao de todos os chunks | { manifestId, fileId, chunkCount, replicatedTo, timestamp } |
| ManifestReplicated | Manifest copiado para no adicional | { manifestId, fileId, nodeId, totalReplicas, timestamp } |

---

### Chunk

**Descricao:** Bloco de dados criptografados de tamanho fixo (~4MB). Enderecado pelo SHA-256 do conteudo (content-addressable). Pode ser referenciado por multiplos arquivos quando ha deduplicacao.

**Atributos:**

| Campo | Tipo | Obrigatorio | Validacao | Descricao |
| --- | --- | --- | --- | --- |
| chunk_id | string | sim | SHA-256, 64 chars hex, imutavel | SHA-256 do conteudo criptografado (endereco CAS) |
| chunk_index | integer | sim | >= 0 | Posicao dentro do arquivo (usado no manifest) |
| size | integer | sim | > 0, ~4MB (ultimo pode ser menor) | Tamanho em bytes |
| reference_count | integer | sim | >= 0, default 1 | Contador de manifests que referenciam este chunk |
| created_at | datetime | sim | auto, imutavel | Data de criacao |

**Invariantes (regras que NUNCA podem ser violadas):**

- Tamanho fixo de ~4MB por chunk; ultimo chunk pode ser menor (RN-CH1)
- chunk_id = SHA-256(conteudo criptografado) — endereco content-addressable, imutavel (RN-CH2)
- Todo chunk criptografado com AES-256-GCM antes do armazenamento (RN-CH3)
- Chunk pode ser referenciado por multiplos manifests/arquivos (deduplicacao cross-file) (RN-CH4)
- Chunk sem referencia em nenhum manifest → orfao → elegivel para garbage collection (RN-CH5)
- Chunk contem metadata minimo embutido (file_id, chunk_index, hash, timestamp) para recovery sem orquestrador (RN-CH6)

**Metodos:**

| Metodo | Parametros | Retorno | Descricao |
| --- | --- | --- | --- |
| create() | { content, fileKey } | Chunk | Criptografa com AES-256-GCM, calcula SHA-256, emite ChunkCreated |
| incrementReference() | — | void | Incrementa reference_count (deduplicacao) |
| decrementReference() | — | void | Decrementa reference_count; se 0, emite ChunkOrphaned |
| isOrphan() | — | boolean | Retorna true se reference_count == 0 |

**Eventos Emitidos:**

| Evento | Quando | Payload |
| --- | --- | --- |
| ChunkCreated | Chunk gerado pelo pipeline, pronto para distribuicao | { chunkId, size, fileId, chunkIndex, timestamp } |
| ChunkOrphaned | Chunk sem referencia detectado pelo garbage collector | { chunkId, size, timestamp } |

---

### ChunkReplica

**Descricao:** Registro de uma copia de um chunk armazenada em um no especifico. Entidade central para monitoramento de replicacao, scrubbing e auto-healing.

**Atributos:**

| Campo | Tipo | Obrigatorio | Validacao | Descricao |
| --- | --- | --- | --- | --- |
| chunk_id | string | sim | FK → chunks(id), 64 chars hex | Chunk que esta replica armazena |
| node_id | UUID | sim | FK → nodes(id) | No onde esta replica esta armazenada |
| status | enum | sim | `pending`, `healthy`, `corrupted` | Estado atual da replica |
| verified_at | datetime | nao | nullable | Timestamp do ultimo scrubbing bem-sucedido |
| created_at | datetime | sim | auto, imutavel | Data de criacao da replica |

**Invariantes (regras que NUNCA podem ser violadas):**

- Minimo de 3 replicas por chunk em nos diferentes — invariante mais importante do sistema (RN-CR1)
- Diversidade preferencial: idealmente 1 local + 1 cloud + 1 outro dispositivo (RN-CR2)
- Scrubbing periodico recalcula SHA-256 e compara com chunk_id; verified_at atualizado em sucesso (RN-CR3)
- Replica corrompida substituida automaticamente a partir de replica saudavel em outro no (RN-CR4)

**Metodos:**

| Metodo | Parametros | Retorno | Descricao |
| --- | --- | --- | --- |
| create() | { chunkId, nodeId } | ChunkReplica | status = pending, emite ChunkReplicated apos confirmacao |
| confirmReplication() | — | void | status → healthy, emite ChunkReplicated |
| markCorrupted() | — | void | status → corrupted, emite ChunkCorrupted |
| repair() | { sourceNodeId } | void | Copia de replica saudavel, status → healthy, emite ChunkRepaired |
| verify() | { computedHash } | boolean | Compara computedHash com chunk_id; atualiza verified_at se ok |

**Eventos Emitidos:**

| Evento | Quando | Payload |
| --- | --- | --- |
| ChunkReplicated | Replica criada em no destino com sucesso | { chunkId, nodeId, totalReplicas, timestamp } |
| ChunkCorrupted | Scrubbing detectou hash divergente | { chunkId, nodeId, expectedHash, actualHash, timestamp } |
| ChunkRepaired | Replica corrompida substituida por copia saudavel | { chunkId, nodeId, sourceNodeId, timestamp } |

---

### Vault

**Descricao:** Cofre criptografado individual por membro. O vault do admin e especial — alem de credenciais pessoais, contem a configuracao do cluster, lista de nos e credenciais de provedores cloud necessarias para recovery.

**Atributos:**

| Campo | Tipo | Obrigatorio | Validacao | Descricao |
| --- | --- | --- | --- | --- |
| member_id | UUID | sim | FK → members(id), unico (1:1) | Membro dono do vault |
| vault_data | bytes | sim | nao vazio | Conteudo criptografado do cofre |
| encryption_algorithm | string | sim | default 'AES-256-GCM' | Algoritmo de criptografia usado |
| replicated_to | jsonb | sim | array de node_ids, default [] | Lista de node_ids onde o vault foi replicado |
| is_admin_vault | boolean | sim | default false | Indica vault de admin (contem config do cluster) |
| created_at | datetime | sim | auto, imutavel | Data de criacao |
| updated_at | datetime | sim | auto | Ultima atualizacao |

**Invariantes (regras que NUNCA podem ser violadas):**

- Vault do admin contem: config do cluster, lista de nos, credenciais S3/R2, master key derivada (RN-V1)
- Vault de membro regular contem: credenciais pessoais, tokens OAuth, preferencias (RN-V2)
- Vault replicado em nos de storage para viabilizar recovery via seed (RN-V3)
- Vault desbloqueado com senha do membro; no recovery, desbloqueado com master key (RN-V4)
- Credenciais e tokens nunca armazenados em texto puro — somente dentro do vault (RN-V5)

**Metodos:**

| Metodo | Parametros | Retorno | Descricao |
| --- | --- | --- | --- |
| create() | { memberId, password, isAdmin } | Vault | Inicializa vault vazio criptografado, emite VaultCreated |
| unlock() | { password } | decryptedData | Descriptografa vault_data com senha do membro |
| unlockWithMasterKey() | { masterKey } | decryptedData | Recovery: descriptografa com master key derivada da seed |
| update() | { password, newData } | void | Atualiza conteudo criptografado, emite VaultUpdated |
| replicate() | { nodeId } | void | Adiciona nodeId ao replicated_to, emite VaultReplicated |

**Eventos Emitidos:**

| Evento | Quando | Payload |
| --- | --- | --- |
| VaultCreated | Vault inicializado na criacao do membro | { memberId, isAdminVault, timestamp } |
| VaultUpdated | Credencial adicionada ou atualizada | { memberId, timestamp } |
| VaultReplicated | Vault replicado em no de storage | { memberId, nodeId, totalReplicas, timestamp } |

---

### Alert

**Descricao:** Notificacao de condicao anomala no cluster. Gerada automaticamente pelo Scheduler ou por eventos do sistema. Persiste ate resolucao manual ou automatica (auto-healing).

**Atributos:**

| Campo | Tipo | Obrigatorio | Validacao | Descricao |
| --- | --- | --- | --- | --- |
| alert_id | UUID | sim | auto-generated | Identificador unico |
| type | enum | sim | `node_offline`, `replication_low`, `token_expired`, `space_low`, `corruption_detected`, `auto_healing_complete` | Tipo de alerta |
| message | string | sim | nao vazio | Descricao legivel do problema |
| severity | enum | sim | `info`, `warning`, `critical` | Severidade do alerta |
| resolved | boolean | sim | default false | Se foi resolvido (manual ou auto) |
| related_entity_id | UUID | nao | nullable | ID da entidade relacionada (node_id, file_id, etc.) |
| created_at | datetime | sim | auto, imutavel | Data de criacao |
| resolved_at | datetime | nao | nullable | Data de resolucao |

**Invariantes (regras que NUNCA podem ser violadas):**

- Alertas gerados automaticamente pelo Scheduler ou por eventos — nunca manualmente (RN-A1)
- Alertas persistem ate resolucao — sem expiracao automatica (RN-A2)
- Auto-healing pode resolver alertas automaticamente (ex: no volta online → alerta resolvido) (RN-A3)

**Metodos:**

| Metodo | Parametros | Retorno | Descricao |
| --- | --- | --- | --- |
| create() | { type, message, severity, relatedEntityId } | Alert | Cria alerta, emite AlertCreated |
| resolve() | — | void | resolved = true, resolved_at = now(), emite AlertResolved |
| isActive() | — | boolean | Retorna !resolved |

**Eventos Emitidos:**

| Evento | Quando | Payload |
| --- | --- | --- |
| AlertCreated | Condicao anomala detectada | { alertId, type, severity, message, relatedEntityId, timestamp } |
| AlertResolved | Condicao resolvida (manual ou auto) | { alertId, type, resolvedAt, timestamp } |

---

### Invite

**Descricao:** Convite para ingresso de um novo membro no cluster. Token assinado com chave do cluster e expiracao configuravel. Uso unico — invalidado apos aceite.

**Atributos:**

| Campo | Tipo | Obrigatorio | Validacao | Descricao |
| --- | --- | --- | --- | --- |
| invite_id | UUID | sim | auto-generated | Identificador unico |
| email | string | sim | formato RFC 5322, max 255 | Email do convidado |
| role | enum | sim | `admin`, `member`, `reader` | Role atribuida ao aceitar |
| token | string | sim | assinado com chave privada do cluster, unico | Token de convite |
| expires_at | datetime | sim | default now() + 7 dias | Data de expiracao |
| created_by | UUID | sim | FK → members(id) | Admin que criou o convite |
| accepted_at | datetime | nao | nullable | Data de aceite; null se pendente |
| created_at | datetime | sim | auto, imutavel | Data de criacao |

**Invariantes (regras que NUNCA podem ser violadas):**

- Token assinado com chave privada do cluster; expiracao padrao de 7 dias (RN-I1)
- Token de uso unico — apos aceite, accepted_at e preenchido e token nao pode ser reutilizado (RN-I2)
- Email ja existente no cluster → rejeicao com erro 409 (RN-I3)
- Somente membros com role `admin` podem criar convites (RN-I4)

**Metodos:**

| Metodo | Parametros | Retorno | Descricao |
| --- | --- | --- | --- |
| create() | { email, role, createdBy, clusterPrivateKey } | Invite | Valida role do criador (RN-I4), verifica email duplicado (RN-I3), gera token assinado, emite InviteCreated |
| accept() | — | void | Valida nao expirado, uso unico (RN-I2), preenche accepted_at, emite InviteAccepted |
| expire() | — | void | Marca como expirado, emite InviteExpired |
| isValid() | — | boolean | Retorna accepted_at == null && expires_at > now() |
| verifyToken() | { clusterPublicKey } | boolean | Verifica assinatura do token |

**Eventos Emitidos:**

| Evento | Quando | Payload |
| --- | --- | --- |
| InviteCreated | Convite gerado pelo admin | { inviteId, email, role, createdBy, expiresAt, timestamp } |
| InviteAccepted | Convidado aceitou e ingressou no cluster | { inviteId, email, memberId, timestamp } |
| InviteExpired | Convite nao aceito dentro do prazo | { inviteId, email, expiresAt, timestamp } |

<!-- APPEND:entidades -->

---

## Value Objects

> Conceitos imutaveis definidos pelo valor (nao por identidade). Usados para encapsular validacao e garantir consistencia.

| Value Object | Campos | Validacao | Usado em |
| --- | --- | --- | --- |
| Email | address: string | formato RFC 5322, max 255, lowercase, trim | Member.email, Invite.email |
| ChunkId | hash: string | SHA-256, exatamente 64 chars hex, imutavel | Chunk.chunk_id, ChunkReplica.chunk_id, ManifestChunk.chunk_id |
| SeedPhrase | words: string[] | exatamente 12 palavras, dicionario BIP-39 valido | Usado na criacao e recovery do Cluster |
| MasterKey | key: bytes | derivada da SeedPhrase via PBKDF2/scrypt, 256 bits | Usada para derivar file keys (envelope encryption) |
| FileKey | key: bytes | derivada da MasterKey, AES-256-GCM, 256 bits | Usada para criptografar chunks de um arquivo |
| ContentHash | hash: string | SHA-256, 64 chars hex | File.content_hash, Preview.content_hash |
| NodeEndpoint | url: string | URL valida (https:// para cloud, path para local) | Node.endpoint |
| Capacity | total: long, used: long | total >= 0, used >= 0, used <= total | Node.total_capacity + Node.used_capacity |

<!-- APPEND:value-objects -->

---

## Regras de Negocio

> Todas as regras de negocio do sistema com ID para rastreabilidade. Referencia cruzada com as entidades.

| ID | Regra | Severidade | Entidade | Onde Validar |
| --- | --- | --- | --- | --- |
| RN-C1 | cluster_id = SHA-256(public_key) — imutavel apos criacao | Alta | Cluster | Domain |
| RN-C2 | Seed phrase de 12 palavras BIP-39 gera master key via envelope encryption | Alta | Cluster | Domain |
| RN-C3 | Maximo de 10 membros por cluster | Media | Cluster | Domain |
| RN-C4 | Maximo de 50 nos por cluster | Media | Cluster | Domain |
| RN-M1 | Email unico dentro do cluster — erro 409 se duplicado | Alta | Member | Domain + Repository |
| RN-M2 | Pelo menos 1 admin por cluster; nao remover/rebaixar ultimo admin | Alta | Member | Domain |
| RN-M3 | Permissoes por role: reader visualiza; member upload/download; admin gerencia | Alta | Member | Domain + Middleware |
| RN-M4 | Ingresso exclusivamente via convite com token assinado (exceto criador) | Alta | Member | Service |
| RN-N1 | Sem heartbeat por 30min → status suspect + alerta warning | Media | Node | Scheduler |
| RN-N2 | Sem heartbeat por 1h → status lost + alerta critical + auto-healing | Alta | Node | Scheduler |
| RN-N3 | Remocao de no exige drain obrigatorio | Alta | Node | Service |
| RN-N4 | Credenciais de nos cloud criptografadas no vault do owner | Alta | Node | Domain |
| RN-N5 | Teste de conectividade obrigatorio no registro (PUT/GET de chunk teste) | Alta | Node | Service |
| RN-N6 | Minimo 3 nos ativos para aceitar uploads (garantir replicacao 3x) | Alta | Node | Service |
| RN-F1 | Classificacao automatica via MIME type | Baixa | File | Domain |
| RN-F2 | Otimizacao obrigatoria: fotos → WebP 1920px; videos → 1080p H.265/AV1 | Media | File | Service (Pipeline) |
| RN-F3 | Documentos fazem bypass do pipeline de otimizacao | Baixa | File | Service (Pipeline) |
| RN-F4 | Limites de tamanho: fotos 50MB, videos 10GB, documentos 2GB, archives 5GB | Alta | File | Controller + Domain |
| RN-F5 | Deduplicacao via content_hash — reutiliza chunks existentes | Media | File | Service |
| RN-F6 | Placeholder somente quando replicacao 3x confirmada para todos os chunks | Alta | File | Service |
| RN-P1 | Preview somente para exibicao — nao oferece download do original | Alta | Preview | Controller |
| RN-P2 | Tamanho alvo: foto ~50KB WebP; video 480p ~5MB MP4; PDF ~100KB PNG | Media | Preview | Service (Pipeline) |
| RN-P3 | Preview gerado durante pipeline, antes da distribuicao dos chunks | Media | Preview | Service (Pipeline) |
| RN-P4 | Preview armazenado como chunk(s) criptografado(s) | Alta | Preview | Service |
| RN-MA1 | Todo arquivo ready tem exatamente 1 manifest | Alta | Manifest | Domain |
| RN-MA2 | File key criptografada com master key (envelope encryption) | Alta | Manifest | Domain |
| RN-MA3 | Manifest assinado com chave privada do cluster | Alta | Manifest | Domain |
| RN-MA4 | Manifest replicado em 2+ nos alem do orquestrador | Alta | Manifest | Service |
| RN-MA5 | Manifests sao fonte de verdade para recovery via seed | Alta | Manifest | Service |
| RN-CH1 | Tamanho fixo de ~4MB por chunk (ultimo pode ser menor) | Media | Chunk | Domain |
| RN-CH2 | chunk_id = SHA-256(conteudo criptografado) — imutavel | Alta | Chunk | Domain |
| RN-CH3 | Todo chunk criptografado com AES-256-GCM | Alta | Chunk | Domain |
| RN-CH4 | Chunk pode ser referenciado por multiplos manifests (deduplicacao) | Media | Chunk | Domain |
| RN-CH5 | Chunk orfao (reference_count = 0) elegivel para garbage collection | Media | Chunk | Scheduler |
| RN-CH6 | Metadata minimo embutido no chunk para recovery sem orquestrador | Alta | Chunk | Domain |
| RN-CR1 | Minimo 3 replicas por chunk em nos diferentes | Alta | ChunkReplica | Service |
| RN-CR2 | Diversidade preferencial: 1 local + 1 cloud + 1 outro | Media | ChunkReplica | Service |
| RN-CR3 | Scrubbing periodico recalcula SHA-256 e compara com chunk_id | Alta | ChunkReplica | Scheduler |
| RN-CR4 | Replica corrompida substituida automaticamente | Alta | ChunkReplica | Service |
| RN-V1 | Vault admin contem config cluster, nos, credenciais S3/R2, master key | Alta | Vault | Domain |
| RN-V2 | Vault membro contem credenciais pessoais, tokens OAuth, preferencias | Media | Vault | Domain |
| RN-V3 | Vault replicado em nos de storage para recovery | Alta | Vault | Service |
| RN-V4 | Vault desbloqueado com senha; no recovery, com master key | Alta | Vault | Domain |
| RN-V5 | Credenciais nunca em texto puro — somente dentro do vault | Alta | Vault | Domain |
| RN-A1 | Alertas gerados automaticamente — nunca manualmente | Media | Alert | Scheduler + Service |
| RN-A2 | Alertas persistem ate resolucao — sem expiracao | Baixa | Alert | Domain |
| RN-A3 | Auto-healing pode resolver alertas automaticamente | Media | Alert | Service |
| RN-I1 | Token assinado com chave privada; expiracao padrao 7 dias | Alta | Invite | Domain |
| RN-I2 | Token de uso unico — invalidado apos aceite | Alta | Invite | Domain |
| RN-I3 | Email ja existente no cluster → erro 409 | Media | Invite | Domain + Repository |
| RN-I4 | Somente admin pode criar convites | Alta | Invite | Domain + Middleware |

<!-- APPEND:regras -->

---

## Relacionamentos

> Como as entidades se relacionam entre si. Regras de cascade definem o comportamento ao deletar/remover.

| Entidade A | Cardinalidade | Entidade B | Cascade | Obrigatorio | Descricao |
| --- | --- | --- | --- | --- | --- |
| Cluster | 1:N | Member | RESTRICT on delete | sim | Cluster possui membros; minimo 1 (admin criador) |
| Cluster | 1:N | Node | RESTRICT on delete | nao | Cluster gerencia nos de armazenamento |
| Cluster | 1:N | File | RESTRICT on delete | nao | Cluster contem arquivos enviados pelos membros |
| Cluster | 1:N | Alert | CASCADE on delete | nao | Cluster gera alertas de condicoes anomalas |
| Cluster | 1:N | Invite | CASCADE on delete | nao | Cluster possui convites pendentes ou aceitos |
| Member | 1:1 | Vault | CASCADE on delete | sim | Cada membro tem exatamente 1 vault criptografado |
| Member | 1:N | Node | SET NULL on delete | nao | Membro registra nos (owner do no) |
| Member | 1:N | File | SET NULL on delete | nao | Membro faz upload de arquivos |
| Member | 1:N | Invite | SET NULL on delete | nao | Admin cria convites para novos membros |
| File | 1:1 | Preview | CASCADE on delete | nao | Arquivo processado tem 1 preview |
| File | 1:1 | Manifest | CASCADE on delete | nao | Arquivo ready tem exatamente 1 manifest |
| Manifest | N:M | Chunk | — (via manifest_chunks) | sim | Manifest referencia chunks; chunk pode ser referenciado por multiplos manifests |
| Chunk | 1:N | ChunkReplica | CASCADE on delete | sim | Cada chunk tem 3+ replicas em nos diferentes |
| Node | 1:N | ChunkReplica | RESTRICT on delete | nao | No armazena multiplas replicas (exige drain antes de remover) |

<!-- APPEND:relacionamentos -->

---

## Maquinas de Estado

> Entidades com ciclo de vida, estados e transicoes controladas.

### Cluster — Estados

```
[active] ←→ [suspended]
```

**Transicoes:**

| De | Evento/Acao | Para | Regra | Side-effect |
| --- | --- | --- | --- | --- |
| active | suspend() | suspended | Apenas admin do cluster | Uploads bloqueados; nos continuam heartbeat |
| suspended | activate() | active | Apenas admin do cluster | Uploads reabilitados |

**Estados terminais:** Nenhum — cluster pode alternar entre active e suspended.

**Transicoes proibidas:**
- suspended → qualquer estado que nao seja active

---

### Node — Estados

```
[online] → markSuspect() → [suspect] → markLost() → [lost]
[suspect] → recover() → [online]
[online] → startDrain() → [draining] → completeDrain() → [disconnected]
```

**Transicoes:**

| De | Evento/Acao | Para | Regra | Side-effect |
| --- | --- | --- | --- | --- |
| online | markSuspect() | suspect | Sem heartbeat por 30min (RN-N1) | Emite NodeSuspect, cria alerta warning |
| suspect | markLost() | lost | Sem heartbeat por 1h (RN-N2) | Emite NodeLost, cria alerta critical, inicia auto-healing |
| suspect | recover() (heartbeat recebido) | online | Heartbeat recebido | Resolve alerta warning |
| online | startDrain() | draining | Admin solicitou remocao (RN-N3) | Inicia migracao de todos os chunks |
| draining | completeDrain() | disconnected | Todos os chunks migrados | Emite NodeDrained, remove do ConsistentHashRing |

**Estados terminais:**
- `disconnected` — no removido definitivamente; requer novo registro
- `lost` — requer intervencao; pode voltar a online se no reconectar

**Transicoes proibidas:**
- lost → draining (no perdido nao pode ser drenado)
- disconnected → qualquer estado (requer novo registro)
- draining → online (drain nao pode ser cancelado)

---

### File — Estados

```
[processing] → process() → [ready]
[processing] → markError() → [error]
[ready] → markCorrupted() → [corrupted]
```

**Transicoes:**

| De | Evento/Acao | Para | Regra | Side-effect |
| --- | --- | --- | --- | --- |
| processing | process() | ready | Pipeline completo com sucesso | Emite FileProcessed; preview e manifest criados |
| processing | markError() | error | Pipeline falhou | Registra error_message |
| ready | markCorrupted() | corrupted | Scrubbing detectou chunks irrecuperaveis | Emite FileCorrupted; cria alerta critical |

**Estados terminais:**
- `error` — requer reprocessamento manual ou automatico
- `corrupted` — chunks irrecuperaveis; arquivo perdido

**Transicoes proibidas:**
- ready → processing (nao reprocessa arquivo pronto)
- corrupted → ready (chunks perdidos nao podem ser recuperados)
- error → ready (requer novo upload ou reprocessamento)

---

### ChunkReplica — Estados

```
[pending] → confirmReplication() → [healthy]
[healthy] → markCorrupted() → [corrupted]
[corrupted] → repair() → [healthy]
```

**Transicoes:**

| De | Evento/Acao | Para | Regra | Side-effect |
| --- | --- | --- | --- | --- |
| pending | confirmReplication() | healthy | PUT confirmado no no destino | Emite ChunkReplicated |
| healthy | markCorrupted() | corrupted | Scrubbing detectou hash divergente (RN-CR3) | Emite ChunkCorrupted; cria alerta |
| corrupted | repair() | healthy | Copia de replica saudavel em outro no (RN-CR4) | Emite ChunkRepaired; resolve alerta |

**Estados terminais:** Nenhum — replica corrompida pode ser reparada.

**Transicoes proibidas:**
- pending → corrupted (nao pode corromper antes de confirmar)
- corrupted → pending (reparo vai direto para healthy)

---

### Invite — Estados

```
[pending] → accept() → [accepted]
[pending] → expire() → [expired]
```

**Transicoes:**

| De | Evento/Acao | Para | Regra | Side-effect |
| --- | --- | --- | --- | --- |
| pending | accept() | accepted | Token valido e nao expirado (RN-I1, RN-I2) | Emite InviteAccepted; cria membro + vault |
| pending | expire() | expired | expires_at < now() | Emite InviteExpired |

**Estados terminais:**
- `accepted` — convite utilizado, uso unico
- `expired` — convite expirou sem ser aceito

**Transicoes proibidas:**
- accepted → qualquer estado (uso unico, irreversivel)
- expired → qualquer estado (nao pode ser reativado; emitir novo convite)

<!-- APPEND:maquinas -->

> (ver [04-data-layer.md](04-data-layer.md) para schema de banco e repositories)
