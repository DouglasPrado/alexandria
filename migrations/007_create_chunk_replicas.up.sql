-- Registro de qual chunk esta em qual no. Tabela N:M entre chunks e nodes.
CREATE TABLE chunk_replicas (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chunk_id      VARCHAR(64) NOT NULL REFERENCES chunks(id) ON DELETE CASCADE,
    node_id       UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    verified_at   TIMESTAMPTZ,                     -- Ultimo scrubbing bem-sucedido
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (chunk_id, node_id)                     -- Evitar replica duplicada no mesmo no
);

CREATE INDEX chunk_replicas_chunk_id_idx ON chunk_replicas (chunk_id);
CREATE INDEX chunk_replicas_node_id_idx ON chunk_replicas (node_id);
CREATE INDEX chunk_replicas_verified_idx ON chunk_replicas (verified_at);
