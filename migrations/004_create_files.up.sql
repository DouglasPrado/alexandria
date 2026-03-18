-- Representacao logica de fotos, videos e documentos processados pelo pipeline.
CREATE TABLE files (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_id        UUID NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
    uploaded_by       UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    original_name     VARCHAR(500) NOT NULL,
    media_type        VARCHAR(20) NOT NULL CHECK (media_type IN ('foto', 'video', 'documento')),
    mime_type         VARCHAR(127) NOT NULL,
    file_extension    VARCHAR(20) NOT NULL,                   -- Sem ponto (ex: pdf, jpg)
    original_size     BIGINT NOT NULL,                        -- Bytes antes de otimizacao
    optimized_size    BIGINT NOT NULL,                        -- Bytes apos pipeline
    content_hash      VARCHAR(64) NOT NULL,                   -- SHA-256 do conteudo otimizado
    metadata          JSONB,                                  -- EXIF e metadados extraidos
    preview_chunk_id  VARCHAR(64),                            -- Chunk ID do preview/thumbnail
    status            VARCHAR(20) NOT NULL DEFAULT 'processing'
                      CHECK (status IN ('processing', 'ready', 'error')),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX files_cluster_created_idx ON files (cluster_id, created_at DESC);
CREATE INDEX files_content_hash_idx ON files (content_hash);
CREATE INDEX files_cluster_status_idx ON files (cluster_id, status);
CREATE INDEX files_uploaded_by_idx ON files (uploaded_by);
CREATE INDEX files_cluster_media_type_idx ON files (cluster_id, media_type);
