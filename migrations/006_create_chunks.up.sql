-- Blocos criptografados de ~4MB. ID = SHA-256 (content-addressable).
CREATE TABLE chunks (
    id            VARCHAR(64) PRIMARY KEY,         -- SHA-256 do conteudo criptografado
    file_id       UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    chunk_index   INTEGER NOT NULL,                -- Posicao no arquivo (0-based)
    size          INTEGER NOT NULL,                -- Bytes
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX chunks_file_index_idx ON chunks (file_id, chunk_index);
CREATE INDEX chunks_file_id_idx ON chunks (file_id);
