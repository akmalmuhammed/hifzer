import { execFileSync, execSync, spawn, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Prisma, PrismaClient } from "@prisma/client";
import { chromium } from "@playwright/test";
import { neonConfig } from "@neondatabase/serverless";
import { afterAll, describe, expect, it } from "vitest";
import ws from "ws";
import { getDashboardOverview } from "@/hifzer/dashboard/server";
import { loadTodayState } from "@/hifzer/engine/server";
import { getSurahInfo } from "@/hifzer/quran/lookup.server";
import {
  readProgressSimulationSnapshot,
  simulateProgressDayForUser,
  simulateProgressRangeForUser,
  type ProgressSimulationDayPlan,
  type ProgressSimulationGradePlan,
  type ProgressSimulationInvariantFailure,
  type ProgressSimulationRangeReport,
  type ProgressSimulationSnapshot,
} from "@/hifzer/testing/progress-simulator";
import { HIFZER_TEST_USER_HEADER } from "@/hifzer/testing/request-auth";
import { db } from "@/lib/db";
import { getCoreSchemaCapabilities } from "@/lib/db-compat";

neonConfig.webSocketConstructor = ws;
loadEnv({ path: ".env.local" });

type AuditDayKind = "normal" | "light" | "missed" | "return";

type AuditDayPlan = ProgressSimulationDayPlan & {
  kind: AuditDayKind;
  note: string;
};

type LiveAuditCheck = {
  name: string;
  passed: boolean;
  detail: string;
};

type ShadowScenarioResult = {
  name: string;
  passed: boolean;
  detail: string;
  data: Record<string, unknown>;
};

type UiVerificationResult = {
  baseUrl: string;
  authMode: "header-impersonation";
  dashboard: {
    currentStreakDays: number;
    dueNow: number;
    nextDueAt: string | null;
    cursorRef: string;
  };
  sessionToday: {
    activeSurahNumber: number;
    cursorAyahId: number;
    localDate: string;
  };
  quranPageMatched: boolean;
  hifzPageMatched: boolean;
};

type AuditTarget = {
  requestedEmailAddress: string;
  resolvedEmailAddress: string;
  clerkUserId: string;
  resolution: "email" | "clerk_user_id";
};

type RawAuditSnapshot = {
  capturedAt: string;
  clerkUserId: string;
  metrics: ProgressSimulationSnapshot;
  profile: NonNullable<Awaited<ReturnType<PrismaClient["userProfile"]["findUnique"]>>>;
  sessions: Awaited<ReturnType<PrismaClient["session"]["findMany"]>>;
  ayahAttempts: Awaited<ReturnType<PrismaClient["ayahAttempt"]["findMany"]>>;
  ayahReviews: Awaited<ReturnType<PrismaClient["ayahReview"]["findMany"]>>;
  weakTransitions: Awaited<ReturnType<PrismaClient["weakTransition"]["findMany"]>>;
  reviewEvents: Awaited<ReturnType<PrismaClient["reviewEvent"]["findMany"]>>;
  qualityGateRuns: Awaited<ReturnType<PrismaClient["qualityGateRun"]["findMany"]>>;
  quranBrowseEvents: Awaited<ReturnType<PrismaClient["quranBrowseEvent"]["findMany"]>>;
};

const LIVE_AUDIT_TIMEOUT_MS = 35 * 60 * 1000;
const DEFAULT_AUDIT_EMAIL = "akmalmuhammmed@gmail.com";
const DEFAULT_UI_PORT = 3002;
const DAY_MS = 24 * 60 * 60 * 1000;
const UI_NAVIGATION_TIMEOUT_MS = 120_000;
const NORMAL_GRADE_PLAN: ProgressSimulationGradePlan = {
  WARMUP: "GOOD",
  REVIEW: "GOOD",
  WEEKLY_TEST: "GOOD",
  LINK: "GOOD",
  LINK_REPAIR: "GOOD",
  NEW_BLIND: "EASY",
};
const LIGHT_GRADE_PLAN: ProgressSimulationGradePlan = {
  WARMUP: "HARD",
  REVIEW: "HARD",
  WEEKLY_TEST: "GOOD",
  LINK: "HARD",
  LINK_REPAIR: "HARD",
  NEW_BLIND: "GOOD",
};
const RETURN_GRADE_PLAN: ProgressSimulationGradePlan = {
  WARMUP: "GOOD",
  REVIEW: "GOOD",
  WEEKLY_TEST: "GOOD",
  LINK: "GOOD",
  LINK_REPAIR: "GOOD",
  NEW_BLIND: "GOOD",
};

function stripSchema(databaseUrl: string): string {
  const parsed = new URL(databaseUrl);
  parsed.searchParams.delete("schema");
  return parsed.toString();
}

function withSchema(databaseUrl: string, schema: string): string {
  const parsed = new URL(databaseUrl);
  parsed.searchParams.set("schema", schema);
  return parsed.toString();
}

function resolvedSchemaName(databaseUrl: string): string {
  try {
    return new URL(databaseUrl).searchParams.get("schema")?.trim() || process.env.HIFZER_DB_SCHEMA?.trim() || "public";
  } catch {
    return process.env.HIFZER_DB_SCHEMA?.trim() || "public";
  }
}

function createClient(databaseUrl: string, schema?: string): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaNeon(
      { connectionString: databaseUrl },
      schema ? { schema } : undefined,
    ),
  });
}

function vercelCommand(): string {
  return process.platform === "win32" ? "vercel.cmd" : "vercel";
}

function npmCommand(): string {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function uniqueSuffix(label: string): string {
  return `${label}_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

function simulatedDate(startAt: Date, dayOffset: number): Date {
  return new Date(startAt.getTime() + (dayOffset * DAY_MS));
}

function toNullableJsonInput(value: Prisma.JsonValue | null | undefined) {
  if (value == null) {
    return undefined;
  }
  return value as Prisma.InputJsonValue;
}

async function writeJson(filePath: string, value: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeMarkdown(filePath: string, value: string) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${value.trim()}\n`, "utf8");
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

function setActiveSchema(databaseUrl: string, schema: string) {
  process.env.DATABASE_URL = withSchema(stripSchema(databaseUrl), schema);
  process.env.HIFZER_DB_SCHEMA = schema;
  delete (globalThis as typeof globalThis & { __hifzer_prisma?: PrismaClient }).__hifzer_prisma;
}

async function refreshRuntimeSchemaCapabilities() {
  await getCoreSchemaCapabilities({ refresh: true });
}

function assertLiveAuditGuard() {
  if (process.env.AUDIT_ALLOW_LIVE_MUTATION !== "1") {
    throw new Error("AUDIT_ALLOW_LIVE_MUTATION=1 is required for the live 90-day audit.");
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for the live 90-day audit.");
  }

  const schema = resolvedSchemaName(databaseUrl);
  if (schema !== "hifzer") {
    throw new Error(`Refusing live mutation against schema "${schema}". Expected schema "hifzer".`);
  }
}

function ensureLiveAuditEnvironment() {
  if (process.env.AUDIT_LOAD_PRODUCTION_ENV === "0") {
    return;
  }

  const productionEnvPath = path.join(process.cwd(), ".env.audit.production");
  if (process.platform === "win32") {
    execSync(`vercel env pull "${productionEnvPath}" --environment=production --yes`, {
      cwd: process.cwd(),
      stdio: "ignore",
      shell: "cmd.exe",
    });
  } else {
    execFileSync(
      vercelCommand(),
      ["env", "pull", productionEnvPath, "--environment=production", "--yes"],
      {
        cwd: process.cwd(),
        stdio: "ignore",
      },
    );
  }
  loadEnv({ path: productionEnvPath, override: true });
}

function primaryEmailAddressOfUser(user: {
  emailAddresses: Array<{ id: string; emailAddress: string }>;
  primaryEmailAddressId: string | null;
}) {
  return user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)?.emailAddress
    ?? user.emailAddresses[0]?.emailAddress
    ?? null;
}

async function resolveAuditTarget(requestedEmailAddress: string): Promise<AuditTarget> {
  const explicitClerkUserId = process.env.AUDIT_TARGET_CLERK_USER_ID?.trim();
  if (explicitClerkUserId) {
    const profile = await db().userProfile.findUnique({
      where: { clerkUserId: explicitClerkUserId },
      select: { clerkUserId: true },
    });
    if (!profile) {
      throw new Error(`No user profile found for Clerk user ${explicitClerkUserId}.`);
    }
    return {
      requestedEmailAddress,
      resolvedEmailAddress: requestedEmailAddress,
      clerkUserId: profile.clerkUserId,
      resolution: "clerk_user_id",
    };
  }

  const { clerkClient } = await import("@clerk/nextjs/server");
  const clerk = await clerkClient();
  const users = await clerk.users.getUserList({
    emailAddress: [requestedEmailAddress],
  });
  const user = users.data[0];
  if (!user) {
    throw new Error(`No Clerk user found for ${requestedEmailAddress}.`);
  }

  const resolvedEmailAddress = primaryEmailAddressOfUser(user);
  if (!resolvedEmailAddress) {
    throw new Error(`Clerk user ${user.id} has no email address.`);
  }

  return {
    requestedEmailAddress,
    resolvedEmailAddress,
    clerkUserId: user.id,
    resolution: "email",
  };
}

function buildMixedRealisticDayPlans(days: number): AuditDayPlan[] {
  const plans: AuditDayPlan[] = [];
  for (let index = 0; index < days; index += 1) {
    const dayNumber = index + 1;
    const weekIndex = Math.floor(index / 7);
    const dayOfWeek = (index % 7) + 1;
    const priorKind = plans[index - 1]?.kind;
    const isGapWeek = ((weekIndex + 1) % 4) === 0;

    let kind: AuditDayKind;
    if (isGapWeek && dayOfWeek >= 5) {
      kind = "missed";
    } else if (dayOfWeek === 7) {
      kind = "missed";
    } else if (priorKind === "missed") {
      kind = "return";
    } else if (dayOfWeek === 6 || (isGapWeek && dayOfWeek === 4)) {
      kind = "light";
    } else {
      kind = "normal";
    }

    if (kind === "missed") {
      plans.push({
        dayNumber,
        kind,
        note: isGapWeek && dayOfWeek >= 5
          ? "Planned multi-day gap to verify catch-up and recovery."
          : "Planned missed day to verify grace behavior.",
        quranAyahsPerDay: 0,
        skipQuran: true,
        skipHifz: true,
      });
      continue;
    }

    if (kind === "light") {
      plans.push({
        dayNumber,
        kind,
        note: "Light practice day with passing-but-weaker recall.",
        quranAyahsPerDay: 4,
        gradePlan: LIGHT_GRADE_PLAN,
      });
      continue;
    }

    if (kind === "return") {
      plans.push({
        dayNumber,
        kind,
        note: "Return day after a planned gap with steady passing recall.",
        quranAyahsPerDay: 8,
        gradePlan: RETURN_GRADE_PLAN,
      });
      continue;
    }

    plans.push({
      dayNumber,
      kind,
      note: "Normal day with steady Qur'an reading and mostly GOOD recall.",
      quranAyahsPerDay: 8,
      gradePlan: NORMAL_GRADE_PLAN,
    });
  }
  return plans;
}

async function captureAuditSnapshot(clerkUserId: string, now: Date): Promise<RawAuditSnapshot> {
  const profile = await db().userProfile.findUnique({
    where: {
      clerkUserId,
    },
  });
  if (!profile) {
    throw new Error(`UserProfile missing for ${clerkUserId}.`);
  }

  const [
    metrics,
    sessions,
    ayahAttempts,
    ayahReviews,
    weakTransitions,
    reviewEvents,
    qualityGateRuns,
    quranBrowseEvents,
  ] = await Promise.all([
    readProgressSimulationSnapshot(clerkUserId, { now }),
    db().session.findMany({
      where: { userId: profile.id },
      orderBy: { startedAt: "asc" },
    }),
    db().ayahAttempt.findMany({
      where: { userId: profile.id },
      orderBy: { createdAt: "asc" },
    }),
    db().ayahReview.findMany({
      where: { userId: profile.id },
      orderBy: [{ ayahId: "asc" }],
    }),
    db().weakTransition.findMany({
      where: { userId: profile.id },
      orderBy: [{ fromAyahId: "asc" }, { toAyahId: "asc" }],
    }),
    db().reviewEvent.findMany({
      where: { userId: profile.id },
      orderBy: { createdAt: "asc" },
    }),
    db().qualityGateRun.findMany({
      where: { userId: profile.id },
      orderBy: { createdAt: "asc" },
    }),
    db().quranBrowseEvent.findMany({
      where: { userId: profile.id },
      orderBy: [{ localDate: "asc" }, { ayahId: "asc" }, { source: "asc" }],
    }),
  ]);

  return {
    capturedAt: now.toISOString(),
    clerkUserId,
    metrics,
    profile,
    sessions,
    ayahAttempts,
    ayahReviews,
    weakTransitions,
    reviewEvents,
    qualityGateRuns,
    quranBrowseEvents,
  };
}

async function cloneSnapshotToShadowUser(input: {
  prisma: PrismaClient;
  snapshot: RawAuditSnapshot;
  suffix: string;
}) {
  const newUserId = `shadow_user_${uniqueSuffix(input.suffix)}`;
  const clerkUserId = `shadow:${input.suffix}:${input.snapshot.clerkUserId}`;
  const sessionIdMap = new Map<string, string>();
  const nowSuffix = uniqueSuffix(input.suffix);

  await input.prisma.userProfile.create({
    data: {
      ...input.snapshot.profile,
      id: newUserId,
      clerkUserId,
      paddleCustomerId: null,
      paddleSubscriptionId: null,
      subscriptionStatus: null,
      currentPeriodEnd: null,
    },
  });

  if (input.snapshot.sessions.length) {
    await input.prisma.session.createMany({
      data: input.snapshot.sessions.map((row, index) => {
        const nextId = `shadow_session_${nowSuffix}_${index}`;
        sessionIdMap.set(row.id, nextId);
        return {
          ...row,
          id: nextId,
          userId: newUserId,
          planJson: toNullableJsonInput(row.planJson),
        };
      }),
    });
  }

  if (input.snapshot.ayahAttempts.length) {
    await input.prisma.ayahAttempt.createMany({
      data: input.snapshot.ayahAttempts.map((row, index) => ({
        ...row,
        id: `shadow_attempt_${nowSuffix}_${index}`,
        userId: newUserId,
        sessionId: sessionIdMap.get(row.sessionId) ?? row.sessionId,
      })),
    });
  }

  if (input.snapshot.ayahReviews.length) {
    await input.prisma.ayahReview.createMany({
      data: input.snapshot.ayahReviews.map((row, index) => ({
        ...row,
        id: `shadow_review_${nowSuffix}_${index}`,
        userId: newUserId,
      })),
    });
  }

  if (input.snapshot.weakTransitions.length) {
    await input.prisma.weakTransition.createMany({
      data: input.snapshot.weakTransitions.map((row, index) => ({
        ...row,
        id: `shadow_transition_${nowSuffix}_${index}`,
        userId: newUserId,
      })),
    });
  }

  if (input.snapshot.reviewEvents.length) {
    await input.prisma.reviewEvent.createMany({
      data: input.snapshot.reviewEvents.map((row, index) => ({
        ...row,
        id: `shadow_event_${nowSuffix}_${index}`,
        userId: newUserId,
        sessionId: sessionIdMap.get(row.sessionId) ?? row.sessionId,
      })),
    });
  }

  if (input.snapshot.qualityGateRuns.length) {
    await input.prisma.qualityGateRun.createMany({
      data: input.snapshot.qualityGateRuns.map((row, index) => ({
        ...row,
        id: `shadow_gate_${nowSuffix}_${index}`,
        userId: newUserId,
        detailsJson: toNullableJsonInput(row.detailsJson),
      })),
    });
  }

  if (input.snapshot.quranBrowseEvents.length) {
    await input.prisma.quranBrowseEvent.createMany({
      data: input.snapshot.quranBrowseEvents.map((row, index) => ({
        ...row,
        id: `shadow_qbe_${nowSuffix}_${index}`,
        userId: newUserId,
      })),
    });
  }

  return {
    userId: newUserId,
    clerkUserId,
  };
}

async function runWarmupFailScenario(clerkUserId: string, startAt: Date): Promise<ShadowScenarioResult> {
  let discoveryDay = 1;
  let discoveryReport: Awaited<ReturnType<typeof simulateProgressDayForUser>> | null = null;

  for (; discoveryDay <= 10; discoveryDay += 1) {
    const candidate = await simulateProgressDayForUser({
      clerkUserId,
      dayNumber: discoveryDay,
      quranAyahsPerDay: 8,
      gradePlan: NORMAL_GRADE_PLAN,
      now: simulatedDate(startAt, discoveryDay - 1),
    });
    if (candidate.hifzSession.newAyahCount > 0) {
      discoveryReport = candidate;
      break;
    }
  }

  if (!discoveryReport) {
    return {
      name: "warmup_fail",
      passed: false,
      detail: "No day unlocked new ayahs, so warmup failure could not be exercised.",
      data: {},
    };
  }

  const beforeFail = await readProgressSimulationSnapshot(clerkUserId, {
    now: simulatedDate(startAt, discoveryDay),
  });
  const failedWarmupDay = await simulateProgressDayForUser({
    clerkUserId,
    dayNumber: discoveryDay + 1,
    quranAyahsPerDay: 8,
    gradePlan: {
      ...NORMAL_GRADE_PLAN,
      WARMUP: "AGAIN",
    },
    now: simulatedDate(startAt, discoveryDay),
  });
  const afterFail = await readProgressSimulationSnapshot(clerkUserId, {
    now: simulatedDate(startAt, discoveryDay),
  });

  const passed = Boolean(
    failedWarmupDay.hifzSession.warmupRequired &&
    failedWarmupDay.hifzSession.warmupPassed === false &&
    afterFail.lanes.hifzCursorAyahId === beforeFail.lanes.hifzCursorAyahId,
  );

  return {
    name: "warmup_fail",
    passed,
    detail: passed
      ? "Warmup failure blocked new progression on the cloned user."
      : "Warmup failure did not block new progression as expected.",
    data: {
      discoveryDay,
      discoveryNewAyahs: discoveryReport.hifzSession.newAyahCount,
      failedWarmupDay: failedWarmupDay.dayNumber,
      warmupPassed: failedWarmupDay.hifzSession.warmupPassed,
      cursorBefore: beforeFail.lanes.hifzCursorAyahId,
      cursorAfter: afterFail.lanes.hifzCursorAyahId,
    },
  };
}

async function runWeeklyFailScenario(clerkUserId: string, startAt: Date): Promise<ShadowScenarioResult> {
  let currentDay = 1;
  let firstWeeklyGateDay: number | null = null;

  for (; currentDay <= 14; currentDay += 1) {
    const report = await simulateProgressDayForUser({
      clerkUserId,
      dayNumber: currentDay,
      quranAyahsPerDay: 8,
      gradePlan: NORMAL_GRADE_PLAN,
      now: simulatedDate(startAt, currentDay - 1),
    });
    if (report.hifzSession.weeklyGateRequired) {
      firstWeeklyGateDay = currentDay;
      currentDay += 1;
      break;
    }
  }

  if (!firstWeeklyGateDay) {
    return {
      name: "weekly_fail",
      passed: false,
      detail: "No weekly gate appeared during the discovery window.",
      data: {},
    };
  }

  let failedDay: Awaited<ReturnType<typeof simulateProgressDayForUser>> | null = null;
  let beforeFail: ProgressSimulationSnapshot | null = null;

  for (; currentDay <= 30; currentDay += 1) {
    const now = simulatedDate(startAt, currentDay - 1);
    beforeFail = await readProgressSimulationSnapshot(clerkUserId, { now });
    const report = await simulateProgressDayForUser({
      clerkUserId,
      dayNumber: currentDay,
      quranAyahsPerDay: 8,
      gradePlan: {
        ...NORMAL_GRADE_PLAN,
        WEEKLY_TEST: "AGAIN",
      },
      now,
    });
    if (report.hifzSession.weeklyGateRequired) {
      failedDay = report;
      break;
    }
  }

  if (!failedDay || !beforeFail) {
    return {
      name: "weekly_fail",
      passed: false,
      detail: "No follow-up weekly gate appeared for the forced failure run.",
      data: {
        firstWeeklyGateDay,
      },
    };
  }

  const afterFail = await readProgressSimulationSnapshot(clerkUserId, {
    now: simulatedDate(startAt, failedDay.dayNumber - 1),
  });
  const failedRuns = await db().qualityGateRun.findMany({
    where: {
      userId: afterFail.profile.userId,
      gateType: "WEEKLY",
      outcome: "FAIL",
    },
  });

  const passed = Boolean(
    failedDay.hifzSession.weeklyGateRequired &&
    failedDay.hifzSession.weeklyGatePassed === false &&
    afterFail.lanes.hifzCursorAyahId === beforeFail.lanes.hifzCursorAyahId &&
    failedRuns.length > 0,
  );

  return {
    name: "weekly_fail",
    passed,
    detail: passed
      ? "Weekly gate failure blocked progression and recorded a failed gate run."
      : "Weekly gate failure did not behave as expected.",
    data: {
      firstWeeklyGateDay,
      failedDay: failedDay.dayNumber,
      weeklyGatePassed: failedDay.hifzSession.weeklyGatePassed,
      cursorBefore: beforeFail.lanes.hifzCursorAyahId,
      cursorAfter: afterFail.lanes.hifzCursorAyahId,
      failedRuns: failedRuns.length,
    },
  };
}

async function runCatchUpScenario(clerkUserId: string, startAt: Date): Promise<ShadowScenarioResult> {
  const day1 = await simulateProgressDayForUser({
    clerkUserId,
    dayNumber: 1,
    quranAyahsPerDay: 8,
    gradePlan: NORMAL_GRADE_PLAN,
    now: simulatedDate(startAt, 0),
  });
  const skippedDays: Array<{ dayNumber: number; currentStreak: number }> = [];
  let prospectiveReturnSnapshot: ProgressSimulationSnapshot | null = null;
  let returnDayNumber = 5;

  for (let dayNumber = 2; dayNumber <= 8; dayNumber += 1) {
    const skippedDay = await simulateProgressDayForUser({
      clerkUserId,
      dayNumber,
      quranAyahsPerDay: 0,
      skipHifz: true,
      skipQuran: true,
      now: simulatedDate(startAt, dayNumber - 1),
    });
    skippedDays.push({
      dayNumber,
      currentStreak: skippedDay.streak.currentDays,
    });

    const nextDaySnapshot = await readProgressSimulationSnapshot(clerkUserId, {
      now: simulatedDate(startAt, dayNumber),
    });
    if (nextDaySnapshot.reviewHealth.missedDays >= 3) {
      prospectiveReturnSnapshot = nextDaySnapshot;
      returnDayNumber = dayNumber + 1;
      break;
    }
  }

  const returnDay = await simulateProgressDayForUser({
    clerkUserId,
    dayNumber: returnDayNumber,
    quranAyahsPerDay: 8,
    gradePlan: RETURN_GRADE_PLAN,
    now: simulatedDate(startAt, returnDayNumber - 1),
  });

  const passed = Boolean(
    day1.hifzSession.completed &&
    prospectiveReturnSnapshot &&
    prospectiveReturnSnapshot.reviewHealth.missedDays >= 3 &&
    returnDay.hifzSession.completed &&
    returnDay.hifzSession.mode === "CATCH_UP" &&
    returnDay.hifzSession.newAyahCount === 0
  );

  return {
    name: "catch_up",
    passed,
    detail: passed
      ? "Repeated misses pushed the shadow user into catch-up mode on return."
      : "Catch-up mode did not activate after enough scheduled misses accumulated.",
    data: {
      skippedDays,
      scheduledMissesBeforeReturn: prospectiveReturnSnapshot?.reviewHealth.missedDays ?? null,
      returnDayNumber,
      returnMode: returnDay.hifzSession.mode,
      returnNewAyahs: returnDay.hifzSession.newAyahCount,
    },
  };
}

async function runStreakScenario(clerkUserId: string, startAt: Date): Promise<ShadowScenarioResult> {
  const day1 = await simulateProgressDayForUser({
    clerkUserId,
    dayNumber: 1,
    quranAyahsPerDay: 8,
    gradePlan: NORMAL_GRADE_PLAN,
    now: simulatedDate(startAt, 0),
  });
  const day2 = await simulateProgressDayForUser({
    clerkUserId,
    dayNumber: 2,
    quranAyahsPerDay: 0,
    skipHifz: true,
    skipQuran: true,
    now: simulatedDate(startAt, 1),
  });
  const day3 = await simulateProgressDayForUser({
    clerkUserId,
    dayNumber: 3,
    quranAyahsPerDay: 0,
    skipHifz: true,
    skipQuran: true,
    now: simulatedDate(startAt, 2),
  });

  const passed = Boolean(
    day1.streak.currentDays > 0 &&
    day2.streak.currentDays === day1.streak.currentDays &&
    day3.streak.currentDays === 0,
  );

  return {
    name: "streak_break",
    passed,
    detail: passed
      ? "A one-day gap used grace, and the second consecutive miss broke the streak."
      : "Streak grace/break behavior did not match the current logic.",
    data: {
      day1CurrentStreak: day1.streak.currentDays,
      day2CurrentStreak: day2.streak.currentDays,
      day3CurrentStreak: day3.streak.currentDays,
    },
  };
}

async function runShadowAudit(input: {
  liveDatabaseUrl: string;
  snapshot: RawAuditSnapshot;
  startAt: Date;
  outputDir: string;
}) {
  const shadowSchema = `audit_shadow_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const baseDatabaseUrl = stripSchema(input.liveDatabaseUrl);
  const shadowDatabaseUrl = withSchema(baseDatabaseUrl, shadowSchema);
  const adminClient = createClient(baseDatabaseUrl);
  const shadowClient = createClient(shadowDatabaseUrl, shadowSchema);
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalSchema = process.env.HIFZER_DB_SCHEMA;

  try {
    await adminClient.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${shadowSchema}" CASCADE`);
    await adminClient.$executeRawUnsafe(`CREATE SCHEMA "${shadowSchema}"`);
    execSync("npx prisma db push --accept-data-loss --config=./prisma.config.ts", {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: shadowDatabaseUrl,
        HIFZER_DB_SCHEMA: shadowSchema,
      },
      stdio: "pipe",
    });

    const scenarioUsers = {
      warmup: await cloneSnapshotToShadowUser({
        prisma: shadowClient,
        snapshot: input.snapshot,
        suffix: "warmup",
      }),
      weekly: await cloneSnapshotToShadowUser({
        prisma: shadowClient,
        snapshot: input.snapshot,
        suffix: "weekly",
      }),
      catchUp: await cloneSnapshotToShadowUser({
        prisma: shadowClient,
        snapshot: input.snapshot,
        suffix: "catchup",
      }),
      streak: await cloneSnapshotToShadowUser({
        prisma: shadowClient,
        snapshot: input.snapshot,
        suffix: "streak",
      }),
    };

    setActiveSchema(baseDatabaseUrl, shadowSchema);
    await refreshRuntimeSchemaCapabilities();

    const results = [
      await runWarmupFailScenario(scenarioUsers.warmup.clerkUserId, input.startAt),
      await runWeeklyFailScenario(scenarioUsers.weekly.clerkUserId, input.startAt),
      await runCatchUpScenario(scenarioUsers.catchUp.clerkUserId, input.startAt),
      await runStreakScenario(scenarioUsers.streak.clerkUserId, input.startAt),
    ];

    await writeJson(path.join(input.outputDir, "shadow-report.json"), {
      shadowSchema,
      scenarioUsers,
      results,
    });

    return {
      shadowSchema,
      results,
    };
  } finally {
    if (originalDatabaseUrl) {
      process.env.DATABASE_URL = originalDatabaseUrl;
    } else {
      delete process.env.DATABASE_URL;
    }
    if (originalSchema) {
      process.env.HIFZER_DB_SCHEMA = originalSchema;
    } else {
      delete process.env.HIFZER_DB_SCHEMA;
    }
    delete (globalThis as typeof globalThis & { __hifzer_prisma?: PrismaClient }).__hifzer_prisma;
    await refreshRuntimeSchemaCapabilities();

    await shadowClient.$disconnect().catch(() => undefined);
    await adminClient.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${shadowSchema}" CASCADE`).catch(() => undefined);
    await adminClient.$disconnect().catch(() => undefined);
  }
}

function evaluateLiveAudit(input: {
  report: ProgressSimulationRangeReport;
  dayPlans: AuditDayPlan[];
  preSnapshot: RawAuditSnapshot;
  postSnapshot: RawAuditSnapshot;
}): LiveAuditCheck[] {
  const planByDay = new Map(input.dayPlans.map((plan) => [plan.dayNumber, plan]));
  const nonSkippedHifzDays = input.report.daysSummary.filter((day) => !planByDay.get(day.dayNumber)?.skipHifz);
  const weeklyGateDays = input.report.daysSummary.filter((day) => day.hifzSession.weeklyGateRequired);
  const singleMissDays = input.report.daysSummary.filter((day) => {
    const plan = planByDay.get(day.dayNumber);
    const previousPlan = planByDay.get(day.dayNumber - 1);
    return plan?.kind === "missed" && previousPlan?.kind !== "missed";
  });
  const consecutiveMissBreak = input.report.daysSummary.some((day) => {
    const plan = planByDay.get(day.dayNumber);
    const previousPlan = planByDay.get(day.dayNumber - 1);
    return plan?.kind === "missed" && previousPlan?.kind === "missed" && day.streak.currentDays === 0;
  });
  const catchUpReturnDays = input.report.daysSummary.filter((day) => planByDay.get(day.dayNumber)?.kind === "return");
  const catchUpActivated = catchUpReturnDays.some((day) => day.hifzSession.mode === "CATCH_UP");
  const catchUpExitObserved = input.report.daysSummary.some((day) => {
    const plan = planByDay.get(day.dayNumber);
    const previousPlan = planByDay.get(day.dayNumber - 1);
    return previousPlan?.kind === "return" && plan?.kind !== "missed" && day.hifzSession.mode !== "CATCH_UP";
  });
  const monthlyRunsDelta = input.postSnapshot.metrics.counts.monthlyGateRuns - input.preSnapshot.metrics.counts.monthlyGateRuns;

  return [
    {
      name: "no_invariant_failures",
      passed: input.report.invariantFailures.length === 0,
      detail: input.report.invariantFailures.length === 0
        ? "No range-level invariants failed."
        : `${input.report.invariantFailures.length} invariant failures were recorded.`,
    },
    {
      name: "non_skipped_hifz_sessions_completed",
      passed: nonSkippedHifzDays.every((day) => day.hifzSession.completed),
      detail: `${nonSkippedHifzDays.filter((day) => day.hifzSession.completed).length}/${nonSkippedHifzDays.length} non-skipped Hifz days completed.`,
    },
    {
      name: "weekly_gates_passed",
      passed: weeklyGateDays.length > 0 && weeklyGateDays.every((day) => day.hifzSession.weeklyTestStepCount > 0 && day.hifzSession.weeklyGatePassed === true),
      detail: `${weeklyGateDays.length} weekly gate days observed.`,
    },
    {
      name: "single_gap_uses_grace",
      passed: singleMissDays.some((day) => day.streak.currentDays > 0),
      detail: singleMissDays.length
        ? `Observed ${singleMissDays.length} single-gap days; at least one preserved the streak.`
        : "No single-gap day was available to validate grace behavior.",
    },
    {
      name: "consecutive_gap_breaks_streak",
      passed: consecutiveMissBreak,
      detail: consecutiveMissBreak
        ? "A consecutive missed day broke the current streak as expected."
        : "No consecutive missed day broke the current streak.",
    },
    {
      name: "catch_up_activates_on_return",
      passed: catchUpActivated,
      detail: catchUpActivated
        ? "At least one return day entered catch-up mode."
        : "No return day entered catch-up mode.",
    },
    {
      name: "catch_up_exits_after_recovery",
      passed: catchUpExitObserved,
      detail: catchUpExitObserved
        ? "Catch-up mode later returned to a non-catch-up mode."
        : "Catch-up mode never exited during the 90-day schedule.",
    },
    {
      name: "monthly_audits_recorded",
      passed: input.report.monthlyAuditRuns.length === 3 && monthlyRunsDelta === 3,
      detail: `Monthly audit runs recorded: ${input.report.monthlyAuditRuns.length}; DB delta: ${monthlyRunsDelta}.`,
    },
  ];
}

function hasCriticalInvariantFailures(failures: ProgressSimulationInvariantFailure[]): boolean {
  return failures.some((failure) => failure.severity === "error");
}

async function isReachable(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(baseUrl, { redirect: "manual" });
    return response.status > 0;
  } catch {
    return false;
  }
}

async function waitForBaseUrl(baseUrl: string, timeoutMs = 180_000) {
  const startedAt = Date.now();
  while ((Date.now() - startedAt) < timeoutMs) {
    if (await isReachable(baseUrl)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
  throw new Error(`Timed out waiting for ${baseUrl}.`);
}

async function ensureLocalUiServer(outputDir: string) {
  const baseUrl = process.env.AUDIT_UI_BASE_URL?.trim() || `http://127.0.0.1:${DEFAULT_UI_PORT}`;
  const parsedBaseUrl = new URL(baseUrl);
  const port = Number(parsedBaseUrl.port || (parsedBaseUrl.protocol === "https:" ? "443" : "80"));
  if (await isReachable(baseUrl)) {
    return {
      baseUrl,
      process: null as ChildProcess | null,
      startedByAudit: false,
    };
  }

  const stdoutPath = path.join(outputDir, "local-ui.stdout.log");
  const stderrPath = path.join(outputDir, "local-ui.stderr.log");
  await mkdir(path.dirname(stdoutPath), { recursive: true });
  const stdout = createWriteStream(stdoutPath, { flags: "w" });
  const stderr = createWriteStream(stderrPath, { flags: "w" });

  const child = process.platform === "win32"
    ? spawn(
      "cmd.exe",
      [
        "/d",
        "/s",
        "/c",
        `${npmCommand()} run dev -- --hostname ${parsedBaseUrl.hostname} --port ${port}`,
      ],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          HIFZER_ALLOW_TEST_TIME_TRAVEL: "1",
          HIFZER_ALLOW_TEST_AUTH_IMPERSONATION: "1",
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    )
    : spawn(
      npmCommand(),
      ["run", "dev", "--", "--hostname", parsedBaseUrl.hostname, "--port", String(port)],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          HIFZER_ALLOW_TEST_TIME_TRAVEL: "1",
          HIFZER_ALLOW_TEST_AUTH_IMPERSONATION: "1",
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
  child.stdout?.pipe(stdout);
  child.stderr?.pipe(stderr);

  try {
    await waitForBaseUrl(baseUrl);
  } catch (error) {
    if (child.pid) {
      if (process.platform === "win32") {
        execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: "ignore" });
      } else {
        child.kill("SIGTERM");
      }
    }
    throw error;
  }

  return {
    baseUrl,
    process: child,
    startedByAudit: true,
  };
}

async function stopLocalUiServer(server: { process: ChildProcess | null; startedByAudit: boolean }) {
  if (!server.startedByAudit || !server.process?.pid) {
    return;
  }
  try {
    if (process.platform === "win32") {
      execSync(`taskkill /pid ${server.process.pid} /T /F`, { stdio: "ignore" });
    } else {
      server.process.kill("SIGTERM");
    }
  } catch {
    server.process.kill();
  }
}

async function runUiVerification(input: {
  baseUrl: string;
  clerkUserId: string;
  finalNow: Date;
  expectedQuranSurahNumber: number;
  expectedQuranCursorAyahId: number;
  expectedDashboard: NonNullable<Awaited<ReturnType<typeof getDashboardOverview>>>;
  expectedTodayState: Awaited<ReturnType<typeof loadTodayState>>;
}) {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      extraHTTPHeaders: {
        "x-hifzer-test-now": input.finalNow.toISOString(),
        [HIFZER_TEST_USER_HEADER]: input.clerkUserId,
      },
    });
    const page = await context.newPage();

    await page.goto(`${input.baseUrl}/dashboard`, {
      waitUntil: "networkidle",
      timeout: UI_NAVIGATION_TIMEOUT_MS,
    });
    const dashboardPayload = await page.evaluate(async () => {
      const res = await fetch("/api/dashboard/overview", { cache: "no-store" });
      return res.json();
    }) as { ok?: boolean; overview?: Awaited<ReturnType<typeof getDashboardOverview>> };

    expect(dashboardPayload.ok).toBe(true);
    expect(dashboardPayload.overview).toBeTruthy();
    expect(dashboardPayload.overview?.streak.currentStreakDays).toBe(input.expectedDashboard.streak.currentStreakDays);
    expect(dashboardPayload.overview?.reviewHealth.dueNow).toBe(input.expectedDashboard.reviewHealth.dueNow);
    expect(dashboardPayload.overview?.reviewHealth.nextDueAt).toBe(input.expectedDashboard.reviewHealth.nextDueAt);
    expect(dashboardPayload.overview?.quran.cursorRef).toBe(input.expectedDashboard.quran.cursorRef);

    const dashboardText = await page.locator("body").textContent() ?? "";
    expect(dashboardText.includes(`${input.expectedDashboard.streak.currentStreakDays}d`)).toBe(true);
    expect(dashboardText.includes(input.expectedDashboard.quran.cursorRef)).toBe(true);
    expect(dashboardText.includes("Due now")).toBe(true);

    const todayPayload = await page.evaluate(async () => {
      const res = await fetch("/api/session/today", { cache: "no-store" });
      return res.json();
    }) as {
      ok?: boolean;
      localDate?: string;
      profile?: {
        activeSurahNumber: number;
        cursorAyahId: number;
      };
    };

    expect(todayPayload.ok).toBe(true);
    expect(todayPayload.profile?.activeSurahNumber).toBe(input.expectedTodayState.profile.activeSurahNumber);
    expect(todayPayload.profile?.cursorAyahId).toBe(input.expectedTodayState.profile.cursorAyahId);
    expect(todayPayload.localDate).toBe(input.expectedTodayState.state.localDate);

    await page.goto(
      `${input.baseUrl}/quran/read?view=compact&surah=${input.expectedQuranSurahNumber}&cursor=${input.expectedQuranCursorAyahId}`,
      {
      waitUntil: "networkidle",
      timeout: UI_NAVIGATION_TIMEOUT_MS,
      },
    );
    const quranText = await page.locator("body").textContent() ?? "";
    const quranPageMatched =
      page.url().includes("/quran/read") &&
      page.url().includes(`cursor=${input.expectedQuranCursorAyahId}`) &&
      !quranText.includes("Internal Server Error") &&
      !quranText.includes("Sign in.");
    expect(quranPageMatched).toBe(true);

    await page.goto(`${input.baseUrl}/hifz/progress`, {
      waitUntil: "networkidle",
      timeout: UI_NAVIGATION_TIMEOUT_MS,
    });
    const hifzText = await page.locator("body").textContent() ?? "";
    const currentSurahInfo = getSurahInfo(input.expectedTodayState.profile.activeSurahNumber);
    const hifzPageMatched = currentSurahInfo
      ? hifzText.includes(currentSurahInfo.nameTransliteration)
      : hifzText.includes(`Surah ${input.expectedTodayState.profile.activeSurahNumber}`);
    expect(hifzPageMatched).toBe(true);

    return {
      baseUrl: input.baseUrl,
      authMode: "header-impersonation",
      dashboard: {
        currentStreakDays: dashboardPayload.overview!.streak.currentStreakDays,
        dueNow: dashboardPayload.overview!.reviewHealth.dueNow,
        nextDueAt: dashboardPayload.overview!.reviewHealth.nextDueAt,
        cursorRef: dashboardPayload.overview!.quran.cursorRef,
      },
      sessionToday: {
        activeSurahNumber: todayPayload.profile!.activeSurahNumber,
        cursorAyahId: todayPayload.profile!.cursorAyahId,
        localDate: todayPayload.localDate!,
      },
      quranPageMatched,
      hifzPageMatched,
    } satisfies UiVerificationResult;
  } finally {
    await browser.close();
  }
}

async function loadPersistedLiveAuditArtifacts(outputDir: string) {
  const [
    dayPlans,
    preSnapshot,
    postSnapshot,
    liveReport,
  ] = await Promise.all([
    readJsonFile<AuditDayPlan[]>(path.join(outputDir, "day-plans.json")),
    readJsonFile<RawAuditSnapshot>(path.join(outputDir, "pre-run-snapshot.json")),
    readJsonFile<RawAuditSnapshot>(path.join(outputDir, "post-run-snapshot.json")),
    readJsonFile<ProgressSimulationRangeReport>(path.join(outputDir, "day-by-day-report.json")),
  ]);

  return {
    dayPlans,
    preSnapshot,
    postSnapshot,
    liveReport,
    startAt: new Date(liveReport.startAt),
    finalNow: new Date(postSnapshot.capturedAt),
  };
}

function buildSummaryMarkdown(input: {
  target: AuditTarget;
  outputDir: string;
  liveChecks: LiveAuditCheck[];
  shadowResults: ShadowScenarioResult[];
  uiResult: UiVerificationResult;
  liveReport: ProgressSimulationRangeReport;
}) {
  const livePassed = input.liveChecks.every((check) => check.passed);
  const shadowPassed = input.shadowResults.every((result) => result.passed);
  const overallPassed = livePassed && shadowPassed;

  const liveLines = input.liveChecks
    .map((check) => `- ${check.passed ? "PASS" : "FAIL"} ${check.name}: ${check.detail}`)
    .join("\n");
  const shadowLines = input.shadowResults
    .map((result) => `- ${result.passed ? "PASS" : "FAIL"} ${result.name}: ${result.detail}`)
    .join("\n");

  return `
# 90-Day Live Hifz Audit

- Requested email: ${input.target.requestedEmailAddress}
- Resolved email: ${input.target.resolvedEmailAddress}
- Clerk user: ${input.target.clerkUserId}
- Target resolution: ${input.target.resolution}
- Overall result: ${overallPassed ? "PASS" : "FAIL"}
- Live audit result: ${livePassed ? "PASS" : "FAIL"}
- Shadow audit result: ${shadowPassed ? "PASS" : "FAIL"}
- UI verification base URL: ${input.uiResult.baseUrl}
- Artifacts: ${input.outputDir}

## Live Checks
${liveLines}

## Shadow Checks
${shadowLines}

## UI Verification
- Dashboard streak: ${input.uiResult.dashboard.currentStreakDays}d
- Dashboard due now: ${input.uiResult.dashboard.dueNow}
- Dashboard cursor ref: ${input.uiResult.dashboard.cursorRef}
- Session today local date: ${input.uiResult.sessionToday.localDate}
- Quran page matched: ${input.uiResult.quranPageMatched}
- Hifz page matched: ${input.uiResult.hifzPageMatched}

## Invariants
- Total invariant failures: ${input.liveReport.invariantFailures.length}
`;
}

const describeIfLiveAudit = process.env.AUDIT_ALLOW_LIVE_MUTATION === "1" ? describe : describe.skip;

describeIfLiveAudit("live 90-day hifz audit", () => {
  afterAll(async () => {
    const cachedClient = (globalThis as typeof globalThis & { __hifzer_prisma?: PrismaClient }).__hifzer_prisma;
    if (cachedClient) {
      await cachedClient.$disconnect().catch(() => undefined);
      delete (globalThis as typeof globalThis & { __hifzer_prisma?: PrismaClient }).__hifzer_prisma;
    }
  });

  it("runs the live Akmal audit, shadow edge-case audit, and signed-in UI verification", async () => {
    ensureLiveAuditEnvironment();
    assertLiveAuditGuard();

    const requestedEmailAddress = process.env.AUDIT_TARGET_EMAIL?.trim() || DEFAULT_AUDIT_EMAIL;
    const target = await resolveAuditTarget(requestedEmailAddress);
    const liveDatabaseUrl = process.env.DATABASE_URL!;
    const resumeDir = process.env.AUDIT_RESUME_DIR?.trim();
    let startAt: Date;
    let finalNow: Date;
    let outputDir: string;
    let auditPlans: AuditDayPlan[];
    let preSnapshot: RawAuditSnapshot;
    let postSnapshot: RawAuditSnapshot;
    let liveReport: ProgressSimulationRangeReport;

    if (resumeDir) {
      outputDir = path.resolve(process.cwd(), resumeDir);
      ({
        dayPlans: auditPlans,
        preSnapshot,
        postSnapshot,
        liveReport,
        startAt,
        finalNow,
      } = await loadPersistedLiveAuditArtifacts(outputDir));
    } else {
      startAt = new Date();
      finalNow = simulatedDate(startAt, 89);
      const outputLabel = `${target.resolvedEmailAddress.replace(/[^a-z0-9]+/gi, "_").toLowerCase()}-${target.clerkUserId.slice(-8)}`;
      outputDir = path.join(
        process.cwd(),
        "output",
        "hifz-audits",
        `${startAt.toISOString().replace(/[:.]/g, "-")}-${outputLabel}`,
      );
      await mkdir(outputDir, { recursive: true });

      auditPlans = buildMixedRealisticDayPlans(90);
      preSnapshot = await captureAuditSnapshot(target.clerkUserId, startAt);
      await writeJson(path.join(outputDir, "pre-run-snapshot.json"), preSnapshot);
      await writeJson(path.join(outputDir, "day-plans.json"), auditPlans);

      liveReport = await simulateProgressRangeForUser({
        clerkUserId: target.clerkUserId,
        days: 90,
        startAt,
        continueExistingState: true,
        timezone: preSnapshot.metrics.profile.timezone,
        defaultQuranAyahsPerDay: 8,
        dayPlans: auditPlans,
        monthlyAuditDays: [30, 60, 90],
      });
      await writeJson(path.join(outputDir, "day-by-day-report.json"), liveReport);

      postSnapshot = await captureAuditSnapshot(target.clerkUserId, finalNow);
      await writeJson(path.join(outputDir, "post-run-snapshot.json"), postSnapshot);
    }

    const liveChecks = evaluateLiveAudit({
      report: liveReport,
      dayPlans: auditPlans,
      preSnapshot,
      postSnapshot,
    });
    await writeJson(path.join(outputDir, "live-checks.json"), liveChecks);
    const liveInvariantFailures = hasCriticalInvariantFailures(liveReport.invariantFailures);
    const liveCheckFailures = liveChecks.filter((check) => !check.passed);

    const expectedDashboard = await getDashboardOverview(target.clerkUserId, { now: finalNow });
    if (!expectedDashboard) {
      throw new Error("Dashboard overview returned null for the live audit user.");
    }
    const expectedTodayState = await loadTodayState(target.clerkUserId, { now: finalNow });

    const localUi = await ensureLocalUiServer(outputDir);
    let uiResult: UiVerificationResult;
    try {
      uiResult = await runUiVerification({
        baseUrl: localUi.baseUrl,
        clerkUserId: target.clerkUserId,
        finalNow,
        expectedQuranSurahNumber: postSnapshot.metrics.profile.quranActiveSurahNumber,
        expectedQuranCursorAyahId: postSnapshot.metrics.profile.quranCursorAyahId,
        expectedDashboard,
        expectedTodayState,
      });
    } finally {
      await stopLocalUiServer(localUi);
    }
    await writeJson(path.join(outputDir, "ui-verification.json"), uiResult);

    const shadowAudit = await runShadowAudit({
      liveDatabaseUrl,
      snapshot: preSnapshot,
      startAt,
      outputDir,
    });
    const shadowFailures = shadowAudit.results.filter((result) => !result.passed);

    const summary = buildSummaryMarkdown({
      target,
      outputDir,
      liveChecks,
      shadowResults: shadowAudit.results,
      uiResult,
      liveReport,
    });
    await writeMarkdown(path.join(outputDir, "summary.md"), summary);

    expect(liveInvariantFailures).toBe(false);
    expect(liveCheckFailures.length).toBe(0);
    expect(shadowFailures.length).toBe(0);
  }, LIVE_AUDIT_TIMEOUT_MS);
});
