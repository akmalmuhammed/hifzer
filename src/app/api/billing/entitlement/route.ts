import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db, dbConfigured } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!dbConfigured()) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const profile = await db().userProfile.findUnique({
    where: { clerkUserId: userId },
    select: {
      plan: true,
      billingEntitlements: {
        where: { status: "ACTIVE" },
        select: { kind: true },
        take: 1,
      },
    },
  });
  return NextResponse.json({
    active: profile?.plan === "PAID",
    lifetime: profile?.billingEntitlements.some((item) => item.kind === "PREMIUM_LIFETIME") ?? false,
  });
}
