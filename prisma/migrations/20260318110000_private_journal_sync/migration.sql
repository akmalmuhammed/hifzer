-- CreateEnum
CREATE TYPE "PrivateJournalEntryType" AS ENUM ('reflection', 'dua', 'repentance', 'gratitude', 'free');

-- CreateEnum
CREATE TYPE "PrivateJournalDuaStatus" AS ENUM ('ongoing', 'answered', 'accepted_differently');

-- CreateTable
CREATE TABLE "PrivateJournalEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientEntryId" TEXT,
    "type" "PrivateJournalEntryType" NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "linkedAyahId" INTEGER,
    "linkedSurahNumber" INTEGER,
    "linkedAyahNumber" INTEGER,
    "linkedSurahNameArabic" TEXT,
    "linkedSurahNameTransliteration" TEXT,
    "duaStatus" "PrivateJournalDuaStatus",
    "autoDeleteAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivateJournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrivateJournalEntry_userId_clientEntryId_key" ON "PrivateJournalEntry"("userId", "clientEntryId");

-- CreateIndex
CREATE INDEX "PrivateJournalEntry_userId_updatedAt_idx" ON "PrivateJournalEntry"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "PrivateJournalEntry_userId_autoDeleteAt_idx" ON "PrivateJournalEntry"("userId", "autoDeleteAt");

-- AddForeignKey
ALTER TABLE "PrivateJournalEntry" ADD CONSTRAINT "PrivateJournalEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
