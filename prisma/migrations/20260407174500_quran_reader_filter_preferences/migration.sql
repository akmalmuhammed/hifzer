CREATE TABLE "QuranReaderFilterPreference" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "view" TEXT NOT NULL DEFAULT 'list',
  "surahNumber" INTEGER,
  "ayahId" INTEGER,
  "showPhonetic" BOOLEAN NOT NULL DEFAULT true,
  "showTranslation" BOOLEAN NOT NULL DEFAULT true,
  "showTafsir" BOOLEAN NOT NULL DEFAULT false,
  "tafsirId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuranReaderFilterPreference_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "QuranReaderFilterPreference"
ADD CONSTRAINT "QuranReaderFilterPreference_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "UserProfile"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "QuranReaderFilterPreference_userId_key" ON "QuranReaderFilterPreference"("userId");
CREATE INDEX "QuranReaderFilterPreference_userId_updatedAt_idx" ON "QuranReaderFilterPreference"("userId", "updatedAt");
