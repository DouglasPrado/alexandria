-- CreateTable
CREATE TABLE "clusters" (
    "id" UUID NOT NULL,
    "cluster_id" VARCHAR(64) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "public_key" BYTEA NOT NULL,
    "encrypted_private_key" BYTEA NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clusters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" UUID NOT NULL,
    "cluster_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'member',
    "invited_by" UUID,
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nodes" (
    "id" UUID NOT NULL,
    "cluster_id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "total_capacity" BIGINT NOT NULL DEFAULT 0,
    "used_capacity" BIGINT NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'online',
    "endpoint" TEXT NOT NULL,
    "config_encrypted" BYTEA NOT NULL,
    "last_heartbeat" TIMESTAMPTZ,
    "tier" VARCHAR(10) DEFAULT 'warm',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files" (
    "id" UUID NOT NULL,
    "cluster_id" UUID NOT NULL,
    "uploaded_by" UUID NOT NULL,
    "original_name" VARCHAR(500) NOT NULL,
    "media_type" VARCHAR(20) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "original_size" BIGINT NOT NULL,
    "optimized_size" BIGINT,
    "content_hash" VARCHAR(64),
    "metadata" JSONB,
    "status" VARCHAR(20) NOT NULL DEFAULT 'processing',
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "previews" (
    "id" UUID NOT NULL,
    "file_id" UUID NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "size" BIGINT NOT NULL,
    "format" VARCHAR(10) NOT NULL,
    "content_hash" VARCHAR(64) NOT NULL,
    "storage_path" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "previews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manifests" (
    "id" UUID NOT NULL,
    "file_id" UUID NOT NULL,
    "chunks_json" JSONB NOT NULL,
    "file_key_encrypted" BYTEA NOT NULL,
    "signature" BYTEA NOT NULL,
    "replicated_to" JSONB NOT NULL DEFAULT '[]',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manifests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chunks" (
    "id" VARCHAR(64) NOT NULL,
    "size" INTEGER NOT NULL,
    "reference_count" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manifest_chunks" (
    "id" UUID NOT NULL,
    "manifest_id" UUID NOT NULL,
    "chunk_id" VARCHAR(64) NOT NULL,
    "chunk_index" INTEGER NOT NULL,

    CONSTRAINT "manifest_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chunk_replicas" (
    "id" UUID NOT NULL,
    "chunk_id" VARCHAR(64) NOT NULL,
    "node_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'healthy',
    "verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chunk_replicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vaults" (
    "id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "vault_data" BYTEA NOT NULL,
    "encryption_algorithm" VARCHAR(30) NOT NULL DEFAULT 'AES-256-GCM',
    "replicated_to" JSONB NOT NULL DEFAULT '[]',
    "is_admin_vault" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vaults_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" UUID NOT NULL,
    "cluster_id" UUID NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "message" TEXT NOT NULL,
    "severity" VARCHAR(10) NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "related_entity_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invites" (
    "id" UUID NOT NULL,
    "cluster_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'member',
    "token" VARCHAR(500) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_by" UUID NOT NULL,
    "accepted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clusters_cluster_id_key" ON "clusters"("cluster_id");

-- CreateIndex
CREATE INDEX "members_cluster_id_idx" ON "members"("cluster_id");

-- CreateIndex
CREATE UNIQUE INDEX "members_cluster_id_email_key" ON "members"("cluster_id", "email");

-- CreateIndex
CREATE INDEX "nodes_cluster_id_idx" ON "nodes"("cluster_id");

-- CreateIndex
CREATE INDEX "nodes_status_idx" ON "nodes"("status");

-- CreateIndex
CREATE INDEX "nodes_last_heartbeat_idx" ON "nodes"("last_heartbeat");

-- CreateIndex
CREATE INDEX "nodes_cluster_id_status_idx" ON "nodes"("cluster_id", "status");

-- CreateIndex
CREATE INDEX "files_cluster_id_idx" ON "files"("cluster_id");

-- CreateIndex
CREATE INDEX "files_cluster_id_status_idx" ON "files"("cluster_id", "status");

-- CreateIndex
CREATE INDEX "files_content_hash_idx" ON "files"("content_hash");

-- CreateIndex
CREATE INDEX "files_uploaded_by_idx" ON "files"("uploaded_by");

-- CreateIndex
CREATE INDEX "files_created_at_idx" ON "files"("created_at");

-- CreateIndex
CREATE INDEX "files_cluster_id_media_type_idx" ON "files"("cluster_id", "media_type");

-- CreateIndex
CREATE UNIQUE INDEX "previews_file_id_key" ON "previews"("file_id");

-- CreateIndex
CREATE UNIQUE INDEX "manifests_file_id_key" ON "manifests"("file_id");

-- CreateIndex
CREATE INDEX "chunks_reference_count_idx" ON "chunks"("reference_count");

-- CreateIndex
CREATE INDEX "manifest_chunks_manifest_id_idx" ON "manifest_chunks"("manifest_id");

-- CreateIndex
CREATE INDEX "manifest_chunks_chunk_id_idx" ON "manifest_chunks"("chunk_id");

-- CreateIndex
CREATE UNIQUE INDEX "manifest_chunks_manifest_id_chunk_index_key" ON "manifest_chunks"("manifest_id", "chunk_index");

-- CreateIndex
CREATE INDEX "chunk_replicas_chunk_id_idx" ON "chunk_replicas"("chunk_id");

-- CreateIndex
CREATE INDEX "chunk_replicas_node_id_idx" ON "chunk_replicas"("node_id");

-- CreateIndex
CREATE INDEX "chunk_replicas_verified_at_idx" ON "chunk_replicas"("verified_at");

-- CreateIndex
CREATE INDEX "chunk_replicas_node_id_status_idx" ON "chunk_replicas"("node_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "chunk_replicas_chunk_id_node_id_key" ON "chunk_replicas"("chunk_id", "node_id");

-- CreateIndex
CREATE UNIQUE INDEX "vaults_member_id_key" ON "vaults"("member_id");

-- CreateIndex
CREATE INDEX "alerts_cluster_id_resolved_idx" ON "alerts"("cluster_id", "resolved");

-- CreateIndex
CREATE INDEX "alerts_cluster_id_severity_idx" ON "alerts"("cluster_id", "severity");

-- CreateIndex
CREATE INDEX "alerts_created_at_idx" ON "alerts"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "invites_token_key" ON "invites"("token");

-- CreateIndex
CREATE INDEX "invites_cluster_id_email_idx" ON "invites"("cluster_id", "email");

-- CreateIndex
CREATE INDEX "invites_expires_at_idx" ON "invites"("expires_at");

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_cluster_id_fkey" FOREIGN KEY ("cluster_id") REFERENCES "clusters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_cluster_id_fkey" FOREIGN KEY ("cluster_id") REFERENCES "clusters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_cluster_id_fkey" FOREIGN KEY ("cluster_id") REFERENCES "clusters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "previews" ADD CONSTRAINT "previews_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifests" ADD CONSTRAINT "manifests_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifest_chunks" ADD CONSTRAINT "manifest_chunks_manifest_id_fkey" FOREIGN KEY ("manifest_id") REFERENCES "manifests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifest_chunks" ADD CONSTRAINT "manifest_chunks_chunk_id_fkey" FOREIGN KEY ("chunk_id") REFERENCES "chunks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chunk_replicas" ADD CONSTRAINT "chunk_replicas_chunk_id_fkey" FOREIGN KEY ("chunk_id") REFERENCES "chunks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chunk_replicas" ADD CONSTRAINT "chunk_replicas_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaults" ADD CONSTRAINT "vaults_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_cluster_id_fkey" FOREIGN KEY ("cluster_id") REFERENCES "clusters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_cluster_id_fkey" FOREIGN KEY ("cluster_id") REFERENCES "clusters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
