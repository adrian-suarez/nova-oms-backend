/*
  Warnings:

  - Added the required column `correlationId` to the `outbox_events` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "outbox_events" ADD COLUMN     "correlationId" TEXT NOT NULL;
