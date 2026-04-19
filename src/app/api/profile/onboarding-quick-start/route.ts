import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import type { PlanBias } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  DEFAULT_QURAN_TRANSLATION_ID,
  isSupportedQuranTranslationId,
  type QuranTranslationId,
} from "@/hifzer/quran/translation-prefs";
import {
  isOnboardingStartLane,
  type OnboardingStartLane,
} from "@/hifzer/profile/onboarding";
import { quickStartOnboarding } from "@/hifzer/profile/server";

type Payload = {
  dailyMinutes?: unknown;
  practiceDaysPerWeek?: unknown;
  planBias?: unknown;
  hasTeacher?: unknown;
  timezone?: unknown;
  quranTranslationId?: unknown;
  onboardingStartLane?: unknown;
};

const VALID_PLAN_BIAS = new Set<PlanBias>(["BALANCED", "RETENTION", "SPEED"]);
const DEFAULT_DAILY_MINUTES = 20;
const DEFAULT_PRACTICE_DAYS = 6;

function normalizePositiveInt(value: unknown, fallback: number, min: number, max: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.floor(numeric)));
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: Payload = {};
  try {
    payload = (await req.json()) as Payload;
  } catch {
    payload = {};
  }

  const dailyMinutes = normalizePositiveInt(payload.dailyMinutes, DEFAULT_DAILY_MINUTES, 5, 240);
  const practiceDaysPerWeek = normalizePositiveInt(payload.practiceDaysPerWeek, DEFAULT_PRACTICE_DAYS, 1, 7);
  const planBias = VALID_PLAN_BIAS.has(payload.planBias as PlanBias)
    ? (payload.planBias as PlanBias)
    : "BALANCED";
  const hasTeacher = payload.hasTeacher === true;
  const timezone =
    typeof payload.timezone === "string" && payload.timezone.trim().length > 0
      ? payload.timezone
      : "UTC";
  const quranTranslationId: QuranTranslationId =
    typeof payload.quranTranslationId === "string" && isSupportedQuranTranslationId(payload.quranTranslationId)
      ? payload.quranTranslationId
      : DEFAULT_QURAN_TRANSLATION_ID;
  const onboardingStartLane: OnboardingStartLane =
    isOnboardingStartLane(payload.onboardingStartLane) ? payload.onboardingStartLane : "hifz";

  try {
    const profile = await quickStartOnboarding({
      clerkUserId: userId,
      dailyMinutes,
      practiceDaysPerWeek,
      planBias,
      hasTeacher,
      timezone,
      quranTranslationId,
      onboardingStartLane,
    });
    if (!profile) {
      return NextResponse.json({
        error: "Persistence unavailable: onboarding could not be saved.",
      }, { status: 503 });
    }

    return NextResponse.json({
      ok: true,
      profile,
      localOnly: false,
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { route: "/api/profile/onboarding-quick-start", method: "POST" },
      user: { id: userId },
    });
    return NextResponse.json({ error: "Failed to start with defaults." }, { status: 500 });
  }
}
