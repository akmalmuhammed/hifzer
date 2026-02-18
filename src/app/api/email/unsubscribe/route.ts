import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { db, dbConfigured } from "@/lib/db";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe-token.server";

function redirectWithStatus(req: Request, status: "success" | "invalid" | "error") {
  const url = new URL(`/unsubscribe?status=${status}`, req.url);
  return NextResponse.redirect(url);
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const verified = verifyUnsubscribeToken(token);
  if (!verified.ok) {
    return redirectWithStatus(req, "invalid");
  }

  if (!dbConfigured()) {
    return redirectWithStatus(req, "error");
  }

  try {
    const prisma = db();
    await prisma.userProfile.updateMany({
      where: { clerkUserId: verified.clerkUserId },
      data: {
        emailRemindersEnabled: false,
        emailUnsubscribedAt: new Date(),
      },
    });
    return redirectWithStatus(req, "success");
  } catch (error) {
    Sentry.captureException(error, {
      tags: { route: "/api/email/unsubscribe", method: "GET" },
      extra: { clerkUserId: verified.clerkUserId },
    });
    return redirectWithStatus(req, "error");
  }
}
