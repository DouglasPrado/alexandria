# Data Layer

Define os repositories, schema do ORM, estrategia de migrations, indices criticos e queries de alta performance.

<!-- do blueprint: 05-data-model.md -->

---

## Estrategia de Persistencia

> Quais tecnologias de armazenamento sao usadas e para que?

| Tecnologia                       | Funcao                | Dados                                                                                                 | Justificativa                                         |
| -------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| PostgreSQL 18                    | Dados transacionais   | clusters, members, nodes, files, previews, manifests, chunks, chunk_replicas, vaults, alerts, invites | ACID, JSONB para metadata EXIF, indices GIN (ADR-004) |
| Redis 7                          | Filas e cache         | Jobs BullMQ (pipeline midia), pub/sub (eventos internos), cache JWT                                   | Latencia sub-ms; sem dados persistentes de negocio    |
| lru-cache                        | Cache in-memory       | metadata galeria, ConsistentHashRing, status de nos                                                   | Hot data sem round-trip ao Redis                      |
| StorageProvider (S3/R2/B2/local) | Chunks criptografados | Blocos AES-256-GCM de ~4MB                                                                            | Interface unificada; durabilidade nos provedores      |

<!-- APPEND:persistencia -->

---

## Repositories

> Para cada entidade, metodos de acesso a dados via Prisma.

### ClusterRepository

**Responsabilidade:** CRUD de clusters; busca por cluster_id criptografico.

**Interface:**

| Metodo                     | Parametros        | Retorno         | Query Principal                          |
| -------------------------- | ----------------- | --------------- | ---------------------------------------- |
| create(data)               | CreateClusterData | Cluster         | INSERT INTO clusters                     |
| findById(id)               | UUID              | Cluster \| null | SELECT ... WHERE id = $1                 |
| findByClusterId(clusterId) | string            | Cluster \| null | SELECT ... WHERE cluster_id = $1         |
| updateStatus(id, status)   | UUID, string      | Cluster         | UPDATE ... SET status = $1 WHERE id = $2 |

### MemberRepository

**Responsabilidade:** CRUD de membros; busca por email dentro do cluster.

**Interface:**

| Metodo                                  | Parametros       | Retorno        | Query Principal                                           |
| --------------------------------------- | ---------------- | -------------- | --------------------------------------------------------- |
| create(data)                            | CreateMemberData | Member         | INSERT INTO members                                       |
| findById(id)                            | UUID             | Member \| null | SELECT ... WHERE id = $1                                  |
| findByClusterAndEmail(clusterId, email) | UUID, string     | Member \| null | SELECT ... WHERE cluster_id = $1 AND email = $2           |
| listByCluster(clusterId)                | UUID             | Member[]       | SELECT ... WHERE cluster_id = $1                          |
| countAdmins(clusterId)                  | UUID             | number         | SELECT COUNT(\*) WHERE cluster_id = $1 AND role = 'admin' |

### NodeRepository

**Responsabilidade:** CRUD de nos; queries de heartbeat e status.

**Interface:**

| Metodo                   | Parametros     | Retorno      | Query Principal                                                                    |
| ------------------------ | -------------- | ------------ | ---------------------------------------------------------------------------------- |
| create(data)             | CreateNodeData | Node         | INSERT INTO nodes                                                                  |
| findById(id)             | UUID           | Node \| null | SELECT ... WHERE id = $1                                                           |
| listByCluster(clusterId) | UUID           | Node[]       | SELECT ... WHERE cluster_id = $1                                                   |
| listOnline(clusterId)    | UUID           | Node[]       | SELECT ... WHERE cluster_id = $1 AND status = 'online'                             |
| countOnline(clusterId)   | UUID           | number       | SELECT COUNT(\*) WHERE cluster_id = $1 AND status = 'online'                       |
| findSuspect()            | —              | Node[]       | SELECT ... WHERE last_heartbeat < NOW() - INTERVAL '30 min' AND status = 'online'  |
| findLost()               | —              | Node[]       | SELECT ... WHERE last_heartbeat < NOW() - INTERVAL '1 hour' AND status = 'suspect' |
| updateHeartbeat(id)      | UUID           | Node         | UPDATE ... SET last_heartbeat = NOW(), status = 'online'                           |
| updateStatus(id, status) | UUID, string   | Node         | UPDATE ... SET status = $1                                                         |

### FileRepository

**Responsabilidade:** CRUD de arquivos; queries de galeria com paginacao por cursor.

**Interface:**

| Metodo                                            | Parametros                  | Retorno      | Query Principal                                                                             |
| ------------------------------------------------- | --------------------------- | ------------ | ------------------------------------------------------------------------------------------- |
| create(data)                                      | CreateFileData              | File         | INSERT INTO files                                                                           |
| findById(id)                                      | UUID                        | File \| null | SELECT ... WHERE id = $1                                                                    |
| findByContentHash(clusterId, hash)                | UUID, string                | File \| null | SELECT ... WHERE cluster_id = $1 AND content_hash = $2                                      |
| listReady(clusterId, cursor?, limit?)             | UUID, UUID?, number         | File[]       | SELECT ... WHERE cluster_id = $1 AND status = 'ready' AND id < $2 ORDER BY id DESC LIMIT $3 |
| listByMember(memberId, cursor?, limit?)           | UUID, UUID?, number         | File[]       | SELECT ... WHERE uploaded_by = $1 AND id < $2 ORDER BY id DESC LIMIT $3                     |
| listByMediaType(clusterId, type, cursor?, limit?) | UUID, string, UUID?, number | File[]       | SELECT ... WHERE cluster_id = $1 AND media_type = $2 AND id < $3 ORDER BY id DESC LIMIT $4  |
| updateStatus(id, status, errorMessage?)           | UUID, string, string?       | File         | UPDATE ... SET status = $1, error_message = $2                                              |

### ChunkRepository

**Responsabilidade:** CRUD de chunks; deduplicacao por hash; GC de orfaos.

**Interface:**

| Metodo           | Parametros       | Retorno       | Query Principal                                      |
| ---------------- | ---------------- | ------------- | ---------------------------------------------------- |
| findById(id)     | string (SHA-256) | Chunk \| null | SELECT ... WHERE id = $1                             |
| create(data)     | CreateChunkData  | Chunk         | INSERT INTO chunks                                   |
| incrementRef(id) | string           | Chunk         | UPDATE ... SET reference_count = reference_count + 1 |
| decrementRef(id) | string           | Chunk         | UPDATE ... SET reference_count = reference_count - 1 |
| findOrphans()    | —                | Chunk[]       | SELECT ... WHERE reference_count = 0                 |
| deleteOrphans()  | —                | number        | DELETE FROM chunks WHERE reference_count = 0         |

### ChunkReplicaRepository

**Responsabilidade:** Gestao de replicas; queries para scrubbing e auto-healing.

**Interface:**

| Metodo                         | Parametros        | Retorno             | Query Principal                                                                                               |
| ------------------------------ | ----------------- | ------------------- | ------------------------------------------------------------------------------------------------------------- |
| create(data)                   | CreateReplicaData | ChunkReplica        | INSERT INTO chunk_replicas                                                                                    |
| countByChunk(chunkId)          | string            | number              | SELECT COUNT(\*) WHERE chunk_id = $1 AND status = 'healthy'                                                   |
| listByNode(nodeId)             | UUID              | ChunkReplica[]      | SELECT ... WHERE node_id = $1                                                                                 |
| listByChunk(chunkId)           | string            | ChunkReplica[]      | SELECT ... WHERE chunk_id = $1                                                                                |
| findSubReplicated(minReplicas) | number            | {chunk_id, count}[] | SELECT chunk_id, COUNT(_) FROM chunk_replicas WHERE status = 'healthy' GROUP BY chunk_id HAVING COUNT(_) < $1 |
| findUnverified(limit)          | number            | ChunkReplica[]      | SELECT ... ORDER BY verified_at ASC NULLS FIRST LIMIT $1                                                      |
| updateVerified(id)             | UUID              | ChunkReplica        | UPDATE ... SET verified_at = NOW()                                                                            |
| updateStatus(id, status)       | UUID, string      | ChunkReplica        | UPDATE ... SET status = $1                                                                                    |
| deleteByNode(nodeId)           | UUID              | number              | DELETE FROM chunk_replicas WHERE node_id = $1                                                                 |

### ManifestRepository

**Responsabilidade:** CRUD de manifests; busca para reassembly e recovery.

**Interface:**

| Metodo               | Parametros           | Retorno          | Query Principal                                  |
| -------------------- | -------------------- | ---------------- | ------------------------------------------------ |
| create(data)         | CreateManifestData   | Manifest         | INSERT INTO manifests                            |
| findByFileId(fileId) | UUID                 | Manifest \| null | SELECT ... WHERE file_id = $1                    |
| bulkCreate(data)     | CreateManifestData[] | number           | INSERT INTO manifests ... (recovery bulk insert) |

### VaultRepository

**Responsabilidade:** CRUD de vaults criptografados por membro.

**Interface:**

| Metodo                 | Parametros            | Retorno       | Query Principal                                     |
| ---------------------- | --------------------- | ------------- | --------------------------------------------------- |
| create(data)           | CreateVaultData       | Vault         | INSERT INTO vaults                                  |
| findByMember(memberId) | UUID                  | Vault \| null | SELECT ... WHERE member_id = $1                     |
| update(memberId, data) | UUID, UpdateVaultData | Vault         | UPDATE ... SET vault_data = $1 WHERE member_id = $2 |

### AlertRepository

**Responsabilidade:** CRUD de alertas; queries para dashboard.

**Interface:**

| Metodo                              | Parametros      | Retorno | Query Principal                                                                |
| ----------------------------------- | --------------- | ------- | ------------------------------------------------------------------------------ |
| create(data)                        | CreateAlertData | Alert   | INSERT INTO alerts                                                             |
| listActive(clusterId)               | UUID            | Alert[] | SELECT ... WHERE cluster_id = $1 AND resolved = false ORDER BY created_at DESC |
| listBySeverity(clusterId, severity) | UUID, string    | Alert[] | SELECT ... WHERE cluster_id = $1 AND severity = $1                             |
| resolve(id)                         | UUID            | Alert   | UPDATE ... SET resolved = true, resolved_at = NOW()                            |

### InviteRepository

**Responsabilidade:** CRUD de convites; validacao de tokens.

**Interface:**

| Metodo                                  | Parametros       | Retorno        | Query Principal                                                            |
| --------------------------------------- | ---------------- | -------------- | -------------------------------------------------------------------------- |
| create(data)                            | CreateInviteData | Invite         | INSERT INTO invites                                                        |
| findByToken(token)                      | string           | Invite \| null | SELECT ... WHERE token = $1 AND accepted_at IS NULL AND expires_at > NOW() |
| findByClusterAndEmail(clusterId, email) | UUID, string     | Invite \| null | SELECT ... WHERE cluster_id = $1 AND email = $2                            |
| accept(id)                              | UUID             | Invite         | UPDATE ... SET accepted_at = NOW()                                         |
| deleteExpired()                         | —                | number         | DELETE FROM invites WHERE expires_at < NOW() AND accepted_at IS NULL       |

<!-- APPEND:repositories -->

---

## Schema do ORM

> Schema Prisma que mapeia as 12 tabelas do blueprint 05-data-model.md.

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Cluster {
  id                   String   @id @default(uuid()) @db.Uuid
  clusterId            String   @unique @map("cluster_id") @db.VarChar(64)
  name                 String   @db.VarChar(100)
  publicKey            Bytes    @map("public_key")
  encryptedPrivateKey  Bytes    @map("encrypted_private_key")
  status               String   @default("active") @db.VarChar(20)
  createdAt            DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt            DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz

  members Member[]
  nodes   Node[]
  files   File[]
  alerts  Alert[]
  invites Invite[]

  @@map("clusters")
}

model Member {
  id           String   @id @default(uuid()) @db.Uuid
  clusterId    String   @map("cluster_id") @db.Uuid
  name         String   @db.VarChar(100)
  email        String   @db.VarChar(255)
  passwordHash String   @map("password_hash") @db.VarChar(255)
  role         String   @default("member") @db.VarChar(20)
  invitedBy    String?  @map("invited_by") @db.Uuid
  joinedAt     DateTime @default(now()) @map("joined_at") @db.Timestamptz
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt    DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz

  cluster    Cluster  @relation(fields: [clusterId], references: [id])
  inviter    Member?  @relation("MemberInvites", fields: [invitedBy], references: [id])
  invitees   Member[] @relation("MemberInvites")
  nodes      Node[]
  files      File[]
  vault      Vault?
  invites    Invite[]

  @@unique([clusterId, email])
  @@index([clusterId])
  @@map("members")
}

model Node {
  id              String    @id @default(uuid()) @db.Uuid
  clusterId       String    @map("cluster_id") @db.Uuid
  ownerId         String    @map("owner_id") @db.Uuid
  type            String    @db.VarChar(20)
  name            String    @db.VarChar(100)
  totalCapacity   BigInt    @default(0) @map("total_capacity")
  usedCapacity    BigInt    @default(0) @map("used_capacity")
  status          String    @default("online") @db.VarChar(20)
  endpoint        String    @db.Text
  configEncrypted Bytes     @map("config_encrypted")
  lastHeartbeat   DateTime? @map("last_heartbeat") @db.Timestamptz
  tier            String?   @default("warm") @db.VarChar(10)
  createdAt       DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime  @default(now()) @updatedAt @map("updated_at") @db.Timestamptz

  cluster       Cluster        @relation(fields: [clusterId], references: [id])
  owner         Member         @relation(fields: [ownerId], references: [id])
  chunkReplicas ChunkReplica[]

  @@index([clusterId])
  @@index([status])
  @@index([lastHeartbeat])
  @@index([clusterId, status])
  @@map("nodes")
}

model File {
  id            String   @id @default(uuid()) @db.Uuid
  clusterId     String   @map("cluster_id") @db.Uuid
  uploadedBy    String   @map("uploaded_by") @db.Uuid
  originalName  String   @map("original_name") @db.VarChar(500)
  mediaType     String   @map("media_type") @db.VarChar(20)
  mimeType      String   @map("mime_type") @db.VarChar(100)
  originalSize  BigInt   @map("original_size")
  optimizedSize BigInt?  @map("optimized_size")
  contentHash   String?  @map("content_hash") @db.VarChar(64)
  metadata      Json?
  status        String   @default("processing") @db.VarChar(20)
  errorMessage  String?  @map("error_message") @db.Text
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz

  cluster  Cluster  @relation(fields: [clusterId], references: [id])
  uploader Member   @relation(fields: [uploadedBy], references: [id])
  preview  Preview?
  manifest Manifest?

  @@index([clusterId])
  @@index([clusterId, status])
  @@index([contentHash])
  @@index([uploadedBy])
  @@index([createdAt])
  @@index([clusterId, mediaType])
  @@map("files")
}

model Preview {
  id          String   @id @default(uuid()) @db.Uuid
  fileId      String   @unique @map("file_id") @db.Uuid
  type        String   @db.VarChar(20)
  size        BigInt
  format      String   @db.VarChar(10)
  contentHash String   @map("content_hash") @db.VarChar(64)
  storagePath String   @map("storage_path") @db.Text
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz

  file File @relation(fields: [fileId], references: [id], onDelete: Cascade)

  @@map("previews")
}

model Manifest {
  id               String   @id @default(uuid()) @db.Uuid
  fileId           String   @unique @map("file_id") @db.Uuid
  chunksJson       Json     @map("chunks_json")
  fileKeyEncrypted Bytes    @map("file_key_encrypted")
  signature        Bytes
  replicatedTo     Json     @default("[]") @map("replicated_to")
  version          Int      @default(1)
  createdAt        DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt        DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz

  file          File           @relation(fields: [fileId], references: [id], onDelete: Cascade)
  manifestChunks ManifestChunk[]

  @@map("manifests")
}

model Chunk {
  id             String   @id @db.VarChar(64) // SHA-256 content-addressable
  size           Int
  referenceCount Int      @default(1) @map("reference_count")
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz

  manifestChunks ManifestChunk[]
  replicas       ChunkReplica[]

  @@index([referenceCount])
  @@map("chunks")
}

model ManifestChunk {
  id         String @id @default(uuid()) @db.Uuid
  manifestId String @map("manifest_id") @db.Uuid
  chunkId    String @map("chunk_id") @db.VarChar(64)
  chunkIndex Int    @map("chunk_index")

  manifest Manifest @relation(fields: [manifestId], references: [id], onDelete: Cascade)
  chunk    Chunk    @relation(fields: [chunkId], references: [id])

  @@unique([manifestId, chunkIndex])
  @@index([manifestId])
  @@index([chunkId])
  @@map("manifest_chunks")
}

model ChunkReplica {
  id         String    @id @default(uuid()) @db.Uuid
  chunkId    String    @map("chunk_id") @db.VarChar(64)
  nodeId     String    @map("node_id") @db.Uuid
  status     String    @default("healthy") @db.VarChar(20)
  verifiedAt DateTime? @map("verified_at") @db.Timestamptz
  createdAt  DateTime  @default(now()) @map("created_at") @db.Timestamptz

  chunk Chunk @relation(fields: [chunkId], references: [id])
  node  Node  @relation(fields: [nodeId], references: [id])

  @@unique([chunkId, nodeId])
  @@index([chunkId])
  @@index([nodeId])
  @@index([verifiedAt])
  @@index([nodeId, status])
  @@map("chunk_replicas")
}

model Vault {
  id                  String   @id @default(uuid()) @db.Uuid
  memberId            String   @unique @map("member_id") @db.Uuid
  vaultData           Bytes    @map("vault_data")
  encryptionAlgorithm String   @default("AES-256-GCM") @map("encryption_algorithm") @db.VarChar(30)
  replicatedTo        Json     @default("[]") @map("replicated_to")
  isAdminVault        Boolean  @default(false) @map("is_admin_vault")
  createdAt           DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt           DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz

  member Member @relation(fields: [memberId], references: [id], onDelete: Cascade)

  @@map("vaults")
}

model Alert {
  id              String    @id @default(uuid()) @db.Uuid
  clusterId       String    @map("cluster_id") @db.Uuid
  type            String    @db.VarChar(30)
  message         String    @db.Text
  severity        String    @db.VarChar(10)
  resolved        Boolean   @default(false)
  relatedEntityId String?   @map("related_entity_id") @db.Uuid
  createdAt       DateTime  @default(now()) @map("created_at") @db.Timestamptz
  resolvedAt      DateTime? @map("resolved_at") @db.Timestamptz

  cluster Cluster @relation(fields: [clusterId], references: [id])

  @@index([clusterId, resolved])
  @@index([clusterId, severity])
  @@index([createdAt])
  @@map("alerts")
}

model Invite {
  id         String    @id @default(uuid()) @db.Uuid
  clusterId  String    @map("cluster_id") @db.Uuid
  email      String    @db.VarChar(255)
  role       String    @default("member") @db.VarChar(20)
  token      String    @unique @db.VarChar(500)
  expiresAt  DateTime  @map("expires_at") @db.Timestamptz
  createdBy  String    @map("created_by") @db.Uuid
  acceptedAt DateTime? @map("accepted_at") @db.Timestamptz
  createdAt  DateTime  @default(now()) @map("created_at") @db.Timestamptz

  cluster Cluster @relation(fields: [clusterId], references: [id])
  creator Member  @relation(fields: [createdBy], references: [id])

  @@index([clusterId, email])
  @@index([expiresAt])
  @@map("invites")
}
```

<!-- APPEND:schema -->

---

## Estrategia de Migrations

> Como as alteracoes de schema sao gerenciadas?

<!-- do blueprint: 05-data-model.md (estrategia de migracao) -->

| Aspecto            | Decisao                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------- |
| Ferramenta         | Prisma Migrate (`prisma migrate deploy`)                                                      |
| Convencao de nomes | `YYYYMMDDHHMMSS_descricao_em_snake_case` (ex: `20260315120000_create_clusters_table`)         |
| Rollback           | Cada migration "up" tem "down" correspondente; rollback via `prisma migrate reset`            |
| Ambientes          | Dev: `prisma migrate dev` (auto-apply); Prod: `prisma migrate deploy` (CI)                    |
| Dados de seed      | Apenas em dev (`prisma db seed`); nunca em prod                                               |
| Zero-downtime      | ADD COLUMN + CREATE INDEX CONCURRENTLY sem interrupcao; DROP COLUMN apos 1 release deprecated |

---

## Queries Criticas

> Queries com alta frequencia ou exigencia de performance.

<!-- do blueprint: 05-data-model.md (queries criticas) -->

| Descricao                                   | Tabelas                    | Frequencia                         | SLA (p95) | Otimizacao                                |
| ------------------------------------------- | -------------------------- | ---------------------------------- | --------- | ----------------------------------------- |
| Listar arquivos ready do cluster (galeria)  | files                      | Alta — toda abertura de galeria    | < 100ms   | idx_files_cluster_status + cursor por id  |
| Buscar arquivo por content_hash (dedup)     | files                      | Alta — todo upload                 | < 50ms    | idx_files_content_hash (BTREE)            |
| Contar replicas por chunk (fator 3x)        | chunk_replicas             | Alta — distribuicao e auto-healing | < 50ms    | idx_chunk_replicas_chunk + COUNT          |
| Listar chunks de um no (drain/healing)      | chunk_replicas             | Media — no removido/perdido        | < 200ms   | idx_chunk_replicas_node                   |
| Buscar nos com heartbeat atrasado           | nodes                      | Media — scheduler cada 5min        | < 100ms   | idx_nodes_last_heartbeat                  |
| Buscar replicas nao verificadas (scrubbing) | chunk_replicas             | Media — scheduler periodico        | < 200ms   | idx_chunk_replicas_verified (NULLS FIRST) |
| Listar alertas ativos (dashboard)           | alerts                     | Media — refresh dashboard          | < 100ms   | idx_alerts_cluster_resolved               |
| Reassemblar arquivo (manifest + chunks)     | manifests, manifest_chunks | Media — download                   | < 100ms   | idx_manifests_file_id (UNIQUE)            |
| Buscar membro por email (login)             | members                    | Alta — autenticacao                | < 50ms    | idx_members_cluster_email (UNIQUE)        |
| Contar nos ativos (validacao minimo 1)      | nodes                      | Alta — todo upload                 | < 50ms    | idx_nodes_cluster_status                  |

<!-- APPEND:queries -->

---

## Consistencia e Transacoes

> Como transacoes e consistencia sao tratadas?

| Cenario                           | Tipo                      | Estrategia                                                                     |
| --------------------------------- | ------------------------- | ------------------------------------------------------------------------------ |
| Criar arquivo + chunks + replicas | Transacao local           | Prisma `$transaction([])` — atomico                                            |
| Criar cluster + admin + vault     | Transacao local           | Prisma `$transaction([])` — atomico                                            |
| Drain: migrar chunks + remover no | Transacao local por batch | Prisma `$transaction` por batch de chunks                                      |
| Pipeline midia → atualizar status | Eventual                  | Worker atualiza status apos processamento; se falhar, status fica "processing" |
| Cache (lru-cache) + banco         | Eventual                  | Event-driven: invalidar cache quando dados mudam via pub/sub                   |

**Idempotencia:** Chunks sao content-addressable (SHA-256 = PK). Upload do mesmo conteudo reutiliza chunks existentes. Heartbeat e idempotente (UPDATE last_heartbeat).

> (ver [05-api-contracts.md](05-api-contracts.md) para os endpoints que consomem estes dados)
