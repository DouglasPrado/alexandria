-- Dispositivos e servicos cloud que armazenam chunks criptografados.
CREATE TABLE nodes (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_id        UUID NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
    owner_id          UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    type              VARCHAR(20) NOT NULL CHECK (type IN ('local', 's3', 'r2', 'vps')),
    name              VARCHAR(255) NOT NULL,
    total_capacity    BIGINT NOT NULL,                        -- Bytes
    used_capacity     BIGINT NOT NULL DEFAULT 0,              -- Bytes
    status            VARCHAR(20) NOT NULL DEFAULT 'online'
                      CHECK (status IN ('online', 'suspect', 'lost', 'draining')),
    endpoint          TEXT,                                   -- URL para nos remotos
    config_encrypted  BYTEA,                                  -- Credenciais criptografadas
    last_heartbeat    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX nodes_cluster_status_idx ON nodes (cluster_id, status);
CREATE INDEX nodes_last_heartbeat_idx ON nodes (last_heartbeat);
CREATE INDEX nodes_cluster_id_idx ON nodes (cluster_id);
