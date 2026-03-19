DROP INDEX IF EXISTS nodes_tier_idx;
DROP INDEX IF EXISTS files_last_accessed_idx;
ALTER TABLE files DROP COLUMN IF EXISTS last_accessed_at;
ALTER TABLE nodes DROP COLUMN IF EXISTS tier;
