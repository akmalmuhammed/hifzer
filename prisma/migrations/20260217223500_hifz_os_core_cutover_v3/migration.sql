-- CreateEnum
CREATE TYPE "MemorizationBand" AS ENUM ('ENCODING', 'SABQI', 'MANZIL', 'MASTERED');

-- CreateEnum
CREATE TYPE "GateType" AS ENUM ('WARMUP', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "GateOutcome" AS ENUM ('PASS', 'FAIL', 'SKIPPED', 'REBALANCED');

-- CreateEnum
CREATE TYPE "ReviewPhase" AS ENUM ('STANDARD', 'NEW_EXPOSE', 'NEW_GUIDED', 'NEW_BLIND', 'WEEKLY_TEST', 'LINK_REPAIR');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AttemptStage" ADD VALUE 'WEEKLY_TEST';
ALTER TYPE "AttemptStage" ADD VALUE 'LINK_REPAIR';

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "avgLinkSeconds" DOUBLE PRECISION NOT NULL DEFAULT 35,
ADD COLUMN     "avgNewSeconds" DOUBLE PRECISION NOT NULL DEFAULT 90,
ADD COLUMN     "avgReviewSeconds" DOUBLE PRECISION NOT NULL DEFAULT 45,
ADD COLUMN     "catchUpThresholdPct" INTEGER NOT NULL DEFAULT 45,
ADD COLUMN     "consolidationThresholdPct" INTEGER NOT NULL DEFAULT 25,
ADD COLUMN     "hasTeacher" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rebalanceUntil" TIMESTAMP(3),
ADD COLUMN     "reviewFloorPct" INTEGER NOT NULL DEFAULT 70;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "mode" "SrsMode" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "newUnlocked" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "reviewDebtMinutesAtStart" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "warmupPassed" BOOLEAN,
ADD COLUMN     "warmupRetryUsed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "weeklyGatePassed" BOOLEAN,
ADD COLUMN     "weeklyGateRequired" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "AyahReview" ADD COLUMN     "band" "MemorizationBand" NOT NULL DEFAULT 'ENCODING',
ADD COLUMN     "checkpointIndex" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastDurationSec" INTEGER,
ADD COLUMN     "nextIntervalMinutes" INTEGER NOT NULL DEFAULT 1440;

-- AlterTable
ALTER TABLE "WeakTransition" ADD COLUMN     "lastGrade" "SrsGrade",
ADD COLUMN     "nextRepairAt" TIMESTAMP(3),
ADD COLUMN     "successRateCached" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ReviewEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "surahNumber" INTEGER NOT NULL,
    "ayahId" INTEGER NOT NULL,
    "stage" "AttemptStage" NOT NULL,
    "phase" "ReviewPhase" NOT NULL DEFAULT 'STANDARD',
    "grade" "SrsGrade",
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "fromAyahId" INTEGER,
    "toAyahId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualityGateRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gateType" "GateType" NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "sampleSize" INTEGER NOT NULL DEFAULT 0,
    "passRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "outcome" "GateOutcome" NOT NULL,
    "detailsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QualityGateRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReviewEvent_userId_createdAt_idx" ON "ReviewEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ReviewEvent_userId_ayahId_createdAt_idx" ON "ReviewEvent"("userId", "ayahId", "createdAt");

-- CreateIndex
CREATE INDEX "ReviewEvent_sessionId_createdAt_idx" ON "ReviewEvent"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "QualityGateRun_userId_gateType_createdAt_idx" ON "QualityGateRun"("userId", "gateType", "createdAt");

-- CreateIndex
CREATE INDEX "QualityGateRun_userId_windowEnd_idx" ON "QualityGateRun"("userId", "windowEnd");

-- CreateIndex
CREATE INDEX "AyahReview_userId_band_nextReviewAt_idx" ON "AyahReview"("userId", "band", "nextReviewAt");

-- CreateIndex
CREATE INDEX "WeakTransition_userId_nextRepairAt_idx" ON "WeakTransition"("userId", "nextRepairAt");

-- AddForeignKey
ALTER TABLE "ReviewEvent" ADD CONSTRAINT "ReviewEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewEvent" ADD CONSTRAINT "ReviewEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityGateRun" ADD CONSTRAINT "QualityGateRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
