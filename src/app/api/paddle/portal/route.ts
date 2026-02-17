import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getOrCreateUserProfile } from "@/hifzer/profile/server";
import { paddleClient, paddleConfigured } from "@/lib/paddle.server";

export const runtime = "nodejs";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getOrCreateUserProfile(userId);
  if (!profile) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }
  if (!profile.paddleCustomerId) {
    return NextResponse.json({ error: "No Paddle customer is linked yet." }, { status: 409 });
  }
  if (!paddleConfigured()) {
    return NextResponse.json({ error: "Paddle API key is not configured." }, { status: 500 });
  }

  try {
    const subscriptions = profile.paddleSubscriptionId ? [profile.paddleSubscriptionId] : [];
    const session = await paddleClient().customerPortalSessions.create(profile.paddleCustomerId, subscriptions);
    return NextResponse.json({
      portalUrl: session.urls.general.overview,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create customer portal session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

