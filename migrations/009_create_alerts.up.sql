-- Alertas de saude do cluster para notificacao ao admin.
CREATE TABLE alerts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_id      UUID NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
    type            VARCHAR(50) NOT NULL,            -- node_offline, low_replication, etc.
    message         TEXT NOT NULL,
    severity        VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    resolved        BOOLEAN NOT NULL DEFAULT FALSE,
    resource_type   VARCHAR(50),                     -- node, chunk, file
    resource_id     VARCHAR(64),                     -- ID do recurso afetado
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ
);

CREATE INDEX alerts_cluster_resolved_idx ON alerts (cluster_id, resolved);
CREATE INDEX alerts_resource_idx ON alerts (resource_type, resource_id);
CREATE INDEX alerts_created_idx ON alerts (created_at DESC);
