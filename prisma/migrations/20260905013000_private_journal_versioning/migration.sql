-- CreateEnum
CREATE TYPE "PrivateJournalMutationType" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- AlterTable
ALTER TABLE "PrivateJournalEntry"
ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "PrivateJournalMutation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "journalEntryId" TEXT,
    "targetEntryKey" TEXT,
    "mutationType" "PrivateJournalMutationType" NOT NULL,
    "clientMutationId" TEXT NOT NULL,
    "resultVersion" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrivateJournalMutation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrivateJournalMutation_userId_clientMutationId_key"
ON "PrivateJournalMutation"("userId", "clientMutationId");

-- CreateIndex
CREATE INDEX "PrivateJournalMutation_journalEntryId_createdAt_idx"
ON "PrivateJournalMutation"("journalEntryId", "createdAt");

-- CreateIndex
CREATE INDEX "PrivateJournalMutation_userId_createdAt_idx"
ON "PrivateJournalMutation"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "PrivateJournalMutation"
ADD CONSTRAINT "PrivateJournalMutation_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateJournalMutation"
ADD CONSTRAINT "PrivateJournalMutation_journalEntryId_fkey"
FOREIGN KEY ("journalEntryId") REFERENCES "PrivateJournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Keep the browser/source identity separate from Quran Foundation's remote
-- note identity. Historical non-Quran values were stored in clientEntryId;
-- move only those values so clientEntryId remains reserved for qf-note:*.
ALTER TABLE "PrivateJournalEntry"
ADD COLUMN "originEntryId" TEXT;

UPDATE "PrivateJournalEntry"
SET
    "originEntryId" = "clientEntryId",
    "clientEntryId" = NULL
WHERE "clientEntryId" IS NOT NULL
  AND "clientEntryId" NOT LIKE 'qf-note:%';

CREATE UNIQUE INDEX "PrivateJournalEntry_userId_originEntryId_key"
ON "PrivateJournalEntry"("userId", "originEntryId");
