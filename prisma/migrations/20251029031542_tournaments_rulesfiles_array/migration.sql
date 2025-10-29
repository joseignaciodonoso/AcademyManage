/*
  Warnings:

  - You are about to drop the column `rulesFileUrl` on the `tournaments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tournaments" DROP COLUMN "rulesFileUrl",
ADD COLUMN     "customType" TEXT,
ADD COLUMN     "rulesFileUrls" TEXT[];
