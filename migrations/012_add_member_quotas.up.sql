-- Quotas de armazenamento por membro.
-- storage_quota: limite em bytes (default 10 GB).
-- storage_used: uso atual em bytes (atualizado a cada upload).

ALTER TABLE members ADD COLUMN storage_quota BIGINT NOT NULL DEFAULT 10737418240;
ALTER TABLE members ADD COLUMN storage_used BIGINT NOT NULL DEFAULT 0;
