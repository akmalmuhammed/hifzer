import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { disconnectQuranFoundationConnection } from "@/hifzer/quran-foundation/server";

export const runtime = "nodejs";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await disconnectQuranFoundationConnection(userId);
  return NextResponse.json({ ok: true });
}
