import "server-only";

import { db, dbConfigured } from "@/lib/db";

let ensureCoreSchemaPatchPromise: Promise<void> | null = null;

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

      await prisma.$executeRawUnsafe(`
        ALTER TABLE "UserProfile"
        ADD COLUMN IF NOT EXISTS "quranActiveSurahNumber" INTEGER;
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "UserProfile"
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
        ADD COLUMN IF NOT EXISTS "planJson" JSONB;
      `);
    })().catch((error) => {
      ensureCoreSchemaPatchPromise = null;
      throw error;
    });
  }

  return ensureCoreSchemaPatchPromise;
}
