# Modelo de Dados

Enquanto o [Modelo de Domínio](./04-domain-model.md) descreve entidades e regras de negócio de forma **lógica e conceitual**, o modelo de dados define como essas entidades serão **fisicamente armazenadas**. Aqui tratamos de tabelas, campos, tipos de dados, constraints, índices e estratégias de migração.

> A separação entre domínio e dados permite que decisões de negócio e decisões de infraestrutura evoluam de forma independente.

---

## Banco de Dados

> Qual banco de dados será usado? Relacional ou NoSQL? Justifique a escolha considerando os padrões de leitura/escrita do sistema.

### PostgreSQL 18 (Primário)

- **Tecnologia:** PostgreSQL 18
- **Driver:** Prisma (TypeScript, type-safe queries)
- **Justificativa:** Transações ACID para consistência de metadados (manifests, réplicas, replicação 3x); JSONB para metadados flexíveis (EXIF, codec info); índices GIN para busca em metadata; modelo relacional alinhado com entidades bem definidas do domínio; referenciado em ADR-004

### Redis (Complementar)

- **Tecnologia:** Redis 7+
- **Driver:** ioredis (TypeScript, async)
- **Uso:** Fila de processamento do pipeline de mídia (jobs); pub/sub para eventos internos (file processed, node lost); cache de sessões JWT; não armazena dados persistentes de negócio
- **Justificativa:** Baixa latência para filas e pub/sub; sem necessidade de persistência — se Redis reinicia, jobs pendentes são re-enfileirados a partir do status "processing" no PostgreSQL

---

## Tabelas / Collections

> Quais estruturas de armazenamento são necessárias? Lembre-se de que nem toda entidade do domínio precisa de uma tabela própria, e uma entidade pode ser distribuída em mais de uma tabela.

### clusters

**Descrição:** Tabela raiz do sistema — cada registro representa um grupo familiar com identidade criptográfica.

**Campos:**

| Campo                 | Tipo         | Constraint                    | Descrição                                                      |
| --------------------- | ------------ | ----------------------------- | -------------------------------------------------------------- |
| id                    | UUID         | PK, DEFAULT gen_random_uuid() | Identificador interno                                          |
| cluster_id            | VARCHAR(64)  | UNIQUE, NOT NULL              | SHA-256 da chave pública; identificador criptográfico imutável |
| name                  | VARCHAR(100) | NOT NULL                      | Nome do cluster familiar                                       |
| public_key            | BYTEA        | NOT NULL                      | Chave pública do cluster para verificação de assinaturas       |
| encrypted_private_key | BYTEA        | NOT NULL                      | Chave privada criptografada com master key                     |
| status                | VARCHAR(20)  | NOT NULL, DEFAULT 'active'    | Estado do cluster: active, suspended                           |
| created_at            | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()       | Data de criação                                                |
| updated_at            | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()       | Última atualização                                             |

**Índices:**

| Nome do Índice          | Campos     | Tipo           | Justificativa                                               |
| ----------------------- | ---------- | -------------- | ----------------------------------------------------------- |
| idx_clusters_cluster_id | cluster_id | BTREE (UNIQUE) | Busca por identificador criptográfico em todas as operações |

---

### members

**Descrição:** Membros de um cluster familiar com role e vínculo de convite.

**Campos:**

| Campo         | Tipo         | Constraint                    | Descrição                                       |
| ------------- | ------------ | ----------------------------- | ----------------------------------------------- |
| id            | UUID         | PK, DEFAULT gen_random_uuid() | Identificador único                             |
| cluster_id    | UUID         | FK → clusters(id), NOT NULL   | Cluster ao qual pertence                        |
| name          | VARCHAR(100) | NOT NULL                      | Nome do membro                                  |
| email         | VARCHAR(255) | NOT NULL                      | Email para identificação                        |
| password_hash | VARCHAR(255) | NOT NULL                      | Hash da senha (Argon2id) para desbloquear vault |
| role          | VARCHAR(20)  | NOT NULL, DEFAULT 'member'    | admin, member, reader                           |
| invited_by    | UUID         | FK → members(id), NULL        | Membro que convidou; null para o criador        |
| storage_quota_bytes | BIGINT       | NULL                          | Cota de armazenamento individual (bytes); null = sem limite |
| joined_at     | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()       | Data de ingresso no cluster                     |
| created_at    | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()       | Data de criação                                 |
| updated_at    | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()       | Última atualização                              |

**Índices:**

| Nome do Índice            | Campos              | Tipo           | Justificativa                                     |
| ------------------------- | ------------------- | -------------- | ------------------------------------------------- |
| idx_members_cluster_email | (cluster_id, email) | BTREE (UNIQUE) | Email único por cluster; busca por email no login |
| idx_members_cluster_id    | cluster_id          | BTREE          | Listar membros de um cluster                      |

---

### nodes

**Descrição:** Nós de armazenamento (dispositivos locais e contas cloud) registrados no cluster.

**Campos:**

| Campo            | Tipo         | Constraint                    | Descrição                                                  |
| ---------------- | ------------ | ----------------------------- | ---------------------------------------------------------- |
| id               | UUID         | PK, DEFAULT gen_random_uuid() | Identificador único                                        |
| cluster_id       | UUID         | FK → clusters(id), NOT NULL   | Cluster ao qual pertence                                   |
| owner_id         | UUID         | FK → members(id), NOT NULL    | Membro que registrou o nó                                  |
| type             | VARCHAR(20)  | NOT NULL                      | Tipo do nó: local, s3, r2, b2, vps                         |
| name             | VARCHAR(100) | NOT NULL                      | Nome descritivo (ex.: "NAS Sala")                          |
| total_capacity   | BIGINT       | NOT NULL, DEFAULT 0           | Espaço total em bytes                                      |
| used_capacity    | BIGINT       | NOT NULL, DEFAULT 0           | Espaço usado em bytes                                      |
| status           | VARCHAR(20)  | NOT NULL, DEFAULT 'online'    | online, suspect, lost, draining, disconnected              |
| endpoint         | TEXT         | NOT NULL                      | URL ou caminho de conexão                                  |
| config_encrypted | BYTEA        | NOT NULL                      | Credenciais criptografadas (armazenadas no vault do owner) |
| last_heartbeat   | TIMESTAMPTZ  | NULL                          | Timestamp do último heartbeat recebido                     |
| tier             | VARCHAR(10)  | NULL, DEFAULT 'warm'          | hot, warm, cold                                            |
| created_at       | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()       | Data de criação                                            |
| updated_at       | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()       | Última atualização                                         |

**Índices:**

| Nome do Índice           | Campos               | Tipo  | Justificativa                                                         |
| ------------------------ | -------------------- | ----- | --------------------------------------------------------------------- |
| idx_nodes_cluster_id     | cluster_id           | BTREE | Listar nós de um cluster                                              |
| idx_nodes_status         | status               | BTREE | Filtrar nós online para distribuição de chunks                        |
| idx_nodes_last_heartbeat | last_heartbeat       | BTREE | Scheduler busca nós com heartbeat atrasado para detecção suspect/lost |
| idx_nodes_cluster_status | (cluster_id, status) | BTREE | Contar nós ativos por cluster (validação de mínimo 3)                 |

---

### files

**Descrição:** Arquivos de mídia e documentos enviados pelos membros ao cluster. Cada arquivo passa pelo pipeline de processamento.

**Campos:**

| Campo          | Tipo         | Constraint                     | Descrição                                               |
| -------------- | ------------ | ------------------------------ | ------------------------------------------------------- |
| id             | UUID         | PK, DEFAULT gen_random_uuid()  | Identificador único                                     |
| cluster_id     | UUID         | FK → clusters(id), NOT NULL    | Cluster ao qual pertence                                |
| uploaded_by    | UUID         | FK → members(id), NOT NULL     | Membro que fez upload                                   |
| original_name  | VARCHAR(500) | NOT NULL                       | Nome original do arquivo enviado                        |
| media_type     | VARCHAR(20)  | NOT NULL                       | Tipo: photo, video, document                            |
| mime_type      | VARCHAR(100) | NOT NULL                       | MIME type original (image/jpeg, video/mp4, etc.)        |
| original_size  | BIGINT       | NOT NULL                       | Tamanho antes da otimização (bytes)                     |
| optimized_size | BIGINT       | NULL                           | Tamanho após otimização; null enquanto processing       |
| content_hash   | VARCHAR(64)  | NULL                           | SHA-256 do conteúdo otimizado; null enquanto processing |
| metadata       | JSONB        | NULL                           | EXIF, duração, codec, páginas, encoding                 |
| status         | VARCHAR(20)  | NOT NULL, DEFAULT 'processing' | processing, ready, error, corrupted                     |
| error_message  | TEXT         | NULL                           | Mensagem de erro do pipeline (quando status = error)    |
| version_of     | UUID         | FK → files(id), NULL           | Referência ao arquivo original (versionamento)          |
| version_number | INTEGER      | NOT NULL, DEFAULT 1            | Número da versão do arquivo                             |
| created_at     | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()        | Data de criação                                         |
| updated_at     | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()        | Última atualização                                      |

**Índices:**

| Nome do Índice               | Campos                   | Tipo  | Justificativa                                        |
| ---------------------------- | ------------------------ | ----- | ---------------------------------------------------- |
| idx_files_cluster_id         | cluster_id               | BTREE | Listar arquivos de um cluster                        |
| idx_files_cluster_status     | (cluster_id, status)     | BTREE | Filtrar por status (galeria mostra só ready)         |
| idx_files_content_hash       | content_hash             | BTREE | Deduplicação: verificar se conteúdo já existe        |
| idx_files_uploaded_by        | uploaded_by              | BTREE | Listar arquivos de um membro específico              |
| idx_files_created_at         | created_at               | BTREE | Timeline cronológica; paginação por cursor           |
| idx_files_metadata           | metadata                 | GIN   | Busca em metadados EXIF (data, GPS, câmera) — fase 2 |
| idx_files_cluster_media_type | (cluster_id, media_type) | BTREE | Filtro por tipo (fotos, vídeos, documentos)          |
| idx_files_version_of         | version_of               | BTREE | Listar versões de um arquivo                         |

---

### previews

**Descrição:** Representações leves de arquivos para exibição no cliente. Somente visualização — não oferece download do conteúdo original.

**Campos:**

| Campo        | Tipo        | Constraint                                         | Descrição                                          |
| ------------ | ----------- | -------------------------------------------------- | -------------------------------------------------- |
| id           | UUID        | PK, DEFAULT gen_random_uuid()                      | Identificador único                                |
| file_id      | UUID        | FK → files(id) ON DELETE CASCADE, UNIQUE, NOT NULL | Arquivo ao qual pertence (1:1)                     |
| type         | VARCHAR(20) | NOT NULL                                           | thumbnail, video_preview                           |
| size         | BIGINT      | NOT NULL                                           | Tamanho em bytes                                   |
| format       | VARCHAR(10) | NOT NULL                                           | Formato: webp, mp4, png                            |
| content_hash | VARCHAR(64) | NOT NULL                                           | SHA-256 do conteúdo do preview                     |
| storage_path | TEXT        | NOT NULL                                           | Caminho ou chunk_id onde o preview está armazenado |
| created_at   | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()                            | Data de criação                                    |

**Índices:**

| Nome do Índice       | Campos  | Tipo           | Justificativa                                 |
| -------------------- | ------- | -------------- | --------------------------------------------- |
| idx_previews_file_id | file_id | BTREE (UNIQUE) | Busca do preview ao exibir arquivo na galeria |

---

### manifests

**Descrição:** Mapa de reconstituição de um arquivo — lista de chunks, file key criptografada e assinatura. Fonte de verdade para reassembly e recovery.

**Campos:**

| Campo              | Tipo        | Constraint                                         | Descrição                                           |
| ------------------ | ----------- | -------------------------------------------------- | --------------------------------------------------- |
| id                 | UUID        | PK, DEFAULT gen_random_uuid()                      | Identificador único                                 |
| file_id            | UUID        | FK → files(id) ON DELETE CASCADE, UNIQUE, NOT NULL | Arquivo que este manifest descreve (1:1)            |
| chunks_json        | JSONB       | NOT NULL                                           | Lista ordenada de {chunk_id, chunk_index, size}     |
| file_key_encrypted | BYTEA       | NOT NULL                                           | Chave do arquivo criptografada com master key       |
| signature          | BYTEA       | NOT NULL                                           | Assinatura criptográfica do manifest                |
| replicated_to      | JSONB       | NOT NULL, DEFAULT '[]'                             | Lista de node_ids onde o manifest foi replicado     |
| version            | INTEGER     | NOT NULL, DEFAULT 1                                | Versão do manifest (para versionamento de arquivos) |
| coding_scheme      | VARCHAR(20) | NOT NULL, DEFAULT 'replication'                    | Esquema de codificação: replication ou erasure      |
| data_shards        | INTEGER     | NOT NULL, DEFAULT 10                               | Número de shards de dados (erasure-coding RS)       |
| parity_shards      | INTEGER     | NOT NULL, DEFAULT 4                                | Número de shards de paridade (erasure-coding RS)    |
| created_at         | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()                            | Data de criação                                     |
| updated_at         | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()                            | Última atualização                                  |

**Índices:**

| Nome do Índice        | Campos  | Tipo           | Justificativa                                   |
| --------------------- | ------- | -------------- | ----------------------------------------------- |
| idx_manifests_file_id | file_id | BTREE (UNIQUE) | Busca do manifest ao baixar/reassemblar arquivo |

---

### chunks

**Descrição:** Blocos de dados criptografados de ~4MB. Endereçados por SHA-256 (content-addressable). Podem ser referenciados por múltiplos manifests (deduplicação cross-file).

**Campos:**

| Campo           | Tipo        | Constraint              | Descrição                                               |
| --------------- | ----------- | ----------------------- | ------------------------------------------------------- |
| id              | VARCHAR(64) | PK                      | SHA-256 do conteúdo criptografado (content-addressable) |
| size            | INTEGER     | NOT NULL                | Tamanho em bytes                                        |
| reference_count | INTEGER     | NOT NULL, DEFAULT 1     | Contador de manifests que referenciam este chunk        |
| created_at      | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data de criação                                         |

**Índices:**

| Nome do Índice             | Campos          | Tipo  | Justificativa                                                |
| -------------------------- | --------------- | ----- | ------------------------------------------------------------ |
| idx_chunks_reference_count | reference_count | BTREE | Garbage collection: encontrar chunks com reference_count = 0 |

---

### manifest_chunks

**Descrição:** Tabela de junção entre manifests e chunks. Permite deduplicação cross-file — um chunk pode ser referenciado por múltiplos manifests de arquivos diferentes.

**Campos:**

| Campo       | Tipo        | Constraint                                     | Descrição                                            |
| ----------- | ----------- | ---------------------------------------------- | ---------------------------------------------------- |
| id          | UUID        | PK, DEFAULT gen_random_uuid()                  | Identificador único                                  |
| manifest_id | UUID        | FK → manifests(id) ON DELETE CASCADE, NOT NULL | Manifest que referencia este chunk                   |
| chunk_id    | VARCHAR(64) | FK → chunks(id), NOT NULL                      | Chunk referenciado                                   |
| chunk_index | INTEGER     | NOT NULL                                       | Posição do chunk dentro do arquivo (para reassembly) |

**Índices:**

| Nome do Índice               | Campos                     | Tipo           | Justificativa                                                     |
| ---------------------------- | -------------------------- | -------------- | ----------------------------------------------------------------- |
| idx_manifest_chunks_manifest | manifest_id                | BTREE          | Listar chunks de um manifest (reassembly)                         |
| idx_manifest_chunks_chunk    | chunk_id                   | BTREE          | Encontrar todos os manifests que referenciam um chunk (dedup, GC) |
| idx_manifest_chunks_unique   | (manifest_id, chunk_index) | BTREE (UNIQUE) | Um manifest não pode ter dois chunks na mesma posição             |

---

### chunk_replicas

**Descrição:** Registro de cada cópia de um chunk armazenada em um nó. Tabela central para monitoramento de replicação, scrubbing e auto-healing.

**Campos:**

| Campo       | Tipo        | Constraint                    | Descrição                                  |
| ----------- | ----------- | ----------------------------- | ------------------------------------------ |
| id          | UUID        | PK, DEFAULT gen_random_uuid() | Identificador único                        |
| chunk_id    | VARCHAR(64) | FK → chunks(id), NOT NULL     | Chunk replicado                            |
| node_id     | UUID        | FK → nodes(id), NOT NULL      | Nó que armazena esta réplica               |
| status      | VARCHAR(20) | NOT NULL, DEFAULT 'healthy'   | healthy, corrupted, pending                |
| verified_at | TIMESTAMPTZ | NULL                          | Timestamp do último scrubbing bem-sucedido |
| created_at  | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()       | Data de criação da réplica                 |

**Índices:**

| Nome do Índice                 | Campos              | Tipo           | Justificativa                                             |
| ------------------------------ | ------------------- | -------------- | --------------------------------------------------------- |
| idx_chunk_replicas_chunk       | chunk_id            | BTREE          | Contar réplicas por chunk; verificar mínimo 3x            |
| idx_chunk_replicas_node        | node_id             | BTREE          | Listar chunks de um nó (drain, auto-healing)              |
| idx_chunk_replicas_unique      | (chunk_id, node_id) | BTREE (UNIQUE) | Evitar réplica duplicada no mesmo nó                      |
| idx_chunk_replicas_verified    | verified_at         | BTREE          | Scrubbing prioriza réplicas não verificadas (NULLS FIRST) |
| idx_chunk_replicas_node_status | (node_id, status)   | BTREE          | Auto-healing: listar réplicas saudáveis de um nó perdido  |

---

### vaults

**Descrição:** Cofre criptografado individual por membro. O vault do admin é especial — contém config do cluster, credenciais de provedores e dados necessários para recovery via seed.

**Campos:**

| Campo                | Tipo        | Constraint                                           | Descrição                                        |
| -------------------- | ----------- | ---------------------------------------------------- | ------------------------------------------------ |
| id                   | UUID        | PK, DEFAULT gen_random_uuid()                        | Identificador único                              |
| member_id            | UUID        | FK → members(id) ON DELETE CASCADE, UNIQUE, NOT NULL | Membro dono do vault (1:1)                       |
| vault_data           | BYTEA       | NOT NULL                                             | Conteúdo do cofre criptografado                  |
| encryption_algorithm | VARCHAR(30) | NOT NULL, DEFAULT 'AES-256-GCM'                      | Algoritmo de criptografia usado                  |
| replicated_to        | JSONB       | NOT NULL, DEFAULT '[]'                               | Lista de node_ids onde o vault foi replicado     |
| is_admin_vault       | BOOLEAN     | NOT NULL, DEFAULT FALSE                              | Indica vault de admin (contém config do cluster) |
| created_at           | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()                              | Data de criação                                  |
| updated_at           | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()                              | Última atualização                               |

**Índices:**

| Nome do Índice       | Campos    | Tipo           | Justificativa                       |
| -------------------- | --------- | -------------- | ----------------------------------- |
| idx_vaults_member_id | member_id | BTREE (UNIQUE) | Busca do vault ao autenticar membro |

---

### alerts

**Descrição:** Notificações de condições anômalas no cluster. Geradas pelo Scheduler e persistem até resolução.

**Campos:**

| Campo             | Tipo        | Constraint                    | Descrição                                                                                           |
| ----------------- | ----------- | ----------------------------- | --------------------------------------------------------------------------------------------------- |
| id                | UUID        | PK, DEFAULT gen_random_uuid() | Identificador único                                                                                 |
| cluster_id        | UUID        | FK → clusters(id), NOT NULL   | Cluster relacionado                                                                                 |
| type              | VARCHAR(30) | NOT NULL                      | node_offline, replication_low, token_expired, space_low, corruption_detected, auto_healing_complete |
| message           | TEXT        | NOT NULL                      | Descrição legível do problema                                                                       |
| severity          | VARCHAR(10) | NOT NULL                      | info, warning, critical                                                                             |
| resolved          | BOOLEAN     | NOT NULL, DEFAULT FALSE       | Se foi resolvido (manual ou auto)                                                                   |
| related_entity_id | UUID        | NULL                          | ID da entidade relacionada (node_id, file_id, etc.)                                                 |
| created_at        | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()       | Data de criação                                                                                     |
| resolved_at       | TIMESTAMPTZ | NULL                          | Data de resolução                                                                                   |

**Índices:**

| Nome do Índice              | Campos                 | Tipo  | Justificativa                                  |
| --------------------------- | ---------------------- | ----- | ---------------------------------------------- |
| idx_alerts_cluster_resolved | (cluster_id, resolved) | BTREE | Dashboard: listar alertas ativos de um cluster |
| idx_alerts_cluster_severity | (cluster_id, severity) | BTREE | Filtrar alertas por severidade                 |
| idx_alerts_created_at       | created_at             | BTREE | Histórico cronológico de alertas               |

---

### invites

**Descrição:** Convites para ingresso de novos membros no cluster. Token assinado com expiração e uso único.

**Campos:**

| Campo       | Tipo         | Constraint                    | Descrição                                        |
| ----------- | ------------ | ----------------------------- | ------------------------------------------------ |
| id          | UUID         | PK, DEFAULT gen_random_uuid() | Identificador único                              |
| cluster_id  | UUID         | FK → clusters(id), NOT NULL   | Cluster alvo                                     |
| email       | VARCHAR(255) | NOT NULL                      | Email do convidado                               |
| role        | VARCHAR(20)  | NOT NULL, DEFAULT 'member'    | Role atribuída ao aceitar: admin, member, reader |
| token       | VARCHAR(500) | UNIQUE, NOT NULL              | Token assinado com chave privada do cluster      |
| expires_at  | TIMESTAMPTZ  | NOT NULL                      | Data de expiração do convite                     |
| created_by  | UUID         | FK → members(id), NOT NULL    | Admin que criou o convite                        |
| accepted_at | TIMESTAMPTZ  | NULL                          | Data de aceite; null se pendente                 |
| created_at  | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()       | Data de criação                                  |

**Índices:**

| Nome do Índice            | Campos              | Tipo           | Justificativa                         |
| ------------------------- | ------------------- | -------------- | ------------------------------------- |
| idx_invites_token         | token               | BTREE (UNIQUE) | Validação do token ao aceitar convite |
| idx_invites_cluster_email | (cluster_id, email) | BTREE          | Verificar se email já foi convidado   |
| idx_invites_expires_at    | expires_at          | BTREE          | Cleanup de convites expirados         |

<!-- APPEND:tables -->

---

## Diagrama ER

> Atualize o diagrama abaixo conforme as tabelas e relacionamentos definidos acima.

> 📐 Diagrama: [er-diagram.mmd](../diagrams/domain/er-diagram.mmd)

---

## Estratégia de Migração

> Como as mudanças no schema serão gerenciadas ao longo do tempo? Existe risco de downtime durante migrações?

- **Ferramenta:** prisma cli (`prisma migrate deploy`) — integrado ao ecossistema TypeScript/Prisma; migrações gerenciadas com verificação type-safe
- **Convenção de nomes:** `YYYYMMDDHHMMSS_descricao_em_snake_case.sql` (ex.: `20260315120000_create_clusters_table.sql`)
- **Diretório:** `migrations/` na raiz do projeto
- **Estratégia de rollback:** Cada migração "up" tem um arquivo "down" correspondente (`*.down.sql`); rollback via `prisma migrate reset`
- **Migrações destrutivas:** Colunas a remover são primeiro marcadas como deprecated (nullable + sem uso no código) por 1 release antes da remoção efetiva. ALTER DROP COLUMN nunca em produção sem verificação de que nenhum código referencia a coluna
- **Zero-downtime:** Migrações não-destrutivas (ADD COLUMN, CREATE INDEX CONCURRENTLY) são aplicadas sem interrupção. Migrações destrutivas exigem janela de manutenção

### Ordem de criação das tabelas

```
1. clusters          — tabela raiz, sem dependências
2. members           — FK → clusters
3. vaults            — FK → members
4. nodes             — FK → clusters, members
5. files             — FK → clusters, members
6. previews          — FK → files
7. manifests         — FK → files
8. chunks            — sem FK (PK = SHA-256)
9. manifest_chunks   — FK → manifests, chunks
10. chunk_replicas   — FK → chunks, nodes
11. alerts           — FK → clusters
12. invites          — FK → clusters, members
```

---

## Índices e Otimizações

> Quais queries são críticas para performance? Quais padrões de acesso devem guiar a criação de índices?

### Queries Críticas

| Descrição da Query                                    | Tabelas Envolvidas         | Frequência                                 | SLA Esperado |
| ----------------------------------------------------- | -------------------------- | ------------------------------------------ | ------------ |
| Listar arquivos do cluster com status ready (galeria) | files                      | Alta — toda vez que membro abre a galeria  | < 100ms      |
| Buscar arquivo por content_hash (deduplicação)        | files                      | Alta — todo upload                         | < 50ms       |
| Contar réplicas por chunk (verificar fator 3x)        | chunk_replicas             | Alta — distribuição e auto-healing         | < 50ms       |
| Listar chunks de um nó (drain/auto-healing)           | chunk_replicas             | Média — quando nó é removido ou perdido    | < 200ms      |
| Buscar nós com heartbeat atrasado (detecção suspect)  | nodes                      | Média — scheduler a cada 5 minutos         | < 100ms      |
| Buscar réplicas não verificadas (scrubbing)           | chunk_replicas             | Média — scheduler periódico                | < 200ms      |
| Listar alertas ativos do cluster (dashboard)          | alerts                     | Média — refresh do dashboard               | < 100ms      |
| Reassemblar arquivo via manifest + chunks             | manifests, manifest_chunks | Média — download de arquivo                | < 100ms      |
| Buscar membro por email no cluster (login)            | members                    | Alta — autenticação                        | < 50ms       |
| Validar token de convite (aceite)                     | invites                    | Baixa — aceite de convite                  | < 50ms       |
| Buscar arquivos por metadata EXIF (busca avançada)    | files (metadata JSONB)     | Baixa (fase 2) — busca por data/GPS/câmera | < 500ms      |
| Contar nós ativos por cluster (validação mínimo 1)    | nodes                      | Alta — todo upload                         | < 50ms       |

<!-- APPEND:critical-queries -->

### Diretrizes de Otimização

- **Paginação por cursor** em todas as listagens com volume (files, alerts, chunk_replicas) — usar `created_at` ou `id` como cursor, nunca OFFSET
- **SELECT apenas campos necessários** — evitar SELECT \* especialmente em `files` (JSONB metadata pode ser grande) e `vaults` (BYTEA vault_data)
- **JSONB parcial** — usar operadores `->`, `->>` e `@>` para consultar metadata sem desserializar o JSON inteiro
- **CREATE INDEX CONCURRENTLY** — todos os índices criados sem bloquear escritas (PostgreSQL suporta nativamente)
- **Contadores materializados** — `reference_count` em chunks e `used_capacity` em nodes são atualizados via triggers ou na aplicação para evitar COUNT(\*) em queries frequentes
- **Connection pooling** — Prisma com pool de 10-20 conexões; max 500 conexões no PostgreSQL conforme RNF de escalabilidade
- **Particionamento futuro** — se `chunk_replicas` ultrapassar 10M de registros, considerar particionamento por `chunk_id` (hash range)
- **Vacuum e autovacuum** — configurar autovacuum agressivo para `chunk_replicas` e `files` (tabelas com maior volume de updates)

---

## Volumes Estimados

> Estimativas baseadas nos requisitos de escalabilidade (10 usuários, 50 nós, 100TB).

| Tabela          | Volume Estimado (5 anos) | Taxa de Crescimento | Observação                                        |
| --------------- | ------------------------ | ------------------- | ------------------------------------------------- |
| clusters        | 1                        | Estática            | Um cluster por família                            |
| members         | ~10                      | Estática            | Máximo 10 por cluster                             |
| nodes           | ~50                      | Lenta (~2/ano)      | Máximo 50 por cluster                             |
| files           | ~500K                    | ~100K/ano           | Assumindo ~300 fotos/mês + vídeos + docs          |
| previews        | ~500K                    | ~100K/ano           | 1:1 com files                                     |
| manifests       | ~500K                    | ~100K/ano           | 1:1 com files                                     |
| chunks          | ~5M                      | ~1M/ano             | ~10 chunks/arquivo médio (com dedup ~30% redução) |
| manifest_chunks | ~5M                      | ~1M/ano             | 1:1 com chunks (sem dedup); N:M com dedup         |
| chunk_replicas  | ~15M                     | ~3M/ano             | 3 réplicas por chunk                              |
| vaults          | ~10                      | Estática            | 1:1 com members                                   |
| alerts          | ~10K                     | ~2K/ano             | Com cleanup de resolvidos após 90 dias            |
| invites         | ~50                      | Estática            | Poucos convites ao longo do tempo                 |

---

## Referências

- [PostgreSQL 18 Documentation](https://www.postgresql.org/docs/)
- [Prisma — TypeScript ORM](https://www.prisma.io/docs)
- [Modelo de Domínio](./04-domain-model.md) — entidades conceituais e regras de negócio
- [Decisões Arquiteturais — ADR-004](./10-architecture_decisions.md) — escolha do PostgreSQL
- [Requisitos Não Funcionais](./03-requirements.md) — SLAs de performance e escalabilidade
