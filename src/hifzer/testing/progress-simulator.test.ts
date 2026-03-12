import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { config as loadEnv } from "dotenv";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;
loadEnv({ path: ".env.local" });

type SimulationModules = {
  simulator: typeof import("./progress-simulator");
  profile: typeof import("../profile/server");
  quranProgress: typeof import("../quran/read-progress.server");
  streak: typeof import("../streak/server");
  dbModule: typeof import("@/lib/db");
  dbCompat: typeof import("@/lib/db-compat");
};

function withSchema(databaseUrl: string, schema: string): string {
  const url = new URL(databaseUrl);
  url.searchParams.set("schema", schema);
  return url.toString();
}

function createClient(databaseUrl: string, schema?: string): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaNeon(
      { connectionString: databaseUrl },
      schema ? { schema } : undefined,
    ),
  });
}

const baseTestDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeIfTestDb = baseTestDatabaseUrl ? describe : describe.skip;

describeIfTestDb("progress simulator", () => {
  const schema = `test_progress_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
  let adminClient: PrismaClient | null = null;
  let modules: SimulationModules | null = null;

  beforeAll(async () => {
    if (!baseTestDatabaseUrl) {
      return;
    }

    adminClient = createClient(baseTestDatabaseUrl);
    await adminClient.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await adminClient.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);

    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
    process.env.DATABASE_URL = withSchema(baseTestDatabaseUrl, schema);
    process.env.HIFZER_DB_SCHEMA = schema;

    delete (globalThis as typeof globalThis & { __hifzer_prisma?: PrismaClient }).__hifzer_prisma;
    execSync("npx prisma db push --accept-data-loss --config=./prisma.config.ts", {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL,
        HIFZER_DB_SCHEMA: schema,
      },
      stdio: "pipe",
    });

    const dbCompat = await import("@/lib/db-compat");
    await dbCompat.ensureCoreSchemaCompatibility();
    await dbCompat.getCoreSchemaCapabilities({ refresh: true });

    modules = {
      simulator: await import("./progress-simulator"),
      profile: await import("../profile/server"),
      quranProgress: await import("../quran/read-progress.server"),
      streak: await import("../streak/server"),
      dbModule: await import("@/lib/db"),
      dbCompat,
    };
  }, 180_000);

  afterAll(async () => {
    const cachedClient = (globalThis as typeof globalThis & { __hifzer_prisma?: PrismaClient }).__hifzer_prisma;
    if (cachedClient) {
      await cachedClient.$disconnect();
      delete (globalThis as typeof globalThis & { __hifzer_prisma?: PrismaClient }).__hifzer_prisma;
    }

    if (adminClient) {
      await adminClient.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      await adminClient.$disconnect();
      adminClient = null;
    }
  });

  it("emulates one week of Quran progress, streak growth, and Hifz progression for a single user", async () => {
    if (!modules) {
      throw new Error("Simulation modules failed to load.");
    }

    const clerkUserId = "progress-sim-user";
    const startedAt = new Date("2026-03-01T05:00:00.000Z");
    await modules.simulator.prepareProgressSimulationUser({
      clerkUserId,
      timezone: "UTC",
      hifzStartSurahNumber: 1,
      hifzStartAyahNumber: 1,
      quranStartSurahNumber: 2,
      quranStartAyahNumber: 1,
      now: startedAt,
    });

    const dayReports = [];
    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const report = await modules.simulator.simulateProgressDayForUser({
        clerkUserId,
        dayNumber: dayIndex + 1,
        quranAyahsPerDay: 8,
        now: new Date(startedAt.getTime() + (dayIndex * 24 * 60 * 60 * 1000)),
      });
      dayReports.push(report);
    }

    const profile = await modules.profile.getOrCreateUserProfile(clerkUserId);
    if (!profile) {
      throw new Error("Profile missing after simulation.");
    }

    const [quranProgress, streakSummary, completedSessions] = await Promise.all([
      modules.quranProgress.getQuranReadProgress(profile.id),
      modules.streak.getUserStreakSummary(clerkUserId, {
        now: new Date(startedAt.getTime() + (6 * 24 * 60 * 60 * 1000)),
      }),
      modules.dbModule.db().session.count({
        where: {
          userId: profile.id,
          status: "COMPLETED",
        },
      }),
    ]);
    expect(dayReports).toHaveLength(7);
    expect(dayReports.every((day) => day.hifzSession.stepCount > 0)).toBe(true);
    expect(dayReports.every((day) => day.hifzSession.completed)).toBe(true);
    expect(dayReports.map((day) => day.streak.currentDays)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(streakSummary.streak.currentStreakDays).toBe(7);
    expect(streakSummary.streak.bestStreakDays).toBe(7);
    expect(quranProgress.uniqueReadAyahCount).toBe(56);
    expect(quranProgress.lastReadAyahId).toBe(63);
    expect(completedSessions).toBe(7);
    expect(profile.cursorAyahId).toBeGreaterThan(1);
    expect(profile.quranCursorAyahId).toBe(63);
    expect(profile.quranCursorAyahId).not.toBe(profile.cursorAyahId);
  }, 180_000);

  it("emulates fourteen days and verifies recurring weekly Hifz validation", async () => {
    if (!modules) {
      throw new Error("Simulation modules failed to load.");
    }

    const clerkUserId = "progress-sim-user-14d";
    const startedAt = new Date("2026-03-01T05:00:00.000Z");
    const report = await modules.simulator.simulateWeekProgressForUser({
      clerkUserId,
      days: 14,
      timezone: "UTC",
      hifzStartSurahNumber: 1,
      hifzStartAyahNumber: 1,
      quranStartSurahNumber: 2,
      quranStartAyahNumber: 1,
      quranAyahsPerDay: 8,
      startAt: startedAt,
    });

    const profile = await modules.profile.getOrCreateUserProfile(clerkUserId);
    if (!profile) {
      throw new Error("Profile missing after 14-day simulation.");
    }

    const weeklyGateRuns = await modules.dbModule.db().qualityGateRun.findMany({
      where: {
        userId: profile.id,
        gateType: "WEEKLY",
      },
      orderBy: {
        windowEnd: "asc",
      },
      select: {
        windowEnd: true,
        outcome: true,
        sampleSize: true,
      },
    });

    const weeklyGateDays = report.daysSummary.filter((day) => day.hifzSession.weeklyGateRequired);
    expect(report.daysSummary).toHaveLength(14);
    expect(report.daysSummary.every((day) => day.hifzSession.completed)).toBe(true);
    expect(report.final.streakCurrentDays).toBe(14);
    expect(report.final.streakBestDays).toBe(14);
    expect(report.final.quranUniqueReadAyahCount).toBe(112);
    expect(report.final.quranLastReadAyahId).toBe(119);
    expect(report.final.completedHifzSessions).toBe(14);
    expect(report.final.separatedLanes).toBe(true);

    expect(weeklyGateDays.length).toBeGreaterThanOrEqual(2);
    expect(weeklyGateDays.every((day) => day.hifzSession.weeklyTestStepCount > 0)).toBe(true);
    expect(weeklyGateDays.every((day) => day.hifzSession.weeklyGatePassed === true)).toBe(true);

    expect(weeklyGateRuns.length).toBeGreaterThanOrEqual(2);
    expect(weeklyGateRuns.every((row) => row.outcome === "PASS")).toBe(true);
    expect(weeklyGateRuns.every((row) => row.sampleSize > 0)).toBe(true);
    expect(weeklyGateRuns[1]!.windowEnd.getTime() - weeklyGateRuns[0]!.windowEnd.getTime()).toBeGreaterThanOrEqual(
      7 * 24 * 60 * 60 * 1000,
    );
  }, 420_000);

  it("blocks new Hifz progression when warmup fails", async () => {
    if (!modules) {
      throw new Error("Simulation modules failed to load.");
    }

    const clerkUserId = "progress-sim-warmup-fail";
    const startedAt = new Date("2026-04-01T05:00:00.000Z");
    await modules.simulator.prepareProgressSimulationUser({
      clerkUserId,
      timezone: "UTC",
      hifzStartSurahNumber: 1,
      hifzStartAyahNumber: 1,
      quranStartSurahNumber: 2,
      quranStartAyahNumber: 1,
      now: startedAt,
    });

    await modules.simulator.simulateProgressDayForUser({
      clerkUserId,
      dayNumber: 1,
      quranAyahsPerDay: 8,
      now: startedAt,
    });
    const profileAfterDay1 = await modules.profile.getOrCreateUserProfile(clerkUserId);
    if (!profileAfterDay1) {
      throw new Error("Profile missing after day 1.");
    }

    const day2 = await modules.simulator.simulateProgressDayForUser({
      clerkUserId,
      dayNumber: 2,
      quranAyahsPerDay: 8,
      gradePlan: {
        WARMUP: "AGAIN",
      },
      now: new Date(startedAt.getTime() + (24 * 60 * 60 * 1000)),
    });
    const profileAfterDay2 = await modules.profile.getOrCreateUserProfile(clerkUserId);
    if (!profileAfterDay2) {
      throw new Error("Profile missing after day 2.");
    }

    expect(day2.hifzSession.completed).toBe(true);
    expect(day2.hifzSession.warmupRequired).toBe(true);
    expect(day2.hifzSession.warmupPassed).toBe(false);
    expect(day2.hifzSession.newAyahCount).toBeGreaterThan(0);
    expect(profileAfterDay2.cursorAyahId).toBe(profileAfterDay1.cursorAyahId);
    expect(profileAfterDay2.quranCursorAyahId).toBeGreaterThan(profileAfterDay1.quranCursorAyahId);
  }, 240_000);

  it("blocks new Hifz progression when weekly validation fails", async () => {
    if (!modules) {
      throw new Error("Simulation modules failed to load.");
    }

    const clerkUserId = "progress-sim-weekly-fail";
    const startedAt = new Date("2026-05-01T05:00:00.000Z");
    await modules.simulator.prepareProgressSimulationUser({
      clerkUserId,
      timezone: "UTC",
      hifzStartSurahNumber: 1,
      hifzStartAyahNumber: 1,
      quranStartSurahNumber: 2,
      quranStartAyahNumber: 1,
      now: startedAt,
    });

    await modules.simulator.simulateProgressDayForUser({
      clerkUserId,
      dayNumber: 1,
      quranAyahsPerDay: 8,
      now: startedAt,
    });
    const profileAfterDay1 = await modules.profile.getOrCreateUserProfile(clerkUserId);
    if (!profileAfterDay1) {
      throw new Error("Profile missing after day 1.");
    }

    await modules.simulator.simulateProgressDayForUser({
      clerkUserId,
      dayNumber: 2,
      quranAyahsPerDay: 8,
      now: new Date(startedAt.getTime() + (24 * 60 * 60 * 1000)),
    });
    const profileAfterDay2 = await modules.profile.getOrCreateUserProfile(clerkUserId);
    if (!profileAfterDay2) {
      throw new Error("Profile missing after day 2.");
    }

    const day3 = await modules.simulator.simulateProgressDayForUser({
      clerkUserId,
      dayNumber: 3,
      quranAyahsPerDay: 8,
      gradePlan: {
        WEEKLY_TEST: "AGAIN",
      },
      now: new Date(startedAt.getTime() + (2 * 24 * 60 * 60 * 1000)),
    });
    const profileAfterDay3 = await modules.profile.getOrCreateUserProfile(clerkUserId);
    if (!profileAfterDay3) {
      throw new Error("Profile missing after day 3.");
    }

    const weeklyGateRuns = await modules.dbModule.db().qualityGateRun.findMany({
      where: {
        userId: profileAfterDay3.id,
        gateType: "WEEKLY",
      },
      select: {
        outcome: true,
      },
    });

    expect(day3.hifzSession.completed).toBe(true);
    expect(day3.hifzSession.weeklyGateRequired).toBe(true);
    expect(day3.hifzSession.weeklyTestStepCount).toBeGreaterThan(0);
    expect(day3.hifzSession.weeklyGatePassed).toBe(false);
    expect(profileAfterDay3.cursorAyahId).toBe(profileAfterDay2.cursorAyahId);
    expect(weeklyGateRuns.some((row) => row.outcome === "FAIL")).toBe(true);
  }, 240_000);

  it("enters catch-up mode after missed days and supports recovery on return", async () => {
    if (!modules) {
      throw new Error("Simulation modules failed to load.");
    }

    const clerkUserId = "progress-sim-catch-up";
    const startedAt = new Date("2026-06-01T05:00:00.000Z");
    await modules.simulator.prepareProgressSimulationUser({
      clerkUserId,
      timezone: "UTC",
      hifzStartSurahNumber: 1,
      hifzStartAyahNumber: 1,
      quranStartSurahNumber: 2,
      quranStartAyahNumber: 1,
      now: startedAt,
    });

    const day1 = await modules.simulator.simulateProgressDayForUser({
      clerkUserId,
      dayNumber: 1,
      quranAyahsPerDay: 8,
      now: startedAt,
    });
    const day5 = await modules.simulator.simulateProgressDayForUser({
      clerkUserId,
      dayNumber: 5,
      quranAyahsPerDay: 8,
      now: new Date(startedAt.getTime() + (4 * 24 * 60 * 60 * 1000)),
    });
    const day6 = await modules.simulator.simulateProgressDayForUser({
      clerkUserId,
      dayNumber: 6,
      quranAyahsPerDay: 8,
      now: new Date(startedAt.getTime() + (5 * 24 * 60 * 60 * 1000)),
    });

    expect(day1.hifzSession.completed).toBe(true);
    expect(day5.hifzSession.completed).toBe(true);
    expect(day5.hifzSession.mode).toBe("CATCH_UP");
    expect(day5.hifzSession.newAyahCount).toBe(0);
    expect(day5.streak.currentDays).toBe(1);
    expect(day6.hifzSession.completed).toBe(true);
    expect(day6.streak.currentDays).toBe(2);
    expect(day6.lanes.separated).toBe(true);
  }, 240_000);
});
