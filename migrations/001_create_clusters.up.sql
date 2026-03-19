-- Grupo familiar raiz. Armazena identidade criptografica e chaves do cluster.
CREATE TABLE clusters (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_id    VARCHAR(64) NOT NULL UNIQUE,  -- Hash da chave publica
    name          VARCHAR(255) NOT NULL,
    public_key    BYTEA NOT NULL,               -- Chave publica para verificacao
    encrypted_private_key BYTEA NOT NULL,        -- Chave privada criptografada com master key
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- UNIQUE constraint ja cria indice automaticamente
