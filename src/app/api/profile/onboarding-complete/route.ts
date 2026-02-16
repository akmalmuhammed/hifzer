import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { markOnboardingComplete } from "@/hifzer/profile/server";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await markOnboardingComplete(userId);
  return NextResponse.json({ ok: true, profile });
}

