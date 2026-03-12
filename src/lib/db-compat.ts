import "server-only";

import { db, dbConfigured } from "@/lib/db";

let ensureCoreSchemaPatchPromise: Promise<void> | null = null;
let coreSchemaCapabilitiesPromise: Promise<CoreSchemaCapabilities> | null = null;

export type CoreSchemaCapabilities = {
  hasQuranLaneColumns: boolean;
  hasSessionModernColumns: boolean;
  hasSessionPlanJson: boolean;
  hasQuranBrowseTable: boolean;
  hasCustomDuaTables: boolean;
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
    return {
      hasQuranLaneColumns: false,
      hasSessionModernColumns: false,
      hasSessionPlanJson: false,
      hasQuranBrowseTable: false,
      hasCustomDuaTables: false,
    };
  }

  const prisma = db();
  const schema = resolveDbSchemaName();

  try {
    const rows = await prisma.$queryRaw<Array<{ table_name: string; column_name: string }>>`
      SELECT table_name::text AS table_name, column_name::text AS column_name
      FROM information_schema.columns
      WHERE table_schema = ${schema}
        AND (
          (
            LOWER(table_name) = LOWER('UserProfile')
            AND LOWER(column_name) IN (
              LOWER('quranActiveSurahNumber'),
              LOWER('quranCursorAyahId'),
              LOWER('quranTranslationId'),
              LOWER('quranShowDetails')
            )
          )
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
          OR (
            LOWER(table_name) = LOWER('QuranBrowseEvent')
            AND LOWER(column_name) IN (
              LOWER('userId'),
              LOWER('ayahId'),
              LOWER('surahNumber'),
              LOWER('localDate'),
              LOWER('source'),
              LOWER('firstSeenAt'),
              LOWER('lastSeenAt')
            )
          )
          OR (
            LOWER(table_name) = LOWER('CustomDua')
            AND LOWER(column_name) IN (
              LOWER('userId'),
              LOWER('moduleId'),
              LOWER('title'),
              LOWER('arabic'),
              LOWER('transliteration'),
              LOWER('translation'),
              LOWER('note'),
              LOWER('createdAt'),
              LOWER('updatedAt')
            )
          )
          OR (
            LOWER(table_name) = LOWER('DuaDeckOrder')
            AND LOWER(column_name) IN (
              LOWER('userId'),
              LOWER('moduleId'),
              LOWER('itemKey'),
              LOWER('sortOrder'),
              LOWER('createdAt'),
              LOWER('updatedAt')
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
    const quranBrowseColumns = new Set(
      rows
        .filter((row) => row.table_name.toLowerCase() === "quranbrowseevent")
        .map((row) => row.column_name.toLowerCase()),
    );
    const customDuaColumns = new Set(
      rows
        .filter((row) => row.table_name.toLowerCase() === "customdua")
        .map((row) => row.column_name.toLowerCase()),
    );
    const duaDeckOrderColumns = new Set(
      rows
        .filter((row) => row.table_name.toLowerCase() === "duadeckorder")
        .map((row) => row.column_name.toLowerCase()),
    );

    return {
      hasQuranLaneColumns:
        profileColumns.has("quranactivesurahnumber") &&
        profileColumns.has("qurancursorayahid") &&
        profileColumns.has("qurantranslationid") &&
        profileColumns.has("quranshowdetails"),
      hasSessionModernColumns:
        sessionColumns.has("mode") &&
        sessionColumns.has("newunlocked") &&
        sessionColumns.has("reviewdebtminutesatstart") &&
        sessionColumns.has("warmuppassed") &&
        sessionColumns.has("warmupretryused") &&
        sessionColumns.has("weeklygaterequired") &&
        sessionColumns.has("weeklygatepassed"),
      hasSessionPlanJson: sessionColumns.has("planjson"),
      hasQuranBrowseTable:
        quranBrowseColumns.has("userid") &&
        quranBrowseColumns.has("ayahid") &&
        quranBrowseColumns.has("surahnumber") &&
        quranBrowseColumns.has("localdate") &&
        quranBrowseColumns.has("source") &&
        quranBrowseColumns.has("firstseenat") &&
        quranBrowseColumns.has("lastseenat"),
      hasCustomDuaTables:
        customDuaColumns.has("userid") &&
        customDuaColumns.has("moduleid") &&
        customDuaColumns.has("title") &&
        customDuaColumns.has("translation") &&
        customDuaColumns.has("createdat") &&
        customDuaColumns.has("updatedat") &&
        duaDeckOrderColumns.has("userid") &&
        duaDeckOrderColumns.has("moduleid") &&
        duaDeckOrderColumns.has("itemkey") &&
        duaDeckOrderColumns.has("sortorder") &&
        duaDeckOrderColumns.has("createdat") &&
        duaDeckOrderColumns.has("updatedat"),
    };
  } catch {
    // Fail-safe: assume legacy schema if capability probing fails.
    return {
      hasQuranLaneColumns: false,
      hasSessionModernColumns: false,
      hasSessionPlanJson: false,
      hasQuranBrowseTable: false,
      hasCustomDuaTables: false,
    };
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
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'QuranBrowseSource') THEN
            CREATE TYPE "QuranBrowseSource" AS ENUM ('READER_VIEW', 'AUDIO_PLAY', 'BACKFILL');
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
        ADD COLUMN IF NOT EXISTS "quranCursorAyahId" INTEGER,
        ADD COLUMN IF NOT EXISTS "quranTranslationId" TEXT NOT NULL DEFAULT 'en.sahih',
        ADD COLUMN IF NOT EXISTS "quranShowDetails" BOOLEAN NOT NULL DEFAULT true;
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
        CREATE TABLE IF NOT EXISTS "QuranBrowseEvent" (
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
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "CustomDua" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "moduleId" TEXT NOT NULL DEFAULT 'laylat-al-qadr',
          "title" TEXT NOT NULL,
          "arabic" TEXT,
          "transliteration" TEXT,
          "translation" TEXT NOT NULL,
          "note" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "CustomDua_pkey" PRIMARY KEY ("id")
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "DuaDeckOrder" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "moduleId" TEXT NOT NULL DEFAULT 'laylat-al-qadr',
          "itemKey" TEXT NOT NULL,
          "sortOrder" INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "DuaDeckOrder_pkey" PRIMARY KEY ("id")
        );
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "CustomDua"
        ADD COLUMN IF NOT EXISTS "moduleId" TEXT NOT NULL DEFAULT 'laylat-al-qadr';
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "DuaDeckOrder"
        ADD COLUMN IF NOT EXISTS "moduleId" TEXT NOT NULL DEFAULT 'laylat-al-qadr';
      `);
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'CustomDua_userId_fkey'
          ) THEN
            ALTER TABLE "CustomDua"
            ADD CONSTRAINT "CustomDua_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "UserProfile"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$;
      `);
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'DuaDeckOrder_userId_fkey'
          ) THEN
            ALTER TABLE "DuaDeckOrder"
            ADD CONSTRAINT "DuaDeckOrder_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "UserProfile"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$;
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
        CREATE UNIQUE INDEX IF NOT EXISTS "QuranBrowseEvent_userId_localDate_ayahId_source_key"
        ON "QuranBrowseEvent"("userId", "localDate", "ayahId", "source");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "QuranBrowseEvent_userId_lastSeenAt_idx" ON "QuranBrowseEvent"("userId", "lastSeenAt");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "QuranBrowseEvent_userId_ayahId_lastSeenAt_idx" ON "QuranBrowseEvent"("userId", "ayahId", "lastSeenAt");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "QuranBrowseEvent_userId_localDate_source_idx" ON "QuranBrowseEvent"("userId", "localDate", "source");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "CustomDua_userId_moduleId_updatedAt_idx" ON "CustomDua"("userId", "moduleId", "updatedAt");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "CustomDua_userId_moduleId_createdAt_idx" ON "CustomDua"("userId", "moduleId", "createdAt");
      `);
      await prisma.$executeRawUnsafe(`
        DROP INDEX IF EXISTS "DuaDeckOrder_userId_itemKey_key";
      `);
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "DuaDeckOrder_userId_moduleId_itemKey_key" ON "DuaDeckOrder"("userId", "moduleId", "itemKey");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "DuaDeckOrder_userId_moduleId_sortOrder_updatedAt_idx" ON "DuaDeckOrder"("userId", "moduleId", "sortOrder", "updatedAt");
      `);
      await prisma.$executeRawUnsafe(`
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
          CONCAT('compat_qbe_', re."id"),
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
      `);
      await prisma.$executeRawUnsafe(`
        DELETE FROM "ReviewEvent"
        WHERE "stage" = 'REVIEW'::"AttemptStage"
          AND "phase" = 'STANDARD'::"ReviewPhase"
          AND "grade" IS NULL
          AND "durationSec" = 1
          AND "fromAyahId" = "ayahId"
          AND "toAyahId" = "ayahId";
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
        hasQuranBrowseTable: true,
        hasCustomDuaTables: true,
      });
    })().catch((error) => {
      ensureCoreSchemaPatchPromise = null;
      coreSchemaCapabilitiesPromise = null;
      throw error;
    });
  }

  return ensureCoreSchemaPatchPromise;
}
