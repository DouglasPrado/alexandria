-- AlterTable
ALTER TABLE "manifests" ADD COLUMN     "coding_scheme" VARCHAR(20) NOT NULL DEFAULT 'replication',
ADD COLUMN     "data_shards" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "parity_shards" INTEGER NOT NULL DEFAULT 4;
