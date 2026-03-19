-- Tiered storage: hot/warm/cold.
-- Nos classificados por tier; arquivos rastreiam ultimo acesso para politica de movimentacao.

ALTER TABLE nodes ADD COLUMN tier VARCHAR(10) NOT NULL DEFAULT 'hot'
    CHECK (tier IN ('hot', 'warm', 'cold'));

ALTER TABLE files ADD COLUMN last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Indice para encontrar arquivos por ultimo acesso (politica de tiering)
CREATE INDEX files_last_accessed_idx ON files (last_accessed_at)
    WHERE status = 'ready';

-- Indice para listar nos por tier
CREATE INDEX nodes_tier_idx ON nodes (cluster_id, tier);
