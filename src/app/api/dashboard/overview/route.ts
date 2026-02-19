import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { getDashboardOverview } from "@/hifzer/dashboard/server";

export const runtime = "nodejs";

function makeCachedDashboardOverview(clerkUserId: string) {
  return unstable_cache(
    async () => getDashboardOverview(clerkUserId),
    // Cache key is user-scoped to prevent cross-user cache contamination
    [`dashboard-overview:${clerkUserId}`],
    {
      revalidate: 120,
      tags: [`dashboard-overview:${clerkUserId}`],
    },
  );
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const overview = await makeCachedDashboardOverview(userId)();
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
