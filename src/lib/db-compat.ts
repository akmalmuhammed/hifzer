import "server-only";

import { db, dbConfigured } from "@/lib/db";

let ensureCoreSchemaPatchPromise: Promise<void> | null = null;
let coreSchemaCapabilitiesPromise: Promise<CoreSchemaCapabilities> | null = null;

export type CoreSchemaCapabilities = {
  hasQuranLaneColumns: boolean;
  hasSessionModernColumns: boolean;
  hasSessionPlanJson: boolean;
};

function resolveDbSchemaName(): string {
  const override = process.env.HIFZER_DB_SCHEMA?.trim();
  if (override) {
    return override;
  }
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    return "public";
  }
  try {
    const parsed = new URL(databaseUrl);
    return parsed.searchParams.get("schema")?.trim() || "public";
  } catch {
    return "public";
  }
}

async function readCoreSchemaCapabilities(): Promise<CoreSchemaCapabilities> {
  if (!dbConfigured()) {
    return { hasQuranLaneColumns: false, hasSessionModernColumns: false, hasSessionPlanJson: false };
  }

  const prisma = db();
  const schema = resolveDbSchemaName();

  try {
    const rows = await prisma.$queryRaw<Array<{ table_name: string; column_name: string }>>`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = ${schema}
        AND (
          (LOWER(table_name) = LOWER('UserProfile') AND LOWER(column_name) IN (LOWER('quranActiveSurahNumber'), LOWER('quranCursorAyahId')))
          OR (
            LOWER(table_name) = LOWER('Session')
            AND LOWER(column_name) IN (
              LOWER('mode'),
              LOWER('newUnlocked'),
              LOWER('reviewDebtMinutesAtStart'),
              LOWER('warmupPassed'),
              LOWER('warmupRetryUsed'),
              LOWER('weeklyGateRequired'),
              LOWER('weeklyGatePassed'),
              LOWER('planJson')
            )
          )
        )
    `;

    const profileColumns = new Set(
      rows
        .filter((row) => row.table_name.toLowerCase() === "userprofile")
        .map((row) => row.column_name.toLowerCase()),
    );
    const sessionColumns = new Set(
      rows
        .filter((row) => row.table_name.toLowerCase() === "session")
        .map((row) => row.column_name.toLowerCase()),
    );

    return {
      hasQuranLaneColumns:
        profileColumns.has("quranactivesurahnumber") && profileColumns.has("qurancursorayahid"),
      hasSessionModernColumns:
        sessionColumns.has("mode") &&
        sessionColumns.has("newunlocked") &&
        sessionColumns.has("reviewdebtminutesatstart") &&
        sessionColumns.has("warmuppassed") &&
        sessionColumns.has("warmupretryused") &&
        sessionColumns.has("weeklygaterequired") &&
        sessionColumns.has("weeklygatepassed"),
      hasSessionPlanJson: sessionColumns.has("planjson"),
    };
  } catch {
    // Fail-safe: assume legacy schema if capability probing fails.
    return { hasQuranLaneColumns: false, hasSessionModernColumns: false, hasSessionPlanJson: false };
  }
}

export async function getCoreSchemaCapabilities(input?: { refresh?: boolean }): Promise<CoreSchemaCapabilities> {
  if (input?.refresh) {
    coreSchemaCapabilitiesPromise = null;
  }
  if (!coreSchemaCapabilitiesPromise) {
    coreSchemaCapabilitiesPromise = readCoreSchemaCapabilities();
  }
  return coreSchemaCapabilitiesPromise;
}

/**
 * Emergency compatibility patch for production rollouts where app code
 * may deploy before DB migrations. Safe to run repeatedly.
 */
export async function ensureCoreSchemaCompatibility(): Promise<void> {
  if (!dbConfigured()) {
    return;
  }

  if (!ensureCoreSchemaPatchPromise) {
    ensureCoreSchemaPatchPromise = (async () => {
      const prisma = db();

      // Enum and type compatibility.
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SubscriptionPlan') THEN
            CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'PAID');
          END IF;
        END $$;
      `);
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SubscriptionStatus') THEN
            CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'PAUSED', 'CANCELED');
          END IF;
        END $$;
      `);
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MemorizationBand') THEN
            CREATE TYPE "MemorizationBand" AS ENUM ('ENCODING', 'SABQI', 'MANZIL', 'MASTERED');
          END IF;
        END $$;
      `);
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GateType') THEN
            CREATE TYPE "GateType" AS ENUM ('WARMUP', 'WEEKLY', 'MONTHLY');
          END IF;
        END $$;
      `);
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GateOutcome') THEN
            CREATE TYPE "GateOutcome" AS ENUM ('PASS', 'FAIL', 'SKIPPED', 'REBALANCED');
          END IF;
        END $$;
      `);
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReviewPhase') THEN
            CREATE TYPE "ReviewPhase" AS ENUM ('STANDARD', 'NEW_EXPOSE', 'NEW_GUIDED', 'NEW_BLIND', 'WEEKLY_TEST', 'LINK_REPAIR');
          END IF;
        END $$;
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TYPE "AttemptStage" ADD VALUE IF NOT EXISTS 'WEEKLY_TEST';
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TYPE "AttemptStage" ADD VALUE IF NOT EXISTS 'LINK_REPAIR';
      `);

      // Core profile/session compatibility (covers v2/v3 migration drift).
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "UserProfile"
        ADD COLUMN IF NOT EXISTS "emailRemindersEnabled" BOOLEAN NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "emailSuppressedAt" TIMESTAMP(3),
        ADD COLUMN IF NOT EXISTS "emailUnsubscribedAt" TIMESTAMP(3),
        ADD COLUMN IF NOT EXISTS "avgLinkSeconds" DOUBLE PRECISION NOT NULL DEFAULT 35,
        ADD COLUMN IF NOT EXISTS "avgNewSeconds" DOUBLE PRECISION NOT NULL DEFAULT 90,
        ADD COLUMN IF NOT EXISTS "avgReviewSeconds" DOUBLE PRECISION NOT NULL DEFAULT 45,
        ADD COLUMN IF NOT EXISTS "catchUpThresholdPct" INTEGER NOT NULL DEFAULT 45,
        ADD COLUMN IF NOT EXISTS "consolidationThresholdPct" INTEGER NOT NULL DEFAULT 25,
        ADD COLUMN IF NOT EXISTS "hasTeacher" BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "rebalanceUntil" TIMESTAMP(3),
        ADD COLUMN IF NOT EXISTS "reviewFloorPct" INTEGER NOT NULL DEFAULT 70,
        ADD COLUMN IF NOT EXISTS "currentPeriodEnd" TIMESTAMP(3),
        ADD COLUMN IF NOT EXISTS "paddleCustomerId" TEXT,
        ADD COLUMN IF NOT EXISTS "paddleSubscriptionId" TEXT,
        ADD COLUMN IF NOT EXISTS "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
        ADD COLUMN IF NOT EXISTS "subscriptionStatus" "SubscriptionStatus",
        ADD COLUMN IF NOT EXISTS "quranActiveSurahNumber" INTEGER,
        ADD COLUMN IF NOT EXISTS "quranCursorAyahId" INTEGER;
      `);
      await prisma.$executeRawUnsafe(`
        UPDATE "UserProfile"
        SET
          "quranActiveSurahNumber" = COALESCE("quranActiveSurahNumber", "activeSurahNumber", 1),
          "quranCursorAyahId" = COALESCE("quranCursorAyahId", "cursorAyahId", 1)
        WHERE "quranActiveSurahNumber" IS NULL OR "quranCursorAyahId" IS NULL;
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "UserProfile"
        ALTER COLUMN "quranActiveSurahNumber" SET DEFAULT 1;
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "UserProfile"
        ALTER COLUMN "quranCursorAyahId" SET DEFAULT 1;
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "UserProfile"
        ALTER COLUMN "quranActiveSurahNumber" SET NOT NULL;
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "UserProfile"
        ALTER COLUMN "quranCursorAyahId" SET NOT NULL;
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Session"
        ADD COLUMN IF NOT EXISTS "mode" "SrsMode" NOT NULL DEFAULT 'NORMAL',
        ADD COLUMN IF NOT EXISTS "newUnlocked" BOOLEAN NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "reviewDebtMinutesAtStart" INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "warmupPassed" BOOLEAN,
        ADD COLUMN IF NOT EXISTS "warmupRetryUsed" BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "weeklyGatePassed" BOOLEAN,
        ADD COLUMN IF NOT EXISTS "weeklyGateRequired" BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "planJson" JSONB;
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "AyahReview"
        ADD COLUMN IF NOT EXISTS "band" "MemorizationBand" NOT NULL DEFAULT 'ENCODING',
        ADD COLUMN IF NOT EXISTS "checkpointIndex" INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "lastDurationSec" INTEGER,
        ADD COLUMN IF NOT EXISTS "nextIntervalMinutes" INTEGER NOT NULL DEFAULT 1440;
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "WeakTransition"
        ADD COLUMN IF NOT EXISTS "lastGrade" "SrsGrade",
        ADD COLUMN IF NOT EXISTS "nextRepairAt" TIMESTAMP(3),
        ADD COLUMN IF NOT EXISTS "successRateCached" DOUBLE PRECISION NOT NULL DEFAULT 0;
      `);

      // Ensure supporting tables exist for load/start and lane APIs.
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ReviewEvent" (
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
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "QualityGateRun" (
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
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "ReviewEvent_userId_createdAt_idx" ON "ReviewEvent"("userId", "createdAt");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "ReviewEvent_userId_ayahId_createdAt_idx" ON "ReviewEvent"("userId", "ayahId", "createdAt");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "ReviewEvent_sessionId_createdAt_idx" ON "ReviewEvent"("sessionId", "createdAt");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "QualityGateRun_userId_gateType_createdAt_idx" ON "QualityGateRun"("userId", "gateType", "createdAt");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "QualityGateRun_userId_windowEnd_idx" ON "QualityGateRun"("userId", "windowEnd");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "UserProfile_paddleCustomerId_key" ON "UserProfile"("paddleCustomerId");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "UserProfile_paddleSubscriptionId_key" ON "UserProfile"("paddleSubscriptionId");
      `);
      coreSchemaCapabilitiesPromise = Promise.resolve({
        hasQuranLaneColumns: true,
        hasSessionModernColumns: true,
        hasSessionPlanJson: true,
      });
    })().catch((error) => {
      ensureCoreSchemaPatchPromise = null;
      coreSchemaCapabilitiesPromise = null;
      throw error;
    });
  }

  return ensureCoreSchemaPatchPromise;
}
