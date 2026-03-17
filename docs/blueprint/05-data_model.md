# Modelo de Dados

Enquanto o [Modelo de Domínio](./04-domain_model.md) descreve entidades e regras de negócio de forma **lógica e conceitual**, o modelo de dados define como essas entidades serão **fisicamente armazenadas**. Aqui tratamos de tabelas, campos, tipos de dados, constraints, índices e estratégias de migração.

> A separação entre domínio e dados permite que decisões de negócio e decisões de infraestrutura evoluam de forma independente.

---

## Banco de Dados

- **Tecnologia principal:** PostgreSQL 18
- **Justificativa:** Dados altamente relacionais com integridade referencial necessária (clusters → membros → nós → arquivos → chunks → réplicas). Suporte nativo a JSONB para metadata flexível (EXIF, configurações). Transações ACID garantem consistência em operações críticas (criação de manifest + chunks + réplicas deve ser atômica). Ecossistema maduro de migrações e tooling em Rust.

- **Tecnologia auxiliar:** Redis 7+
- **Justificativa:** Fila de processamento para pipeline de mídia (transcodificação de vídeo pode levar minutos). Pub/sub para eventos internos (nó online, alerta gerado). Sem overhead operacional extra — já necessário para fila.

**Padrões de acesso dominantes:**

| Padrão | Frequência | Descrição |
|--------|-----------|-----------|
| Leitura de galeria | Alta | Listar arquivos por cluster + data (paginação por cursor) |
| Verificação de réplicas | Alta | Contar réplicas por chunk, listar chunks sub-replicados |
| Heartbeat update | Alta | Atualizar last_heartbeat de nós (write-heavy) |
| Criação de arquivo | Média | Insert atômico: file + manifest + chunks + réplicas |
| Scrubbing scan | Baixa (periódico) | Scan sequencial de chunk_replicas por verified_at |
| Recovery rebuild | Rara | Bulk insert de metadados reconstruídos dos manifests |

---

## Tabelas / Collections

### clusters

**Descrição:** Grupo familiar raiz. Armazena identidade criptográfica e chaves do cluster.

**Campos:**

| Campo | Tipo | Constraint | Descrição |
|-------|------|-----------|-----------|
| id | UUID | PK, NOT NULL | Identificador interno |
| cluster_id | VARCHAR(64) | UNIQUE, NOT NULL | Hash da chave pública — identidade criptográfica |
| name | VARCHAR(255) | NOT NULL | Nome legível do cluster |
| public_key | BYTEA | NOT NULL | Chave pública para verificação de assinaturas |
| encrypted_private_key | BYTEA | NOT NULL | Chave privada criptografada com master key |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data de criação |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Última atualização |

**Índices:**

| Nome do Índice | Campos | Tipo | Justificativa |
|---------------|--------|------|---------------|
| clusters_cluster_id_key | cluster_id | UNIQUE BTREE | Lookup por identidade criptográfica |

---

### members

**Descrição:** Pessoas autorizadas no cluster com nível de permissão.

**Campos:**

| Campo | Tipo | Constraint | Descrição |
|-------|------|-----------|-----------|
| id | UUID | PK, NOT NULL | Identificador único |
| cluster_id | UUID | FK → clusters(id), NOT NULL | Cluster ao qual pertence |
| name | VARCHAR(255) | NOT NULL | Nome completo |
| email | VARCHAR(255) | NOT NULL | E-mail para identificação |
| role | VARCHAR(20) | NOT NULL, CHECK (role IN ('admin', 'membro', 'leitura')) | Nível de permissão |
| invited_by | UUID | FK → members(id), NULL | Quem convidou (null para criador) |
| joined_at | TIMESTAMPTZ | NOT NULL | Data de ingresso |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data de criação |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Última atualização |

**Índices:**

| Nome do Índice | Campos | Tipo | Justificativa |
|---------------|--------|------|---------------|
| members_cluster_email_key | cluster_id, email | UNIQUE BTREE | Um email por cluster |
| members_cluster_id_idx | cluster_id | BTREE | Listar membros de um cluster |

---

### nodes

**Descrição:** Dispositivos e serviços cloud que armazenam chunks criptografados.

**Campos:**

| Campo | Tipo | Constraint | Descrição |
|-------|------|-----------|-----------|
| id | UUID | PK, NOT NULL | Identificador único |
| cluster_id | UUID | FK → clusters(id), NOT NULL | Cluster ao qual pertence |
| owner_id | UUID | FK → members(id), NOT NULL | Membro que registrou |
| type | VARCHAR(20) | NOT NULL, CHECK (type IN ('local', 's3', 'r2', 'vps')) | Tipo de nó |
| name | VARCHAR(255) | NOT NULL | Nome descritivo |
| total_capacity | BIGINT | NOT NULL | Espaço total em bytes |
| used_capacity | BIGINT | NOT NULL, DEFAULT 0 | Espaço usado em bytes |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'online', CHECK (status IN ('online', 'suspect', 'lost', 'draining')) | Estado atual |
| endpoint | TEXT | NULL | URL/endereço de conexão |
| config_encrypted | BYTEA | NULL | Credenciais criptografadas (S3 keys, etc.) |
| last_heartbeat | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Último heartbeat recebido |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data de criação |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Última atualização |

**Índices:**

| Nome do Índice | Campos | Tipo | Justificativa |
|---------------|--------|------|---------------|
| nodes_cluster_status_idx | cluster_id, status | BTREE | Listar nós ativos de um cluster |
| nodes_last_heartbeat_idx | last_heartbeat | BTREE | Scheduler: encontrar nós com heartbeat atrasado |
| nodes_cluster_id_idx | cluster_id | BTREE | Listar todos os nós de um cluster |

---

### files

**Descrição:** Representação lógica de fotos, vídeos e documentos processados pelo pipeline.

**Campos:**

| Campo | Tipo | Constraint | Descrição |
|-------|------|-----------|-----------|
| id | UUID | PK, NOT NULL | Identificador único |
| cluster_id | UUID | FK → clusters(id), NOT NULL | Cluster ao qual pertence |
| uploaded_by | UUID | FK → members(id), NOT NULL | Membro que fez upload |
| original_name | VARCHAR(500) | NOT NULL | Nome do arquivo original |
| media_type | VARCHAR(20) | NOT NULL, CHECK (media_type IN ('foto', 'video', 'documento')) | Tipo de mídia |
| original_size | BIGINT | NOT NULL | Tamanho antes de otimização (bytes) |
| optimized_size | BIGINT | NOT NULL | Tamanho após otimização (bytes) |
| content_hash | VARCHAR(64) | NOT NULL | SHA-256 do conteúdo otimizado |
| metadata | JSONB | NULL | EXIF e metadados extraídos |
| preview_chunk_id | VARCHAR(64) | NULL | Chunk ID do preview/thumbnail |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'processing', CHECK (status IN ('processing', 'ready', 'error')) | Estado do pipeline |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data de criação |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Última atualização |

**Índices:**

| Nome do Índice | Campos | Tipo | Justificativa |
|---------------|--------|------|---------------|
| files_cluster_created_idx | cluster_id, created_at DESC | BTREE | Galeria: listar arquivos por data (query mais frequente) |
| files_content_hash_idx | content_hash | BTREE | Deduplicação por conteúdo |
| files_cluster_status_idx | cluster_id, status | BTREE | Listar arquivos pendentes/com erro |
| files_uploaded_by_idx | uploaded_by | BTREE | Listar arquivos de um membro |

---

### manifests

**Descrição:** Mapa que descreve completamente um arquivo: chunks, hashes, chave de criptografia.

**Campos:**

| Campo | Tipo | Constraint | Descrição |
|-------|------|-----------|-----------|
| id | UUID | PK, NOT NULL | Identificador único |
| file_id | UUID | FK → files(id), UNIQUE, NOT NULL | Arquivo descrito (1:1) |
| chunks_json | JSONB | NOT NULL | Lista ordenada: [{chunk_id, index, hash, size}] |
| file_key_encrypted | BYTEA | NOT NULL | Chave do arquivo criptografada com master key |
| signature | BYTEA | NULL | Assinatura criptográfica do manifest |
| replicated_to | JSONB | NOT NULL, DEFAULT '[]' | Lista de node_ids com cópia do manifest |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data de criação |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Última atualização |

**Índices:**

| Nome do Índice | Campos | Tipo | Justificativa |
|---------------|--------|------|---------------|
| manifests_file_id_key | file_id | UNIQUE BTREE | Lookup rápido por arquivo (1:1) |

---

### chunks

**Descrição:** Blocos criptografados de ~4MB. ID é o hash SHA-256 (content-addressable).

**Campos:**

| Campo | Tipo | Constraint | Descrição |
|-------|------|-----------|-----------|
| id | VARCHAR(64) | PK, NOT NULL | SHA-256 do conteúdo criptografado |
| file_id | UUID | FK → files(id), NOT NULL | Arquivo ao qual pertence |
| chunk_index | INTEGER | NOT NULL | Posição dentro do arquivo (0-based) |
| size | INTEGER | NOT NULL | Tamanho em bytes |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data de criação |

**Índices:**

| Nome do Índice | Campos | Tipo | Justificativa |
|---------------|--------|------|---------------|
| chunks_file_index_idx | file_id, chunk_index | BTREE | Reconstruir arquivo na ordem correta |
| chunks_file_id_idx | file_id | BTREE | Listar todos os chunks de um arquivo |

---

### chunk_replicas

**Descrição:** Registro de qual chunk está em qual nó. Tabela de junção N:M entre chunks e nodes.

**Campos:**

| Campo | Tipo | Constraint | Descrição |
|-------|------|-----------|-----------|
| id | UUID | PK, NOT NULL | Identificador único |
| chunk_id | VARCHAR(64) | FK → chunks(id), NOT NULL | Chunk replicado |
| node_id | UUID | FK → nodes(id), NOT NULL | Nó que armazena |
| verified_at | TIMESTAMPTZ | NULL | Último scrubbing bem-sucedido |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data de criação |

**Índices:**

| Nome do Índice | Campos | Tipo | Justificativa |
|---------------|--------|------|---------------|
| chunk_replicas_chunk_node_key | chunk_id, node_id | UNIQUE BTREE | Evitar réplica duplicada no mesmo nó |
| chunk_replicas_chunk_id_idx | chunk_id | BTREE | Encontrar todas as réplicas de um chunk |
| chunk_replicas_node_id_idx | node_id | BTREE | Listar chunks de um nó (para drain e GC) |
| chunk_replicas_verified_idx | verified_at | BTREE | Scrubbing: encontrar réplicas não verificadas há tempo |

---

### alerts

**Descrição:** Alertas de saúde do cluster para notificação ao admin.

**Campos:**

| Campo | Tipo | Constraint | Descrição |
|-------|------|-----------|-----------|
| id | UUID | PK, NOT NULL | Identificador único |
| cluster_id | UUID | FK → clusters(id), NOT NULL | Cluster relacionado |
| type | VARCHAR(50) | NOT NULL | node_offline, low_replication, integrity_error, token_expired, space_low |
| message | TEXT | NOT NULL | Descrição legível do problema |
| severity | VARCHAR(20) | NOT NULL, CHECK (severity IN ('info', 'warning', 'critical')) | Nível de severidade |
| resolved | BOOLEAN | NOT NULL, DEFAULT FALSE | Se o problema foi resolvido |
| resource_type | VARCHAR(50) | NULL | Tipo do recurso afetado (node, chunk, file) |
| resource_id | VARCHAR(64) | NULL | ID do recurso afetado |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data de criação |
| resolved_at | TIMESTAMPTZ | NULL | Data de resolução |

**Índices:**

| Nome do Índice | Campos | Tipo | Justificativa |
|---------------|--------|------|---------------|
| alerts_cluster_resolved_idx | cluster_id, resolved | BTREE | Listar alertas ativos de um cluster |
| alerts_resource_idx | resource_type, resource_id | BTREE | Encontrar alertas de um recurso específico (deduplicação) |
| alerts_created_idx | created_at DESC | BTREE | Listar alertas recentes |

---

## Diagrama ER

> 📐 Diagrama: [er-diagram.mmd](../diagrams/domain/er-diagram.mmd)

---

## Estratégia de Migração

- **Ferramenta:** [sqlx-cli](https://github.com/launchbadge/sqlx) (Rust) ou [refinery](https://github.com/rust-db/refinery) — migrações versionadas em SQL puro
- **Convenção de nomes:** `V001__create_clusters_table.sql`, `V002__create_members_table.sql`, etc. — numeração sequencial + descrição em snake_case
- **Estratégia de rollback:** Cada migração tem arquivo `up.sql` e `down.sql`. Rollback é manual via CLI; migrações destrutivas requerem confirmação explícita.
- **Migrações destrutivas:** Colunas são marcadas como deprecated (comentário na migration) por pelo menos 1 release antes de serem removidas. `ALTER DROP` nunca é executado em produção sem backup prévio verificado.
- **Ambiente de teste:** Migrações são validadas em PostgreSQL local (Docker) antes de aplicar em produção.

---

## Índices e Otimizações

### Queries Críticas

| Descrição da Query | Tabelas Envolvidas | Frequência | SLA Esperado |
|--------------------|--------------------|-----------|-------------|
| Listar arquivos do cluster por data (galeria) | files | Alta | < 50ms |
| Contar réplicas de um chunk | chunk_replicas | Alta | < 10ms |
| Listar chunks com menos de 3 réplicas (auto-healing) | chunks + chunk_replicas | Média (scheduler) | < 200ms |
| Atualizar last_heartbeat de um nó | nodes | Alta (cada nó a cada minuto) | < 10ms |
| Listar todos os chunks de um nó (drain) | chunk_replicas | Baixa | < 500ms |
| Buscar arquivo por hash (deduplicação) | files | Média | < 20ms |
| Listar réplicas não verificadas há >X dias (scrubbing) | chunk_replicas | Baixa (scheduler) | < 200ms |
| Insert atômico: file + manifest + chunks + réplicas | files, manifests, chunks, chunk_replicas | Média | < 100ms |
| Listar alertas ativos do cluster | alerts | Baixa | < 50ms |
| Recovery: bulk insert de metadados reconstruídos | todas | Rara | < 30min para 100k arquivos |

### Diretrizes de Otimização

- Usar paginação por cursor (created_at + id) em listagens de galeria — nunca OFFSET/LIMIT para grandes volumes
- Heartbeat update é a operação mais frequente; single-column UPDATE minimiza WAL e lock contention
- Contagem de réplicas por chunk: considerar materialized view ou counter cache em `chunks` se performance do COUNT se degradar
- JSONB em `metadata` e `chunks_json`: usar índices GIN apenas se busca por conteúdo JSONB for implementada (fase 2)
- Bulk insert durante recovery: usar COPY em vez de INSERT individual; desabilitar índices temporariamente se necessário
- Evitar N+1: ao listar galeria, fazer JOIN com manifests apenas quando o usuário pedir detalhes de um arquivo específico
- VACUUM ANALYZE periódico nas tabelas com alto volume de updates (nodes, chunk_replicas)

---

## Referências

- [PostgreSQL 18 Documentation](https://www.postgresql.org/docs/18/)
- [sqlx — Rust SQL toolkit](https://github.com/launchbadge/sqlx)
- [Redis 7 Documentation](https://redis.io/docs/)
