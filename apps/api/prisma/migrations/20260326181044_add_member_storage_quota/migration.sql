-- DropIndex
DROP INDEX "idx_files_metadata";

-- DropIndex
DROP INDEX "idx_files_original_name_trgm";

-- AlterTable
ALTER TABLE "members" ADD COLUMN     "storage_quota_bytes" BIGINT;
