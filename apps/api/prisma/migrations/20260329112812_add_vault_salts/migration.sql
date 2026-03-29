/*
  Warnings:

  - Added the required column `master_key_salt` to the `vaults` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password_salt` to the `vaults` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "vaults" ADD COLUMN     "master_key_salt" BYTEA NOT NULL,
ADD COLUMN     "password_salt" BYTEA NOT NULL;
