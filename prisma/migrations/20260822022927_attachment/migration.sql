/*
  Warnings:

  - You are about to drop the column `uploadedById` on the `attachments` table. All the data in the column will be lost.
  - Added the required column `ownerUserEmail` to the `attachments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerUserId` to the `attachments` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "attachments" DROP CONSTRAINT "attachments_uploadedById_fkey";

-- AlterTable
ALTER TABLE "attachments" DROP COLUMN "uploadedById",
ADD COLUMN     "ownerUserEmail" TEXT NOT NULL,
ADD COLUMN     "ownerUserId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
