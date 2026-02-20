-- Split user cursor state into Hifz and Qur'an lanes, and persist open Hifz session plan snapshots.

-- AlterTable
ALTER TABLE "UserProfile"
  ADD COLUMN "quranActiveSurahNumber" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "quranCursorAyahId" INTEGER NOT NULL DEFAULT 1;

-- Backfill existing users so Qur'an cursor starts from the previous shared cursor.
UPDATE "UserProfile"
SET
  "quranActiveSurahNumber" = "activeSurahNumber",
  "quranCursorAyahId" = "cursorAyahId";

-- AlterTable
ALTER TABLE "Session"
  ADD COLUMN "planJson" JSONB;
