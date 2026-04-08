import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import {
  isOnboardingStartLane,
  isOnboardingStep,
  type OnboardingStartLane,
  type OnboardingStep,
} from "@/hifzer/profile/onboarding";
import { OnboardingStateError, saveOnboardingProgress } from "@/hifzer/profile/server";

type Payload = {
  step?: unknown;
  onboardingStartLane?: unknown;
};

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

  if (!isOnboardingStep(payload.step)) {
    return NextResponse.json({ error: "Invalid onboarding step." }, { status: 400 });
  }

  let onboardingStartLane: OnboardingStartLane | undefined;
  if (payload.onboardingStartLane != null) {
    if (!isOnboardingStartLane(payload.onboardingStartLane)) {
      return NextResponse.json({ error: "Invalid onboarding start lane." }, { status: 400 });
    }
    onboardingStartLane = payload.onboardingStartLane;
  }

  try {
    const profile = await saveOnboardingProgress({
      clerkUserId: userId,
      step: payload.step as OnboardingStep,
      onboardingStartLane,
    });
    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    if (error instanceof OnboardingStateError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    Sentry.captureException(error, {
      tags: { route: "/api/profile/onboarding-progress", method: "POST" },
      user: { id: userId },
    });
    return NextResponse.json({ error: "Failed to save onboarding progress." }, { status: 500 });
  }
}
