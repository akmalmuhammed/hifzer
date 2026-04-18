import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { getQuranFoundationConnectionStatus } from "@/hifzer/quran-foundation/server";
import { getQuranFoundationConnectedOverview } from "@/hifzer/quran-foundation/user-features";
import { resolveClerkUserIdForServer } from "@/hifzer/testing/request-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = await resolveClerkUserIdForServer(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const status = await getQuranFoundationConnectionStatus(userId);
    let overview = null;

    if (status.state === "connected" || status.state === "degraded") {
      try {
        overview = await getQuranFoundationConnectedOverview(userId);
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            route: "/api/quran-foundation/overview",
            phase: "connected-overview",
          },
          user: { id: userId },
          extra: { quranFoundationState: status.state },
        });
      }
    }

    return NextResponse.json({
      ok: true,
      status,
      overview,
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        route: "/api/quran-foundation/overview",
        method: "GET",
      },
      user: { id: userId },
    });
    return NextResponse.json({ error: "Failed to load Quran.com overview." }, { status: 500 });
  }
}
