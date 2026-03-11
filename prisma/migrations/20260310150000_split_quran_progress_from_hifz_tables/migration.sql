CREATE TYPE "QuranBrowseSource" AS ENUM ('READER_VIEW', 'AUDIO_PLAY', 'BACKFILL');

CREATE TABLE "QuranBrowseEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "ayahId" INTEGER NOT NULL,
  "surahNumber" INTEGER NOT NULL,
  "localDate" TEXT NOT NULL,
  "source" "QuranBrowseSource" NOT NULL,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "QuranBrowseEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "QuranBrowseEvent_userId_localDate_ayahId_source_key"
  ON "QuranBrowseEvent"("userId", "localDate", "ayahId", "source");

CREATE INDEX "QuranBrowseEvent_userId_lastSeenAt_idx"
  ON "QuranBrowseEvent"("userId", "lastSeenAt");

CREATE INDEX "QuranBrowseEvent_userId_ayahId_lastSeenAt_idx"
  ON "QuranBrowseEvent"("userId", "ayahId", "lastSeenAt");

CREATE INDEX "QuranBrowseEvent_userId_localDate_source_idx"
  ON "QuranBrowseEvent"("userId", "localDate", "source");

ALTER TABLE "QuranBrowseEvent"
  ADD CONSTRAINT "QuranBrowseEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "QuranBrowseEvent" (
  "id",
  "userId",
  "ayahId",
  "surahNumber",
  "localDate",
  "source",
  "firstSeenAt",
  "lastSeenAt"
)
SELECT
  CONCAT('legacy_qbe_', re."id"),
  re."userId",
  re."ayahId",
  re."surahNumber",
  s."localDate",
  'READER_VIEW'::"QuranBrowseSource",
  re."createdAt",
  re."createdAt"
FROM "ReviewEvent" re
JOIN "Session" s
  ON s."id" = re."sessionId"
WHERE re."stage" = 'REVIEW'::"AttemptStage"
  AND re."phase" = 'STANDARD'::"ReviewPhase"
  AND re."grade" IS NULL
  AND re."durationSec" = 1
  AND re."fromAyahId" = re."ayahId"
  AND re."toAyahId" = re."ayahId"
ON CONFLICT ("userId", "localDate", "ayahId", "source")
DO UPDATE SET
  "firstSeenAt" = LEAST("QuranBrowseEvent"."firstSeenAt", EXCLUDED."firstSeenAt"),
  "lastSeenAt" = GREATEST("QuranBrowseEvent"."lastSeenAt", EXCLUDED."lastSeenAt");

DELETE FROM "ReviewEvent"
WHERE "stage" = 'REVIEW'::"AttemptStage"
  AND "phase" = 'STANDARD'::"ReviewPhase"
  AND "grade" IS NULL
  AND "durationSec" = 1
  AND "fromAyahId" = "ayahId"
  AND "toAyahId" = "ayahId";
