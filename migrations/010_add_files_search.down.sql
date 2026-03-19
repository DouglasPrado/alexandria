DROP TABLE IF EXISTS manifest_chunks;
DROP INDEX IF EXISTS files_cluster_created_desc_idx;
DROP INDEX IF EXISTS files_name_trgm_idx;
DROP EXTENSION IF EXISTS pg_trgm;
