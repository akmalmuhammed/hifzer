import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import {
  isOnboardingStartLane,
  type OnboardingStartLane,
} from "@/hifzer/profile/onboarding";
import { markOnboardingComplete, OnboardingStateError } from "@/hifzer/profile/server";

type Payload = {
  onboardingStartLane?: unknown;
};

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

  let onboardingStartLane: OnboardingStartLane | undefined;
  if (payload.onboardingStartLane != null) {
    if (!isOnboardingStartLane(payload.onboardingStartLane)) {
      return NextResponse.json({ error: "Invalid onboarding start lane." }, { status: 400 });
    }
    onboardingStartLane = payload.onboardingStartLane;
  }

  try {
    const profile = await markOnboardingComplete({
      clerkUserId: userId,
      onboardingStartLane,
    });
    if (!profile) {
      return NextResponse.json({
        error: "Persistence unavailable: onboarding completion could not be saved.",
      }, { status: 503 });
    }
    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    if (error instanceof OnboardingStateError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    Sentry.captureException(error, {
      tags: { route: "/api/profile/onboarding-complete", method: "POST" },
      user: { id: userId },
    });
    return NextResponse.json({ error: "Failed to complete onboarding." }, { status: 500 });
  }
}
