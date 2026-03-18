-- Pessoas autorizadas no cluster com nivel de permissao.
CREATE TABLE members (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_id    UUID NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    role          VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'membro', 'leitura')),
    invited_by    UUID REFERENCES members(id) ON DELETE SET NULL,
    joined_at     TIMESTAMPTZ NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (cluster_id, email)               -- Um email por cluster
);

CREATE INDEX members_cluster_id_idx ON members (cluster_id);
