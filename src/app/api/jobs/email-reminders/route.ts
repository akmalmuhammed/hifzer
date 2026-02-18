import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { emailConfig } from "@/lib/email/config.server";
import { runReminderScheduler } from "@/lib/email/reminder-scheduler.server";

export const runtime = "nodejs";

function authorized(req: Request): boolean {
  const header = req.headers.get("authorization");
  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    return false;
  }
  const token = header.slice(7).trim();
  if (!token) {
    return false;
  }
  return token === emailConfig().cronSecret;
}

async function handleCron(req: Request, method: "GET" | "POST") {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runReminderScheduler(new Date());
    return NextResponse.json({
      ok: true,
      ...summary,
      provider: "resend",
      template: "daily_practice_reminder",
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        route: "/api/jobs/email-reminders",
        method,
        provider: "resend",
        template: "daily_practice_reminder",
      },
    });
    const message = error instanceof Error ? error.message : "Reminder scheduler failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return handleCron(req, "GET");
}

export async function POST(req: Request) {
  return handleCron(req, "POST");
}
