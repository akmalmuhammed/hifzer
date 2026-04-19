import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import type { PlanBias } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  isSupportedQuranTranslationId,
  type QuranTranslationId,
} from "@/hifzer/quran/translation-prefs";
import {
  isOnboardingStartLane,
  type OnboardingStartLane,
} from "@/hifzer/profile/onboarding";
import { saveAssessment } from "@/hifzer/profile/server";

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

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const dailyMinutes = Number(payload.dailyMinutes);
  const practiceDaysPerWeek = Number(payload.practiceDaysPerWeek);
  const planBias = String(payload.planBias ?? "BALANCED") as PlanBias;
  const hasTeacher = Boolean(payload.hasTeacher);
  const timezone = String(payload.timezone ?? "UTC");
  const quranTranslationIdRaw = payload.quranTranslationId;
  const onboardingStartLaneRaw = payload.onboardingStartLane;
  let quranTranslationId: QuranTranslationId | undefined;
  let onboardingStartLane: OnboardingStartLane | undefined;

  if (!Number.isFinite(dailyMinutes) || dailyMinutes < 5) {
    return NextResponse.json({ error: "dailyMinutes must be a number >= 5." }, { status: 400 });
  }
  if (!Number.isFinite(practiceDaysPerWeek) || practiceDaysPerWeek < 1 || practiceDaysPerWeek > 7) {
    return NextResponse.json({ error: "practiceDaysPerWeek must be between 1 and 7." }, { status: 400 });
  }
  if (!VALID_PLAN_BIAS.has(planBias)) {
    return NextResponse.json({ error: "Invalid planBias." }, { status: 400 });
  }
  if (quranTranslationIdRaw != null) {
    if (typeof quranTranslationIdRaw !== "string" || !isSupportedQuranTranslationId(quranTranslationIdRaw)) {
      return NextResponse.json({ error: "Invalid quranTranslationId." }, { status: 400 });
    }
    quranTranslationId = quranTranslationIdRaw;
  }
  if (onboardingStartLaneRaw != null) {
    if (!isOnboardingStartLane(onboardingStartLaneRaw)) {
      return NextResponse.json({ error: "Invalid onboardingStartLane." }, { status: 400 });
    }
    onboardingStartLane = onboardingStartLaneRaw;
  }

  try {
    const profile = await saveAssessment({
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
        error: "Persistence unavailable: onboarding setup could not be saved.",
      }, { status: 503 });
    }
    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { route: "/api/profile/assessment", method: "POST" },
      user: { id: userId },
    });
    return NextResponse.json({ error: "Failed to save assessment." }, { status: 500 });
  }
}
