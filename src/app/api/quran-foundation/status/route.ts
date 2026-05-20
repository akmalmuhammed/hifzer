import { NextResponse } from "next/server";
import { getQuranFoundationConnectionStatus } from "@/hifzer/quran-foundation/server";
import { resolveClerkUserIdForServer } from "@/hifzer/testing/request-auth";
import { clerkEnabled } from "@/lib/clerk-config";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = clerkEnabled() ? await resolveClerkUserIdForServer(request) : null;
  const status = await getQuranFoundationConnectionStatus(userId ?? null);
  return NextResponse.json({ ok: true, status });
}
