-- Versionamento de arquivos — re-upload cria nova versao, chunks compartilhados via dedup.
-- parent_id aponta para versao anterior (linked list de versoes).
-- version incrementa automaticamente.

ALTER TABLE files ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE files ADD COLUMN parent_id UUID NULL REFERENCES files(id) ON DELETE SET NULL;

-- Indice para buscar versoes de um arquivo
CREATE INDEX files_parent_id_idx ON files (parent_id) WHERE parent_id IS NOT NULL;
