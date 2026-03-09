import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { runMonthlyAuditForUser } from "@/hifzer/engine/server";
import { isValidBearerToken } from "@/lib/timing-safe";

type Payload = {
  userId?: unknown;
};

export const runtime = "nodejs";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return false;
  }
  return isValidBearerToken(req.headers.get("authorization"), secret);
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const userId = typeof payload.userId === "string" ? payload.userId.trim() : "";
  if (!userId) {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }

  try {
    const result = await runMonthlyAuditForUser(userId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { route: "/api/jobs/monthly-audit", method: "POST" },
      user: { id: userId },
    });
    return NextResponse.json({ error: "Monthly audit failed." }, { status: 500 });
  }
}
