-- Migration: add search indexes
-- Fonte: docs/blueprint/05-data-model.md (idx_files_metadata GIN, idx_files_original_name)
-- UC-010: Buscar e Navegar pelo Acervo (RF-063, RF-064)

-- GIN index on metadata JSONB for EXIF/structured queries (@> operator)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_metadata
  ON files USING GIN (metadata jsonb_path_ops);

-- trigram extension for ILIKE full-text search on original_name
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_original_name_trgm
  ON files USING GIN (original_name gin_trgm_ops);
