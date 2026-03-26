-- AlterTable
ALTER TABLE "files" ADD COLUMN     "version_number" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "version_of" UUID;

-- CreateIndex
CREATE INDEX "files_version_of_idx" ON "files"("version_of");

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_version_of_fkey" FOREIGN KEY ("version_of") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
