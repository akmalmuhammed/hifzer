import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { markOnboardingComplete, OnboardingStateError } from "@/hifzer/profile/server";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profile = await markOnboardingComplete(userId);
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
