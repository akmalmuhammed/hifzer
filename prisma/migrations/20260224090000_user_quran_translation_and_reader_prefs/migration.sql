-- Persist per-user Qur'an translation and reader detail visibility preferences.

ALTER TABLE "UserProfile"
  ADD COLUMN "quranTranslationId" TEXT NOT NULL DEFAULT 'en.sahih',
  ADD COLUMN "quranShowDetails" BOOLEAN NOT NULL DEFAULT true;
