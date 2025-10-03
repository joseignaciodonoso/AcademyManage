-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TRANSFER');

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "method" "PaymentMethod";

-- CreateTable
CREATE TABLE "branch_coaches" (
    "branchId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "branch_coaches_pkey" PRIMARY KEY ("branchId","coachId")
);

-- AddForeignKey
ALTER TABLE "branch_coaches" ADD CONSTRAINT "branch_coaches_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_coaches" ADD CONSTRAINT "branch_coaches_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
