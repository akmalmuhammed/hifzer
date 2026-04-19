import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { getCachedDashboardOverview, getDashboardOverview } from "@/hifzer/dashboard/server";
import { resolveClerkUserIdForServer } from "@/hifzer/testing/request-auth";
import { resolveAuditNowFromRequestHeader } from "@/hifzer/testing/request-now";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = await resolveClerkUserIdForServer(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const auditNow = resolveAuditNowFromRequestHeader(request);

  try {
    const overview = auditNow
      ? await getDashboardOverview(userId, { now: auditNow })
      : await getCachedDashboardOverview(userId);
    if (!overview) {
      return NextResponse.json({ error: "Database not configured." }, { status: 503 });
    }
    return NextResponse.json({
      ok: true,
      overview,
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        route: "/api/dashboard/overview",
        method: "GET",
      },
      user: { id: userId },
    });
    return NextResponse.json({ error: "Failed to load dashboard overview." }, { status: 500 });
  }
}
