import { NextResponse } from "next/server";
import { getOrCreateUserProfile } from "@/hifzer/profile/server";
import { resolveClerkUserIdForServer } from "@/hifzer/testing/request-auth";
import { db, dbConfigured } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userId = await resolveClerkUserIdForServer(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!dbConfigured()) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const profile = await getOrCreateUserProfile(userId);
  if (!profile) {
    return NextResponse.json({ error: "Profile unavailable." }, { status: 503 });
  }

  await db().userProfile.update({
    where: { id: profile.id },
    data: {
      onboardingCompletedAt: null,
      onboardingStep: "assessment",
      onboardingStartLane: null,
    },
  });

  return NextResponse.json({ ok: true });
}
