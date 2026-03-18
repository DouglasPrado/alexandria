-- Cofre criptografado individual por membro (1:1).
-- Conteudo e blob AES-256-GCM; estrutura interna so acessivel apos desbloqueio.
CREATE TABLE vaults (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id             UUID NOT NULL UNIQUE REFERENCES members(id) ON DELETE CASCADE,
    vault_data            BYTEA NOT NULL,                   -- Conteudo criptografado
    encryption_algorithm  VARCHAR(20) NOT NULL DEFAULT 'AES-256-GCM',
    version               INTEGER NOT NULL DEFAULT 1,       -- Versao do formato interno
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
