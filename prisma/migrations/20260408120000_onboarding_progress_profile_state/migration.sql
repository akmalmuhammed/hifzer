ALTER TABLE "UserProfile"
ADD COLUMN IF NOT EXISTS "onboardingStep" TEXT NOT NULL DEFAULT 'welcome',
ADD COLUMN IF NOT EXISTS "onboardingStartLane" TEXT;

UPDATE "UserProfile"
SET "onboardingStep" = 'complete'
WHERE "onboardingCompletedAt" IS NOT NULL;
