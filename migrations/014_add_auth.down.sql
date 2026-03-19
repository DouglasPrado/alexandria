DROP TABLE IF EXISTS invites;
DROP TABLE IF EXISTS refresh_tokens;
ALTER TABLE members DROP COLUMN IF EXISTS password_hash;
