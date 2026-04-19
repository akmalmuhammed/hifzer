import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import {
  getCachedDashboardActivity,
  getCachedDashboardDetails,
  getCachedDashboardOverview,
  getCachedDashboardQuranDetails,
  getCachedDashboardStreakDetails,
  getCachedDashboardSummary,
  getDashboardActivity,
  getDashboardDetails,
  getDashboardOverview,
  getDashboardQuranDetails,
  getDashboardStreakDetails,
  getDashboardSummary,
} from "@/hifzer/dashboard/server";
import { resolveClerkUserIdForServer } from "@/hifzer/testing/request-auth";
import { resolveAuditNowFromRequestHeader } from "@/hifzer/testing/request-now";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = await resolveClerkUserIdForServer(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const auditNow = resolveAuditNowFromRequestHeader(request);
  const requestedView = new URL(request.url).searchParams.get("view");
  const view = requestedView === "summary" ||
    requestedView === "details" ||
    requestedView === "streak" ||
    requestedView === "quran" ||
    requestedView === "activity"
    ? requestedView
    : "full";

  try {
    const payload = view === "summary"
      ? (auditNow
          ? await getDashboardSummary(userId, { now: auditNow })
          : await getCachedDashboardSummary(userId))
      : view === "details"
        ? (auditNow
            ? await getDashboardDetails(userId, { now: auditNow })
            : await getCachedDashboardDetails(userId))
        : view === "streak"
          ? (auditNow
              ? await getDashboardStreakDetails(userId, { now: auditNow })
              : await getCachedDashboardStreakDetails(userId))
          : view === "quran"
            ? (auditNow
                ? await getDashboardQuranDetails(userId, { now: auditNow })
                : await getCachedDashboardQuranDetails(userId))
            : view === "activity"
              ? (auditNow
                  ? await getDashboardActivity(userId, { now: auditNow })
                  : await getCachedDashboardActivity(userId))
              : (auditNow
                  ? await getDashboardOverview(userId, { now: auditNow })
                  : await getCachedDashboardOverview(userId));
    if (!payload) {
      return NextResponse.json({ error: "Database not configured." }, { status: 503 });
    }
    return view === "summary"
      ? NextResponse.json({
          ok: true,
          summary: payload,
        })
      : view === "details"
        ? NextResponse.json({
            ok: true,
            details: payload,
          })
        : view === "streak"
          ? NextResponse.json({
              ok: true,
              streak: payload,
            })
          : view === "quran"
            ? NextResponse.json({
                ok: true,
                quran: payload,
              })
            : view === "activity"
              ? NextResponse.json({
                  ok: true,
                  activity: payload,
                })
      : NextResponse.json({
          ok: true,
          overview: payload,
        });
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        route: "/api/dashboard/overview",
        method: "GET",
        view,
      },
      user: { id: userId },
    });
    return NextResponse.json({ error: "Failed to load dashboard overview." }, { status: 500 });
  }
}
