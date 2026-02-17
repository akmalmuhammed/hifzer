import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getOrCreateUserProfile } from "@/hifzer/profile/server";
import { appPublicUrl, paddlePaidPriceId } from "@/lib/paddle.server";

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
  if (profile.plan === "PAID") {
    return NextResponse.json({ error: "You are already on the paid plan." }, { status: 409 });
  }

  let priceId: string;
  try {
    priceId = paddlePaidPriceId();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Paddle is not configured.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    null;

  return NextResponse.json({
    priceId,
    successUrl: new URL("/billing/success", appPublicUrl()).toString(),
    customerEmail: email,
    customData: {
      clerk_user_id: userId,
    },
  });
}

