-- Indice para busca textual por nome de arquivo (UC-010).
-- pg_trgm permite busca por similaridade (ILIKE %termo%).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX files_name_trgm_idx ON files USING gin (original_name gin_trgm_ops);

-- Indice para busca por range de datas
CREATE INDEX files_cluster_created_desc_idx ON files (cluster_id, created_at DESC)
    WHERE status = 'ready';

-- Tabela manifest_chunks (referenciada pelo GC e dedup, criada aqui se nao existir)
CREATE TABLE IF NOT EXISTS manifest_chunks (
    manifest_id UUID NOT NULL REFERENCES manifests(id) ON DELETE CASCADE,
    chunk_id VARCHAR(64) NOT NULL REFERENCES chunks(id) ON DELETE CASCADE,
    PRIMARY KEY (manifest_id, chunk_id)
);
