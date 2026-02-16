-- CreateEnum
CREATE TYPE "PlanBias" AS ENUM ('BALANCED', 'RETENTION', 'SPEED');

-- CreateEnum
CREATE TYPE "SrsMode" AS ENUM ('NORMAL', 'CONSOLIDATION', 'CATCH_UP');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('OPEN', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "AttemptStage" AS ENUM ('WARMUP', 'REVIEW', 'NEW', 'LINK');

-- CreateEnum
CREATE TYPE "SrsGrade" AS ENUM ('AGAIN', 'HARD', 'GOOD', 'EASY');

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "onboardingCompletedAt" TIMESTAMP(3),
    "dailyMinutes" INTEGER NOT NULL,
    "practiceDays" INTEGER[],
    "reminderTimeLocal" TEXT NOT NULL,
    "planBias" "PlanBias" NOT NULL DEFAULT 'BALANCED',
    "activeSurahNumber" INTEGER NOT NULL,
    "cursorAyahId" INTEGER NOT NULL,
    "mode" "SrsMode" NOT NULL DEFAULT 'NORMAL',
    "darkMode" BOOLEAN NOT NULL DEFAULT false,
    "themePreset" TEXT NOT NULL DEFAULT 'standard',
    "accentPreset" TEXT NOT NULL DEFAULT 'teal',
    "reciterId" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'OPEN',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "localDate" TEXT NOT NULL,
    "warmupAyahIds" INTEGER[],
    "reviewAyahIds" INTEGER[],
    "newStartAyahId" INTEGER,
    "newEndAyahId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AyahAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "ayahId" INTEGER NOT NULL,
    "stage" "AttemptStage" NOT NULL,
    "grade" "SrsGrade" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AyahAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AyahReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ayahId" INTEGER NOT NULL,
    "station" INTEGER NOT NULL DEFAULT 1,
    "intervalDays" INTEGER NOT NULL DEFAULT 1,
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "lapses" INTEGER NOT NULL DEFAULT 0,
    "nextReviewAt" TIMESTAMP(3) NOT NULL,
    "lastReviewAt" TIMESTAMP(3),
    "lastGrade" "SrsGrade",

    CONSTRAINT "AyahReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeakTransition" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromAyahId" INTEGER NOT NULL,
    "toAyahId" INTEGER NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "lastOccurredAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "WeakTransition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_clerkUserId_key" ON "UserProfile"("clerkUserId");

-- CreateIndex
CREATE INDEX "Session_userId_startedAt_idx" ON "Session"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "Session_userId_localDate_idx" ON "Session"("userId", "localDate");

-- CreateIndex
CREATE INDEX "AyahAttempt_userId_ayahId_createdAt_idx" ON "AyahAttempt"("userId", "ayahId", "createdAt");

-- CreateIndex
CREATE INDEX "AyahAttempt_sessionId_createdAt_idx" ON "AyahAttempt"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "AyahReview_userId_nextReviewAt_idx" ON "AyahReview"("userId", "nextReviewAt");

-- CreateIndex
CREATE UNIQUE INDEX "AyahReview_userId_ayahId_key" ON "AyahReview"("userId", "ayahId");

-- CreateIndex
CREATE UNIQUE INDEX "WeakTransition_userId_fromAyahId_toAyahId_key" ON "WeakTransition"("userId", "fromAyahId", "toAyahId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AyahAttempt" ADD CONSTRAINT "AyahAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AyahAttempt" ADD CONSTRAINT "AyahAttempt_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AyahReview" ADD CONSTRAINT "AyahReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeakTransition" ADD CONSTRAINT "WeakTransition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
