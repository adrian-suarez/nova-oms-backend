/*
  Warnings:

  - Added the required column `correlationId` to the `audits` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "audits" ADD COLUMN     "correlationId" TEXT NOT NULL;
