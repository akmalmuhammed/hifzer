ALTER TABLE "Bookmark"
ADD COLUMN IF NOT EXISTS "quranFoundationBookmarkId" TEXT,
ADD COLUMN IF NOT EXISTS "quranFoundationSyncState" TEXT,
ADD COLUMN IF NOT EXISTS "quranFoundationLastSyncedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "quranFoundationSyncError" TEXT;

CREATE INDEX IF NOT EXISTS "Bookmark_quranFoundationBookmarkId_idx"
ON "Bookmark"("quranFoundationBookmarkId");

CREATE TABLE IF NOT EXISTS "QuranFoundationAccount" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "quranFoundationUserId" TEXT,
  "displayName" TEXT,
  "email" TEXT,
  "accessTokenCiphertext" TEXT NOT NULL,
  "refreshTokenCiphertext" TEXT,
  "scopes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "status" TEXT NOT NULL DEFAULT 'connected',
  "accessTokenExpiresAt" TIMESTAMP(3),
  "lastMutationAt" TEXT,
  "lastSyncedAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuranFoundationAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "QuranFoundationAccount_userId_key"
ON "QuranFoundationAccount"("userId");

CREATE INDEX IF NOT EXISTS "QuranFoundationAccount_status_updatedAt_idx"
ON "QuranFoundationAccount"("status", "updatedAt");

CREATE INDEX IF NOT EXISTS "QuranFoundationAccount_quranFoundationUserId_idx"
ON "QuranFoundationAccount"("quranFoundationUserId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'QuranFoundationAccount_userId_fkey'
  ) THEN
    ALTER TABLE "QuranFoundationAccount"
    ADD CONSTRAINT "QuranFoundationAccount_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "UserProfile"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
