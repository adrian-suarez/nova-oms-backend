/*
  Warnings:

  - Added the required column `errorMessage` to the `audits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `outcome` to the `audits` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "audits" ADD COLUMN     "errorMessage" TEXT NOT NULL,
ADD COLUMN     "outcome" TEXT NOT NULL;
