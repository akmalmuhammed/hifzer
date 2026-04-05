import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getQuranFoundationConnectionStatus } from "@/hifzer/quran-foundation/server";

export const runtime = "nodejs";

export async function GET() {
  const { userId } = await auth();
  const status = await getQuranFoundationConnectionStatus(userId ?? null);
  return NextResponse.json({ ok: true, status });
}
