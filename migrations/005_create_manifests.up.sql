-- Mapa que descreve completamente um arquivo: chunks, hashes, chave de criptografia.
CREATE TABLE manifests (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id             UUID NOT NULL UNIQUE REFERENCES files(id) ON DELETE CASCADE,  -- 1:1
    chunks_json         JSONB NOT NULL,               -- [{chunk_id, index, hash, size}]
    file_key_encrypted  BYTEA NOT NULL,               -- Chave criptografada com master key
    signature           BYTEA,                        -- Assinatura criptografica
    replicated_to       JSONB NOT NULL DEFAULT '[]',  -- [node_id, ...]
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
